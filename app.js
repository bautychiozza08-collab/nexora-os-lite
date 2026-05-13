import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* FIREBASE */

const firebaseConfig = {
  apiKey: "AIzaSyCQ8GMONE1oriNL0_7FgyyNyXAi_2k3PKg",
  authDomain: "nexora-os-lite.firebaseapp.com",
  projectId: "nexora-os-lite",
  storageBucket: "nexora-os-lite.firebasestorage.app",
  messagingSenderId: "835691033681",
  appId: "1:835691033681:web:0e4b42104960a570b0b470",
  measurementId: "G-7WWNW2SDNR"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

/* STATE */

let currentUser = null;
let projects = [];
let contents = [];

/* HELPERS */

function $(id){
  return document.getElementById(id);
}

function toast(message){
  const box = $("toastBox");

  if(!box){
    console.log(message);
    return;
  }

  const div = document.createElement("div");
  div.className = "toast";
  div.innerText = message;

  box.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 3000);
}

function setText(id, value){
  const el = $(id);
  if(el) el.innerText = value;
}

function show(el){
  if(el) el.classList.remove("hidden");
}

function hide(el){
  if(el) el.classList.add("hidden");
}

/* FIRESTORE */

async function loadUserData(){
  if(!currentUser) return;

  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);

  if(snap.exists()){
    const data = snap.data();
    projects = data.projects || [];
    contents = data.contents || [];
  }else{
    projects = [];
    contents = [];

    await setDoc(ref, {
      email: currentUser.email,
      projects,
      contents,
      updatedAt: new Date().toISOString()
    });
  }
}

async function saveCloudData(){
  if(!currentUser) return;

  const ref = doc(db, "users", currentUser.uid);

  await setDoc(ref, {
    email: currentUser.email,
    projects,
    contents,
    updatedAt: new Date().toISOString()
  });
}

/* AUTH */

async function register(){
  const email = ($("authEmail") || $("email"))?.value.trim();
  const password = ($("authPassword") || $("password"))?.value.trim();

  if(!email || !password){
    toast("Completá email y contraseña");
    return;
  }

  try{
    await createUserWithEmailAndPassword(auth, email, password);
    toast("Cuenta creada 🚀");
  }catch(error){
    toast("Error: " + error.message);
  }
}

async function login(){
  const email = ($("authEmail") || $("email"))?.value.trim();
  const password = ($("authPassword") || $("password"))?.value.trim();

  if(!email || !password){
    toast("Completá email y contraseña");
    return;
  }

  try{
    await signInWithEmailAndPassword(auth, email, password);
    toast("Sesión iniciada ✅");
  }catch(error){
    toast("Error: " + error.message);
  }
}

async function logoutLocal(){
  await signOut(auth);
  location.reload();
}

window.register = register;
window.login = login;
window.registerFirebase = register;
window.loginFirebase = login;
window.logoutLocal = logoutLocal;

onAuthStateChanged(auth, async user => {
  const loginScreen = $("loginScreen");
  const app = $("app") || $("appScreen");

  if(user){
    currentUser = user;

    hide(loginScreen);
    show(app);

    await loadUserData();

    const usernameText = $("usernameText");
    if(usernameText){
      usernameText.innerText = user.email.split("@")[0];
    }

    renderAll();
  }else{
    currentUser = null;
    projects = [];
    contents = [];

    show(loginScreen);
    hide(app);
  }
});

/* SECTIONS */

function showSection(section){
  const dashboard = $("dashboardSection");
  const projectsSection = $("projectsSection");
  const creator = $("creatorSection");

  [dashboard, projectsSection, creator].forEach(sec => {
    if(sec) sec.classList.add("hidden");
  });

  if(section === "dashboard") show(dashboard);
  if(section === "projects") show(projectsSection);
  if(section === "creator") show(creator);

  renderAll();
}

window.showSection = showSection;

/* PROJECTS */

async function addProject(){
  const nameInput = $("projectName") || $("projectInput");
  const statusInput = $("projectStatus");

  if(!nameInput){
    toast("No encontré el input de proyecto");
    return;
  }

  const name = nameInput.value.trim();
  const status = statusInput ? statusInput.value : "Idea";

  if(!name){
    toast("Escribí el nombre del proyecto");
    return;
  }

  projects.push({
    id: Date.now(),
    name,
    status,
    tasks: []
  });

  nameInput.value = "";

  await saveCloudData();
  renderAll();

  toast("Proyecto creado 🚀");
}

