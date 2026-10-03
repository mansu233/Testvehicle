let activeLogType = 'fuel';
const DEFAULT_CATEGORIES = {
  fuel: ['Full Tank', 'Partial Tank', 'Premium Fuel'],
  maintenance: ['Oil Change', 'Tire Rotation', 'Brake Service', 'General Service Fee', 'Air Pressure Check'],
  purchase: ['Down Payment', 'EMI Payment', 'RTO Tax & Reg', 'Insurance Premium', 'Loan Processing Fee'],
  expense: ['Toll', 'Parking', 'Car Wash']
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('log-date').valueAsDate = new Date();
  bindEvents();
  initApp();
});

function bindEvents() {
  document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab(this.getAttribute('data-target'), this);
    });
  });

  document.getElementById('tab-btn-fuel').addEventListener('click', function() { setLogType('fuel'); });
  document.getElementById('tab-btn-maint').addEventListener('click', function() { setLogType('maintenance'); });
  document.getElementById('tab-btn-purchase').addEventListener('click', function() { setLogType('purchase'); });
  document.getElementById('tab-btn-expense').addEventListener('click', function() { setLogType('expense'); });

  document.getElementById('log-payment-mode').addEventListener('change', togglePaymentUI);

  // Forms
  document.getElementById('quick-log-form').addEventListener('submit', saveLogEntry);
  document.getElementById('add-category-form').addEventListener('submit', addCategoryHandler);
  document.getElementById('vehicle-profile-form').addEventListener('submit', saveVehicleProfile);
  document.getElementById('vehicle-finance-form').addEventListener('submit', saveVehicleFinanceProfile);
  document.getElementById('upload-doc-form').addEventListener('submit', uploadDocHandler);
  document.getElementById('add-spec-form').addEventListener('submit', addTechnicalSpec);
  document.getElementById('upload-photo-form').addEventListener('submit', uploadPhotoHandler);

  // Search, Filters & Export
  document.getElementById('log-search-input').addEventListener('input', loadDataAndUI);
  document.getElementById('log-type-filter').addEventListener('change', loadDataAndUI);
  document.getElementById('log-sort-filter').addEventListener('change', loadDataAndUI);
  document.getElementById('btn-export-csv').addEventListener('click', exportLogsCSV);
  document.getElementById('btn-export-pdf').addEventListener('click', exportLogsPDF);

  // Header & Modals
  document.getElementById('vehicle-select').addEventListener('change', switchVehicle);
  document.getElementById('btn-add-vehicle').addEventListener('click', addVehiclePrompt);
  document.getElementById('btn-delete-vehicle').addEventListener('click', deleteVehicleHandler);
  document.getElementById('btn-notif-center').addEventListener('click', toggleNotifModal);
  document.getElementById('btn-close-notif').addEventListener('click', toggleNotifModal);
  document.getElementById('alert-box').addEventListener('click', toggleNotifModal);

  document.getElementById('btn-share-specs').addEventListener('click', shareFullSpecs);
  document.getElementById('btn-cancel-edit').addEventListener('click', cancelEditHandler);
  document.getElementById('btn-add-partner-field').addEventListener('click', addPartnerFieldUI);
}

function initApp() {
  initVehicles();
  initCategories();
  populateCategoryDropdown('fuel');
  loadDataAndUI();
}

function getActiveVehiclePartners() {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const vList = JSON.parse(localStorage.getItem('vh_vehicles') || '[]');
  const target = vList.find(v => v.id === activeV);
  if(!target || !target.partners || target.partners.length === 0) return ['Owner'];
  
  const cleanPartners = target.partners.map(p => p.trim()).filter(p => p !== '' && p.toLowerCase() !== 'no' && p.toLowerCase() !== 'undefined');
  return cleanPartners.length > 0 ? cleanPartners : ['Owner'];
}

function initVehicles() {
  let vList = JSON.parse(localStorage.getItem('vh_vehicles') || '[]');
  if(vList.length === 0) {
    vList = [{ id: 'v1', name: 'Primary Vehicle', reg: 'KL 65 K 606', partners: ['Owner'] }];
    localStorage.setItem('vh_vehicles', JSON.stringify(vList));
  }

  vList.forEach(v => {
    if(!v.partners || v.partners.length === 0) v.partners = ['Owner'];
  });
  localStorage.setItem('vh_vehicles', JSON.stringify(vList));

  const select = document.getElementById('vehicle-select');
  const currentSelected = select.value || vList[0].id;
  select.innerHTML = '';
  vList.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = `${v.name} (${v.reg})`;
    select.appendChild(opt);
  });

  select.value = vList.some(v => v.id === currentSelected) ? currentSelected : vList[0].id;
  const active = vList.find(v => v.id === select.value) || vList[0];

  document.getElementById('v-name-display').textContent = active.name;
  document.getElementById('v-plate-display').textContent = active.reg;
  document.getElementById('prof-vname').value = active.name;
  document.getElementById('prof-vreg').value = active.reg;

  const fin = active.financeDetails || {};
  document.getElementById('fin-exshowroom').value = fin.exShowroom || '';
  document.getElementById('fin-downpayment').value = fin.downPayment || '';
  document.getElementById('fin-loan-amt').value = fin.loanAmt || '';
  document.getElementById('fin-bank-name').value = fin.bankName || '';
  document.getElementById('fin-monthly-emi').value = fin.monthlyEmi || '';
  document.getElementById('fin-tenure-months').value = fin.tenureMonths || '';

  renderPartnerInputsUI(active.partners);
  updateAppPartnerCapabilities();
}

