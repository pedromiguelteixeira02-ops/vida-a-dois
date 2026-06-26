// ────────────────────────────────────────────────
//  CONTA PESSOAL  (wallet.js)
// ────────────────────────────────────────────────

function addWalletEntry() {
  const salary  = parseFloat(document.getElementById("walletSalary").value)  || 0;
  const food    = parseFloat(document.getElementById("walletFood").value)    || 0;
  const extra   = parseFloat(document.getElementById("walletExtra").value)   || 0;
  const month   = document.getElementById("walletMonth").value; // YYYY-MM

  if (!month) { alert("Escolhe o mês."); return; }

  const userData = appData[currentUser];
  if (!userData.wallet) userData.wallet = [];

  const existing = userData.wallet.find(w => w.month === month);
  if (existing) {
    if (!confirm(`Já existe registo para ${month}. Adicionar novo lançamento extra?`)) return;
  }

  userData.wallet.push({
    id: Date.now().toString(),
    month,
    salary,
    food,
    extra,
    total: salary + food + extra,
    date: getToday()
  });

  saveDataToFirebase();
  refreshWallet();   // atualiza imediatamente sem esperar pelo listener

  document.getElementById("walletSalary").value = "";
  document.getElementById("walletFood").value   = "";
  document.getElementById("walletExtra").value  = "";
}

function deleteWalletEntry(id) {
  if (!confirm("Apagar este lançamento?")) return;
  const userData = appData[currentUser];
  userData.wallet = userData.wallet.filter(w => w.id !== id);
  saveDataToFirebase();
  refreshWallet();
}

// ── Conta Conjunta ────────────────────────────────
function addJointDeposit() {
  const amount = parseFloat(document.getElementById("jointDepositAmount").value) || 0;
  if (!amount) return;

  if (!appData.jointAccount) appData.jointAccount = { deposits: [] };
  if (!appData.jointAccount.deposits) appData.jointAccount.deposits = [];

  appData.jointAccount.deposits.push({
    id: Date.now().toString(),
    by: currentUser,
    amount,
    date: getToday()
  });

  saveDataToFirebase();
  refreshWallet();
  document.getElementById("jointDepositAmount").value = "";
}

function deleteJointDeposit(id) {
  if (!confirm("Apagar este depósito?")) return;
  appData.jointAccount.deposits = appData.jointAccount.deposits.filter(d => d.id !== id);
  saveDataToFirebase();
  refreshWallet();
}

// ── Refresh ───────────────────────────────────────
function refreshWallet() {
  if (!appData) return;

  const userData = appData[currentUser];
  const entries  = (userData.wallet || []).slice()
    .sort((a,b) => b.month.localeCompare(a.month));

  const listDiv = document.getElementById("walletList");
  if (!listDiv) return;
  listDiv.innerHTML = "";

  if (entries.length === 0) {
    listDiv.innerHTML = "<div class='helper'>Sem lançamentos ainda.</div>";
  } else {
    entries.forEach(w => {
      listDiv.innerHTML += `
        <div class="list-item" style="flex-direction:column;align-items:flex-start;gap:2px;">
          <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
            <strong>${w.month}</strong>
            <button class="secondary" style="width:auto;padding:4px 10px;" onclick="deleteWalletEntry('${w.id}')">🗑️</button>
          </div>
          <div style="font-size:13px;color:#555;">
            Salário: <b>€${(w.salary||0).toFixed(2)}</b>
            &nbsp;|&nbsp; Sub. Alimentação: <b>€${(w.food||0).toFixed(2)}</b>
            &nbsp;|&nbsp; Extras: <b>€${(w.extra||0).toFixed(2)}</b>
          </div>
          <div style="font-size:14px;font-weight:700;color:var(--primary);">Total: €${(w.total||0).toFixed(2)}</div>
        </div>`;
    });

    const year = new Date().getFullYear().toString();
    const yearTotal = entries
      .filter(w => w.month.startsWith(year))
      .reduce((s, w) => s + (w.total || 0), 0);
    listDiv.innerHTML += `
      <div class="list-item" style="background:#ffeef2;margin-top:10px;">
        <strong>Total ${year}: €${yearTotal.toFixed(2)}</strong>
      </div>`;
  }

  // Conta Conjunta
  const deposits = (appData.jointAccount && appData.jointAccount.deposits) || [];
  const jListDiv = document.getElementById("jointDepositList");
  if (!jListDiv) return;
  jListDiv.innerHTML = "";

  let totalPedro = 0, totalBarbara = 0;
  deposits.slice().sort((a,b) => b.date.localeCompare(a.date)).forEach(d => {
    const who = d.by === "barbara" ? "Bárbara" : "Pedro";
    if (d.by === "pedro") totalPedro += d.amount;
    else totalBarbara += d.amount;

    jListDiv.innerHTML += `
      <div class="list-item">
        <span>${d.date} — ${who}: €${(d.amount||0).toFixed(2)}</span>
        <button class="secondary" style="width:auto;padding:4px 10px;" onclick="deleteJointDeposit('${d.id}')">🗑️</button>
      </div>`;
  });

  document.getElementById("jointTotalPedro").textContent  = "Pedro: €" + totalPedro.toFixed(2);
  document.getElementById("jointTotalBarbara").textContent = "Bárbara: €" + totalBarbara.toFixed(2);
  document.getElementById("jointTotalGlobal").textContent  = "Total: €" + (totalPedro + totalBarbara).toFixed(2);
}