// Loader
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loader").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("loader").remove();
      document.getElementById("app").style.display = "block";
    }, 500);
  }, 1000);
});

// Greeting, Clock, Date
function updateTime() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  document.getElementById("date").textContent = now.toDateString();
  const hr = now.getHours();
  let greet = "Good evening";
  if(hr<12) greet="Good morning";
  else if(hr<18) greet="Good afternoon";
  document.getElementById("greeting").textContent = greet;
}
setInterval(updateTime, 1000); updateTime();

// Weather (Open-Meteo)
async function getWeather() {
  if(!navigator.geolocation) return document.getElementById("weatherData").textContent="Location not supported.";
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude,longitude}=pos.coords;
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`;
    const res=await fetch(url);
    const data=await res.json();
    const temp=data.current.temperature_2m;
    document.getElementById("weatherData").textContent=`🌤️ ${temp}°C`;
    localStorage.setItem("lastWeather",temp);
  },()=>{
    const cached=localStorage.getItem("lastWeather");
    document.getElementById("weatherData").textContent=cached?`🌤️ ${cached}°C (cached)`:"Weather unavailable";
  });
}
getWeather();

// Reminders
function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks")||"[]");
  const list=document.getElementById("todo-list");
  list.innerHTML="";
  tasks.forEach((t,i)=>{
    const div=document.createElement("div");
    div.className="todo-item";
    div.innerHTML=`<span>${t}</span><button onclick="deleteTask(${i})">×</button>`;
    list.appendChild(div);
  });
}
function addTask(){
  const val=document.getElementById("new-task").value.trim();
  if(!val)return;
  const tasks=JSON.parse(localStorage.getItem("tasks")||"[]");
  tasks.push(val);
  localStorage.setItem("tasks",JSON.stringify(tasks));
  document.getElementById("new-task").value="";
  loadTasks();
  notify("Reminder added","“"+val+"”");
}
function deleteTask(i){
  const tasks=JSON.parse(localStorage.getItem("tasks")||"[]");
  tasks.splice(i,1);
  localStorage.setItem("tasks",JSON.stringify(tasks));
  loadTasks();
}
document.getElementById("add-task").onclick=addTask;
loadTasks();

// Notifications
function notify(title,body){
  if(Notification.permission==="granted"){ new Notification(title,{body}); }
}
if(Notification.permission!=="granted"){ Notification.requestPermission(); }

// Daily notification
function scheduleDaily(){
  const now=new Date(), next=new Date();
  next.setHours(9,0,0,0);
  if(now>next) next.setDate(next.getDate()+1);
  const delay=next-now;
  setTimeout(()=>{
    notify("Daily Check-In","Open your dashboard and plan your day!");
    scheduleDaily();
  },delay);
}
scheduleDaily();

// Register Service Worker
if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js'); }
