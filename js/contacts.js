/**
 * Renders contact details client-side (not present in page source for crawlers).
 */
(function () {
  'use strict';

  function decodeUtf8(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  var DATA = {
    name: decodeUtf8('0JjQnyDQn9C10YDRhdGD0L3QutC+0LIg0KIu0J0u'),
    inn: '771982410324',
    ogrnip: '326774600491682',
    email: [0x74, 0x70, 0x65, 0x72, 0x68, 0x75, 0x6e, 0x6b, 0x6f, 0x76, 0x40, 0x79, 0x61, 0x6e, 0x64, 0x65, 0x78, 0x2e, 0x72, 0x75]
      .map(function (c) { return String.fromCharCode(c); })
      .join(''),
    telegram: ['https:/', '/t.me/', 'strattr'].join(''),
    telegramLabel: ['t.me/', 'strattr'].join(''),
  };

  var root = document.getElementById('contact-details');
  if (!root) return;

  root.innerHTML =
    '<dl class="contact-list">' +
      '<div class="contact-list__item">' +
        '<dt>Индивидуальный предприниматель</dt>' +
        '<dd>' + DATA.name + '</dd>' +
      '</div>' +
      '<div class="contact-list__item">' +
        '<dt>ИНН</dt>' +
        '<dd>' + DATA.inn + '</dd>' +
      '</div>' +
      '<div class="contact-list__item">' +
        '<dt>ОГРНИП</dt>' +
        '<dd>' + DATA.ogrnip + '</dd>' +
      '</div>' +
      '<div class="contact-list__item">' +
        '<dt>Email</dt>' +
        '<dd><a href="mailto:' + DATA.email + '">' + DATA.email + '</a></dd>' +
      '</div>' +
      '<div class="contact-list__item">' +
        '<dt>Telegram</dt>' +
        '<dd><a href="' + DATA.telegram + '" target="_blank" rel="noopener noreferrer">' + DATA.telegramLabel + '</a></dd>' +
      '</div>' +
    '</dl>' +
    '<p class="contact-note">Расчётные реквизиты для оплаты предоставляются по запросу при заключении договора.</p>';
})();
