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
    if (item.dataset.panel === 'seo' && !seoLoaded) loadSeo();
    if (item.dataset.panel === 'faqs' && !faqsLoaded) loadFaqs();
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

// ============================================================
// SEO / META TAGS
// ============================================================
// Add a pagePath here whenever a new HTML page is added to the site —
// it must also be added to the ASSETS list in build-meta.js so the build
// script knows to inject into it.
const SEO_KNOWN_PAGES = ['index.html'];

let seoLoaded = false;
let seoItemsByPath = {};

async function loadSeo() {
  document.getElementById('seoLoading').style.display = 'block';
  try {
    const items = await apiFetch('/api/page-meta');
    seoLoaded = true;
    seoItemsByPath = {};
    items.forEach((item) => {
      seoItemsByPath[item.pagePath] = item;
    });
    renderSeo();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    document.getElementById('seoLoading').style.display = 'none';
  }
}

function seoCounterClass(len, target, max) {
  if (len > max) return 'over';
  if (len > target) return 'warn';
  return 'ok';
}

function wireSeoCounter(input, counter, target, max) {
  function update() {
    const len = input.value.length;
    counter.textContent = `${len} / ${target}`;
    counter.className = `char-count ${seoCounterClass(len, target, max)}`;
  }
  input.addEventListener('input', update);
  update();
}

