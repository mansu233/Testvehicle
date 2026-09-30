// app.js - Full Vehicle Hub with Dynamic Multi-Mode Payment Engine & Settlement Ledger

const DEFAULT_CATEGORIES = {
  fuel: ['Full Tank', 'Partial Tank', 'Premium Fuel'],
  maintenance: ['Oil Change', 'Tire Rotation', 'Brake Service', 'General Maintenance'],
  expense: ['Toll', 'Parking', 'Car Wash', 'Insurance', 'Registration']
};

const DEFAULT_VEHICLE_SPECS = {
  "🛞 Tyre Specs": [
    { id: 1, key: "Tyre Brand / Company", value: "Michelin" },
    { id: 2, key: "Air Pressure", value: "33 PSI Front / 35 PSI Rear" },
    { id: 3, key: "Replacement Period", value: "40,000 KM" }
  ],
  "🔋 Battery Specs": [
    { id: 4, key: "Battery Brand", value: "Amaron" },
    { id: 5, key: "Replacement Interval", value: "24 Months" }
  ],
  "🛢️ Engine Oil Specs": [
    { id: 6, key: "Oil Brand", value: "Castrol Magnatec" },
    { id: 7, key: "Oil Grade", value: "15W-40" },
    { id: 8, key: "Oil Change Interval", value: "5,000 KM" }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  initCategories();
  initVehicleData();
  setupTabNavigation();
  setupQuickLogForm();
  setupVehicleProfileForm();
  setupCategoryManager();
  setupVehiclePhotoManager();
  setupDynamicSpecsManager();
  setupAppNavigation();
  updateFinanceUI();
});

// -------------------------------------------------------------
// 1. VEHICLE INITIALIZATION & OWNERSHIP SETUP
// -------------------------------------------------------------
function initVehicleData() {
  const vehicleSelect = document.getElementById('vehicle-select');
  const inputVehicleName = document.getElementById('input-vehicle-name');
  const inputRegNumber = document.getElementById('input-reg-number');
  const inputPartnerA = document.getElementById('input-partner-a');
  const inputPartnerB = document.getElementById('input-partner-b');
  const inputShareA = document.getElementById('input-share-a');
  const inputShareB = document.getElementById('input-share-b');
  const singlePayerSelect = document.getElementById('log-single-payer');

  let vehicles = JSON.parse(localStorage.getItem('vehiclehub_vehicles') || '[]');
  if (vehicles.length === 0) {
    vehicles = [{ 
      id: 'v1', 
      name: 'Primary Vehicle', 
      regNumber: '', 
      partnerA: 'Mansoor', 
      partnerB: 'Partner 2', 
      shareA: 50, 
      shareB: 50 
    }];
    localStorage.setItem('vehiclehub_vehicles', JSON.stringify(vehicles));
  }

  const activeVehicleId = vehicleSelect ? vehicleSelect.value || vehicles[0].id : vehicles[0].id;
  const active = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];

  if (vehicleSelect) {
    vehicleSelect.innerHTML = '';
    vehicles.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.regNumber ? `${v.name} (${v.regNumber.toUpperCase()})` : v.name;
      vehicleSelect.appendChild(opt);
    });
    vehicleSelect.value = active.id;
  }

  if (inputVehicleName) inputVehicleName.value = active.name || '';
  if (inputRegNumber) inputRegNumber.value = active.regNumber || '';
  if (inputPartnerA) inputPartnerA.value = active.partnerA || 'Partner 1';
  if (inputPartnerB) inputPartnerB.value = active.partnerB || 'Partner 2';
  if (inputShareA) inputShareA.value = active.shareA !== undefined ? active.shareA : 50;
  if (inputShareB) inputShareB.value = active.shareB !== undefined ? active.shareB : 50;

  // Populate Payer Select Dropdown
  if (singlePayerSelect) {
    singlePayerSelect.innerHTML = `
      <option value="${active.partnerA || 'Partner 1'}">👤 ${active.partnerA || 'Partner 1'}</option>
      <option value="${active.partnerB || 'Partner 2'}">👤 ${active.partnerB || 'Partner 2'}</option>
    `;
  }

  // Update Split Labels
  const lblA = document.getElementById('lbl-split-a');
  const lblB = document.getElementById('lbl-split-b');
  if (lblA) lblA.textContent = `${active.partnerA || 'Partner 1'} Contribution`;
  if (lblB) lblB.textContent = `${active.partnerB || 'Partner 2'} Contribution`;

  renderDynamicSpecsUI();
  updateFinanceUI();
  updateLogsListUI();
}

