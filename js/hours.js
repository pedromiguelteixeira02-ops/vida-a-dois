function getTime() {
  const d = new Date();
  return d.toTimeString().slice(0,5);
}

function ensureTodayEntry() {
  const today = getToday();
  if (!appData.timeTracking[currentUser]) {
    appData.timeTracking[currentUser] = [];
  }
  let entry = appData.timeTracking[currentUser].find(e => e.date === today);
  if (!entry) {
    entry = { date: today };
    appData.timeTracking[currentUser].push(entry);
  }
  return entry;
}

function calcHours(e) {
  const toMinutes = t => {
    const [h,m] = t.split(":").map(Number);
    return h*60 + m;
  };

  let total = 0;
  if (e.start && e.end) {
    total = toMinutes(e.end) - toMinutes(e.start);
  }
  if (e.lunchOut && e.lunchIn) {
    total -= (toMinutes(e.lunchIn) - toMinutes(e.lunchOut));
  }

  const hours = (total / 60).toFixed(2);
  e.totalHours = hours;
  e.extra = Math.max(0, hours - 8).toFixed(2);
}

function clockIn() {
  const e = ensureTodayEntry();
  e.start = getTime();
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
  e.end = getTime();
  calcHours(e);
  saveDataToFirebase();
}

function manualEntry() {
  const start = document.getElementById("manualStart").value;
  const lunchOut = document.getElementById("manualLunchOut").value;
  const lunchIn = document.getElementById("manualLunchIn").value;
  const end = document.getElementById("manualEnd").value;

  if (!start || !end) return;

  const entry = {
    date: getToday(),
    start,
    lunchOut,
    lunchIn,
    end
  };

  calcHours(entry);

  if (!appData.timeTracking[currentUser]) {
    appData.timeTracking[currentUser] = [];
  }

  const idx = appData.timeTracking[currentUser].findIndex(e => e.date === entry.date);
  if (idx >= 0) {
    appData.timeTracking[currentUser][idx] = entry;
  } else {
    appData.timeTracking[currentUser].push(entry);
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

  const entries = (appData.timeTracking && appData.timeTracking[currentUser]) || [];
  let totalExtra = 0;

  entries
    .slice()
    .sort((a,b) => (a.date || "").localeCompare(b.date || ""))
    .forEach(e => {
      totalExtra += parseFloat(e.extra || 0);

      div.innerHTML += `
        <div class="list-item">
          <span>${e.date} — ${e.totalHours || 0}h (extra: ${e.extra || 0}h)</span>
        </div>
      `;
    });

  if (entries.length > 0) {
    div.innerHTML += `
      <div class="list-item" style="margin-top:12px;background:#ffeef2;">
        <strong>Total anual de horas extra: ${totalExtra.toFixed(2)}h</strong>
      </div>
    `;
  }
}
