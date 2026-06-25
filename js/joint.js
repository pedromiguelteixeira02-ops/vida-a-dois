function saveJointPlan() {
  const sP = parseFloat(document.getElementById("salaryPedro").value) || 0;
  const sB = parseFloat(document.getElementById("salaryBarbara").value) || 0;
  const gP = parseFloat(document.getElementById("goalPedro").value) || 0;
  const gB = parseFloat(document.getElementById("goalBarbara").value) || 0;
  const jP = parseFloat(document.getElementById("jointPedro").value) || 0;
  const jB = parseFloat(document.getElementById("jointBarbara").value) || 0;

  appData.users.pedro.salary = sP;
  appData.users.barbara.salary = sB;
  appData.users.pedro.savingsGoal = gP;
  appData.users.barbara.savingsGoal = gB;
  appData.jointPlan.pedro = jP;
  appData.jointPlan.barbara = jB;

  saveDataToFirebase();
}

function refreshJointPlan() {
  const u = appData.users || { pedro:{}, barbara:{} };
  const jp = appData.jointPlan || { pedro:0, barbara:0 };

  document.getElementById("salaryPedro").value = u.pedro.salary || "";
  document.getElementById("salaryBarbara").value = u.barbara.salary || "";
  document.getElementById("goalPedro").value = u.pedro.savingsGoal || "";
  document.getElementById("goalBarbara").value = u.barbara.savingsGoal || "";
  document.getElementById("jointPedro").value = jp.pedro || "";
  document.getElementById("jointBarbara").value = jp.barbara || "";

  const totalSalary = (u.pedro.salary || 0) + (u.barbara.salary || 0);
  const summary = document.getElementById("jointSummary");
  summary.textContent =
    "Salário total: €" + totalSalary.toFixed(2) +
    ". Contribuição: Pedro " + (jp.pedro || 0) + "%, Bárbara " + (jp.barbara || 0) + "%.";
}
