// Textile DC Management System - App Logic

const STORAGE_KEY = 'textile_received_entries';
const INW_COUNTER_KEY = 'textile_inw_counter';
const DELIVERY_STORAGE_KEY = 'textile_deliveries';
const DELIVERY_DC_COUNTER_KEY = 'textile_delivery_dc_counter';
const INVOICE_STORAGE_KEY = 'textile_invoices';
const INVOICE_COUNTER_KEY = 'textile_invoice_counter';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSidebarCollapse();
  updatePageDate();
  initReceivedCloth();
  initInwardEntry();
  initDelivery();
  initInvoice();
  initPartyMaster();
  initDyeingMaster();
  initCompanySettings();
  updatePartyDropdowns();
  setupEnterKeyNavigation();
  updateDashboardMetrics();
});

function preparePrint(containerId) {
  ['receivedChallanPrint', 'deliveryChallanPrint', 'invoicePrint'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active-print');
  });
  const target = document.getElementById(containerId);
  if (target) target.classList.add('active-print');
}

// Page titles for header
const pageTitles = {
  dashboard: 'Dashboard',
  received: 'Received Cloth',
  delivery: 'Delivery',
  invoices: 'Invoices',
  'party-master': 'Party Master',
  'dyeing-master': 'Dyeing Master',
  'company-settings': 'Company Settings'
};

function initNavigation() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (el.tagName === 'A') e.preventDefault();
      const page = el.dataset.page;
      const showForm = el.dataset.showForm === 'true';
      if (page) {
        navigateTo(page, showForm);
      }
    });
  });
}

function navigateTo(pageId, showForm = false) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  const pageTitleEl = document.getElementById('pageTitle');
  if (pageTitleEl && pageTitles[pageId]) {
    pageTitleEl.textContent = pageTitles[pageId];
  }

  if (pageId === 'received') {
    if (showForm) {
      showInwardForm();
    } else {
      showReceivedList();
    }
  }

  if (pageId === 'delivery') {
    if (showForm) {
      showDeliveryForm();
    } else {
      showDeliveryList();
    }
  }

  if (pageId === 'invoices') {
    if (showForm) {
      showInvoiceForm();
    } else {
      showInvoiceList();
    }
  }

  if (pageId === 'party-master') {
    if (showForm) {
      showPartyForm();
    } else {
      showPartyList();
    }
  }

  if (pageId === 'dyeing-master') {
    if (showForm) {
      showDyeingForm();
    } else {
      showDyeingList();
    }
  }

  if (pageId === 'company-settings') {
    // nothing special needed, just show the div
  }

  if (pageId === 'attendance') {
    initAttendanceSystem();
  }

  if (pageId === 'dashboard') {
    updateDashboardMetrics();
  }
}

function initSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  if (sidebar && collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const icon = collapseBtn.querySelector('svg');
      const label = collapseBtn.querySelector('.collapse-label');
      if (sidebar.classList.contains('collapsed')) {
        if (icon) icon.innerHTML = '<polyline points="15 18 9 12 15 6"/>';
        if (label) label.textContent = 'Expand';
      } else {
        if (icon) icon.innerHTML = '<polyline points="9 18 15 12 9 6"/>';
        if (label) label.textContent = 'Collapse';
      }
    });
  }
}

function updatePageDate() {
  const el = document.getElementById('pageDate');
  if (el) el.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// --- Storage & Dashboard ---
function getEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getNextInwNo() {
  let n = parseInt(localStorage.getItem(INW_COUNTER_KEY) || '16184', 10);
  localStorage.setItem(INW_COUNTER_KEY, String(n + 1));
  return n;
}

function updateDashboardMetrics() {
  const entries = getEntries();
  const deliveries = getDeliveries();
  const today = new Date().toDateString();
  const totalReceived = entries.length;
  const totalDelivered = deliveries.length;
  const pending = entries.filter(e => (e.status || 'Pending') === 'Pending').length;
  const todayReceived = entries.filter(e => e.date && new Date(e.date).toDateString() === today).length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('dashTotalReceived', totalReceived);
  set('dashTotalDelivered', totalDelivered);
  set('dashPending', pending);
  set('dashTodayReceived', todayReceived);

  const recentEl = document.getElementById('recentReceivedList');
  if (recentEl) {
    const recent = entries.slice(-5).reverse();
    recentEl.innerHTML = recent.length ? recent.map(e => `
      <div class="recent-item">
        <div class="recent-item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div class="recent-item-info">
          <span class="recent-qty">${e.ourWt || '0'} Kg</span>
          <span class="recent-party">${e.party || '--'}</span>
        </div>
        <span class="badge badge-pending">${e.status || 'Pending'}</span>
        <span class="recent-date">${e.date ? new Date(e.date).toLocaleDateString('en-GB') : '--'}</span>
      </div>
    `).join('') : '<p class="empty-state">No received entries yet</p>';
  }

  const recentDelEl = document.getElementById('recentDeliveriesList');
  if (recentDelEl) {
    const recentDel = deliveries.slice(-5).reverse();
    recentDelEl.innerHTML = recentDel.length ? recentDel.map(d => `
      <div class="recent-item">
        <div class="recent-item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>
        <div class="recent-item-info">
          <span class="recent-qty">DC ${d.dcNo}</span>
          <span class="recent-party">${d.partyName || '--'}</span>
        </div>
        <span class="badge badge-pending">Delivered</span>
        <span class="recent-date">${d.date ? new Date(d.date).toLocaleDateString('en-GB') : '--'}</span>
      </div>
    `).join('') : '<p class="empty-state">No deliveries yet</p>';
  }
}

// --- Received Cloth List ---
function initReceivedCloth() {
  const btnNew = document.getElementById('btnNewInward');
  const btnBack = document.getElementById('btnBackToList');
  const searchInput = document.getElementById('receivedSearch');

  if (btnNew) btnNew.addEventListener('click', () => showInwardForm(true));
  if (btnBack) btnBack.addEventListener('click', () => { document.querySelectorAll('.form-actions .btn-action').forEach(b => b.disabled = false); showReceivedList(); });
  if (searchInput) searchInput.addEventListener('input', renderReceivedTable);

  renderReceivedTable();
}

function showInwardForm(reset = true) {
  const listView = document.getElementById('receivedListView');
  const formView = document.getElementById('inwardFormView');
  if (listView) listView.style.display = 'none';
  if (formView) formView.style.display = 'block';
  if (reset) resetInwardForm();
  document.querySelectorAll('.form-actions .btn-action').forEach(b => b.disabled = false);
}

function showReceivedList() {
  const listView = document.getElementById('receivedListView');
  const formView = document.getElementById('inwardFormView');
  if (listView) listView.style.display = 'block';
  if (formView) formView.style.display = 'none';
  renderReceivedTable();
  updateDashboardMetrics();
}

function renderReceivedTable() {
  const tbody = document.getElementById('receivedTableBody');
  const search = (document.getElementById('receivedSearch')?.value || '').toLowerCase();
  if (!tbody) return;

  const entries = getEntries().filter(e => {
    if (!search) return true;
    const s = `${e.inwNo} ${e.party} ${e.dyeing} ${e.fabric || ''}`.toLowerCase();
    return s.includes(search);
  });

  tbody.innerHTML = entries.length ? entries.map(e => `
    <tr data-id="${e.id}">
      <td>${e.inwNo}</td>
      <td>${e.dcNo || '--'}</td>
      <td>${e.party}</td>
      <td>${e.partyDcNo || '--'}</td>
      <td>${e.dyeing}</td>
      <td>${e.dyeingDcNo || '--'}</td>
      <td>${e.ourWt} Kg</td>
      <td><span class="badge-status ${(e.status || 'Pending').toLowerCase()}">${e.status || 'Pending'}</span></td>
      <td class="action-icons">
        <button type="button" title="View" onclick="viewEntry('${e.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button type="button" title="Edit" onclick="editEntry('${e.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button type="button" title="Print" onclick="printEntry('${e.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/></svg></button>
        <button type="button" title="Delete" onclick="deleteEntry('${e.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:24px">No received entries yet. Click "New Inward Entry" to add.</td></tr>';
}

function viewEntry(id) {
  const entries = getEntries();
  const e = entries.find(x => x.id === id);
  if (!e) return;
  showInwardForm(false);
  populateForm(e);
  document.querySelectorAll('.form-actions .btn-action').forEach(b => { if (!b.id || !['btnPrint', 'btnBackToList', 'btnExit'].includes(b.id)) b.disabled = true; });
}

function editEntry(id) {
  const entries = getEntries();
  const e = entries.find(x => x.id === id);
  if (!e) return;
  showInwardForm(false);
  populateForm(e);
  document.getElementById('inwNo').dataset.editId = id;
}

function printEntry(id) {
  const entries = getEntries();
  const e = entries.find(x => x.id === id);
  if (!e) return;
  preparePrint('receivedChallanPrint');
  populatePrintFromEntry(e);
  window.print();
}

function deleteEntry(id) {
  if (!confirm('Are you sure you want to delete this received entry?')) return;
  const entries = getEntries().filter(x => x.id !== id);
  saveEntries(entries);
  updateDashboardMetrics();
  renderReceivedTable();
  // Ensure we are back on the list view after deletion
  showReceivedList();
}



function populateForm(e) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  set('inwDate', e.date);
  set('inwNo', e.inwNo);
  set('partyName', e.partyValue || '');
  set('typeOfProcess', e.process || 'COMPACTING');
  set('dyeingName', e.dyeingValue || '');
  set('dyDcNo', e.dyeingDcNo);
  set('search_partyName', e.party || '');
  set('search_dyeingName', e.dyeing || '');
  set('lotNo', e.lotNo);
  set('partyDcNo', e.partyDcNo);
  set('partyOrder', e.partyOrder);
  set('remarks', e.remarks);
  const tbody = document.getElementById('itemGridBody');
  if (tbody && e.items) {
    tbody.innerHTML = '';
    e.items.forEach(it => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${tbody.children.length + 1}</td><td>${it.colour || ''}</td><td>${it.fabric || ''}</td><td>${it.dia || ''}</td><td>${it.roll || ''}</td><td>${it.dyDcWt || ''}</td><td>${it.receivedWt || ''}</td><td><button type="button" class="btn-delete-row">×</button></td>`;
      tr.querySelector('.btn-delete-row').addEventListener('click', () => { tr.remove(); renumberRows(); updateTotals(); });
      tbody.appendChild(tr);
    });
  }
  updateTotals();
}

