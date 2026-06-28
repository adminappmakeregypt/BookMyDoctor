// ============ Auth Guard ============
// Protects pages: index.html, admin.html, reports.html, home.html
// Maps the signed-in user's UID → clinicId directly (no Firestore users doc required).
// Falls back to Firestore users/{uid} if a user isn't in the map below.

import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔑 UID → { clinicId, role }
// Add more users here as you create them.
const USER_MAP = {
  "FW6oQ1lxyVfFxpgBz9EJqGngzG02": { clinicId: "clinic1", role: "admin" }, // admin1@test.com
  "bCkZhbwZV5gsxOOpF1WY8TnIY3a2": { clinicId: "clinic2", role: "admin" }, // admin2@test.com
  "oZM7Cet099gtqkwQenkkSMQOaux2": { clinicId: "clinic1", role: "admin" }, // newly detected Clinic1 user
};

window.currentUserProfile = null;
window.authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace("login.html");
      return;
    }

    let clinicId = null;
    let role = "staff";

    // 1) Try local UID map first (works without any Firestore setup)
    if (USER_MAP[user.uid]) {
      clinicId = USER_MAP[user.uid].clinicId;
      role = USER_MAP[user.uid].role;
    } else {
      // 2) Fallback: read users/{uid} from Firestore
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          clinicId = data.clinicId || null;
          role = data.role || "staff";
        }
      } catch (e) {
        console.error("Failed to load user profile:", e);
      }
    }

    if (!clinicId) {
      console.error("No clinicId for user", user.uid, user.email);
      alert("لم يتم العثور على بيانات العيادة لهذا المستخدم.\nUID: " + user.uid);
      await signOut(auth);
      window.location.replace("login.html");
      return;
    }

    window.currentUserProfile = {
      uid: user.uid,
      email: user.email,
      clinicId,
      role,
    };

    // Wire any logout button
    const btn = document.getElementById("logoutBtn");
    if (btn) {
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        await signOut(auth);
        window.location.replace("login.html");
      });
    }

    document.dispatchEvent(
      new CustomEvent("auth:ready", { detail: window.currentUserProfile })
    );
    resolve(window.currentUserProfile);
  });
});
