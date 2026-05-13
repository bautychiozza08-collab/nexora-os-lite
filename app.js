// =========================
// ELEMENTOS
// =========================

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const generateBtn = document.getElementById("generateIdea");
const createProjectBtn = document.getElementById("createProjectBtn");

const projectInput = document.getElementById("projectInput");
const projectsList = document.getElementById("projectsList");

const projectCount = document.getElementById("projectCount");
const tasksCount = document.getElementById("tasksCount");
const productivityCount = document.getElementById("productivityCount");
const creatorCount = document.getElementById("creatorCount");

let projects = JSON.parse(localStorage.getItem("nexoraProjects")) || [];

// =========================
// LOGIN
// =========================

function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Completá email y contraseña.");
    return;
  }

  localStorage.setItem("nexoraUser", email);

  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  renderAll();
}

function register() {
  alert("Cuenta creada correctamente 🚀");
  login();
}

function logoutLocal() {
  localStorage.removeItem("nexoraUser");
  location.reload();
}

// =========================
// AUTO LOGIN
// =========================

window.addEventListener("load", () => {
  const user = localStorage.getItem("nexoraUser");

  if (user) {
    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    renderAll();
  }
});

// =========================
// SECCIONES
// =========================

function showSection(section) {
  const dashboard = document.getElementById("dashboardSection");
  const projectsSection = document.getElementById("projectsSection");
  const creator = document.getElementById("creatorSection");

  dashboard.classList.add("hidden");
  projectsSection.classList.add("hidden");
  creator.classList.add("hidden");

  if (section === "dashboard") dashboard.classList.remove("hidden");
  if (section === "projects") projectsSection.classList.remove("hidden");
  if (section === "creator") creator.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(`[data-section="${section}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  renderAll();
}

window.showSection = showSection;

// =========================
// SIDEBAR
// =========================

document.addEventListener("click", (e) => {
  const navBtn = e.target.closest(".nav-btn");

  if (!navBtn) return;

  const section = navBtn.dataset.section;
  const action = navBtn.dataset.action;

  if (section) {
    showSection(section);
  }

  if (action === "export") {
    exportBackup();
  }

  if (action === "logout") {
    logoutLocal();
  }
});

// =========================
// PROYECTOS
// =========================

function saveProjects() {
  localStorage.setItem("nexoraProjects", JSON.stringify(projects));
}

function addProject() {
  const name = projectInput.value.trim();

  if (!name) {
    alert("Escribí un nombre para el proyecto.");
    return;
  }

  const project = {
    id: Date.now(),
    name,
    status: "Idea",
    tasks: []
  };

  projects.push(project);
  projectInput.value = "";

  saveProjects();
  renderAll();
}

function deleteProject(id) {
  projects = projects.filter(project => project.id !== id);
  saveProjects();
  renderAll();
}

function addTask(projectId) {
  const input = document.getElementById(`taskInput-${projectId}`);
  const text = input.value.trim();

  if (!text) return;

  const project = projects.find(p => p.id === projectId);

  project.tasks.push({
    id: Date.now(),
    text,
    done: false
  });

  saveProjects();
  renderAll();
}

function toggleTask(projectId, taskId) {
  const project = projects.find(p => p.id === projectId);
  const task = project.tasks.find(t => t.id === taskId);

  task.done = !task.done;

  saveProjects();
  renderAll();
}

function deleteTask(projectId, taskId) {
  const project = projects.find(p => p.id === projectId);

  project.tasks = project.tasks.filter(t => t.id !== taskId);

  saveProjects();
  renderAll();
}

function renderProjects() {
  if (!projectsList) return;

  projectsList.innerHTML = "";

  if (projects.length === 0) {
    projectsList.innerHTML = `
      <div class="project-card">
        <h3>🚀 Sin proyectos</h3>
        <p>Creá tu primer proyecto para empezar.</p>
      </div>
    `;
    return;
  }

  projects.forEach(project => {
    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter(task => task.done).length;
    const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    projectsList.innerHTML += `
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
          <button class="mini-btn" onclick="addTask(${project.id})">Agregar</button>
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

        <button class="delete-btn" onclick="deleteProject(${project.id})">
          Eliminar proyecto
        </button>
      </div>
    `;
  });
}

window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.deleteProject = deleteProject;

// =========================
// DASHBOARD
// =========================

function renderDashboard() {
  const totalProjects = projects.length;

  const totalTasks = projects.reduce((acc, project) => {
    return acc + project.tasks.length;
  }, 0);

  const completedTasks = projects.reduce((acc, project) => {
    return acc + project.tasks.filter(task => task.done).length;
  }, 0);

  const productivity = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  if (projectCount) projectCount.innerText = totalProjects;
  if (tasksCount) tasksCount.innerText = totalTasks;
  if (productivityCount) productivityCount.innerText = productivity + "%";
  if (creatorCount) creatorCount.innerText = "3";
}

// =========================
// IA REAL
// =========================

async function generateAIResponse(customPrompt = null) {
  const input = document.getElementById("aiInput");
  const result = document.getElementById("aiResult");

  if (!input || !result) return;

  const prompt = customPrompt || input.value.trim();

  if (!prompt) {
    result.innerHTML = `
      <div class="ai-card">
        <h3>⚠️ Falta una idea</h3>
        <p>Escribí algo para que Nexora AI pueda ayudarte.</p>
      </div>
    `;
    return;
  }

  input.value = prompt;

  result.innerHTML = `
    <div class="ai-card">
      <h3>🤖 Nexora AI</h3>
      <p>Generando respuesta...</p>
    </div>
  `;

  try {
    const response = await fetch("https://nexora-ai-api.vercel.app/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    result.innerHTML = `
      <div class="ai-card">
        <h3>🚀 Resultado IA</h3>
        <div class="ai-text">${data.text || "No pude generar respuesta."}</div>
      </div>
    `;
  } catch (error) {
    result.innerHTML = `
      <div class="ai-card">
        <h3>❌ Error</h3>
        <p>Error conectando IA.</p>
      </div>
    `;
  }
}

// =========================
// CREATOR STUDIO CON IA
// =========================

document.addEventListener("click", async (e) => {
  const card = e.target.closest(".creator-card");
  if (!card) return;

  const type = card.dataset.creator;
  const userIdea = document.getElementById("creatorPrompt").value.trim();

  if (!userIdea) {
    alert("Escribí primero sobre qué querés generar contenido.");
    return;
  }

  let prompt = "";

  if (type === "linkedin") {
    prompt = `Generá un post profesional para LinkedIn sobre: ${userIdea}. Que sea vendedor, claro, humano, con emojis moderados y hashtags.`;
  }

  if (type === "shorts") {
    prompt = `Generá 5 ideas de videos cortos para TikTok, Reels y YouTube Shorts sobre: ${userIdea}. Incluí gancho inicial, idea del video y cierre.`;
  }

  if (type === "branding") {
    prompt = `Generá branding completo para: ${userIdea}. Incluí nombre, slogan, propuesta de valor, colores, tono de marca y descripción corta.`;
  }

  showSection("dashboard");

  await generateAIResponse(prompt);
});

// =========================
// EXPORTAR
// =========================

function exportBackup() {
  const data = {
    user: localStorage.getItem("nexoraUser"),
    projects
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "nexora-backup.json";
  a.click();
}

window.exportBackup = exportBackup;
window.logoutLocal = logoutLocal;

// =========================
// EVENTOS
// =========================

if (loginBtn) loginBtn.addEventListener("click", login);
if (registerBtn) registerBtn.addEventListener("click", register);
if (generateBtn) generateBtn.addEventListener("click", () => generateAIResponse());
if (createProjectBtn) createProjectBtn.addEventListener("click", addProject);

// =========================
// RENDER
// =========================

function renderAll() {
  renderDashboard();
  renderProjects();
}