function populatePrintFromEntry(e) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '--'; };
  set('printPartyName', e.party);
  set('printDyeingName', e.dyeing);
  set('printDate', e.date ? new Date(e.date).toLocaleDateString('en-GB') : '--');
  set('printDcNo', e.inwNo);
  set('printInwNo', e.inwNo);
  set('printDyDcNo', e.dyeingDcNo);
  set('printPartyDcNo', e.partyDcNo);
  set('printOrderNo', e.partyOrder);
  set('printProcess', e.process || 'COMPACTING');
  set('printTotalRoll', e.totalRoll || '0');
  set('printTotalReceivedWt', e.ourWt || '0');
  set('printReceivedWt', e.ourWt || '0');
  set('printDyDcWt', e.totalDyDcWt || '0');
  const printBody = document.getElementById('printGridBody');
  if (printBody && e.items) {
    printBody.innerHTML = e.items.map(it => `
      <tr><td>${e.lotNo || '--'}</td><td>${it.fabric || ''}</td><td>${it.colour || ''}</td><td>${it.dia || ''}</td><td>${it.roll || ''}</td><td>${it.receivedWt || ''}</td></tr>
    `).join('');
  }
}

// --- Inward Entry Form ---
function initInwardEntry() {
  const btnAddRow = document.getElementById('btnAddRow');
  const btnPrint = document.getElementById('btnPrint');
  const btnSave = document.getElementById('btnSave');

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'n' && document.getElementById('inwardFormView')?.style.display !== 'none') {
      e.preventDefault();
      addRowFromInputs();
    }
  });

  updateTotals();
}

