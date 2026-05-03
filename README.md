# Numerology Pro — Professional Numerology Suite

## Setup Instructions

### 1. Firebase Setup (Already Configured)
Firebase credentials are set in `js/firebase-config.js`.

**Enable in Firebase Console:**
- Authentication → Email/Password → Enable
- Firestore Database → Create in production mode

**Set Firestore Security Rules:**
Go to Firestore → Rules and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read, write: if request.auth.token.email in ['deotigharekaustubh@gmail.com'];
    }
    match /config/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email in ['deotigharekaustubh@gmail.com'];
    }
    match /granted_access/{doc} {
      allow read, write: if request.auth.token.email in ['deotigharekaustubh@gmail.com'];
    }
    match /payments/{doc} {
      allow read, write: if request.auth.token.email in ['deotigharekaustubh@gmail.com'];
    }
  }
}
```

### 2. Create Admin Account
- Go to your site → Sign Up with your email
- Go to Firebase Console → Authentication
- The email in ADMIN_EMAILS in firebase-config.js gets admin access automatically

### 3. GitHub Pages Deployment
- Push this repo to GitHub
- Settings → Pages → Deploy from main branch
- Your site will be live at: `https://yourusername.github.io/repo-name/`

## File Structure
```
/
├── index.html          ← Homepage
├── login.html          ← Sign In / Sign Up / Forgot Password
├── reset-password.html ← Password reset (Firebase email link)
├── dashboard.html      ← User dashboard (26 modules + Lo Shu Grid)
├── admin.html          ← Admin panel (9 tabs)
├── css/                ← All stylesheets
├── js/
│   ├── firebase-config.js   ← Your Firebase credentials
│   ├── firebase-auth.js     ← Firebase Auth + Firestore wrapper
│   ├── admin.js             ← Admin panel logic
│   ├── dashboard.js         ← User dashboard + all 25 modules
│   └── loshu.js             ← Lo Shu Grid engine
└── pages/
    ├── terms.html      ← Terms & Conditions
    ├── privacy.html    ← Privacy Policy
    └── refund.html     ← Refund Policy
```

## Admin Login
URL: `your-site.com/admin.html`
Email must be in ADMIN_EMAILS list in `js/firebase-config.js`

## Features
- 26 Numerology modules including Lo Shu Grid
- Module Manager — enable/disable any module from admin
- Grant access by email with custom duration
- Live pricing that shows on homepage
- Razorpay payment gateway (configurable)
- Policy editor (Terms, Privacy, Refund)
- Unlimited PDF report exports
- Full Firebase backend — all data permanent
