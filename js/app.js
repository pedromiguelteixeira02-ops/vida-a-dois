function toggleSidebar(open) {
  const sb = document.getElementById("sidebar");
  const bd = document.getElementById("sidebarBackdrop");
  if (open) {
    sb.classList.add("open");
    bd.classList.add("open");
  } else {
    sb.classList.remove("open");
    bd.classList.remove("open");
  }
}

function setView(name) {
  toggleSidebar(false);
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const view = document.getElementById("view-" + name);
  if (view) view.classList.add("active");

  document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
  const nav = document.getElementById("nav-" + name);
  if (nav) nav.classList.add("active");

  if (name === "calendario") renderCalendar();
  if (name === "dashboard") refreshDashboard();
}

function setUser(user) {
  currentUser = user;
  const label = document.getElementById("currentUserLabel");
  const avatar = document.getElementById("avatarCircle");
  const info = document.getElementById("userInfo");

  if (user === "pedro") {
    label.textContent = "Pedro";
    avatar.textContent = "P";
  } else {
    label.textContent = "Bárbara";
    avatar.textContent = "B";
  }

  info.textContent = "Sessão atual: " + (user === "pedro" ? "Pedro" : "Bárbara");
  setView("dashboard");
}

function refreshUserInfo() {
  const vac = appData.vacationDays || { pedro:0, barbara:0 };
  document.getElementById("vacPedro").value = vac.pedro || 0;
  document.getElementById("vacBarbara").value = vac.barbara || 0;
}

function refreshAll() {
  refreshUserInfo();
  refreshCalendar();
  refreshShopping();
  refreshExpenses();
  refreshVacation();
  refreshTimeTracking();
  refreshJointPlan();
  refreshDashboard();
}

async function init() {
  setUser("pedro");
  setView("perfil");
  appData = await loadDataFromFirebase();
  refreshAll();
  listenRealtime();
}

// Iniciar app
init();

// REGISTO DO SERVICE WORKER
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .catch(err => console.log("SW erro:", err));
  });
}
