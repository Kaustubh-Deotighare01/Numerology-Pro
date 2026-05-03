/* ═══════════════════════════════════════════════════════════
   Numerology Pro — firebase-auth.js
   Clean Firebase wrapper — no race conditions, no redirect loops
   ═══════════════════════════════════════════════════════════ */

const ADMIN_EMAILS = ['deotigharekaustubh@gmail.com'];

/* ── Core auth helper ────────────────────────────────────── */
const MockAuth = {

  // Get cached user from localStorage
  currentUser() {
    try {
      const s = localStorage.getItem('np_user');
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  },

  // Save user to cache
  _save(user) {
    localStorage.setItem('np_user', JSON.stringify(user));
  },

  // Clear cache
  _clear() {
    localStorage.removeItem('np_user');
  },

  // Get subscription status
  getStatus(user) {
    if (!user) return 'none';
    if (user.blocked) return 'blocked';
    if (!user.subscriptionActive) return 'pending';
    if (!user.subscriptionExpiry) return 'active';
    const exp = user.subscriptionExpiry?.toDate
      ? user.subscriptionExpiry.toDate()
      : new Date(user.subscriptionExpiry);
    if (exp < new Date()) return 'expired';
    return 'active';
  },

  isAdmin(user) {
    return user && (user.role === 'admin' || ADMIN_EMAILS.includes(user.email));
  },

  // Wait for Firebase to restore session and return fresh user data
  async getFirebaseUser() {
    return new Promise((resolve) => {
      const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
        unsub();
        if (!firebaseUser) {
          this._clear();
          resolve(null);
          return;
        }
        try {
          const snap = await db.collection('users').doc(firebaseUser.uid).get();
          if (!snap.exists) {
            this._clear();
            resolve(null);
            return;
          }
          const user = { uid: firebaseUser.uid, ...snap.data() };
          this._save(user);
          resolve(user);
        } catch(e) {
          // If Firestore fails, use cached data
          const cached = this.currentUser();
          resolve(cached);
        }
      });
    });
  },

  // Login
  async login(email, password) {
    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      const snap = await db.collection('users').doc(cred.user.uid).get();
      if (!snap.exists) {
        await auth.signOut();
        return { ok: false, error: 'Account not found. Please sign up first.' };
      }
      const user = { uid: cred.user.uid, ...snap.data() };
      if (user.blocked) {
        await auth.signOut();
        return { ok: false, error: 'Your account has been blocked. Contact: deotigharekaustubh@gmail.com' };
      }
      this._save(user);
      return { ok: true, user };
    } catch(e) {
      const msgs = {
        'auth/user-not-found':     'No account found with this email.',
        'auth/wrong-password':     'Incorrect password. Please try again.',
        'auth/invalid-email':      'Invalid email address.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests':  'Too many attempts. Try again later.'
      };
      return { ok: false, error: msgs[e.code] || e.message };
    }
  },

  // Logout
  async logout() {
    this._clear();
    await auth.signOut();
    window.location.href = 'login.html';
  },

  // Register
  async register(data) {
    try {
      const cred = await auth.createUserWithEmailAndPassword(data.email, data.password);
      await cred.user.updateProfile({ displayName: data.firstName + ' ' + data.lastName });
      const userData = {
        uid: cred.user.uid,
        email: data.email,
        displayName: data.firstName + ' ' + data.lastName,
        firstName: data.firstName,
        lastName: data.lastName,
        mobile: data.mobile || '',
        role: 'user',
        subscriptionActive: false,
        subscriptionPlan: null,
        subscriptionExpiry: null,
        blocked: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        dob: ''
      };
      await db.collection('users').doc(cred.user.uid).set(userData);
      await auth.signOut(); // Sign out after register — must pay first
      this._clear();
      return { ok: true };
    } catch(e) {
      const msgs = {
        'auth/email-already-in-use': 'This email is already registered. Please sign in.',
        'auth/invalid-email':        'Invalid email address.',
        'auth/weak-password':        'Password must be at least 6 characters.'
      };
      return { ok: false, error: msgs[e.code] || e.message };
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const snap = await db.collection('users').where('email', '==', email).limit(1).get();
      if (snap.empty) return { ok: false, error: 'No account found with this email.' };
      await auth.sendPasswordResetEmail(email);
      return { ok: true };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  },

  // Refresh user from Firestore
  async refreshUser() {
    const cached = this.currentUser();
    if (!cached) return null;
    try {
      const snap = await db.collection('users').doc(cached.uid).get();
      if (!snap.exists) return null;
      const user = { uid: cached.uid, ...snap.data() };
      this._save(user);
      return user;
    } catch(e) { return cached; }
  }
};