function setupVehicleProfileForm() {
  const form = document.getElementById('vehicle-setup-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const activeId = document.getElementById('vehicle-select')?.value || 'v1';
    
    const name = document.getElementById('input-vehicle-name').value.trim() || 'Primary Vehicle';
    const reg = document.getElementById('input-reg-number').value.trim();
    const pA = document.getElementById('input-partner-a')?.value.trim() || 'Partner 1';
    const pB = document.getElementById('input-partner-b')?.value.trim() || 'Partner 2';
    const sA = Number(document.getElementById('input-share-a')?.value) || 50;
    const sB = Number(document.getElementById('input-share-b')?.value) || 50;

    let vehicles = JSON.parse(localStorage.getItem('vehiclehub_vehicles') || '[]');
    let target = vehicles.find(v => v.id === activeId);

    if (!target) {
      target = { id: activeId, name, regNumber: reg, partnerA: pA, partnerB: pB, shareA: sA, shareB: sB };
      vehicles.push(target);
    } else {
      target.name = name;
      target.regNumber = reg;
      target.partnerA = pA;
      target.partnerB = pB;
      target.shareA = sA;
      target.shareB = sB;
    }

    localStorage.setItem('vehiclehub_vehicles', JSON.stringify(vehicles));
    initVehicleData();
    alert('✅ Vehicle Ownership & Profile updated successfully!');
  });
}

// -------------------------------------------------------------
// 2. QUICK LOG ENTRY WITH MULTI-MODE PAYMENT ENGINE
// -------------------------------------------------------------
function setupQuickLogForm() {
  const form = document.getElementById('quick-log-form');
  const dateInput = document.getElementById('log-date');
  const paymentModeSelect = document.getElementById('log-payment-mode');
  const singleGroup = document.getElementById('payer-single-group');
  const splitGroup = document.getElementById('payer-split-group');

  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Dynamic Payment UI Toggle
  if (paymentModeSelect) {
    paymentModeSelect.addEventListener('change', () => {
      const mode = paymentModeSelect.value;
      if (mode === 'custom_split') {
        singleGroup.classList.add('hidden');
        splitGroup.classList.remove('hidden');
      } else if (mode === 'shared_fund') {
        singleGroup.classList.add('hidden');
        splitGroup.classList.add('hidden');
      } else {
        singleGroup.classList.remove('hidden');
        splitGroup.classList.add('hidden');
      }
    });
  }

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const activeTab = document.querySelector('.log-tabs .tab-btn.active');
    const logType = activeTab ? activeTab.getAttribute('data-type') : 'fuel';
    const activeVehicleId = document.getElementById('vehicle-select')?.value || 'v1';
    const totalAmount = Number(document.getElementById('log-amount').value) || 0;
    const mode = paymentModeSelect ? paymentModeSelect.value : 'personal';

    const vehicles = JSON.parse(localStorage.getItem('vehiclehub_vehicles') || '[]');
    const activeVeh = vehicles.find(v => v.id === activeVehicleId) || { partnerA: 'Partner 1', partnerB: 'Partner 2' };

    let paidByInfo = {};

    if (mode === 'personal') {
      const payer = document.getElementById('log-single-payer')?.value || activeVeh.partnerA;
      paidByInfo = { mode: 'personal', payer: payer, text: `👤 ${payer} (100% Personal)` };
    } else if (mode === 'shared_partner') {
      const payer = document.getElementById('log-single-payer')?.value || activeVeh.partnerA;
      paidByInfo = { mode: 'shared_partner', payer: payer, text: `🔵 Paid by ${payer} (Shared)` };
    } else if (mode === 'custom_split') {
      const amtA = Number(document.getElementById('split-amt-a')?.value) || 0;
      const amtB = Number(document.getElementById('split-amt-b')?.value) || 0;
      paidByInfo = { 
        mode: 'custom_split', 
        contribA: amtA, 
        contribB: amtB, 
        text: `🟡 Split: ${activeVeh.partnerA} (${amtA}) / ${activeVeh.partnerB} (${amtB})` 
      };
    } else {
      paidByInfo = { mode: 'shared_fund', text: `🟣 Paid from Shared Vehicle Fund` };
    }

    const newLog = {
      id: Date.now(),
      vehicleId: activeVehicleId,
      type: logType,
      date: document.getElementById('log-date').value,
      odometer: Number(document.getElementById('log-odometer').value),
      category: document.getElementById('log-category')?.value || '',
      amount: totalAmount,
      paymentDetails: paidByInfo,
      notes: document.getElementById('log-notes')?.value || ''
    };

    const logs = JSON.parse(localStorage.getItem('vehiclehub_logs') || '[]');
    logs.unshift(newLog);
    localStorage.setItem('vehiclehub_logs', JSON.stringify(logs));

    alert(`✅ Log entry saved! (${paidByInfo.text})`);
    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    populateCategoryDropdown(logType);
    updateFinanceUI();
    updateLogsListUI();
  });
}