function renderSeo() {
  const list = document.getElementById('seoList');
  list.innerHTML = '';

  SEO_KNOWN_PAGES.forEach((pagePath) => {
    const item = seoItemsByPath[pagePath] || null;
    const card = document.createElement('div');
    card.className = 'content-card';

    card.innerHTML = `
      <div class="content-head">
        <div>
          <strong>${escapeHtml(pagePath)}</strong>
          <div class="content-key">${item ? 'Customized' : "Using the page's built-in fallback tags"}</div>
        </div>
      </div>

      <label>Title <span class="char-count" data-counter="title"></span></label>
      <input type="text" data-field="title" value="${escapeHtml(item?.title || '')}" placeholder="Leave blank to keep the page's built-in title">

      <label>Meta Description <span class="char-count" data-counter="metaDescription"></span></label>
      <textarea rows="3" data-field="metaDescription" placeholder="Leave blank to keep the page's built-in description">${escapeHtml(item?.metaDescription || '')}</textarea>

      <label>Canonical URL</label>
      <input type="text" data-field="canonicalUrl" value="${escapeHtml(item?.canonicalUrl || '')}" placeholder="https://sks-warm-theme.vercel.app/">

      <label>Social Preview Image (og:image) URL</label>
      <input type="text" data-field="ogImage" value="${escapeHtml(item?.ogImage || '')}" placeholder="https://sks-warm-theme.vercel.app/images/og.jpg">

      <div class="row-actions">
        <button class="btn btn-small" data-action="save">Save</button>
        ${item ? '<button class="btn btn-danger btn-small" data-action="reset">Reset to fallback</button>' : ''}
      </div>
    `;

    const titleInput = card.querySelector('[data-field="title"]');
    const descInput = card.querySelector('[data-field="metaDescription"]');
    wireSeoCounter(titleInput, card.querySelector('[data-counter="title"]'), 60, 70);
    wireSeoCounter(descInput, card.querySelector('[data-counter="metaDescription"]'), 155, 165);

    card.querySelector('[data-action="save"]').onclick = async () => {
      const body = {
        title: titleInput.value.trim(),
        metaDescription: descInput.value.trim(),
        canonicalUrl: card.querySelector('[data-field="canonicalUrl"]').value.trim(),
        ogImage: card.querySelector('[data-field="ogImage"]').value.trim(),
      };
      try {
        if (item) {
          await apiFetch(`/api/page-meta/${item._id}`, { method: 'PATCH', body: JSON.stringify(body) });
        } else {
          await apiFetch('/api/page-meta', { method: 'POST', body: JSON.stringify({ pagePath, ...body }) });
        }
        toast('Saved — redeploy on Vercel for this to go live');
        loadSeo();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    const resetBtn = card.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.onclick = async () => {
        if (!confirm(`Reset "${pagePath}" to its built-in fallback tags? A redeploy is needed for this to go live.`)) return;
        try {
          await apiFetch(`/api/page-meta/${item._id}`, { method: 'DELETE' });
          toast('Reset to fallback — redeploy on Vercel for this to go live');
          loadSeo();
        } catch (err) {
          toast(err.message, 'error');
        }
      };
    }

    list.appendChild(card);
  });
}

document.getElementById('seoRefresh').addEventListener('click', loadSeo);

// ============================================================
// FAQ MANAGER
// ============================================================
let faqsLoaded = false;
let faqItems = [];

async function loadFaqs() {
  document.getElementById('faqLoading').style.display = 'block';
  try {
    faqItems = await apiFetch('/api/faqs');
    faqsLoaded = true;
    renderFaqs();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    document.getElementById('faqLoading').style.display = 'none';
  }
}

function renderFaqs() {
  const list = document.getElementById('faqList');
  list.innerHTML = '';

  faqItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.innerHTML = `
      <div class="content-head">
        <div>
          <strong>${escapeHtml(item.question)}</strong>
          <div class="content-key">Order: ${item.order} &middot; ${item.isActive ? 'Active' : 'Inactive'}</div>
        </div>
        <div class="reorder-buttons">
          <button class="btn btn-secondary btn-small" data-action="up" ${index === 0 ? 'disabled' : ''} title="Move up">&uarr;</button>
          <button class="btn btn-secondary btn-small" data-action="down" ${index === faqItems.length - 1 ? 'disabled' : ''} title="Move down">&darr;</button>
        </div>
      </div>
      <label>Question</label>
      <input type="text" data-field="question" value="${escapeHtml(item.question)}">
      <label>Answer</label>
      <textarea rows="3" data-field="answer">${escapeHtml(item.answer)}</textarea>
      <label class="checkbox-label"><input type="checkbox" data-field="isActive" ${item.isActive ? 'checked' : ''}> Active (shown on the live site)</label>
      <div class="row-actions">
        <button class="btn btn-small" data-action="save">Save</button>
        <button class="btn btn-danger btn-small" data-action="delete">Delete</button>
      </div>
    `;

    card.querySelector('[data-action="save"]').onclick = async () => {
      const body = {
        question: card.querySelector('[data-field="question"]').value.trim(),
        answer: card.querySelector('[data-field="answer"]').value.trim(),
        isActive: card.querySelector('[data-field="isActive"]').checked,
      };
      try {
        await apiFetch(`/api/faqs/${item._id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast('FAQ saved — redeploy on Vercel for this to go live');
        loadFaqs();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    card.querySelector('[data-action="delete"]').onclick = async () => {
      if (!confirm('Delete this FAQ?')) return;
      try {
        await apiFetch(`/api/faqs/${item._id}`, { method: 'DELETE' });
        toast('FAQ deleted — redeploy on Vercel for this to go live');
        loadFaqs();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    const upBtn = card.querySelector('[data-action="up"]');
    const downBtn = card.querySelector('[data-action="down"]');
    if (!upBtn.disabled) upBtn.onclick = () => swapFaqOrder(index, index - 1);
    if (!downBtn.disabled) downBtn.onclick = () => swapFaqOrder(index, index + 1);

    list.appendChild(card);
  });
}

async function swapFaqOrder(indexA, indexB) {
  const a = faqItems[indexA];
  const b = faqItems[indexB];
  try {
    await Promise.all([
      apiFetch(`/api/faqs/${a._id}`, { method: 'PATCH', body: JSON.stringify({ order: b.order }) }),
      apiFetch(`/api/faqs/${b._id}`, { method: 'PATCH', body: JSON.stringify({ order: a.order }) }),
    ]);
    toast('Order updated — redeploy on Vercel for this to go live');
    loadFaqs();
  } catch (err) {
    toast(err.message, 'error');
  }
}

document.getElementById('faqRefresh').addEventListener('click', loadFaqs);

document.getElementById('addFaqBtn').addEventListener('click', async () => {
  const question = document.getElementById('newFaqQuestion').value.trim();
  const answer = document.getElementById('newFaqAnswer').value.trim();

  if (!question || !answer) {
    toast('Question and answer are required', 'error');
    return;
  }

  try {
    await apiFetch('/api/faqs', { method: 'POST', body: JSON.stringify({ question, answer }) });
    toast('FAQ added — redeploy on Vercel for this to go live');
    document.getElementById('newFaqQuestion').value = '';
    document.getElementById('newFaqAnswer').value = '';
    loadFaqs();
  } catch (err) {
    toast(err.message, 'error');
  }
});

// Load the first panel's data on page load
loadEnquiries();
