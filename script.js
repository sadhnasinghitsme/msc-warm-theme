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
