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

/* LOGIN UI */

function setupLoginUI(){
  const loginCard = document.querySelector(".login-card");
  if(!loginCard) return;

  loginCard.innerHTML = `
    <h1>NEXORA<span> OS</span></h1>
    <p>Iniciá sesión o registrate para guardar tu workspace.</p>

    <input id="authEmail" type="email" placeholder="Email">
    <input id="authPassword" type="password" placeholder="Contraseña">

    <button class="glow-btn" onclick="loginFirebase()">Entrar</button>
    <button class="mini-btn" onclick="registerFirebase()">Crear cuenta</button>
  `;
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
      projects: [],
      contents: [],
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

window.registerFirebase = async function(){
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();

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
};

window.loginFirebase = async function(){
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();

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
};

window.logoutLocal = async function(){
  await signOut(auth);
  location.reload();
};

onAuthStateChanged(auth, async user => {
  const loginScreen = document.getElementById("loginScreen");
  const app = document.getElementById("app");

  if(user){
    currentUser = user;

    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");

    await loadUserData();

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

/* SECTIONS */

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

/* PROJECTS */

window.addProject = async function(){
  const nameInput = document.getElementById("projectName");
  const statusInput = document.getElementById("projectStatus");

  const name = nameInput.value.trim();
  const status = statusInput.value;

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

  await saveCloudData();

  nameInput.value = "";

  renderAll();
  toast("Proyecto creado 🚀");
};

window.deleteProject = async function(id){
  projects = projects.filter(project => project.id !== id);
  await saveCloudData();
  renderAll();
  toast("Proyecto eliminado");
};

window.addTask = async function(projectId){
  const input = document.getElementById(`taskInput-${projectId}`);
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
};

window.toggleTask = async function(projectId, taskId){
  const project = projects.find(p => p.id === projectId);
  if(!project) return;

  const task = project.tasks.find(t => t.id === taskId);
  if(!task) return;

  task.done = !task.done;

  await saveCloudData();
  renderAll();
};

window.deleteTask = async function(projectId, taskId){
  const project = projects.find(p => p.id === projectId);
  if(!project) return;

  project.tasks = project.tasks.filter(t => t.id !== taskId);

  await saveCloudData();
  renderAll();
  toast("Tarea eliminada");
};

function renderProjects(){
  const container = document.getElementById("projectsContainer");
  if(!container) return;

  const search = document.getElementById("projectSearch")?.value.toLowerCase() || "";
  const filter = document.getElementById("projectFilter")?.value || "Todos";

  const filteredProjects = projects
    .filter(project => project.name.toLowerCase().includes(search))
    .filter(project => filter === "Todos" || project.status === filter);

  container.innerHTML = "";

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

window.addContent = async function(){
  const input = document.getElementById("contentTitle");
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

  await saveCloudData();

  input.value = "";

  renderAll();
  toast("Idea guardada 🎬");
};

window.deleteContent = async function(id){
  contents = contents.filter(content => content.id !== id);
  await saveCloudData();
  renderAll();
  toast("Idea eliminada");
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

/* AI */

window.runNexoraAI = function(type){
  const promptInput = document.getElementById("aiPrompt");
  const resultBox = document.getElementById("aiResultBox");

  if(!promptInput || !resultBox) return;

  const prompt = promptInput.value.trim();

  if(!prompt){
    toast("Escribí una idea primero");
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
• Exportar/importar datos
• Firebase Cloud Sync`;
  }

  if(type === "roadmap"){
    result = `🚀 Roadmap generado:

Fase 1: Definir objetivo del producto
Fase 2: Crear landing page
Fase 3: Construir dashboard
Fase 4: Agregar tareas reales
Fase 5: Guardar en Firestore
Fase 6: Mejorar UI/UX
Fase 7: Publicar en GitHub Pages
Fase 8: Presentarlo en LinkedIn`;
  }

  if(type === "tasks"){
    result = `✅ Tareas sugeridas:

1. Crear estructura del proyecto
2. Diseñar interfaz principal
3. Crear tareas reales
4. Agregar progreso por proyecto
5. Guardar datos en Firestore
6. Mejorar responsive
7. Publicar online`;
  }

  if(type === "linkedin"){
    result = `🚀 Estoy desarrollando ${prompt}

Una plataforma web moderna para organizar proyectos, tareas, contenido y productividad.

Este proyecto combina JavaScript, diseño UI/UX, Firebase Auth, Firestore y una experiencia visual tipo SaaS.

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

  toast("Backup exportado 📦");
};

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

window.loadDemoData = async function(){
  projects = [
    {
      id: Date.now() + 1,
      name: "Nexora OS Lite",
      status: "Publicado",
      tasks: [
        { id: 1, text: "Crear dashboard", done: true },
        { id: 2, text: "Agregar Firebase Auth", done: true },
        { id: 3, text: "Conectar Firestore", done: true },
        { id: 4, text: "Publicar en GitHub Pages", done: true }
      ]
    },
    {
      id: Date.now() + 2,
      name: "Creator Studio",
      status: "En desarrollo",
      tasks: [
        { id: 5, text: "Diseñar calendario", done: true },
        { id: 6, text: "Generar ideas de contenido", done: false }
      ]
    },
    {
      id: Date.now() + 3,
      name: "Portfolio Futurista",
      status: "Idea",
      tasks: [
        { id: 7, text: "Crear landing", done: false },
        { id: 8, text: "Agregar animaciones", done: false }
      ]
    }
  ];

  contents = [
    { id: Date.now() + 4, title: "Post lanzamiento Nexora", status: "Idea" },
    { id: Date.now() + 5, title: "Video mostrando dashboard", status: "En producción" }
  ];

  await saveCloudData();

  renderAll();

  toast("Demo cargada 🚀");
};

/* TOAST */

function toast(message){
  const toastBox = document.getElementById("toastBox");
  if(!toastBox){
    console.log(message);
    return;
  }

  const div = document.createElement("div");
  div.className = "toast";
  div.innerText = message;

  toastBox.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 3000);
}

/* LOADER */

window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if(loader){
      loader.classList.add("hidden");
      loader.style.display = "none";
    }
  }, 1200);
});

/* RENDER */

function renderAll(){
  renderDashboard();
  renderProjects();
  renderCreator();
}

/* START */

setupLoginUI();