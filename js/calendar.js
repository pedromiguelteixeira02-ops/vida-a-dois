let currentMonth = new Date().getMonth();
let currentYear  = new Date().getFullYear();
let selectedDate = null;

// ── Utilitários ──────────────────────────────────────────────
function countWorkdays(startStr, endStr) {
  const start = new Date(startStr + "T00:00:00");
  const end   = new Date(endStr   + "T00:00:00");
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function dateToStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

// ── Adicionar evento(s) ──────────────────────────────────────
// Suporta múltiplas datas separadas por vírgula no campo "De"
// e opcionalmente um intervalo "Até" (só para férias)
function addCalendarEvent() {
  const type  = document.getElementById("eventType").value;
  const notes = document.getElementById("eventNotes").value.trim();

  if (!type) return;

  // Campo "De" pode ter várias datas: "2025-07-09, 2025-07-15"
  const rawFrom = document.getElementById("eventDateFrom").value.trim();
  const dateTo  = document.getElementById("eventDateTo").value.trim();

  if (!rawFrom) return;

  // Separa por vírgula e limpa espaços
  const dates = rawFrom.split(",").map(s => s.trim()).filter(Boolean);

  dates.forEach(dateFrom => {
    // Para férias usa o "Até"; para outros tipos ignora
    const effectiveTo = (type === "ferias" && dateTo) ? dateTo : dateFrom;

    const event = {
      id: Date.now().toString() + Math.random().toString(36).slice(2,6),
      type,
      dateFrom,
      dateTo: effectiveTo,
      date: dateFrom,   // retrocompatibilidade
      notes,
      by: currentUser
    };

    if (type === "ferias") {
      const days = countWorkdays(dateFrom, effectiveTo);
      const userData = appData[currentUser];
      userData.vacationLeft = Math.max(0, (userData.vacationLeft || 0) - days);
      event.vacationDays = days;
    }

    appData.shared.calendar.push(event);
  });

  saveDataToFirebase();

  document.getElementById("eventDateFrom").value = "";
  document.getElementById("eventDateTo").value   = "";
  document.getElementById("eventNotes").value    = "";
  document.getElementById("eventType").value     = "evento";
  updateEventFields();
}

function deleteCalendarEvent(id) {
  const ev = appData.shared.calendar.find(e => e.id === id);
  if (!ev) return;
  if (!confirm("Apagar este evento?")) return;

  if (ev.type === "ferias") {
    const userData = appData[ev.by];
    const days = ev.vacationDays || countWorkdays(ev.dateFrom || ev.date, ev.dateTo || ev.date);
    userData.vacationLeft = (userData.vacationLeft || 0) + days;
  }

  appData.shared.calendar = appData.shared.calendar.filter(e => e.id !== id);
  saveDataToFirebase();
}

// ── Navegação ─────────────────────────────────────────────────
function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  else if (currentMonth > 11) { currentMonth = 0;  currentYear++; }
  renderCalendar();
}