async function deleteProject(id){
  projects = projects.filter(project => project.id !== id);

  await saveCloudData();
  renderAll();

  toast("Proyecto eliminado");
}

async function addTask(projectId){
  const input = $(`taskInput-${projectId}`);
  if(!input) return;

  const text = input.value.trim();

  if(!text){
    toast("Escribí una tarea");
    return;
  }

  const project = projects.find(p => p.id === projectId);
  if(!project) return;

  project.tasks.push({
    id: Date.now(),
    text,
    done: false
  });

  await saveCloudData();
  renderAll();

  toast("Tarea agregada ✅");
}

async function toggleTask(projectId, taskId){
  const project = projects.find(p => p.id === projectId);
  if(!project) return;

  const task = project.tasks.find(t => t.id === taskId);
  if(!task) return;

  task.done = !task.done;

  await saveCloudData();
  renderAll();
}

async function deleteTask(projectId, taskId){
  const project = projects.find(p => p.id === projectId);
  if(!project) return;

  project.tasks = project.tasks.filter(t => t.id !== taskId);

  await saveCloudData();
  renderAll();

  toast("Tarea eliminada");
}

window.addProject = addProject;
window.deleteProject = deleteProject;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

function renderProjects(){
  const container = $("projectsContainer") || $("projectsList");
  if(!container) return;

  container.innerHTML = "";

  if(projects.length === 0){
    container.innerHTML = `
      <div class="project-card">
        <h3>🚀 Sin proyectos</h3>
        <p>Creá tu primer proyecto o cargá una demo.</p>
      </div>
    `;
    return;
  }

  projects.forEach(project => {
    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter(t => t.done).length;
    const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    container.innerHTML += `
      <div class="project-card">
        <h3>${project.name}</h3>
        <p>Estado: ${project.status}</p>

        <div class="project-progress">
          <span>Progreso ${progress}%</span>
          <div class="progress">
            <i style="width:${progress}%"></i>
          </div>
        </div>

        <div class="task-form">
          <input id="taskInput-${project.id}" placeholder="Nueva tarea...">
          <button onclick="addTask(${project.id})" class="mini-btn">Agregar</button>
        </div>

        <div class="task-list">
          ${project.tasks.map(task => `
            <div class="task-row ${task.done ? "task-done" : ""}">
              <span onclick="toggleTask(${project.id}, ${task.id})">
                ${task.done ? "✅" : "⬜"} ${task.text}
              </span>

              <button onclick="deleteTask(${project.id}, ${task.id})">✕</button>
            </div>
          `).join("")}
        </div>

        <button onclick="deleteProject(${project.id})" class="delete-btn">
          Eliminar proyecto
        </button>
      </div>
    `;
  });
}

/* CREATOR */

async function addContent(){
  const input = $("contentTitle");

  if(!input){
    toast("No encontré el input de contenido");
    return;
  }

  const title = input.value.trim();

  if(!title){
    toast("Escribí una idea de contenido");
    return;
  }

  contents.push({
    id: Date.now(),
    title,
    status: "Idea"
  });

  input.value = "";

  await saveCloudData();
  renderAll();

  toast("Idea guardada 🎬");
}

async function deleteContent(id){
  contents = contents.filter(content => content.id !== id);

  await saveCloudData();
  renderAll();

  toast("Idea eliminada");
}

window.addContent = addContent;
window.deleteContent = deleteContent;

function renderCreator(){
  const container = $("creatorContainer");
  if(!container) return;

  container.innerHTML = "";

  if(contents.length === 0){
    container.innerHTML = `
      <div class="project-card">
        <h3>🎬 Sin ideas todavía</h3>
        <p>Guardá una idea para tu Creator Studio.</p>
      </div>
    `;
    return;
  }

  contents.forEach(content => {
    container.innerHTML += `
      <div class="project-card">
        <h3>${content.title}</h3>
        <p>Estado: ${content.status}</p>

        <button onclick="deleteContent(${content.id})" class="delete-btn">
          Eliminar idea
        </button>
      </div>
    `;
  });
}

/* DASHBOARD */