/* ── Config — reads/writes to Firestore /config ─────────── */
const MockConfig = {
  _cache: {},

  async get(key) {
    if (this._cache[key] !== undefined) return this._cache[key];
    try {
      const snap = await db.collection('config').doc(key).get();
      const val = snap.exists ? snap.data().value : null;
      this._cache[key] = val;
      return val;
    } catch(e) { return null; }
  },

  async set(key, value) {
    this._cache[key] = value;
    try {
      await db.collection('config').doc(key).set({
        value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch(e) { return false; }
  },

  async getPricing()  { return await this.get('pricing')      || { annual:1000, monthly:149, trial:7, reportLimit:0, refundDays:7 }; },
  async getApp()      { return await this.get('app')          || { appName:'Numerology Pro', phone:'8421427605', contactEmail:'deotigharekaustubh@gmail.com', maintenance:'off' }; },
  async getRazorpay() { return await this.get('razorpay')     || { keyId:'', mode:'test' }; },
  async getFeatures() { return await this.get('planFeatures') || ['Full access to all 30+ modules','Lo Shu Grid','Unlimited PDF exports']; },

  async preloadAll() {
    try {
      await Promise.all(['pricing','app','razorpay','planFeatures','module_states','notifications',
                         'policy_terms','policy_privacy','policy_refund'].map(k => this.get(k)));
    } catch(e) {}
  }
};

/* ── Users — reads/writes to Firestore /users ───────────── */
const MockUsers = {

  async getAll() {
    try {
      const snap = await db.collection('users').orderBy('createdAt','desc').get();
      return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    } catch(e) { return []; }
  },

  async update(uid, data) {
    try { await db.collection('users').doc(uid).update(data); return true; }
    catch(e) { return false; }
  },

  async block(uid, blocked) { return this.update(uid, { blocked }); },

  async activate(uid, days) {
    const exp = new Date(); exp.setDate(exp.getDate() + days);
    return this.update(uid, {
      subscriptionActive: true, subscriptionPlan: 'annual',
      subscriptionExpiry: firebase.firestore.Timestamp.fromDate(exp),
      subscriptionStart: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async extend(uid, days) {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return false;
    const base = snap.data().subscriptionExpiry?.toDate?.() || new Date();
    const newExp = new Date(Math.max(base, Date.now()));
    newExp.setDate(newExp.getDate() + days);
    return this.update(uid, {
      subscriptionActive: true,
      subscriptionExpiry: firebase.firestore.Timestamp.fromDate(newExp)
    });
  },

  async grantByEmail(email, days, note = '') {
    const snap = await db.collection('users').where('email','==',email).limit(1).get();
    if (snap.empty) return { ok:false, error:'No user found with email: ' + email + '. User must sign up first.' };
    const uid = snap.docs[0].id;
    const exp = new Date(); exp.setDate(exp.getDate() + days);
    await this.update(uid, {
      subscriptionActive: true, subscriptionPlan: 'granted',
      subscriptionExpiry: firebase.firestore.Timestamp.fromDate(exp),
      accessGrantedManually: true
    });
    await db.collection('granted_access').add({
      email, uid, days, note,
      grantedAt: firebase.firestore.FieldValue.serverTimestamp(),
      expiresAt: firebase.firestore.Timestamp.fromDate(exp),
      grantedBy: auth.currentUser?.email || 'admin'
    });
    return { ok: true, expiry: exp };
  },

  async getGrants() {
    try {
      const snap = await db.collection('granted_access').orderBy('grantedAt','desc').limit(50).get();
      return snap.docs.map(d => ({ id:d.id, ...d.data() }));
    } catch(e) { return []; }
  },

  async getPayments() {
    try {
      const snap = await db.collection('payments').orderBy('createdAt','desc').limit(100).get();
      return snap.docs.map(d => ({ id:d.id, ...d.data() }));
    } catch(e) { return []; }
  }
};

window.MockAuth   = MockAuth;
window.MockConfig = MockConfig;
window.MockUsers  = MockUsers;
