(async function () {
  'use strict';
  const STM = window.SecureTrackManager;
  const manager = await STM.requireManager();
  if (!manager) return;
  const db = STM.db;
  const $ = (id) => document.getElementById(id);
  let inventory = [];
  let editingId = null;
  const fields = ['assetCode', 'deviceType', 'manufacturer', 'model', 'serialNumber', 'homeLocation', 'imageUrl'];
  const paramNames = ['p_asset_code', 'p_device_type', 'p_manufacturer', 'p_model', 'p_serial_number', 'p_home_location', 'p_image_url'];
  $('logoutButton').addEventListener('click', STM.signOut);
  function message(id, text, error = false) { const node = $(id); node.textContent = text; node.classList.toggle('error', error); }
  function state(d) { return !d.is_active ? 'Retired' : d.current_custodian_id ? 'Checked out' : d.status === 'available' ? 'Available' : String(d.status || 'Unknown').replaceAll('_', ' '); }
  function cell(tr, text) { const td = document.createElement('td'); td.textContent = text == null ? '—' : String(text); tr.appendChild(td); return td; }
  async function rpc(name, args = {}) { const { data, error } = await db.rpc(name, args); if (error) throw error; return data; }
  async function load() {
    try {
      inventory = await rpc('st_inventory_list') || [];
      render();
      message('inventoryMessage', 'Inventory updated.');
    } catch (e) { message('inventoryMessage', e.message || 'Could not load inventory.', true); }
  }
  function render() {
    $('totalCount').textContent = inventory.length;
    $('availableCount').textContent = inventory.filter(d => d.is_active && d.status === 'available' && !d.current_custodian_id).length;
    $('checkedCount').textContent = inventory.filter(d => d.is_active && d.current_custodian_id).length;
    $('retiredCount').textContent = inventory.filter(d => !d.is_active).length;
    const q = $('inventorySearch').value.trim().toLowerCase();
    const filtered = inventory.filter(d => [d.asset_code, d.device_type, d.manufacturer, d.model, d.serial_number, d.home_location].some(x => String(x || '').toLowerCase().includes(q)));
    const tbody = $('inventoryRows'); tbody.replaceChildren();
    if (!filtered.length) { const tr = document.createElement('tr'); const td = cell(tr, 'No matching equipment.'); td.colSpan = 5; tbody.appendChild(tr); return; }
    for (const d of filtered) {
      const tr = document.createElement('tr');
      cell(tr, d.asset_code);
      cell(tr, [d.device_type, d.manufacturer, d.model].filter(Boolean).join(' • '));
      cell(tr, d.home_location);
      cell(tr, state(d));
      const actions = document.createElement('td');
      const history = document.createElement('a'); history.href = 'asset-history.html?device=' + encodeURIComponent(d.id); history.textContent = 'History'; actions.appendChild(history);
      if (d.is_active) {
        const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.className = 'secondary-btn'; edit.addEventListener('click', () => openEditor(d)); actions.append(' ', edit);
        const retire = document.createElement('button'); retire.type = 'button'; retire.textContent = 'Retire'; retire.className = 'secondary-btn'; retire.disabled = Boolean(d.current_custodian_id) || d.status !== 'available'; retire.title = retire.disabled ? 'Return equipment and ensure status is available first' : 'Retire equipment'; retire.addEventListener('click', () => retireDevice(d)); actions.append(' ', retire);
      }
      tr.appendChild(actions); tbody.appendChild(tr);
    }
  }
  function openEditor(d = null) {
    editingId = d?.id || null;
    $('editorTitle').textContent = editingId ? 'Edit Equipment' : 'Register Equipment';
    const keys = ['asset_code', 'device_type', 'manufacturer', 'model', 'serial_number', 'home_location', 'image_url'];
    fields.forEach((id, i) => { $(id).value = d?.[keys[i]] || ''; });
    message('editorMessage', '');
    $('inventoryEditor').hidden = false;
    $('inventoryEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('addEquipmentButton').addEventListener('click', () => openEditor());
  $('cancelEquipmentButton').addEventListener('click', () => { $('inventoryEditor').hidden = true; editingId = null; });
  $('inventorySearch').addEventListener('input', render);
  $('inventoryForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('saveEquipmentButton'); button.disabled = true;
    try {
      const args = {};
      fields.forEach((id, i) => { args[paramNames[i]] = $(id).value.trim() || null; });
      if (editingId) args.p_device_id = editingId;
      await rpc(editingId ? 'st_inventory_update' : 'st_inventory_add', args);
      $('inventoryEditor').hidden = true; editingId = null;
      await load();
    } catch (e) { message('editorMessage', e.message || 'Could not save equipment.', true); }
    finally { button.disabled = false; }
  });
  async function retireDevice(d) {
    if (!window.confirm('Retire ' + d.asset_code + '? The asset and its history will be retained, but it should no longer be available for checkout.')) return;
    try { await rpc('st_inventory_retire', { p_device_id: d.id }); await load(); }
    catch (e) { message('inventoryMessage', e.message || 'Could not retire equipment.', true); }
  }
  await load();
})();
