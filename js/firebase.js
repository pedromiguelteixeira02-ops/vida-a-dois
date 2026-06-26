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

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function normalizeData(raw) {
  const data = raw || {};
  return {
    shared: {
      calendar: (data.shared && data.shared.calendar) || [],
      shopping: (data.shared && data.shared.shopping) || []
    },
    pedro: {
      expenses:      (data.pedro && data.pedro.expenses)      || [],
      hours:         (data.pedro && data.pedro.hours)         || [],
      vacationTotal: (data.pedro && data.pedro.vacationTotal) || 0,
      vacationLeft:  (data.pedro && data.pedro.vacationLeft)  || 0,
      wallet:        (data.pedro && data.pedro.wallet)        || []
    },
    barbara: {
      expenses:      (data.barbara && data.barbara.expenses)      || [],
      hours:         (data.barbara && data.barbara.hours)         || [],
      vacationTotal: (data.barbara && data.barbara.vacationTotal) || 0,
      vacationLeft:  (data.barbara && data.barbara.vacationLeft)  || 0,
      wallet:        (data.barbara && data.barbara.wallet)        || []
    },
    users: data.users || {
      pedro:   { salary: 0, savingsGoal: 0 },
      barbara: { salary: 0, savingsGoal: 0 }
    },
    jointPlan:    data.jointPlan    || { pedro: 0, barbara: 0 },
    jointAccount: data.jointAccount || { deposits: [] }
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
      if (typeof refreshAll === "function") refreshAll();
    }
  });
}