function resetInwardForm() {
  const inwNoEl = document.getElementById('inwNo');
  if (inwNoEl) delete inwNoEl.dataset.editId;
  document.querySelectorAll('.form-actions .btn-action').forEach(b => b.disabled = false);
  const inwDate = document.getElementById('inwDate');
  if (inwDate) inwDate.valueAsDate = new Date();
  if (inwNoEl) inwNoEl.value = getNextInwNo();

  // Clear all text and hidden inputs
  ['partyName', 'search_partyName', 'dyeingName', 'search_dyeingName', 'dyDcNo', 'lotNo', 'partyDcNo', 'partyOrder', 'remarks'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('typeOfProcess').value = 'COMPACTING';
  const tbody = document.getElementById('itemGridBody');
  if (tbody) tbody.innerHTML = '';
  clearItemInputs();
  updateTotals();
  const d = new Date();
  const ed = document.getElementById('entryDate');
  if (ed) ed.textContent = d.toLocaleDateString('en-GB') + ' - ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function collectFormData() {
  const rows = [];
  document.querySelectorAll('#itemGridBody tr').forEach(tr => {
    const c = tr.querySelectorAll('td');
    if (c.length >= 7) rows.push({ colour: c[1].textContent, fabric: c[2].textContent, dia: c[3].textContent, roll: c[4].textContent, dyDcWt: c[5].textContent, receivedWt: c[6].textContent });
  });
  return rows;
}

let isSavingInward = false;
function saveInwardEntry() {
  if (isSavingInward) return;
  isSavingInward = true;

  try {
    const rows = collectFormData();
    if (!rows.length) { alert('Add at least one item.'); return; }

    const totalRoll = document.getElementById('totalRoll')?.value || '0';
    const totalDyDcWt = document.getElementById('totalDyDcWt')?.value || '0';
    const totalReceivedWt = document.getElementById('totalReceivedWt')?.value || '0';
    const entry = {
      id: document.getElementById('inwNo').dataset.editId || 'id_' + Date.now(),
      inwNo: document.getElementById('inwNo').value,
      date: document.getElementById('inwDate').value,
      partyValue: document.getElementById('partyName')?.value,
      party: document.getElementById('search_partyName') ? document.getElementById('search_partyName').value : '--',
      partyDcNo: document.getElementById('partyDcNo')?.value,
      dyeingValue: document.getElementById('dyeingName')?.value,
      dyeing: document.getElementById('search_dyeingName') ? document.getElementById('search_dyeingName').value : '--',
      dyeingDcNo: document.getElementById('dyDcNo')?.value,
      lotNo: document.getElementById('lotNo')?.value,
      partyOrder: document.getElementById('partyOrder')?.value,
      process: document.getElementById('typeOfProcess')?.value || 'COMPACTING',
      remarks: document.getElementById('remarks')?.value,
      items: rows,
      totalRoll, totalDyDcWt, ourWt: totalReceivedWt,
      status: 'Pending',
      dcNo: document.getElementById('inwNo').value
    };

    const entries = getEntries();
    const editId = document.getElementById('inwNo').dataset.editId;
    let updated;
    if (editId) {
      updated = entries.map(e => e.id === editId ? entry : e);
    } else {
      updated = [...entries, entry];
    }
    saveEntries(updated);
    updateDashboardMetrics();
    showReceivedList();
  } finally {
    setTimeout(() => { isSavingInward = false; }, 500);
  }
}

function addRowFromInputs() {
  const colour = document.getElementById('itemColour')?.value?.trim() || '';
  const fabric = document.getElementById('itemFabric')?.value?.trim() || '';
  const dia = document.getElementById('itemDia')?.value || '0';
  const roll = document.getElementById('itemRoll')?.value || '0';
  const dyDcWt = document.getElementById('itemDyDcWt')?.value || '0';
  const receivedWt = document.getElementById('itemReceivedWt')?.value || '0';

  const tbody = document.getElementById('itemGridBody');
  if (!tbody) return;

  const modifyingRow = tbody.querySelector('tr.modifying');
  if (modifyingRow) {
    modifyingRow.cells[1].textContent = colour;
    modifyingRow.cells[2].textContent = fabric;
    modifyingRow.cells[3].textContent = dia;
    modifyingRow.cells[4].textContent = roll;
    modifyingRow.cells[5].textContent = dyDcWt;
    modifyingRow.cells[6].textContent = receivedWt;
    modifyingRow.classList.remove('modifying');
    clearItemInputs();
    updateTotals();
    return;
  }

  if (!colour && !fabric && !roll && !receivedWt) return;

  const sno = tbody.querySelectorAll('tr').length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${sno}</td><td>${colour}</td><td>${fabric}</td><td>${dia}</td><td>${roll}</td><td>${dyDcWt}</td><td>${receivedWt}</td><td><button type="button" class="btn-delete-row" title="Delete">×</button></td>`;
  tr.querySelector('.btn-delete-row').addEventListener('click', () => { tr.remove(); renumberRows(); updateTotals(); });
  tr.addEventListener('dblclick', () => {
    tbody.querySelectorAll('tr').forEach(r => r.classList.remove('modifying'));
    document.getElementById('itemColour').value = tr.cells[1].textContent;
    document.getElementById('itemFabric').value = tr.cells[2].textContent;
    document.getElementById('itemDia').value = tr.cells[3].textContent;
    document.getElementById('itemRoll').value = tr.cells[4].textContent;
    document.getElementById('itemDyDcWt').value = tr.cells[5].textContent;
    document.getElementById('itemReceivedWt').value = tr.cells[6].textContent;
    tr.classList.add('modifying');
  });
  tbody.appendChild(tr);
  updateTotals();
  clearItemInputs();
}

function clearItemInputs() {
  ['itemColour', 'itemFabric', 'itemDia', 'itemRoll', 'itemDyDcWt', 'itemReceivedWt'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'itemDia' ? '0' : '';
  });
}

function renumberRows() {
  const tbody = document.getElementById('itemGridBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, i) => { tr.querySelector('td:first-child').textContent = i + 1; });
}

function updateTotals() {
  const tbody = document.getElementById('itemGridBody');
  const totalRoll = document.getElementById('totalRoll');
  const totalDyDcWt = document.getElementById('totalDyDcWt');
  const totalReceivedWt = document.getElementById('totalReceivedWt');
  if (!tbody || !totalRoll) return;
  let r = 0, d = 0, w = 0;
  tbody.querySelectorAll('tr').forEach(tr => {
    const c = tr.querySelectorAll('td');
    if (c.length >= 7) { r += parseFloat(c[4]?.textContent || 0) || 0; d += parseFloat(c[5]?.textContent || 0) || 0; w += parseFloat(c[6]?.textContent || 0) || 0; }
  });
  totalRoll.value = r.toFixed(0);
  if (totalDyDcWt) totalDyDcWt.value = d.toFixed(3);
  if (totalReceivedWt) totalReceivedWt.value = w.toFixed(3);
}

function printReceivedChallan() {
  preparePrint('receivedChallanPrint');
  const rows = collectFormData();
  const partyInput = document.getElementById('search_partyName');
  const dyeingInput = document.getElementById('search_dyeingName');
  document.getElementById('printPartyName').textContent = partyInput ? partyInput.value : '--';
  document.getElementById('printDyeingName').textContent = dyeingInput ? dyeingInput.value : '--';
  document.getElementById('printDate').textContent = document.getElementById('inwDate')?.value ? new Date(document.getElementById('inwDate').value).toLocaleDateString('en-GB') : '--';
  document.getElementById('printDcNo').textContent = document.getElementById('inwNo')?.value || '--';
  document.getElementById('printInwNo').textContent = document.getElementById('inwNo')?.value || '--';
  document.getElementById('printDyDcNo').textContent = document.getElementById('dyDcNo')?.value || '--';
  document.getElementById('printPartyDcNo').textContent = document.getElementById('partyDcNo')?.value || '--';
  document.getElementById('printOrderNo').textContent = document.getElementById('partyOrder')?.value || '--';
  document.getElementById('printProcess').textContent = document.getElementById('typeOfProcess')?.value || 'COMPACTING';
  document.getElementById('printTotalRoll').textContent = document.getElementById('totalRoll')?.value || '0';
  document.getElementById('printTotalReceivedWt').textContent = document.getElementById('totalReceivedWt')?.value || '0';
  document.getElementById('printReceivedWt').textContent = document.getElementById('totalReceivedWt')?.value || '0';
  document.getElementById('printDyDcWt').textContent = document.getElementById('totalDyDcWt')?.value || '0';
  const printBody = document.getElementById('printGridBody');
  const lotNo = document.getElementById('lotNo')?.value || '--';
  if (printBody) {
    printBody.innerHTML = rows.length ? rows.map(r => `<tr><td>${lotNo}</td><td>${r.fabric || ''}</td><td>${r.colour || ''}</td><td>${r.dia || ''}</td><td>${r.roll || ''}</td><td>${r.receivedWt || ''}</td></tr>`).join('') : '<tr><td colspan="6">No items</td></tr>';
  }
  window.print();
}

// --- Delivery Functions ---
function getDeliveries() {
  try {
    return JSON.parse(localStorage.getItem(DELIVERY_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDeliveries(deliveries) {
  localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(deliveries));
}

function getNextDeliveryDcNo() {
  let n = parseInt(localStorage.getItem(DELIVERY_DC_COUNTER_KEY) || '1', 10);
  localStorage.setItem(DELIVERY_DC_COUNTER_KEY, String(n + 1));
  return n;
}

function initDelivery() {
  const btnNew = document.getElementById('btnNewDelivery');
  const btnBack = document.getElementById('btnDelBackToList');
  const searchInput = document.getElementById('deliverySearch');
  const btnSave = document.getElementById('btnDelSave');
  const btnPrint = document.getElementById('btnDelPrint');
  const inwNoInput = document.getElementById('delInwNo');

  if (btnNew) btnNew.addEventListener('click', () => showDeliveryForm(true));
  if (btnBack) btnBack.addEventListener('click', showDeliveryList);
  if (searchInput) searchInput.addEventListener('input', renderDeliveryTable);
  if (btnSave) btnSave.addEventListener('click', saveDelivery);
  if (btnPrint) printBtnAction(btnPrint);
  if (inwNoInput) {
    inwNoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        fetchInwardDetailsForDelivery();
      }
    });
    inwNoInput.addEventListener('blur', fetchInwardDetailsForDelivery);
  }

  renderDeliveryTable();
}

function printBtnAction(btnPrint) {
  btnPrint.addEventListener('click', printDeliveryChallan);
}

function addDeliveryRowFromInputs() {
  const colour = document.getElementById('delItemColour')?.value || '';
  const dia = document.getElementById('delItemDia')?.value || '';
  const fabric = document.getElementById('delItemFabric')?.value || '';
  const process = document.getElementById('delItemProcess')?.value || '';
  const roll = document.getElementById('delItemRoll')?.value || '0';
  const wt = document.getElementById('delItemWt')?.value || '0';
  const pOrder = document.getElementById('delItemPOrder')?.value || '';
  const pLot = document.getElementById('delItemPLot')?.value || '';
  const inwNoInput = document.getElementById('delInwNo')?.value || '';

  if (!colour && !fabric) {
    alert('Please enter at least Colour or Fabric');
    return;
  }

  const tbody = document.getElementById('delItemGridBody');
  if (!tbody) return;

  const sno = tbody.querySelectorAll('tr').length + 1;
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>${sno}</td>
    <td>${inwNoInput}</td>
    <td>${colour}</td>
    <td>${dia}</td>
    <td>${fabric}</td>
    <td>${process}</td>
    <td><input type="number" class="grid-input del-roll" value="${roll}" min="0" step="1" onchange="updateDeliveryTotals()"></td>
    <td><input type="number" class="grid-input del-wt" value="${wt}" min="0" step="0.001" onchange="updateDeliveryTotals()"></td>
    <td>${pOrder}</td>
    <td>${pLot}</td>
    <td><button type="button" class="btn-delete-row" title="Delete">×</button></td>
  `;

  tr.querySelector('.btn-delete-row').addEventListener('click', () => {
    tr.remove();
    renumberDeliveryRows();
    updateDeliveryTotals();
  });

  tbody.appendChild(tr);

  // Clear inputs
  ['delItemColour', 'delItemDia', 'delItemFabric', 'delItemProcess', 'delItemRoll', 'delItemWt', 'delItemPOrder', 'delItemPLot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  updateDeliveryTotals();
}

function renumberDeliveryRows() {
  const tbody = document.getElementById('delItemGridBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, i) => { tr.querySelector('td:first-child').textContent = i + 1; });
}

function updateDeliveryTotals() {
  const tbody = document.getElementById('delItemGridBody');
  const totalRoll = document.getElementById('delTotalRoll');
  const totalWt = document.getElementById('delTotalDelWt');
  if (!tbody || !totalRoll || !totalWt) return;

  let r = 0, w = 0;
  tbody.querySelectorAll('tr').forEach(tr => {
    const rollInput = tr.querySelector('.del-roll');
    const wtInput = tr.querySelector('.del-wt');
    if (rollInput) r += parseFloat(rollInput.value || 0) || 0;
    if (wtInput) w += parseFloat(wtInput.value || 0) || 0;
  });

  totalRoll.value = r.toFixed(0);
  totalWt.value = w.toFixed(3);
}

function fetchInwardDetailsForDelivery() {
  const inwNoInput = document.getElementById('delInwNo');

  const inwNo = inwNoInput.value.trim();
  const entries = getEntries();
  const matchedEntry = entries.find(e => String(e.inwNo) === String(inwNo));

  if (!matchedEntry) {
    alert(`No received entry found for Inward No: ${inwNo}`);
    return;
  }

  // Pre-fill party
  const partySel = document.getElementById('delPartyName');
  const searchParty = document.getElementById('search_delPartyName');
  if (partySel) partySel.value = matchedEntry.partyValue || matchedEntry.party || '';
  if (searchParty) searchParty.value = matchedEntry.party || '';

  // Extract common details for grid from matched received entry header
  const entryProcess = matchedEntry.process || 'COMPACTING';
  const entryLotNo = matchedEntry.lotNo || '';
  const entryOrderNo = matchedEntry.partyOrder || '';
  const inwId = matchedEntry.inwNo;

  const tbody = document.getElementById('delItemGridBody');
  if (!tbody) return;

  // Append new rows based on received items
  if (matchedEntry.items && matchedEntry.items.length > 0) {
    matchedEntry.items.forEach(it => {
      const sno = tbody.querySelectorAll('tr').length + 1;
      const tr = document.createElement('tr');
      // Format: S.No, Inw No, Colour, Dia, Fabric, Process, Del Roll, Del Wt, P Order, P Lot, [x]

      tr.innerHTML = `
        <td>${sno}</td>
        <td>${inwId}</td>
        <td>${it.colour || ''}</td>
        <td>${it.dia || ''}</td>
        <td>${it.fabric || ''}</td>
        <td>${entryProcess}</td>
        <td><input type="number" class="grid-input del-roll" value="${it.roll || 0}" min="0" step="1" onchange="updateDeliveryTotals()"></td>
        <td><input type="number" class="grid-input del-wt" value="${it.receivedWt || it.dyDcWt || 0}" min="0" step="0.001" onchange="updateDeliveryTotals()"></td>
        <td>${entryOrderNo}</td>
        <td>${entryLotNo}</td>
        <td><button type="button" class="btn-delete-row" title="Delete">×</button></td>
      `;
      tr.querySelector('.btn-delete-row').addEventListener('click', () => { tr.remove(); renumberDeliveryRows(); updateDeliveryTotals(); });
      tbody.appendChild(tr);
    });
  }

  updateDeliveryTotals();
  inwNoInput.value = ''; // clear for next entry scan
}

function showDeliveryList() {
  const listView = document.getElementById('deliveryListView');
  const formView = document.getElementById('deliveryFormView');
  if (listView) listView.style.display = 'block';
  if (formView) formView.style.display = 'none';
  renderDeliveryTable();
  updateDashboardMetrics();
}

function showDeliveryForm(reset = true) {
  const listView = document.getElementById('deliveryListView');
  const formView = document.getElementById('deliveryFormView');
  if (listView) listView.style.display = 'none';
  if (formView) formView.style.display = 'block';
  if (reset) resetDeliveryForm();
}

function resetDeliveryForm() {
  const delDate = document.getElementById('delDate');
  const delDcNo = document.getElementById('delDcNo');

  // Try to use a central new DC No if required, else use auto increment
  if (delDate) delDate.valueAsDate = new Date();
  if (delDcNo) delDcNo.value = getNextDeliveryDcNo();

  const inwNoInput = document.getElementById('delInwNo');
  if (inwNoInput) inwNoInput.value = '';

  ['delPartyName', 'delSendTo', 'delVehicleNo', 'delRemarks'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' ? '' : '';
  });

  document.getElementById('search_delPartyName').value = '';

  const tbody = document.getElementById('delItemGridBody');
  if (tbody) tbody.innerHTML = '';
  updateDeliveryTotals();
}

function renderDeliveryTable() {
  const tbody = document.getElementById('deliveryTableBody');
  const search = (document.getElementById('deliverySearch')?.value || '').toLowerCase();
  if (!tbody) return;

  const deliveries = getDeliveries().filter(d => {
    if (!search) return true;
    const s = `${d.dcNo} ${d.partyName} ${d.date || ''}`.toLowerCase();
    return s.includes(search);
  });

  tbody.innerHTML = deliveries.length ? deliveries.map(d => `
    <tr data-id="${d.id}">
      <td>${d.dcNo}</td>
      <td>${d.date ? new Date(d.date).toLocaleDateString('en-GB') : '--'}</td>
      <td>${d.partyName || '--'}</td>
      <td>${d.totalRoll || '0'}</td>
      <td>${d.totalDelWt || '0'} Kg</td>
      <td><span class="badge-status delivered">Delivered</span></td>
      <td class="action-icons">
        <button type="button" title="View" onclick="viewDelivery('${d.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button type="button" title="Edit" onclick="editDelivery('${d.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button type="button" title="Print" onclick="printDeliveryById('${d.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/></svg></button>
        <button type="button" title="Delete" onclick="deleteDelivery('${d.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);padding:24px">No deliveries yet. Click "New Delivery" to add.</td></tr>';
}

function viewDelivery(id) {
  const deliveries = getDeliveries();
  const d = deliveries.find(x => x.id === id);
  if (!d) return;
  showDeliveryForm(false);
  populateDeliveryForm(d);
  document.querySelectorAll('#deliveryFormView .form-actions .btn-action').forEach(b => { if (!b.id || !['btnDelPrint', 'btnDelBackToList'].includes(b.id)) b.disabled = true; });
}

function editDelivery(id) {
  const deliveries = getDeliveries();
  const d = deliveries.find(x => x.id === id);
  if (!d) return;
  showDeliveryForm(false);
  populateDeliveryForm(d);
  document.getElementById('delDcNo').dataset.editId = id;
}

function deleteDelivery(id) {
  if (!confirm('Are you sure you want to delete this delivery entry?')) return;
  const deliveries = getDeliveries().filter(x => x.id !== id);
  saveDeliveries(deliveries);
  updateDashboardMetrics();
  renderDeliveryTable();
  // Return to delivery list view after deletion
  showDeliveryList();
}


function populateDeliveryForm(d) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  set('delDate', d.date);
  set('delDcNo', d.dcNo);
  set('delPartyName', d.partyValue || '');
  set('delSendTo', d.sendTo);
  set('delVehicleNo', d.vehicleNo);
  set('delRemarks', d.remarks);
  const searchParty = document.getElementById('search_delPartyName');
  if (searchParty) searchParty.value = d.partyName || '';

  const tbody = document.getElementById('delItemGridBody');
  if (tbody && d.items) {
    tbody.innerHTML = '';
    d.items.forEach(it => {
      const tr = document.createElement('tr');
      // format: S.No, Inw No, Colour, Dia, Fabric, Process, Del Roll, Del Wt, P Order, P Lot
      tr.innerHTML = `
        <td>${tbody.children.length + 1}</td>
        <td>${it.inwNo || ''}</td>
        <td>${it.colour || ''}</td>
        <td>${it.dia || ''}</td>
        <td>${it.fabric || ''}</td>
        <td>${it.process || ''}</td>
        <td><input type="number" class="grid-input del-roll" value="${it.roll || 0}" min="0" step="1" onchange="updateDeliveryTotals()"></td>
        <td><input type="number" class="grid-input del-wt" value="${it.delWt || 0}" min="0" step="0.001" onchange="updateDeliveryTotals()"></td>
        <td>${it.pOrder || ''}</td>
        <td>${it.pLot || ''}</td>
        <td><button type="button" class="btn-delete-row">×</button></td>
      `;
      tr.querySelector('.btn-delete-row').addEventListener('click', () => { tr.remove(); renumberDeliveryRows(); updateDeliveryTotals(); });
      tbody.appendChild(tr);
    });
  }
  updateDeliveryTotals();
}

function renumberDeliveryRows() {
  const tbody = document.getElementById('delItemGridBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, i) => { tr.querySelector('td:first-child').textContent = i + 1; });
}

function updateDeliveryTotals() {
  const tbody = document.getElementById('delItemGridBody');
  const totalRoll = document.getElementById('delTotalRoll');
  const totalDelWt = document.getElementById('delTotalDelWt');
  if (!tbody || !totalRoll) return;
  let r = 0, w = 0;
  tbody.querySelectorAll('tr').forEach(tr => {
    const rollInput = tr.querySelector('.del-roll');
    const wtInput = tr.querySelector('.del-wt');
    if (rollInput) r += parseFloat(rollInput.value || 0) || 0;
    if (wtInput) w += parseFloat(wtInput.value || 0) || 0;
  });
  totalRoll.value = r.toFixed(0);
  if (totalDelWt) totalDelWt.value = w.toFixed(3);
}

function collectDeliveryData() {
  const rows = [];
  document.querySelectorAll('#delItemGridBody tr').forEach(tr => {
    const c = tr.querySelectorAll('td');
    if (c.length >= 10) {
      rows.push({
        inwNo: c[1].textContent.trim(),
        colour: c[2].textContent.trim(),
        dia: c[3].textContent.trim(),
        fabric: c[4].textContent.trim(),
        process: c[5].textContent.trim(),
        roll: tr.querySelector('.del-roll')?.value || '0',
        delWt: tr.querySelector('.del-wt')?.value || '0',
        pOrder: c[8].textContent.trim(),
        pLot: c[9].textContent.trim()
      });
    }
  });
  return rows;
}

function saveDelivery() {
  const rows = collectDeliveryData();
  if (!rows.length) {
    alert('Please add at least one item row before saving.');
    return;
  }

  const partyInput = document.getElementById('search_delPartyName');
  const partyText = partyInput ? partyInput.value : '--';
  const totalRoll = document.getElementById('delTotalRoll')?.value || '0';
  const totalDelWt = document.getElementById('delTotalDelWt')?.value || '0';

  const delivery = {
    id: document.getElementById('delDcNo').dataset.editId || 'del_' + Date.now(),
    dcNo: document.getElementById('delDcNo').value,
    date: document.getElementById('delDate').value,
    partyValue: document.getElementById('delPartyName').value,
    partyName: document.getElementById('search_delPartyName') ? document.getElementById('search_delPartyName').value : '--',
    sendTo: document.getElementById('delSendTo')?.value,
    vehicleNo: document.getElementById('delVehicleNo')?.value,
    remarks: document.getElementById('delRemarks')?.value,
    items: rows,
    totalRoll,
    totalDelWt
  };

  const deliveries = getDeliveries();
  const editId = document.getElementById('delDcNo').dataset.editId;
  let updated;
  if (editId) {
    updated = deliveries.map(d => d.id === editId ? delivery : d);
  } else {
    updated = [...deliveries, delivery];
  }

  saveDeliveries(updated);
  updateDashboardMetrics();
  showDeliveryList();
}

function printDeliveryChallan() {
  preparePrint('deliveryChallanPrint');
  const rows = collectDeliveryData();
  if (!rows.length) { alert('Add at least one item before printing.'); return; }

  applyCompanySettingsToPrint('Del');

  const partySel = document.getElementById('search_delPartyName');
  document.getElementById('printDelPartyName').textContent = partySel ? partySel.value : '--';
  document.getElementById('printDelDate').textContent = document.getElementById('delDate')?.value ? new Date(document.getElementById('delDate').value).toLocaleDateString('en-GB') : '--';
  document.getElementById('printDelDcNo').textContent = document.getElementById('delDcNo')?.value || '--';
  document.getElementById('printDelVehicleNo').textContent = document.getElementById('delVehicleNo')?.value || '--';
  document.getElementById('printDelTotalRoll').textContent = document.getElementById('delTotalRoll')?.value || '0';
  document.getElementById('printDelTotalWt').textContent = parseFloat(document.getElementById('delTotalDelWt')?.value || '0').toFixed(3);

  // Use the first item's details for metadata exactly like printDeliveryById
  const firstItem = rows[0] || {};
  document.getElementById('printDelOurInwNo').textContent = firstItem.inwNo || '--';
  document.getElementById('printDelProcess').textContent = firstItem.process || 'COMPACTING';
  document.getElementById('printDelOrderNo').textContent = firstItem.pOrder || '--';
  document.getElementById('printDelLotNo').textContent = firstItem.pLot || '--';

  // Try to find the matching received entry for dyed weight and original received weight
  const receivedEntries = getEntries();
  const matchedEntry = receivedEntries.find(e => String(e.inwNo) === String(firstItem.inwNo));
  if (matchedEntry) {
    document.getElementById('printDelRecdDcNo').textContent = matchedEntry.dyeingDcNo || '--';
    document.getElementById('printDelRecdDcNo2').textContent = matchedEntry.dyeingDcNo || '--';
    document.getElementById('printDelPartyDcNo').textContent = matchedEntry.partyDcNo || '--';
    document.getElementById('printDelDyeingName').textContent = matchedEntry.dyeing || '--';
    document.getElementById('printDelReceivedWt').textContent = parseFloat(matchedEntry.ourWt || 0).toFixed(3);
  } else {
    document.getElementById('printDelRecdDcNo').textContent = '--';
    document.getElementById('printDelRecdDcNo2').textContent = '--';
    document.getElementById('printDelPartyDcNo').textContent = '--';
    document.getElementById('printDelDyeingName').textContent = '--';
    document.getElementById('printDelReceivedWt').textContent = '0.000';
  }

  const printBody = document.getElementById('printDelGridBody');
  if (printBody) {
    printBody.innerHTML = rows.map((r, i) => `
      <tr>
        <td>${r.pLot || '--'}</td>
        <td style="text-align: left;">${r.fabric || '--'}</td>
        <td>998821</td>
        <td>${r.colour || '--'}</td>
        <td>${r.dia || '--'}</td>
        <td>${r.roll || '0'}</td>
        <td>${parseFloat(r.delWt || '0').toFixed(3)}</td>
      </tr>
    `).join('');
  }
  setTimeout(() => window.print(), 100);
}

function printDeliveryById(id) {
  preparePrint('deliveryChallanPrint');
  const deliveries = getDeliveries();
  const searchDelivery = deliveries.find(x => x.id === id);
  if (!searchDelivery) return;

  applyCompanySettingsToPrint('Del');

  document.getElementById('printDelDcNo').textContent = searchDelivery.dcNo || '--';
  document.getElementById('printDelDate').textContent = searchDelivery.date ? new Date(searchDelivery.date).toLocaleDateString('en-GB') : '--';
  document.getElementById('printDelPartyName').textContent = searchDelivery.partyName || '--';
  document.getElementById('printDelVehicleNo').textContent = searchDelivery.vehicleNo || '--';
  document.getElementById('printDelTotalRoll').textContent = searchDelivery.totalRoll || '0';
  document.getElementById('printDelTotalWt').textContent = parseFloat(searchDelivery.totalDelWt || '0').toFixed(3);

  // Grab the first item's details to populate header meta
  const firstItem = searchDelivery.items && searchDelivery.items[0] ? searchDelivery.items[0] : {};
  document.getElementById('printDelOurInwNo').textContent = firstItem.inwNo || '--';
  document.getElementById('printDelProcess').textContent = firstItem.process || 'COMPACTING';
  document.getElementById('printDelOrderNo').textContent = firstItem.pOrder || '--';
  document.getElementById('printDelLotNo').textContent = firstItem.pLot || '--';

  // Try to find the matching received entry for dyed weight and original received weight
  const receivedEntries = getEntries();
  const matchedEntry = receivedEntries.find(e => String(e.inwNo) === String(firstItem.inwNo));
  if (matchedEntry) {
    document.getElementById('printDelRecdDcNo').textContent = matchedEntry.dyeingDcNo || '--';
    document.getElementById('printDelRecdDcNo2').textContent = matchedEntry.dyeingDcNo || '--';
    document.getElementById('printDelPartyDcNo').textContent = matchedEntry.partyDcNo || '--';
    document.getElementById('printDelDyeingName').textContent = matchedEntry.dyeing || '--';
    document.getElementById('printDelReceivedWt').textContent = parseFloat(matchedEntry.ourWt || 0).toFixed(3);
  } else {
    document.getElementById('printDelRecdDcNo').textContent = '--';
    document.getElementById('printDelRecdDcNo2').textContent = '--';
    document.getElementById('printDelPartyDcNo').textContent = '--';
    document.getElementById('printDelDyeingName').textContent = '--';
    document.getElementById('printDelReceivedWt').textContent = '0.000';
  }

  const printBody = document.getElementById('printDelGridBody');
  if (printBody) {
    printBody.innerHTML = searchDelivery.items.length ? searchDelivery.items.map((r, i) => `
      <tr>
        <td>${r.pLot || '--'}</td>
        <td style="text-align: left;">${r.fabric || '--'}</td>
        <td>998821</td>
        <td>${r.colour || '--'}</td>
        <td>${r.dia || '--'}</td>
        <td>${r.roll || '0'}</td>
        <td>${parseFloat(r.delWt || '0').toFixed(3)}</td>
      </tr>
    `).join('') : '<tr><td colspan="7" style="padding:4px; border-bottom:1px solid #000; text-align:center;">No items</td></tr>';
  }
  setTimeout(() => window.print(), 100);
}

// --- Invoice Functions ---
function getInvoices() {
  try {
    return JSON.parse(localStorage.getItem(INVOICE_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveInvoices(invoices) {
  localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
}

function getNextInvoiceNo() {
  let n = parseInt(localStorage.getItem(INVOICE_COUNTER_KEY) || '501', 10);
  localStorage.setItem(INVOICE_COUNTER_KEY, String(n + 1));
  return n;
}

function initInvoice() {
  const btnNew = document.getElementById('btnNewInvoice');
  const btnBack = document.getElementById('btnInvBackToList');
  const searchInput = document.getElementById('invoiceSearch');
  const btnSave = document.getElementById('btnInvSave');
  const btnPrint = document.getElementById('btnInvPrint');
  const btnAddRow = document.getElementById('btnInvAddRow');
  const gstPercent = document.getElementById('invGstPercent');

  if (btnNew) btnNew.addEventListener('click', () => showInvoiceForm(true));
  if (btnBack) btnBack.addEventListener('click', showInvoiceList);
  if (searchInput) searchInput.addEventListener('input', renderInvoiceTable);
  if (btnSave) btnSave.addEventListener('click', saveInvoice);
  if (btnPrint) btnPrint.addEventListener('click', printInvoice);
  if (btnAddRow) btnAddRow.addEventListener('click', addInvoiceRow);
  if (gstPercent) gstPercent.addEventListener('input', updateInvoiceTotals);

  renderInvoiceTable();
}

function showInvoiceList() {
  const listView = document.getElementById('invoiceListView');
  const formView = document.getElementById('invoiceFormView');
  if (listView) listView.style.display = 'block';
  if (formView) formView.style.display = 'none';
  renderInvoiceTable();
}

function showInvoiceForm(reset = true) {
  const listView = document.getElementById('invoiceListView');
  const formView = document.getElementById('invoiceFormView');
  if (listView) listView.style.display = 'none';
  if (formView) formView.style.display = 'block';
  if (reset) resetInvoiceForm();
}

function resetInvoiceForm() {
  const invDate = document.getElementById('invDate');
  const invNo = document.getElementById('invNo');
  if (invDate) invDate.valueAsDate = new Date();
  if (invNo) invNo.value = getNextInvoiceNo();
  ['invPartyName', 'invDcNo', 'invOrderNo', 'invNarration'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' ? '' : '';
  });
  const tbody = document.getElementById('invItemGridBody');
  if (tbody) tbody.innerHTML = '';
  clearInvoiceInputs();
  updateInvoiceTotals();
}

function renderInvoiceTable() {
  const tbody = document.getElementById('invoiceTableBody');
  const search = (document.getElementById('invoiceSearch')?.value || '').toLowerCase();
  if (!tbody) return;

  const invoices = getInvoices().filter(i => {
    if (!search) return true;
    const s = `${i.invNo} ${i.partyName} ${i.dcNo || ''}`.toLowerCase();
    return s.includes(search);
  });

  tbody.innerHTML = invoices.length ? invoices.map(i => `
    <tr data-id="${i.id}">
      <td>${i.invNo}</td>
      <td>${i.date ? new Date(i.date).toLocaleDateString('en-GB') : '--'}</td>
      <td>${i.partyName || '--'}</td>
      <td>${i.dcNo || '--'}</td>
      <td>₹${i.totalAmount || '0.00'}</td>
      <td><span class="badge-status delivered">Paid</span></td>
      <td class="action-icons">
        <button type="button" title="View" onclick="viewInvoice('${i.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button type="button" title="Edit" onclick="editInvoice('${i.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button type="button" title="Print" onclick="printInvoiceById('${i.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/></svg></button>
        <button type="button" title="Delete" onclick="deleteInvoice('${i.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);padding:24px">No invoices yet. Click "New Invoice" to add.</td></tr>';
}

function viewInvoice(id) {
  const invoices = getInvoices();
  const i = invoices.find(x => x.id === id);
  if (!i) return;
  showInvoiceForm(false);
  populateInvoiceForm(i);
  document.querySelectorAll('#invoiceFormView .form-actions .btn-action').forEach(b => { if (!b.id || !['btnInvPrint', 'btnInvBackToList'].includes(b.id)) b.disabled = true; });
}

function editInvoice(id) {
  const invoices = getInvoices();
  const i = invoices.find(x => x.id === id);
  if (!i) return;
  showInvoiceForm(false);
  populateInvoiceForm(i);
  document.getElementById('invNo').dataset.editId = id;
}

function deleteInvoice(id) {
  if (!confirm('Are you sure you want to delete this invoice?')) return;
  const invoices = getInvoices().filter(x => x.id !== id);
  saveInvoices(invoices);
  renderInvoiceTable();
}

function populateInvoiceForm(i) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  set('invDate', i.date);
  set('invNo', i.invNo);
  set('invPartyName', i.partyValue || '');
  set('search_invPartyName', i.partyName || '');
  set('invDcNo', i.dcNo);
  set('invOrderNo', i.orderNo);
  set('invNarration', i.narration);
  const tbody = document.getElementById('invItemGridBody');
  if (tbody && i.items) {
    tbody.innerHTML = '';
    i.items.forEach(it => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${tbody.children.length + 1}</td><td>${it.desc || ''}</td><td>${it.qty || ''}</td><td>${it.rate || ''}</td><td>${it.amount || ''}</td><td><button type="button" class="btn-delete-row">×</button></td>`;
      tr.querySelector('.btn-delete-row').addEventListener('click', () => { tr.remove(); renumberInvoiceRows(); updateInvoiceTotals(); });
      tbody.appendChild(tr);
    });
  }
  updateInvoiceTotals();
}

function addInvoiceRow() {
  const desc = document.getElementById('invItemDesc')?.value?.trim() || '';
  const colour = document.getElementById('invItemColour')?.value?.trim() || '';
  const dia = document.getElementById('invItemDia')?.value || '';
  const qty = document.getElementById('invItemQty')?.value || '0';
  const rate = document.getElementById('invItemRate')?.value || '0';

  const tbody = document.getElementById('invItemGridBody');
  if (!tbody) return;

  const modifyingRow = tbody.querySelector('tr.modifying');
  if (modifyingRow) {
    modifyingRow.cells[1].textContent = desc;
    modifyingRow.cells[2].textContent = colour;
    modifyingRow.cells[3].textContent = dia;
    modifyingRow.cells[4].textContent = qty;
    modifyingRow.cells[5].textContent = rate;
    modifyingRow.cells[6].textContent = (parseFloat(qty) * parseFloat(rate)).toFixed(2);
    modifyingRow.classList.remove('modifying');
    clearInvoiceInputs();
    updateInvoiceTotals();
    return;
  }

  if (!desc && !qty && !rate) return;

  const sno = tbody.querySelectorAll('tr').length + 1;
  const amount = (parseFloat(qty) * parseFloat(rate)).toFixed(2);
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${sno}</td><td>${desc}</td><td>${colour}</td><td>${dia}</td><td>${qty}</td><td>${rate}</td><td>${amount}</td><td><button type="button" class="btn-delete-row" title="Delete">×</button></td>`;
  tr.querySelector('.btn-delete-row').addEventListener('click', () => { tr.remove(); renumberInvoiceRows(); updateInvoiceTotals(); });
  tr.addEventListener('dblclick', () => {
    tbody.querySelectorAll('tr').forEach(r => r.classList.remove('modifying'));
    document.getElementById('invItemDesc').value = tr.cells[1].textContent;
    document.getElementById('invItemColour').value = tr.cells[2].textContent;
    document.getElementById('invItemDia').value = tr.cells[3].textContent;
    document.getElementById('invItemQty').value = tr.cells[4].textContent;
    document.getElementById('invItemRate').value = tr.cells[5].textContent;
    tr.classList.add('modifying');
  });
  tbody.appendChild(tr);
  updateInvoiceTotals();
  clearInvoiceInputs();
}

function clearInvoiceInputs() {
  ['invItemDesc', 'invItemColour', 'invItemDia', 'invItemQty', 'invItemRate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function renumberInvoiceRows() {
  const tbody = document.getElementById('invItemGridBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, i) => { tr.querySelector('td:first-child').textContent = i + 1; });
}

function updateInvoiceTotals() {
  const tbody = document.getElementById('invItemGridBody');
  const subTotal = document.getElementById('invSubTotal');
  const gstPercent = document.getElementById('invGstPercent');
  const gstAmount = document.getElementById('invGstAmount');
  const totalAmount = document.getElementById('invTotalAmount');
  if (!tbody || !subTotal) return;
  let sub = 0;
  tbody.querySelectorAll('tr').forEach(tr => {
    const c = tr.querySelectorAll('td');
    if (c.length >= 7) sub += parseFloat(c[6]?.textContent || 0) || 0;
  });
  subTotal.value = sub.toFixed(2);
  const gst = parseFloat(gstPercent?.value || 0);
  const gstAmt = (sub * gst / 100).toFixed(2);
  if (gstAmount) gstAmount.value = gstAmt;
  if (totalAmount) totalAmount.value = (sub + parseFloat(gstAmt)).toFixed(2);
}

function collectInvoiceData() {
  const rows = [];
  document.querySelectorAll('#invItemGridBody tr').forEach(tr => {
    const c = tr.querySelectorAll('td');
    if (c.length >= 7) {
      rows.push({
        desc: c[1].textContent,
        colour: c[2].textContent,
        dia: c[3].textContent,
        qty: c[4].textContent,
        rate: c[5].textContent,
        amount: c[6].textContent
      });
    }
  });
  return rows;
}

function saveInvoice() {
  const rows = collectInvoiceData();
  if (!rows.length) { alert('Add at least one item.'); return; }

  const partyInput = document.getElementById('search_invPartyName');
  const partySel = document.getElementById('invPartyName');
  const partyText = partyInput ? partyInput.value : '';
  const subTotal = document.getElementById('invSubTotal')?.value || '0';
  const gstAmount = document.getElementById('invGstAmount')?.value || '0';
  const totalAmount = document.getElementById('invTotalAmount')?.value || '0';

  const invoice = {
    id: 'inv_' + Date.now(),
    invNo: document.getElementById('invNo').value,
    date: document.getElementById('invDate').value,
    partyName: partyText || '--',
    partyValue: partySel?.value,
    dcNo: document.getElementById('invDcNo')?.value,
    orderNo: document.getElementById('invOrderNo')?.value,
    narration: document.getElementById('invNarration')?.value,
    items: rows,
    subTotal,
    gstAmount,
    totalAmount
  };

  const invoices = getInvoices();
  invoices.push(invoice);
  saveInvoices(invoices);
  showInvoiceList();
}

function printInvoice() {
  preparePrint('invoicePrint');
  const rows = collectInvoiceData();
  if (!rows.length) { alert('Add at least one item before printing.'); return; }

  applyCompanySettingsToPrint('Inv');

  const partyInput = document.getElementById('search_invPartyName');
  document.getElementById('printInvPartyName').textContent = partyInput && partyInput.value ? partyInput.value : '--';
  document.getElementById('printInvDate').textContent = document.getElementById('invDate')?.value ? new Date(document.getElementById('invDate').value).toLocaleDateString('en-GB') : '--';
  document.getElementById('printInvNo').textContent = document.getElementById('invNo')?.value || '--';
  document.getElementById('printInvDcNo').textContent = document.getElementById('invDcNo')?.value || '--';
  document.getElementById('printInvSubTotal').textContent = document.getElementById('invSubTotal')?.value || '0.00';
  document.getElementById('printInvGstAmount').textContent = document.getElementById('invGstAmount')?.value || '0.00';
  document.getElementById('printInvTotalAmount').textContent = document.getElementById('invTotalAmount')?.value || '0.00';

  const printBody = document.getElementById('printInvGridBody');
  if (printBody) {
    printBody.innerHTML = rows.length ? rows.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td style="text-align: left;">${r.desc || ''}</td>
        <td>${r.colour || ''}</td>
        <td>${r.dia || ''}</td>
        <td>${r.qty || ''}</td>
        <td>${r.rate || ''}</td>
        <td>${r.amount || ''}</td>
      </tr>
    `).join('') : '<tr><td colspan="7" style="text-align:center;">No items</td></tr>';
  }
  setTimeout(() => window.print(), 100);
}

function printInvoiceById(id) {
  preparePrint('invoicePrint');
  const invoices = getInvoices();
  const i = invoices.find(x => x.id === id);
  if (!i) return;

  applyCompanySettingsToPrint('Inv');

  document.getElementById('printInvPartyName').textContent = i.partyName || '--';
  document.getElementById('printInvDate').textContent = i.date ? new Date(i.date).toLocaleDateString('en-GB') : '--';
  document.getElementById('printInvNo').textContent = i.invNo || '--';
  document.getElementById('printInvDcNo').textContent = i.dcNo || '--';
  document.getElementById('printInvSubTotal').textContent = i.subTotal || '0.00';
  document.getElementById('printInvGstAmount').textContent = i.gstAmount || '0.00';
  document.getElementById('printInvTotalAmount').textContent = i.totalAmount || '0.00';

  const printBody = document.getElementById('printInvGridBody');
  if (printBody && i.items) {
    printBody.innerHTML = i.items.map((it, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td style="text-align: left;">${it.desc || ''}</td>
        <td>${it.colour || ''}</td>
        <td>${it.dia || ''}</td>
        <td>${it.qty || ''}</td>
        <td>${it.rate || ''}</td>
        <td>${it.amount || ''}</td>
      </tr>
    `).join('');
  }
  setTimeout(() => window.print(), 100);
}

// --- Party Master Functions ---
const PARTY_STORAGE_KEY = 'vss_parties';

function getParties() {
  try {
    return JSON.parse(localStorage.getItem(PARTY_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveParties(parties) {
  localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(parties));
}

function initPartyMaster() {
  const btnNew = document.getElementById('btnNewParty');
  const btnCancel = document.getElementById('btnPartyCancel');
  const btnSave = document.getElementById('btnPartySave');
  const searchInput = document.getElementById('partySearch');

  if (btnNew) btnNew.addEventListener('click', () => showPartyForm(true));
  if (btnCancel) btnCancel.addEventListener('click', showPartyList);
  if (btnSave) btnSave.addEventListener('click', saveParty);
  if (searchInput) searchInput.addEventListener('input', renderPartyTable);

  renderPartyTable();
}

function showPartyList() {
  const listView = document.getElementById('partyListView');
  const formView = document.getElementById('partyFormView');
  if (listView) listView.style.display = 'block';
  if (formView) formView.style.display = 'none';
  renderPartyTable();
}

function showPartyForm(reset = true) {
  const listView = document.getElementById('partyListView');
  const formView = document.getElementById('partyFormView');
  if (listView) listView.style.display = 'none';
  if (formView) formView.style.display = 'block';

  if (reset) {
    document.getElementById('partyEditId').value = '';
    document.getElementById('partyFormName').value = '';
    document.getElementById('partyFormPhone').value = '';
    document.getElementById('partyFormGstin').value = '';
    document.getElementById('partyFormAddress').value = '';
    document.getElementById('partyFormTitle').textContent = 'ADD NEW PARTY';
  }
}

function renderPartyTable() {
  const tbody = document.getElementById('partyTableBody');
  const search = (document.getElementById('partySearch')?.value || '').toLowerCase();
  if (!tbody) return;

  const parties = getParties().filter(p => {
    if (!search) return true;
    const s = `${p.name} ${p.address} ${p.phone}`.toLowerCase();
    return s.includes(search);
  });

  tbody.innerHTML = parties.length ? parties.map(p => `
    <tr>
      <td style="font-weight: 500;">${p.name}</td>
      <td style="color: var(--text-secondary);">${p.address || '--'}</td>
      <td style="color: var(--text-secondary);">${p.phone || '--'}</td>
      <td class="action-icons" style="justify-content: flex-end;">
        <button type="button" title="Edit" onclick="editParty('${p.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button type="button" title="Delete" onclick="deleteParty('${p.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ef4444;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:24px">No parties found. Click "Add Party" to create one.</td></tr>';
}

function saveParty() {
  const name = document.getElementById('partyFormName').value.trim();
  const phone = document.getElementById('partyFormPhone').value.trim();
  const gstin = document.getElementById('partyFormGstin').value.trim();
  const address = document.getElementById('partyFormAddress').value.trim();
  const editId = document.getElementById('partyEditId').value;

  if (!name) {
    alert('Party Name is required.');
    return;
  }

  const party = {
    id: editId || 'pty_' + Date.now(),
    name,
    phone,
    gstin,
    address
  };

  const parties = getParties();
  let updated;
  if (editId) {
    updated = parties.map(p => p.id === editId ? party : p);
  } else {
    updated = [...parties, party];
  }

  saveParties(updated);
  showPartyList();
  updatePartyDropdowns();
}

function editParty(id) {
  const parties = getParties();
  const p = parties.find(x => x.id === id);
  if (!p) return;

  showPartyForm(false);
  document.getElementById('partyEditId').value = p.id;
  document.getElementById('partyFormName').value = p.name;
  document.getElementById('partyFormPhone').value = p.phone || '';
  document.getElementById('partyFormGstin').value = p.gstin || '';
  document.getElementById('partyFormAddress').value = p.address || '';
  document.getElementById('partyFormTitle').textContent = 'EDIT PARTY';
}

function deleteParty(id) {
  if (!confirm('Are you sure you want to delete this party?')) return;
  const parties = getParties().filter(x => x.id !== id);
  saveParties(parties);
  renderPartyTable();
  updatePartyDropdowns();
}

// --- Custom Searchable Dropdown Helper ---
function setupCustomDropdown(wrapperId, searchId, hiddenId, optionsContainerId, items) {
  const wrapper = document.getElementById(wrapperId);
  const searchEl = document.getElementById(searchId);
  const hiddenEl = document.getElementById(hiddenId);
  const optionsEl = document.getElementById(optionsContainerId);
  if (!wrapper || !searchEl || !hiddenEl || !optionsEl) return;
  if (wrapper._dropdownReady) { wrapper._refreshDropdown(items || []); return; }

  const selectEl = wrapper.querySelector('.custom-select');
  let allItems = items || [];

  function openDrop() { if (selectEl) selectEl.classList.add('open'); }
  function closeDrop() { if (selectEl) selectEl.classList.remove('open'); }

  function renderOptions(filter) {
    const q = (filter || '').toLowerCase();
    const filtered = allItems.filter(i => i.label.toLowerCase().includes(q));
    optionsEl.innerHTML = filtered.length
      ? filtered.map(i => `<div class="custom-option" data-value="${i.value}" data-label="${i.label}">${i.label}</div>`).join('')
      : '<div class="custom-option" style="color:var(--text-secondary);cursor:default;">No results</div>';
    optionsEl.querySelectorAll('.custom-option[data-value]').forEach(opt => {
      opt.addEventListener('mousedown', e => {
        e.preventDefault();
        searchEl.value = opt.dataset.label;
        hiddenEl.value = opt.dataset.value;
        closeDrop();
      });
    });
  }

  searchEl.addEventListener('focus', () => { renderOptions(searchEl.value); openDrop(); });
  searchEl.addEventListener('input', () => { renderOptions(searchEl.value); openDrop(); hiddenEl.value = ''; });
  searchEl.addEventListener('blur', () => { setTimeout(closeDrop, 200); });

  wrapper._dropdownReady = true;
  wrapper._dropdownItems = allItems;
  wrapper._refreshDropdown = function (newItems) { allItems = newItems; wrapper._dropdownItems = newItems; };
}

function updatePartyDropdowns() {
  const parties = getParties();
  const items = parties.map(p => ({ value: p.id, label: p.name }));

  // Setup or refresh all party dropdowns
  ['partyName', 'delPartyName', 'invPartyName'].forEach(hiddenId => {
    const wrapperId = 'wrapper_' + hiddenId;
    const searchId = 'search_' + hiddenId;
    const optionsId = 'options_' + hiddenId;
    const wrapper = document.getElementById(wrapperId);
    if (wrapper && wrapper._refreshDropdown) {
      wrapper._refreshDropdown(items);
    } else {
      setupCustomDropdown(wrapperId, searchId, hiddenId, optionsId, items);
    }
  });
}

// --- Dyeing Master Functions ---
const DYEING_STORAGE_KEY = 'vss_dyeing_units';

function getDyeingUnits() {
  try {
    return JSON.parse(localStorage.getItem(DYEING_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDyeingUnits(units) {
  localStorage.setItem(DYEING_STORAGE_KEY, JSON.stringify(units));
}

function initDyeingMaster() {
  const btnNew = document.getElementById('btnNewDyeing');
  const btnCancel = document.getElementById('btnDyeingCancel');
  const btnSave = document.getElementById('btnDyeingSave');
  const searchInput = document.getElementById('dyeingSearch');

  if (btnNew) btnNew.addEventListener('click', () => showDyeingForm(true));
  if (btnCancel) btnCancel.addEventListener('click', showDyeingList);
  if (btnSave) btnSave.addEventListener('click', saveDyeingUnit);
  if (searchInput) searchInput.addEventListener('input', renderDyeingTable);

  renderDyeingTable();
  updateDyeingDropdowns();
}

function showDyeingList() {
  const listView = document.getElementById('dyeingListView');
  const formView = document.getElementById('dyeingFormView');
  if (listView) listView.style.display = 'block';
  if (formView) formView.style.display = 'none';
  renderDyeingTable();
}

function showDyeingForm(reset = true) {
  const listView = document.getElementById('dyeingListView');
  const formView = document.getElementById('dyeingFormView');
  if (listView) listView.style.display = 'none';
  if (formView) formView.style.display = 'block';

  if (reset) {
    document.getElementById('dyeingEditId').value = '';
    document.getElementById('dyeingFormName').value = '';
    document.getElementById('dyeingFormPhone').value = '';
    document.getElementById('dyeingFormAddress').value = '';
    document.getElementById('dyeingFormTitle').textContent = 'ADD NEW DYEING UNIT';
  }
}

function renderDyeingTable() {
  const tbody = document.getElementById('dyeingTableBody');
  const search = (document.getElementById('dyeingSearch')?.value || '').toLowerCase();
  if (!tbody) return;

  const units = getDyeingUnits().filter(p => {
    if (!search) return true;
    const s = `${p.name} ${p.address} ${p.phone}`.toLowerCase();
    return s.includes(search);
  });

  tbody.innerHTML = units.length ? units.map(p => `
    <tr>
      <td style="font-weight: 500;">${p.name}</td>
      <td style="color: var(--text-secondary);">${p.address || '--'}</td>
      <td style="color: var(--text-secondary);">${p.phone || '--'}</td>
      <td class="action-icons" style="justify-content: flex-end;">
        <button type="button" title="Edit" onclick="editDyeingUnit('${p.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button type="button" title="Delete" onclick="deleteDyeingUnit('${p.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ef4444;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:24px">No dyeing units found. Click "Add Dyeing" to create one.</td></tr>';
}

function saveDyeingUnit() {
  const name = document.getElementById('dyeingFormName').value.trim();
  const phone = document.getElementById('dyeingFormPhone').value.trim();
  const address = document.getElementById('dyeingFormAddress').value.trim();
  const editId = document.getElementById('dyeingEditId').value;

  if (!name) {
    alert('Unit Name is required.');
    return;
  }

  const unit = {
    id: editId || 'dy_' + Date.now(),
    name,
    phone,
    address
  };

  const units = getDyeingUnits();
  let updated;
  if (editId) {
    updated = units.map(p => p.id === editId ? unit : p);
  } else {
    updated = [...units, unit];
  }

  saveDyeingUnits(updated);
  showDyeingList();
  updateDyeingDropdowns();
}

function editDyeingUnit(id) {
  const units = getDyeingUnits();
  const p = units.find(x => x.id === id);
  if (!p) return;

  showDyeingForm(false);
  document.getElementById('dyeingEditId').value = p.id;
  document.getElementById('dyeingFormName').value = p.name;
  document.getElementById('dyeingFormPhone').value = p.phone || '';
  document.getElementById('dyeingFormAddress').value = p.address || '';
  document.getElementById('dyeingFormTitle').textContent = 'EDIT DYEING UNIT';
}

function deleteDyeingUnit(id) {
  if (!confirm('Are you sure you want to delete this dyeing unit?')) return;
  const units = getDyeingUnits().filter(x => x.id !== id);
  saveDyeingUnits(units);
  renderDyeingTable();
  updateDyeingDropdowns();
}

function updateDyeingDropdowns() {
  const units = getDyeingUnits();
  const items = units.map(p => ({ value: p.id, label: p.name }));

  const wrapperId = 'wrapper_dyeingName';
  const wrapper = document.getElementById(wrapperId);
  if (wrapper && wrapper._refreshDropdown) {
    wrapper._refreshDropdown(items);
  } else {
    setupCustomDropdown(wrapperId, 'search_dyeingName', 'dyeingName', 'options_dyeingName', items);
  }
}

// --- Company Settings Functions ---
const SETTINGS_STORAGE_KEY = 'vss_company_settings';

const defaultSettings = {
  name: 'VSS DC MANAGEMENT',
  tagline: 'Finishing & Processing Unit',
  address: 'Tirupur, Tamil Nadu',
  phone: '9876543210',
  email: 'info@vssdc.com',
  gst: '33XXXXX1234X1Z5'
};

function getCompanySettings() {
  try {
    const data = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
    return data || defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function initCompanySettings() {
  const s = getCompanySettings();
  const els = {
    name: document.getElementById('settingCompanyName'),
    tagline: document.getElementById('settingTagline'),
    address: document.getElementById('settingAddress'),
    phone: document.getElementById('settingPhone'),
    email: document.getElementById('settingEmail'),
    gst: document.getElementById('settingGst')
  };

  if (els.name) els.name.value = s.name || '';
  if (els.tagline) els.tagline.value = s.tagline || '';
  if (els.address) els.address.value = s.address || '';
  if (els.phone) els.phone.value = s.phone || '';
  if (els.email) els.email.value = s.email || '';
  if (els.gst) els.gst.value = s.gst || '';

  const btnSave = document.getElementById('btnSettingSave');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const newSettings = {
        name: els.name.value.trim(),
        tagline: els.tagline.value.trim(),
        address: els.address.value.trim(),
        phone: els.phone.value.trim(),
        email: els.email.value.trim(),
        gst: els.gst.value.trim()
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      alert('Company Settings Saved Successfully!');
    });
  }
}

function applyCompanySettingsToPrint(type = '') {
  // type is '' for Received, 'Del' for Delivery, 'Inv' for Invoice
  const s = getCompanySettings();
  const nameEl = document.getElementById(`print${type}Company`);
  const addrEl = document.getElementById(`print${type}Address`);

  if (nameEl) nameEl.textContent = s.name.toUpperCase();
  if (addrEl) {
    const parts = [s.tagline, s.address, `Ph: ${s.phone}`, s.email].filter(Boolean);
    addrEl.innerHTML = parts.join('<br>') + `<br>No: ${s.gst}`;
  }
}

// --- Global Enter Key Navigation ---
function setupEnterKeyNavigation() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
        // Prevent default form submission or page reload on enter
        e.preventDefault();

        // Get all focusable input elements in the current active form view
        const activeView = target.closest('.inward-form') || target.closest('.inward-form-view');
        if (!activeView) return;

        // Select all inputs, selects, and textareas that are not hidden, disabled, or readonly
        const focusables = Array.from(activeView.querySelectorAll('input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button.btn-add-row, button.btn-action'));

        const index = focusables.indexOf(target);
        if (index > -1 && index < focusables.length - 1) {
          focusables[index + 1].focus();

          // if it's an input text type, we can optionally select the text for easy overwriting
          if (focusables[index + 1].tagName === 'INPUT') {
            focusables[index + 1].select();
          }
        }
      }
    }
  });
}

// --- Custom Type to Search Dropdown Config ---
function setupCustomDropdown(wrapperId, searchId, hiddenId, optionsContainerId, dataList) {
  const wrapper = document.getElementById(wrapperId);
  const searchInput = document.getElementById(searchId);
  const hiddenInput = document.getElementById(hiddenId);
  const optionsContainer = document.getElementById(optionsContainerId);

  if (!wrapper || !searchInput || !hiddenInput || !optionsContainer) return;

  // Render options based on filter
  function renderOptions(filterText = '') {
    const term = filterText.toLowerCase();
    const filtered = dataList.filter(item => item.label.toLowerCase().includes(term));

    if (filtered.length === 0) {
      optionsContainer.innerHTML = '<span class="custom-option" style="color:var(--text-secondary); cursor:default;">No matches found</span>';
      return;
    }

    optionsContainer.innerHTML = filtered.map(item =>
      `<span class="custom-option" data-value="${item.value}">${item.label}</span>`
    ).join('');

    // Attach click events
    Array.from(optionsContainer.querySelectorAll('.custom-option')).forEach(opt => {
      if (!opt.dataset.value) return; // skip "No matches"
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        searchInput.value = opt.textContent;
        hiddenInput.value = opt.dataset.value;
        wrapper.querySelector('.custom-select').classList.remove('open');
      });
    });
  }

  // Handle Input typing to filter
  searchInput.addEventListener('input', () => {
    // If user clears the input, clear the hidden value
    if (searchInput.value.trim() === '') {
      hiddenInput.value = '';
    } else {
      // Unset exact match if they start typing and it breaks match
      const exactMatch = dataList.find(i => i.label.toLowerCase() === searchInput.value.toLowerCase());
      hiddenInput.value = exactMatch ? exactMatch.value : '';
    }

    wrapper.querySelector('.custom-select').classList.add('open');
    renderOptions(searchInput.value);
  });

  // Open dropdown on click/focus
  searchInput.addEventListener('click', (e) => {
    e.stopPropagation();
    // close other open dropdowns
    document.querySelectorAll('.custom-select.open').forEach(el => {
      if (el !== wrapper.querySelector('.custom-select')) {
        el.classList.remove('open');
      }
    });
    const selectEl = wrapper.querySelector('.custom-select');
    if (!selectEl.classList.contains('open')) {
      selectEl.classList.add('open');
      renderOptions(searchInput.value);
    }
  });

  // Optional Focus behaviour: open on focus but don't toggle
  searchInput.addEventListener('focus', (e) => {
    wrapper.querySelector('.custom-select').classList.add('open');
    renderOptions(searchInput.value);
  });

  // Global click to close
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.querySelector('.custom-select').classList.remove('open');
    }
  });

  // Set initial value text if hidden input already has a value
  if (hiddenInput.value) {
    const match = dataList.find(i => i.value === hiddenInput.value);
    if (match) searchInput.value = match.label;
  }
}

// --- Compacting Attendance System ---
const ATT_STAFF_KEY = 'textile_att_staff';
const ATT_DATA_KEY = 'textile_att_data';

function initAttendanceSystem() {
  const dateInput = document.getElementById('attDateSelector');
  const today = new Date().toISOString().split('T')[0];

  if (!dateInput.value) {
    dateInput.value = today;
  }

  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  renderAttendanceTable(dateInput.value);

  document.getElementById('attBtnAddStaff').addEventListener('click', addStaff);
  document.getElementById('attBtnViewReport').addEventListener('click', showReport);
  document.getElementById('attBtnCloseReport').addEventListener('click', () => {
    document.getElementById('attReportModal').classList.remove('active');
  });

  dateInput.addEventListener('change', (e) => {
    renderAttendanceTable(e.target.value);
  });
}

function updateLiveClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const timeEl = document.getElementById('attLiveTime');
  const dateEl = document.getElementById('attLiveDate');

  if (timeEl) timeEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = dateStr;
}

function getStaff() {
  try { return JSON.parse(localStorage.getItem(ATT_STAFF_KEY) || '[]'); }
  catch { return []; }
}

function getAttData() {
  try { return JSON.parse(localStorage.getItem(ATT_DATA_KEY) || '{}'); }
  catch { return {}; }
}

function saveAttData(data) {
  localStorage.setItem(ATT_DATA_KEY, JSON.stringify(data));
}

function addStaff() {
  const nameInput = document.getElementById('attStaffName');
  const salaryInput = document.getElementById('attStaffSalary');

  const name = nameInput.value.trim();
  const salary = parseInt(salaryInput.value, 10);

  if (!name || isNaN(salary) || salary <= 0) {
    alert('Please enter a valid worker name and daily salary.');
    return;
  }

  const staff = getStaff();
  if (staff.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    alert('Worker already exists.');
    return;
  }

  staff.push({ id: Date.now().toString(), name, salary });
  localStorage.setItem(ATT_STAFF_KEY, JSON.stringify(staff));

  nameInput.value = '';
  salaryInput.value = '';

  const currentDate = document.getElementById('attDateSelector').value;
  renderAttendanceTable(currentDate);
}

function deleteStaff(id) {
  if (!confirm('Remove this worker? Their past data will remain in reports but they will be removed from future attendance lists.')) return;

  let staff = getStaff();
  staff = staff.filter(s => s.id !== id);
  localStorage.setItem(ATT_STAFF_KEY, JSON.stringify(staff));

  const currentDate = document.getElementById('attDateSelector').value;
  renderAttendanceTable(currentDate);
}

function renderAttendanceTable(dateStr) {
  const tbody = document.getElementById('attTableBody');
  if (!tbody) return;

  const staff = getStaff();
  let allData = getAttData();

  if (!allData[dateStr]) {
    allData[dateStr] = {};
  }
  const dayData = allData[dateStr];

  tbody.innerHTML = '';

  if (staff.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="6" style="text-align: center; color: #6b7280; padding: 20px;">No workers added yet.</td>';
    tbody.appendChild(tr);
    return;
  }

  staff.forEach(worker => {
    const wData = dayData[worker.id] || { morning: false, evening: false, advance: 0 };

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 500;">${worker.name}</td>
      <td>₹${worker.salary}</td>
      <td><input type="checkbox" class="att-mrng-chk" data-wid="${worker.id}" ${wData.morning ? 'checked' : ''}></td>
      <td><input type="checkbox" class="att-evng-chk" data-wid="${worker.id}" ${wData.evening ? 'checked' : ''}></td>
      <td><input type="number" class="att-adv-inp" data-wid="${worker.id}" value="${wData.advance || ''}" min="0" placeholder="0"></td>
      <td style="text-align: center;">
        <button class="att-delete-btn" title="Remove Worker" data-wid="${worker.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach auto-save listeners
  tbody.querySelectorAll('.att-mrng-chk, .att-evng-chk, .att-adv-inp').forEach(el => {
    el.addEventListener('change', () => autoSaveAttendance(dateStr));
  });

  tbody.querySelectorAll('.att-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wid = e.currentTarget.getAttribute('data-wid');
      deleteStaff(wid);
    });
  });
}

