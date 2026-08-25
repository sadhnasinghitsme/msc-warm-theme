/* ===== PRIMARY NAV (About Us dropdown — click/tap on mobile & touch, hover-enhanced on desktop via CSS) ===== */
(function(){
  var items = Array.prototype.slice.call(document.querySelectorAll('.nav-item.has-dropdown'));
  if(!items.length) return;

  function closeAll(){
    items.forEach(function(item){
      item.classList.remove('open');
      var trigger = item.querySelector('.dropdown-trigger');
      if(trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  items.forEach(function(item){
    var trigger = item.querySelector('.dropdown-trigger');
    if(!trigger) return;
    trigger.addEventListener('click', function(e){
      e.preventDefault();
      var isOpen = item.classList.contains('open');
      closeAll();
      if(!isOpen){
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', function(e){
    var openItem = items.filter(function(item){ return item.classList.contains('open'); })[0];
    if(openItem && !openItem.contains(e.target)) closeAll();
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeAll();
  });

  document.addEventListener('click', function(e){
    if(e.target.closest('.dropdown-menu a')) closeAll();
  });
})();

/* ===== ACTIVE NAV LINK (terracotta underline on the current page's nav item) ===== */
(function(){
  var path = window.location.pathname.replace(/index\.html$/, '');
  if(path.length > 1 && path.slice(-1) !== '/') path += '/';

  var topLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav > .nav-list > .nav-item > a.nav-link'));
  topLinks.forEach(function(link){
    if(link.getAttribute('href') === path) link.classList.add('is-active');
  });

  var dropdownItems = Array.prototype.slice.call(document.querySelectorAll('.nav-item.has-dropdown'));
  dropdownItems.forEach(function(item){
    var links = Array.prototype.slice.call(item.querySelectorAll('.dropdown-menu a'));
    var match = links.some(function(a){ return a.getAttribute('href') === path; });
    if(match){
      var trigger = item.querySelector('.dropdown-trigger');
      if(trigger) trigger.classList.add('is-active');
    }
  });
})();

/* ===== THEME SWITCHER (Light / Warm / Dusk / Dark, persisted to localStorage) ===== */
(function(){
  var STORAGE_KEY = 'sks-theme';
  var VALID_THEMES = ['light', 'soft', 'dusk', 'dark'];
  var root = document.documentElement;
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.theme-toggle-btn'));
  if(!buttons.length) return;

  function applyTheme(theme){
    if(VALID_THEMES.indexOf(theme) === -1) theme = 'light';
    if(theme === 'light'){
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    buttons.forEach(function(btn){
      var isActive = btn.getAttribute('data-theme-choice') === theme;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var theme = btn.getAttribute('data-theme-choice');
      applyTheme(theme);
      localStorage.setItem(STORAGE_KEY, theme);
    });
  });

  var saved = localStorage.getItem(STORAGE_KEY);
  applyTheme(VALID_THEMES.indexOf(saved) !== -1 ? saved : 'light');
})();

(function(){
  var carousel = document.querySelector('.hero-carousel');
  if(!carousel) return;

  var slides = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-slide'));
  var dots = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-dots button'));
  var prevBtn = carousel.querySelector('.carousel-arrow.prev');
  var nextBtn = carousel.querySelector('.carousel-arrow.next');
  var current = 0;
  var AUTOPLAY_MS = 5000;
  var timer = null;

  function goTo(index){
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
  }

  function next(){ goTo(current + 1); }
  function prev(){ goTo(current - 1); }

  function startAutoplay(){
    stopAutoplay();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay(){
    if(timer){ clearInterval(timer); timer = null; }
  }

  nextBtn.addEventListener('click', function(){ next(); startAutoplay(); });
  prevBtn.addEventListener('click', function(){ prev(); startAutoplay(); });
  dots.forEach(function(dot, i){
    dot.addEventListener('click', function(){ goTo(i); startAutoplay(); });
  });

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
})();

/* ===== SCROLL-TRIGGERED POPUP (shows once, after scrolling past hero + short delay) ===== */
(function(){
  var popup = document.getElementById('scrollPopup');
  var closeBtn = document.getElementById('scrollPopupClose');
  if(!popup) return;

  var SCROLL_THRESHOLD = window.innerHeight * 0.6; // how far down the visitor must scroll
  var DELAY_MS = 2000; // wait this long after crossing the threshold before showing
  var shown = false;
  var delayTimer = null;

  function openPopup(){
    if(shown) return;
    shown = true;
    popup.classList.add('is-open');
  }
  function closePopup(){
    popup.classList.remove('is-open');
  }

  function onScroll(){
    if(shown) return;
    if(window.scrollY > SCROLL_THRESHOLD){
      window.removeEventListener('scroll', onScroll);
      delayTimer = setTimeout(openPopup, DELAY_MS);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  closeBtn.addEventListener('click', closePopup);
  popup.addEventListener('click', function(e){
    if(e.target === popup) closePopup(); // click outside the box closes it
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closePopup();
  });
})();

/* ===== GALLERY: filter tabs + lightbox ===== */
(function(){
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.gallery-filters button'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  if(!filterBtns.length || !items.length) return;

  filterBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      filterBtns.forEach(function(b){ b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var filter = btn.getAttribute('data-filter');
      items.forEach(function(item){
        var show = filter === 'all' || item.getAttribute('data-category') === filter;
        item.classList.toggle('is-hidden', !show);
      });
    });
  });

  var lightbox = document.getElementById('galleryLightbox');
  var lightboxContent = document.getElementById('lightboxContent');
  var lightboxCaption = document.getElementById('lightboxCaption');
  var lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(item){
    var caption = item.querySelector('.gcap') ? item.querySelector('.gcap').textContent : '';
    var videoFile = item.getAttribute('data-video-file');
    var videoUrl = item.getAttribute('data-video');
    if(videoFile){
      lightboxContent.innerHTML = '<video src="' + videoFile + '" style="width:100%;border-radius:6px;display:block;" controls autoplay playsinline></video>';
    } else if(videoUrl){
      lightboxContent.innerHTML = '<div style="position:relative;width:100%;aspect-ratio:16/9;"><iframe src="' + videoUrl + '" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
    } else {
      var img = item.querySelector('img');
      lightboxContent.innerHTML = '<img src="' + img.src + '" alt="' + img.alt + '">';
    }
    lightboxCaption.textContent = caption;
    lightbox.classList.add('is-open');
  }
  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightboxContent.innerHTML = ''; // stop video playback on close
  }

  items.forEach(function(item){
    item.addEventListener('click', function(){ openLightbox(item); });
  });
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function(e){ if(e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeLightbox(); });
})();

/* ===== ENQUIRY FORMS: POST to backend API ===== */
(function(){
  if(typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL) return;
  var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-enquiry-form]'));
  if(!forms.length) return;

  function setStatus(el, message, isError){
    if(!el) return;
    el.textContent = message;
    el.style.color = isError ? '#b3261e' : '#1f7a4d';
  }

  forms.forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();

      var statusEl = form.querySelector('[data-form-status]');
      var nameEl = form.querySelector('[data-field="name"]');
      var phoneEl = form.querySelector('[data-field="phone"]');
      var emailEl = form.querySelector('[data-field="email"]');
      var specEl = form.querySelector('[data-field="specialization"]');
      var submitBtn = form.querySelector('button[type="submit"]');

      var name = nameEl ? nameEl.value.trim() : '';
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';
      var specialization = specEl ? specEl.value : '';
      if(specialization.indexOf('Select') === 0) specialization = '';

      if(!name || !phone){
        setStatus(statusEl, 'Please enter your name and phone number.', true);
        return;
      }

      var payload = {
        name: name,
        phone: phone,
        source: form.getAttribute('data-source') || 'other'
      };
      if(email) payload.email = email;
      if(specialization) payload.specialization = specialization;

      if(submitBtn){
        submitBtn.disabled = true;
        submitBtn.setAttribute('data-original-text', submitBtn.textContent);
        submitBtn.textContent = 'Submitting...';
      }
      setStatus(statusEl, '', false);

      fetch(CONFIG.API_BASE_URL + '/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function(res){
          return res.json()
            .catch(function(){ return {}; })
            .then(function(data){ return { ok: res.ok, data: data }; });
        })
        .then(function(result){
          if(!result.ok){
            throw new Error((result.data && result.data.message) || 'Something went wrong. Please try again.');
          }
          setStatus(statusEl, 'Thank you! Our admission team will contact you shortly.', false);
          form.reset();
        })
        .catch(function(err){
          setStatus(statusEl, err.message || 'Something went wrong. Please try again or call us directly.', true);
        })
        .finally(function(){
          if(submitBtn){
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.getAttribute('data-original-text');
          }
        });
    });
  });
})();

/* ===== DYNAMIC CONTENT: fill in [data-content-key] elements from the admin-editable content API ===== */
(function(){
  if(typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL) return;
  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-content-key]'));
  if(!targets.length) return;

  fetch(CONFIG.API_BASE_URL + '/api/content')
    .then(function(res){
      if(!res.ok) throw new Error('Failed to load content (' + res.status + ')');
      return res.json();
    })
    .then(function(map){
      targets.forEach(function(el){
        var key = el.getAttribute('data-content-key');
        if(!Object.prototype.hasOwnProperty.call(map, key)) return;
        var value = map[key];
        if(value === undefined || value === null || value === '') return;
        if(el.tagName === 'IMG'){
          el.src = value;
        } else {
          el.textContent = value;
        }
      });
    })
    .catch(function(err){
      console.warn('Dynamic content unavailable, using page defaults.', err);
    });
})();

