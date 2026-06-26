let editEntryId = null; // usa ID em vez de índice para evitar desfasamentos

function getTime() {
  const d = new Date();
  return d.toTimeString().slice(0,5);
}

function roundStart(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  let total = h * 60 + m;
  if (total % 15 !== 0) total = Math.ceil(total / 15) * 15;
  return formatMinutes(total);
}

function roundEnd(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  let total = h * 60 + m;
  if (total % 15 !== 0) total = Math.floor(total / 15) * 15;
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
    entry = { id: Date.now().toString(), date: today };
    userData.hours.push(entry);
  }
  // Garante que tem ID
  if (!entry.id) entry.id = entry.date + "-" + Math.random().toString(36).slice(2,6);
  return entry;
}

function calcHours(e) {
  const toMinutes = t => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const startM    = toMinutes(e.start);
  const endM      = toMinutes(e.end);
  const lunchOutM = toMinutes(e.lunchOut);
  const lunchInM  = toMinutes(e.lunchIn);

  if (startM == null || endM == null) {
    e.totalHours = "0.00";
    e.extra      = "0.00";
    return;
  }

  let total = endM - startM;
  if (lunchOutM != null && lunchInM != null) total -= (lunchInM - lunchOutM);
  if (total < 0) total = 0;

  e.totalHours = (total / 60).toFixed(2);
  e.extra      = (Math.max(0, total - 480) / 60).toFixed(2);
}

function clockIn() {
  const e = ensureTodayEntry();
  e.start = roundStart(getTime());
  calcHours(e);
  saveDataToFirebase();
}

function lunchOut() {
  const e = ensureTodayEntry();
  e.lunchOut = getTime();
  calcHours(e);
  saveDataToFirebase();
}

function lunchIn() {
  const e = ensureTodayEntry();
  e.lunchIn = getTime();
  calcHours(e);
  saveDataToFirebase();
}

function clockOut() {
  const e = ensureTodayEntry();
  e.end = roundEnd(getTime());
  calcHours(e);
  saveDataToFirebase();
}

function manualEntry() {
  let start    = document.getElementById("manualStart").value;
  let lunchOut = document.getElementById("manualLunchOut").value || null;
  let lunchIn  = document.getElementById("manualLunchIn").value  || null;
  let end      = document.getElementById("manualEnd").value;

  if (!start || !end) return;

  start = roundStart(start);
  end   = roundEnd(end);

  const today    = getToday();
  const userData = appData[currentUser];
  if (!userData.hours) userData.hours = [];

  const idx = userData.hours.findIndex(e => e.date === today);
  const entry = {
    id: idx >= 0 ? (userData.hours[idx].id || today) : Date.now().toString(),
    date: today, start, lunchOut, lunchIn, end
  };
  calcHours(entry);

  if (idx >= 0) userData.hours[idx] = entry;
  else          userData.hours.push(entry);

  saveDataToFirebase();

  document.getElementById("manualStart").value    = "";
  document.getElementById("manualLunchOut").value = "";
  document.getElementById("manualLunchIn").value  = "";
  document.getElementById("manualEnd").value      = "";
}

function openEdit(entryId) {
  editEntryId = entryId;
  const userData = appData[currentUser];
  const e = userData.hours.find(h => (h.id || h.date) === entryId);
  if (!e) return;

  document.getElementById("editStart").value    = e.start    || "";
  document.getElementById("editLunchOut").value = e.lunchOut || "";
  document.getElementById("editLunchIn").value  = e.lunchIn  || "";
  document.getElementById("editEnd").value      = e.end      || "";

  document.getElementById("editModal").style.display = "block";
}

function closeEdit() {
  editEntryId = null;
  document.getElementById("editModal").style.display = "none";
}

function saveEdit() {
  const userData = appData[currentUser];
  const e = userData.hours.find(h => (h.id || h.date) === editEntryId);
  if (!e) return;

  let start    = document.getElementById("editStart").value;
  let lunchOut = document.getElementById("editLunchOut").value || null;
  let lunchIn  = document.getElementById("editLunchIn").value  || null;
  let end      = document.getElementById("editEnd").value;

  if (!start || !end) return;

  e.start    = roundStart(start);
  e.lunchOut = lunchOut;
  e.lunchIn  = lunchIn;
  e.end      = roundEnd(end);
  calcHours(e);

  saveDataToFirebase();
  closeEdit();
}

function deleteEntry(entryId) {
  if (!confirm("Apagar esta marcação?")) return;
  const userData = appData[currentUser];
  userData.hours = userData.hours.filter(h => (h.id || h.date) !== entryId);
  saveDataToFirebase();
}

function refreshTimeTracking() {
  const div      = document.getElementById("timeList");
  div.innerHTML  = "";

  const userData = appData[currentUser];
  const entries  = (userData.hours || []).slice()
    .sort((a,b) => (b.date || "").localeCompare(a.date || "")); // mais recentes primeiro

  if (entries.length === 0) {
    div.innerHTML = "<div class='helper'>Sem registos ainda.</div>";
    return;
  }

  let totalExtra = 0;
  entries.forEach(e => { totalExtra += parseFloat(e.extra || 0); });

  // Mostra últimos 10
  const show = entries.slice(0, 10);
  show.forEach(e => {
    const entryId = e.id || e.date;
    const lunch   = (e.lunchOut && e.lunchIn)
      ? ` | almoço ${e.lunchOut}–${e.lunchIn}` : "";
    div.innerHTML += `
      <div class="list-item">
        <span style="font-size:13px;">
          <b>${e.date}</b> — ${e.start || "--:--"} → ${e.end || "--:--"}${lunch}
          <span style="color:var(--primary);"> ${e.totalHours || "0.00"}h</span>
          ${parseFloat(e.extra||0) > 0 ? `<span style="color:#e67e22;"> (+${e.extra}h extra)</span>` : ""}
        </span>
        <span style="display:flex;gap:4px;">
          <button class="secondary" style="width:auto;padding:4px 8px;margin:0;" onclick="openEdit('${entryId}')">✏️</button>
          <button class="secondary" style="width:auto;padding:4px 8px;margin:0;" onclick="deleteEntry('${entryId}')">🗑️</button>
        </span>
      </div>`;
  });

  div.innerHTML += `
    <div class="list-item" style="margin-top:12px;background:#ffeef2;">
      <strong>Total anual de horas extra: ${totalExtra.toFixed(2)}h</strong>
    </div>`;
}
