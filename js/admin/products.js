// js/admin/products.js

import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from '../firebase-config.js';

// DOM Elements
const productsTableBody = document.getElementById('productsTableBody');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const btnAddProduct = document.getElementById('btnAddProduct');
const btnCloseModal = document.querySelector('#productModal .close-modal');
const btnCancel = document.getElementById('btnCancelProduct');
const modalTitle = document.getElementById('productModalTitle');
const gameFilter = document.getElementById('gameFilter');

// Form Inputs
const productIdInput = document.getElementById('productId');
const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const productGameIdInput = document.getElementById('productGameId');
const productStatusInput = document.getElementById('productStatus');
const productIsPromoInput = document.getElementById('productIsPromo');

// Game Mapping (Untuk efisiensi baca nama game tanpa query berulang)
let gamesMap = {};

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

// Load Games for Dropdowns and Mapping
const loadGamesData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'games'));
    let filterOptions = '<option value="">Semua Game</option>';
    let formOptions = '<option value="" disabled selected>Pilih Game</option>';
    
    gamesMap = {}; // Reset map
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      gamesMap[id] = data.name;
      
      filterOptions += `<option value="${id}">${data.name}</option>`;
      formOptions += `<option value="${id}">${data.name}</option>`;
    });
    
    if (gameFilter) gameFilter.innerHTML = filterOptions;
    if (productGameIdInput) productGameIdInput.innerHTML = formOptions;
    
  } catch (error) {
    console.error("Error loading games mapping: ", error);
    showToast("Gagal memuat daftar game.", true);
  }
};

// Load Products Data
const loadProducts = async (filterGameId = '') => {
  if (!productsTableBody) return;
  
  productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Memuat data...</td></tr>';
  
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    let html = '';
    let count = 0;
    
    if (querySnapshot.empty) {
      productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada produk/denom yang ditambahkan.</td></tr>';
      return;
    }
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      // Terapkan filter jika ada
      if (filterGameId && data.gameId !== filterGameId) return;
      
      count++;
      
      const gameName = gamesMap[data.gameId] || '<span style="color:var(--color-danger)">Game Tidak Ditemukan</span>';
      const statusBadge = data.status === 'active' 
        ? '<span class="status-badge status-active">Aktif</span>' 
        : '<span class="status-badge status-inactive">Nonaktif</span>';
        
      const promoBadge = data.isPromo 
        ? '<span class="badge" style="position:relative; top:0; right:0; margin-left:10px; display:inline-block;">PROMO</span>' 
        : '';

      const dataString = encodeURIComponent(JSON.stringify(data));
      
      html += `
        <tr>
          <td>
            <strong>${data.name}</strong>
            ${promoBadge}
          </td>
          <td>${gameName}</td>
          <td>${formatRupiah(data.price)}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-edit" data-id="${id}" data-item="${dataString}" title="Edit Produk">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn-icon btn-delete" data-id="${id}" title="Hapus Produk">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    
    if (count === 0) {
      productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Tidak ada produk untuk game ini.</td></tr>';
    } else {
      productsTableBody.innerHTML = html;
      attachActionListeners();
    }
    
  } catch (error) {
    console.error("Error loading products: ", error);
    productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-danger);">Gagal memuat data produk.</td></tr>';
    showToast("Gagal memuat data", true);
  }
};

// Open Modal
const openModal = (isEdit = false, id = '', data = null) => {
  productForm.reset();
  productIdInput.value = '';
  
  if (isEdit && data) {
    modalTitle.textContent = 'Edit Produk / Denom';
    productIdInput.value = id;
    productNameInput.value = data.name;
    productPriceInput.value = data.price;
    productGameIdInput.value = data.gameId;
    productStatusInput.value = data.status;
    productIsPromoInput.checked = data.isPromo || false;
  } else {
    modalTitle.textContent = 'Tambah Produk Baru';
    
    // Jika gameFilter sedang aktif di game tertentu, set default value form ke game tersebut
    if (gameFilter && gameFilter.value) {
      productGameIdInput.value = gameFilter.value;
    }
  }
  
  productModal.classList.add('show');
};

// Close Modal
const closeModal = () => {
  productModal.classList.remove('show');
  productForm.reset();
};

// Handle Form Submit
const saveProduct = async (e) => {
  e.preventDefault();
  
  const id = productIdInput.value;
  const submitBtn = productForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  
  submitBtn.textContent = 'Menyimpan...';
  submitBtn.disabled = true;
  
  const productData = {
    name: productNameInput.value.trim(),
    price: Number(productPriceInput.value),
    gameId: productGameIdInput.value,
    status: productStatusInput.value,
    isPromo: productIsPromoInput.checked,
    updatedAt: new Date().toISOString()
  };

  try {
    if (id) {
      await updateDoc(doc(db, 'products', id), productData);
      showToast("Produk berhasil diperbarui!");
    } else {
      productData.createdAt = new Date().toISOString();
      await addDoc(collection(db, 'products'), productData);
      showToast("Produk baru berhasil ditambahkan!");
    }
    
    closeModal();
    // Load products with current filter applied
    loadProducts(gameFilter ? gameFilter.value : '');
  } catch (error) {
    console.error("Error saving product: ", error);
    showToast("Terjadi kesalahan saat menyimpan data.", true);
  } finally {
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
  }
};

// Handle Delete
const deleteProduct = async (id) => {
  if (confirm("Apakah Anda yakin ingin menghapus produk/denom ini?")) {
    try {
      await deleteDoc(doc(db, 'products', id));
      showToast("Produk berhasil dihapus!");
      loadProducts(gameFilter ? gameFilter.value : '');
    } catch (error) {
      console.error("Error deleting product: ", error);
      showToast("Gagal menghapus produk.", true);
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
      deleteProduct(id);
    });
  });
};

// Initialization & Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Tunggu data games dimuat, lalu muat produk
  await loadGamesData();
  await loadProducts();
  
  if (gameFilter) {
    gameFilter.addEventListener('change', (e) => {
      loadProducts(e.target.value);
    });
  }
  
  if (btnAddProduct) {
    btnAddProduct.addEventListener('click', () => openModal(false));
  }
  
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeModal);
  }
  
  if (btnCancel) {
    btnCancel.addEventListener('click', closeModal);
  }
  
  if (productForm) {
    productForm.addEventListener('submit', saveProduct);
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === productModal) {
      closeModal();
    }
  });
});

