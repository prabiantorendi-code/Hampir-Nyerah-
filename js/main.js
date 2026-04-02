// js/main.js

import { db, collection, getDocs, doc, getDoc, query, where, orderBy } from './firebase-config.js';

// --- Sidebar & Mobile Navigation Logic ---
const initNavigation = () => {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && e.target !== menuToggle && !menuToggle.contains(e.target)) {
          sidebar.classList.remove('show');
        }
      }
    });
  }
};

// --- Format Currency ---
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

// --- Home Page: Load Games by Category ---
const loadGamesHome = async () => {
  const populerGrid = document.getElementById('populer-grid');
  const mobileGrid = document.getElementById('mobile-grid');
  const pcGrid = document.getElementById('pc-grid');
  const voucherGrid = document.getElementById('voucher-grid');

  // If not on home page, exit
  if (!populerGrid && !mobileGrid && !pcGrid && !voucherGrid) return;

  try {
    const q = query(collection(db, 'games'), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    
    let htmlPopuler = '';
    let htmlMobile = '';
    let htmlPC = '';
    let htmlVoucher = '';

    snapshot.forEach(gameDoc => {
      const data = gameDoc.data();
      const gameId = gameDoc.id;
      
      const badgeHtml = data.isPromo ? `<div class="badge">SALE</div>` : (data.isHot ? `<div class="badge">HOT</div>` : '');
      const priceText = data.startPrice ? `Mulai dari ${formatRupiah(data.startPrice)}` : 'Harga bervariasi';

      const cardHtml = `
        <a href="detail-game.html?id=${gameId}" class="game-card">
          ${badgeHtml}
          <img src="${data.imageUrl}" alt="${data.name}" class="card-image" loading="lazy">
          <div class="card-info">
            <h3 class="card-title">${data.name}</h3>
            <span class="card-price">${priceText}</span>
          </div>
        </a>
      `;

      if (data.isPopular) htmlPopuler += cardHtml;
      
      switch (data.category) {
        case 'Mobile':
          htmlMobile += cardHtml;
          break;
        case 'PC':
          htmlPC += cardHtml;
          break;
        case 'Voucher':
          htmlVoucher += cardHtml;
          break;
      }
    });

    if (populerGrid) populerGrid.innerHTML = htmlPopuler || '<p class="text-secondary">Belum ada game populer.</p>';
    if (mobileGrid) mobileGrid.innerHTML = htmlMobile || '<p class="text-secondary">Belum ada game mobile.</p>';
    if (pcGrid) pcGrid.innerHTML = htmlPC || '<p class="text-secondary">Belum ada game PC.</p>';
    if (voucherGrid) voucherGrid.innerHTML = htmlVoucher || '<p class="text-secondary">Belum ada voucher.</p>';

  } catch (error) {
    console.error("Error loading games:", error);
  }
};

// --- Detail Game Page Logic ---
const loadGameDetail = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('id');
  
  const detailContainer = document.getElementById('detail-main-wrapper');
  if (!detailContainer || !gameId) return;

  try {
    // Get Game Data
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists() || gameSnap.data().status !== 'active') {
      detailContainer.innerHTML = '<h2>Game tidak ditemukan atau sedang tidak aktif.</h2>';
      return;
    }

    const gameData = gameSnap.data();
    
    // Set Game Info in UI
    document.getElementById('detail-game-img').src = gameData.imageUrl;
    document.getElementById('detail-game-img').alt = gameData.name;
    document.getElementById('detail-game-title').textContent = gameData.name;
    document.getElementById('detail-game-developer').textContent = gameData.developer || 'Naufal Studio Gaming';
    document.getElementById('detail-game-desc').innerHTML = gameData.description || 'Top up diamond / koin tercepat dan termurah.';

    // Setup input placehoder based on game category (Mobile Legends uses Zone ID, Genshin uses Server)
    const serverInputContainer = document.getElementById('server-input-container');
    const serverLabel = document.getElementById('server-label');
    if (gameData.needServerId === false) {
      serverInputContainer.style.display = 'none';
      document.getElementById('serverId').removeAttribute('required');
    } else {
      serverLabel.textContent = gameData.serverLabel || 'Server ID';
    }

    // Get Products (Denominations)
    const productsQ = query(collection(db, 'products'), where('gameId', '==', gameId));
    const productsSnap = await getDocs(productsQ);
    
    const denomGrid = document.getElementById('denom-grid');
    denomGrid.innerHTML = '';

    if (productsSnap.empty) {
      denomGrid.innerHTML = '<p class="text-secondary">Belum ada produk tersedia untuk game ini.</p>';
      document.getElementById('btn-buy').disabled = true;
      return;
    }

    productsSnap.forEach(prodDoc => {
      const prodData = prodDoc.data();
      const prodId = prodDoc.id;
      
      const denomItem = document.createElement('div');
      denomItem.className = 'denom-item';
      denomItem.dataset.id = prodId;
      denomItem.dataset.name = prodData.name;
      denomItem.dataset.price = prodData.price;
      
      denomItem.innerHTML = `
        <div class="denom-name">${prodData.name}</div>
        <div class="denom-price">${formatRupiah(prodData.price)}</div>
      `;
      
      denomItem.addEventListener('click', function() {
        // Remove active class from all
        document.querySelectorAll('.denom-item').forEach(el => el.classList.remove('active'));
        // Add active class to clicked
        this.classList.add('active');
        
        // Update Buy Button dataset
        const btnBuy = document.getElementById('btn-buy');
        btnBuy.dataset.selectedProductName = this.dataset.name;
        btnBuy.dataset.selectedProductPrice = this.dataset.price;
        btnBuy.dataset.selectedGameName = gameData.name;
      });
      
      denomGrid.appendChild(denomItem);
    });

  } catch (error) {
    console.error("Error loading game details:", error);
    detailContainer.innerHTML = '<p class="text-secondary">Terjadi kesalahan memuat data. Silakan refresh halaman.</p>';
  }
};

// --- Search Functionality ---
const initSearch = () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
          // Simplistic search: redirect to index.html with query param
          // Note: Full implementation would use a dedicated search page or filter the current grid
          window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }
};

// Handle generic search parameter on index
const handleSearchParam = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQ = urlParams.get('search');
  
  if (searchQ && document.getElementById('populer-grid')) {
    // Scroll to top and filter logic (In a real app, you'd filter the loaded games array)
    // For this boilerplate, we'll just alert or adjust UI
    const sectionTitle = document.querySelector('.section-title');
    if(sectionTitle) {
      sectionTitle.textContent = `Hasil Pencarian: "${searchQ}"`;
    }
  }
};


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearch();
  loadGamesHome();
  loadGameDetail();
  handleSearchParam();
});

