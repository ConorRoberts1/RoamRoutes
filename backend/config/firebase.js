const admin = require("firebase-admin");
const serviceAccount = require("./firebaseServiceAccountKey.json"); // Path to your Firebase service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };
