function refreshDashboard() {
  if (!appData) return;

  const now = new Date();
  const ym = now.toISOString().slice(0,7);

  // Despesas do mês
  let monthTotal = 0;
  appData.expenses.forEach(ex => {
    if (!ex.date) return;
    if (ex.date.startsWith(ym)) monthTotal += ex.value || 0;
  });
  document.getElementById("dashExpensesMonth").textContent =
    "€ " + monthTotal.toFixed(2).replace(".", ",");

  // Horas extra INDIVIDUAIS
  const year = now.getFullYear();
  let extraTotal = 0;
  const entries = (appData.timeTracking && appData.timeTracking[currentUser]) || [];
  entries.forEach(e => {
    if (!e.date || !e.extra) return;
    if (e.date.startsWith(year.toString())) {
      extraTotal += parseFloat(e.extra || 0);
    }
  });
  document.getElementById("dashExtraHours").textContent =
    extraTotal.toFixed(1) + "h";

  // Próximos eventos
  const limit = new Date();
  limit.setDate(limit.getDate() + 30);
  const upcoming = appData.calendar.filter(ev => {
    if (!ev.date) return false;
    const d = new Date(ev.date + "T00:00:00");
    return d >= now && d <= limit;
  });
  document.getElementById("dashNextEvents").textContent = upcoming.length;

  // Itens por comprar
  document.getElementById("dashShoppingItems").textContent =
    (appData.shopping || []).length;

  // Férias restantes do utilizador atual
  const vac = appData.vacationDays || { pedro:0, barbara:0 };
  const remaining = currentUser === "pedro" ? (vac.pedro || 0) : (vac.barbara || 0);
  document.getElementById("dashVacation").textContent = remaining + " dias";
}