// -------------------------------------------------------------
// 3. FINANCE & PARTNER SETTLEMENT LEDGER CALCULATIONS
// -------------------------------------------------------------
function updateFinanceUI() {
  const select = document.getElementById('vehicle-select');
  const activeVehicleId = select ? select.value : 'v1';

  const vehicles = JSON.parse(localStorage.getItem('vehiclehub_vehicles') || '[]');
  const activeVeh = vehicles.find(v => v.id === activeVehicleId) || {
    partnerA: 'Partner 1', partnerB: 'Partner 2', shareA: 50, shareB: 50
  };

  const allLogs = JSON.parse(localStorage.getItem('vehiclehub_logs') || '[]');
  const vehicleLogs = allLogs.filter(l => !l.vehicleId || l.vehicleId === activeVehicleId);

  let total = 0, fuel = 0, maint = 0, exp = 0;
  let paidByA_Shared = 0, paidByB_Shared = 0;
  let personalA = 0, personalB = 0, poolPaid = 0;

  vehicleLogs.forEach(l => {
    const amt = Number(l.amount) || 0;
    total += amt;
    
    if (l.type === 'fuel') fuel += amt;
    else if (l.type === 'maintenance') maint += amt;
    else exp += amt;

    const p = l.paymentDetails || {};

    if (p.mode === 'personal') {
      if (p.payer === activeVeh.partnerA) personalA += amt;
      else personalB += amt;
    } else if (p.mode === 'shared_partner') {
      if (p.payer === activeVeh.partnerA) paidByA_Shared += amt;
      else paidByB_Shared += amt;
    } else if (p.mode === 'custom_split') {
      paidByA_Shared += Number(p.contribA || 0);
      paidByB_Shared += Number(p.contribB || 0);
    } else if (p.mode === 'shared_fund') {
      poolPaid += amt;
    } else {
      // Legacy entries fallback
      paidByA_Shared += amt;
    }
  });

  // Calculate Settlement Debt for Shared Expenses Only
  const totalSharedPaid = paidByA_Shared + paidByB_Shared;
  const targetA = (totalSharedPaid * (activeVeh.shareA / 100));
  const diffA = paidByA_Shared - targetA; // Positive = Partner B owes Partner A

  // UI Updates
  const totalElem = document.getElementById('finance-total-amount');
  const fuelElem = document.getElementById('fin-fuel-cost');
  const maintElem = document.getElementById('fin-maint-cost');
  const expElem = document.getElementById('fin-expense-cost');

  if (totalElem) totalElem.textContent = total.toFixed(2);
  if (fuelElem) fuelElem.textContent = fuel.toFixed(2);
  if (maintElem) maintElem.textContent = maint.toFixed(2);
  if (expElem) expElem.textContent = exp.toFixed(2);

  // Render Settlement Ledger
  const ledgerContainer = document.getElementById('finance-partner-ledger');
  if (ledgerContainer) {
    let settlementText = "";
    if (Math.abs(diffA) < 0.01) {
      settlementText = `⚖️ <strong>Settlement Balanced!</strong> Shared expenses match ownership ratio.`;
    } else if (diffA > 0) {
      settlementText = `💸 <strong>${activeVeh.partnerB}</strong> owes <strong>${activeVeh.partnerA}</strong>: <span style="color: var(--sky-blue, #38bdf8); font-weight:800;">${diffA.toFixed(2)}</span>`;
    } else {
      settlementText = `💸 <strong>${activeVeh.partnerA}</strong> owes <strong>${activeVeh.partnerB}</strong>: <span style="color: var(--sky-blue, #38bdf8); font-weight:800;">${Math.abs(diffA).toFixed(2)}</span>`;
    }

    ledgerContainer.innerHTML = `
      <div style="background:#0d131f; border:1px solid var(--card-border, #232d3f); padding:12px; border-radius:10px; margin-bottom:12px;">
        <div style="font-weight:700; color:var(--sky-blue,#38bdf8); margin-bottom:8px;">🤝 Shared Expense Contributions</div>
        <div class="log-item-card"><span>👤 ${activeVeh.partnerA} Shared Paid:</span><span>${paidByA_Shared.toFixed(2)}</span></div>
        <div class="log-item-card"><span>👤 ${activeVeh.partnerB} Shared Paid:</span><span>${paidByB_Shared.toFixed(2)}</span></div>
        <div class="log-item-card"><span>🏦 Shared Fund Pool:</span><span>${poolPaid.toFixed(2)}</span></div>
        <div style="font-size:0.78rem; color:var(--text-sub,#94a3b8); margin-top:6px;">
          🟢 Excluded Personal Payments: ${activeVeh.partnerA} (${personalA.toFixed(2)}), ${activeVeh.partnerB} (${personalB.toFixed(2)})
        </div>
      </div>

      <div style="background:rgba(56, 189, 248, 0.1); border:1px solid var(--sky-blue,#38bdf8); padding:12px; border-radius:10px; text-align:center;">
        ${settlementText}
      </div>
    `;
  }
}

