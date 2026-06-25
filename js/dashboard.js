function refreshDashboard() {
  if (!appData) return;

  const now = new Date();
  const ym = now.toISOString().slice(0,7);
  const year = now.getFullYear();

  // Despesas mês individuais
  const sumMonth = (userKey) => {
    const userData = appData[userKey];
    let total = 0;
    (userData.expenses || []).forEach(ex => {
      if (!ex.date) return;
      if (ex.date.startsWith(ym)) total += ex.value || 0;
    });
    return total;
  };

  const pedroMonth = sumMonth("pedro");
  const barbaraMonth = sumMonth("barbara");

  document.getElementById("dashExpPedro").textContent =
    "Pedro: €" + pedroMonth.toFixed(2).replace(".", ",");
  document.getElementById("dashExpBarbara").textContent =
    "Bárbara: €" + barbaraMonth.toFixed(2).replace(".", ",");

  // Horas extra individuais
  const sumExtraYear = (userKey) => {
    const userData = appData[userKey];
    let total = 0;
    (userData.hours || []).forEach(e => {
      if (!e.date || !e.extra) return;
      if (e.date.startsWith(year.toString())) {
        total += parseFloat(e.extra || 0);
      }
    });
    return total;
  };

  const pedroExtra = sumExtraYear("pedro");
  const barbaraExtra = sumExtraYear("barbara");

  document.getElementById("dashExtraPedro").textContent =
    "Pedro: " + pedroExtra.toFixed(1) + "h";
  document.getElementById("dashExtraBarbara").textContent =
    "Bárbara: " + barbaraExtra.toFixed(1) + "h";

  // Férias disponíveis
  document.getElementById("dashVacPedro").textContent =
    "Pedro: " + (appData.pedro.vacationLeft || 0) + " dias";
  document.getElementById("dashVacBarbara").textContent =
    "Bárbara: " + (appData.barbara.vacationLeft || 0) + " dias";

  // Itens por comprar
  document.getElementById("dashShoppingItems").textContent =
    (appData.shared.shopping || []).length;

  // Próximos eventos da semana
  const weekLimit = new Date();
  weekLimit.setDate(weekLimit.getDate() + 7);
  const weekEvents = appData.shared.calendar.filter(ev => {
    if (!ev.date) return false;
    const d = new Date(ev.date + "T00:00:00");
    return d >= now && d <= weekLimit;
  });
  document.getElementById("dashWeekEvents").textContent = weekEvents.length;
}
