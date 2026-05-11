let projects = JSON.parse(localStorage.getItem("nexoraProjects")) || [];
let selectedProjectId = null;

function saveData(){
  localStorage.setItem("nexoraProjects", JSON.stringify(projects));
}

function showSection(id){
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  renderAll();
}

function createProject(){
  const name = document.getElementById("projectName").value.trim();
  const desc = document.getElementById("projectDesc").value.trim();

  if(!name || !desc){
    alert("Completá nombre y descripción");
    return;
  }

  const project = {
    id: Date.now(),
    name,
    desc,
    status: document.getElementById("projectStatus").value,
    priority: document.getElementById("projectPriority").value,
    date: document.getElementById("projectDate").value,
    github: document.getElementById("projectGithub").value,
    demo: document.getElementById("projectDemo").value,
    tasks: []
  };

  projects.unshift(project);
  saveData();

  document.querySelectorAll("#newProject input, #newProject textarea").forEach(i => i.value = "");
  showSection("projects");
}

function renderDashboard(){
  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc,p) => acc + p.tasks.length, 0);
  const completed = projects.reduce((acc,p) => acc + p.tasks.filter(t => t.status === "Completada").length, 0);
  const productivity = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;

  document.getElementById("totalProjects").innerText = totalProjects;
  document.getElementById("totalTasks").innerText = totalTasks;
  document.getElementById("productivity").innerText = productivity + "%";

  const latest = document.getElementById("latestProjects");
  latest.innerHTML = "";

  projects.slice(0,3).forEach(p => {
    latest.innerHTML += projectCardHTML(p);
  });
}

function renderProjects(){
  const grid = document.getElementById("projectsGrid");
  if(!grid) return;

  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const filter = document.getElementById("statusFilter")?.value || "Todos";

  grid.innerHTML = "";

  projects
    .filter(p => p.name.toLowerCase().includes(search))
    .filter(p => filter === "Todos" || p.status === filter)
    .forEach(p => grid.innerHTML += projectCardHTML(p));
}

function projectCardHTML(p){
  return `
    <div class="project-card">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="status">${p.status}</div>
      <div class="priority ${p.priority}">${p.priority}</div>
      ${p.date ? `<p class="deadline">⏳ ${p.date}</p>` : ""}
      <div class="actions">
        <button class="mini-btn" onclick="openProject(${p.id})">Abrir</button>
        ${p.github ? `<a href="${p.github}" target="_blank"><button class="mini-btn">GitHub</button></a>` : ""}
        ${p.demo ? `<a href="${p.demo}" target="_blank"><button class="mini-btn">Demo</button></a>` : ""}
        <button class="delete-btn" onclick="deleteProject(${p.id})">Eliminar</button>
      </div>
    </div>
  `;
}

function openProject(id){
  selectedProjectId = id;
  showSection("detail");
  renderDetail();
}

function renderDetail(){
  const p = projects.find(x => x.id === selectedProjectId);
  if(!p) return;

  document.getElementById("projectDetail").innerHTML = `
    <div class="project-detail">
      <h2>${p.name}</h2>
      <p>${p.desc}</p>
      <div class="status">${p.status}</div>
      <div class="priority ${p.priority}">${p.priority}</div>
      ${p.date ? `<p class="deadline">⏳ Fecha límite: ${p.date}</p>` : ""}

      <div class="actions">
        <input id="taskInput" placeholder="Nueva tarea...">
        <button class="glow-btn" onclick="addTask()">Agregar tarea</button>
      </div>

      <div class="ai-box">
        <h3>🤖 Nexora AI</h3>
        <div class="actions">
          <button class="mini-btn" onclick="generateAI('tareas')">Generar tareas</button>
          <button class="mini-btn" onclick="generateAI('roadmap')">Crear roadmap</button>
          <button class="mini-btn" onclick="generateAI('linkedin')">Post LinkedIn</button>
        </div>
        <div id="aiResult" class="ai-result"></div>
      </div>

      <div class="kanban">
        ${kanbanColumn("Pendiente", "⬜ Pendiente", p)}
        ${kanbanColumn("En progreso", "⚡ En progreso", p)}
        ${kanbanColumn("Completada", "✅ Completada", p)}
      </div>
    </div>
  `;

  setupDragAndDrop();
}

