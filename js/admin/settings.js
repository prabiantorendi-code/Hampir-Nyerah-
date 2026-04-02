// js/admin/settings.js

import { db, doc, getDoc, updateDoc } from '../firebase-config.js';
// Import setDoc khusus untuk file ini agar bisa membuat dokumen jika belum ada
import { setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const settingsForm = document.getElementById('settingsForm');
const siteNameInput = document.getElementById('siteName');
const logoUrlInput = document.getElementById('logoUrl');
const colorPrimaryInput = document.getElementById('colorPrimary');
const colorSecondaryInput = document.getElementById('colorSecondary');
const colorAccentInput = document.getElementById('colorAccent');
const maintenanceModeInput = document.getElementById('maintenanceMode');
const btnSave = document.getElementById('btnSaveSettings');

// Preview Elements (Opsional, jika ada di HTML)
const logoPreview = document.getElementById('logoPreview');

// Toast Notification
const showToast = (message, isError = false) => {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast show ${isError ? 'error' : ''}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
};

// Load General Settings
const loadSettings = async () => {
  if (!settingsForm) return;

  try {
    const docRef = doc(db, 'settings', 'general');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      if (siteNameInput) siteNameInput.value = data.siteName || 'Naufal Studio Gaming';
      if (logoUrlInput) logoUrlInput.value = data.logoUrl || '';
      if (colorPrimaryInput) colorPrimaryInput.value = data.colorPrimary || '#FF2D8A';
      if (colorSecondaryInput) colorSecondaryInput.value = data.colorSecondary || '#C026A0';
      if (colorAccentInput) colorAccentInput.value = data.colorAccent || '#7B2FBE';
      if (maintenanceModeInput) maintenanceModeInput.checked = data.maintenanceMode || false;

      // Update Preview Logo jika ada
      if (logoPreview && data.logoUrl) {
        logoPreview.src = data.logoUrl;
      }
    } else {
      // Default value jika dokumen belum ada di Firebase
      if (siteNameInput) siteNameInput.value = 'Naufal Studio Gaming';
      if (colorPrimaryInput) colorPrimaryInput.value = '#FF2D8A';
      if (colorSecondaryInput) colorSecondaryInput.value = '#C026A0';
      if (colorAccentInput) colorAccentInput.value = '#7B2FBE';
    }
  } catch (error) {
    console.error("Error loading settings: ", error);
    showToast("Gagal memuat pengaturan.", true);
  }
};

// Handle Form Submit (Save Settings)
const saveSettings = async (e) => {
  e.preventDefault();
  
  const originalBtnText = btnSave.textContent;
  btnSave.textContent = 'Menyimpan...';
  btnSave.disabled = true;

  const settingsData = {
    siteName: siteNameInput.value.trim(),
    logoUrl: logoUrlInput.value.trim(),
    colorPrimary: colorPrimaryInput.value,
    colorSecondary: colorSecondaryInput.value,
    colorAccent: colorAccentInput.value,
    maintenanceMode: maintenanceModeInput.checked,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'settings', 'general');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, settingsData);
    } else {
      // Gunakan setDoc jika dokumen 'general' belum pernah dibuat sebelumnya
      await setDoc(docRef, settingsData);
    }

    // Terapkan warna baru ke CSS Variables di Dashboard secara realtime
    document.documentElement.style.setProperty('--color-primary', settingsData.colorPrimary);
    document.documentElement.style.setProperty('--color-secondary', settingsData.colorSecondary);
    document.documentElement.style.setProperty('--color-accent', settingsData.colorAccent);

    // Update logo preview
    if (logoPreview && settingsData.logoUrl) {
      logoPreview.src = settingsData.logoUrl;
    }

    showToast("Pengaturan berhasil disimpan!");
  } catch (error) {
    console.error("Error saving settings: ", error);
    showToast("Gagal menyimpan pengaturan.", true);
  } finally {
    btnSave.textContent = originalBtnText;
    btnSave.disabled = false;
  }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  if (settingsForm) {
    settingsForm.addEventListener('submit', saveSettings);
  }

  // Real-time Logo Preview Update
  if (logoUrlInput && logoPreview) {
    logoUrlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) {
        logoPreview.src = url;
      }
    });
  }
});

