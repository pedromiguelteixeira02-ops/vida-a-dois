function refreshDashboard() {
  if (!appData) return;

  const now = new Date();
  const ym   = now.toISOString().slice(0,7);
  const year = now.getFullYear();

  // Despesas do mês
  const sumMonth = (userKey) => {
    let total = 0;
    (appData[userKey].expenses || []).forEach(ex => {
      if (ex.date && ex.date.startsWith(ym)) total += ex.value || 0;
    });
    return total;
  };
  document.getElementById("dashExpPedro").textContent   = "Pedro: €"   + sumMonth("pedro").toFixed(2).replace(".",",");
  document.getElementById("dashExpBarbara").textContent = "Bárbara: €" + sumMonth("barbara").toFixed(2).replace(".",",");

  // Horas extra do ano
  const sumExtra = (userKey) => {
    let total = 0;
    (appData[userKey].hours || []).forEach(e => {
      if (e.date && e.date.startsWith(year.toString())) total += parseFloat(e.extra || 0);
    });
    return total;
  };
  document.getElementById("dashExtraPedro").textContent   = "Pedro: "   + sumExtra("pedro").toFixed(1)   + "h";
  document.getElementById("dashExtraBarbara").textContent = "Bárbara: " + sumExtra("barbara").toFixed(1) + "h";

  // Férias disponíveis
  document.getElementById("dashVacPedro").textContent   = "Pedro: "   + (appData.pedro.vacationLeft   || 0) + " dias";
  document.getElementById("dashVacBarbara").textContent = "Bárbara: " + (appData.barbara.vacationLeft || 0) + " dias";

  // Próximas férias (contagem decrescente)
  const nextVac = (userKey) => {
    const today = new Date(); today.setHours(0,0,0,0);
    let minDiff = null, nextDate = null;
    appData.shared.calendar.forEach(ev => {
      if (ev.type !== "ferias" || ev.by !== userKey) return;
      const from = new Date((ev.dateFrom || ev.date) + "T00:00:00");
      if (from >= today) {
        const diff = Math.round((from - today) / 86400000);
        if (minDiff === null || diff < minDiff) { minDiff = diff; nextDate = ev.dateFrom || ev.date; }
      }
    });
    return { days: minDiff, date: nextDate };
  };
  const pv = nextVac("pedro");
  const bv = nextVac("barbara");
  document.getElementById("dashNextVacPedro").textContent   = pv.days !== null ? "Pedro: " + pv.days + " dias (" + pv.date + ")" : "Pedro: sem férias marcadas";
  document.getElementById("dashNextVacBarbara").textContent = bv.days !== null ? "Bárbara: " + bv.days + " dias (" + bv.date + ")" : "Bárbara: sem férias marcadas";

  // Itens por comprar
  document.getElementById("dashShoppingItems").textContent = (appData.shared.shopping || []).length;

  // Eventos da semana
  const weekLimit = new Date(now);
  weekLimit.setDate(weekLimit.getDate() + 7);
  const weekEvents = appData.shared.calendar.filter(ev => {
    if (!ev.date && !ev.dateFrom) return false;
    const d = new Date((ev.dateFrom || ev.date) + "T00:00:00");
    return d >= now && d <= weekLimit;
  });
  document.getElementById("dashWeekEvents").textContent = weekEvents.length;
}