function renderPartnerInputsUI(partners) {
  const container = document.getElementById('partner-inputs-container');
  container.innerHTML = '';
  if(!partners || partners.length === 0) partners = ['Owner'];

  partners.forEach((p, idx) => {
    const row = document.createElement('div');
    row.style.cssText = "display: flex; gap: 8px; margin-bottom: 8px; align-items: center;";
    row.innerHTML = `<input type="text" class="form-control partner-input-val" value="${p}" placeholder="Partner ${idx + 1} Name (e.g. Alex)" required>`;

    if(partners.length > 1) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-act';
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', function() { row.remove(); });
      row.appendChild(delBtn);
    }

    container.appendChild(row);
  });
}

function addPartnerFieldUI() {
  const container = document.getElementById('partner-inputs-container');
  const count = container.querySelectorAll('.partner-input-val').length;
  const row = document.createElement('div');
  row.style.cssText = "display: flex; gap: 8px; margin-bottom: 8px; align-items: center;";
  row.innerHTML = `<input type="text" class="form-control partner-input-val" value="" placeholder="Partner ${count + 1} Name (e.g. Jordan)" required>`;

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn-act';
  delBtn.textContent = '🗑️';
  delBtn.addEventListener('click', function() { row.remove(); });
  row.appendChild(delBtn);

  container.appendChild(row);
}

function updateAppPartnerCapabilities() {
  const partners = getActiveVehiclePartners();
  const strategyBox = document.getElementById('payment-strategy-box');
  const singleBox = document.getElementById('single-payer-box');
  const splitBox = document.getElementById('split-payer-box');

  const pSelect = document.getElementById('log-single-payer');
  pSelect.innerHTML = '';
  partners.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    pSelect.appendChild(opt);
  });

  const splitContainer = document.getElementById('custom-split-fields-container');
  splitContainer.innerHTML = '';
  partners.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
      <label for="split-amt-${idx}">${p} Contribution (₹)</label>
      <input type="number" step="0.01" id="split-amt-${idx}" data-partner="${p}" class="form-control split-partner-input" placeholder="0.00">
    `;
    splitContainer.appendChild(div);
  });

  if(partners.length <= 1) {
    strategyBox.classList.add('hidden');
    singleBox.classList.add('hidden');
    splitBox.classList.add('hidden');
  } else {
    strategyBox.classList.remove('hidden');
    togglePaymentUI();
  }
}

function deleteVehicleHandler() {
  let vList = JSON.parse(localStorage.getItem('vh_vehicles') || '[]');
  if(vList.length <= 1) {
    alert('⚠️ Security Alert: Cannot delete primary vehicle profile.');
    return;
  }

  const activeV = document.getElementById('vehicle-select').value;
  const target = vList.find(v => v.id === activeV);

  if(confirm(`🔒 SECURITY CONFIRMATION:\nDelete vehicle "${target.name} (${target.reg})"?`)) {
    vList = vList.filter(v => v.id !== activeV);
    localStorage.setItem('vh_vehicles', JSON.stringify(vList));
    initVehicles();
    loadDataAndUI();
    alert('✅ Vehicle deleted.');
  }
}

function togglePaymentUI() {
  const partners = getActiveVehiclePartners();
  if(partners.length <= 1) return;

  const mode = document.getElementById('log-payment-mode').value;
  const singleBox = document.getElementById('single-payer-box');
  const splitBox = document.getElementById('split-payer-box');

  if(mode === 'custom_split') {
    singleBox.classList.add('hidden');
    splitBox.classList.remove('hidden');
  } else if(mode === 'shared_fund') {
    singleBox.classList.add('hidden');
    splitBox.classList.add('hidden');
  } else {
    singleBox.classList.remove('hidden');
    splitBox.classList.add('hidden');
  }
}

function setLogType(type) {
  activeLogType = type;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.tab-btn[data-type="${type}"]`);
  if(activeBtn) activeBtn.classList.add('active');

  const litersBox = document.getElementById('fuel-liters-box');
  if(type === 'fuel') litersBox.classList.remove('hidden');
  else litersBox.classList.add('hidden');

  populateCategoryDropdown(type);
}

function initCategories() {
  if(!localStorage.getItem('vh_categories')) {
    localStorage.setItem('vh_categories', JSON.stringify(DEFAULT_CATEGORIES));
  }
  renderCategoryList();
}

function populateCategoryDropdown(type) {
  const select = document.getElementById('log-category');
  const cats = JSON.parse(localStorage.getItem('vh_categories') || '{}');
  const list = cats[type] || [];
  select.innerHTML = '';
  list.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

function renderCategoryList() {
  const container = document.getElementById('category-list');
  const cats = JSON.parse(localStorage.getItem('vh_categories') || '{}');
  container.innerHTML = '';

  ['fuel', 'maintenance', 'purchase', 'expense'].forEach(t => {
    (cats[t] || []).forEach((c, idx) => {
      const item = document.createElement('div');
      item.className = 'list-card';
      item.innerHTML = `<span>${t.toUpperCase()} - ${c}</span>`;
      
      const actions = document.createElement('div');
      actions.className = 'action-group';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-act';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', function() { editCategory(t, idx); });
      actions.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-act';
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', function() { deleteCategory(t, idx); });
      actions.appendChild(delBtn);

      item.appendChild(actions);
      container.appendChild(item);
    });
  });
}

function addCategoryHandler(e) {
  e.preventDefault();
  const type = document.getElementById('cat-type-input').value;
  const name = document.getElementById('cat-name-input').value.trim();
  if(!name) return;

  const cats = JSON.parse(localStorage.getItem('vh_categories') || '{}');
  if(!cats[type]) cats[type] = [];
  cats[type].push(name);
  localStorage.setItem('vh_categories', JSON.stringify(cats));

  document.getElementById('cat-name-input').value = '';
  renderCategoryList();
  populateCategoryDropdown(activeLogType);
  alert('✅ Category added!');
}