// -------------------------------------------------------------
// 4. HISTORY LOGS RENDERER
// -------------------------------------------------------------
function updateLogsListUI() {
  const container = document.getElementById('logs-container');
  if (!container) return;

  const select = document.getElementById('vehicle-select');
  const activeVehicleId = select ? select.value : 'v1';

  const allLogs = JSON.parse(localStorage.getItem('vehiclehub_logs') || '[]');
  const vehicleLogs = allLogs.filter(l => !l.vehicleId || l.vehicleId === activeVehicleId);

  if (vehicleLogs.length === 0) {
    container.innerHTML = '<div style="color: var(--text-sub, #94a3b8); text-align: center; padding: 20px;">No logs recorded for this vehicle.</div>';
    return;
  }

  container.innerHTML = '';
  vehicleLogs.forEach(l => {
    const item = document.createElement('div');
    item.className = 'log-item-card';
    const pText = l.paymentDetails ? l.paymentDetails.text : (l.paidBy ? `Paid by: ${l.paidBy}` : 'Shared');

    item.innerHTML = `
      <div>
        <div class="log-item-title">${l.category || l.type.toUpperCase()}</div>
        <div class="log-item-sub">${l.date} • ${l.odometer} KM ${l.notes ? '• ' + l.notes : ''}</div>
        <div style="font-size:0.75rem; color:var(--sky-blue, #38bdf8); margin-top:2px;">${pText}</div>
      </div>
      <div class="log-item-amount">${Number(l.amount || 0).toFixed(2)}</div>
    `;
    container.appendChild(item);
  });
}

