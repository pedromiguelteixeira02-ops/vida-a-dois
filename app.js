/* ============================
   SISTEMA DE VIEWS
============================ */

function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "calendario") {
    renderCalendar();
  }
}

/* ============================
   CALENDÁRIO
============================ */

let currentDate = new Date();

/* Renderiza o calendário */
function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Título do mês
  document.getElementById("calendarTitle").textContent =
    currentDate.toLocaleString("pt", { month: "long", year: "numeric" });

  // Primeiro dia do mês
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay() === 0 ? 7 : firstDay.getDay();

  // Dias vazios antes do dia 1
  for (let i = 1; i < startDay; i++) {
    const div = document.createElement("div");
    div.className = "calendar-day other-month";
    grid.appendChild(div);
  }

  // Dias do mês
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const div = document.createElement("div");
    div.className = "calendar-day";
    div.textContent = d;

    // Marcar hoje
    const today = new Date();
    if (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      div.classList.add("today");
    }

    div.onclick = () => selectDay(d);
    grid.appendChild(div);
  }
}

/* Mês anterior */
function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

/* Próximo mês */
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

/* Selecionar dia */
function selectDay(day) {
  const list = document.getElementById("eventList");
  list.innerHTML = "";

  // Placeholder — depois ligamos ao Firebase
  const div = document.createElement("div");
  div.className = "list-item";
  div.textContent = "Sem eventos para este dia.";
  list.appendChild(div);
}

/* Adicionar evento */
function addEvent() {
  const text = document.getElementById("eventText").value;
  if (!text) return;

  // Placeholder — depois ligamos ao Firebase
  document.getElementById("eventText").value = "";
}

/* ============================
   INICIALIZAÇÃO
============================ */

window.onload = () => {
  renderCalendar();
};

/* ============================
   HORAS — JAVASCRIPT
============================ */

let horasRegistadas = []; // mais tarde podemos ligar ao Firebase

/* ENTRAR (registo automático) */
function clockIn() {
  localStorage.setItem("clockIn", new Date().toISOString());
  document.getElementById("estadoHoras").textContent = "Entrada registada.";
}

/* SAIR (registo automático) */
function clockOut() {
  const start = localStorage.getItem("clockIn");
  if (!start) {
    document.getElementById("estadoHoras").textContent = "Primeiro tens de clicar em ENTRAR.";
    return;
  }

  const inicio = new Date(start);
  const fim = new Date();
  const horas = (fim - inicio) / (1000 * 60 * 60);

  adicionarHoras(horas);
  document.getElementById("estadoHoras").textContent =
    `Hoje: ${horas.toFixed(2)}h`;

  localStorage.removeItem("clockIn");
}

/* REGISTO MANUAL */
function manualEntry() {
  const s = document.getElementById("manualStart").value;
  const e = document.getElementById("manualEnd").value;

  if (!s || !e) return;

  const inicio = new Date(`1970-01-01T${s}:00`);
  const fim = new Date(`1970-01-01T${e}:00`);
  const horas = (fim - inicio) / (1000 * 60 * 60);

  adicionarHoras(horas);
}

/* ADICIONAR AO HISTÓRICO */
function adicionarHoras(h) {
  const data = new Date().toLocaleDateString("pt-PT");
  horasRegistadas.push({ data, horas: h });

  atualizarListaHoras();
}

/* ATUALIZAR LISTA */
function atualizarListaHoras() {
  const lista = document.getElementById("horasLista");
  lista.innerHTML = "";

  horasRegistadas.forEach(item => {
    const div = document.createElement("div");
    div.className = "hora-item";
    div.textContent = `${item.data}: ${item.horas.toFixed(2)}h`;
    lista.appendChild(div);
  });
}

/* ============================
   LOGIN — JAVASCRIPT
============================ */

let currentUser = localStorage.getItem("user") || null;

/* LOGIN */
function login() {
  const user = document.getElementById("loginUser").value.trim();

  if (!user) {
    alert("Escreve o teu nome.");
    return;
  }

  // Guardar utilizador
  currentUser = user;
  localStorage.setItem("user", user);

  // Atualizar dashboard
  document.getElementById("usernameDisplay").textContent = currentUser;

  // Ir para o dashboard
  showView("dashboard");
}

/* MOSTRAR UTILIZADOR AO INICIAR */
window.onload = () => {
  if (currentUser) {
    document.getElementById("usernameDisplay").textContent = currentUser;
    showView("dashboard");
  } else {
    showView("login");
  }

  renderCalendar();
};

/* ============================
   DASHBOARD — JAVASCRIPT
============================ */

function atualizarDashboard() {
  // Nome do mês atual
  const mes = currentDate.toLocaleString("pt", { month: "long" });
  document.getElementById("dashMesAtual").textContent = mes;

  // Horas hoje
  const hoje = new Date().toLocaleDateString("pt-PT");
  const horasHoje = horasRegistadas
    .filter(h => h.data === hoje)
    .reduce((acc, h) => acc + h.horas, 0);

  document.getElementById("dashHorasHoje").textContent =
    horasHoje.toFixed(2) + "h";

  // Total de horas
  const totalHoras = horasRegistadas.reduce((acc, h) => acc + h.horas, 0);
  document.getElementById("dashHorasTotal").textContent =
    totalHoras.toFixed(2) + "h";

  // Eventos hoje (placeholder)
  document.getElementById("dashEventosHoje").textContent = 0;
}

/* Atualizar dashboard sempre que abrir */
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "calendario") renderCalendar();
  if (id === "dashboard") atualizarDashboard();
}

/* ============================
   PERFIL — JAVASCRIPT
============================ */

/* Guardar nome do perfil */
function guardarNome() {
  const novoNome = document.getElementById("perfilNome").value.trim();
  if (!novoNome) return;

  currentUser = novoNome;
  localStorage.setItem("user", novoNome);

  const spanUser = document.getElementById("usernameDisplay");
  if (spanUser) spanUser.textContent = currentUser;

  document.getElementById("perfilNome").value = "";
}

/* Guardar foto de perfil */
function guardarFoto() {
  const input = document.getElementById("perfilFoto");
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    localStorage.setItem("perfilFoto", dataUrl);
    atualizarFotoPerfil();
  };
  reader.readAsDataURL(file);
}

/* Atualizar preview da foto */
function atualizarFotoPerfil() {
  const fotoDiv = document.getElementById("perfilFotoPreview");
  const dataUrl = localStorage.getItem("perfilFoto");

  if (!fotoDiv) return;

  if (dataUrl) {
    fotoDiv.innerHTML = "";
    const img = document.createElement("img");
    img.src = dataUrl;
    fotoDiv.appendChild(img);
  } else {
    fotoDiv.innerHTML = "Sem foto";
  }
}

/* Mudar tema da app */
function mudarTema(tema) {
  if (tema === "dark") {
    document.body.classList.add("dark-theme");
    localStorage.setItem("tema", "dark");
  } else {
    document.body.classList.remove("dark-theme");
    localStorage.setItem("tema", "light");
  }
}

/* Aplicar tema ao iniciar */
function aplicarTemaInicial() {
  const tema = localStorage.getItem("tema") || "light";
  if (tema === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
}

/* Ajustar window.onload existente (se ainda não ajustaste) */
window.onload = () => {
  aplicarTemaInicial();
  atualizarFotoPerfil();

  if (currentUser) {
    const spanUser = document.getElementById("usernameDisplay");
    if (spanUser) spanUser.textContent = currentUser;
    showView("dashboard");
  } else {
    showView("login");
  }

  renderCalendar();
  atualizarDashboard && atualizarDashboard();
};
