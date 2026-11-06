﻿﻿﻿/**
 * 美食详情 food.js
 * 支持两种模式：
 *   1. 独立页面模式：直接访问 food.html?id=changwang-mian
 *   2. SPA 模式：    Router.registerFoodInit(FoodSPA.init)
 *
 * 复用 spot 详情页的样式类（.spot-hero / .spot-detail / .info-grid / .reviews-block）
 * 与 TravelUI 的评分、评价、收藏子系统——收藏走 ui.js 全局 [data-fav] 处理器
 * （Store.toggleFavorite），不重复绑定，避免 spot.js 中调用不存在的 removeFavorite 的问题。
 */
(function (global) {
  'use strict';

  const UI = global.TravelUI;
  const Store = global.TravelStore;
  const doc = document;

  // 美食详情页统一使用的暖色主题（spot 页取自 spot.colors，美食数据无 colors 字段）
  const FOOD_COLORS = ['#7c2d12', '#fb923c'];

  function escapeHtml(value) {
    return UI.escapeHtml(value);
  }

  function syncFavorite(food, favEl, favTextEl) {
    if (!favEl || !food) return;
    const favorited = Store.isFavorite(food.id);
    favEl.classList.toggle('is-fav', favorited);
    favEl.setAttribute('aria-pressed', String(favorited));
    favEl.setAttribute('aria-label', (favorited ? '取消收藏' : '收藏') + food.name);
    if (favTextEl) favTextEl.textContent = favorited ? '已收藏' : '收藏美食';
  }

  function infoItem(label, value) {
    return (
      '<div class="info-item"><span class="info-label">' +
      escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>'
    );
  }

  // 把 tag 字符串（如 "早餐 · 老字号" / "早餐/小吃"）拆成独立标签
  function splitTags(tag) {
    if (!tag) return [];
    return String(tag)
      .split(/[·\/、,，\s]+/)
      .map(function (t) { return t.trim(); })
      .filter(function (t) { return t.length > 0; });
  }

  function renderFood(food, els) {
    doc.title = food.name + ' · 美食详情 · 黔行';

    if (els.hero) {
      els.hero.style.setProperty('--c1', FOOD_COLORS[0]);
      els.hero.style.setProperty('--c2', FOOD_COLORS[1]);
      if (food.image) {
        els.hero.style.backgroundImage =
          'linear-gradient(115deg, rgba(5, 30, 25, 0.9) 0%, rgba(5, 30, 25, 0.56) 48%, rgba(5, 30, 25, 0.3) 100%), url("' +
          food.image + '")';
        els.hero.style.backgroundSize = 'cover, cover';
        els.hero.style.backgroundPosition = 'center, center';
      }
    }
    if (els.watermark) els.watermark.textContent = food.name.slice(0, 1);
    if (els.tag) els.tag.textContent = food.tag || '贵州美食';
    if (els.eyebrow) els.eyebrow.textContent = (food.city ? food.city + ' · ' : '') + '风味美食';
    if (els.name) els.name.textContent = food.name;
    if (els.lead) els.lead.textContent = food.desc || '';
    if (els.rating) els.rating.innerHTML = UI.dialogRatingMarkup(food);
    if (els.fav) els.fav.setAttribute('data-fav', food.id);

    const tags = splitTags(food.tag)
      .map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; })
      .join('');

    const ratingText = (Number(food.rating).toFixed(1)) + ' 分';

    if (els.main) {
      els.main.innerHTML =
        '<section class="spot-section"><h2>美食介绍</h2><p class="spot-intro">' +
        escapeHtml(food.desc || '') +
        '</p></section>' +
        '<div class="info-grid">' +
        infoItem('大致价格', food.price || '暂无') +
        infoItem('所在城市', food.city || '贵州') +
        infoItem('风味类别', food.tag || '地方美食') +
        infoItem('综合评分', ratingText) +
        '</div>' +
        (tags ? '<div class="tag-row">' + tags + '</div>' : '') +
        '<a class="spot-back" id="foodBack" href="city.html?adcode=' +
        encodeURIComponent(food.adcode || '') + '&mode=food">← 返回美食列表</a>';
    }

    if (els.reviews) {
      els.reviews.setAttribute('data-reviews-for', food.id);
      els.reviews.innerHTML = UI.reviewsBlockMarkup(food);
    }

    const user = Store.currentUser();
    const myReview = user ? Store.getReview(food.id) : null;
    if (els.detail) {
      els.detail.dataset.selectedRating = String(myReview ? myReview.rating : 0);
      UI.bindReviewEvents(els.detail, food);
    }

    // 返回美食列表：SPA 内用 Router.goCity，独立页走普通链接
    const backEl = els.main ? els.main.querySelector('#foodBack') : null;
    if (backEl && !backEl.__bound) {
      backEl.__bound = true;
      backEl.addEventListener('click', function (event) {
        const spaFood = doc.getElementById('spaFood');
        if (global.Router && global.Router.goCity && spaFood && !spaFood.hidden) {
          event.preventDefault();
          global.Router.goCity(food.adcode, 'food');
        }
      });
    }

    syncFavorite(food, els.fav, els.favText);
  }

  // ---- 初始化（支持重复调用） ----
  function initFood(options) {
    options = options || {};
    // 确保全局收藏/评价/头部事件已绑定（独立页首次进入时尤其需要；幂等）
    if (UI && UI.initShell) UI.initShell();

    const foodId = options.id || '';
    const food = UI.getFood(foodId);

    var spaFood = doc.getElementById('spaFood');
    var prefix = spaFood && !spaFood.hidden ? '#spaFood ' : '';

    const els = {
      hero: doc.querySelector(prefix + '#foodHero') || doc.getElementById('foodHero'),
      watermark: doc.querySelector(prefix + '#foodWatermark') || doc.getElementById('foodWatermark'),
      tag: doc.querySelector(prefix + '#foodTag') || doc.getElementById('foodTag'),
      eyebrow: doc.querySelector(prefix + '#foodEyebrow') || doc.getElementById('foodEyebrow'),
      name: doc.querySelector(prefix + '#foodName') || doc.getElementById('foodName'),
      lead: doc.querySelector(prefix + '#foodLead') || doc.getElementById('foodLead'),
      rating: doc.querySelector(prefix + '#foodRating') || doc.getElementById('foodRating'),
      fav: doc.querySelector(prefix + '#foodFav') || doc.getElementById('foodFav'),
      favText: doc.querySelector(prefix + '#foodFavText') || doc.getElementById('foodFavText'),
      detail: doc.querySelector(prefix + '#foodDetail') || doc.getElementById('foodDetail'),
      main: doc.querySelector(prefix + '#foodMain') || doc.getElementById('foodMain'),
      reviews: doc.querySelector(prefix + '#foodReviews') || doc.getElementById('foodReviews'),
      missing: doc.querySelector(prefix + '#foodMissing') || doc.getElementById('foodMissing')
    };

    if (!food) {
      doc.title = '没有找到该美食 · 黔行';
      if (els.missing) {
        els.missing.hidden = false;
        els.missing.innerHTML =
          '<h2>没有找到这道美食</h2>' +
          '<p>链接可能已失效，请从城市美食列表重新进入。</p>' +
          '<a class="btn btn-solid" data-go-home="list">返回贵州地图</a>';
      }
      if (els.detail) els.detail.style.display = 'none';
      return;
    }

    if (els.missing) els.missing.hidden = true;
    if (els.detail) els.detail.style.display = '';
    renderFood(food, els);
  }

  // ---- 独立页面自动启动 ----
  var standaloneHero = doc.getElementById('foodHero');
  // 仅在独立详情页（不存在 SPA 容器 #spaFood）时自动启动；
  // 在 index.html 内由路由 Router 驱动，避免空 id 污染标题与容器状态。
  if (standaloneHero && !doc.getElementById('spaFood')) {
    var params = new URLSearchParams(global.location.search);
    initFood({ id: params.get('id') || '' });
  }

  // ---- SPA 注册 ----
  if (global.Router && global.Router.registerFoodInit) {
    global.Router.registerFoodInit(initFood);
  }

  global.FoodSPA = { init: initFood };
})(window);
