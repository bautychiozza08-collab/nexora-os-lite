import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

/* STATE */

let currentUser = null;
let projects = [];
let contents = [];

/* LOGIN UI */

function setupLoginUI(){
  const loginCard = document.querySelector(".login-card");

  if(!loginCard) return;

  loginCard.innerHTML = `
    <h1>NEXORA<span> OS</span></h1>

    <p>Iniciá sesión o registrate para guardar tu workspace.</p>

    <input id="authEmail" type="email" placeholder="Email">
    <input id="authPassword" type="password" placeholder="Contraseña">

    <button class="glow-btn" onclick="loginFirebase()">
      Entrar
    </button>

    <button class="mini-btn" onclick="registerFirebase()">
      Crear cuenta
    </button>
  `;
}

/* STORAGE POR USUARIO */

function userProjectsKey(){
  return `nexoraProjects_${currentUser.uid}`;
}

function userContentsKey(){
  return `nexoraContents_${currentUser.uid}`;
}

function loadUserData(){
  projects = JSON.parse(localStorage.getItem(userProjectsKey())) || [];
  contents = JSON.parse(localStorage.getItem(userContentsKey())) || [];
}

function saveProjects(){
  localStorage.setItem(userProjectsKey(), JSON.stringify(projects));
}

function saveContents(){
  localStorage.setItem(userContentsKey(), JSON.stringify(contents));
}

/* AUTH */

window.registerFirebase = async function(){
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();

  if(!email || !password){
    alert("Completá email y contraseña");
    return;
  }

  try{
    await createUserWithEmailAndPassword(auth, email, password);
  }catch(error){
    alert("Error al crear cuenta: " + error.message);
  }
};

window.loginFirebase = async function(){
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();

  if(!email || !password){
    alert("Completá email y contraseña");
    return;
  }

  try{
    await signInWithEmailAndPassword(auth, email, password);
  }catch(error){
    alert("Error al iniciar sesión: " + error.message);
  }
};

window.logoutLocal = async function(){
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  const loginScreen = document.getElementById("loginScreen");
  const app = document.getElementById("app");

  if(user){
    currentUser = user;

    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");

    loadUserData();

    const usernameText = document.getElementById("usernameText");
    if(usernameText){
      usernameText.innerText = user.email.split("@")[0];
    }

    renderAll();
  }else{
    currentUser = null;
    projects = [];
    contents = [];

    loginScreen.classList.remove("hidden");
    app.classList.add("hidden");
  }
});

/* SECCIONES */

window.showSection = function(section){
  document.querySelectorAll(".page-section").forEach(sec => {
    sec.classList.add("hidden");
  });

  if(section === "dashboard"){
    document.getElementById("dashboardSection").classList.remove("hidden");
  }

  if(section === "projects"){
    document.getElementById("projectsSection").classList.remove("hidden");
  }

  if(section === "creator"){
    document.getElementById("creatorSection").classList.remove("hidden");
  }

  renderAll();
};

/* PROYECTOS */

window.addProject = function(){
  const nameInput = document.getElementById("projectName");
  const statusInput = document.getElementById("projectStatus");

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if(!name){
    alert("Escribí el nombre del proyecto");
    return;
  }

  projects.push({
    id: Date.now(),
    name,
    status,
    tasks: []
  });

  saveProjects();

  nameInput.value = "";

  renderAll();
};

window.deleteProject = function(id){
  projects = projects.filter(project => project.id !== id);
  saveProjects();
  renderAll();
};

window.addTask = function(projectId){
  const input = document.getElementById(`taskInput-${projectId}`);
  const text = input.value.trim();

  if(!text){
    alert("Escribí una tarea");
    return;
  }

  const project = projects.find(p => p.id === projectId);

  project.tasks.push({
    id: Date.now(),
    text,
    done: false
  });

  saveProjects();
  renderAll();
};

window.toggleTask = function(projectId, taskId){
  const project = projects.find(p => p.id === projectId);
  const task = project.tasks.find(t => t.id === taskId);

  task.done = !task.done;

  saveProjects();
  renderAll();
};

window.deleteTask = function(projectId, taskId){
  const project = projects.find(p => p.id === projectId);

  project.tasks = project.tasks.filter(t => t.id !== taskId);

  saveProjects();
  renderAll();
};