// -------------------------------------------------------------
// 5. CATEGORIES, DYNAMIC SPECS, PHOTOS & APP NAVIGATION
// -------------------------------------------------------------
function getCategories() {
  const stored = localStorage.getItem('vehiclehub_custom_categories');
  return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
}

function saveCategories(cats) {
  localStorage.setItem('vehiclehub_custom_categories', JSON.stringify(cats));
}

function initCategories() {
  if (!localStorage.getItem('vehiclehub_custom_categories')) {
    saveCategories(DEFAULT_CATEGORIES);
  }
}

function populateCategoryDropdown(type) {
  const select = document.getElementById('log-category');
  if (!select) return;

  const cats = getCategories();
  const list = cats[type] || [];

  select.innerHTML = '';
  list.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

function renderCategoryManagerUI() {
  const container = document.getElementById('category-list-container');
  if (!container) return;

  const cats = getCategories();
  container.innerHTML = '';

  ['fuel', 'maintenance', 'expense'].forEach(type => {
    const section = document.createElement('div');
    section.style.marginBottom = '12px';

    const header = document.createElement('div');
    header.style.fontSize = '0.85rem';
    header.style.fontWeight = '700';
    header.style.color = 'var(--text-sub)';
    header.style.marginBottom = '6px';
    header.textContent = type.toUpperCase();
    section.appendChild(header);

    (cats[type] || []).forEach((catName, index) => {
      const item = document.createElement('div');
      item.className = 'category-manage-item';
      item.innerHTML = `
        <span>${catName}</span>
        <div class="category-actions">
          <button class="btn-icon btn-edit" onclick="editCategory('${type}', ${index})">✏️ Edit</button>
          <button class="btn-icon btn-delete" onclick="deleteCategory('${type}', ${index})">🗑️ Delete</button>
        </div>
      `;
      section.appendChild(item);
    });

    container.appendChild(section);
  });
}

function setupCategoryManager() {
  const form = document.getElementById('add-category-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('new-cat-type').value;
    const nameInput = document.getElementById('new-cat-name');
    const name = nameInput.value.trim();

    if (!name) return;

    const cats = getCategories();
    if (!cats[type]) cats[type] = [];
    cats[type].push(name);

    saveCategories(cats);
    nameInput.value = '';
    renderCategoryManagerUI();

    const activeTab = document.querySelector('.log-tabs .tab-btn.active');
    const activeType = activeTab ? activeTab.getAttribute('data-type') : 'fuel';
    populateCategoryDropdown(activeType);

    alert('✅ Category added successfully!');
  });

  renderCategoryManagerUI();
}

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.log-tabs .tab-btn');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-type') || 'fuel';
      populateCategoryDropdown(type);
    });
  });

  populateCategoryDropdown('fuel');
}

function setupVehiclePhotoManager() {
  const form = document.getElementById('photo-upload-form');
  const fileInput = document.getElementById('photo-file-input');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const angle = document.getElementById('photo-angle-select').value;
      const file = fileInput.files[0];

      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        const newPhoto = {
          id: Date.now(),
          vehicleId: document.getElementById('vehicle-select')?.value || 'v1',
          angle: angle,
          fileData: event.target.result
        };

        const photos = JSON.parse(localStorage.getItem('vehiclehub_photos') || '[]');
        photos.unshift(newPhoto);
        localStorage.setItem('vehiclehub_photos', JSON.stringify(photos));

        alert(`✅ ${angle} photo uploaded!`);
        form.reset();
        renderVehiclePhotosUI();
      };

      reader.readAsDataURL(file);
    });
  }

  renderVehiclePhotosUI();
}

