// ============ Auth Guard ============
// Include on every PROTECTED page (index.html, admin.html, reports.html, home.html).
// - Redirects to login.html if no user is signed in.
// - Loads the user's Firestore doc (users/{uid}) and exposes clinicId/role
//   on window.currentUserProfile.
// - Wires any element with id="logoutBtn" to sign out and return to login.

import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.currentUserProfile = null;
window.authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace("login.html");
      return;
    }
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      window.currentUserProfile = {
        uid: user.uid,
        email: user.email,
        clinicId: data.clinicId || null,
        role: data.role || "staff",
      };
    } catch (e) {
      console.error("Failed to load user profile:", e);
      window.currentUserProfile = {
        uid: user.uid,
        email: user.email,
        clinicId: null,
        role: "staff",
      };
    }
    // Wire logout button if present
    const btn = document.getElementById("logoutBtn");
    if (btn) {
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        await signOut(auth);
        window.location.replace("login.html");
      });
    }
    // Notify listeners
    document.dispatchEvent(
      new CustomEvent("auth:ready", { detail: window.currentUserProfile })
    );
    resolve(window.currentUserProfile);
  });
});
