function refreshDashboard() {
  if (!appData) return;

  const now = new Date();
  const ym   = now.toISOString().slice(0,7);
  const year = now.getFullYear();

  // ── Saldo da conta pessoal do mês atual ─────────────────
  const walletMonthBalance = (userKey) => {
    const entries = (appData[userKey].wallet || []).filter(w => w.month === ym);
    return entries.reduce((s, w) => s + (w.total || 0), 0);
  };
  const walletMonthExpenses = (userKey) => {
    let total = 0;
    (appData[userKey].expenses || []).forEach(ex => {
      if (ex.date && ex.date.startsWith(ym)) total += ex.value || 0;
    });
    return total;
  };

  const balancePedro   = walletMonthBalance("pedro")   - walletMonthExpenses("pedro");
  const balanceBarbara = walletMonthBalance("barbara") - walletMonthExpenses("barbara");

  const fmtBalance = (val) => {
    const sign = val >= 0 ? "+" : "";
    return sign + val.toFixed(2).replace(".", ",") + " €";
  };

  const balPedroEl   = document.getElementById("dashBalancePedro");
  const balBarbaraEl = document.getElementById("dashBalanceBarbara");
  if (balPedroEl) {
    balPedroEl.textContent = "Pedro: " + fmtBalance(balancePedro);
    balPedroEl.style.color = balancePedro >= 0 ? "#2e7d4f" : "#c0392b";
  }
  if (balBarbaraEl) {
    balBarbaraEl.textContent = "Bárbara: " + fmtBalance(balanceBarbara);
    balBarbaraEl.style.color = balanceBarbara >= 0 ? "#2e7d4f" : "#c0392b";
  }

  // ── Despesas do mês ──────────────────────────────────────
  const sumMonth = (userKey) => {
    let total = 0;
    (appData[userKey].expenses || []).forEach(ex => {
      if (ex.date && ex.date.startsWith(ym)) total += ex.value || 0;
    });
    return total;
  };
  document.getElementById("dashExpPedro").textContent   = "Pedro: €"   + sumMonth("pedro").toFixed(2).replace(".",",");
  document.getElementById("dashExpBarbara").textContent = "Bárbara: €" + sumMonth("barbara").toFixed(2).replace(".",",");

  // ── Horas extra do ano ───────────────────────────────────
  const sumExtra = (userKey) => {
    let total = 0;
    (appData[userKey].hours || []).forEach(e => {
      if (e.date && e.date.startsWith(year.toString())) total += parseFloat(e.extra || 0);
    });
    return total;
  };
  document.getElementById("dashExtraPedro").textContent   = "Pedro: "   + sumExtra("pedro").toFixed(1)   + "h";
  document.getElementById("dashExtraBarbara").textContent = "Bárbara: " + sumExtra("barbara").toFixed(1) + "h";

  // ── Férias disponíveis ───────────────────────────────────
  document.getElementById("dashVacPedro").textContent   = "Pedro: "   + (appData.pedro.vacationLeft   || 0) + " dias";
  document.getElementById("dashVacBarbara").textContent = "Bárbara: " + (appData.barbara.vacationLeft || 0) + " dias";

  // ── Próximas férias ──────────────────────────────────────
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

  // ── Itens por comprar ────────────────────────────────────
  document.getElementById("dashShoppingItems").textContent = (appData.shared.shopping || []).length;

  // ── Eventos da semana (com lista clicável) ───────────────
  const today = new Date(); today.setHours(0,0,0,0);
  const weekLimit = new Date(today);
  weekLimit.setDate(weekLimit.getDate() + 7);

  const weekEvents = [];
  const seenIds = new Set();
  appData.shared.calendar.forEach(ev => {
    if (seenIds.has(ev.id)) return;
    const from = new Date((ev.dateFrom || ev.date) + "T00:00:00");
    const to   = new Date((ev.dateTo   || ev.date) + "T00:00:00");
    // inclui eventos que se sobreponham com a janela da semana
    if (to >= today && from <= weekLimit) {
      seenIds.add(ev.id);
      weekEvents.push(ev);
    }
  });
  weekEvents.sort((a,b) => (a.dateFrom||a.date).localeCompare(b.dateFrom||b.date));

  document.getElementById("dashWeekEvents").textContent = weekEvents.length;

  const listDiv = document.getElementById("dashWeekEventsList");
  if (listDiv) {
    listDiv.innerHTML = "";
    if (weekEvents.length === 0) {
      listDiv.innerHTML = "<div style='font-size:12px;color:#8892a0;margin-top:4px;'>Sem eventos esta semana.</div>";
    } else {
      weekEvents.forEach(ev => {
        const typeIcon = ev.type === "aniversario" ? "🎂" : ev.type === "ferias" ? "🌴" : "📌";
        const who  = ev.by === "barbara" ? "Bárbara" : "Pedro";
        const range = (ev.dateTo && ev.dateTo !== ev.dateFrom)
          ? ev.dateFrom + " → " + ev.dateTo
          : (ev.dateFrom || ev.date);
        const item = document.createElement("div");
        item.style.cssText = "font-size:12px;padding:4px 0;cursor:pointer;color:var(--primary);border-bottom:1px solid var(--border);";
        item.innerHTML = typeIcon + " <b>" + (ev.notes || "(sem descrição)") + "</b> <span style='color:#8892a0;font-weight:400;'>" + range + " · " + who + "</span>";
        item.onclick = () => {
          // Navega para o calendário e seleciona o dia
          const d = new Date((ev.dateFrom || ev.date) + "T00:00:00");
          currentMonth = d.getMonth();
          currentYear  = d.getFullYear();
          selectedDate = d;
          setView("calendario");
        };
        listDiv.appendChild(item);
      });
    }
  }
}
