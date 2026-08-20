Auth.requireAuth();

const admin = Auth.getAdmin();
if (admin) document.getElementById('adminEmail').textContent = admin.email;

document.getElementById('logoutBtn').addEventListener('click', () => {
  Auth.clearSession();
  window.location.href = 'index.html';
});

// ---------- Toast ----------
function toast(message, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast show ${type}`;
  setTimeout(() => (el.className = 'toast'), 2500);
}

// ---------- Nav / panel switching ----------
document.querySelectorAll('.nav-item[data-panel]').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item[data-panel]').forEach((i) => i.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(`panel-${item.dataset.panel}`).classList.add('active');

    if (item.dataset.panel === 'enquiries' && !enquiriesLoaded) loadEnquiries();
    if (item.dataset.panel === 'contact' && !contactsLoaded) loadContacts();
    if (item.dataset.panel === 'content' && !contentLoaded) loadContent();
  });
});

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ============================================================
// ENQUIRIES
// ============================================================
let enquiriesLoaded = false;
let enquiryPage = 1;

async function loadEnquiries(page = 1) {
  enquiryPage = page;
  const status = document.getElementById('enquiryStatusFilter').value;
  const search = document.getElementById('enquirySearch').value.trim();

  document.getElementById('enquiryLoading').style.display = 'block';
  document.getElementById('enquiryEmpty').style.display = 'none';

  const params = new URLSearchParams({ page, limit: 20 });
  if (status) params.set('status', status);
  if (search) params.set('search', search);

  try {
    const data = await apiFetch(`/api/enquiries?${params}`);
    enquiriesLoaded = true;
    renderEnquiries(data);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    document.getElementById('enquiryLoading').style.display = 'none';
  }
}

function renderEnquiries(data) {
  const tbody = document.getElementById('enquiryTableBody');
  tbody.innerHTML = '';

  if (!data.items.length) {
    document.getElementById('enquiryEmpty').style.display = 'block';
  }

  data.items.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(item.createdAt)}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.phone)}</td>
      <td>${escapeHtml(item.email || '—')}</td>
      <td>${escapeHtml(item.specialization)}</td>
      <td>${escapeHtml(item.source)}</td>
      <td>
        <select class="status-select" data-id="${item._id}" data-kind="enquiry">
          ${['new', 'contacted', 'enrolled', 'closed']
            .map((s) => `<option value="${s}" ${s === item.status ? 'selected' : ''}>${s}</option>`)
            .join('')}
        </select>
      </td>
      <td class="wrap">
        <input type="text" class="notes-input" data-id="${item._id}" value="${escapeHtml(item.notes || '')}" placeholder="Add note..." style="margin:0;padding:6px 8px;font-size:12px;min-width:140px;">
      </td>
      <td><button class="btn btn-danger btn-small" data-id="${item._id}" data-kind="delete-enquiry">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination('enquiryPagination', data, loadEnquiries);
  wireRowActions();
}

function wireRowActions() {
  document.querySelectorAll('select.status-select[data-kind="enquiry"]').forEach((sel) => {
    sel.onchange = async () => {
      try {
        await apiFetch(`/api/enquiries/${sel.dataset.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: sel.value }),
        });
        toast('Status updated');
      } catch (err) {
        toast(err.message, 'error');
      }
    };
  });

  document.querySelectorAll('.notes-input').forEach((input) => {
    input.onchange = async () => {
      try {
        await apiFetch(`/api/enquiries/${input.dataset.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ notes: input.value }),
        });
        toast('Note saved');
      } catch (err) {
        toast(err.message, 'error');
      }
    };
  });

  document.querySelectorAll('[data-kind="delete-enquiry"]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Delete this enquiry?')) return;
      try {
        await apiFetch(`/api/enquiries/${btn.dataset.id}`, { method: 'DELETE' });
        toast('Enquiry deleted');
        loadEnquiries(enquiryPage);
      } catch (err) {
        toast(err.message, 'error');
      }
    };
  });

  document.querySelectorAll('select.status-select[data-kind="contact"]').forEach((sel) => {
    sel.onchange = async () => {
      try {
        await apiFetch(`/api/contact/${sel.dataset.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: sel.value }),
        });
        toast('Status updated');
      } catch (err) {
        toast(err.message, 'error');
      }
    };
  });

  document.querySelectorAll('[data-kind="delete-contact"]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Delete this message?')) return;
      try {
        await apiFetch(`/api/contact/${btn.dataset.id}`, { method: 'DELETE' });
        toast('Message deleted');
        loadContacts(contactPage);
      } catch (err) {
        toast(err.message, 'error');
      }
    };
  });
}

