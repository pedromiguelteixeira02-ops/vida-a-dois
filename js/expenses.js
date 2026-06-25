function addExpense() {
  const preset = document.getElementById("expensePreset").value;
  const nameInput = document.getElementById("expenseName").value;
  const value = parseFloat(document.getElementById("expenseValue").value);

  if (!preset && !nameInput) return;
  if (!value) return;

  const name = nameInput || preset;

  const userData = appData[currentUser];
  userData.expenses.push({
    id: Date.now().toString(),
    name,
    value,
    date: getToday()
  });

  saveDataToFirebase();

  document.getElementById("expenseName").value = "";
  document.getElementById("expenseValue").value = "";
  document.getElementById("expensePreset").value = "";
}

function editExpense(id) {
  const userData = appData[currentUser];
  const ex = userData.expenses.find(e => e.id === id);
  if (!ex) return;

  const newName = prompt("Descrição da despesa:", ex.name) || ex.name;
  const newValue = parseFloat(prompt("Valor (€):", ex.value) || ex.value);

  ex.name = newName;
  ex.value = newValue;

  saveDataToFirebase();
}

function deleteExpense(id) {
  const userData = appData[currentUser];
  if (!confirm("Apagar esta despesa?")) return;
  userData.expenses = userData.expenses.filter(e => e.id !== id);
  saveDataToFirebase();
}

function refreshExpenses() {
  const div = document.getElementById("expenseList");
  div.innerHTML = "";

  const userData = appData[currentUser];
  userData.expenses
    .slice()
    .sort((a,b) => (a.date || "").localeCompare(b.date || ""))
    .forEach(ex => {
      div.innerHTML += `
        <div class="list-item">
          <span>${ex.date} — ${ex.name}: €${(ex.value || 0).toFixed(2)}</span>
          <span>
            <button class="secondary" onclick="editExpense('${ex.id}')">✏️</button>
            <button class="secondary" onclick="deleteExpense('${ex.id}')">🗑️</button>
          </span>
        </div>`;
    });
}