function kanbanColumn(status, title, project){
  const tasks = project.tasks.filter(t => t.status === status);

  return `
    <div class="kanban-column" data-status="${status}">
      <h3>${title}</h3>
      ${tasks.map(t => `
        <div class="task-card ${status === "Completada" ? "done" : ""}" draggable="true" data-id="${t.id}">
          <p>${t.text}</p>
          <div class="actions">
            <button class="delete-btn" onclick="deleteTask(${t.id})">X</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function addTask(){
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if(!text) return;

  const p = projects.find(x => x.id === selectedProjectId);
  p.tasks.push({
    id: Date.now(),
    text,
    status: "Pendiente"
  });

  saveData();
  renderDetail();
}

function deleteTask(taskId){
  const p = projects.find(x => x.id === selectedProjectId);
  p.tasks = p.tasks.filter(t => t.id !== taskId);
  saveData();
  renderDetail();
}

function deleteProject(id){
  if(!confirm("¿Eliminar proyecto?")) return;
  projects = projects.filter(p => p.id !== id);
  saveData();
  renderAll();
}

function setupDragAndDrop(){
  const tasks = document.querySelectorAll(".task-card");
  const columns = document.querySelectorAll(".kanban-column");
  let dragged = null;

  tasks.forEach(task => {
    task.addEventListener("dragstart", () => {
      dragged = task;
      task.style.opacity = ".5";
    });

    task.addEventListener("dragend", () => {
      task.style.opacity = "1";
    });
  });

  columns.forEach(col => {
    col.addEventListener("dragover", e => {
      e.preventDefault();
      col.classList.add("drag-over");
    });

    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));

    col.addEventListener("drop", () => {
      col.classList.remove("drag-over");

      const taskId = Number(dragged.dataset.id);
      const newStatus = col.dataset.status;

      const p = projects.find(x => x.id === selectedProjectId);
      const task = p.tasks.find(t => t.id === taskId);

      task.status = newStatus;
      saveData();
      renderDetail();
    });
  });
}

function generateAI(type){
  const p = projects.find(x => x.id === selectedProjectId);
  let text = "";

  if(type === "tareas"){
    text = `Tareas sugeridas para ${p.name}:\n1. Definir funciones principales\n2. Diseñar interfaz\n3. Crear estructura\n4. Programar lógica\n5. Probar errores\n6. Publicar online`;
  }

  if(type === "roadmap"){
    text = `Roadmap para ${p.name}:\nFase 1: MVP\nFase 2: Diseño premium\nFase 3: Funciones avanzadas\nFase 4: PWA\nFase 5: Lanzamiento en LinkedIn`;
  }

  if(type === "linkedin"){
    text = `🚀 Estoy trabajando en ${p.name}\n\n${p.desc}\n\nEste proyecto me ayuda a mejorar en desarrollo web, producto digital y organización de ideas.\n\n#WebDevelopment #JavaScript #Developer #Tech`;
  }

  document.getElementById("aiResult").innerText = text;
}

function exportData(){
  const data = JSON.stringify(projects, null, 2);
  const blob = new Blob([data], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "nexora-os-data.json";
  a.click();
}

function resetData(){
  if(confirm("¿Borrar todos los datos?")){
    projects = [];
    saveData();
    renderAll();
  }
}

function renderAll(){
  renderDashboard();
  renderProjects();
}

for(let i = 0; i < 80; i++){
  const p = document.createElement("span");
  p.style.left = Math.random() * 100 + "vw";
  p.style.animationDuration = (Math.random() * 10 + 5) + "s";
  p.style.opacity = Math.random();
  document.querySelector(".particles").appendChild(p);
}

renderAll();