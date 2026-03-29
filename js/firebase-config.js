/* ============================================================
   SJC UBMS — Firebase Configuration
   Unified Cloud Database for all 6 Business Entities
   ============================================================

   FIRST-TIME SETUP (do this once):
   1. Go to https://console.firebase.google.com
   2. Click "Add project" — name it "sjc-ubms" (or any name)
   3. Inside the project: Build → Firestore Database → Create database
      • Choose "Start in production mode"
      • Select server location: asia-southeast1 (Singapore — closest to PH)
   4. Build → Authentication → Sign-in method → (not required for this app)
   5. Click the web icon (</>)  in Project Overview → Add app → Register
   6. Copy the firebaseConfig values below and replace the placeholders
   7. In Firestore → Rules, paste these rules and click Publish:

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }

   NOTE: Tighten security rules once the system is stable.
   ============================================================ */

const FIREBASE_CONFIG = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
};

/* ── Auto-initialise ───────────────────────────────────────── */
(function initFirebase() {
    const isConfigured = !Object.values(FIREBASE_CONFIG).some(
        v => typeof v === 'string' && v.startsWith('YOUR_')
    );

    if (!isConfigured) {
        window.FIREBASE_ENABLED = false;
        window.FIRESTORE         = null;
        console.warn(
            '[SJC UBMS] Firebase is NOT configured.\n' +
            'Data is stored locally on this device only.\n' +
            'Edit js/firebase-config.js to enable cloud sync.'
        );
        return;
    }

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        const db = firebase.firestore();

        /* Enable offline/multi-tab persistence */
        db.enablePersistence({ synchronizeTabs: true })
            .catch(err => {
                if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
                    console.warn('[Firebase] Persistence error:', err.code);
                }
            });

        window.FIREBASE_ENABLED = true;
        window.FIRESTORE         = db;
        console.log('[SJC UBMS] Firebase connected — cloud storage active.');
    } catch (err) {
        window.FIREBASE_ENABLED = false;
        window.FIRESTORE         = null;
        console.error('[SJC UBMS] Firebase init failed:', err.message);
    }
})();
