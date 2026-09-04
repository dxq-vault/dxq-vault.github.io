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
