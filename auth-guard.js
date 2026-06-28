// ============ Auth Guard ============
// v6: role-based access. admin = all pages; user = booking page only.

import { auth, db } from "./firebase-config.js?v=6";
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
  "eJRdKk25eTS2WZHkLtJYgvSmoP13": { clinicId: "clinic2", role: "admin" }, // admin2@test.com (current)
  "oZM7Cet099gtqkwQenkkSMQOaux2": { clinicId: "clinic1", role: "admin" }, // current Clinic1 admin
};

// Email fallback (also covers user1/user2 until you paste their UIDs here).
const EMAIL_MAP = {
  "admin1@test.com": { clinicId: "clinic1", role: "admin" },
  "admin2@test.com": { clinicId: "clinic2", role: "admin" },
  "user1@test.com":  { clinicId: "clinic1", role: "user"  },
  "user2@test.com":  { clinicId: "clinic2", role: "user"  },
};

// Pages a regular "user" is allowed to see. Everything else → redirect to index.html
const USER_ALLOWED_PAGES = ["index.html", ""]; // "" = root

function currentPageName() {
  const p = window.location.pathname.split("/").pop() || "";
  return p.toLowerCase();
}

function enforceRoleAccess(role) {
  const page = currentPageName();
  if (role === "user" && !USER_ALLOWED_PAGES.includes(page)) {
    window.location.replace("index.html");
    return false;
  }
  // Hide admin-only nav links for regular users
  if (role === "user") {
    document.querySelectorAll('a[href$="home.html"], a[href$="admin.html"], a[href$="reports.html"]')
      .forEach(a => { a.style.display = "none"; });
  }
  return true;
}

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

    // Role-based page restriction
    if (!enforceRoleAccess(role)) return;

    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
      userInfo.textContent = (user.email || user.uid) + (role === "user" ? "  (مستخدم)" : "  (مدير)");
    }

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