function editCategory(type, idx) {
  const cats = JSON.parse(localStorage.getItem('vh_categories') || '{}');
  const current = cats[type][idx];
  const updated = prompt('Edit Category Name:', current);
  if(updated && updated.trim() !== '') {
    cats[type][idx] = updated.trim();
    localStorage.setItem('vh_categories', JSON.stringify(cats));
    renderCategoryList();
    populateCategoryDropdown(activeLogType);
  }
}

function deleteCategory(type, idx) {
  const cats = JSON.parse(localStorage.getItem('vh_categories') || '{}');
  const name = cats[type][idx];
  if(confirm(`🔒 SECURITY CONFIRMATION:\nDelete category "${name}"?`)) {
    cats[type].splice(idx, 1);
    localStorage.setItem('vh_categories', JSON.stringify(cats));
    renderCategoryList();
    populateCategoryDropdown(activeLogType);
  }
}

function uploadDocHandler(e) {
  e.preventDefault();
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const type = document.getElementById('doc-type').value;
  const expiry = document.getElementById('doc-expiry').value;
  const num = document.getElementById('doc-number').value.trim();
  const file = document.getElementById('doc-file').files[0];

  if(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      let docs = JSON.parse(localStorage.getItem('vh_documents') || '[]');
      docs.unshift({
        id: Date.now(),
        vehicleId: activeV,
        type,
        expiry,
        num,
        fileData: event.target.result,
        fileName: file.name,
        isPdf: file.type.includes('pdf')
      });
      localStorage.setItem('vh_documents', JSON.stringify(docs));
      document.getElementById('upload-doc-form').reset();
      loadDataAndUI();
      alert('✅ Document uploaded successfully!');
    };
    reader.readAsDataURL(file);
  }
}

