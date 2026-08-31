/**
 * Force-set favicon on every page load (bypasses per-URL browser cache).
 * Bump FAVICON_VERSION when the icon file changes.
 */
(function () {
  'use strict';

  var FAVICON_VERSION = '3';

  var head = document.head;
  if (!head) return;

  head.querySelectorAll(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  ).forEach(function (el) {
    el.remove();
  });

  function addIcon(rel, href, type, sizes) {
    var link = document.createElement('link');
    link.rel = rel;
    link.href = href + '?v=' + FAVICON_VERSION;
    if (type) link.type = type;
    if (sizes) link.sizes = sizes;
    head.appendChild(link);
  }

  addIcon('icon', 'favicon.svg', 'image/svg+xml');
  addIcon('icon', 'assets/favicon-32.png', 'image/png', '32x32');
  addIcon('apple-touch-icon', 'assets/favicon.png');
})();
