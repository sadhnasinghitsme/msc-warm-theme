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
    if (item.dataset.panel === 'gallery' && !galleryLoaded) loadGallery();
    if (item.dataset.panel === 'theme' && !themeLoaded) loadTheme();
    if (item.dataset.panel === 'navPages' && !navPagesLoaded) loadNavPages();
    if (item.dataset.panel === 'programs' && !programsLoaded) loadPrograms();
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

// ============================================================
// GALLERY
// ============================================================
let galleryLoaded = false;
let galleryItems = [];

async function loadGallery() {
  document.getElementById('galleryLoading').style.display = 'block';
  document.getElementById('galleryEmpty').style.display = 'none';
  try {
    galleryItems = await apiFetch('/api/gallery');
    galleryLoaded = true;
    renderGallery();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    document.getElementById('galleryLoading').style.display = 'none';
  }
}

function renderGallery() {
  const list = document.getElementById('galleryList');
  list.innerHTML = '';

  if (!galleryItems.length) {
    document.getElementById('galleryEmpty').style.display = 'block';
  }

  galleryItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.innerHTML = `
      <img class="gallery-thumb" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.altText || '')}">
      <div class="content-head">
        <div class="content-key">Order: ${item.order} &middot; ${item.isActive ? 'Active' : 'Inactive'}</div>
        <div class="reorder-buttons">
          <button class="btn btn-secondary btn-small" data-action="up" ${index === 0 ? 'disabled' : ''} title="Move up">&uarr;</button>
          <button class="btn btn-secondary btn-small" data-action="down" ${index === galleryItems.length - 1 ? 'disabled' : ''} title="Move down">&darr;</button>
        </div>
      </div>
      <label>Caption</label>
      <input type="text" data-field="caption" value="${escapeHtml(item.caption || '')}">
      <label>Alt text</label>
      <input type="text" data-field="altText" value="${escapeHtml(item.altText || '')}">
      <label class="checkbox-label"><input type="checkbox" data-field="isActive" ${item.isActive ? 'checked' : ''}> Active</label>
      <div class="row-actions">
        <button class="btn btn-small" data-action="save">Save</button>
        <button class="btn btn-danger btn-small" data-action="delete">Delete</button>
      </div>
    `;

    card.querySelector('[data-action="save"]').onclick = async () => {
      const body = {
        caption: card.querySelector('[data-field="caption"]').value.trim(),
        altText: card.querySelector('[data-field="altText"]').value.trim(),
        isActive: card.querySelector('[data-field="isActive"]').checked,
      };
      try {
        await apiFetch(`/api/gallery/${item._id}`, { method: 'PUT', body: JSON.stringify(body) });
        toast('Image saved');
        loadGallery();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    card.querySelector('[data-action="delete"]').onclick = async () => {
      if (!confirm('Delete this image?')) return;
      try {
        await apiFetch(`/api/gallery/${item._id}`, { method: 'DELETE' });
        toast('Image deleted');
        loadGallery();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    const upBtn = card.querySelector('[data-action="up"]');
    const downBtn = card.querySelector('[data-action="down"]');
    if (!upBtn.disabled) upBtn.onclick = () => swapGalleryOrder(index, index - 1);
    if (!downBtn.disabled) downBtn.onclick = () => swapGalleryOrder(index, index + 1);

    list.appendChild(card);
  });
}

async function swapGalleryOrder(indexA, indexB) {
  const a = galleryItems[indexA];
  const b = galleryItems[indexB];
  try {
    await Promise.all([
      apiFetch(`/api/gallery/${a._id}`, { method: 'PUT', body: JSON.stringify({ order: b.order }) }),
      apiFetch(`/api/gallery/${b._id}`, { method: 'PUT', body: JSON.stringify({ order: a.order }) }),
    ]);
    toast('Order updated');
    loadGallery();
  } catch (err) {
    toast(err.message, 'error');
  }
}

document.getElementById('galleryRefresh').addEventListener('click', loadGallery);

document.getElementById('addGalleryBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('newGalleryFile');
  const caption = document.getElementById('newGalleryCaption').value.trim();
  const altText = document.getElementById('newGalleryAlt').value.trim();

  if (!fileInput.files.length) {
    toast('Please choose an image file', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);
  if (caption) formData.append('caption', caption);
  if (altText) formData.append('altText', altText);

  try {
    await apiFetch('/api/gallery', { method: 'POST', body: formData });
    toast('Image added');
    fileInput.value = '';
    document.getElementById('newGalleryCaption').value = '';
    document.getElementById('newGalleryAlt').value = '';
    loadGallery();
  } catch (err) {
    toast(err.message, 'error');
  }
});

// ============================================================
// THEME SETTINGS
// ============================================================
// itemsShape: null | 'card' (imageUrl+title+description) | 'step' (title+description) | 'badge' (title only)
// extraFields: null | [{ key, label, type }] rendered/read from item.extra
// icon/color: purely cosmetic — which chip icon + accent color the card uses
const THEME_SECTIONS = [
  { key: 'hero', label: 'Hero', live: true, hint: 'Homepage hero heading, description, and CTA button.', itemsShape: null, extraFields: null, icon: 'image', color: 'gold' },
  { key: 'whyUs', label: 'Why Choose Us', live: true, hint: 'Eyebrow + heading, plus the 5 feature cards below it.', itemsShape: 'card', extraFields: null, icon: 'shield', color: 'maroon' },
  { key: 'faq', label: 'FAQ Section Intro', live: true, hint: 'Eyebrow + heading above the FAQ list. The questions/answers themselves are in FAQ Manager.', itemsShape: null, extraFields: null, icon: 'help', color: 'blue' },
  { key: 'stats', label: 'Stats', live: false, hint: 'Not yet wired to the live site — there’s no existing stats heading to hook into.', itemsShape: null, extraFields: null, icon: 'bar-chart', color: 'teal' },
  { key: 'process', label: 'Admission Process', live: true, hint: 'Eyebrow + heading, plus the 5-step "How to Apply" timeline.', itemsShape: 'step', extraFields: null, icon: 'list', color: 'purple' },
  { key: 'clinical', label: 'Clinical Training', live: true, hint: 'Heading, description, and the hospital stat badges.', itemsShape: 'badge', extraFields: null, icon: 'activity', color: 'rose' },
  {
    key: 'contact', label: 'Contact & Footer', live: true, hint: 'Phone, toll-free, email, address, and the map embed shown in the footer.',
    itemsShape: null,
    extraFields: [
      { key: 'phone', label: 'Admission Helpline' },
      { key: 'tollfree', label: 'Toll-Free Number' },
      { key: 'email', label: 'Email Address' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'mapLink', label: 'Map Embed URL', hint: 'The src of a Google Maps embed link.' },
    ],
    icon: 'phone', color: 'green',
  },
];

const THEME_ICONS = {
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  'bar-chart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4 6l1 1 2-2"/><path d="M4 12l1 1 2-2"/><path d="M4 18l1 1 2-2"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
};

const ITEM_SHAPE_FIELDS = {
  card: [
    { key: 'imageUrl', label: 'Image URL', placeholder: 'images/why-choose/example.jpg' },
    { key: 'title', label: 'Title', placeholder: 'Card title' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Card description' },
  ],
  step: [
    { key: 'title', label: 'Step Title', placeholder: 'e.g. Fill the Enquiry Form' },
    { key: 'description', label: 'Step Description', type: 'textarea', placeholder: 'What happens in this step' },
  ],
  badge: [
    { key: 'title', label: 'Badge Text', placeholder: 'e.g. 950-Bed Multi-Specialty Hospital' },
  ],
  // Used by Navbar Pages: Governing Body's card grid of people.
  member: [
    { key: 'photoUrl', label: 'Photo URL', placeholder: 'Leave blank to keep the "photo needed" placeholder' },
    { key: 'name', label: 'Name', placeholder: 'e.g. Prof. (Dr.) Jane Doe' },
    { key: 'role', label: 'Role', placeholder: 'e.g. Chairman' },
  ],
  // Used by Navbar Pages: Staff & Faculty's department sections.
  department: [
    { key: 'name', label: 'Department Name', placeholder: 'e.g. Anatomy' },
    {
      key: 'faculty', label: 'Faculty', type: 'textarea',
      placeholder: 'One per line: Name — Title, Department — Degrees/Experience',
    },
  ],
};

function buildItemRowHtml(shape, data) {
  const fields = ITEM_SHAPE_FIELDS[shape];
  const fieldsHtml = fields
    .map((f) => {
      const value = escapeHtml(data[f.key] || '');
      return f.type === 'textarea'
        ? `<textarea rows="2" data-item-field="${f.key}" placeholder="${escapeHtml(f.placeholder)}">${value}</textarea>`
        : `<input type="text" data-item-field="${f.key}" value="${value}" placeholder="${escapeHtml(f.placeholder)}">`;
    })
    .join('');
  return `<div class="theme-item-row">${fieldsHtml}<button type="button" class="btn btn-danger btn-small" data-action="remove-item">Remove</button></div>`;
}

function readItemRow(shape, rowEl) {
  const fields = ITEM_SHAPE_FIELDS[shape];
  const obj = {};
  fields.forEach((f) => {
    obj[f.key] = rowEl.querySelector(`[data-item-field="${f.key}"]`).value.trim();
  });
  return obj;
}

let themeLoaded = false;
let themeSectionsByKey = {};

async function loadTheme() {
  document.getElementById('themeLoading').style.display = 'block';
  try {
    const items = await apiFetch('/api/theme-settings');
    themeLoaded = true;
    themeSectionsByKey = {};
    items.forEach((item) => {
      themeSectionsByKey[item.sectionKey] = item;
    });
    renderTheme();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    document.getElementById('themeLoading').style.display = 'none';
  }
}

function renderTheme() {
  const list = document.getElementById('themeList');
  list.innerHTML = '';

  THEME_SECTIONS.forEach((meta) => {
    const item = themeSectionsByKey[meta.key] || {};
    const card = document.createElement('div');
    card.className = 'theme-card';

    card.innerHTML = `
      <div class="theme-icon-chip ${meta.color}">${THEME_ICONS[meta.icon] || ''}</div>
      <div class="theme-card-title">${escapeHtml(meta.label)}</div>
      <div class="theme-status ${meta.live ? 'live' : 'pending'}">
        <span class="dot"></span>${meta.live ? 'Live on site' : 'Not yet wired'}
      </div>
      <p class="theme-card-desc">${escapeHtml(meta.hint)}</p>
      <button class="btn btn-pill btn-small" data-action="edit">Edit</button>
    `;

    card.querySelector('[data-action="edit"]').onclick = () => openThemeModal(meta, item);

    list.appendChild(card);
  });
}

document.getElementById('themeRefresh').addEventListener('click', loadTheme);

// ---------- Theme Settings: shared edit modal ----------
const themeModalOverlay = document.getElementById('themeModalOverlay');
const themeModalEl = document.getElementById('themeModal');

function closeThemeModal() {
  themeModalOverlay.classList.add('hidden');
  themeModalEl.innerHTML = '';
}

themeModalOverlay.addEventListener('click', (e) => {
  if (e.target === themeModalOverlay) closeThemeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !themeModalOverlay.classList.contains('hidden')) closeThemeModal();
});

function openThemeModal(meta, item) {
  themeModalEl.innerHTML = `
    <div class="modal-head">
      <div>
        <h2>${escapeHtml(meta.label)}</h2>
        <p class="modal-sub">${meta.live ? 'Live on site' : 'Not yet wired to the site'} &middot; ${escapeHtml(meta.hint)}</p>
      </div>
      <button type="button" class="modal-close" data-action="close" aria-label="Close">&times;</button>
    </div>

    <div class="modal-body">
      <label>Title</label>
      <input type="text" data-field="title" value="${escapeHtml(item.title || '')}">
      <label>Subtitle</label>
      <input type="text" data-field="subtitle" value="${escapeHtml(item.subtitle || '')}">
      <label>Description</label>
      <textarea rows="3" data-field="description">${escapeHtml(item.description || '')}</textarea>
      <label>Image</label>
      <input type="file" data-field="imageFile" accept="image/*">
      <input type="hidden" data-field="imageUrl" value="${escapeHtml(item.imageUrl || '')}">
      ${item.imageUrl ? `<img class="image-preview" src="${escapeHtml(item.imageUrl)}" alt="">` : ''}
      <label>Button Text</label>
      <input type="text" data-field="buttonText" value="${escapeHtml(item.buttonText || '')}">
      <label>Button Link</label>
      <input type="text" data-field="buttonLink" value="${escapeHtml(item.buttonLink || '')}" placeholder="#enquiry-form or https://...">

      ${meta.extraFields ? `
        <div class="theme-extra-fields">
          ${meta.extraFields.map((f) => `
            <label>${escapeHtml(f.label)}${f.hint ? ` <span class="content-key">(${escapeHtml(f.hint)})</span>` : ''}</label>
            ${f.type === 'textarea'
              ? `<textarea rows="2" data-extra-field="${f.key}">${escapeHtml((item.extra && item.extra[f.key]) || '')}</textarea>`
              : `<input type="text" data-extra-field="${f.key}" value="${escapeHtml((item.extra && item.extra[f.key]) || '')}">`}
          `).join('')}
        </div>
      ` : ''}

      ${meta.itemsShape ? `
        <label>${escapeHtml(meta.label)} Items</label>
        <div class="theme-items-list" data-items-shape="${meta.itemsShape}">
          ${(item.items || []).map((it) => buildItemRowHtml(meta.itemsShape, it)).join('')}
        </div>
        <button type="button" class="btn btn-secondary btn-small" data-action="add-item">+ Add Item</button>
      ` : ''}
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary btn-small" data-action="cancel">Cancel</button>
      <button type="button" class="btn btn-pill btn-small" data-action="save">Save Changes</button>
    </div>
  `;

  themeModalOverlay.classList.remove('hidden');

  themeModalEl.querySelector('[data-action="close"]').onclick = closeThemeModal;
  themeModalEl.querySelector('[data-action="cancel"]').onclick = closeThemeModal;

  const itemsList = themeModalEl.querySelector('.theme-items-list');
  function wireRemoveButtons() {
    itemsList.querySelectorAll('[data-action="remove-item"]').forEach((btn) => {
      btn.onclick = () => btn.closest('.theme-item-row').remove();
    });
  }
  if (itemsList) {
    wireRemoveButtons();
    themeModalEl.querySelector('[data-action="add-item"]').onclick = () => {
      itemsList.insertAdjacentHTML('beforeend', buildItemRowHtml(meta.itemsShape, {}));
      wireRemoveButtons();
    };
  }

  themeModalEl.querySelector('[data-action="save"]').onclick = async () => {
    const saveBtn = themeModalEl.querySelector('[data-action="save"]');
    const originalLabel = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      let imageUrl = themeModalEl.querySelector('[data-field="imageUrl"]').value;
      const fileInput = themeModalEl.querySelector('[data-field="imageFile"]');

      if (fileInput.files.length) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        const uploaded = await apiFetch('/api/upload', { method: 'POST', body: formData });
        imageUrl = uploaded.url;
      }

      const body = {
        title: themeModalEl.querySelector('[data-field="title"]').value.trim(),
        subtitle: themeModalEl.querySelector('[data-field="subtitle"]').value.trim(),
        description: themeModalEl.querySelector('[data-field="description"]').value.trim(),
        imageUrl,
        buttonText: themeModalEl.querySelector('[data-field="buttonText"]').value.trim(),
        buttonLink: themeModalEl.querySelector('[data-field="buttonLink"]').value.trim(),
      };

      if (meta.extraFields) {
        body.extra = {};
        meta.extraFields.forEach((f) => {
          body.extra[f.key] = themeModalEl.querySelector(`[data-extra-field="${f.key}"]`).value.trim();
        });
      }

      if (meta.itemsShape) {
        body.items = Array.from(itemsList.querySelectorAll('.theme-item-row')).map((row) =>
          readItemRow(meta.itemsShape, row)
        );
      }

      await apiFetch(`/api/theme-settings/${meta.key}`, { method: 'PUT', body: JSON.stringify(body) });
      toast(`${meta.label} saved`);
      closeThemeModal();
      loadTheme();
    } catch (err) {
      toast(err.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = originalLabel;
    }
  };
}

// ============================================================
// NAVBAR PAGES
// ============================================================
// Config, one entry per editable page — same idea as THEME_SECTIONS above.
// textBlockFields/imageFields describe however many body-text blocks and
// images that particular page actually has.
const NAV_PAGE_ICONS = {
  'file-text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20v-1a6.2 6.2 0 0 1 8-5.9"/><circle cx="17" cy="9" r="2.6"/><path d="M14.8 12.3A5.6 5.6 0 0 1 21.5 19v1"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="9" height="18"/><rect x="13" y="9" width="7" height="12"/><line x1="7" y1="7" x2="7" y2="7.01"/><line x1="10" y1="7" x2="10" y2="7.01"/><line x1="7" y1="11" x2="7" y2="11.01"/><line x1="10" y1="11" x2="10" y2="11.01"/><line x1="7" y1="15" x2="7" y2="15.01"/><line x1="10" y1="15" x2="10" y2="15.01"/></svg>',
  'clipboard-check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 12l2 2 4-4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  presentation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="13" rx="1"/><path d="M8 21l4-5 4 5"/><path d="M12 16v5"/></svg>',
};

// Shared field set for the "leadership message" pages (VC/Pro-VC/Dean) —
// a profile block plus a message body, matching the about-message-photo /
// profile-card layout those three pages already use.
const LEADERSHIP_TEXT_FIELDS = [
  { key: 'profileName', label: 'Name' },
  { key: 'profileTitle', label: 'Title' },
  { key: 'messageBody', label: 'Message Body', rows: 8 },
  { key: 'pullQuote', label: 'Pull Quote' },
];
const LEADERSHIP_IMAGE_FIELDS = [
  { key: 'profilePhoto', label: 'Profile Photo (currently a placeholder — upload the real photo when available)' },
];

const NAV_PAGES = [
  {
    key: 'about-mission-vision',
    label: 'Mission & Vision',
    live: true,
    hint: 'About Us — page heading, mission & vision paragraphs, and the campus banner image.',
    icon: 'file-text',
    color: 'gold',
    textBlockFields: [
      { key: 'missionText', label: 'Mission Paragraph' },
      { key: 'visionText', label: 'Vision Paragraph' },
    ],
    imageFields: [
      { key: 'bannerImage', label: 'Banner Image (aerial campus photo)' },
    ],
  },
  {
    key: 'about-vice-chancellor-desk',
    label: "Vice Chancellor's Desk",
    live: true,
    hint: 'About Us — welcome message, profile details, and photo of the Vice Chancellor.',
    icon: 'user',
    color: 'maroon',
    textBlockFields: LEADERSHIP_TEXT_FIELDS,
    imageFields: LEADERSHIP_IMAGE_FIELDS,
    defaults: {
      heading: "Vice Chancellor's Desk",
      subheading: 'A message from the leadership guiding our academic vision.',
      textBlocks: {
        profileName: 'Prof. (Dr.) Mehar Singh Punia',
        profileTitle: 'Vice Chancellor, SKS International University',
        messageBody:
          "Dear Students,\n\nI am fortunate enough to be part of the University that is committed to providing a holistic educational experience for all its students. I believe that education is a powerful tool that can change the world. Our goal is to equip our students with the knowledge, skills, and values that will enable them to succeed in their personal and professional lives and make a positive impact on society.\n\nOur faculty members are experts in their fields and are dedicated to providing high-quality education that is relevant to the needs of today's world. We also prioritize research and innovation, as we believe that it is through these avenues that we can create solutions to some of the world's most pressing problems.\n\nAs a society, we value collaboration and inclusivity, recognizing that diversity is a strength that enables us to broaden our perspectives and understand the world around us better. We are committed to providing a welcoming, safe, and inclusive environment where everyone has the opportunity to succeed.\n\nI look forward to working with all of you and being part of the SKS International University family. Let's work together to create a better future for ourselves and for the world.",
        pullQuote: 'I believe that education is a powerful tool that can change the world.',
      },
    },
  },
  {
    key: 'about-core-committee',
    label: 'Governing Body / Core Committee',
    live: true,
    hint: 'About Us — the card grid of trustees and senior members (photo, name, role).',
    icon: 'users',
    color: 'blue',
    textBlockFields: [],
    imageFields: [],
    itemsShape: 'member',
    defaults: {
      heading: 'Governing Body / Core Committee',
      subheading: "The trustees and senior members who guide the institution's governance and long-term direction.",
      items: [
        { photoUrl: '', name: '[Name Pending]', role: 'Chairman' },
        { photoUrl: '', name: '[Name Pending]', role: 'Vice Chancellor' },
        { photoUrl: '', name: '[Name Pending]', role: 'Pro-Vice Chancellor' },
        { photoUrl: '', name: '[Name Pending]', role: 'Dean, School of Medicine' },
        { photoUrl: '', name: '[Name Pending]', role: 'Registrar' },
        { photoUrl: '', name: '[Name Pending]', role: 'External / Academic Member' },
      ],
    },
  },
  {
    key: 'about-pro-vice-chancellor-desk',
    label: "Pro-Vice Chancellor's Desk",
    live: true,
    hint: 'About Us — welcome message, profile details, and photo of the Pro-Vice Chancellor.',
    icon: 'user',
    color: 'purple',
    textBlockFields: LEADERSHIP_TEXT_FIELDS,
    imageFields: LEADERSHIP_IMAGE_FIELDS,
    defaults: {
      heading: "Pro-Vice Chancellor's Desk",
      subheading: 'A message from the leadership supporting our academic operations.',
      textBlocks: {
        profileName: 'Prof. (Dr.) [Pro-Vice Chancellor Name]',
        profileTitle: 'Pro-Vice Chancellor, SKS International University',
        messageBody:
          'Located in the Janambhoomi of Lord Shri Krishna, SKS International University is committed to providing outstanding postgraduate medical education, combining rigorous academics with practical, research-driven training.\n\nThis University is a place of learning that honours time-tested values while opening students to the scientific and technical progress unfolding around us every day. The atmosphere on our campus is secure, cordial, and built to support the all-round intellectual development of every student. I warmly welcome you to our University and assure you of our commitment to building you into a valuable asset for the future of medicine in India.',
        pullQuote:
          'I warmly welcome you to our University and assure you of our commitment to building you into a valuable asset for the future of medicine in India.',
      },
    },
  },
  {
    key: 'about-dean-message',
    label: "Dean's Message",
    live: true,
    hint: 'About Us — welcome message, profile details, and photo of the Dean.',
    icon: 'user',
    color: 'rose',
    textBlockFields: LEADERSHIP_TEXT_FIELDS,
    imageFields: LEADERSHIP_IMAGE_FIELDS,
    defaults: {
      heading: "Dean's Message",
      subheading: 'A message from the Dean of the Department of Medical & Allied Health Sciences.',
      textBlocks: {
        profileName: 'Dr. Sandeep Kumar Sharma',
        profileTitle: 'Principal, SKS Hospital Medical College and Research Centre',
        messageBody:
          'The stimulating academic environment at SKS International University helps students acquire the knowledge, skills, and professional attitudes needed to excel as postgraduate medical scientists. As students progress through a rigorous, competency-based curriculum, our faculty are committed to shaping them into skilled researchers, clear communicators, lifelong learners, and accountable professionals.\n\nOur campus is clean, green, and safe, with facilities designed to support both academic and personal growth. Student-led councils take the lead in organizing academic, cultural, and extracurricular events throughout the year.',
        pullQuote: 'Our campus is clean, green, and safe, with facilities designed to support both academic and personal growth.',
      },
    },
  },
  {
    key: 'about-sks-group',
    label: 'SKS Group — About the Trust/Society',
    live: true,
    hint: 'About Us — the trust\'s history, its legacy, and the campus entrance banner image.',
    icon: 'building',
    color: 'teal',
    textBlockFields: [
      { key: 'introText', label: 'Introduction', rows: 6 },
      { key: 'closingText', label: 'Growth & Affiliations', rows: 6 },
    ],
    imageFields: [
      { key: 'bannerImage', label: 'Banner Image (campus entrance gate)' },
    ],
    defaults: {
      heading: 'SKS Group — About the Trust/Society',
      subheading: 'The trust behind SKS International University and its network of institutions.',
      textBlocks: {
        introText:
          'The SKS Group traces its roots to the 1980s, when it began building core competencies across turnkey heavy material handling and lifting solutions, agro and food processing, and — eventually — education.\n\nIn 2001, at a time when the industrial city of Durgapur was reeling from large-scale industrial closures, Shri S.K. Sharma took the initiative to invest in education for the public good, founding the Bengal College of Engineering and Technology. That institution marked the beginning of what is today known as SKS Group of Institutions.',
        closingText:
          'In the years since, SKS Group of Institutions has grown into a leading educational group spanning 15 institutions and enrolling over 15,000 students, with alumni placed in multinational companies and research institutions across the country. Its technical institutions are approved by AICTE and affiliated with respective state universities; its schools are affiliated with CBSE, New Delhi; and its medical institutions are approved by the Ministry of Health & Family Welfare and the Ministry of AYUSH (Govt. of India), NMC and NCISM, New Delhi.\n\nSKS International University — School of Medicine, Mathura extends this legacy into postgraduate medical education, offering MSc programs built on the same commitment to accessible, high-quality education that has defined the Group since its founding.',
      },
    },
  },
  {
    key: 'about-staff-faculty',
    label: 'Staff & Faculty',
    live: true,
    hint: 'About Us — the faculty roster, grouped by department.',
    icon: 'users',
    color: 'green',
    textBlockFields: [],
    imageFields: [],
    itemsShape: 'department',
    defaults: {
      heading: 'Staff & Faculty',
      subheading: 'Meet the educators behind our MSc Medical programs.',
      items: [
        {
          name: 'Anatomy',
          faculty: [
            'Dr. Neeta Chabra — Department of Anatomy — Expert anatomist; published research on the glenoid cavity and suprascapular notch of the shoulder joint. Active in departmental and college administration.',
            "Dr. Matangeshwar Nath — Professor, Department of Anatomy — MBBS (JLNMCH Bhagalpur, 2004) · MS (RIMS Ranchi, 2013) · 11 years of experience",
            'Dr. Shashi Kiran Shukla — Associate Professor, Department of Anatomy — MBBS (MLB Medical College, 1978) · MD (Kerala University, 2014) · 10 years of experience post-MD',
            'Dr. M. Santosh Kumar Naik — Department of Anatomy — MBBS (Great Eastern Medical School & Hospital, 2019) · MD (GMC Guntur, 2022)',
          ].join('\n'),
        },
        {
          name: 'Physiology',
          faculty: [
            'Prof. Dr. Jayanti Singh — Professor, Department of Physiology — MBBS (Sarojini Naidu Medical College, Agra, 2004) · MD (Santosh Medical College, Ghaziabad, 2013) · 11 years of experience post-MD',
            "Dr. Sanjay Nagar — Associate Professor, Department of Physiology — MBBS (King George's Medical College, Lucknow, 1992) · MD (Santosh Medical College, 2012) · 12 years of experience post-MD",
            'Dr. Amit Singh Nirawal — Associate Professor, Department of Physiology — MBBS (LLRM Medical College, Meerut, 2004) · MD (Santosh Medical College, 2012) · 12 years of experience post-MD',
            'Dr. Anil Kumar — Assistant Professor, Department of Physiology — MBBS (Tajik Abuali ibn Sino State Medical University, 2003) · MD (Santosh Medical College) · Vast experience post-MD',
            'Dr. R. Rukmini Sharma — Assistant Professor, Department of Physiology — BSc (K.R.G. College, 2006) · MSc & PhD (SNMC Jodhpur) · Vast experience post-MSc',
          ].join('\n'),
        },
        {
          name: 'Biochemistry',
          faculty: [
            'Dr. Sandeep Kumar Sharma — Professor, Department of Biochemistry — MBBS (MGM Medical College, Indore, 2001) · MD (Dr. D.Y. Patil Vidyapeeth, Pune, 2010) · 14 years of experience post-MD',
            'Dr. Nitin Agrawal — Associate Professor, Department of Biochemistry — MBBS (GRMC, 2006) · MD (VMMC, 2014) · 10 years of experience post-MD',
            'Dr. Ashraf Ali — Assistant Professor, Department of Biochemistry — MBBS (State University Ukraine, 2013) · MD (Government Medical College, Patiala, 2018) · 6 years of experience post-MD',
          ].join('\n'),
        },
        {
          name: 'Microbiology',
          faculty: [
            'Dr. Chittareddi Devika Rani — Professor, Department of Microbiology — MBBS (KMC Kurnool, 1985) · MD (GMC Hyderabad, 1999) · 25 years of experience post-MD',
            'Dr. Shalini Gupta — Associate Professor, Department of Microbiology — MBBS (HIMS Dehradun, 2005) · MD (HIMS Dehradun, 2015) · 9 years of experience post-MD',
            'Dr. Shweta Sharma — Associate Professor, Department of Microbiology — MBBS (Calcutta National Medical College, 1997) · MD (HIMS Dehradun, 2016) · 25 years of experience post-MD',
            'Dr. Vaibhav Gupta — Associate Professor, Department of Microbiology — MBBS (JNMC Aligarh, 2009) · MD (JNMC Aligarh, 2015) · 9 years of experience post-MD',
            'Dr. Brajesh Kumar — Associate Professor, Department of Microbiology — MBBS (Darbhanga Medical College, 2011) · MD (JNMC Aligarh, 2020) · 4 years of experience post-MD',
            'Dr. Ranjan Kumar — Associate Professor, Department of Microbiology — MBBS (Darbhanga Medical College, 2008) · MD (JNMC Aligarh, 2020) · 4 years of experience post-MD',
          ].join('\n'),
        },
      ],
    },
  },
  {
    key: 'academics-assessment-system',
    label: 'Assessment System',
    live: true,
    hint: 'Academics — the internal-assessment and attendance/pass-criteria explainer text.',
    icon: 'clipboard-check',
    color: 'blue',
    textBlockFields: [
      { key: 'overviewText', label: 'Assessment Framework Overview', rows: 4 },
      { key: 'internalAssessmentText', label: 'What Counts Toward Internal Assessment', rows: 4 },
      { key: 'attendanceText', label: 'Attendance & Passing Requirements', rows: 6 },
    ],
    imageFields: [],
    defaults: {
      heading: 'Assessment System',
      subheading: 'How MSc Medical students are evaluated, from internal assessments through university examinations.',
      textBlocks: {
        overviewText:
          'Student performance is assessed through a combination of internal assessment (day-to-day evaluation through assignments, seminar presentations, case studies, practical proficiency, and written tests) and end-of-semester university examinations covering theory and practical/viva components.',
        internalAssessmentText:
          'Internal assessment is based on day-to-day evaluation of how students participate in the learning process. This includes assignments, seminar preparation, case presentations, case studies and problem-solving exercises, participation in community health projects, and demonstrated proficiency in a practical skill or small research project.',
        attendanceText:
          'A minimum attendance of 75% in theory and 80% in practical/lab sessions is required for eligibility to sit for semester examinations. Students must secure at least 50% marks in university-conducted examinations, assessed separately in theory and practical, to be declared as passed in a subject.\n\nWhere a subject includes more than one paper, a student must secure at least 40% marks in each paper individually, along with a minimum of 50% marks in aggregate across both papers, to pass that subject.',
      },
    },
  },
  {
    key: 'academics-exam-schedule',
    label: 'Exam Schedule',
    live: true,
    hint: 'Academics — the term-wise exam pattern explainer text.',
    icon: 'calendar',
    color: 'gold',
    textBlockFields: [
      { key: 'scheduleText', label: 'Exam Schedule Overview', rows: 5 },
    ],
    imageFields: [],
    defaults: {
      heading: 'Exam Schedule',
      subheading: 'A term-wise overview of internal and university examinations across all three phases.',
      textBlocks: {
        scheduleText:
          "Examinations are held at the end of each academic phase rather than on a fixed calendar — each phase's university exam follows the completion of that phase's required theory and practical training. A detailed semester-by-semester exam calendar for the MSc programs will be published here once finalized.",
      },
    },
  },
  {
    key: 'academics-curriculum',
    label: 'Curriculum',
    live: true,
    hint: 'Academics — the MSc programme structure and phase-by-phase explainer text.',
    icon: 'book',
    color: 'purple',
    textBlockFields: [
      { key: 'overviewText', label: 'Programme Structure Overview', rows: 4 },
      { key: 'phaseStructureText', label: 'How the Phases Build on Each Other', rows: 5 },
    ],
    imageFields: [],
    defaults: {
      heading: 'Curriculum',
      subheading: 'An NMC CBME-based curriculum structured across three academic phases.',
      textBlocks: {
        overviewText:
          'The MSc curriculum at SKS International University is structured to build strong theoretical foundations before moving into specialized, research-oriented coursework. Each program is divided into core theory papers, laboratory/practical training, and a dissertation or research project component in the final semester — following the same integration of classroom learning and hands-on lab work that defines all SKS International University programs.',
        phaseStructureText:
          'SKS-affiliated medical programs follow a phased structure. Phase I — the foundational phase — spans roughly 13 months (preceded by a one-month Foundation Course) and covers core subjects: Human Anatomy, Physiology, Biochemistry, Introduction to Community Medicine, and Professional Development (attitude, ethics, and communication). This is the same foundational grounding that anchors all four MSc Medical specializations — Anatomy, Physiology, Biochemistry, and Microbiology — before students move into the more specialized, research-oriented coursework of later phases.',
      },
    },
  },
  {
    key: 'academics-teaching-methodology',
    label: 'Teaching Methodology',
    live: true,
    hint: 'Academics — pedagogy overview, the Medical Education Unit text, and the teaching-methods card grid.',
    icon: 'presentation',
    color: 'rose',
    textBlockFields: [
      { key: 'pedagogyText', label: 'Pedagogy Overview', rows: 4 },
      { key: 'medicalEducationUnitText', label: 'Medical Education Unit', rows: 4 },
    ],
    imageFields: [],
    itemsShape: 'step',
    defaults: {
      heading: 'Teaching Methodology',
      subheading: 'A blend of classroom instruction, hands-on practicals, and hospital-integrated clinical exposure.',
      textBlocks: {
        pedagogyText:
          'Teaching across all MSc Medical programs is lecture-based, supported by dedicated seminar halls and AV aid rooms, and reinforced through lab-based practical sessions. Faculty lead case studies and small-group discussions that connect classroom learning to real clinical and laboratory practice.',
        medicalEducationUnitText:
          "SKS International University's Medical Education Unit is the cornerstone of competency-based medical training, aligned with global teaching standards. Under the guidance of dedicated faculty, the unit focuses on effective pedagogy, sound research methodology, and the continuous enrichment of medical studies — supporting both students and faculty members.",
      },
      items: [
        { title: 'Didactic Lectures', description: 'Structured lectures covering core theoretical concepts, delivered by faculty in dedicated AV aid rooms using multimedia and interactive teaching aids.' },
        { title: 'Practical & Laboratory Sessions', description: 'Hands-on sessions in dedicated subject laboratories, giving students direct experience with specimens, instruments, and techniques.' },
        { title: 'Case-Based Learning', description: 'Small-group sessions built around real or simulated clinical cases, connecting subject knowledge to practical diagnostic reasoning.' },
        { title: 'Hospital-Integrated Clinical Exposure', description: 'Direct exposure to patient care settings through our affiliated 950-bed multi-specialty hospital, bridging classroom learning and clinical practice.' },
        { title: 'Seminars & Journal Clubs', description: 'Regular student-led seminars and journal clubs, held in our seminar halls, that build presentation skills and keep students current with ongoing research.' },
        { title: 'Formative Assessment & Feedback', description: 'Continuous internal assessments and structured feedback sessions that track progress throughout each phase, not just at final exams.' },
      ],
    },
  },
];

// Merges a page's saved record over its defaults (defaults are the real
// live-page copy, so a first-time editor sees actual content instead of a
// blank form; anything already saved always wins).
function navPageEffective(meta, item) {
  const d = meta.defaults || {};
  return {
    heading: item.heading || d.heading || '',
    subheading: item.subheading || d.subheading || '',
    textBlocks: { ...(d.textBlocks || {}), ...(item.textBlocks || {}) },
    images: { ...(d.images || {}), ...(item.images || {}) },
    items: item.items && item.items.length ? item.items : d.items || [],
  };
}

let navPagesLoaded = false;
let navPagesByKey = {};

async function loadNavPages() {
  document.getElementById('navPageLoading').style.display = 'block';
  try {
    const items = await apiFetch('/api/nav-pages');
    navPagesLoaded = true;
    navPagesByKey = {};
    items.forEach((item) => {
      navPagesByKey[item.pageKey] = item;
    });
    renderNavPages();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    document.getElementById('navPageLoading').style.display = 'none';
  }
}

function renderNavPages() {
  const list = document.getElementById('navPageList');
  list.innerHTML = '';

  NAV_PAGES.forEach((meta) => {
    const item = navPagesByKey[meta.key] || {};
    const card = document.createElement('div');
    card.className = 'theme-card';

    card.innerHTML = `
      <div class="theme-icon-chip ${meta.color}">${NAV_PAGE_ICONS[meta.icon] || ''}</div>
      <div class="theme-card-title">${escapeHtml(meta.label)}</div>
      <div class="theme-status ${meta.live ? 'live' : 'pending'}">
        <span class="dot"></span>${meta.live ? 'Live on site' : 'Not yet wired'}
      </div>
      <p class="theme-card-desc">${escapeHtml(meta.hint)}</p>
      <button class="btn btn-pill btn-small" data-action="edit">Edit</button>
    `;

    card.querySelector('[data-action="edit"]').onclick = () => openNavPageModal(meta, item);

    list.appendChild(card);
  });
}

document.getElementById('navPageRefresh').addEventListener('click', loadNavPages);

// ---------- Navbar Pages: shared edit modal ----------
const navPageModalOverlay = document.getElementById('navPageModalOverlay');
const navPageModalEl = document.getElementById('navPageModal');

function closeNavPageModal() {
  navPageModalOverlay.classList.add('hidden');
  navPageModalEl.innerHTML = '';
}

navPageModalOverlay.addEventListener('click', (e) => {
  if (e.target === navPageModalOverlay) closeNavPageModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !navPageModalOverlay.classList.contains('hidden')) closeNavPageModal();
});

