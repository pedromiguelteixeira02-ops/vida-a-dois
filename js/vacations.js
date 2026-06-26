function saveVacationTotals() {
  appData.pedro.vacationTotal = parseInt(document.getElementById("vacTotalPedro").value) || 0;
  appData.barbara.vacationTotal = parseInt(document.getElementById("vacTotalBarbara").value) || 0;

  // Recalcula os dias restantes com base nos eventos no calendário
  recalcVacationLeft("pedro");
  recalcVacationLeft("barbara");

  saveDataToFirebase();
}

// Recalcula vacationLeft a partir do total e dos eventos de férias no calendário
function recalcVacationLeft(userKey) {
  const userData = appData[userKey];
  let used = 0;
  appData.shared.calendar.forEach(ev => {
    if (ev.type === "ferias" && ev.by === userKey) {
      const from = ev.dateFrom || ev.date;
      const to   = ev.dateTo   || ev.date;
      used += countWorkdaysVac(from, to);
    }
  });
  userData.vacationLeft = Math.max(0, (userData.vacationTotal || 0) - used);
}

function countWorkdaysVac(startStr, endStr) {
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

// Devolve dias até ao próximo evento de férias do utilizador atual
function daysUntilNextVacation(userKey) {
  const today = new Date(); today.setHours(0,0,0,0);
  let minDiff = null;
  let nextDate = null;

  appData.shared.calendar.forEach(ev => {
    if (ev.type !== "ferias" || ev.by !== userKey) return;
    const from = new Date((ev.dateFrom || ev.date) + "T00:00:00");
    if (from >= today) {
      const diff = Math.round((from - today) / 86400000);
      if (minDiff === null || diff < minDiff) {
        minDiff = diff;
        nextDate = ev.dateFrom || ev.date;
      }
    }
  });

  return { days: minDiff, date: nextDate };
}

function refreshVacation() {
  document.getElementById("vacTotalPedro").value  = appData.pedro.vacationTotal  || 0;
  document.getElementById("vacTotalBarbara").value = appData.barbara.vacationTotal || 0;

  document.getElementById("vacLeftPedro").value  = appData.pedro.vacationLeft  || 0;
  document.getElementById("vacLeftBarbara").value = appData.barbara.vacationLeft || 0;

  // Contagem decrescente
  const pedroNext    = daysUntilNextVacation("pedro");
  const barbaraNext  = daysUntilNextVacation("barbara");

  const pEl = document.getElementById("vacCountdownPedro");
  const bEl = document.getElementById("vacCountdownBarbara");

  if (pEl) {
    pEl.textContent = pedroNext.days !== null
      ? `Pedro: ${pedroNext.days} dias para as próximas férias (${pedroNext.date})`
      : "Pedro: sem férias marcadas";
  }
  if (bEl) {
    bEl.textContent = barbaraNext.days !== null
      ? `Bárbara: ${barbaraNext.days} dias para as próximas férias (${barbaraNext.date})`
      : "Bárbara: sem férias marcadas";
  }
}
