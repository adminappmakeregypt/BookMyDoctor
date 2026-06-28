// ✅ Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCWsKLiMjUREhEpMZarud5j2K6rLDQqsSo",
  authDomain: "bookmydoctor-6c93c.firebaseapp.com",
  projectId: "bookmydoctor-6c93c",
};

// ✅ Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase ready");

// =========================
// ✅ GLOBAL STATE
// =========================
let bookings = [];
let currentClinicId = null;

// =========================
// ✅ AUTH CHECK
// =========================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    console.log("✅ Logged in:", user.email);

    // ✅ get clinicId from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      currentClinicId = userDoc.data().clinicId;
      console.log("🏥 Clinic:", currentClinicId);

      loadBookings();
    }
  }
});

// =========================
// ✅ FIRESTORE PATH
// =========================
function bookingsCollection() {
  return collection(db, "clinics", currentClinicId, "bookings");
}

// =========================
// ✅ SAVE BOOKING
// =========================
async function saveBooking(data) {
  await addDoc(bookingsCollection(), {
    clinicId: currentClinicId,
    name: data.name || "",
    phone: data.phone || "",
    doctor: data.doctor || "",
    date: data.date || "",
    time: data.time || "",
    payment: data.payment || "",
    status: data.status || "",
    createdAt: serverTimestamp()
  });
}

// =========================
// ✅ LOAD BOOKINGS
// =========================
async function loadBookings() {
  const q = query(bookingsCollection(), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  bookings = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  renderTable();
}

// =========================
// ✅ FORM
// =========================
function readForm() {
  return {
    name: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    doctor: document.getElementById("doctor").value,
    date: document.getElementById("appointmentDate").value,
    time: document.getElementById("appointmentTime").value,
    payment: document.getElementById("paymentMethod").value,
    status: document.getElementById("status").value
  };
}

function resetForm() {
  ["fullName","phone","appointmentDate","appointmentTime"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

// =========================
// ✅ TABLE
// =========================
function renderTable() {
  const tbody = document.querySelector("#bookingsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td>${b.name}</td>
      <td>${b.phone}</td>
      <td>${b.doctor}</td>
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td>${b.payment}</td>
      <td>${b.status}</td>
      <td>-</td>
    </tr>
  `).join("");
}

// =========================
// ✅ BUTTONS
// =========================
function bindEvents() {
  document.getElementById("saveBtn").addEventListener("click", async () => {

    const data = readForm();

    if (!data.name || !data.phone) {
      alert("⚠️ Enter name and phone");
      return;
    }

    try {
      await saveBooking(data);
      alert("✅ Booking saved");

      resetForm();
      loadBookings();

    } catch (err) {
      console.error(err);
      alert("❌ Error saving booking");
    }
  });
}

// =========================
// ✅ LOGOUT
// =========================
function logout() {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
}

window.logout = logout;

// =========================
// ✅ INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
});