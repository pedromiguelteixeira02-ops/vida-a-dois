function saveVacationDays() {
  const p = parseInt(document.getElementById("vacPedro").value) || 0;
  const b = parseInt(document.getElementById("vacBarbara").value) || 0;

  appData.vacationDays = { pedro: p, barbara: b };
  saveDataToFirebase();
}

function refreshVacation() {
  const vac = appData.vacationDays || { pedro:0, barbara:0 };
  document.getElementById("vacPedro").value = vac.pedro || 0;
  document.getElementById("vacBarbara").value = vac.barbara || 0;
}
