function saveVacationTotals() {
  appData.pedro.vacationTotal = parseInt(document.getElementById("vacTotalPedro").value) || 0;
  appData.barbara.vacationTotal = parseInt(document.getElementById("vacTotalBarbara").value) || 0;

  // Se ainda não existirem restantes, inicializa
  if (appData.pedro.vacationLeft == null)
    appData.pedro.vacationLeft = appData.pedro.vacationTotal;

  if (appData.barbara.vacationLeft == null)
    appData.barbara.vacationLeft = appData.barbara.vacationTotal;

  saveDataToFirebase();
}

function refreshVacation() {
  document.getElementById("vacTotalPedro").value = appData.pedro.vacationTotal || 0;
  document.getElementById("vacTotalBarbara").value = appData.barbara.vacationTotal || 0;

  document.getElementById("vacLeftPedro").value = appData.pedro.vacationLeft || 0;
  document.getElementById("vacLeftBarbara").value = appData.barbara.vacationLeft || 0;
}
