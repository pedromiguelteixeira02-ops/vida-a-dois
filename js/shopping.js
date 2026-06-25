function addShoppingItem() {
  const item = document.getElementById("shoppingItem").value;
  if (!item) return;

  appData.shopping.push({ item, by: currentUser });
  saveDataToFirebase();

  document.getElementById("shoppingItem").value = "";
}

function refreshShopping() {
  const div = document.getElementById("shoppingList");
  div.innerHTML = "";
  appData.shopping.forEach(it => {
    const who = it.by === "barbara" ? "Bárbara" : "Pedro";
    div.innerHTML += `<div class="list-item">
      <span>🛍️ ${it.item}</span>
      <span class="badge">${who}</span>
    </div>`;
  });
}