function openNavPageModal(meta, item) {
  const eff = navPageEffective(meta, item);

  navPageModalEl.innerHTML = `
    <div class="modal-head">
      <div>
        <h2>${escapeHtml(meta.label)}</h2>
        <p class="modal-sub">${meta.live ? 'Live on site' : 'Not yet wired to the site'} &middot; ${escapeHtml(meta.hint)}</p>
      </div>
      <button type="button" class="modal-close" data-action="close" aria-label="Close">&times;</button>
    </div>

    <div class="modal-body">
      <label>Page Heading</label>
      <input type="text" data-field="heading" value="${escapeHtml(eff.heading)}">
      <label>Subheading / Tagline</label>
      <input type="text" data-field="subheading" value="${escapeHtml(eff.subheading)}">

      ${meta.textBlockFields.map((f) => `
        <label>${escapeHtml(f.label)}</label>
        <textarea rows="${f.rows || 4}" data-textblock-field="${f.key}">${escapeHtml(eff.textBlocks[f.key] || '')}</textarea>
      `).join('')}

      ${meta.imageFields.map((f) => `
        <label>${escapeHtml(f.label)}</label>
        <input type="file" data-image-file="${f.key}" accept="image/*">
        <input type="hidden" data-image-field="${f.key}" value="${escapeHtml(eff.images[f.key] || '')}">
        ${eff.images[f.key] ? `<img class="image-preview" src="${escapeHtml(eff.images[f.key])}" alt="">` : ''}
      `).join('')}

      ${meta.itemsShape ? `
        <label>${escapeHtml(meta.label)} Items</label>
        <div class="theme-items-list" data-items-shape="${meta.itemsShape}">
          ${eff.items.map((it) => buildItemRowHtml(meta.itemsShape, it)).join('')}
        </div>
        <button type="button" class="btn btn-secondary btn-small" data-action="add-item">+ Add Item</button>
      ` : ''}
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary btn-small" data-action="cancel">Cancel</button>
      <button type="button" class="btn btn-pill btn-small" data-action="save">Save Changes</button>
    </div>
  `;

  navPageModalOverlay.classList.remove('hidden');

  navPageModalEl.querySelector('[data-action="close"]').onclick = closeNavPageModal;
  navPageModalEl.querySelector('[data-action="cancel"]').onclick = closeNavPageModal;

  const itemsList = navPageModalEl.querySelector('.theme-items-list');
  function wireRemoveButtons() {
    itemsList.querySelectorAll('[data-action="remove-item"]').forEach((btn) => {
      btn.onclick = () => btn.closest('.theme-item-row').remove();
    });
  }
  if (itemsList) {
    wireRemoveButtons();
    navPageModalEl.querySelector('[data-action="add-item"]').onclick = () => {
      itemsList.insertAdjacentHTML('beforeend', buildItemRowHtml(meta.itemsShape, {}));
      wireRemoveButtons();
    };
  }

  navPageModalEl.querySelector('[data-action="save"]').onclick = async () => {
    const saveBtn = navPageModalEl.querySelector('[data-action="save"]');
    const originalLabel = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const newTextBlocks = {};
      meta.textBlockFields.forEach((f) => {
        newTextBlocks[f.key] = navPageModalEl.querySelector(`[data-textblock-field="${f.key}"]`).value.trim();
      });

      const newImages = {};
      for (const f of meta.imageFields) {
        let url = navPageModalEl.querySelector(`[data-image-field="${f.key}"]`).value;
        const fileInput = navPageModalEl.querySelector(`[data-image-file="${f.key}"]`);
        if (fileInput.files.length) {
          const formData = new FormData();
          formData.append('image', fileInput.files[0]);
          const uploaded = await apiFetch('/api/upload', { method: 'POST', body: formData });
          url = uploaded.url;
        }
        newImages[f.key] = url;
      }

      const body = {
        heading: navPageModalEl.querySelector('[data-field="heading"]').value.trim(),
        subheading: navPageModalEl.querySelector('[data-field="subheading"]').value.trim(),
        textBlocks: newTextBlocks,
        images: newImages,
      };

      if (meta.itemsShape) {
        body.items = Array.from(itemsList.querySelectorAll('.theme-item-row')).map((row) =>
          readItemRow(meta.itemsShape, row)
        );
      }

      await apiFetch(`/api/nav-pages/${meta.key}`, { method: 'PUT', body: JSON.stringify(body) });
      toast(`${meta.label} saved`);
      closeNavPageModal();
      loadNavPages();
    } catch (err) {
      toast(err.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = originalLabel;
    }
  };
}

