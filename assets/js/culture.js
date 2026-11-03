/**
 * 市/州文化 SPA 视图
 */
(function (global) {
  'use strict';

  var doc = document;

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 找 DOM（支持独立页面和 SPA）
  function $(id) {
    var spa = doc.getElementById('spaCulture');
    if (spa && !spa.hidden) {
      var el = spa.querySelector('#' + id);
      if (el) return el;
    }
    return doc.getElementById(id);
  }

  function render(adcode) {
    var data = (global.GZ_CITY_CULTURE || {})[adcode];
    var kicker = $('cultureKicker');
    var nameEl = $('cultureName');
    var nickEl = $('cultureNick');
    var content = $('cultureContent');

    if (!data) {
      if (kicker) kicker.textContent = 'ADCODE · ' + adcode;
      if (nameEl) nameEl.textContent = '暂无文化数据';
      if (nickEl) nickEl.textContent = '';
      if (content) content.innerHTML = '<p class="culture-empty">该市暂无文化概览数据。</p>';
      return;
    }

    if (kicker) kicker.textContent = 'GUIZHOU · ' + adcode;
    if (nameEl) nameEl.textContent = data.name;
    if (nickEl) nickEl.textContent = data.nickname || '';
    doc.title = data.name + ' · 文化概览 · 黔行';

    var html = '';

    // 市文化
    if (data.cityIntro) {
      html +=
        '<section class="culture-section culture-section-city">' +
        '<h2 class="culture-section-title"><span class="culture-section-emoji">🏛️</span>' +
        '市（州）文化</h2>' +
        '<p class="culture-text">' + esc(data.cityIntro) + '</p>' +
        '</section>';
    }

    // 景点文化
    var spotKeys = Object.keys(data.spotCulture || {});
    if (spotKeys.length > 0) {
      html +=
        '<section class="culture-section culture-section-spot">' +
        '<h2 class="culture-section-title"><span class="culture-section-emoji">🗿</span>' +
        '景点文化</h2>' +
        '<div class="culture-spot-grid">';

      // 拿每个 spot 的名称
      var spots = global.GZ_SPOTS || [];
      spotKeys.forEach(function (sid) {
        var spot = spots.find(function (s) { return s.id === sid; });
        var sname = spot ? spot.name : sid;
        var simg = spot ? spot.heroImage : '';
        var slevel = spot ? spot.level : '';
        var text = data.spotCulture[sid];
        html +=
          '<article class="culture-spot-card">' +
          (simg ? '<div class="culture-spot-img"><img loading="lazy" src="' + esc(simg) + '" alt="' + esc(sname) + '"></div>' : '') +
          '<header class="culture-spot-head">' +
          '<h3>' + esc(sname) + (slevel ? ' <span class="culture-level">' + esc(slevel) + '</span>' : '') + '</h3>' +
          '</header>' +
          '<p class="culture-text">' + esc(text) + '</p>' +
          '</article>';
      });

      html += '</div></section>';
    }

    // 少数民族文化
    if (data.ethicCulture) {
      html +=
        '<section class="culture-section culture-section-ethic">' +
        '<h2 class="culture-section-title"><span class="culture-section-emoji">🎭</span>' +
        '少数民族文化</h2>' +
        '<p class="culture-text">' + esc(data.ethicCulture) + '</p>' +
        '</section>';
    }

    if (content) content.innerHTML = html;
  }

  function initCulture(params) {
    params = params || {};
    var adcode = (params.adcode || '').trim();
    if (!adcode) return;
    render(adcode);
  }

  // 独立页面自动启动（如果存在 standalone 标记）
  if (doc.getElementById('cultureContent') && !doc.getElementById('spaCulture')) {
    var p = new URLSearchParams(global.location.search);
    initCulture({ adcode: p.get('adcode') || '' });
  }

  // SPA 注册
  if (global.Router && global.Router.registerCultureInit) {
    global.Router.registerCultureInit(initCulture);
  }

  global.CultureSPA = { init: initCulture };
})(window);
