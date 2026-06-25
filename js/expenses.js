function addExpense() {
  const name = document.getElementById("expenseName").value;
  const value = parseFloat(document.getElementById("expenseValue").value);
  if (!name || !value) return;

  appData.expenses.push({ name, value, by: currentUser, date: getToday() });
  saveDataToFirebase();

  document.getElementById("expenseName").value = "";
  document.getElementById("expenseValue").value = "";
}

function refreshExpenses() {
  const div = document.getElementById("expenseList");
  div.innerHTML = "";
  appData.expenses.forEach(ex => {
    const who = ex.by === "barbara" ? "Bárbara" : "Pedro";
    div.innerHTML += `<div class="list-item">
      <span>${ex.date || ""} — ${ex.name}: €${(ex.value || 0).toFixed(2)}</span>
      <span class="badge">${who}</span>
    </div>`;
  });
}
