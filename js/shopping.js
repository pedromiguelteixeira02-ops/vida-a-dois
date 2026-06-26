function addShoppingItem() {
  const input = document.getElementById("shoppingItem");
  const item = input.value.trim();
  if (!item) return;

  appData.shared.shopping.push({
    id: Date.now().toString(),
    item,
    by: currentUser,
    bought: false
  });
  saveDataToFirebase();
  input.value = "";
}

function toggleShoppingBought(id) {
  const it = appData.shared.shopping.find(i => i.id === id);
  if (!it) return;
  it.bought = true;
  saveDataToFirebase();

  // Animação de fade-out antes de remover visualmente
  const el = document.getElementById("shop-" + id);
  if (el) {
    el.style.transition = "opacity .4s, transform .4s";
    el.style.opacity = "0";
    el.style.transform = "translateX(30px)";
    setTimeout(() => {
      // Remove da lista em memória e guarda
      appData.shared.shopping = appData.shared.shopping.filter(i => i.id !== id);
      saveDataToFirebase();
    }, 400);
  }
}

function editShoppingItem(id) {
  const it = appData.shared.shopping.find(i => i.id === id);
  if (!it) return;
  const newItem = prompt("Editar item:", it.item);
  if (!newItem) return;
  it.item = newItem.trim();
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

  const items = appData.shared.shopping.filter(it => !it.bought);

  if (items.length === 0) {
    div.innerHTML = "<div class='helper' style='text-align:center;padding:14px 0;'>✅ Lista vazia — tudo comprado!</div>";
    return;
  }

  items.forEach(it => {
    const who = it.by === "barbara" ? "Bárbara" : "Pedro";
    const row = document.createElement("div");
    row.className = "list-item";
    row.id = "shop-" + it.id;
    row.innerHTML = `
      <span style="display:flex;align-items:center;gap:8px;">
        <button class="check-btn" onclick="toggleShoppingBought('${it.id}')" title="Marcar como comprado"
          style="width:28px;height:28px;border-radius:999px;border:2px solid var(--primary);
                 background:transparent;cursor:pointer;display:flex;align-items:center;
                 justify-content:center;font-size:14px;margin:0;padding:0;flex-shrink:0;transition:background .15s;">✓</button>
        <span>🛍️ ${it.item}</span>
      </span>
      <span style="display:flex;align-items:center;gap:6px;">
        <span class="badge">${who}</span>
        <button class="secondary" style="width:auto;padding:4px 8px;margin:0;" onclick="editShoppingItem('${it.id}')">✏️</button>
        <button class="secondary" style="width:auto;padding:4px 8px;margin:0;" onclick="deleteShoppingItem('${it.id}')">🗑️</button>
      </span>`;
    div.appendChild(row);
  });
}
