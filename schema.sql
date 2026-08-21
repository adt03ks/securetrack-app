-- SecureTrack prototype database for Supabase/Postgres.
-- Run in Supabase SQL Editor. Review security with your organization before production use.

create extension if not exists pgcrypto;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text not null unique,
  badge_hash text not null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique,
  asset_code text not null unique,
  device_type text not null,
  manufacturer text,
  model text,
  serial_last4 text,
  image_url text,
  status text not null default 'available' check (status in ('available','checked_out','maintenance','retired')),
  current_custodian_id uuid references public.employees(id),
  attention_required boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.device_transactions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id),
  employee_id uuid not null references public.employees(id),
  action text not null check (action in ('checkout','return','transfer')),
  notes text,
  occurred_at timestamptz not null default now()
);

create table if not exists public.device_inspections (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id),
  employee_id uuid not null references public.employees(id),
  checklist jsonb not null default '{}'::jsonb,
  overall_result text not null check (overall_result in ('pass','fail','not_applicable')),
  notes text,
  occurred_at timestamptz not null default now()
);

create table if not exists public.device_issues (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id),
  employee_id uuid not null references public.employees(id),
  category text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  description text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved')),
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Do not let the public browser read/write these tables directly.
alter table public.employees enable row level security;
alter table public.devices enable row level security;
alter table public.device_transactions enable row level security;
alter table public.device_inspections enable row level security;
alter table public.device_issues enable row level security;

revoke all on public.employees, public.devices, public.device_transactions, public.device_inspections, public.device_issues from anon, authenticated;

-- Public device lookup by an opaque tag token. Returns only non-sensitive display fields.
create or replace function public.get_device_public(p_public_token text)
returns table (
  public_token text,
  asset_code text,
  device_type text,
  manufacturer text,
  model text,
  serial_last4 text,
  image_url text,
  status text,
  attention_required boolean
)
language sql
security definer
set search_path = public
as $$
  select d.public_token, d.asset_code, d.device_type, d.manufacturer, d.model,
         d.serial_last4, d.image_url, d.status, d.attention_required
  from public.devices d
  where d.public_token = p_public_token and d.is_active = true
  limit 1;
$$;

-- Internal credential resolver used only from SECURITY DEFINER functions.
create or replace function public._resolve_employee(p_employee_number text, p_badge_number text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  select e.id into v_id
  from public.employees e
  where e.employee_number = p_employee_number
    and e.is_active = true
    and e.badge_hash = crypt(p_badge_number, e.badge_hash)
  limit 1;
  if v_id is null then raise exception 'Employee or badge number is invalid'; end if;
  return v_id;
end;
$$;
revoke all on function public._resolve_employee(text,text) from public, anon, authenticated;

create or replace function public.checkout_device(
  p_public_token text,
  p_employee_number text,
  p_badge_number text,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee uuid;
  v_employee_name text;
  v_device uuid;
  v_asset_code text;
  v_now timestamptz := now();
begin
  v_employee := public._resolve_employee(p_employee_number, p_badge_number);
  select display_name into v_employee_name from public.employees where id = v_employee;

  select d.id, d.asset_code into v_device, v_asset_code
  from public.devices d
  where d.public_token = p_public_token and d.is_active = true
  for update;

  if v_device is null then raise exception 'Device not found or inactive'; end if;
  if (select status from public.devices where id=v_device) <> 'available' then
    raise exception 'Device is not currently available for checkout';
  end if;

  update public.devices set status='checked_out', current_custodian_id=v_employee where id=v_device;
  insert into public.device_transactions(device_id, employee_id, action, notes, occurred_at)
  values(v_device, v_employee, 'checkout', nullif(trim(p_notes),''), v_now);

  return jsonb_build_object('ok',true,'asset_code',v_asset_code,'employee_name',v_employee_name,'occurred_at',v_now);
end;
$$;

create or replace function public.record_device_inspection(
  p_public_token text,
  p_employee_number text,
  p_badge_number text,
  p_checklist jsonb,
  p_overall_result text,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_employee uuid; v_device uuid; v_id uuid; v_now timestamptz := now();
begin
  if p_overall_result not in ('pass','fail','not_applicable') then raise exception 'Invalid inspection result'; end if;
  v_employee := public._resolve_employee(p_employee_number, p_badge_number);
  select id into v_device from public.devices where public_token=p_public_token and is_active=true;
  if v_device is null then raise exception 'Device not found or inactive'; end if;

  insert into public.device_inspections(device_id,employee_id,checklist,overall_result,notes,occurred_at)
  values(v_device,v_employee,coalesce(p_checklist,'{}'::jsonb),p_overall_result,nullif(trim(p_notes),''),v_now)
  returning id into v_id;

  return jsonb_build_object('ok',true,'inspection_id',v_id,'overall_result',p_overall_result,'occurred_at',v_now);
end;
$$;

create or replace function public.report_device_issue(
  p_public_token text,
  p_employee_number text,
  p_badge_number text,
  p_category text,
  p_severity text,
  p_description text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_employee uuid; v_device uuid; v_id uuid; v_now timestamptz := now();
begin
  if p_severity not in ('low','medium','high','critical') then raise exception 'Invalid severity'; end if;
  if length(trim(coalesce(p_description,''))) < 5 then raise exception 'Please provide a description'; end if;
  v_employee := public._resolve_employee(p_employee_number, p_badge_number);
  select id into v_device from public.devices where public_token=p_public_token and is_active=true;
  if v_device is null then raise exception 'Device not found or inactive'; end if;

  insert into public.device_issues(device_id,employee_id,category,severity,description,occurred_at)
  values(v_device,v_employee,p_category,p_severity,trim(p_description),v_now)
  returning id into v_id;

  update public.devices set attention_required=true where id=v_device;
  return jsonb_build_object('ok',true,'issue_id',v_id,'issue_reference',upper(left(v_id::text,8)),'occurred_at',v_now);
end;
$$;

-- Only the intended public RPC functions are callable from a browser using the anon key.
revoke all on function public.get_device_public(text) from public;
revoke all on function public.checkout_device(text,text,text,text) from public;
revoke all on function public.record_device_inspection(text,text,text,jsonb,text,text) from public;
revoke all on function public.report_device_issue(text,text,text,text,text,text) from public;

grant execute on function public.get_device_public(text) to anon, authenticated;
grant execute on function public.checkout_device(text,text,text,text) to anon, authenticated;
grant execute on function public.record_device_inspection(text,text,text,jsonb,text,text) to anon, authenticated;
grant execute on function public.report_device_issue(text,text,text,text,text,text) to anon, authenticated;

-- DEMO SEED. Replace this employee and device before production.
insert into public.employees(employee_number,badge_hash,display_name)
values ('100247', crypt('842193', gen_salt('bf')), 'Demo Officer')
on conflict (employee_number) do nothing;

insert into public.devices(public_token,asset_code,device_type,manufacturer,model,serial_last4,image_url)
values ('DEMO-CEW-014','CEW-014','Conducted Energy Weapon','Axon','TASER 7','4821',null)
on conflict (public_token) do nothing;