function autoSaveAttendance(dateStr) {
  const staff = getStaff();
  const allData = getAttData();

  if (!allData[dateStr]) {
    allData[dateStr] = {};
  }

  staff.forEach(worker => {
    const mrngEl = document.querySelector(`.att-mrng-chk[data-wid="${worker.id}"]`);
    const evngEl = document.querySelector(`.att-evng-chk[data-wid="${worker.id}"]`);
    const advEl = document.querySelector(`.att-adv-inp[data-wid="${worker.id}"]`);

    if (mrngEl && evngEl && advEl) {
      const advVal = parseInt(advEl.value, 10);
      allData[dateStr][worker.id] = {
        morning: mrngEl.checked,
        evening: evngEl.checked,
        advance: isNaN(advVal) ? 0 : advVal
      };
    }
  });

  saveAttData(allData);
}

function showReport() {
  const staff = getStaff();
  const allData = getAttData();
  const reportBody = document.getElementById('attReportBody');

  let html = '';

  staff.forEach(worker => {
    let totalFull = 0;
    let totalHalf = 0;
    let totalAdvance = 0;
    let totalEarned = 0;

    let advancedDaysHTML = '';

    Object.keys(allData).sort().forEach(dateStr => {
      const dayDataForWorker = allData[dateStr][worker.id];
      if (!dayDataForWorker) return;

      const isMorning = dayDataForWorker.morning;
      const isEvening = dayDataForWorker.evening;
      const advance = dayDataForWorker.advance || 0;

      let workType = 'Absent';
      let earnedToday = 0;

      if (isMorning && isEvening) {
        workType = 'Full Day';
        totalFull++;
        earnedToday = worker.salary;
      } else if (isMorning || isEvening) {
        workType = 'Half Day';
        totalHalf++;
        earnedToday = worker.salary / 2;
      }

      totalAdvance += advance;
      totalEarned += earnedToday;

      if (advance > 0 && workType !== 'Absent') {
        const displayDate = new Date(dateStr).toLocaleDateString('en-GB');
        advancedDaysHTML += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 0; font-size: 0.9rem;">${displayDate}</td>
            <td style="padding: 8px 0; font-size: 0.9rem;">${workType}</td>
            <td style="padding: 8px 0; font-size: 0.9rem; font-weight: 500; color: #ef4444;">₹${advance}</td>
          </tr>
        `;
      }
    });

    const balance = totalEarned - totalAdvance;
    const balanceColor = balance >= 0 ? '#10b981' : '#ef4444';

    html += `
      <div class="worker-report-card">
        <div class="worker-report-name">${worker.name}</div>
        <div class="worker-report-stats">
          <div class="stat-box"><div class="stat-value">${totalFull}</div><div class="stat-label">Full Days</div></div>
          <div class="stat-box"><div class="stat-value">${totalHalf}</div><div class="stat-label">Half Days</div></div>
          <div class="stat-box"><div class="stat-value" style="color: #3b82f6;">₹${totalEarned}</div><div class="stat-label">Total Earned</div></div>
          <div class="stat-box"><div class="stat-value" style="color: #ef4444;">₹${totalAdvance}</div><div class="stat-label">Total Adv.</div></div>
        </div>
        <div style="font-weight: bold; margin-bottom: 10px; color: ${balanceColor};">
          Balance To Pay: ₹${balance}
        </div>
        ${advancedDaysHTML ? `
          <div style="font-size: 0.85rem; font-weight: bold; color: #6b7280; text-transform: uppercase;">Advance History</div>
          <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 10px;">
            ${advancedDaysHTML}
          </table>
        ` : `<div style="font-size: 0.85rem; color: #6b7280; font-style: italic;">No advances on working days.</div>`}
      </div>
    `;
  });

  if (html === '') {
    html = '<p>No staff to generate report for.</p>';
  }

  reportBody.innerHTML = html;
  document.getElementById('attReportModal').classList.add('active');
}
fetch(https://vss-dc.onrender.com)
  .then(res => res.json())
  .then(data => console.log(data));