/* ============================================================
   HELAX AI — script.js
   Vanilla JavaScript — no frameworks, no dependencies
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Shared preference: reduced motion ---------- */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. Sticky navbar — the hero panel has its own inner nav, so
        the fixed header stays hidden on desktop until the panel
        scrolls out of view; on mobile it is always visible.
     ============================================================ */
  function initStickyHeader() {
    var header = document.getElementById('siteHeader');
    var heroPanel = document.getElementById('heroPanel');
    if (!header) return;

    var update = function () {
      var show;
      if (window.innerWidth >= 1024 && heroPanel) {
        show = heroPanel.getBoundingClientRect().bottom < 90;
      } else {
        show = true;
      }
      header.classList.toggle('header-show', show);
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ============================================================
     2. Mobile navigation — animated menu
     ============================================================ */
  function initMobileMenu() {
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    var links = menu.querySelectorAll('a');

    function setMenu(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      menu.classList.toggle('open', open);
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('menu-open', open);

      if (open) {
        // Stagger the entrance of each mobile link
        links.forEach(function (link, i) {
          link.style.transitionDelay = (60 + i * 45) + 'ms';
        });
        var first = menu.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      } else {
        links.forEach(function (link) {
          link.style.transitionDelay = '0ms';
        });
      }
    }

    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close when a navigation link is clicked
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        setMenu(false);
      });
    });

    // Close on Escape, return focus to the toggle button
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Reset if the viewport grows to desktop size
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && menu.classList.contains('open')) {
        setMenu(false);
      }
    });
  }

  /* ============================================================
     3. Reveal-on-scroll — IntersectionObserver + stagger
     ============================================================ */
  function initReveal() {
    var revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    // Give grid children a cascading delay
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        var inner = child.classList.contains('reveal') ? child : child.querySelector('.reveal');
        if (inner) inner.style.transitionDelay = (i * 80) + 'ms';
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================================================
     4. Active navigation state — highlight current section
     ============================================================ */
  function initActiveNav() {
    if (!('IntersectionObserver' in window)) return;

    var sections = document.querySelectorAll('main section[id]');
    var navLinks = document.querySelectorAll('.nav-link, .mobile-link');
    if (!sections.length || !navLinks.length) return;

    var linkFor = function (id) {
      var found = [];
      navLinks.forEach(function (link) {
        if (link.getAttribute('href') === '#' + id) found.push(link);
      });
      return found;
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.remove('is-active');
        });
        linkFor(entry.target.id).forEach(function (link) {
          link.classList.add('is-active');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ============================================================
     5. FAQ accordion — one open at a time, keyboard accessible
     ============================================================ */
  function initFaq() {
    var items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    function close(item) {
      var btn = item.querySelector('.faq-q');
      var panel = item.querySelector('.faq-a');
      item.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = '0px';
    }

    function open(item) {
      var btn = item.querySelector('.faq-q');
      var panel = item.querySelector('.faq-a');
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }

    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        items.forEach(close);
        if (!isOpen) open(item);
      });
    });

    // Arrow-key navigation between questions (WAI-ARIA accordion pattern)
    var list = document.getElementById('faqList');
    if (list) {
      list.addEventListener('keydown', function (e) {
        var buttons = Array.prototype.slice.call(list.querySelectorAll('.faq-q'));
        var index = buttons.indexOf(document.activeElement);
        if (index === -1) return;

        var target = -1;
        if (e.key === 'ArrowDown') target = (index + 1) % buttons.length;
        else if (e.key === 'ArrowUp') target = (index - 1 + buttons.length) % buttons.length;
        else if (e.key === 'Home') target = 0;
        else if (e.key === 'End') target = buttons.length - 1;

        if (target !== -1) {
          e.preventDefault();
          buttons[target].focus();
        }
      });
    }

    // Keep open panels sized correctly on resize / font load
    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        if (item.classList.contains('open')) {
          var panel = item.querySelector('.faq-a');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  }

  /* ============================================================
     6. Helax Magic demo — simulated generation flow
     (UI demonstration only; no real API is connected)
     ============================================================ */
  function initMagicDemo() {
    var input = document.getElementById('magicPrompt');
    var button = document.getElementById('magicGenerate');
    var status = document.getElementById('magicStatus');
    var tiles = document.querySelectorAll('.magic-tile');
    if (!input || !button || !status || !tiles.length) return;

    var isGenerating = false;

    // Deterministic-feeling but varied gradient "artworks"
    var artworks = [
      'radial-gradient(circle at 25% 20%, #d9f99d, #84cc16 55%, #3f6212)',
      'linear-gradient(135deg, #34d399, #65a30d 55%, #065f46)',
      'conic-gradient(from 40deg at 60% 40%, #10b981, #84cc16, #34d399, #10b981)',
      'radial-gradient(circle at 75% 25%, #bef264, #4d7c0f 55%, #1a2e05)',
      'linear-gradient(160deg, #101806, #65a30d 50%, #bef264)',
      'conic-gradient(from 200deg at 30% 70%, #34d399, #1a2e05, #a3e635, #34d399)',
      'linear-gradient(120deg, #4d7c0f, #10b981 60%, #99f6e4)',
      'radial-gradient(circle at 50% 80%, #a3e635, #3f6212 60%, #101806)'
    ];

    var stages = [
      'Analyzing your prompt…',
      'Dreaming up concepts…',
      'Composing visuals…',
      'Polishing the results…'
    ];

    function pickArtworks() {
      var pool = artworks.slice();
      var picked = [];
      while (picked.length < tiles.length && pool.length) {
        picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      return picked;
    }

    function resetTiles() {
      tiles.forEach(function (tile) {
        tile.classList.remove('done');
        var art = tile.querySelector('.tile-art');
        var label = tile.querySelector('.tile-label');
        art.style.background = '';
        label.textContent = 'Awaiting prompt';
      });
    }

    function generate() {
      if (isGenerating) return;
      isGenerating = true;

      var prompt = input.value.trim();
      button.disabled = true;
      button.textContent = 'Generating…';
      status.classList.add('busy');
      resetTiles();

      var arts = pickArtworks();
      var stepDelay = prefersReducedMotion ? 60 : 480;

      stages.forEach(function (message, i) {
        setTimeout(function () {
          status.textContent = message;

          if (i < tiles.length) {
            var tile = tiles[i];
            var art = tile.querySelector('.tile-art');
            var label = tile.querySelector('.tile-label');
            art.style.background = arts[i];
            label.textContent = 'Concept ' + (i + 1) + (prompt ? ' — “' + (prompt.length > 26 ? prompt.slice(0, 26) + '…' : prompt) + '”' : '');
            tile.classList.add('done');
          }

          if (i === stages.length - 1) {
            setTimeout(function () {
              status.classList.remove('busy');
              status.textContent = '4 concepts ready — demo visuals generated locally in your browser.';
              button.disabled = false;
              button.textContent = 'Generate';
              isGenerating = false;
            }, stepDelay);
          }
        }, i * stepDelay);
      });
    }

    button.addEventListener('click', generate);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        generate();
      }
    });
  }

  /* ============================================================
     Boot
     ============================================================ */
  function init() {
    initStickyHeader();
    initMobileMenu();
    initReveal();
    initActiveNav();
    initFaq();
    initMagicDemo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
