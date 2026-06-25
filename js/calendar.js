let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date();

function addCalendarEvent() {
  const title = document.getElementById("eventTitle").value;
  const date = document.getElementById("eventDate").value;
  if (!title || !date) return;

  const event = { title, date, by: currentUser };

  // Se for férias, abate 1 dia ao utilizador atual
  if (title.toLowerCase().includes("férias")) {
    if (!appData.vacationDays[currentUser]) {
      appData.vacationDays[currentUser] = 0;
    }
    appData.vacationDays[currentUser] =
      Math.max(0, appData.vacationDays[currentUser] - 1);
  }

  appData.calendar.push(event);
  saveDataToFirebase();

  document.getElementById("eventTitle").value = "";
  document.getElementById("eventDate").value = "";
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
  appData.calendar.forEach(ev => {
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

  // Completar grelha
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
      .sort((a,b) => a.title.localeCompare(b.title))
      .forEach(ev => {
        const who = ev.by === "barbara" ? "Bárbara" : "Pedro";
        const div = document.createElement("div");
        div.className = "event-item";
        div.textContent = ev.title + " (" + who + ")";
        selectedEventsDiv.appendChild(div);
      });
  }

  // Próximos eventos (30 dias)
  upcomingDiv.innerHTML = "";
  const now = new Date();
  const limit = new Date();
  limit.setDate(limit.getDate() + 30);
  const upcoming = appData.calendar.filter(ev => {
    if (!ev.date) return false;
    const d = new Date(ev.date + "T00:00:00");
    return d >= now && d <= limit;
  }).sort((a,b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    upcomingDiv.innerHTML = "<div class='helper'>Sem eventos nos próximos 30 dias.</div>";
  } else {
    upcoming.forEach(ev => {
      const who = ev.by === "barbara" ? "Bárbara" : "Pedro";
      const div = document.createElement("div");
      div.className = "event-item";
      div.textContent = ev.date + " — " + ev.title + " (" + who + ")";
      upcomingDiv.appendChild(div);
    });
  }
}

function refreshCalendar() {
  renderCalendar();
}
