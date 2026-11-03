(async () => {
 'use strict';
 const $ = id => document.getElementById(id);
 const STM = window.SecureTrackManager;
 // Existing manager helper is used only for its DB client; authorization is enforced by Supabase RPC.
 const db = STM?.db || window.SECURETRACK_DB;
 const selected = new Set();
 let context = null;
 const message = (s, error=false) => { $('seaMessage').textContent=s; $('seaMessage').classList.toggle('sea-error',error); };
 const rpc = async (name,args={}) => { const {data,error}=await db.rpc(name,args); if(error) throw error; return data; };
 const option = (value,label) => { const el=document.createElement('option'); el.value=value; el.textContent=label; return el; };
 const cell = (tr,value) => { const td=document.createElement('td'); td.textContent=String(value??'—'); tr.appendChild(td); };
 const update = () => { $('seaSelected').textContent=`${selected.size} selected`; const officer=$('seaOfficer').selectedOptions[0]?.textContent || 'None'; $('seaSummary').textContent=`Officer: ${officer} · ${selected.size} equipment item(s)`; $('seaAssign').disabled=!context || !$('seaOfficer').value || !selected.size; };
 function render(){
  selected.clear(); const officers=$('seaOfficer'); officers.replaceChildren(option('','Choose an on-duty officer'));
  (context.officers||[]).forEach(o=>officers.appendChild(option(o.user_id,o.name)));
  officers.disabled=false;
  const parent=$('seaCategories'); parent.replaceChildren();
  for(const category of context.categories||[]){
   const items=(context.devices||[]).filter(d=>d.category_id===category.id);
   const box=document.createElement('section'); box.className='sea-category';
   const title=document.createElement('h3'); title.textContent=`${category.label} (${items.length} available)`; box.appendChild(title);
   if(!items.length){const empty=document.createElement('small');empty.textContent='Awaiting available inventory';box.appendChild(empty);}
   else {const grid=document.createElement('div');grid.className='sea-items'; for(const item of items){
    const label=document.createElement('label');label.className='sea-item';const cb=document.createElement('input');cb.type='checkbox';cb.value=item.id;
    cb.addEventListener('change',()=>{if(cb.checked)selected.add(item.id);else selected.delete(item.id);update();});
    const desc=document.createElement('span');desc.textContent=`${item.asset_code} · ${item.device_type}${item.model?' · '+item.model:''}`;
    label.append(cb,desc);grid.appendChild(label);
   }box.appendChild(grid);}parent.appendChild(box);
  }
  const history=$('seaHistory');history.replaceChildren();
  if(!(context.assignments||[]).length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=3;td.textContent='No supervisor batch assignments recorded for this shift.';tr.appendChild(td);history.appendChild(tr);}
  for(const item of context.assignments||[]){const tr=document.createElement('tr');cell(tr,`${item.asset_code} · ${item.device_type}`);cell(tr,item.employee_name);cell(tr,new Date(item.occurred_at).toLocaleString());history.appendChild(tr);}
  $('seaSupervisor').textContent=`${context.shift.name} · ${context.shift.date} · Supervisor: ${context.shift.supervisor||'Assigned supervisor'}`;update();
 }
 async function loadShift(){const id=$('seaShift').value;context=null;selected.clear();$('seaOfficer').disabled=true;$('seaAssign').disabled=true;
  if(!id){$('seaCategories').replaceChildren();return;}
  try{context=await rpc('st_supervisor_equipment_context',{p_shift_instance_id:id});render();message('');}
  catch(e){message(e.message||'Unable to load shift.',true);}
 }
 $('seaShift').addEventListener('change',loadShift);$('seaOfficer').addEventListener('change',update);
 $('seaAssign').addEventListener('click',async()=>{
  if(!context || !selected.size || !$('seaOfficer').value)return;
  const button=$('seaAssign');button.disabled=true;message('Recording equipment assignments…');
  try{const result=await rpc('st_supervisor_assign_equipment',{p_shift_instance_id:context.shift.id,p_officer_user_id:$('seaOfficer').value,p_device_ids:[...selected],p_notes:$('seaNotes').value.trim()||null});
   message(`${result.assigned} equipment item(s) successfully assigned. Chain of custody recorded.`);$('seaNotes').value='';await loadShift();
  }catch(e){message(e.message||'Equipment assignment failed. Nothing was issued.',true);update();}
 });
 try{
  if(!db)throw Error('SecureTrack database client not available. Confirm manager-common.js exposes SecureTrackManager.db.');
  const shifts=await rpc('st_supervisor_equipment_shifts');const select=$('seaShift');select.replaceChildren(option('','Select a published shift'));
  for(const shift of shifts||[])select.appendChild(option(shift.id,`${shift.name} · ${shift.date}`));
  if(shifts?.length===1){select.value=shifts[0].id;await loadShift();}
  if(!shifts?.length)message('No published shift assigned to your account for today.');
 }catch(e){message(e.message||'Unable to load assigned shifts.',true);}
})();
