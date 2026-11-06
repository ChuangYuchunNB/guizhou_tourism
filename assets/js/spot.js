﻿﻿﻿/**
 * 景区详情 spot.js
 * 支持两种模式：
 *   1. 独立页面模式：直接访问 spot.html?id=huangguoshu
 *   2. SPA 模式：    Router.registerSpotInit(SpotSPA.init)
 */
(function (global) {
  'use strict';

  const UI = global.TravelUI;
  const Store = global.TravelStore;
  const doc = document;

  function escapeHtml(value) {
    return UI.escapeHtml(value);
  }

  function syncFavorite(spot, favEl, favTextEl) {
    if (!favEl || !spot) return;
    const favorited = Store.isFavorite(spot.id);
    favEl.classList.toggle('is-fav', favorited);
    favEl.setAttribute('aria-pressed', String(favorited));
    favEl.setAttribute('aria-label', (favorited ? '取消收藏' : '收藏') + spot.name);
    if (favTextEl) favTextEl.textContent = favorited ? '已收藏' : '收藏景点';
  }

  function infoItem(label, value) {
    return (
      '<div class="info-item"><span class="info-label">' +
      escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>'
    );
  }

  // 从景区所在市名（如"安顺市"）找到 GZ_CITY_CULTURE 中对应的文化数据
  function getCityCultureForSpot(spotCityName) {
    var cultures = global.GZ_CITY_CULTURE || {};
    var adcodes = Object.keys(cultures);
    for (var i = 0; i < adcodes.length; i++) {
      var c = cultures[adcodes[i]];
      // 匹配：市名是 culture.name 的子串，或 culture.nickname 包含
      if (c && c.name && (c.name.indexOf(spotCityName) !== -1 || spotCityName.indexOf(c.name.replace(/市|.*州.*/, '')) !== -1)) {
        return c;
      }
    }
    return null;
  }

  function buildCultureBlock(spot) {
    var cul = getCityCultureForSpot(spot.city);
    if (!cul) return '';

    var html = '<div class="spot-culture-block">';
    html += '<h3 class="spot-culture-title">';
    html += '<span>📜 ' + escapeHtml(spot.name) + ' · 文化背景</span>';
    html += '<span class="spot-culture-city-name">' + escapeHtml(cul.name + (cul.nickname ? ' · ' + cul.nickname : '')) + '</span>';
    html += '</h3>';

    // 景点专属文化（优先）
    var spotText = (cul.spotCulture || {})[spot.id];
    if (spotText) {
      html += '<p class="spot-culture-text">' + escapeHtml(spotText) + '</p>';
    }
    // 市文化概述（始终加）
    if (cul.cityIntro) {
      html += '<p class="spot-culture-text">' + escapeHtml(cul.cityIntro) + '</p>';
    }
    // 少数民族文化（简短版）
    if (cul.ethicCulture) {
      html += '<p class="spot-culture-text">' + escapeHtml(cul.ethicCulture) + '</p>';
    }

    html += '</div>';
    return html;
  }

  function renderSpot(spot, els) {
    doc.title = spot.name + ' · 黔行';

    if (els.hero) {
      els.hero.style.setProperty('--c1', spot.colors[0]);
      els.hero.style.setProperty('--c2', spot.colors[1]);
      if (spot.heroImage) {
        els.hero.style.backgroundImage =
          'linear-gradient(115deg, rgba(5, 30, 25, 0.9) 0%, rgba(5, 30, 25, 0.56) 48%, rgba(5, 30, 25, 0.3) 100%), url("' +
          spot.heroImage + '")';
        els.hero.style.backgroundSize = 'cover, cover';
        els.hero.style.backgroundPosition = 'center, center';
      }
    }
    if (els.watermark) els.watermark.textContent = spot.name.slice(0, 1);
    if (els.level) { els.level.textContent = spot.level; els.level.setAttribute('data-level', spot.level); }
    if (els.eyebrow) els.eyebrow.textContent = spot.level + ' 级景区 · ' + spot.city;
    if (els.name) els.name.textContent = spot.name;
    if (els.lead) els.lead.textContent = spot.summary;
    if (els.rating) els.rating.innerHTML = UI.dialogRatingMarkup(spot);
    if (els.fav) els.fav.setAttribute('data-fav', spot.id);

    const highlights = spot.highlights.map(function (i) { return '<span class="highlight-chip">' + escapeHtml(i) + '</span>'; }).join('');
    const tags = spot.tags.map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join('');

    if (els.main) {
      els.main.innerHTML =
        buildCultureBlock(spot) +
        '<section class="spot-section"><h2>景区介绍</h2><p class="spot-intro">' + escapeHtml(spot.intro) + '</p></section>' +
        '<div class="info-grid">' +
        infoItem('最佳季节', spot.bestSeason) +
        infoItem('建议时长', spot.duration) +
        infoItem('参考票价', spot.ticket) +
        infoItem('地址', spot.address) +
        '</div>' +
        '<section class="spot-section"><h3>不可错过</h3><div class="highlight-list">' + highlights + '</div></section>' +
        '<div class="tag-row">' + tags + '</div>' +
        '<a class="spot-back" data-go-home>← 返回景区列表</a>';
    }

    if (els.reviews) {
      els.reviews.setAttribute('data-reviews-for', spot.id);
      els.reviews.innerHTML = UI.reviewsBlockMarkup(spot);
    }

    const user = Store.currentUser();
    const myReview = user ? Store.getReview(spot.id) : null;
    if (els.detail) {
      els.detail.dataset.selectedRating = String(myReview ? myReview.rating : 0);
      UI.bindReviewEvents(els.detail, spot);
    }

    syncFavorite(spot, els.fav, els.favText);

    // 收藏按钮点击（只绑一次）
    if (els.fav && !els.fav.__bound) {
      els.fav.__bound = true;
      els.fav.addEventListener('click', function () {
        const spotId = els.fav.getAttribute('data-fav');
        if (!Store.currentUser()) {
          global.location.href = 'login.html?redirect=' + encodeURIComponent(global.location.pathname + global.location.hash);
          return;
        }
        const favd = Store.isFavorite(spotId);
        if (favd) Store.removeFavorite(spotId); else Store.addFavorite(spotId);
        syncFavorite(spot, els.fav, els.favText);
        global.dispatchEvent(new CustomEvent('qz:favchange', { detail: { id: spotId } }));
      });
    }
  }

  // ---- 初始化（支持重复调用） ----
  function initSpot(options) {
    options = options || {};
    const spotId = options.id || '';
    const allSpots = (global.GZ_SPOTS || []).concat(global.GZ_EXTRA_SPOTS || []);
    const spot = allSpots.find(function (item) { return item.id === spotId; });

    if (!spot) {
      doc.title = '没有找到该景区 · 黔行';
      return;
    }

    // 找 DOM（支持 SPA 容器前缀）
    var spaSpot = doc.getElementById('spaSpot');
    var prefix = spaSpot && !spaSpot.hidden ? '#spaSpot ' : '';

    const els = {
      hero: doc.querySelector(prefix + '#spotHero') || doc.getElementById('spotHero'),
      level: doc.querySelector(prefix + '#spotLevel') || doc.getElementById('spotLevel'),
      watermark: doc.querySelector(prefix + '#spotWatermark') || doc.getElementById('spotWatermark'),
      eyebrow: doc.querySelector(prefix + '#spotEyebrow') || doc.getElementById('spotEyebrow'),
      name: doc.querySelector(prefix + '#spotName') || doc.getElementById('spotName'),
      lead: doc.querySelector(prefix + '#spotLead') || doc.getElementById('spotLead'),
      rating: doc.querySelector(prefix + '#spotRating') || doc.getElementById('spotRating'),
      fav: doc.querySelector(prefix + '#spotFav') || doc.getElementById('spotFav'),
      favText: doc.querySelector(prefix + '#spotFavText') || doc.getElementById('spotFavText'),
      detail: doc.querySelector(prefix + '#spotDetail') || doc.getElementById('spotDetail'),
      main: doc.querySelector(prefix + '#spotMain') || doc.getElementById('spotMain'),
      reviews: doc.querySelector(prefix + '#spotReviews') || doc.getElementById('spotReviews'),
      missing: doc.querySelector(prefix + '#spotMissing') || doc.getElementById('spotMissing')
    };

    renderSpot(spot, els);
  }

  // ---- 独立页面自动启动 ----
  var standaloneHero = doc.getElementById('spotHero');
  // 仅在独立详情页（不存在 SPA 容器 #spaSpot）时自动启动；
  // 在 index.html 内由路由 Router 驱动，避免空 id 污染标题与容器状态。
  if (standaloneHero && !doc.getElementById('spaSpot')) {
    // 独立页面模式：从 location.search 读参数
    var params = new URLSearchParams(global.location.search);
    initSpot({ id: params.get('id') || '' });
  }

  // ---- SPA 注册 ----
  if (global.Router && global.Router.registerSpotInit) {
    global.Router.registerSpotInit(initSpot);
  }

  global.SpotSPA = { init: initSpot };
})(window);
