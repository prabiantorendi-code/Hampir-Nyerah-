// js/whatsapp.js

import { db, doc, getDoc } from './firebase-config.js';

const formatRupiahWA = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

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
  return {
    number: "6285825319756",
    orderTemplate: "Halo Admin Naufal Studio Gaming,\n\nSaya ingin membeli:\nGame: [GAME]\nItem: [ITEM]\nHarga: [PRICE]\n\nData Akun:\nUser ID: [USER_ID]\nServer ID: [SERVER_ID]\n\nMohon info pembayaran.",
    contactTemplate: "Halo Admin Naufal Studio Gaming,\n\nNama: [NAME]\nEmail: [EMAIL]\n\nPesan:\n[MESSAGE]"
  };
};

const handleCheckout = async (e) => {
  e.preventDefault();
  try {
    const btnBuy = document.getElementById('btn-buy');
    const userIdInput = document.getElementById('userId');
    const serverIdInput = document.getElementById('serverId');
    const serverInputContainer = document.getElementById('server-input-container');
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
    const gameName = btnBuy.dataset.selectedGameName;
    const productName = btnBuy.dataset.selectedProductName;
    const productPrice = btnBuy.dataset.selectedProductPrice;
    if (!productName || !productPrice) {
      alert("Mohon pilih nominal top up terlebih dahulu.");
      return;
    }
    btnBuy.textContent = "Memproses...";
    btnBuy.disabled = true;
    const waSettings = await getWASettings();
    let phone = waSettings.number;
    if (phone.startsWith('+')) {
      phone = phone.substring(1);
    } else if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }
    let message = waSettings.orderTemplate || "Halo Admin,\nSaya ingin order [GAME] - [ITEM] seharga [PRICE].\nID: [USER_ID] ([SERVER_ID])";
    message = message.replace('[GAME]', gameName || 'Game')
                     .replace('[ITEM]', productName)
                     .replace('[PRICE]', formatRupiahWA(productPrice))
                     .replace('[USER_ID]', userIdInput.value.trim())
                     .replace('[SERVER_ID]', serverIdInput.value.trim() || '-');
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    btnBuy.textContent = "Beli Sekarang";
    btnBuy.disabled = false;
    window.open(waUrl, '_blank');
  } catch (error) {
    const btnBuy = document.getElementById('btn-buy');
    if (btnBuy) {
      btnBuy.textContent = "Beli Sekarang";
      btnBuy.disabled = false;
    }
    alert("Terjadi kesalahan. Silakan coba lagi.");
  }
};

const handleContactForm = async (e) => {
  e.preventDefault();
  try {
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
    if (phone.startsWith('+')) {
      phone = phone.substring(1);
    } else if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }
    let message = waSettings.contactTemplate || "Halo Admin,\nNama: [NAME]\nEmail: [EMAIL]\nPesan: [MESSAGE]";
    message = message.replace('[NAME]', nameInput.value.trim())
                     .replace('[EMAIL]', emailInput.value.trim())
                     .replace('[MESSAGE]', messageInput.value.trim());
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    btnSubmit.textContent = "Kirim Pesan";
    btnSubmit.disabled = false;
    document.getElementById('contact-form').reset();
    window.open(waUrl, '_blank');
  } catch (error) {
    const btnSubmit = document.getElementById('btn-send-message');
    if (btnSubmit) {
      btnSubmit.textContent = "Kirim Pesan";
      btnSubmit.disabled = false;
    }
    alert("Terjadi kesalahan. Silakan coba lagi.");
  }
};

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