function renderProjects(){
  const container = document.getElementById("projectsContainer");
  if(!container) return;

  const search = document.getElementById("projectSearch")?.value.toLowerCase() || "";
  const filter = document.getElementById("projectFilter")?.value || "Todos";

  container.innerHTML = "";

  const filteredProjects = projects
    .filter(project => project.name.toLowerCase().includes(search))
    .filter(project => filter === "Todos" || project.status === filter);

  if(filteredProjects.length === 0){
    container.innerHTML = `
      <div class="project-card">
        <h3>🚀 Sin proyectos</h3>
        <p>Creá tu primer proyecto o cargá una demo.</p>
      </div>
    `;
    return;
  }

  filteredProjects.forEach(project => {
    const doneTasks = project.tasks.filter(t => t.done).length;
    const totalTasks = project.tasks.length;
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

              <button onclick="deleteTask(${project.id}, ${task.id})">
                ✕
              </button>
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

window.addContent = function(){
  const input = document.getElementById("contentTitle");
  const title = input.value.trim();

  if(!title){
    alert("Escribí una idea de contenido");
    return;
  }

  contents.push({
    id: Date.now(),
    title,
    status: "Idea"
  });

  saveContents();

  input.value = "";

  renderAll();
};

window.deleteContent = function(id){
  contents = contents.filter(content => content.id !== id);
  saveContents();
  renderAll();
};

function renderCreator(){
  const container = document.getElementById("creatorContainer");
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
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = projects.reduce(
    (acc, p) => acc + p.tasks.filter(t => t.done).length,
    0
  );

  const productivity = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  setText("totalProjects", totalProjects);
  setText("totalTasks", totalTasks);
  setText("productivity", productivity + "%");
  setText("totalContents", totalContents);
}

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.innerText = value;
}

/* IA */

window.runNexoraAI = function(type){
  const promptInput = document.getElementById("aiPrompt");
  const resultBox = document.getElementById("aiResultBox");

  if(!promptInput || !resultBox) return;

  const prompt = promptInput.value.trim();

  if(!prompt){
    alert("Escribí una idea primero");
    return;
  }

  let result = "";

  if(type === "idea"){
    result = `💡 Idea SaaS generada:

Crear una plataforma llamada "${prompt}" enfocada en productividad, gestión visual y automatización.

Funciones clave:
• Dashboard principal
• Gestión de proyectos
• Tareas reales
• Analytics visuales
• Creator Studio
• Exportar/importar datos`;
  }

  if(type === "roadmap"){
    result = `🚀 Roadmap generado:

Fase 1: Definir objetivo del producto
Fase 2: Crear landing page
Fase 3: Construir dashboard
Fase 4: Agregar tareas reales
Fase 5: Mejorar UI/UX
Fase 6: Publicar en GitHub Pages
Fase 7: Presentarlo en LinkedIn`;
  }

  if(type === "tasks"){
    result = `✅ Tareas sugeridas:

1. Crear estructura del proyecto
2. Diseñar interfaz principal
3. Crear tareas reales
4. Agregar progreso por proyecto
5. Mejorar responsive
6. Exportar backup
7. Publicar online`;
  }

  if(type === "linkedin"){
    result = `🚀 Estoy desarrollando ${prompt}

Una plataforma web moderna para organizar proyectos, tareas, contenido y productividad.

Este proyecto combina JavaScript, diseño UI/UX, lógica frontend, localStorage y Firebase Auth.

#JavaScript #Firebase #Frontend #WebDevelopment #Developer`;
  }

  typeWriter(resultBox, result);
};

function typeWriter(element, text){
  element.innerText = "";
  let i = 0;

  const interval = setInterval(() => {
    element.innerText += text.charAt(i);
    i++;

    if(i >= text.length){
      clearInterval(interval);
    }
  }, 12);
}

/* BACKUP */

window.exportBackup = function(){
  const backup = {
    projects,
    contents,
    user: currentUser ? currentUser.email : ""
  };

  const data = JSON.stringify(backup, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "nexora-backup.json";
  a.click();

  URL.revokeObjectURL(url);
};

document.addEventListener("change", function(e){
  if(e.target.id !== "importFile") return;

  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(event){
    try{
      const data = JSON.parse(event.target.result);

      projects = data.projects || [];
      contents = data.contents || [];

      saveProjects();
      saveContents();

      renderAll();

      toast("Backup importado correctamente 🚀");
    }catch{
      alert("Archivo inválido");
    }
  };

  reader.readAsText(file);
});

/* DEMO */

window.loadDemoData = function(){
  projects = [
    {
      id: Date.now() + 1,
      name: "Nexora OS Lite",
      status: "Publicado",
      tasks: [
        { id: 1, text: "Crear dashboard", done: true },
        { id: 2, text: "Agregar Firebase Auth", done: true },
        { id: 3, text: "Publicar en GitHub Pages", done: true }
      ]
    },
    {
      id: Date.now() + 2,
      name: "Creator Studio",
      status: "En desarrollo",
      tasks: [
        { id: 4, text: "Diseñar calendario", done: true },
        { id: 5, text: "Generar ideas de contenido", done: false }
      ]
    },
    {
      id: Date.now() + 3,
      name: "Portfolio Futurista",
      status: "Idea",
      tasks: [
        { id: 6, text: "Crear landing", done: false },
        { id: 7, text: "Agregar animaciones", done: false }
      ]
    }
  ];

  contents = [
    { id: Date.now() + 4, title: "Post lanzamiento Nexora", status: "Idea" },
    { id: Date.now() + 5, title: "Video mostrando dashboard", status: "En producción" }
  ];

  saveProjects();
  saveContents();

  renderAll();

  toast("Demo cargada 🚀");
};

/* RENDER */

function renderAll(){
  renderDashboard();
  renderProjects();
  renderCreator();
}

/* START */

setupLoginUI();
window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if(loader){
      loader.style.display = "none";
    }
  }, 1200);
});

function toast(message){
  const toastBox = document.getElementById("toastBox");
  if(!toastBox) return;

  const div = document.createElement("div");
  div.className = "toast";
  div.innerText = message;

  toastBox.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 3000);
}