// ============================================================
// PROGRAMS
// ============================================================
let programsLoaded = false;
let programItems = [];

function programFieldsHtml(item) {
  item = item || {};
  return `
    <label>Course Name</label>
    <input type="text" data-field="name" value="${escapeHtml(item.name || '')}" placeholder="e.g. MSc Medical Microbiology">
    <label>Description</label>
    <textarea rows="3" data-field="description" placeholder="Short program overview">${escapeHtml(item.description || '')}</textarea>
    <label>Duration</label>
    <input type="text" data-field="duration" value="${escapeHtml(item.duration || '')}" placeholder="e.g. 3 Academic Years (Phase I, II & III)">
    <label>Eligibility</label>
    <textarea rows="2" data-field="eligibility" placeholder="Eligibility text">${escapeHtml(item.eligibility || '')}</textarea>
    <label>Core Syllabus <span class="content-key">(one item per line)</span></label>
    <textarea rows="4" data-field="coreSyllabus">${escapeHtml((item.coreSyllabus || []).join('\n'))}</textarea>
    <label>Career Scope <span class="content-key">(one item per line)</span></label>
    <textarea rows="4" data-field="careerScope">${escapeHtml((item.careerScope || []).join('\n'))}</textarea>
    <label>Primary Recruiters</label>
    <input type="text" data-field="primaryRecruiters" value="${escapeHtml(item.primaryRecruiters || '')}">
    <label>Average Starting Package</label>
    <input type="text" data-field="avgPackage" value="${escapeHtml(item.avgPackage || '')}" placeholder="e.g. INR 4.5 – 20 LPA">
    <label>Image</label>
    <input type="file" data-field="imageFile" accept="image/*">
    <input type="hidden" data-field="imageUrl" value="${escapeHtml(item.imageUrl || '')}">
    ${item.imageUrl ? `<img class="image-preview" src="${escapeHtml(item.imageUrl)}" alt="">` : ''}
    <label class="checkbox-label"><input type="checkbox" data-field="isActive" ${item.isActive === false ? '' : 'checked'}> Active (shown on the live site)</label>
  `;
}

