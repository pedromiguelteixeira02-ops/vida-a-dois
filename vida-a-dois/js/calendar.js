let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date();

function addCalendarEvent() {
  const type = document.getElementById("eventType").value;
  const date = document.getElementById("eventDate").value;
  const notes = document.getElementById("eventNotes").value;

  if (!type || !date) return;

  const event = {
    id: Date.now().toString(),
    type,       // "evento", "aniversario", "ferias"
    date,
    notes,
    by: currentUser
  };

  // Férias abatem automaticamente
  if (type === "ferias") {
    const userData = appData[currentUser];
    userData.vacationLeft = Math.max(0, (userData.vacationLeft || 0) - 1);
  }

  appData.shared.calendar.push(event);
  saveDataToFirebase();

  document.getElementById("eventDate").value = "";
  document.getElementById("eventNotes").value = "";
  document.getElementById("eventType").value = "evento";
}

function editCalendarEvent(id) {
  const ev = appData.shared.calendar.find(e => e.id === id);
  if (!ev) return;

  const newType = prompt("Tipo (evento/aniversario/ferias):", ev.type) || ev.type;
  const newDate = prompt("Data (AAAA-MM-DD):", ev.date) || ev.date;
  const newNotes = prompt("Observações:", ev.notes || "") || ev.notes;

  // Ajustar férias se mudou tipo
  if (ev.type === "ferias" && newType !== "ferias") {
    const userData = appData[ev.by];
    userData.vacationLeft = (userData.vacationLeft || 0) + 1;
  }
  if (ev.type !== "ferias" && newType === "ferias") {
    const userData = appData[ev.by];
    userData.vacationLeft = Math.max(0, (userData.vacationLeft || 0) - 1);
  }

  ev.type = newType;
  ev.date = newDate;
  ev.notes = newNotes;

  saveDataToFirebase();
}

function deleteCalendarEvent(id) {
  const ev = appData.shared.calendar.find(e => e.id === id);
  if (!ev) return;

  if (!confirm("Apagar este evento?")) return;

  // Se era férias, devolve 1 dia
  if (ev.type === "ferias") {
    const userData = appData[ev.by];
    userData.vacationLeft = (userData.vacationLeft || 0) + 1;
  }

  appData.shared.calendar = appData.shared.calendar.filter(e => e.id !== id);
  saveDataToFirebase();
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  if (!appData) return;
  const monthLabel = document.getElementById("calendarMonthLabel");
  const grid = document.getElementById("calendarGrid");
  const selectedEventsDiv = document.getElementById("selectedDayEvents");
  const upcomingDiv = document.getElementById("upcomingEvents");

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  monthLabel.textContent = monthNames[currentMonth] + " " + currentYear;

  grid.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startWeekDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const eventsByDate = {};
  appData.shared.calendar.forEach(ev => {
    if (!ev.date) return;
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const selectedStr = selectedDate.toISOString().split("T")[0];

  // Dias do mês anterior
  for (let i = 0; i < startWeekDay; i++) {
    const dayNum = daysInPrevMonth - startWeekDay + 1 + i;
    const cell = document.createElement("div");
    cell.className = "calendar-day other-month";
    cell.textContent = dayNum;
    grid.appendChild(cell);
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(currentYear, currentMonth, d);
    const dateStr = cellDate.toISOString().split("T")[0];
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    if (dateStr === todayStr) cell.classList.add("today");
    if (dateStr === selectedStr) cell.classList.add("selected");

    const numSpan = document.createElement("div");
    numSpan.textContent = d;
    cell.appendChild(numSpan);

    if (eventsByDate[dateStr]) {
      const dot = document.createElement("div");
      dot.className = "calendar-dot";
      cell.appendChild(dot);
    }

    cell.onclick = () => {
      selectedDate = cellDate;
      renderCalendar();
    };

    grid.appendChild(cell);
  }

  const totalCells = startWeekDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day other-month";
    cell.textContent = i;
    grid.appendChild(cell);
  }

  // Eventos do dia selecionado
  selectedEventsDiv.innerHTML = "";
  const selStr = selectedDate.toISOString().split("T")[0];
  const selEvents = eventsByDate[selStr] || [];
  if (selEvents.length === 0) {
    selectedEventsDiv.innerHTML = "<div class='helper'>Sem eventos neste dia.</div>";
  } else {
    selEvents
      .slice()
      .sort((a,b) => a.type.localeCompare(b.type))
      .forEach(ev => {
        const who = ev.by === "barbara" ? "Bárbara" : "Pedro";
        const label =
          ev.type === "aniversario" ? "🎂 Aniversário" :
          ev.type === "ferias" ? "🌴 Férias" :
          "📌 Evento";

        const div = document.createElement("div");
        div.className = "event-item";
        div.innerHTML = `
          <div>${label} — ${ev.notes || "(sem descrição)"} (${who})</div>
          <div style="margin-top:4px;">
            <button class="secondary" onclick="editCalendarEvent('${ev.id}')">Editar</button>
            <button class="secondary" onclick="deleteCalendarEvent('${ev.id}')">Apagar</button>
          </div>
        `;
        selectedEventsDiv.appendChild(div);
      });
  }

  // Próximos eventos (30 dias)
  upcomingDiv.innerHTML = "";
  const now = new Date();
  const limit = new Date();
  limit.setDate(limit.getDate() + 30);
  const upcoming = appData.shared.calendar.filter(ev => {
    if (!ev.date) return false;
    const d = new Date(ev.date + "T00:00:00");
    return d >= now && d <= limit;
  }).sort((a,b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    upcomingDiv.innerHTML = "<div class='helper'>Sem eventos nos próximos 30 dias.</div>";
  } else {
    upcoming.forEach(ev => {
      const who = ev.by === "barbara" ? "Bárbara" : "Pedro";
      const label =
        ev.type === "aniversario" ? "🎂" :
        ev.type === "ferias" ? "🌴" :
        "📌";
      const div = document.createElement("div");
      div.className = "event-item";
      div.textContent = `${ev.date} — ${label} ${ev.notes || ""} (${who})`;
      upcomingDiv.appendChild(div);
    });
  }
}

function refreshCalendar() {
  renderCalendar();
}
