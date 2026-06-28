// ✅ Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCWsKLiMjUREhEpMZarud5j2K6rLDQqsSo",
  authDomain: "bookmydoctor-6c93c.firebaseapp.com",
  projectId: "bookmydoctor-6c93c",
  storageBucket: "bookmydoctor-6c93c.firebasestorage.app",
  messagingSenderId: "88063096613",
  appId: "1:88063096613:web:293c77b09078d943964ccc"
};

// ✅ Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("✅ Firebase ready");

/* ========================
   ✅ LOAD BOOKINGS FROM FIREBASE
======================== */
let bookings = [];

async function loadBookingsFromFirebase() {
  const querySnapshot = await getDocs(collection(db, "bookings"));

  bookings = [];
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });

  renderTable();
}

loadBookingsFromFirebase();

/* ========================
   ✅ SAVE BOOKING TO FIREBASE
======================== */
document.getElementById("saveBtn").addEventListener("click", async () => {

  const name = document.getElementById("fullName").value;
  const phone = document.getElementById("phone").value;
  const doctor = document.getElementById("doctor").value;
  const date = document.getElementById("appointmentDate").value;
  const time = document.getElementById("appointmentTime").value;
  const payment = document.getElementById("paymentMethod").value;
  const status = document.getElementById("status").value;

  try {
    await addDoc(collection(db, "bookings"), {
      name,
      phone,
      doctor,
      date,
      time,
      payment,
      status
    });

    alert("✅ Booking saved to Firebase!");

    loadBookingsFromFirebase();

  } catch (error) {
    console.error(error);
    alert("❌ Error saving booking");
  }
});

/* ========================
   ✅ TABLE RENDER
======================== */
function renderTable() {
  const tbody = document.querySelector("#bookingsTable tbody");

  if (!tbody) return;

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td>${b.name || ""}</td>
      <td>${b.phone || ""}</td>
      <td>${b.doctor || ""}</td>
      <td>${b.date || ""}</td>
      <td>${b.time || ""}</td>
      <td>${b.payment || ""}</td>
      <td>${b.status || ""}</td>
      <td>-</td>
    </tr>
  `).join("");
}