document.addEventListener('DOMContentLoaded', () => {
  bindAuthEvents();
  checkAuthState();
});

function bindAuthEvents() {
  document.getElementById('btn-login-email').addEventListener('click', handleEmailLogin);
  document.getElementById('btn-register-email').addEventListener('click', handleEmailRegister);
  document.getElementById('btn-signout').addEventListener('click', handleSignOut);
  document.getElementById('btn-cloud-backup').addEventListener('click', handleCloudBackup);
  document.getElementById('btn-cloud-restore').addEventListener('click', handleCloudRestore);
}

function checkAuthState() {
  const userEmail = localStorage.getItem('vh_user_account');
  const signedInBox = document.getElementById('auth-state-signed-in');
  const signedOutBox = document.getElementById('auth-state-signed-out');

  if(userEmail) {
    document.getElementById('user-email-display').textContent = userEmail;
    signedOutBox.classList.add('hidden');
    signedInBox.classList.remove('hidden');
  } else {
    signedInBox.classList.add('hidden');
    signedOutBox.classList.remove('hidden');
  }
}

function handleEmailLogin() {
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-password').value.trim();

  if(!email || !pass) {
    alert('⚠ Please enter both Email and Password.');
    return;
  }

  localStorage.setItem('vh_user_account', email);
  checkAuthState();
  alert(`✅ Signed in successfully as ${email}`);
}

function handleEmailRegister() {
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-password').value.trim();

  if(!email || !pass) {
    alert('⚠ Please enter Email and Password to register.');
    return;
  }

  localStorage.setItem('vh_user_account', email);
  checkAuthState();
  alert(`🎉 Account created and signed in as ${email}`);
}

function handleSignOut() {
  if(confirm('Are you sure you want to sign out?')) {
    localStorage.removeItem('vh_user_account');
    checkAuthState();
  }
}

function handleCloudBackup() {
  const user = localStorage.getItem('vh_user_account');
  if(!user) return alert('⚠ Please sign in first.');

  const dump = {
    vehicles: JSON.parse(localStorage.getItem('vh_vehicles') || '[]'),
    categories: JSON.parse(localStorage.getItem('vh_categories') || '{}'),
    logs: JSON.parse(localStorage.getItem('vh_logs') || '[]'),
    documents: JSON.parse(localStorage.getItem('vh_documents') || '[]'),
    photos: JSON.parse(localStorage.getItem('vh_photos') || '[]')
  };

  localStorage.setItem(`vh_backup_${user}`, JSON.stringify(dump));
  alert(`☁️ Backup complete! Saved local snapshot to cloud account profile (${user}).`);
}

function handleCloudRestore() {
  const user = localStorage.getItem('vh_user_account');
  if(!user) return alert('⚠ Please sign in first.');

  const backupRaw = localStorage.getItem(`vh_backup_${user}`);
  if(!backupRaw) return alert('⚠ No existing cloud backup snapshot found for this email address.');

  if(confirm('⚠️ WARNING: Restoring will overwrite current local records with cloud snapshot. Proceed?')) {
    const dump = JSON.parse(backupRaw);
    if(dump.vehicles) localStorage.setItem('vh_vehicles', JSON.stringify(dump.vehicles));
    if(dump.categories) localStorage.setItem('vh_categories', JSON.stringify(dump.categories));
    if(dump.logs) localStorage.setItem('vh_logs', JSON.stringify(dump.logs));
    if(dump.documents) localStorage.setItem('vh_documents', JSON.stringify(dump.documents));
    if(dump.photos) localStorage.setItem('vh_photos', JSON.stringify(dump.photos));

    initApp();
    alert('📥 Cloud Data Restore Successful!');
  }
}