async function readProgramFields(container) {
  let imageUrl = container.querySelector('[data-field="imageUrl"]').value;
  const fileInput = container.querySelector('[data-field="imageFile"]');

  if (fileInput.files.length) {
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    const uploaded = await apiFetch('/api/upload', { method: 'POST', body: formData });
    imageUrl = uploaded.url;
  }

  const splitLines = (val) => val.split('\n').map((s) => s.trim()).filter(Boolean);

  return {
    name: container.querySelector('[data-field="name"]').value.trim(),
    description: container.querySelector('[data-field="description"]').value.trim(),
    duration: container.querySelector('[data-field="duration"]').value.trim(),
    eligibility: container.querySelector('[data-field="eligibility"]').value.trim(),
    coreSyllabus: splitLines(container.querySelector('[data-field="coreSyllabus"]').value),
    careerScope: splitLines(container.querySelector('[data-field="careerScope"]').value),
    primaryRecruiters: container.querySelector('[data-field="primaryRecruiters"]').value.trim(),
    avgPackage: container.querySelector('[data-field="avgPackage"]').value.trim(),
    imageUrl,
    isActive: container.querySelector('[data-field="isActive"]').checked,
  };
}

async function loadPrograms() {
  document.getElementById('programLoading').style.display = 'block';
  document.getElementById('programEmpty').style.display = 'none';
  try {
    programItems = await apiFetch('/api/programs');
    programsLoaded = true;
    renderPrograms();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    document.getElementById('programLoading').style.display = 'none';
  }
}