function renderVehiclePhotosUI() {
  const grid = document.getElementById('vehicle-photos-grid');
  if (!grid) return;

  const photos = JSON.parse(localStorage.getItem('vehiclehub_photos') || '[]');
  const activeVehicleId = document.getElementById('vehicle-select')?.value || 'v1';
  const vehiclePhotos = photos.filter(p => !p.vehicleId || p.vehicleId === activeVehicleId);

  if (vehiclePhotos.length === 0) {
    grid.innerHTML = '<div style="color: var(--text-sub, #94a3b8); text-align: center; grid-column: span 2; padding: 12px;">No photos uploaded yet.</div>';
    return;
  }

  grid.innerHTML = '';
  vehiclePhotos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <button class="photo-delete-btn" onclick="deleteVehiclePhoto(${p.id})">✕</button>
      <a href="${p.fileData}" target="_blank"><img src="${p.fileData}" alt="${p.angle}"></a>
      <div class="photo-tag">${p.angle}</div>
    `;
    grid.appendChild(card);
  });
}

function setupDynamicSpecsManager() {
  const form = document.getElementById('custom-spec-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const groupName = document.getElementById('spec-group-input').value.trim();
      const keyName = document.getElementById('spec-key-input').value.trim();
      const valueName = document.getElementById('spec-value-input').value.trim();

      if (!groupName || !keyName || !valueName) return;

      const activeVehicleId = document.getElementById('vehicle-select')?.value || 'v1';
      const stored = localStorage.getItem(`vehiclehub_specs_${activeVehicleId}`);
      const specs = stored ? JSON.parse(stored) : DEFAULT_VEHICLE_SPECS;

      if (!specs[groupName]) specs[groupName] = [];
      specs[groupName].push({ id: Date.now(), key: keyName, value: valueName });

      localStorage.setItem(`vehiclehub_specs_${activeVehicleId}`, JSON.stringify(specs));
      renderDynamicSpecsUI();

      document.getElementById('spec-key-input').value = '';
      document.getElementById('spec-value-input').value = '';
      alert(`✅ Spec added under "${groupName}"!`);
    });
  }
}

function renderDynamicSpecsUI() {
  const container = document.getElementById('dynamic-specs-container');
  if (!container) return;

  const activeVehicleId = document.getElementById('vehicle-select')?.value || 'v1';
  const stored = localStorage.getItem(`vehiclehub_specs_${activeVehicleId}`);
  const specs = stored ? JSON.parse(stored) : DEFAULT_VEHICLE_SPECS;

  container.innerHTML = '';
  const groups = Object.keys(specs);

  groups.forEach(groupName => {
    const groupCard = document.createElement('div');
    groupCard.style.cssText = "background: #0d131f; border: 1px solid var(--card-border, #232d3f); border-radius: 10px; padding: 12px; margin-bottom: 12px;";

    let itemsHTML = '';
    specs[groupName].forEach(item => {
      itemsHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 8px 0;">
          <div>
            <div style="font-size: 0.82rem; color: var(--text-sub, #94a3b8); font-weight: 600;">${item.key}</div>
            <div style="font-size: 0.95rem; color: #fff; font-weight: 700; margin-top: 2px;">${item.value}</div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn-icon btn-view" title="Share Spec" onclick="shareSpecItem('${groupName}', '${item.key}', '${item.value}')">📤</button>
            <button class="btn-icon btn-delete" title="Delete Spec" onclick="deleteSpecItem('${groupName}', ${item.id})">🗑️</button>
          </div>
        </div>
      `;
    });

    groupCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 800; font-size: 0.95rem; color: var(--sky-blue, #38bdf8);">${groupName}</span>
        <button class="btn-icon btn-delete" style="font-size: 0.75rem;" onclick="deleteSpecGroup('${groupName}')">Delete Group</button>
      </div>
      <div>${itemsHTML}</div>
    `;

    container.appendChild(groupCard);
  });
}

function setupAppNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const sections = document.querySelectorAll('.app-section');
  const vehicleSelect = document.getElementById('vehicle-select');

  if (vehicleSelect) {
    vehicleSelect.addEventListener('change', () => {
      initVehicleData();
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');

      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(sec => {
        sec.classList.remove('active-section');
        if (sec.id === `section-${target}`) sec.classList.add('active-section');
      });

      if (target === 'finance') updateFinanceUI();
      if (target === 'logs') updateLogsListUI();
    });
  });

  const skipBtn = document.getElementById('skip-login-btn');
  const loginOverlay = document.getElementById('login-overlay');

  if (localStorage.getItem('vehiclehub_guest_mode') === 'true' && loginOverlay) {
    loginOverlay.classList.add('hidden');
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      localStorage.setItem('vehiclehub_guest_mode', 'true');
      if (loginOverlay) loginOverlay.classList.add('hidden');
    });
  }
}

// Global Handlers
window.deleteVehiclePhoto = function(id) {
  if (confirm('Delete this photo?')) {
    let photos = JSON.parse(localStorage.getItem('vehiclehub_photos') || '[]');
    photos = photos.filter(p => p.id !== id);
    localStorage.setItem('vehiclehub_photos', JSON.stringify(photos));
    renderVehiclePhotosUI();
  }
};

window.deleteSpecItem = function(groupName, itemId) {
  const activeVehicleId = document.getElementById('vehicle-select')?.value || 'v1';
  const stored = localStorage.getItem(`vehiclehub_specs_${activeVehicleId}`);
  const specs = stored ? JSON.parse(stored) : DEFAULT_VEHICLE_SPECS;

  specs[groupName] = specs[groupName].filter(i => i.id !== itemId);
  if (specs[groupName].length === 0) delete specs[groupName];

  localStorage.setItem(`vehiclehub_specs_${activeVehicleId}`, JSON.stringify(specs));
  renderDynamicSpecsUI();
};

window.deleteSpecGroup = function(groupName) {
  const activeVehicleId = document.getElementById('vehicle-select')?.value || 'v1';
  const stored = localStorage.getItem(`vehiclehub_specs_${activeVehicleId}`);
  const specs = stored ? JSON.parse(stored) : DEFAULT_VEHICLE_SPECS;

  delete specs[groupName];
  localStorage.setItem(`vehiclehub_specs_${activeVehicleId}`, JSON.stringify(specs));
  renderDynamicSpecsUI();
};

window.shareSpecItem = function(groupName, key, value) {
  const select = document.getElementById('vehicle-select');
  const vehicleName = select ? select.options[select.selectedIndex].text : 'Vehicle';
  const message = `🚘 *${vehicleName}*\n📌 *${groupName}*\n• *${key}:* ${value}`;

  if (navigator.share) {
    navigator.share({ title: `${vehicleName} - ${key}`, text: message }).catch(() => {});
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  }
};

window.shareFullVehicleSpecs = function() {
  const select = document.getElementById('vehicle-select');
  const vehicleName = select ? select.options[select.selectedIndex].text : 'Vehicle';
  const activeVehicleId = select ? select.value : 'v1';
  const stored = localStorage.getItem(`vehiclehub_specs_${activeVehicleId}`);
  const specs = stored ? JSON.parse(stored) : DEFAULT_VEHICLE_SPECS;

  let message = `🚘 *MANSKIT VehicleHub - ${vehicleName} Specs*\n\n`;
  Object.keys(specs).forEach(group => {
    message += `📋 *${group.toUpperCase()}*\n`;
    specs[group].forEach(item => {
      message += ` • ${item.key}: ${item.value}\n`;
    });
    message += `\n`;
  });

  if (navigator.share) {
    navigator.share({ title: `${vehicleName} Technical Specs`, text: message }).catch(() => {});
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  }
};
