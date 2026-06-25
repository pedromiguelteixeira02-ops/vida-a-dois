function toggleSidebar(open) {
  const sb = document.getElementById("sidebar");
  const bd = document.getElementById("sidebarBackdrop");
  if (open) { sb.classList.add("open"); bd.classList.add("open"); }
  else       { sb.classList.remove("open"); bd.classList.remove("open"); }
}

function setView(name) {
  toggleSidebar(false);
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const view = document.getElementById("view-" + name);
  if (view) view.classList.add("active");

  document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
  const nav = document.getElementById("nav-" + name);
  if (nav) nav.classList.add("active");

  if (name === "calendario")   renderCalendar();
  if (name === "dashboard")    refreshDashboard();
  if (name === "wallet")       refreshWallet();
}

function setUser(user) {
  currentUser = user;
  const label  = document.getElementById("currentUserLabel");
  const avatar = document.getElementById("avatarCircle");
  const info   = document.getElementById("userInfo");

  if (user === "pedro") {
    label.textContent  = "Pedro";
    avatar.textContent = "P";
  } else {
    label.textContent  = "Bárbara";
    avatar.textContent = "B";
  }

  info.textContent = "Sessão atual: " + (user === "pedro" ? "Pedro" : "Bárbara");
  setView("dashboard");
}

function refreshAll() {
  refreshCalendar();
  refreshShopping();
  refreshExpenses();
  refreshVacation();
  refreshTimeTracking();
  refreshJointPlan();
  refreshDashboard();
  refreshWallet();
}

async function init() {
  setUser("pedro");
  setView("perfil");
  appData = await loadDataFromFirebase();
  refreshAll();
  listenRealtime();
}

init();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .catch(err => console.log("SW erro:", err));
  });
}