function renderPagination(elId, data, loader) {
  const el = document.getElementById(elId);
  if (data.pages <= 1) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <button class="btn btn-secondary btn-small" ${data.page <= 1 ? 'disabled' : ''} id="${elId}-prev">Prev</button>
    <span>Page ${data.page} of ${data.pages} (${data.total} total)</span>
    <button class="btn btn-secondary btn-small" ${data.page >= data.pages ? 'disabled' : ''} id="${elId}-next">Next</button>
  `;
  const prev = document.getElementById(`${elId}-prev`);
  const next = document.getElementById(`${elId}-next`);
  if (prev) prev.onclick = () => loader(data.page - 1);
  if (next) next.onclick = () => loader(data.page + 1);
}

document.getElementById('enquiryRefresh').addEventListener('click', () => loadEnquiries(1));
document.getElementById('enquiryStatusFilter').addEventListener('change', () => loadEnquiries(1));
let searchDebounce;
document.getElementById('enquirySearch').addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => loadEnquiries(1), 350);
});

// ============================================================
// CONTACT MESSAGES
// ============================================================
let contactsLoaded = false;
let contactPage = 1;

async function loadContacts(page = 1) {
  contactPage = page;
  const status = document.getElementById('contactStatusFilter').value;

  document.getElementById('contactLoading').style.display = 'block';
  document.getElementById('contactEmpty').style.display = 'none';

  const params = new URLSearchParams({ page, limit: 20 });
  if (status) params.set('status', status);

  try {
    const data = await apiFetch(`/api/contact?${params}`);
    contactsLoaded = true;
    renderContacts(data);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    document.getElementById('contactLoading').style.display = 'none';
  }
}

function renderContacts(data) {
  const tbody = document.getElementById('contactTableBody');
  tbody.innerHTML = '';

  if (!data.items.length) {
    document.getElementById('contactEmpty').style.display = 'block';
  }

  data.items.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(item.createdAt)}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.email)}</td>
      <td>${escapeHtml(item.phone || '—')}</td>
      <td>${escapeHtml(item.subject || '—')}</td>
      <td class="wrap">${escapeHtml(item.message)}</td>
      <td>
        <select class="status-select" data-id="${item._id}" data-kind="contact">
          ${['new', 'read', 'closed']
            .map((s) => `<option value="${s}" ${s === item.status ? 'selected' : ''}>${s}</option>`)
            .join('')}
        </select>
      </td>
      <td><button class="btn btn-danger btn-small" data-id="${item._id}" data-kind="delete-contact">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination('contactPagination', data, loadContacts);
  wireRowActions();
}

document.getElementById('contactRefresh').addEventListener('click', () => loadContacts(1));
document.getElementById('contactStatusFilter').addEventListener('change', () => loadContacts(1));

// ============================================================
// CONTENT
// ============================================================
let contentLoaded = false;

async function loadContent() {
  document.getElementById('contentLoading').style.display = 'block';
  try {
    const items = await apiFetch('/api/content/admin');
    contentLoaded = true;
    renderContent(items);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    document.getElementById('contentLoading').style.display = 'none';
  }
}

function renderContent(items) {
  const list = document.getElementById('contentList');
  list.innerHTML = '';

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'content-card';

    const valueField =
      item.type === 'richtext'
        ? `<textarea rows="4" data-field="value">${escapeHtml(item.value)}</textarea>`
        : `<input type="text" data-field="value" value="${escapeHtml(item.value)}">`;

    card.innerHTML = `
      <div class="content-head">
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <div class="content-key">${escapeHtml(item.key)} &middot; ${escapeHtml(item.type)}</div>
        </div>
      </div>
      <label>Value</label>
      ${valueField}
      ${item.type === 'image' && item.value ? `<img class="image-preview" src="${escapeHtml(item.value)}" alt="">` : ''}
      <div class="row-actions">
        <button class="btn btn-small" data-action="save">Save</button>
        <button class="btn btn-danger btn-small" data-action="delete">Delete</button>
      </div>
    `;

    card.querySelector('[data-action="save"]').onclick = async () => {
      const value = card.querySelector('[data-field="value"]').value;
      try {
        await apiFetch(`/api/content/${encodeURIComponent(item.key)}`, {
          method: 'PUT',
          body: JSON.stringify({ label: item.label, type: item.type, value }),
        });
        toast('Content saved');
        loadContent();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    card.querySelector('[data-action="delete"]').onclick = async () => {
      if (!confirm(`Delete content block "${item.key}"? The frontend will fall back to its built-in text.`)) return;
      try {
        await apiFetch(`/api/content/${encodeURIComponent(item.key)}`, { method: 'DELETE' });
        toast('Content block deleted');
        loadContent();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    list.appendChild(card);
  });
}

document.getElementById('addContentBtn').addEventListener('click', async () => {
  const key = document.getElementById('newKey').value.trim();
  const label = document.getElementById('newLabel').value.trim();
  const type = document.getElementById('newType').value;
  const value = document.getElementById('newValue').value;

  if (!key || !label) {
    toast('Key and label are required', 'error');
    return;
  }

  try {
    await apiFetch(`/api/content/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ label, type, value }),
    });
    toast('Content block added');
    document.getElementById('newKey').value = '';
    document.getElementById('newLabel').value = '';
    document.getElementById('newValue').value = '';
    loadContent();
  } catch (err) {
    toast(err.message, 'error');
  }
});

// Load the first panel's data on page load
loadEnquiries();
