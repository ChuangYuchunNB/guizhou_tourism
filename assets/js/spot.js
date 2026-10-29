(function (global) {
  'use strict';

  const UI = global.TravelUI;
  const Store = global.TravelStore;
  const params = new URLSearchParams(global.location.search);
  const spotId = params.get('id') || '';
  const spot = (global.GZ_SPOTS || []).find(function (item) {
    return item.id === spotId;
  });

  const elements = {
    hero: document.getElementById('spotHero'),
    level: document.getElementById('spotLevel'),
    watermark: document.getElementById('spotWatermark'),
    eyebrow: document.getElementById('spotEyebrow'),
    name: document.getElementById('spotName'),
    lead: document.getElementById('spotLead'),
    rating: document.getElementById('spotRating'),
    fav: document.getElementById('spotFav'),
    favText: document.getElementById('spotFavText'),
    detail: document.getElementById('spotDetail'),
    main: document.getElementById('spotMain'),
    reviews: document.getElementById('spotReviews'),
    missing: document.getElementById('spotMissing')
  };

  function escapeHtml(value) {
    return UI.escapeHtml(value);
  }

  function syncFavorite() {
    if (!elements.fav || !spot) return;
    const favorited = Store.isFavorite(spot.id);
    elements.fav.classList.toggle('is-fav', favorited);
    elements.fav.setAttribute('aria-pressed', String(favorited));
    elements.fav.setAttribute('aria-label', (favorited ? '取消收藏' : '收藏') + spot.name);
    if (elements.favText) {
      elements.favText.textContent = favorited ? '已收藏' : '收藏景点';
    }
  }

  function infoItem(label, value) {
    return (
      '<div class="info-item"><span class="info-label">' +
      escapeHtml(label) +
      '</span><strong>' +
      escapeHtml(value) +
      '</strong></div>'
    );
  }

  function renderMissing() {
    document.title = '没有找到该景区 · 黔行';
    if (elements.hero) elements.hero.hidden = true;
    if (elements.detail) elements.detail.hidden = true;
    if (elements.missing) {
      elements.missing.hidden = false;
      elements.missing.innerHTML =
        '<span class="empty-icon" aria-hidden="true">🧭</span>' +
        '<h2>没有找到这个景区</h2>' +
        '<p>链接可能已经失效，回到景区列表重新挑一站吧。</p>' +
        '<a class="btn btn-solid" href="index.html">返回景区列表</a>';
    }
  }

  function renderSpot() {
    document.title = spot.name + ' · 黔行';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', spot.name + '：' + spot.summary);
    }

    if (elements.hero) {
      elements.hero.style.setProperty('--c1', spot.colors[0]);
      elements.hero.style.setProperty('--c2', spot.colors[1]);
      if (spot.heroImage) {
        elements.hero.style.backgroundImage =
          'linear-gradient(115deg, rgba(5, 30, 25, 0.9) 0%, rgba(5, 30, 25, 0.56) 48%, rgba(5, 30, 25, 0.3) 100%), url("' +
          spot.heroImage +
          '")';
        elements.hero.style.backgroundSize = 'cover, cover';
        elements.hero.style.backgroundPosition = 'center, center';
      }
    }
    if (elements.watermark) elements.watermark.textContent = spot.name.slice(0, 1);
    if (elements.level) {
      elements.level.textContent = spot.level;
      elements.level.setAttribute('data-level', spot.level);
    }
    if (elements.eyebrow) {
      elements.eyebrow.textContent = spot.level + ' 级景区 · ' + spot.city;
    }
    if (elements.name) elements.name.textContent = spot.name;
    if (elements.lead) elements.lead.textContent = spot.summary;
    if (elements.rating) elements.rating.innerHTML = UI.dialogRatingMarkup(spot);
    if (elements.fav) elements.fav.setAttribute('data-fav', spot.id);

    const highlights = spot.highlights
      .map(function (item) {
        return '<span class="highlight-chip">' + escapeHtml(item) + '</span>';
      })
      .join('');
    const tags = spot.tags
      .map(function (tag) {
        return '<span class="tag">' + escapeHtml(tag) + '</span>';
      })
      .join('');

    if (elements.main) {
      elements.main.innerHTML =
        '<section class="spot-section">' +
        '<h2>景区介绍</h2>' +
        '<p class="spot-intro">' + escapeHtml(spot.intro) + '</p>' +
        '</section>' +
        '<div class="info-grid">' +
        infoItem('最佳季节', spot.bestSeason) +
        infoItem('建议时长', spot.duration) +
        infoItem('参考票价', spot.ticket) +
        infoItem('地址', spot.address) +
        '</div>' +
        '<section class="spot-section">' +
        '<h3>不可错过</h3>' +
        '<div class="highlight-list">' + highlights + '</div>' +
        '</section>' +
        '<div class="tag-row">' + tags + '</div>' +
        '<a class="spot-back" href="index.html">← 返回景区列表</a>';
    }

    if (elements.reviews) {
      elements.reviews.setAttribute('data-reviews-for', spot.id);
      elements.reviews.innerHTML = UI.reviewsBlockMarkup(spot);
    }

    const user = Store.currentUser();
    const myReview = user ? Store.getReview(spot.id) : null;
    if (elements.detail) {
      elements.detail.dataset.selectedRating = String(myReview ? myReview.rating : 0);
      UI.bindReviewEvents(elements.detail, spot);
    }

    syncFavorite();
  }

  function bindEvents() {
    global.addEventListener('qz:authchange', function () {
      syncFavorite();
      UI.refreshReviewBlock(spot, elements.detail);
    });

    global.addEventListener('qz:favchange', function (event) {
      if (event.detail && event.detail.id === spot.id) syncFavorite();
    });

    global.addEventListener('qz:reviewchange', function (event) {
      if (event.detail && event.detail.spotId === spot.id) {
        UI.refreshReviewBlock(spot, elements.detail);
      }
    });
  }

  function init() {
    UI.initShell();
    if (!spot) {
      renderMissing();
      return;
    }
    renderSpot();
    bindEvents();
  }

  init();
})(window);
