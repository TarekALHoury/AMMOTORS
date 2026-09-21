const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

async function main() {
  const email = process.argv[2];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!email || !projectId) {
    throw new Error('Usage: npm run admin:grant -- admin@example.com (FIREBASE_PROJECT_ID required)');
  }

  const app = initializeApp({ credential: applicationDefault(), projectId });
  const auth = getAuth(app);
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
  console.log(`Granted the admin claim to ${email} (${user.uid}).`);
  console.log('The user must sign out and sign in again to refresh their ID token.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
