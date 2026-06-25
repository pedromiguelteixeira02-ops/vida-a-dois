function addShoppingItem() {
  const item = document.getElementById("shoppingItem").value;
  if (!item) return;

  appData.shared.shopping.push({
    id: Date.now().toString(),
    item,
    by: currentUser
  });
  saveDataToFirebase();

  document.getElementById("shoppingItem").value = "";
}

function editShoppingItem(id) {
  const it = appData.shared.shopping.find(i => i.id === id);
  if (!it) return;
  const newItem = prompt("Editar item:", it.item);
  if (!newItem) return;
  it.item = newItem;
  saveDataToFirebase();
}

function deleteShoppingItem(id) {
  if (!confirm("Apagar este item?")) return;
  appData.shared.shopping = appData.shared.shopping.filter(i => i.id !== id);
  saveDataToFirebase();
}

function refreshShopping() {
  const div = document.getElementById("shoppingList");
  div.innerHTML = "";
  appData.shared.shopping.forEach(it => {
    const who = it.by === "barbara" ? "Bárbara" : "Pedro";
    div.innerHTML += `
      <div class="list-item">
        <span>🛍️ ${it.item}</span>
        <span>
          <span class="badge">${who}</span>
          <button class="secondary" onclick="editShoppingItem('${it.id}')">✏️</button>
          <button class="secondary" onclick="deleteShoppingItem('${it.id}')">🗑️</button>
        </span>
      </div>`;
  });
}
