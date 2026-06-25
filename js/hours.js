
let editIndex = null; // índice da marcação a editar

function getTime() {
  const d = new Date();
  return d.toTimeString().slice(0,5);
}

// Arredonda entrada sempre para cima, mas só se não for múltiplo de 15
function roundStart(timeStr) {
  const [h,m] = timeStr.split(":").map(Number);
  let total = h * 60 + m;

  if (total % 15 === 0) return timeStr;

  total += (15 - (total % 15));
  return formatMinutes(total);
}

// Arredonda saída sempre para baixo, mas só se não for múltiplo de 15
function roundEnd(timeStr) {
  const [h,m] = timeStr.split(":").map(Number);
  let total = h * 60 + m;

  if (total % 15 === 0) return timeStr;

  total -= (total % 15);
  return formatMinutes(total);
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0");
}

function ensureTodayEntry() {
  const today = getToday();
  const userData = appData[currentUser];
  if (!userData.hours) userData.hours = [];
  let entry = userData.hours.find(e => e.date === today);
  if (!entry) {
    entry = { date: today };
    userData.hours.push(entry);
  }
  return entry;
}

function calcHours(e) {
  const toMinutes = t => {
    if (!t) return null;
    const [h,m] = t.split(":").map(Number);
    return h*60 + m;
  };

  const startM = toMinutes(e.start);
  const endM = toMinutes(e.end);
  const lunchOutM = toMinutes(e.lunchOut);
  const lunchInM = toMinutes(e.lunchIn);

  if (startM == null || endM == null) {
    e.totalHours = "0.00";
    e.extra = "0.00";
    return;
  }

  let total = endM - startM;

  // Desconta almoço apenas se ambos existirem
  if (lunchOutM != null && lunchInM != null) {
    total -= (lunchInM - lunchOutM);
  }

  if (total < 0) total = 0;

  const hours = total / 60;
  e.totalHours = hours.toFixed(2);

  // Extra em minutos
  const extraMinutes = Math.max(0, total - 480); // 8h = 480 min
  e.extra = (extraMinutes / 60).toFixed(2);
}

function clockIn() {
  const e = ensureTodayEntry();
  e.start = roundStart(getTime());
  saveDataToFirebase();
}

function lunchOut() {
  const e = ensureTodayEntry();
  e.lunchOut = getTime();
  saveDataToFirebase();
}

function lunchIn() {
  const e = ensureTodayEntry();
  e.lunchIn = getTime();
  saveDataToFirebase();
}

function clockOut() {
  const e = ensureTodayEntry();
  e.end = roundEnd(getTime());
  calcHours(e);
  saveDataToFirebase();
}

function manualEntry() {
  let start = document.getElementById("manualStart").value;
  let lunchOut = document.getElementById("manualLunchOut").value || null;
  let lunchIn = document.getElementById("manualLunchIn").value || null;
  let end = document.getElementById("manualEnd").value;

  if (!start || !end) return;

  start = roundStart(start);
  end = roundEnd(end);

  const entry = {
    date: getToday(),
    start,
    lunchOut,
    lunchIn,
    end
  };

  calcHours(entry);

  const userData = appData[currentUser];
  if (!userData.hours) userData.hours = [];

  const idx = userData.hours.findIndex(e => e.date === entry.date);
  if (idx >= 0) userData.hours[idx] = entry;
  else userData.hours.push(entry);

  saveDataToFirebase();

  document.getElementById("manualStart").value = "";
  document.getElementById("manualLunchOut").value = "";
  document.getElementById("manualLunchIn").value = "";
  document.getElementById("manualEnd").value = "";
}

// ---------- EDIÇÃO ----------

function openEdit(index) {
  editIndex = index;

  const userData = appData[currentUser];
  const e = userData.hours[index];

  document.getElementById("editStart").value = e.start || "";
  document.getElementById("editLunchOut").value = e.lunchOut || "";
  document.getElementById("editLunchIn").value = e.lunchIn || "";
  document.getElementById("editEnd").value = e.end || "";

  document.getElementById("editModal").style.display = "block";
}

function closeEdit() {
  editIndex = null;
  document.getElementById("editModal").style.display = "none";
}

function saveEdit() {
  const userData = appData[currentUser];
  const e = userData.hours[editIndex];

  let start = document.getElementById("editStart").value;
  let lunchOut = document.getElementById("editLunchOut").value || null;
  let lunchIn = document.getElementById("editLunchIn").value || null;
  let end = document.getElementById("editEnd").value;

  if (!start || !end) return;

  start = roundStart(start);
  end = roundEnd(end);

  e.start = start;
  e.lunchOut = lunchOut;
  e.lunchIn = lunchIn;
  e.end = end;

  calcHours(e);
  saveDataToFirebase();

  closeEdit();
}

function deleteEntry(index) {
  if (!confirm("Apagar esta marcação?")) return;

  const userData = appData[currentUser];
  userData.hours.splice(index, 1);

  saveDataToFirebase();
}

// ---------- LISTAGEM ----------

function refreshTimeTracking() {
  const div = document.getElementById("timeList");
  div.innerHTML = "";

  const userData = appData[currentUser];
  const entries = (userData.hours || []).slice()
    .sort((a,b) => (a.date || "").localeCompare(b.date || ""));

  let totalExtra = 0;

  const last7 = entries.slice(-7);

  last7.forEach((e, index) => {
    totalExtra += parseFloat(e.extra || 0);

    div.innerHTML += `
      <div class="list-item">
        <span>${e.date} — ${e.start || "--:--"} / ${e.end || "--:--"} — ${e.totalHours || 0}h (extra: ${e.extra || 0}h)</span>
        <span>
          <button class="secondary" onclick="openEdit(${entries.indexOf(e)})">✏️</button>
          <button class="secondary" onclick="deleteEntry(${entries.indexOf(e)})">🗑️</button>
        </span>
      </div>
    `;
  });

  entries.forEach(e => {
    totalExtra += parseFloat(e.extra || 0);
  });

  if (entries.length > 0) {
    div.innerHTML += `
      <div class="list-item" style="margin-top:12px;background:#ffeef2;">
        <strong>Total anual de horas extra: ${totalExtra.toFixed(2)}h</strong>
      </div>
    `;
  }
}
