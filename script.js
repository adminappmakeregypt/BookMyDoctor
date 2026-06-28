/* ============================================================
   Booking System – Multi-Clinic (Firebase Firestore v10)
   ------------------------------------------------------------
   Structure in Firestore (best practice):
     clinics (collection)
       └── {clinicId} (document)
             └── bookings (subcollection)
                   └── {bookingId} (document)

   Each booking document:
     { clinicId, name, phone, doctor, date, time, payment, status, createdAt }

   NOTE: Auth is NOT implemented yet. Code is structured so that
   later we can replace getCurrentClinicId() with the clinicId
   returned from the authenticated user's profile.
============================================================ */

// ---------- 1. Firebase imports (modular SDK v10) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---------- 2. Firebase config & init ----------
const firebaseConfig = {
  apiKey: "AIzaSyCWsKLiMjUREhEpMZarud5j2K6rLDQqsSo",
  authDomain: "bookmydoctor-6c93c.firebaseapp.com",
  projectId: "bookmydoctor-6c93c",
  storageBucket: "bookmydoctor-6c93c.firebasestorage.app",
  messagingSenderId: "88063096613",
  appId: "1:88063096613:web:293c77b09078d943964ccc",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("✅ Firebase ready");

/* ============================================================
   3. CLINIC CONTEXT
   ------------------------------------------------------------
   For now we simulate the "current clinic" via localStorage.
   When Firebase Auth is added later, replace this function with:
     return auth.currentUser?.clinicId
============================================================ */
const CLINIC_STORAGE_KEY = "currentClinicId";

function getCurrentClinicId() {
  let clinicId = localStorage.getItem(CLINIC_STORAGE_KEY);
  if (!clinicId) {
    clinicId = "clinic1"; // default simulated clinic
    localStorage.setItem(CLINIC_STORAGE_KEY, clinicId);
  }
  return clinicId;
}

function bookingsCollection(clinicId = getCurrentClinicId()) {
  // clinics/{clinicId}/bookings
  return collection(db, "clinics", clinicId, "bookings");
}

/* ============================================================
   4. DATA LAYER (Firestore CRUD)
============================================================ */
async function saveBooking(data) {
  const clinicId = getCurrentClinicId();
  const payload = {
    clinicId,
    name: data.name || "",
    phone: data.phone || "",
    doctor: data.doctor || "",
    date: data.date || "",
    time: data.time || "",
    payment: data.payment || "",
    status: data.status || "",
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(bookingsCollection(clinicId), payload);
  return { id: ref.id, ...payload };
}

async function loadBookings() {
  const clinicId = getCurrentClinicId();
  const q = query(bookingsCollection(clinicId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ============================================================
   5. UI LAYER
============================================================ */
let bookings = [];

const $ = (id) => document.getElementById(id);

function readForm() {
  return {
    name: $("fullName")?.value.trim(),
    phone: $("phone")?.value.trim(),
    doctor: $("doctor")?.value,
    date: $("appointmentDate")?.value,
    time: $("appointmentTime")?.value,
    payment: $("paymentMethod")?.value,
    status: $("status")?.value,
  };
}

function resetForm() {
  ["fullName", "phone", "appointmentDate", "appointmentTime"].forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });
}

function renderTable() {
  const tbody = document.querySelector("#bookingsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = bookings
    .map(
      (b) => `
      <tr>
        <td>${b.name || ""}</td>
        <td>${b.phone || ""}</td>
        <td>${b.doctor || ""}</td>
        <td>${b.date || ""}</td>
        <td>${b.time || ""}</td>
        <td>${b.payment || ""}</td>
        <td>${b.status || ""}</td>
        <td>-</td>
      </tr>`
    )
    .join("");
}

async function refreshBookings() {
  try {
    bookings = await loadBookings();
    renderTable();
  } catch (err) {
    console.error("❌ Error loading bookings:", err);
  }
}

/* ============================================================
   6. EVENT BINDINGS
============================================================ */
function bindEvents() {
  const saveBtn = $("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const data = readForm();
      if (!data.name || !data.phone) {
        alert("⚠️ Please fill in name and phone.");
        return;
      }
      try {
        await saveBooking(data);
        alert("✅ Booking saved!");
        resetForm();
        await refreshBookings();
      } catch (err) {
        console.error(err);
        alert("❌ Error saving booking");
      }
    });
  }
}

/* ============================================================
   7. BOOTSTRAP
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🏥 Current clinic:", getCurrentClinicId());
  bindEvents();
  refreshBookings();
});

/* ============================================================
   8. (FUTURE) AUTHENTICATION HOOK
   ------------------------------------------------------------
   When ready, add:
     import { getAuth, onAuthStateChanged } from ".../firebase-auth.js";
     const auth = getAuth(app);
     onAuthStateChanged(auth, (user) => {
       if (user) {
         // fetch user profile → set clinicId
         localStorage.setItem(CLINIC_STORAGE_KEY, user.clinicId);
         refreshBookings();
       }
     });
============================================================ */
