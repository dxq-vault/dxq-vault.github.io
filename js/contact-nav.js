/**
 * Navigation to contacts page — URL is not exposed in static HTML.
 * Transition occurs only on user click (not crawlable as a direct link target).
 */
(function () {
  'use strict';

  var CONTACT_PAGE = atob('Y29udGFjdHMuaHRtbA==');

  document.querySelectorAll('[data-contact-nav]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.assign(CONTACT_PAGE);
    });
  });
})();