/* ===== THEME SETTINGS: fill in [data-section-key] elements from the admin-editable theme settings API ===== */
function escapeHtmlText(str){
  return String(str == null ? '' : str).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

(function(){
  if(typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL) return;
  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-section-key]'));
  var whyUsGrid = document.getElementById('whyUsCards');
  var processTimeline = document.getElementById('processSteps');
  var clinicalBadges = document.getElementById('clinicalBadges');
  if(!targets.length && !whyUsGrid && !processTimeline && !clinicalBadges) return;

  fetch(CONFIG.API_BASE_URL + '/api/theme-settings/public')
    .then(function(res){
      if(!res.ok) throw new Error('Failed to load theme settings (' + res.status + ')');
      return res.json();
    })
    .then(function(map){
      targets.forEach(function(el){
        var sectionKey = el.getAttribute('data-section-key');
        var section = map[sectionKey];
        if(!section) return;

        var field = el.getAttribute('data-field');
        var extraField = el.getAttribute('data-extra-field');
        var value = extraField ? (section.extra && section.extra[extraField]) : section[field];

        if(value !== undefined && value !== null && value !== ''){
          if(el.getAttribute('data-src-field') === 'true'){
            el.src = value;
          } else if(el.tagName === 'IMG'){
            el.src = value;
          } else {
            el.textContent = value;
          }
        }

        var hrefField = el.getAttribute('data-href-field');
        if(hrefField){
          var hrefValue = section[hrefField];
          if(hrefValue) el.href = hrefValue;
        }
      });

      if(whyUsGrid && map.whyUs && map.whyUs.items && map.whyUs.items.length){
        whyUsGrid.innerHTML = map.whyUs.items.map(function(card){
          return '<div class="feature-card"><img class="feature-card-img" src="' + escapeHtmlText(card.imageUrl) + '" alt="' + escapeHtmlText(card.title) + '" width="400" height="300" loading="lazy"><div class="feature-card-body"><h3>' + escapeHtmlText(card.title) + '</h3><p>' + escapeHtmlText(card.description) + '</p></div></div>';
        }).join('');
      }

      if(processTimeline && map.process && map.process.items && map.process.items.length){
        processTimeline.innerHTML = map.process.items.map(function(step, i){
          return '<div class="tl-step"><div class="tl-num">' + (i + 1) + '</div><h3>' + escapeHtmlText(step.title) + '</h3><p>' + escapeHtmlText(step.description) + '</p></div>';
        }).join('');
      }

      if(clinicalBadges && map.clinical && map.clinical.items && map.clinical.items.length){
        clinicalBadges.innerHTML = map.clinical.items.map(function(badge){
          return '<span class="chip">' + escapeHtmlText(badge.title) + '</span>';
        }).join('');
      }
    })
    .catch(function(err){
      console.warn('Theme settings unavailable, using page defaults.', err);
    });
})();

