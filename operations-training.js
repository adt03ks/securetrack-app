
// INTEGRATION: expose your existing authenticated Supabase client as window.stSupabase
// before this page loads. Do NOT put a service-role key in browser JavaScript.
const db=window.SECURETRACK_DB;
// Uses the same authenticated Supabase client as the existing Operations Hub.
const $=id=>document.getElementById(id);
const modulesEl=$('modules');let modules=[], attempts=[],user=null;

/* ============================================
   SECURETRACK OP
   OPERATIONS TRAINING MODULE BACKGROUNDS
   ============================================ */

const TRAINING_MODULE_IMAGES = {
  equipment:
    "/assets/training-equipment-management.png",

  alerts:
    "/assets/training-security-alerts-reporting.png",

  property:
    "/assets/training-property-documentation.png",

  overtime:
    "/assets/training-overtime-requests.png",

  notifications:
    "/assets/training-notification-hub.png",

  handoff:
    "/assets/training-end-of-shift-handoff.png",

  assignments:
    "/assets/training-duty-station-assignment.png"
};

const ratings=s=>s>=95?'Mastery':s>=85?'Proficient':s>=75?'Competent':s>=60?'Developing':'Needs Improvement';
const nice=s=>s.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
function node(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x}
function showNotice(message){$('notice').textContent=message;$('notice').classList.remove('hidden')}
function best(id){const a=attempts.filter(a=>a.module_id===id);return a.length?Math.max(...a.map(x=>x.score)):null}
function progress(){let done=modules.filter(m=>best(m.id)!==null&&best(m.id)>=m.passing_score).length;
  $('progress-summary').textContent=`${done} of ${modules.length} modules completed`;
  $('progress-pct').textContent=`${modules.length?Math.round(done/modules.length*100):0}% complete`;
  $('segments').replaceChildren();for(const m of modules){const x=node('div','segment');const s=best(m.id);if(s!==null)x.classList.add(s>=m.passing_score?'done':'partial');x.title=m.title;$('segments').append(x)}
  const scores=modules.map(m=>best(m.id)).filter(v=>v!==null);$('avg').textContent=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)+'%':'—';
  $('count').textContent=modules.length+' assigned modules';
}
function card(m){const b=node('button','module');b.type='button';b.setAttribute('aria-label',`Open ${m.title}`);
  
  // ==========================================
  // LOAD THE CORRECT TRAINING CARD IMAGE
  // ==========================================

  const photo = node("div", "photo");

 
const imagePath =
  TRAINING_MODULE_IMAGES[m.id] ||
  "/assets/securetrack-operations-training.png";


  photo.style.backgroundImage =
    `url("${imagePath}")`;

  photo.style.backgroundSize = "cover";
  photo.style.backgroundPosition = "center";
  photo.style.backgroundRepeat = "no-repeat";
b.append(photo);
  const c=node('div','module-content'),s=best(m.id);c.append(node('span','label','OPERATIONS TRAINING'),node('h3','',m.title),node('p','',m.description));
  const badge=node('span','pill'+(s!==null?(s>=m.passing_score?' good':' warn'):''),s===null?'Begin training':`${s}% · ${ratings(s)}`);c.append(badge);b.append(c);b.addEventListener('click',()=>openModule(m));return b}
