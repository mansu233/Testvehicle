// app.js - Core Application Logic & Event Handlers

document.addEventListener('DOMContentLoaded', () => {
  // Initialize inputs and options
  initVehicleData();
  setupTabNavigation();
  setupQuickLogForm();
  setupVehicleProfileForm();
});

// 1. Load and Render Vehicle Select Dropdown
function initVehicleData() {
  const vehicleSelect = document.getElementById('vehicle-select');
  const inputVehicleName = document.getElementById('input-vehicle-name');
  const inputRegNumber = document.getElementById('input-reg-number');

  let vehicles = [];
  if (typeof VehicleStorage !== 'undefined') {
    vehicles = VehicleStorage.getVehicles();
  } else {
    const data = localStorage.getItem('vehiclehub_vehicles');
    vehicles = data ? JSON.parse(data) : [];
  }

  // If no vehicles exist, create a default
  if (vehicles.length === 0) {
    vehicles = [{ id: 'v1', name: 'Primary Vehicle', regNumber: '', odometer: 0 }];
    localStorage.setItem('vehiclehub_vehicles', JSON.stringify(vehicles));
  }

  const activeVehicle = vehicles[0];

  // Update Dropdown Header Display
  if (vehicleSelect) {
    vehicleSelect.innerHTML = '';
    vehicles.forEach(v => {
      const option = document.createElement('option');
      option.value = v.id;
      option.textContent = v.regNumber 
        ? `${v.name} (${v.regNumber.toUpperCase()})` 
        : v.name;
      vehicleSelect.appendChild(option);
    });
  }

  // Populate Profile Inputs
  if (inputVehicleName && activeVehicle) {
    inputVehicleName.value = activeVehicle.name || '';
  }
  if (inputRegNumber && activeVehicle) {
    inputRegNumber.value = activeVehicle.regNumber || '';
  }
}

// 2. Setup "Update Vehicle Info" Button Submission
function setupVehicleProfileForm() {
  const vehicleSetupForm = document.getElementById('vehicle-setup-form');
  const inputVehicleName = document.getElementById('input-vehicle-name');
  const inputRegNumber = document.getElementById('input-reg-number');

  if (!vehicleSetupForm) return;

  vehicleSetupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newName = inputVehicleName.value.trim() || 'Primary Vehicle';
    const newReg = inputRegNumber.value.trim();

    // Fetch existing vehicles array
    let vehicles = typeof VehicleStorage !== 'undefined' 
      ? VehicleStorage.getVehicles() 
      : JSON.parse(localStorage.getItem('vehiclehub_vehicles') || '[]');

    if (vehicles.length === 0) {
      vehicles = [{ id: 'v1', name: newName, regNumber: newReg, odometer: 0 }];
    } else {
      vehicles[0].name = newName;
      vehicles[0].regNumber = newReg;
    }

    // Save back to storage
    if (typeof VehicleStorage !== 'undefined') {
      VehicleStorage.saveVehicles(vehicles);
    } else {
      localStorage.setItem('vehiclehub_vehicles', JSON.stringify(vehicles));
    }

    // Immediately refresh the header dropdown UI
    initVehicleData();

    alert('✅ Vehicle details updated successfully!');
  });
}

// 3. Tab Switching for Log Categories
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.log-tabs .tab-btn');
  const categorySelect = document.getElementById('log-category');

  function updateCategories(type) {
    if (!categorySelect) return;
    categorySelect.innerHTML = '';

    const opts = {
      fuel: ['Full Tank', 'Partial Tank', 'Premium Fuel'],
      maintenance: ['Oil Change', 'Tire Rotation', 'Brake Service', 'General Maintenance'],
      expense: ['Toll', 'Parking', 'Car Wash', 'Insurance', 'Registration']
    };

    const list = opts[type] || opts.maintenance;
    list.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      categorySelect.appendChild(opt);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-type') || 'fuel';
      updateCategories(type);
    });
  });
}

// 4. Quick Log Form Handler
function setupQuickLogForm() {
  const logForm = document.getElementById('quick-log-form');
  const dateInput = document.getElementById('log-date');

  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  if (!logForm) return;

  logForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const activeTab = document.querySelector('.log-tabs .tab-btn.active');
    const logType = activeTab ? activeTab.getAttribute('data-type') : 'fuel';

    const newLog = {
      id: Date.now(),
      type: logType,
      date: document.getElementById('log-date').value,
      odometer: Number(document.getElementById('log-odometer').value),
      category: document.getElementById('log-category')?.value || '',
      amount: Number(document.getElementById('log-amount').value),
      notes: document.getElementById('log-notes')?.value || ''
    };

    if (typeof VehicleStorage !== 'undefined') {
      VehicleStorage.saveLog(newLog);
    } else {
      const logs = JSON.parse(localStorage.getItem('vehiclehub_logs') || '[]');
      logs.unshift(newLog);
      localStorage.setItem('vehiclehub_logs', JSON.stringify(logs));
    }

    alert('✅ Log entry saved successfully!');
    logForm.reset();
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  });
}