/* ===== PROGRAMS: rebuild the course-tabs section and eligibility table from the admin-editable programs API ===== */
(function(){
  if(typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL) return;
  var tabLabels = document.getElementById('courseTabLabels');
  var tabPanels = document.getElementById('courseTabPanels');
  var courseTabs = document.getElementById('courseTabs');
  var eligBody = document.getElementById('eligTableBody');
  if(!tabLabels && !eligBody) return;

  fetch(CONFIG.API_BASE_URL + '/api/programs/public')
    .then(function(res){
      if(!res.ok) throw new Error('Failed to load programs (' + res.status + ')');
      return res.json();
    })
    .then(function(programs){
      if(!programs || !programs.length) return;

      if(courseTabs && tabLabels && tabPanels){
        var radiosHtml = programs.map(function(p, i){
          return '<input type="radio" name="tabs" id="t' + (i + 1) + '" class="tab-input"' + (i === 0 ? ' checked' : '') + '>';
        }).join('');

        var labelsHtml = programs.map(function(p, i){
          return '<label for="t' + (i + 1) + '">' + escapeHtmlText(p.name.replace(/^MSc Medical\s*/i, '')) + '</label>';
        }).join('');

        var panelsHtml = programs.map(function(p, i){
          var syllabus = (p.coreSyllabus || []).map(function(s){ return '<li>' + escapeHtmlText(s) + '</li>'; }).join('');
          var career = (p.careerScope || []).map(function(s){ return '<li>' + escapeHtmlText(s) + '</li>'; }).join('');
          return '<div class="tab-panel" id="p' + (i + 1) + '">'
            + '<div class="tab-panel-media"><img class="course-tab-image" src="' + escapeHtmlText(p.imageUrl) + '" alt="' + escapeHtmlText(p.name) + '" loading="lazy"></div>'
            + '<h3>' + escapeHtmlText(p.name) + '</h3>'
            + '<p class="desc">' + escapeHtmlText(p.description) + '</p>'
            + '<div class="course-meta-panel"><p><strong>Duration:</strong> ' + escapeHtmlText(p.duration) + '</p><p><strong>Eligibility:</strong> ' + escapeHtmlText(p.eligibility) + '</p></div>'
            + '<h4 class="sub-head">Core Syllabus</h4><ul class="syllabus-list">' + syllabus + '</ul>'
            + '<h4 class="sub-head">Career Scope</h4><ul class="career-list">' + career + '</ul>'
            + '<div class="course-meta-panel"><p><strong>Primary Recruiters:</strong> ' + escapeHtmlText(p.primaryRecruiters) + '</p><p><strong>Average Starting Package:</strong> ' + escapeHtmlText(p.avgPackage) + '</p></div>'
            + '<a href="#enquiry-form" class="btn btn-gold">Check Eligibility for ' + escapeHtmlText(p.name) + '</a>'
            + '</div>';
        }).join('');

        var oldInputs = courseTabs.querySelectorAll('input.tab-input');
        oldInputs.forEach(function(inp){ inp.remove(); });
        courseTabs.insertAdjacentHTML('afterbegin', radiosHtml);
        tabLabels.innerHTML = labelsHtml;
        tabPanels.innerHTML = panelsHtml;

        // The site's CSS only wires up #t1:checked~#p1 .. #t4:checked~#p4 (see
        // style.css), so it breaks past 4 tabs. Drive visibility from JS
        // instead so this keeps working no matter how many programs exist.
        var radios = Array.prototype.slice.call(courseTabs.querySelectorAll('input.tab-input'));
        var panels = Array.prototype.slice.call(tabPanels.querySelectorAll('.tab-panel'));
        function syncPanels(){
          radios.forEach(function(radio, i){
            if(panels[i]) panels[i].style.display = radio.checked ? 'block' : 'none';
          });
        }
        radios.forEach(function(radio){ radio.addEventListener('change', syncPanels); });
        syncPanels();
      }

      if(eligBody){
        eligBody.innerHTML = programs.map(function(p){
          return '<tr><td>' + escapeHtmlText(p.name) + '</td><td>' + escapeHtmlText(p.eligibility) + '</td><td>' + escapeHtmlText(p.duration) + '</td></tr>';
        }).join('');
      }
    })
    .catch(function(err){
      console.warn('Programs unavailable, using page defaults.', err);
    });
})();