function renderDocVaultUI() {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const container = document.getElementById('doc-vault-container');
  const docs = JSON.parse(localStorage.getItem('vh_documents') || '[]').filter(d => d.vehicleId === activeV);
  container.innerHTML = '';

  if(docs.length === 0) {
    container.innerHTML = `<div style="text-align:center; color: var(--text-sub); font-size: 0.82rem; padding: 12px; background:#0b0f17; border-radius:10px; border:1px solid var(--card-border);">No documents uploaded yet.</div>`;
    return;
  }

  docs.forEach(d => {
    let statusClass = 'valid';
    let statusText = 'Valid';

    const expDate = new Date(d.expiry);
    const now = new Date();
    const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    if(diffDays < 0) {
      statusClass = 'expired';
      statusText = 'Expired';
    } else if(diffDays <= 30) {
      statusClass = 'expiring';
      statusText = `Expires in ${diffDays} Days`;
    }

    const card = document.createElement('div');
    card.style.cssText = "background:#0b0f17; border:1px solid var(--card-border); border-radius:12px; padding:12px; margin-bottom:12px;";

    let previewHTML = !d.isPdf ? `<img src="${d.fileData}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin: 8px 0;">`
                              : `<div style="background:#131b2a; padding:10px; border-radius:8px; font-size:0.8rem; color:var(--sky-blue); margin: 8px 0;">📄 PDF Document: ${d.fileName}</div>`;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div class="card-title">${d.type}</div>
          <div class="card-sub">${d.num ? 'Doc #' + d.num + ' • ' : ''}Due Date: <strong>${d.expiry}</strong></div>
        </div>
        <div><span class="doc-pill ${statusClass}">${statusText}</span></div>
      </div>
      ${previewHTML}
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <a href="${d.fileData}" download="${d.fileName || 'Document'}" class="btn-act" style="color:var(--sky-blue); font-weight:800; text-decoration:none;">📥 View/Download</a>
        <button class="btn-act" style="color:var(--danger);" onclick="deleteDocument(${d.id})">🗑️ Delete</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function deleteDocument(id) {
  if(confirm('🔒 SECURITY CONFIRMATION:\nDelete this stored document?')) {
    let docs = JSON.parse(localStorage.getItem('vh_documents') || '[]');
    docs = docs.filter(d => d.id != id);
    localStorage.setItem('vh_documents', JSON.stringify(docs));
    loadDataAndUI();
  }
}

function updateNotificationsSystem() {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const docs = JSON.parse(localStorage.getItem('vh_documents') || '[]').filter(d => d.vehicleId === activeV);
  const today = new Date();

  let urgentAlerts = [];

  docs.forEach(d => {
    const expDate = new Date(d.expiry);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    if(diffDays < 0) {
      urgentAlerts.push({ type: d.type, text: `EXPIRED on ${d.expiry}`, isExpired: true });
    } else if(diffDays <= 30) {
      urgentAlerts.push({ type: d.type, text: `Expires in ${diffDays} days (${d.expiry})`, isExpired: false });
    }
  });

  const badge = document.getElementById('notif-badge-count');
  if(urgentAlerts.length > 0) {
    badge.textContent = urgentAlerts.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  const alertBox = document.getElementById('alert-box');
  const alertText = document.getElementById('alert-text');
  if(urgentAlerts.length > 0) {
    alertBox.classList.remove('hidden');
    alertText.innerHTML = `<strong>${urgentAlerts.length} Alert(s):</strong> ${urgentAlerts[0].type} ${urgentAlerts[0].text}`;
  } else {
    alertText.innerHTML = `✅ All vehicle papers and certificates are up to date.`;
  }

  const modalList = document.getElementById('notif-modal-list');
  modalList.innerHTML = '';
  if(urgentAlerts.length === 0) {
    modalList.innerHTML = `<div style="text-align:center; color:var(--text-sub); padding:16px;">🎉 No pending document renewals! All papers are up to date.</div>`;
  } else {
    urgentAlerts.forEach(a => {
      const item = document.createElement('div');
      item.className = 'list-card';
      item.innerHTML = `
        <div>
          <div class="card-title">${a.type}</div>
          <div class="card-sub">${a.text}</div>
        </div>
        <span class="doc-pill ${a.isExpired ? 'expired' : 'expiring'}">${a.isExpired ? 'EXPIRED' : 'DUE SOON'}</span>
      `;
      modalList.appendChild(item);
    });
  }
}

function toggleNotifModal() {
  document.getElementById('notif-modal').classList.toggle('hidden');
}

function saveLogEntry(e) {
  e.preventDefault();
  const editingId = document.getElementById('editing-log-id').value;
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const odo = document.getElementById('log-odometer').value;
  const amt = Number(document.getElementById('log-amount').value);
  const cat = document.getElementById('log-category').value;
  const notes = document.getElementById('log-notes').value;
  const date = document.getElementById('log-date').value;
  const liters = Number(document.getElementById('log-fuel-liters').value) || 0;
  const partners = getActiveVehiclePartners();

  let pDetails = {};

  if(partners.length <= 1) {
    pDetails = { mode: 'personal', payer: partners[0], text: `Paid by ${partners[0]}` };
  } else {
    const mode = document.getElementById('log-payment-mode').value;
    if(mode === 'personal' || mode === 'shared_partner') {
      const p = document.getElementById('log-single-payer').value || partners[0];
      pDetails = { mode, payer: p, text: mode === 'personal' ? `100% Personal (${p})` : `Shared Debt (${p})` };
    } else if(mode === 'custom_split') {
      const customSplits = {};
      let textParts = [];
      document.querySelectorAll('.split-partner-input').forEach(inp => {
        const pName = inp.getAttribute('data-partner');
        const val = Number(inp.value) || 0;
        customSplits[pName] = val;
        textParts.push(`${pName}: ₹${val}`);
      });
      pDetails = { mode, splits: customSplits, text: `Split: ${textParts.join(' / ')}` };
    } else {
      pDetails = { mode, text: `Shared Fund Pool` };
    }
  }

  let logs = JSON.parse(localStorage.getItem('vh_logs') || '[]');

  if(editingId) {
    const logIndex = logs.findIndex(l => l.id == editingId);
    if(logIndex !== -1) {
      logs[logIndex] = { id: Number(editingId), vehicleId: activeV, type: activeLogType, date, odo, cat, amt, notes, liters, pDetails };
      alert('✅ Log entry updated successfully!');
    }
  } else {
    const newLog = { id: Date.now(), vehicleId: activeV, type: activeLogType, date, odo, cat, amt, notes, liters, pDetails };
    logs.unshift(newLog);
    alert('✅ Log entry saved successfully!');
  }

  localStorage.setItem('vh_logs', JSON.stringify(logs));
  cancelEditHandler();
  loadDataAndUI();
}

function editLogEntry(id) {
  const logs = JSON.parse(localStorage.getItem('vh_logs') || '[]');
  const target = logs.find(l => l.id == id);
  if(!target) return;

  document.getElementById('editing-log-id').value = target.id;
  document.getElementById('log-date').value = target.date;
  document.getElementById('log-odometer').value = target.odo;
  document.getElementById('log-amount').value = target.amt;
  document.getElementById('log-notes').value = target.notes || '';
  document.getElementById('log-fuel-liters').value = target.liters || '';

  setLogType(target.type || 'fuel');
  populateCategoryDropdown(target.type || 'fuel');
  document.getElementById('log-category').value = target.cat;

  const partners = getActiveVehiclePartners();
  if(partners.length > 1) {
    const pd = target.pDetails || {};
    const mode = pd.mode || 'personal';
    document.getElementById('log-payment-mode').value = mode;
    togglePaymentUI();

    if((mode === 'personal' || mode === 'shared_partner') && pd.payer) {
      document.getElementById('log-single-payer').value = pd.payer;
    } else if(mode === 'custom_split' && pd.splits) {
      document.querySelectorAll('.split-partner-input').forEach(inp => {
        const pName = inp.getAttribute('data-partner');
        if(pd.splits[pName] !== undefined) inp.value = pd.splits[pName];
      });
    }
  }

  document.getElementById('form-heading-title').textContent = '✏ EDIT LOG ENTRY';
  document.getElementById('btn-save-log').textContent = 'Update Log Entry';
  document.getElementById('btn-cancel-edit').classList.remove('hidden');

  switchTab('quick-entry', document.getElementById('nav-quick-entry'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEditHandler() {
  document.getElementById('editing-log-id').value = '';
  document.getElementById('quick-log-form').reset();
  document.getElementById('log-date').valueAsDate = new Date();
  document.getElementById('form-heading-title').textContent = '⚡ QUICK LOG ENTRY';
  document.getElementById('btn-save-log').textContent = 'Save Log Entry';
  document.getElementById('btn-cancel-edit').classList.add('hidden');
  togglePaymentUI();
}

function loadDataAndUI() {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  let logs = JSON.parse(localStorage.getItem('vh_logs') || '[]').filter(l => l.vehicleId === activeV || !l.vehicleId);
  const partners = getActiveVehiclePartners();

  let total = 0, fuel = 0, maint = 0, purchaseSpend = 0, maxOdo = 0;
  let sharedContrib = {};
  let personalContrib = {};

  partners.forEach(p => {
    sharedContrib[p] = 0;
    personalContrib[p] = 0;
  });

  // Mileage Calculation Setup
  let fuelLogs = logs.filter(l => l.type === 'fuel' && l.liters > 0).sort((a,b) => Number(a.odo) - Number(b.odo));
  let avgMileage = 0;
  if(fuelLogs.length >= 2) {
    let totalKm = Number(fuelLogs[fuelLogs.length - 1].odo) - Number(fuelLogs[0].odo);
    let totalLiters = fuelLogs.slice(1).reduce((acc, curr) => acc + Number(curr.liters), 0);
    if(totalLiters > 0) avgMileage = (totalKm / totalLiters).toFixed(1);
  }

  // Calculate Totals & Ledger Balance
  logs.forEach(l => {
    const amt = Number(l.amt) || 0;
    const currentOdo = Number(l.odo) || 0;
    if(currentOdo > maxOdo) maxOdo = currentOdo;

    total += amt;
    if(l.type === 'fuel') fuel += amt;
    else if(l.type === 'maintenance') maint += amt;
    else if(l.type === 'purchase') purchaseSpend += amt;

    const pd = l.pDetails || {};
    if(partners.length > 1) {
      if(pd.mode === 'personal' && pd.payer) {
        personalContrib[pd.payer] = (personalContrib[pd.payer] || 0) + amt;
      } else if(pd.mode === 'shared_partner' && pd.payer) {
        sharedContrib[pd.payer] = (sharedContrib[pd.payer] || 0) + amt;
      } else if(pd.mode === 'custom_split' && pd.splits) {
        Object.keys(pd.splits).forEach(pName => {
          sharedContrib[pName] = (sharedContrib[pName] || 0) + Number(pd.splits[pName] || 0);
        });
      }
    }
  });

  // Apply Search Query & Category Filter
  const searchQuery = (document.getElementById('log-search-input').value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('log-type-filter').value || 'all';
  const sortFilter = document.getElementById('log-sort-filter').value || 'newest';

  let filteredLogs = logs.filter(l => {
    const matchesType = (typeFilter === 'all') || (l.type === typeFilter);
    const textTarget = `${l.cat} ${l.notes || ''} ${l.date} ${l.odo} ${l.amt} ${l.pDetails?.text || ''}`.toLowerCase();
    const matchesSearch = !searchQuery || textTarget.includes(searchQuery);
    return matchesType && matchesSearch;
  });

  // Calculate Live Total for Filtered Results
  let filteredTotalAmount = 0;
  filteredLogs.forEach(l => {
    filteredTotalAmount += Number(l.amt) || 0;
  });

  // Update Summary Bar Elements above history list
  document.getElementById('filtered-logs-count-label').textContent = `Showing ${filteredLogs.length} entry/entries`;
  document.getElementById('filtered-logs-total-val').textContent = `₹${filteredTotalAmount.toLocaleString()}`;

  // Sort Logs
  filteredLogs.sort((a, b) => {
    if(sortFilter === 'newest') return new Date(b.date) - new Date(a.date);
    if(sortFilter === 'oldest') return new Date(a.date) - new Date(b.date);
    if(sortFilter === 'highest_amt') return Number(b.amt) - Number(a.amt);
    if(sortFilter === 'lowest_amt') return Number(a.amt) - Number(b.amt);
    return 0;
  });

  // Render Log History Cards
  const historyContainer = document.getElementById('logs-history-container');
  historyContainer.innerHTML = '';

  if(filteredLogs.length === 0) {
    historyContainer.innerHTML = `<div style="text-align:center; color: var(--text-sub); font-size:0.85rem; padding: 16px; background:#0b0f17; border-radius:12px; border:1px solid var(--card-border);">No matching logs found.</div>`;
  } else {
    filteredLogs.forEach(l => {
      const amt = Number(l.amt) || 0;
      const pd = l.pDetails || {};

      const card = document.createElement('div');
      card.className = 'list-card';
      card.innerHTML = `
        <div>
          <div class="card-title">${l.cat} ${l.liters ? ' ('+l.liters+' L)' : ''}</div>
          <div class="card-sub">${l.date} • ${Number(l.odo).toLocaleString()} KM ${l.notes ? '• ' + l.notes : ''}</div>
          <div style="font-size:0.72rem; color:var(--sky-blue); margin-top:2px;">${pd.text || 'Log Entry'}</div>
        </div>
        <div style="text-align:right;">
          <div class="card-amt">₹${amt.toLocaleString()}</div>
        </div>
      `;

      const actions = document.createElement('div');
      actions.className = 'action-group';
      actions.style.marginTop = '4px';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-act';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', function() { editLogEntry(l.id); });
      actions.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-act';
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', function() { deleteLogEntry(l.id); });
      actions.appendChild(delBtn);

      card.querySelector('div:nth-child(2)').appendChild(actions);
      historyContainer.appendChild(card);
    });
  }

  // Update Stats UI
  document.getElementById('v-odo-val').textContent = maxOdo.toLocaleString();
  document.getElementById('stat-total').innerHTML = '₹' + total.toLocaleString();
  document.getElementById('stat-fuel').innerHTML = '₹' + fuel.toLocaleString();
  document.getElementById('stat-maint').innerHTML = '₹' + maint.toLocaleString();
  document.getElementById('stat-mileage').textContent = `${avgMileage} KM/L`;

  document.getElementById('fin-summary-total').innerHTML = '₹' + total.toLocaleString();
  document.getElementById('fin-summary-purchase').innerHTML = '₹' + purchaseSpend.toLocaleString();
  document.getElementById('fin-summary-fuel').innerHTML = '₹' + fuel.toLocaleString();
  document.getElementById('fin-summary-maint').innerHTML = '₹' + maint.toLocaleString();

  renderServiceRemindersUI(maxOdo, logs);
  renderFinanceSummaryCard();

  const ledgerContainer = document.getElementById('partner-ledger-container');
  ledgerContainer.innerHTML = '';

  if(partners.length <= 1) {
    ledgerContainer.innerHTML = `
      <div style="background:#0b0f17; padding:14px; border-radius:10px; border: 1px solid var(--card-border); text-align:center; color: var(--text-sub); font-size:0.85rem;">
        👤 Solo Vehicle Ownership Mode.<br>Settlement calculations disabled.
      </div>
    `;
  } else {
    let totalSharedSpent = 0;
    let summaryRows = '';
    partners.forEach(p => {
      const sAmt = sharedContrib[p] || 0;
      totalSharedSpent += sAmt;
      summaryRows += `<div class="list-card"><span>${p} Shared Paid:</span><span>₹${sAmt.toLocaleString()}</span></div>`;
    });

    const perPartnerTarget = totalSharedSpent / partners.length;
    let settlementMatrixHTML = '';

    partners.forEach(p => {
      const diff = (sharedContrib[p] || 0) - perPartnerTarget;
      if(diff > 0.01) {
        settlementMatrixHTML += `<div style="margin-bottom:4px;">🟢 <strong>${p}</strong> is owed: <span style="color:var(--sky-blue); font-weight:800;">₹${diff.toLocaleString()}</span></div>`;
      } else if(diff < -0.01) {
        settlementMatrixHTML += `<div style="margin-bottom:4px;">💸 <strong>${p}</strong> owes: <span style="color:var(--warning); font-weight:800;">₹${Math.abs(diff).toLocaleString()}</span></div>`;
      } else {
        settlementMatrixHTML += `<div style="margin-bottom:4px;">⚖️ <strong>${p}</strong> is balanced.</div>`;
      }
    });

    ledgerContainer.innerHTML = `
      <div style="background:#0b0f17; padding:12px; border-radius:10px; margin-bottom:10px; border: 1px solid var(--card-border);">
        ${summaryRows}
        <div style="font-size:0.74rem; color:var(--text-sub); margin-top:6px;">
          Excl. Personal Trips: ${partners.map(p => `${p} (₹${(personalContrib[p] || 0).toLocaleString()})`).join(', ')}
        </div>
      </div>
      <div style="background:rgba(56,189,248,0.1); border:1px solid var(--sky-blue); padding:12px; border-radius:10px; font-size:0.85rem;">
        ${settlementMatrixHTML}
      </div>
    `;
  }

  renderDocVaultUI();
  renderSpecsUI();
  renderPhotosUI();
  updateNotificationsSystem();
}

function renderServiceRemindersUI(currentOdo, logs) {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const box = document.getElementById('service-reminder-box');
  const specs = JSON.parse(localStorage.getItem(`vh_specs_${activeV}`) || '{}');

  let intervalItems = [];

  Object.keys(specs).forEach(group => {
    specs[group].forEach(spec => {
      if((spec.interval && Number(spec.interval) > 0) || (spec.intervalDays && Number(spec.intervalDays) > 0)) {
        intervalItems.push({
          key: spec.key,
          val: spec.val,
          intervalKm: Number(spec.interval) || 0,
          intervalDays: Number(spec.intervalDays) || 0
        });
      }
    });
  });

  const hasCustomOilSpec = intervalItems.some(item => item.key.toLowerCase().includes('oil'));
  if(!hasCustomOilSpec) {
    intervalItems.unshift({ key: 'Engine Oil', val: '15W-40 / Synthetic', intervalKm: 10000, intervalDays: 180 });
  }

  box.innerHTML = '';

  const today = new Date();

  intervalItems.forEach(item => {
    const matchingLogs = logs.filter(l => 
      l.cat.toLowerCase().includes(item.key.toLowerCase()) || 
      (l.notes && l.notes.toLowerCase().includes(item.key.toLowerCase()))
    ).sort((a,b) => new Date(b.date) - new Date(a.date));

    const lastLog = matchingLogs.length > 0 ? matchingLogs[0] : null;
    const lastDoneOdo = lastLog ? Number(lastLog.odo) : 0;
    const lastDoneDate = lastLog ? new Date(lastLog.date) : null;

    let kmRemaining = null;
    let daysRemaining = null;

    if(item.intervalKm > 0) {
      const nextDueOdo = lastDoneOdo > 0 ? lastDoneOdo + item.intervalKm : item.intervalKm;
      kmRemaining = nextDueOdo - currentOdo;
    }

    if(item.intervalDays > 0) {
      if(lastDoneDate) {
        const nextDueDate = new Date(lastDoneDate);
        nextDueDate.setDate(nextDueDate.getDate() + item.intervalDays);
        daysRemaining = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));
      } else {
        daysRemaining = item.intervalDays;
      }
    }

    let pillClass = 'valid';
    let statusTextParts = [];

    if(kmRemaining !== null) {
      if(kmRemaining <= 0) pillClass = 'expired';
      else if(kmRemaining <= 500 && pillClass !== 'expired') pillClass = 'expiring';
      statusTextParts.push(kmRemaining <= 0 ? '0 KM' : `${kmRemaining.toLocaleString()} KM`);
    }

    if(daysRemaining !== null) {
      if(daysRemaining <= 0) pillClass = 'expired';
      else if(daysRemaining <= 7 && pillClass !== 'expired') pillClass = 'expiring';
      statusTextParts.push(daysRemaining <= 0 ? '0 Days' : `${daysRemaining} Days`);
    }

    let statusPillText = pillClass === 'expired' ? 'DUE NOW' : `${statusTextParts.join(' / ')} Left`;

    let subParts = [];
    if(item.intervalKm > 0) subParts.push(`Every ${item.intervalKm.toLocaleString()} KM`);
    if(item.intervalDays > 0) subParts.push(`Every ${item.intervalDays} Days`);

    const card = document.createElement('div');
    card.className = 'list-card';
    card.innerHTML = `
      <div>
        <div class="card-title">⚙️ ${item.key} <span style="font-size:0.75rem; color:var(--text-sub);">(${item.val})</span></div>
        <div class="card-sub">Last Check: ${lastDoneOdo ? lastDoneOdo.toLocaleString() + ' KM' : 'Not Recorded'} • ${subParts.join(' or ')}</div>
      </div>
      <span class="doc-pill ${pillClass}">${statusPillText}</span>
    `;
    box.appendChild(card);
  });
}

function exportLogsCSV() {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  let logs = JSON.parse(localStorage.getItem('vh_logs') || '[]').filter(l => l.vehicleId === activeV || !l.vehicleId);
  
  if(logs.length === 0) return alert('No logs available to export.');

  let csvContent = "data:text/csv;charset=utf-8,ID,Date,Odometer,Type,Category,Amount,Notes,PaymentText\n";
  logs.forEach(l => {
    csvContent += `"${l.id}","${l.date}","${l.odo}","${l.type}","${l.cat}","${l.amt}","${l.notes || ''}","${l.pDetails?.text || ''}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `VehicleHub_Logs_${activeV}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportLogsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  let logs = JSON.parse(localStorage.getItem('vh_logs') || '[]').filter(l => l.vehicleId === activeV || !l.vehicleId);

  doc.setFontSize(16);
  doc.text("MANSKIT VehicleHub - Financial Activity Log", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

  let y = 38;
  logs.forEach((l, i) => {
    if(y > 270) { doc.addPage(); y = 20; }
    doc.text(`${i + 1}. [${l.date}] ${l.cat} - Rs.${l.amt} (${l.odo} KM)`, 14, y);
    doc.text(`   Remarks: ${l.notes || 'N/A'} | ${l.pDetails?.text || ''}`, 14, y + 5);
    y += 12;
  });

  doc.save(`VehicleHub_Report_${activeV}.pdf`);
}

function renderFinanceSummaryCard() {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const vList = JSON.parse(localStorage.getItem('vh_vehicles') || '[]');
  const target = vList.find(v => v.id === activeV);
  const container = document.getElementById('vehicle-finance-summary-box');

  if(!target || !target.financeDetails || Object.keys(target.financeDetails).length === 0) {
    container.innerHTML = `
      <div style="background:#0b0f17; padding:14px; border-radius:10px; border: 1px solid var(--card-border); text-align:center; color: var(--text-sub); font-size:0.85rem;">
        ℹ No Purchase or Loan details added yet.
      </div>
    `;
    return;
  }

  const fin = target.financeDetails;
  container.innerHTML = `
    <div style="background:#0b0f17; padding:12px; border-radius:10px; border: 1px solid var(--card-border);">
      <div class="list-card"><span>Ex-Showroom Price</span><span style="font-weight:800;">₹${Number(fin.exShowroom || 0).toLocaleString()}</span></div>
      <div class="list-card"><span>Down Payment Paid</span><span style="font-weight:800; color:var(--success);">₹${Number(fin.downPayment || 0).toLocaleString()}</span></div>
      <div class="list-card"><span>Loan Amount Financed</span><span style="font-weight:800; color:var(--sky-blue);">₹${Number(fin.loanAmt || 0).toLocaleString()}</span></div>
      <div class="list-card"><span>Financier / Bank</span><span style="font-weight:800;">${fin.bankName || 'N/A'}</span></div>
      <div class="list-card"><span>Monthly EMI / Tenure</span><span style="font-weight:800; color:var(--warning);">₹${Number(fin.monthlyEmi || 0).toLocaleString()} / ${fin.tenureMonths || 0} Mos</span></div>
    </div>
  `;
}

function deleteLogEntry(id) {
  if(confirm('🔒 SECURITY CONFIRMATION:\nAre you sure you want to permanently delete this log entry?')) {
    let logs = JSON.parse(localStorage.getItem('vh_logs') || '[]');
    logs = logs.filter(l => l.id != id);
    localStorage.setItem('vh_logs', JSON.stringify(logs));
    loadDataAndUI();
    alert('✅ Log entry deleted.');
  }
}

function saveVehicleProfile(e) {
  e.preventDefault();
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const vList = JSON.parse(localStorage.getItem('vh_vehicles') || '[]');
  const target = vList.find(v => v.id === activeV);

  if(target) {
    target.name = document.getElementById('prof-vname').value;
    target.reg = document.getElementById('prof-vreg').value;

    const partnerInputs = document.querySelectorAll('.partner-input-val');
    const updatedPartners = [];
    partnerInputs.forEach(inp => {
      const val = inp.value.trim();
      if(val !== '' && val.toLowerCase() !== 'undefined') updatedPartners.push(val);
    });

    target.partners = updatedPartners.length > 0 ? updatedPartners : ['Owner'];

    localStorage.setItem('vh_vehicles', JSON.stringify(vList));
    initVehicles();
    loadDataAndUI();
    alert('✅ Vehicle Profile Updated Successfully!');
  }
}

function saveVehicleFinanceProfile(e) {
  e.preventDefault();
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const vList = JSON.parse(localStorage.getItem('vh_vehicles') || '[]');
  const target = vList.find(v => v.id === activeV);

  if(target) {
    target.financeDetails = {
      exShowroom: document.getElementById('fin-exshowroom').value,
      downPayment: document.getElementById('fin-downpayment').value,
      loanAmt: document.getElementById('fin-loan-amt').value,
      bankName: document.getElementById('fin-bank-name').value,
      monthlyEmi: document.getElementById('fin-monthly-emi').value,
      tenureMonths: document.getElementById('fin-tenure-months').value
    };

    localStorage.setItem('vh_vehicles', JSON.stringify(vList));
    loadDataAndUI();
    alert('✅ Purchase & Loan details saved!');
  }
}

function addTechnicalSpec(e) {
  e.preventDefault();
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const group = document.getElementById('spec-group').value.trim();
  const key = document.getElementById('spec-key').value.trim();
  const val = document.getElementById('spec-val').value.trim();
  const interval = Number(document.getElementById('spec-interval').value) || 0;
  const intervalDays = Number(document.getElementById('spec-interval-days').value) || 0;

  let specs = JSON.parse(localStorage.getItem(`vh_specs_${activeV}`) || '{}');
  if(!specs[group]) specs[group] = [];
  specs[group].push({ id: Date.now(), key, val, interval, intervalDays });

  localStorage.setItem(`vh_specs_${activeV}`, JSON.stringify(specs));
  document.getElementById('spec-key').value = '';
  document.getElementById('spec-val').value = '';
  document.getElementById('spec-interval').value = '';
  document.getElementById('spec-interval-days').value = '';
  
  renderSpecsUI();
  loadDataAndUI();
}

function renderSpecsUI() {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const container = document.getElementById('specs-container');
  const specs = JSON.parse(localStorage.getItem(`vh_specs_${activeV}`) || '{}');
  container.innerHTML = '';

  Object.keys(specs).forEach(group => {
    const box = document.createElement('div');
    box.style.cssText = "background:#0b0f17; padding:10px; border-radius:10px; margin-bottom:10px; border:1px solid var(--card-border);";
    box.innerHTML = `<div style="font-weight:800; color:var(--sky-blue); margin-bottom:6px;">${group}</div>`;
    
    specs[group].forEach(i => {
      let intervalLabel = [];
      if(i.interval) intervalLabel.push(`${Number(i.interval).toLocaleString()} KM`);
      if(i.intervalDays) intervalLabel.push(`${i.intervalDays} Days`);

      const item = document.createElement('div');
      item.className = 'list-card';
      item.innerHTML = `
        <div>
          <div class="card-title">${i.key}: <strong>${i.val}</strong></div>
          ${intervalLabel.length > 0 ? `<div class="card-sub" style="color:var(--sky-blue);">⏱️ Check Every ${intervalLabel.join(' or ')}</div>` : ''}
        </div>
      `;
      
      const actions = document.createElement('div');
      actions.className = 'action-group';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-act';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', function() { editSpec(group, i.id); });
      actions.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-act';
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', function() { deleteSpec(group, i.id); });
      actions.appendChild(delBtn);

      item.appendChild(actions);
      box.appendChild(item);
    });

    container.appendChild(box);
  });
}

function editSpec(group, id) {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  let specs = JSON.parse(localStorage.getItem(`vh_specs_${activeV}`) || '{}');
  const target = specs[group].find(i => i.id == id);
  if(!target) return;

  const newVal = prompt(`Edit value for "${target.key}":`, target.val);
  if(newVal && newVal.trim() !== '') {
    target.val = newVal.trim();
    localStorage.setItem(`vh_specs_${activeV}`, JSON.stringify(specs));
    renderSpecsUI();
    loadDataAndUI();
  }
}

function deleteSpec(group, id) {
  if(confirm('🔒 SECURITY CONFIRMATION:\nDelete this technical spec entry?')) {
    const activeV = document.getElementById('vehicle-select').value || 'v1';
    let specs = JSON.parse(localStorage.getItem(`vh_specs_${activeV}`) || '{}');
    specs[group] = specs[group].filter(i => i.id != id);
    if(specs[group].length === 0) delete specs[group];
    localStorage.setItem(`vh_specs_${activeV}`, JSON.stringify(specs));
    renderSpecsUI();
    loadDataAndUI();
  }
}

function shareFullSpecs() {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const specs = JSON.parse(localStorage.getItem(`vh_specs_${activeV}`) || '{}');
  let text = `🚘 MANSKIT Vehicle Specs\n\n`;
  Object.keys(specs).forEach(g => {
    text += `📌 ${g}\n`;
    specs[g].forEach(i => text += ` • ${i.key}: ${i.val}\n`);
  });
  if(navigator.share) {
    navigator.share({ title: 'Vehicle Specs', text });
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
  }
}

function uploadPhotoHandler(e) {
  e.preventDefault();
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const angle = document.getElementById('photo-angle').value;
  const file = document.getElementById('photo-file').files[0];

  if(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      let photos = JSON.parse(localStorage.getItem('vh_photos') || '[]');
      photos.unshift({ id: Date.now(), vehicleId: activeV, angle, data: event.target.result });
      localStorage.setItem('vh_photos', JSON.stringify(photos));
      renderPhotosUI();
    };
    reader.readAsDataURL(file);
  }
}

function renderPhotosUI() {
  const activeV = document.getElementById('vehicle-select').value || 'v1';
  const grid = document.getElementById('photo-grid');
  const photos = JSON.parse(localStorage.getItem('vh_photos') || '[]').filter(p => p.vehicleId === activeV);
  grid.innerHTML = '';

  photos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <img src="${p.data}" alt="${p.angle}">
      <div class="photo-tag">${p.angle}</div>
    `;

    const delBtn = document.createElement('button');
    delBtn.className = 'photo-del-btn';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', function() { deletePhoto(p.id); });
    card.appendChild(delBtn);

    grid.appendChild(card);
  });
}

function deletePhoto(id) {
  if(confirm('🔒 SECURITY CONFIRMATION:\nDelete this gallery photo?')) {
    let photos = JSON.parse(localStorage.getItem('vh_photos') || '[]');
    photos = photos.filter(p => p.id != id);
    localStorage.setItem('vh_photos', JSON.stringify(photos));
    renderPhotosUI();
  }
}

function switchTab(target, elem) {
  document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active-section'));
  const activeSection = document.getElementById(`section-${target}`);
  if(activeSection) activeSection.classList.add('active-section');
  
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  if(elem) elem.classList.add('active');
}

function switchVehicle() {
  initVehicles();
  loadDataAndUI();
}

function addVehiclePrompt() {
  const name = prompt('Enter Vehicle Name:');
  const reg = prompt('Enter Registration Number (RC):');
  if(name && reg) {
    let vList = JSON.parse(localStorage.getItem('vh_vehicles') || '[]');
    const newV = { id: 'v' + Date.now(), name, reg, partners: ['Owner'] };
    vList.push(newV);
    localStorage.setItem('vh_vehicles', JSON.stringify(vList));
    initVehicles();
    loadDataAndUI();
  }
}