function renderPrograms() {
  const list = document.getElementById('programList');
  list.innerHTML = '';

  document.getElementById('programCount').textContent = programItems.length;

  if (!programItems.length) {
    document.getElementById('programEmpty').style.display = 'block';
  }

  programItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'program-summary-card';
    card.innerHTML = `
      <div class="program-card-top">
        <div>
          <div class="program-card-title">${escapeHtml(item.name)}</div>
          <div class="program-card-meta">Order: ${item.order} &middot; <span class="status-pill ${item.isActive ? 'active' : 'inactive'}">${item.isActive ? 'Active' : 'Inactive'}</span></div>
        </div>
        <div class="reorder-buttons">
          <button class="btn btn-secondary btn-small" data-action="up" ${index === 0 ? 'disabled' : ''} title="Move up">&uarr;</button>
          <button class="btn btn-secondary btn-small" data-action="down" ${index === programItems.length - 1 ? 'disabled' : ''} title="Move down">&darr;</button>
        </div>
      </div>
      ${item.duration ? `<span class="program-duration-badge">${escapeHtml(item.duration)}</span>` : ''}
      <p class="program-card-desc">${escapeHtml(item.description || '')}</p>
      <div class="program-card-footer">
        <button class="btn btn-pill btn-small" data-action="edit">Edit</button>
        <label class="switch" title="${item.isActive ? 'Active — shown on the live site' : 'Inactive — hidden from the live site'}">
          <input type="checkbox" data-action="toggle-active" ${item.isActive ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <button class="icon-btn-danger" data-action="delete" title="Delete program">&#128465;</button>
      </div>
    `;

    card.querySelector('[data-action="edit"]').onclick = () => openProgramModal(item);

    card.querySelector('[data-action="toggle-active"]').onchange = async (e) => {
      const checked = e.target.checked;
      try {
        await apiFetch(`/api/programs/${item._id}`, { method: 'PATCH', body: JSON.stringify({ isActive: checked }) });
        toast(checked ? 'Program activated' : 'Program deactivated');
        loadPrograms();
      } catch (err) {
        toast(err.message, 'error');
        e.target.checked = !checked;
      }
    };

    card.querySelector('[data-action="delete"]').onclick = async () => {
      if (!confirm(`Delete "${item.name}"?`)) return;
      try {
        await apiFetch(`/api/programs/${item._id}`, { method: 'DELETE' });
        toast('Program deleted');
        loadPrograms();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    const upBtn = card.querySelector('[data-action="up"]');
    const downBtn = card.querySelector('[data-action="down"]');
    if (!upBtn.disabled) upBtn.onclick = () => swapProgramOrder(index, index - 1);
    if (!downBtn.disabled) downBtn.onclick = () => swapProgramOrder(index, index + 1);

    list.appendChild(card);
  });

  const addCard = document.createElement('div');
  addCard.className = 'program-add-card';
  addCard.textContent = '+ Add Program';
  addCard.onclick = () => openProgramModal(null);
  list.appendChild(addCard);
}

