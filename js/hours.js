function getTime() {
  const d = new Date();
  return d.toTimeString().slice(0,5);
}

function roundStart(timeStr) {
  // arredonda sempre para cima de 15 em 15 minutos
  const [h,m] = timeStr.split(":").map(Number);
  let total = h * 60 + m;
  const remainder = total % 15;
  if (remainder !== 0) {
    total += (15 - remainder);
  }
  const rh = Math.floor(total / 60);
  const rm = total % 60;
  return String(rh).padStart(2,"0") + ":" + String(rm).padStart(2,"0");
}

function roundEnd(timeStr) {
  // arredonda sempre para baixo de 15 em 15 minutos
  const [h,m] = timeStr.split(":").map(Number);
  let total = h * 60 + m;
  const remainder = total % 15;
  total -= remainder;
  const rh = Math.floor(total / 60);
  const rm = total % 60;
  return String(rh).padStart(2,"0") + ":" + String(rm).padStart(2,"0");
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

  // Só subtrai almoço se ambos existirem
  if (lunchOutM != null && lunchInM != null) {
    total -= (lunchInM - lunchOutM);
  }

  if (total < 0) {
    e.totalHours = "0.00";
    e.extra = "0.00";
    return;
  }

  const hours = (total / 60).toFixed(2);
  e.totalHours = hours;
  e.extra = Math.max(0, hours - 8).toFixed(2);
}

function clockIn() {
  const e = ensureTodayEntry();
  const raw = getTime();
  e.start = roundStart(raw);
  saveDataToFirebase();
}

function lunchOut() {
  const e = ensureTodayEntry();
  e.lunchOut = getTime(); // almoço não precisa de arredondar
  saveDataToFirebase();
}

function lunchIn() {
  const e = ensureTodayEntry();
  e.lunchIn = getTime();
  saveDataToFirebase();
}

function clockOut() {
  const e = ensureTodayEntry();
  const raw = getTime();
  e.end = roundEnd(raw);
  calcHours(e);
  saveDataToFirebase();
}

function manualEntry() {
  let start = document.getElementById("manualStart").value;
  let lunchOut = document.getElementById("manualLunchOut").value || null;
  let lunchIn = document.getElementById("manualLunchIn").value || null;
  let end = document.getElementById("manualEnd").value;

  if (!start || !end) return;

  // aplicar arredondamentos também no manual
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
  if (idx >= 0) {
    userData.hours[idx] = entry;
  } else {
    userData.hours.push(entry);
  }

  saveDataToFirebase();

  document.getElementById("manualStart").value = "";
  document.getElementById("manualLunchOut").value = "";
  document.getElementById("manualLunchIn").value = "";
  document.getElementById("manualEnd").value = "";
}

function refreshTimeTracking() {
  const div = document.getElementById("timeList");
  div.innerHTML = "";

  const userData = appData[currentUser];
  const entries = (userData.hours || []).slice()
    .sort((a,b) => (a.date || "").localeCompare(b.date || ""));

  let totalExtra = 0;

  // últimos 7 dias detalhados
  const last7 = entries.slice(-7);

  last7.forEach(e => {
    totalExtra += parseFloat(e.extra || 0);

    div.innerHTML += `
      <div class="list-item">
        <span>${e.date} — ${e.start || "--:--"} / ${e.end || "--:--"} — ${e.totalHours || 0}h (extra: ${e.extra || 0}h)</span>
      </div>
    `;
  });

  // soma total de horas extra (ano inteiro)
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
