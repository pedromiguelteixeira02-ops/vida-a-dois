// CONFIG DO TEU FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDfymDOoxl0PMj8dfDXOkmnpLCtz2DmtkE",
  authDomain: "calend0894.firebaseapp.com",
  projectId: "calend0894",
  storageBucket: "calend0894.firebasestorage.app",
  messagingSenderId: "1057848708168",
  appId: "1:1057848708168:web:794620090a708330945c7d",
  measurementId: "G-NJD5PBJDX8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const DOC_ID = "shared";
let appData = null;
let currentUser = "pedro";

// Helpers globais
function getToday() {
  return new Date().toISOString().split("T")[0];
}

// Normalizar estrutura
function normalizeData(raw) {
  const data = raw || {};
  const users = data.users || {};
  const pedro = users.pedro || {};
  const barbara = users.barbara || {};

  return {
    calendar: data.calendar || [],
    shopping: data.shopping || [],
    expenses: data.expenses || [],
    vacationDays: data.vacationDays || { pedro: 0, barbara: 0 },
    timeTracking: data.timeTracking || { pedro: [], barbara: [] },
    users: {
      pedro: {
        salary: pedro.salary || 0,
        savingsGoal: pedro.savingsGoal || 0
      },
      barbara: {
        salary: barbara.salary || 0,
        savingsGoal: barbara.savingsGoal || 0
      }
    },
    jointPlan: data.jointPlan || { pedro: 0, barbara: 0 }
  };
}

async function loadDataFromFirebase() {
  const docRef = db.collection("appData").doc(DOC_ID);
  const snap = await docRef.get();
  if (!snap.exists) {
    const initial = normalizeData({});
    await docRef.set(initial);
    return initial;
  } else {
    const normalized = normalizeData(snap.data());
    await docRef.set(normalized, { merge: true });
    return normalized;
  }
}

async function saveDataToFirebase() {
  const docRef = db.collection("appData").doc(DOC_ID);
  await docRef.set(appData, { merge: true });
}

function listenRealtime() {
  const docRef = db.collection("appData").doc(DOC_ID);
  docRef.onSnapshot((snap) => {
    if (snap.exists) {
      appData = normalizeData(snap.data());
      if (typeof refreshAll === "function") {
        refreshAll();
      }
    }
  });
}