async function swapProgramOrder(indexA, indexB) {
  const a = programItems[indexA];
  const b = programItems[indexB];
  try {
    await Promise.all([
      apiFetch(`/api/programs/${a._id}`, { method: 'PATCH', body: JSON.stringify({ order: b.order }) }),
      apiFetch(`/api/programs/${b._id}`, { method: 'PATCH', body: JSON.stringify({ order: a.order }) }),
    ]);
    toast('Order updated');
    loadPrograms();
  } catch (err) {
    toast(err.message, 'error');
  }
}

document.getElementById('programRefresh').addEventListener('click', loadPrograms);

// ---------- Programs: shared edit modal ----------
const programModalOverlay = document.getElementById('programModalOverlay');
const programModalEl = document.getElementById('programModal');

function closeProgramModal() {
  programModalOverlay.classList.add('hidden');
  programModalEl.innerHTML = '';
}

programModalOverlay.addEventListener('click', (e) => {
  if (e.target === programModalOverlay) closeProgramModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !programModalOverlay.classList.contains('hidden')) closeProgramModal();
});

function openProgramModal(item) {
  const isNew = !item;

  programModalEl.innerHTML = `
    <div class="modal-head">
      <div>
        <h2>${isNew ? 'Add Program' : escapeHtml(item.name)}</h2>
        <p class="modal-sub">${isNew ? 'Create a new MSc course card for the homepage.' : 'Edit this course’s details.'}</p>
      </div>
      <button type="button" class="modal-close" data-action="close" aria-label="Close">&times;</button>
    </div>

    <div class="modal-body">
      ${programFieldsHtml(item)}
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary btn-small" data-action="cancel">Cancel</button>
      <button type="button" class="btn btn-pill btn-small" data-action="save">${isNew ? 'Add Program' : 'Save Changes'}</button>
    </div>
  `;

  programModalOverlay.classList.remove('hidden');

  programModalEl.querySelector('[data-action="close"]').onclick = closeProgramModal;
  programModalEl.querySelector('[data-action="cancel"]').onclick = closeProgramModal;

  programModalEl.querySelector('[data-action="save"]').onclick = async () => {
    const saveBtn = programModalEl.querySelector('[data-action="save"]');
    const originalLabel = saveBtn.textContent;

    if (isNew && !programModalEl.querySelector('[data-field="name"]').value.trim()) {
      toast('Course name is required', 'error');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    try {
      const body = await readProgramFields(programModalEl);
      if (isNew) {
        await apiFetch('/api/programs', { method: 'POST', body: JSON.stringify(body) });
        toast('Program added');
      } else {
        await apiFetch(`/api/programs/${item._id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast('Program saved');
      }
      closeProgramModal();
      loadPrograms();
    } catch (err) {
      toast(err.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = originalLabel;
    }
  };
}

// Load the first panel's data on page load
loadEnquiries();