function renderDashboard(){
  const totalProjects = projects.length;
  const totalContents = contents.length;

  const totalTasks = projects.reduce((acc, p) => {
    return acc + p.tasks.length;
  }, 0);

  const completedTasks = projects.reduce((acc, p) => {
    return acc + p.tasks.filter(t => t.done).length;
  }, 0);

  const productivity = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  setText("totalProjects", totalProjects);
  setText("projectCount", totalProjects);

  setText("totalTasks", totalTasks);
  setText("tasksCount", totalTasks);

  setText("productivity", productivity + "%");
  setText("totalContents", totalContents);
}

/* AI REAL */

async function generateAIResponse(){
  const aiInput = $("aiInput");
  const aiResult = $("aiResult");

  if(!aiInput || !aiResult){
    toast("No encontré la sección de IA");
    return;
  }

  const prompt = aiInput.value.trim();

  if(!prompt){
    toast("Escribí una idea primero");
    return;
  }

  aiResult.innerHTML = "Generando respuesta...";

  try{
    const response = await fetch("https://nexora-ai-api.vercel.app/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        type: "idea"
      })
    });

    const data = await response.json();

    aiResult.innerHTML = `
      <div class="ai-card">
        <h3>🚀 Resultado IA</h3>
        <div class="ai-text">${data.text || "No pude generar respuesta."}</div>
      </div>
    `;
  }catch(error){
    aiResult.innerHTML = `
      <div class="ai-card">
        <h3>⚠️ Error</h3>
        <div class="ai-text">Error conectando IA.</div>
      </div>
    `;
  }
}

window.generateAIResponse = generateAIResponse;

/* BACKUP */

function exportBackup(){
  const backup = {
    user: currentUser ? currentUser.email : "",
    projects,
    contents
  };

  const data = JSON.stringify(backup, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "nexora-backup.json";
  a.click();

  URL.revokeObjectURL(url);

  toast("Backup exportado 📦");
}

window.exportBackup = exportBackup;

document.addEventListener("change", function(e){
  if(e.target.id !== "importFile") return;

  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = async function(event){
    try{
      const data = JSON.parse(event.target.result);

      projects = data.projects || [];
      contents = data.contents || [];

      await saveCloudData();
      renderAll();

      toast("Backup importado correctamente 🚀");
    }catch{
      toast("Archivo inválido");
    }
  };

  reader.readAsText(file);
});

/* DEMO */

async function loadDemoData(){
  projects = [
    {
      id: Date.now() + 1,
      name: "Nexora OS Lite",
      status: "Publicado",
      tasks: [
        { id: 1, text: "Firebase Auth", done: true },
        { id: 2, text: "Firestore Cloud", done: true },
        { id: 3, text: "Gemini AI", done: true }
      ]
    },
    {
      id: Date.now() + 2,
      name: "Creator Studio",
      status: "En desarrollo",
      tasks: [
        { id: 4, text: "Diseñar cards", done: true },
        { id: 5, text: "Agregar calendario", done: false }
      ]
    }
  ];

  contents = [
    { id: Date.now() + 3, title: "Post lanzamiento Nexora", status: "Idea" }
  ];

  await saveCloudData();
  renderAll();

  toast("Demo cargada 🚀");
}

window.loadDemoData = loadDemoData;

/* RENDER */

function renderAll(){
  renderDashboard();
  renderProjects();
  renderCreator();
}

/* START */

document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = $("generateIdea");

  if(generateBtn){
    generateBtn.addEventListener("click", generateAIResponse);
  }
});
window.showSection = function(section){
  const dashboard = document.getElementById("dashboardSection");
  const projects = document.getElementById("projectsSection");
  const creator = document.getElementById("creatorSection");

  if(dashboard) dashboard.classList.add("hidden");
  if(projects) projects.classList.add("hidden");
  if(creator) creator.classList.add("hidden");

  if(section === "dashboard" && dashboard){
    dashboard.classList.remove("hidden");
  }

  if(section === "projects" && projects){
    projects.classList.remove("hidden");
  }

  if(section === "creator" && creator){
    creator.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  event.target.classList.add("active");
};
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const generateBtn = document.getElementById("generateIdea");

  if(loginBtn){
    loginBtn.addEventListener("click", login);
  }

  if(registerBtn){
    registerBtn.addEventListener("click", register);
  }

  if(generateBtn){
    generateBtn.addEventListener("click", generateAIResponse);
  }
});