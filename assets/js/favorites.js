(function (global) {
  'use strict';

  const elements = {
    favCount: document.getElementById('favCount'),
    favUserLabel: document.getElementById('favUserLabel'),
    hint: document.getElementById('favoritesHint'),
    content: document.getElementById('favoritesContent')
  };

  function renderLocked() {
    elements.favUserLabel.textContent = '未登录';
    elements.hint.textContent = '登录后即可查看你的景区收藏';
    elements.content.innerHTML =
      '<div class="locked-state">' +
      '<span class="locked-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="30" height="30" focusable="false"><rect x="5" y="10" width="14" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
      '</span>' +
      '<h2>登录后查看收藏</h2>' +
      '<p>收藏记录与账号绑定。登录后就能在这里管理你的贵州心愿单，随时继续规划行程。</p>' +
      '<div class="locked-actions">' +
      '<a class="btn btn-solid" href="login.html?redirect=favorites.html">登录</a>' +
      '<a class="btn btn-outline" href="login.html?tab=register&amp;redirect=favorites.html">注册账号</a>' +
      '</div>' +
      '</div>';
  }

  function renderEmpty() {
    elements.hint.textContent = '收藏夹还是空的，去发现一些贵州好风景吧';
    elements.content.innerHTML =
      '<div class="empty-state">' +
      '<span class="empty-icon" aria-hidden="true">💚</span>' +
      '<h2>收藏夹还是空的</h2>' +
      '<p>在景区列表点击卡片右上角的爱心，就能把喜欢的景区收进来。</p>' +
      '<a class="btn btn-solid" data-go-home>去发现景区</a>' +
      '</div>';
  }

  function renderList(spots) {
    elements.hint.textContent = '收藏按加入时间排序，最近收藏的排在前面';
    elements.content.innerHTML =
      '<section class="collection" aria-labelledby="collectionTitle">' +
      '<div class="collection-head">' +
      '<div><p class="section-eyebrow">YOUR LIST</p><h2 id="collectionTitle">已收藏的景区</h2></div>' +
      '<span class="level-count">' +
      spots.length +
      ' 个</span>' +
      '</div>' +
      '<div class="spot-grid">' +
      spots.map(global.TravelUI.spotCard).join('') +
      '</div>' +
      '</section>';
  }

  function render() {
    const user = global.TravelStore.currentUser();
    const count = global.TravelStore.favoriteCount();
    elements.favCount.textContent = String(count);
    elements.favUserLabel.textContent = user ? user.username : '未登录';

    if (!user) {
      renderLocked();
      return;
    }

    const spots = global.TravelStore.getFavorites()
      .map(global.TravelUI.getSpot)
      .filter(Boolean);

    if (!spots.length) {
      renderEmpty();
      return;
    }

    renderList(spots);
  }

  function openCard(card) {
    const id = card.getAttribute('data-spot');
    if (id) (global.Router && global.Router.goSpot) ? global.Router.goSpot(id) : (global.location.href = 'spot.html?id=' + encodeURIComponent(id));
  }

  function bindEvents() {
    elements.content.addEventListener('click', function (event) {
      if (event.target.closest('[data-fav]')) return;
      const card = event.target.closest('.spot-card');
      if (card) openCard(card);
    });

    elements.content.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!event.target.classList || !event.target.classList.contains('spot-card')) return;
      event.preventDefault();
      openCard(event.target);
    });

    global.addEventListener('qz:authchange', render);
    global.addEventListener('qz:favchange', render);
  }

  function init() {
    global.TravelUI.initShell();
    bindEvents();
    render();
  }

  init();
})(window);
