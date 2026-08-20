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
