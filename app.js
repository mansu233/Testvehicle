// Core Application Controller
document.addEventListener('DOMContentLoaded', () => {
  // Initialize default date in log form
  const dateInput = document.getElementById('log-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Handle Tab Navigation for Quick Log Category Switching
  let activeLogType = 'fuel';
  const tabButtons = document.querySelectorAll('.log-tabs .tab-btn');
  const categorySelect = document.getElementById('log-category');

  function updateCategoryOptions(type) {
    if (!categorySelect) return;
    categorySelect.innerHTML = '';
    
    const key = type.toUpperCase();
    const options = CATEGORIES[key] || [];

    options.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt;
      el.textContent = opt;
      categorySelect.appendChild(el);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLogType = btn.dataset.type;
      updateCategoryOptions(activeLogType);
    });
  });

  // Form Submit Handler
  const form = document.getElementById('quick-log-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const newEntry = {
        id: Date.now(),
        type: activeLogType,
        date: document.getElementById('log-date').value,
        odometer: Number(document.getElementById('log-odometer').value),
        category: categorySelect ? categorySelect.value : '',
        amount: Number(document.getElementById('log-amount').value),
        notes: document.getElementById('log-notes').value
      };

      VehicleStorage.saveLog(newEntry);
      alert('Log entry saved successfully!');
      form.reset();
      
      // Reset default values
      dateInput.value = new Date().toISOString().split('T')[0];
      updateCategoryOptions(activeLogType);
    });
  }

  // Register Service Worker for PWA Offline Support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('VehicleHub ServiceWorker Registered'))
      .catch(err => console.log('ServiceWorker Registration Failed', err));
  }
});
