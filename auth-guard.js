// ============ Auth Guard ============
// Protects pages: index.html, admin.html, reports.html, home.html
// v3: cache-busted + UID and email fallback mapping.

import { auth, db } from "./firebase-config.js?v=3";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔑 UID → { clinicId, role }
const USER_MAP = {
  "FW6oQ1lxyVfFxpgBz9EJqGngzG02": { clinicId: "clinic1", role: "admin" }, // admin1@test.com
  "bCkZhbwZV5gsxOOpF1WY8TnIY3a2": { clinicId: "clinic2", role: "admin" }, // admin2@test.com (original)
  "eJRdKk25eTS2WZHkLtJYgvSmoP13": { clinicId: "clinic2", role: "admin" }, // admin2@test.com (current logged-in)
  "oZM7Cet099gtqkwQenkkSMQOaux2": { clinicId: "clinic1", role: "admin" }, // current logged-in Clinic1 user
};

// Extra safety: if Firebase creates/reports a different UID later, these emails still resolve.
const EMAIL_MAP = {
  "admin1@test.com": { clinicId: "clinic1", role: "admin" },
  "admin2@test.com": { clinicId: "clinic2", role: "admin" },
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

    const mappedByUid = USER_MAP[user.uid];
    const mappedByEmail = user.email ? EMAIL_MAP[user.email.toLowerCase()] : null;

    if (mappedByUid) {
      clinicId = mappedByUid.clinicId;
      role = mappedByUid.role;
    } else if (mappedByEmail) {
      clinicId = mappedByEmail.clinicId;
      role = mappedByEmail.role;
    } else {
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
      alert("لم يتم العثور على بيانات العيادة لهذا المستخدم.\nUID: " + user.uid + "\nEmail: " + (user.email || ""));
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

    const btn = document.getElementById("logoutBtn");
    if (btn && !btn.dataset.logoutReady) {
      btn.dataset.logoutReady = "true";
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
