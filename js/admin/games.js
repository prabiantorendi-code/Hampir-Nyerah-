// js/admin/games.js

import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from '../firebase-config.js';

// DOM Elements
const gamesTableBody = document.getElementById('gamesTableBody');
const gameModal = document.getElementById('gameModal');
const gameForm = document.getElementById('gameForm');
const btnAddGame = document.getElementById('btnAddGame');
const btnCloseModal = document.querySelector('.close-modal');
const btnCancel = document.getElementById('btnCancel');
const modalTitle = document.getElementById('modalTitle');
const needServerIdCheckbox = document.getElementById('gameNeedServerId');
const serverLabelGroup = document.getElementById('serverLabelGroup');

// Form Inputs
const gameIdInput = document.getElementById('gameId');
const gameNameInput = document.getElementById('gameName');
const gameImageUrlInput = document.getElementById('gameImageUrl');
const gameCategoryInput = document.getElementById('gameCategory');
const gameStartPriceInput = document.getElementById('gameStartPrice');
const gameNeedServerIdInput = document.getElementById('gameNeedServerId');
const gameServerLabelInput = document.getElementById('gameServerLabel');
const gameStatusInput = document.getElementById('gameStatus');
const gameIsPromoInput = document.getElementById('gameIsPromo');
const gameIsHotInput = document.getElementById('gameIsHot');
const gameIsPopularInput = document.getElementById('gameIsPopular');

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

// Format Rupiah
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

// Load Games Data
const loadGames = async () => {
  if (!gamesTableBody) return;
  
  gamesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Memuat data...</td></tr>';
  
  try {
    const querySnapshot = await getDocs(collection(db, 'games'));
    let html = '';
    
    if (querySnapshot.empty) {
      gamesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada game yang ditambahkan.</td></tr>';
      return;
    }
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      const statusBadge = data.status === 'active' 
        ? '<span class="status-badge status-active">Aktif</span>' 
        : '<span class="status-badge status-inactive">Nonaktif</span>';
        
      let badges = [];
      if (data.isPromo) badges.push('<span class="badge" style="position:relative; top:0; right:0; margin-right:5px; display:inline-block;">SALE</span>');
      if (data.isHot) badges.push('<span class="badge" style="position:relative; top:0; right:0; margin-right:5px; display:inline-block;">HOT</span>');
      if (data.isPopular) badges.push('<span class="badge" style="position:relative; top:0; right:0; display:inline-block; background-color: var(--color-accent);">POPULER</span>');

      // Simpan data mentah di atribut data untuk edit
      const dataString = encodeURIComponent(JSON.stringify(data));
      
      html += `
        <tr>
          <td><img src="${data.imageUrl}" alt="${data.name}" class="table-img" loading="lazy"></td>
          <td>
            <strong>${data.name}</strong><br>
            <div style="margin-top: 5px;">${badges.join('')}</div>
          </td>
          <td>${data.category}</td>
          <td>${data.startPrice ? formatRupiah(data.startPrice) : '-'}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-edit" data-id="${id}" data-item="${dataString}" title="Edit Game">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn-icon btn-delete" data-id="${id}" title="Hapus Game">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    
    gamesTableBody.innerHTML = html;
    attachActionListeners();
    
  } catch (error) {
    console.error("Error loading games: ", error);
    gamesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-danger);">Gagal memuat data game.</td></tr>';
    showToast("Gagal memuat data", true);
  }
};

// Open Modal
const openModal = (isEdit = false, id = '', data = null) => {
  gameForm.reset();
  gameIdInput.value = '';
  
  if (isEdit && data) {
    modalTitle.textContent = 'Edit Game';
    gameIdInput.value = id;
    gameNameInput.value = data.name;
    gameImageUrlInput.value = data.imageUrl;
    gameCategoryInput.value = data.category;
    gameStartPriceInput.value = data.startPrice || '';
    gameNeedServerIdInput.checked = data.needServerId;
    gameServerLabelInput.value = data.serverLabel || '';
    gameStatusInput.value = data.status;
    gameIsPromoInput.checked = data.isPromo || false;
    gameIsHotInput.checked = data.isHot || false;
    gameIsPopularInput.checked = data.isPopular || false;
    
    // Trigger change event for server label toggle
    needServerIdCheckbox.dispatchEvent(new Event('change'));
  } else {
    modalTitle.textContent = 'Tambah Game Baru';
    gameNeedServerIdInput.checked = true; // Default to true
    needServerIdCheckbox.dispatchEvent(new Event('change'));
  }
  
  gameModal.classList.add('show');
};

// Close Modal
const closeModal = () => {
  gameModal.classList.remove('show');
  gameForm.reset();
};

// Handle Form Submit
const saveGame = async (e) => {
  e.preventDefault();
  
  const id = gameIdInput.value;
  const submitBtn = gameForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  
  submitBtn.textContent = 'Menyimpan...';
  submitBtn.disabled = true;
  
  const gameData = {
    name: gameNameInput.value.trim(),
    imageUrl: gameImageUrlInput.value.trim(),
    category: gameCategoryInput.value,
    startPrice: Number(gameStartPriceInput.value) || 0,
    needServerId: gameNeedServerIdInput.checked,
    serverLabel: gameServerLabelInput.value.trim() || 'Server ID',
    status: gameStatusInput.value,
    isPromo: gameIsPromoInput.checked,
    isHot: gameIsHotInput.checked,
    isPopular: gameIsPopularInput.checked,
    updatedAt: new Date().toISOString()
  };

  try {
    if (id) {
      // Update existing
      await updateDoc(doc(db, 'games', id), gameData);
      showToast("Game berhasil diperbarui!");
    } else {
      // Add new
      gameData.createdAt = new Date().toISOString();
      await addDoc(collection(db, 'games'), gameData);
      showToast("Game baru berhasil ditambahkan!");
    }
    
    closeModal();
    loadGames();
  } catch (error) {
    console.error("Error saving game: ", error);
    showToast("Terjadi kesalahan saat menyimpan data.", true);
  } finally {
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
  }
};

// Handle Delete
const deleteGame = async (id) => {
  if (confirm("Apakah Anda yakin ingin menghapus game ini? Semua produk yang terkait mungkin tidak akan tampil dengan benar.")) {
    try {
      await deleteDoc(doc(db, 'games', id));
      showToast("Game berhasil dihapus!");
      loadGames();
    } catch (error) {
      console.error("Error deleting game: ", error);
      showToast("Gagal menghapus game.", true);
    }
  }
};

// Attach Listeners to Table Buttons
const attachActionListeners = () => {
  const editBtns = document.querySelectorAll('.btn-edit');
  const deleteBtns = document.querySelectorAll('.btn-delete');
  
  editBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const data = JSON.parse(decodeURIComponent(btn.getAttribute('data-item')));
      openModal(true, id, data);
    });
  });
  
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteGame(id);
    });
  });
};

// Initialization & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadGames();
  
  if (btnAddGame) {
    btnAddGame.addEventListener('click', () => openModal(false));
  }
  
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeModal);
  }
  
  if (btnCancel) {
    btnCancel.addEventListener('click', closeModal);
  }
  
  if (gameForm) {
    gameForm.addEventListener('submit', saveGame);
  }
  
  if (needServerIdCheckbox) {
    needServerIdCheckbox.addEventListener('change', function() {
      if (this.checked) {
        serverLabelGroup.style.display = 'block';
      } else {
        serverLabelGroup.style.display = 'none';
      }
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === gameModal) {
      closeModal();
    }
  });
});

