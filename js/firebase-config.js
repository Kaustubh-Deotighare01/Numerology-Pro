/* ═══════════════════════════════════════════════════════════
   Numerology Pro — firebase-config.js
   Real Firebase credentials — DO NOT share publicly
   ═══════════════════════════════════════════════════════════ */

const firebaseConfig = {
  apiKey:            "AIzaSyD2eqkbrbW9dkzrzsj6Q6momgBDOdsoFls",
  authDomain:        "numerology-pro.firebaseapp.com",
  projectId:         "numerology-pro",
  storageBucket:     "numerology-pro.firebasestorage.app",
  messagingSenderId: "510888203632",
  appId:             "1:510888203632:web:5a76009508448718fd6bb5",
  measurementId:     "G-YLMH2EDF3H"
};

/* ── Admin Emails ─────────────────────────────────────────
   Add any email here that should have admin access.
   These bypass subscription checks and go to admin.html.
   ──────────────────────────────────────────────────────── */
const ADMIN_EMAILS = [
  "deotigharekaustubh@gmail.com"
];

/* ── Initialize Firebase ─────────────────────────────────── */
firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();

/* ── Firestore Settings ──────────────────────────────────── */
db.settings({ merge: true });
