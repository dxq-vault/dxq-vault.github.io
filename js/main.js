/**
 * dxq-lab — Main JavaScript
 * Lightweight interactions: navigation, scroll effects, reveal animations.
 * No external dependencies. No tracking. No external redirects.
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     DOM Elements
     -------------------------------------------------------------------------- */
  const header = document.querySelector('.header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const navOverlay = document.querySelector('.nav-overlay');
  const navLinks = document.querySelectorAll('.nav__link, [data-scroll]');
  const revealElements = document.querySelectorAll('.reveal');

  /* --------------------------------------------------------------------------
     Header scroll state
     -------------------------------------------------------------------------- */
  function onScroll() {
    if (!header) return;
    header.classList.toggle('header--scrolled', window.scrollY > 20);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --------------------------------------------------------------------------
     Mobile navigation
     -------------------------------------------------------------------------- */
  function closeNav() {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    if (navOverlay) navOverlay.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  function openNav() {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
    if (navOverlay) navOverlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      var isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeNav() : openNav();
    });
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', closeNav);
  }

  /* --------------------------------------------------------------------------
     Smooth scroll for anchor links
     -------------------------------------------------------------------------- */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      e.preventDefault();
      var target = document.querySelector(href);
      if (!target) return;

      closeNav();

      var headerHeight = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* --------------------------------------------------------------------------
     Scroll reveal (Intersection Observer)
     -------------------------------------------------------------------------- */
  if ('IntersectionObserver' in window && revealElements.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* --------------------------------------------------------------------------
     Motion: scroll progress, ambient cursor glow, card tilt
     Static-site / GitHub Pages friendly (vanilla JS only)
     -------------------------------------------------------------------------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  if (!reduceMotion) {
    var progressBar = document.querySelector('.scroll-progress__bar');
    var hero = document.querySelector('.hero');
    var tiltCards = document.querySelectorAll('.spectrum-card, .catalog-item, .service-card');

    function updateScrollMotion() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      if (progressBar) {
        progressBar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, ratio)) + ')';
      }
      if (hero) {
        var h = Math.max(hero.offsetHeight, 1);
        hero.style.setProperty('--scroll-y', String(Math.min(1, window.scrollY / h)));
      }
    }

    window.addEventListener('scroll', updateScrollMotion, { passive: true });
    updateScrollMotion();

    if (finePointer) {
      document.documentElement.classList.add('has-pointer-glow');

      var glowX = 0.5;
      var glowY = 0.3;
      var targetX = glowX;
      var targetY = glowY;
      var glowRaf = 0;

      function tickGlow() {
        glowX += (targetX - glowX) * 0.12;
        glowY += (targetY - glowY) * 0.12;
        document.documentElement.style.setProperty('--glow-x', (glowX * 100).toFixed(2) + '%');
        document.documentElement.style.setProperty('--glow-y', (glowY * 100).toFixed(2) + '%');
        glowRaf = 0;
      }

      document.addEventListener(
        'pointermove',
        function (e) {
          targetX = e.clientX / window.innerWidth;
          targetY = e.clientY / window.innerHeight;
          if (!glowRaf) glowRaf = requestAnimationFrame(tickGlow);
        },
        { passive: true }
      );

      tiltCards.forEach(function (card) {
        card.classList.add('tilt-card');
        card.addEventListener('pointermove', function (e) {
          var rect = card.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width;
          var py = (e.clientY - rect.top) / rect.height;
          card.style.setProperty('--tilt-x', ((0.5 - py) * 6).toFixed(2) + 'deg');
          card.style.setProperty('--tilt-y', ((px - 0.5) * 8).toFixed(2) + 'deg');
          card.style.setProperty('--shine-x', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--shine-y', (py * 100).toFixed(1) + '%');
        });
        card.addEventListener('pointerleave', function () {
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
        });
      });
    }
  }

  /* --------------------------------------------------------------------------
     Close nav on Escape key
     -------------------------------------------------------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* --------------------------------------------------------------------------
     Close nav on resize to desktop
     -------------------------------------------------------------------------- */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeNav();
  });
})();