function render(){progress();modulesEl.replaceChildren(...modules.map(card))}
async function openModule(m){$('list-screen').classList.add('hidden');$('detail-screen').classList.remove('hidden');$('detail-title').textContent=m.title;$('detail-desc').textContent=m.description;$('outcome').replaceChildren();
  $('lesson').replaceChildren();if(m.lesson_url&&/^https:\/\//i.test(m.lesson_url)){const a=node('a','action', 'Open training lesson ↗');a.href=m.lesson_url;a.target='_blank';a.rel='noopener noreferrer';a.style.display='inline-block';a.style.textDecoration='none';$('lesson').append(a)}else $('lesson').append(node('p','muted','Training media will appear here when added by the administrator.'));
  const {data:qs,error}=await db.from('st_training_questions').select('id,prompt,choices,sort_order').eq('module_id',m.id).eq('is_active',true).order('sort_order');
  if(error){showNotice(error.message);return}const holder=$('quiz');holder.replaceChildren();if(!qs.length){holder.append(node('p','message','Quiz content has not been published for this module yet.'));return}
  holder.append(node('h3','','Knowledge Check'));
  const form=node('form');for(const [i,q] of qs.entries()){const field=node('fieldset','question');field.append(node('legend','',`${i+1}. ${q.prompt}`));q.choices.forEach((choice,idx)=>{const label=node('label');const radio=node('input');radio.type='radio';radio.name='q_'+q.id;radio.value=String(idx);label.append(radio,document.createTextNode(String(choice)));field.append(label)});form.append(field)}
  const submit=node('button','action','Submit quiz');submit.type='submit';form.append(submit);form.addEventListener('submit',async e=>{e.preventDefault();const answers={};for(const q of qs){const selected=form.querySelector(`input[name="q_${q.id}"]:checked`);if(!selected){showNotice('Answer every question before submitting.');return}answers[q.id]=Number(selected.value)}submit.disabled=true;
    const {data,error}=await db.rpc('st_training_submit_quiz',{p_module_id:m.id,p_answers:answers});submit.disabled=false;
    if(error){showNotice(error.message);return}const r=data?.[0];if(!r){showNotice('Quiz response was empty');return}
    $('outcome').replaceChildren(node('div','result',`${r.score}% — ${r.rating}`),node('p','muted',r.passed?'Module completed. You may retake the quiz to improve your score.':'Review the material and try again. No manager approval required.'));
    const {data:newAttempts}=await db.from('st_training_attempts').select('module_id,score').eq('user_id',user.id);if(newAttempts)attempts=newAttempts;render();
  });holder.append(form)
}
$('back').addEventListener('click',()=>{$('detail-screen').classList.add('hidden');$('list-screen').classList.remove('hidden')});
async function loadReport(){const {data:scope,error:scopeError}=await db.from('st_training_manager_scope').select('employee_id');if(scopeError||!scope?.length)return;
  const ids=scope.map(x=>x.employee_id);const {data:teamAttempts,error}=await db.from('st_training_attempts').select('user_id,module_id,score,submitted_at').in('user_id',ids).order('submitted_at',{ascending:false});if(error)return;
  const summary=new Map(ids.map(id=>[id,[]]));for(const a of teamAttempts||[])summary.get(a.user_id)?.push(a);
  const table=node('table','table');const tr=node('tr');['Employee ID','Quiz attempts','Average best score'].forEach(h=>tr.append(node('th','',h)));table.append(tr);
  for(const [id,arr] of summary){const row=node('tr');const top=[...new Map(arr.map(a=>[a.module_id,Math.max(...arr.filter(x=>x.module_id===a.module_id).map(x=>x.score))])).values()];
    [id, String(arr.length),top.length?Math.round(top.reduce((a,b)=>a+b,0)/top.length)+'%':'Not assessed'].forEach(v=>row.append(node('td','',v)));table.append(row)}
  $('report').replaceChildren(table);$('report-wrap').classList.remove('hidden');
}
async function init(){if(!db){showNotice('SecureTrack authentication is unavailable. Please return to the Operations Hub and sign in.');return}
  const {data:{user:current},error:authError}=await db.auth.getUser();if(authError||!current){showNotice('Please sign in through the Operations Hub before opening training.');return}user=current;
  const [{data:role,error:roleErr},{data:mods,error:modErr},{data:history,error:historyErr}]=await Promise.all([
    db.rpc('st_training_role'),db.from('st_training_modules').select('id,title,description,image_url,lesson_url,passing_score,sort_order').order('sort_order'),db.from('st_training_attempts').select('module_id,score').eq('user_id',user.id)]);
  if(roleErr||modErr||historyErr){showNotice(roleErr?.message||modErr?.message||historyErr?.message);return}modules=mods||[];attempts=history||[];$('role').textContent=nice(role||'officer');render();
  if(['manager','director','admin'].includes(role))await loadReport();
}
init();
