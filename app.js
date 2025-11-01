const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const pages = $$('.page');
const tabs = $$('.tab-btn');
const toast = $('#toast');
function showToast(t){toast.textContent=t;toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),2000)}
tabs.forEach(t=>{
  t.addEventListener('click',()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    pages.forEach(p=>p.classList.remove('active'));
    document.getElementById(t.dataset.target).classList.add('active');
  });
});
function nowStr(){const d=new Date();return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
function updateClock(){$('#clock').textContent=nowStr();const d=new Date();$('#date').textContent=d.toDateString();const hr=d.getHours();let g='Good evening';if(hr<12)g='Good morning';else if(hr<18)g='Good afternoon';$('#greeting').textContent=g}
setInterval(updateClock,1000);updateClock()

async function getWeather(){
  if(!navigator.geolocation){$('#weatherData').textContent='No location';return}
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude,longitude}=pos.coords;
    try{
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`
      const res=await fetch(url);
      const data=await res.json();
      const t=data.current_weather.temperature;
      $('#weatherData').textContent=`${t}°C • ${data.current_weather.weathercode||''}`;
      localStorage.setItem('lastWeather',JSON.stringify({t,ts:Date.now()}))
    }catch(e){
      const cached=localStorage.getItem('lastWeather');
      if(cached){const c=JSON.parse(cached);$('#weatherData').textContent=`${c.t}°C (cached)`}
      else{$('#weatherData').textContent='Unavailable'}
    }
  },err=>{
    const cached=localStorage.getItem('lastWeather');
    if(cached){const c=JSON.parse(cached);$('#weatherData').textContent=`${c.t}°C (cached)`}else{$('#weatherData').textContent='Unavailable'}
  },{timeout:8000})
}
getWeather()

function bindBattery(){
  if(!navigator.getBattery) return $('#battery').textContent='N/A';
  navigator.getBattery().then(b=>{
    function up(){$('#battery').textContent=Math.round(b.level*100)+'%'}
    up();b.addEventListener('levelchange',up)
  })
}
bindBattery()

function loadQuickReminders(){
  const tasks = JSON.parse(localStorage.getItem('tasks')||'[]');
  const el = $('#quick-list'); el.innerHTML='';
  tasks.slice(0,4).forEach(t=>{
    const d=document.createElement('div');d.className='todo-item';d.textContent=t;el.appendChild(d)
  })
}
loadQuickReminders()

function uid(){return Math.random().toString(36).slice(2,9)}

function saveReminders(arr){localStorage.setItem('reminders',JSON.stringify(arr))}
function loadReminders(){return JSON.parse(localStorage.getItem('reminders')||'[]')}

function renderReminders(){
  const list = $('#reminder-list'); list.innerHTML='';
  const reminders = loadReminders().sort((a,b)=> new Date(a.when||0)-new Date(b.when||0));
  reminders.forEach(r=>{
    const el=document.createElement('div');el.className='rem-item';
    const left=document.createElement('div');left.innerHTML=`<div style="font-weight:600">${r.text}</div><div style="font-size:12px;color:var(--muted)">${r.when?new Date(r.when).toLocaleString():''}</div>`;
    const right=document.createElement('div');
    const done=document.createElement('button');done.className='btn ghost';done.textContent='Done';done.onclick=()=>{removeReminder(r.id)}
    const del=document.createElement('button');del.className='btn ghost';del.textContent='Delete';del.onclick=()=>{deleteReminder(r.id)}
    right.appendChild(done);right.appendChild(del);
    el.appendChild(left);el.appendChild(right);
    list.appendChild(el)
  })
}
function addReminder(text,when){
  const r=loadReminders(); r.push({id:uid(),text,when:when?new Date(when).toISOString():null,notified:false}); saveReminders(r); scheduleAll(); renderReminders(); loadQuickReminders(); showToast('Reminder added')
}
function deleteReminder(id){let r=loadReminders(); r=r.filter(x=>x.id!==id); saveReminders(r); scheduleAll(); renderReminders(); loadQuickReminders()}
function removeReminder(id){let r=loadReminders(); r=r.filter(x=>x.id!==id); saveReminders(r); scheduleAll(); renderReminders(); loadQuickReminders(); showToast('Marked done')}

function scheduleAll(){
  if(window._reminderTimers){window._reminderTimers.forEach(t=>clearTimeout(t));window._reminderTimers=[]}
  window._reminderTimers=[]
  const now=Date.now()
  const rem=loadReminders()
  rem.forEach(r=>{
    if(!r.when) return
    const t=new Date(r.when).getTime()
    if(t<=now){if(!r.notified){showNoteNotification(r); r.notified=true; saveReminders(rem)};return}
    const delay=t-now
    if(delay>2147483640) return
    const to=setTimeout(()=>{
      showNoteNotification(r)
      r.notified=true
      saveReminders(rem)
    },delay)
    window._reminderTimers.push(to)
  })
}

function showNoteNotification(r){
  if(Notification.permission==='granted'){navigator.serviceWorker.getRegistration().then(reg=>{
    if(reg){reg.showNotification(r.text,{body:r.when?new Date(r.when).toLocaleTimeString():''})}
    else{new Notification(r.text,{body:r.when?new Date(r.when).toLocaleTimeString():''})}
  })}
  else{showToast(r.text)}
}

$('#add-reminder').addEventListener('click',()=>{
  const t=$('#reminder-text').value.trim(); const time=$('#reminder-time').value;
  if(!t) return showToast('Type something');
  let when=null;
  if(time){
    const now=new Date(); const [hh,mm]=time.split(':').map(Number); const dt=new Date(now.getFullYear(),now.getMonth(),now.getDate(),hh,mm,0,0);
    if(dt.getTime()<=now.getTime()) dt.setDate(dt.getDate()+1);
    when=dt.toISOString()
  }
  addReminder(t,when)
  $('#reminder-text').value='';$('#reminder-time').value=''
});

renderReminders()
scheduleAll()

function permissionFlow(){
  if(Notification.permission==='granted') return
  if(Notification.permission==='denied') return
  Notification.requestPermission().then(p=>{
    if(p==='granted') showToast('Notifications enabled')
  })
}
permissionFlow()

$('#quick-add').addEventListener('click',()=>{
  const q=prompt('Quick add a reminder');
  if(q){addReminder(q,null)}
})

function loadNotes(){
  const notes=JSON.parse(localStorage.getItem('notes')||'[]'); const el=$('#notes-list'); el.innerHTML='';
  notes.forEach(n=>{
    const c=document.createElement('div');c.className='note-card';
    c.innerHTML=`<div style="font-weight:700">${n.title||'Untitled'}</div><div style="font-size:12px;color:var(--muted);margin-top:6px">${(n.body||'').slice(0,120)}</div>`;
    c.onclick=()=>openEditor(n.id);
    el.appendChild(c)
  })
}
function saveNotes(arr){localStorage.setItem('notes',JSON.stringify(arr))}
function addNote(title){
  const notes=JSON.parse(localStorage.getItem('notes')||'[]'); const id=uid();
  notes.unshift({id,title,body:''}); saveNotes(notes); loadNotes(); openEditor(id)
}
function openEditor(id){
  const notes=JSON.parse(localStorage.getItem('notes')||'[]'); const n=notes.find(x=>x.id===id); if(!n) return;
  $('#note-editor').classList.remove('hidden'); $('#editor-title').value=n.title; $('#editor-body').value=n.body; $('#save-note').dataset.editId=id
}
$('#add-note').addEventListener('click',()=>{const t=$('#note-title').value.trim()||'Note'; addNote(t); $('#note-title').value=''})
$('#save-note').addEventListener('click',()=>{
  const id=$('#save-note').dataset.editId; const notes=JSON.parse(localStorage.getItem('notes')||'[]'); const i=notes.findIndex(x=>x.id===id);
  if(i>-1){notes[i].title=$('#editor-title').value; notes[i].body=$('#editor-body').value; saveNotes(notes); $('#note-editor').classList.add('hidden'); loadNotes(); showToast('Saved') }
})
$('#close-editor').addEventListener('click',()=>$('#note-editor').classList.add('hidden'))
loadNotes()

const accentBtns = $$('.accent-option')
accentBtns.forEach(b=>b.addEventListener('click',()=>{
  accentBtns.forEach(x=>x.classList.remove('active'))
  b.classList.add('active')
  document.documentElement.style.setProperty('--accent',b.dataset.color)
  localStorage.setItem('accent',b.dataset.color)
}))
const savedAccent = localStorage.getItem('accent')
if(savedAccent) document.documentElement.style.setProperty('--accent',savedAccent)

$('#clear-data').addEventListener('click',()=>{
  if(confirm('Clear local data?')){localStorage.clear();location.reload()}
})

if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')

window.addEventListener('load', scheduleAll)
