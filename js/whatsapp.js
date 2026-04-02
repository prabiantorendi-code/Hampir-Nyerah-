// js/whatsapp.js

import { db, doc, getDoc } from './firebase-config.js';

// Format Rupiah (helper)
const formatRupiahWA = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

// Fungsi untuk mendapatkan pengaturan WhatsApp dari Firebase
const getWASettings = async () => {
  try {
    const waRef = doc(db, 'settings', 'whatsapp');
    const waSnap = await getDoc(waRef);
    if (waSnap.exists()) {
      return waSnap.data();
    }
  } catch (error) {
    console.error("Gagal mengambil pengaturan WA:", error);
  }
  // Default fallback jika data tidak ditemukan di Firebase
  return {
    number: "6281234567890", 
    orderTemplate: "Halo Admin Naufal Studio Gaming,\n\nSaya ingin membeli:\nGame: [GAME]\nItem: [ITEM]\nHarga: [PRICE]\n\nData Akun:\nUser ID: [USER_ID]\nServer ID: [SERVER_ID]\n\nMohon info pembayaran.",
    contactTemplate: "Halo Admin Naufal Studio Gaming,\n\nNama: [NAME]\nEmail: [EMAIL]\n\nPesan:\n[MESSAGE]"
  };
};

// Handle Pembelian (Checkout di detail-game.html)
const handleCheckout = async (e) => {
  e.preventDefault();

  const btnBuy = document.getElementById('btn-buy');
  const userIdInput = document.getElementById('userId');
  const serverIdInput = document.getElementById('serverId');
  const serverInputContainer = document.getElementById('server-input-container');

  // Validasi Input
  if (!userIdInput.value.trim()) {
    alert("Mohon masukkan User ID Anda.");
    userIdInput.focus();
    return;
  }

  if (serverInputContainer.style.display !== 'none' && !serverIdInput.value.trim()) {
    alert("Mohon masukkan Server / Zone ID Anda.");
    serverIdInput.focus();
    return;
  }

  // Validasi Pemilihan Produk
  const gameName = btnBuy.dataset.selectedGameName;
  const productName = btnBuy.dataset.selectedProductName;
  const productPrice = btnBuy.dataset.selectedProductPrice;

  if (!productName || !productPrice) {
    alert("Mohon pilih nominal top up terlebih dahulu.");
    return;
  }

  // Ubah tombol saat memproses
  btnBuy.textContent = "Memproses...";
  btnBuy.disabled = true;

  // Ambil Pengaturan WA
  const waSettings = await getWASettings();
  let phone = waSettings.number;
  
  // Pastikan format nomor telepon benar (awalan 62 untuk Indonesia)
  if (phone.startsWith('0')) {
    phone = '62' + phone.substring(1);
  }

  // Replace template dengan data asli
  let message = waSettings.orderTemplate || "Halo Admin,\nSaya ingin order [GAME] - [ITEM] seharga [PRICE].\nID: [USER_ID] ([SERVER_ID])";
  message = message.replace('[GAME]', gameName || 'Game')
                   .replace('[ITEM]', productName)
                   .replace('[PRICE]', formatRupiahWA(productPrice))
                   .replace('[USER_ID]', userIdInput.value.trim())
                   .replace('[SERVER_ID]', serverIdInput.value.trim() || '-');

  // Encode URL
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  // Kembalikan tombol ke semula dan buka WhatsApp
  btnBuy.textContent = "Beli Sekarang";
  btnBuy.disabled = false;
  window.open(waUrl, '_blank');
};

// Handle Contact Form (contact.html)
const handleContactForm = async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  const messageInput = document.getElementById('contactMessage');
  const btnSubmit = document.getElementById('btn-send-message');

  if (!nameInput.value.trim() || !emailInput.value.trim() || !messageInput.value.trim()) {
    alert("Mohon lengkapi semua kolom form.");
    return;
  }

  btnSubmit.textContent = "Mengirim...";
  btnSubmit.disabled = true;

  const waSettings = await getWASettings();
  let phone = waSettings.number;
  if (phone.startsWith('0')) {
    phone = '62' + phone.substring(1);
  }

  let message = waSettings.contactTemplate || "Halo Admin,\nNama: [NAME]\nEmail: [EMAIL]\nPesan: [MESSAGE]";
  message = message.replace('[NAME]', nameInput.value.trim())
                   .replace('[EMAIL]', emailInput.value.trim())
                   .replace('[MESSAGE]', messageInput.value.trim());

  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  btnSubmit.textContent = "Kirim Pesan";
  btnSubmit.disabled = false;
  
  // Reset form setelah terbuka
  document.getElementById('contact-form').reset();
  window.open(waUrl, '_blank');
};

// Pasang Event Listener saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  const btnBuy = document.getElementById('btn-buy');
  if (btnBuy) {
    btnBuy.addEventListener('click', handleCheckout);
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactForm);
  }
});