// ── Render ────────────────────────────────────────────────────
function renderCalendar() {
  if (!appData) return;

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                      "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  document.getElementById("calendarMonthLabel").textContent =
    monthNames[currentMonth] + " " + currentYear;

  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const daysInMonth     = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth,     0).getDate();
  const firstDow        = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset     = (firstDow + 6) % 7; // seg=0 … dom=6

  // ── Mapeia eventos para cada dia do calendário ─────────────
  // Usa strings YYYY-MM-DD geradas sem conversão de timezone
  const eventDates = {};

  appData.shared.calendar.forEach(ev => {
    const fromStr = ev.dateFrom || ev.date;
    const toStr   = ev.dateTo   || ev.date;
    if (!fromStr) return;

    // Itera dia a dia com aritmética de strings para evitar timezone drift
    let [fy, fm, fd] = fromStr.split("-").map(Number);
    let [ty, tm, td] = toStr.split("-").map(Number);

    const fromNum = fy * 10000 + fm * 100 + fd;
    const toNum   = ty * 10000 + tm * 100 + td;

    // Percorre cada dia do evento
    let cur = new Date(fy, fm - 1, fd);
    while (true) {
      const ds = dateToStr(cur);
      const [cy, cm, cd] = ds.split("-").map(Number);
      const curNum = cy * 10000 + cm * 100 + cd;
      if (curNum > toNum) break;

      if (!eventDates[ds]) eventDates[ds] = [];
      eventDates[ds].push(ev);
      cur.setDate(cur.getDate() + 1);
    }
  });

  const todayStr    = dateToStr(new Date());
  const selectedStr = selectedDate ? dateToStr(selectedDate) : null;

  // Dias do mês anterior
  for (let i = 0; i < startOffset; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day other-month";
    cell.textContent = daysInPrevMonth - startOffset + 1 + i;
    grid.appendChild(cell);
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = currentYear + "-" +
      String(currentMonth + 1).padStart(2,"0") + "-" +
      String(d).padStart(2,"0");

    const cell = document.createElement("div");
    cell.className = "calendar-day";
    if (dateStr === todayStr)    cell.classList.add("today");
    if (dateStr === selectedStr) cell.classList.add("selected");

    const numSpan = document.createElement("div");
    numSpan.textContent = d;
    cell.appendChild(numSpan);

    if (eventDates[dateStr] && eventDates[dateStr].length > 0) {
      const dot = document.createElement("div");
      dot.className = "calendar-dot";
      // Cor diferente por tipo
      const firstType = eventDates[dateStr][0].type;
      if (firstType === "ferias")     dot.style.background = "#e67e22";
      if (firstType === "aniversario") dot.style.background = "#8e44ad";
      cell.appendChild(dot);
    }

    cell.onclick = () => {
      selectedDate = new Date(currentYear, currentMonth, d);
      renderCalendar();
    };

    grid.appendChild(cell);
  }

  // Dias do próximo mês
  const totalCells = startOffset + daysInMonth;
  const remaining  = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day other-month";
    cell.textContent = i;
    grid.appendChild(cell);
  }

  // ── Eventos do dia selecionado ─────────────────────────────
  const selectedEventsDiv = document.getElementById("selectedDayEvents");
  selectedEventsDiv.innerHTML = "";

  if (selectedStr && eventDates[selectedStr]) {
    const seen = new Set();
    const evs  = eventDates[selectedStr]
      .filter(ev => { if (seen.has(ev.id)) return false; seen.add(ev.id); return true; })
      .sort((a,b) => a.type.localeCompare(b.type));

    evs.forEach(ev => {
      const who   = ev.by === "barbara" ? "Bárbara" : "Pedro";
      const label = ev.type === "aniversario" ? "🎂 Aniversário"
                  : ev.type === "ferias"       ? "🌴 Férias"
                  : "📌 Evento";
      const range = (ev.dateTo && ev.dateTo !== ev.dateFrom)
        ? ` (${ev.dateFrom} → ${ev.dateTo})`
        : "";

      const div = document.createElement("div");
      div.className = "event-item";
      div.innerHTML = `
        <div>${label}${range} — ${ev.notes || "(sem descrição)"} (${who})</div>
        <div style="margin-top:4px;">
          <button class="secondary" onclick="deleteCalendarEvent('${ev.id}')">Apagar</button>
        </div>`;
      selectedEventsDiv.appendChild(div);
    });
  } else {
    selectedEventsDiv.innerHTML = "<div class='helper'>Sem eventos neste dia.</div>";
  }

  // ── Próximos 30 dias ───────────────────────────────────────
  const upcomingDiv = document.getElementById("upcomingEvents");
  upcomingDiv.innerHTML = "";
  const now   = new Date(); now.setHours(0,0,0,0);
  const limit = new Date(now); limit.setDate(limit.getDate() + 30);

  const upcoming = appData.shared.calendar.filter(ev => {
    const from = new Date((ev.dateFrom || ev.date) + "T00:00:00");
    const to   = new Date((ev.dateTo   || ev.date) + "T00:00:00");
    return to >= now && from <= limit;
  }).sort((a,b) => (a.dateFrom||a.date).localeCompare(b.dateFrom||b.date));

  if (upcoming.length === 0) {
    upcomingDiv.innerHTML = "<div class='helper'>Sem eventos nos próximos 30 dias.</div>";
  } else {
    const seen = new Set();
    upcoming
      .filter(ev => { if (seen.has(ev.id)) return false; seen.add(ev.id); return true; })
      .forEach(ev => {
        const who   = ev.by === "barbara" ? "Bárbara" : "Pedro";
        const label = ev.type === "aniversario" ? "🎂" : ev.type === "ferias" ? "🌴" : "📌";
        const range = (ev.dateTo && ev.dateTo !== ev.dateFrom)
          ? `${ev.dateFrom} → ${ev.dateTo}`
          : (ev.dateFrom || ev.date);
        const div = document.createElement("div");
        div.className = "event-item";
        div.textContent = `${range} — ${label} ${ev.notes || ""} (${who})`;
        upcomingDiv.appendChild(div);
      });
  }
}

function refreshCalendar() {
  renderCalendar();
}
