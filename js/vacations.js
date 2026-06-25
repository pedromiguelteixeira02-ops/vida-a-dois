function saveVacationTotals() {
  const tP = parseInt(document.getElementById("vacTotalPedro").value) || 0;
  const tB = parseInt(document.getElementById("vacTotalBarbara").value) || 0;

  appData.pedro.vacationTotal = tP;
  appData.barbara.vacationTotal = tB;

  if (!appData.pedro.vacationLeft) appData.pedro.vacationLeft = tP;
  if (!appData.barbara.vacationLeft) appData.barbara.vacationLeft = tB;

  saveDataToFirebase();
}

function refreshVacation() {
  document.getElementById("vacTotalPedro").value = appData.pedro.vacationTotal || 0;
  document.getElementById("vacTotalBarbara").value = appData.barbara.vacationTotal || 0;
  document.getElementById("vacLeftPedro").value = appData.pedro.vacationLeft || 0;
  document.getElementById("vacLeftBarbara").value = appData.barbara.vacationLeft || 0;

  const info = document.getElementById("nextVacationsInfo");
  const now = new Date();

  const nextPedro = appData.shared.calendar
    .filter(ev => ev.type === "ferias" && ev.by === "pedro")
    .map(ev => new Date(ev.date + "T00:00:00"))
    .filter(d => d >= now)
    .sort((a,b) => a - b)[0];

  const nextBarbara = appData.shared.calendar
    .filter(ev => ev.type === "ferias" && ev.by === "barbara")
    .map(ev => new Date(ev.date + "T00:00:00"))
    .filter(d => d >= now)
    .sort((a,b) => a - b)[0];

  let text = "";
  if (nextPedro) {
    const diff = Math.round((nextPedro - now) / (1000*60*60*24));
    text += `Próximas férias de Pedro em ${diff} dias. `;
  }
  if (nextBarbara) {
    const diff = Math.round((nextBarbara - now) / (1000*60*60*24));
    text += `Próximas férias de Bárbara em ${diff} dias.`;
  }
  if (!text) text = "Ainda não há férias futuras marcadas no calendário.";

  info.textContent = text;
}
