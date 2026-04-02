// js/auth.js

import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase-config.js';

// Fungsi untuk mengecek status login admin
const checkAuth = () => {
  onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');
    const isAdminPage = currentPath.includes('/admin/') && !isLoginPage;

    if (user) {
      // Jika sudah login tapi buka halaman login, arahkan ke dashboard
      if (isLoginPage) {
        window.location.href = 'dashboard.html';
      }
      
      // Update UI untuk admin yang login (misal menampilkan email di sidebar)
      const adminEmailDisplay = document.getElementById('adminUserEmail');
      if (adminEmailDisplay) {
        adminEmailDisplay.textContent = user.email;
      }
    } else {
      // Jika belum login tapi coba akses halaman admin, lempar ke login
      if (isAdminPage) {
        window.location.href = 'login.html';
      }
    }
  });
};

// Fungsi penanganan form login
const handleLogin = async (e) => {
  e.preventDefault();
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  let errorMsg = document.getElementById('loginError');

  // Buat elemen error jika belum ada di DOM
  if (!errorMsg) {
    errorMsg = document.createElement('div');
    errorMsg.id = 'loginError';
    errorMsg.style.color = 'var(--color-danger)';
    errorMsg.style.marginTop = '15px';
    errorMsg.style.fontSize = '14px';
    errorMsg.style.display = 'none';
    loginBtn.parentNode.insertBefore(errorMsg, loginBtn.nextSibling);
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    errorMsg.textContent = 'Email dan password wajib diisi.';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    // Ubah status tombol
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Memproses...';
    loginBtn.disabled = true;
    errorMsg.style.display = 'none';

    // Proses login ke Firebase
    await signInWithEmailAndPassword(auth, email, password);
    
    // Redirect akan ditangani oleh onAuthStateChanged, tapi kita berikan fallback
    window.location.href = 'dashboard.html';
    
  } catch (error) {
    console.error("Login error:", error);
    errorMsg.textContent = 'Login gagal: Periksa kembali email dan password Anda.';
    errorMsg.style.display = 'block';
    
    // Kembalikan status tombol
    loginBtn.textContent = 'Login';
    loginBtn.disabled = false;
  }
};

// Fungsi penanganan logout
const handleLogout = async (e) => {
  if (e) e.preventDefault();
  
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (error) {
    console.error("Logout error:", error);
    alert("Terjadi kesalahan saat logout. Silakan coba lagi.");
  }
};

// Inisialisasi Event Listener saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  // Selalu cek status auth di setiap halaman yang memuat script ini
  checkAuth();

  // Pasang event listener untuk form login jika ada di halaman
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Pasang event listener untuk tombol logout jika ada di halaman
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

export { checkAuth, handleLogout };
