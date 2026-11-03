(function (global) {
  'use strict';

  const state = {
    level: 'ALL',
    query: ''
  };

  const elements = {
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    filters: document.getElementById('levelFilters'),
    sections: document.getElementById('spotSections'),
    resultText: document.getElementById('resultText'),
    resetFilters: document.getElementById('resetFilters'),
    statTotal: document.getElementById('statTotal'),
    statLevel5a: document.getElementById('statLevel5a'),
    statFav: document.getElementById('statFav')
  };

  function matchesQuery(spot, query) {
    if (!query) return true;
    const haystack = [spot.name, spot.city, spot.area, spot.summary, spot.intro]
      .concat(spot.tags)
      .join(' ')
      .toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function getFilteredSpots() {
    const query = state.query.trim().toLowerCase();
    return global.GZ_SPOTS.filter(function (spot) {
      const levelOk = state.level === 'ALL' || spot.level === state.level;
      return levelOk && matchesQuery(spot, query);
    });
  }

  function updateTabCounts(queryMatchedSpots) {
    const allCount = queryMatchedSpots.length;
    document.querySelectorAll('[data-level-filter]').forEach(function (tab) {
      const level = tab.getAttribute('data-level-filter');
      const count = level === 'ALL'
        ? allCount
        : queryMatchedSpots.filter(function (spot) { return spot.level === level; }).length;
      const countEl = tab.querySelector('[data-count-for="' + level + '"]');
      if (countEl) countEl.textContent = String(count);
    });
  }

  function updateActiveFilter() {
    document.querySelectorAll('[data-level-filter]').forEach(function (tab) {
      const active = tab.getAttribute('data-level-filter') === state.level;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
  }

  function renderSections(spots) {
    if (!spots.length) {
      const query = state.query.trim();
      elements.sections.innerHTML =
        '<div class="empty-state">' +
        '<span class="empty-icon" aria-hidden="true">🔍</span>' +
        '<h2>没有找到相关景区</h2>' +
        '<p>' +
        (query
          ? '试试更短的关键词，或换个城市、玩法再搜一次。'
          : '当前等级下暂时没有景区，看看其他等级吧。') +
        '</p>' +
        '<button type="button" class="btn btn-outline" data-reset-empty>清除筛选</button>' +
        '</div>';
      return;
    }

    const blocks = global.GZ_LEVELS.map(function (level) {
      const spotsInLevel = spots.filter(function (spot) {
        return spot.level === level.key;
      });
      if (!spotsInLevel.length) return '';

      return (
        '<section class="level-section" aria-labelledby="section-' +
        level.key +
        '">' +
        '<div class="level-heading">' +
        '<span class="level-stamp" data-level="' +
        level.key +
        '">' +
        level.key +
        '</span>' +
        '<div class="level-copy"><h2 id="section-' +
        level.key +
        '">' +
        level.label +
        '</h2><p>' +
        level.desc +
        '</p></div>' +
        '<span class="level-count">' +
        spotsInLevel.length +
        ' 个景区</span>' +
        '</div>' +
        '<div class="spot-grid">' +
        spotsInLevel.map(global.TravelUI.spotCard).join('') +
        '</div>' +
        '</section>'
      );
    });

    elements.sections.innerHTML = blocks.join('');
  }

  function renderMeta(spots) {
    const query = state.query.trim();
    const level = global.GZ_LEVELS.find(function (item) {
      return item.key === state.level;
    });
    if (query) {
      elements.resultText.textContent =
        '搜索“' + query + '” · 找到 ' + spots.length + ' 个景区';
    } else if (level) {
      elements.resultText.textContent = level.label + ' · 共 ' + spots.length + ' 个景区';
    } else {
      elements.resultText.textContent = '全部景区 · 共 ' + spots.length + ' 个';
    }

    const hasFilter = Boolean(query) || state.level !== 'ALL';
    elements.resetFilters.hidden = !hasFilter;
    elements.clearSearch.hidden = !query;
  }

  function render() {
    const queryMatchedSpots = global.GZ_SPOTS.filter(function (spot) {
      return matchesQuery(spot, state.query.trim().toLowerCase());
    });
    updateTabCounts(queryMatchedSpots);
    updateActiveFilter();
    const spots = getFilteredSpots();
    renderMeta(spots);
    renderSections(spots);
  }

  function updateStats() {
    if (!global.TravelStore) return;
    elements.statFav.textContent = String(global.TravelStore.favoriteCount());
  }

  function resetFilters() {
    state.level = 'ALL';
    state.query = '';
    elements.searchInput.value = '';
    render();
    elements.searchInput.focus();
  }

  function openCard(card) {
    const id = card.getAttribute('data-spot');
    if (id) (global.Router && global.Router.goSpot) ? global.Router.goSpot(id) : (global.location.href = 'spot.html?id=' + encodeURIComponent(id));
  }

  function bindEvents() {
    elements.searchInput.addEventListener('input', function (event) {
      state.query = event.target.value;
      render();
    });

    elements.clearSearch.addEventListener('click', function () {
      state.query = '';
      elements.searchInput.value = '';
      elements.searchInput.focus();
      render();
    });

    elements.filters.addEventListener('click', function (event) {
      const tab = event.target.closest('[data-level-filter]');
      if (!tab) return;
      state.level = tab.getAttribute('data-level-filter');
      render();
    });

    elements.resetFilters.addEventListener('click', resetFilters);

    elements.sections.addEventListener('click', function (event) {
      if (event.target.closest('[data-fav]')) return;
      if (event.target.closest('[data-reset-empty]')) {
        resetFilters();
        return;
      }
      const card = event.target.closest('.spot-card');
      if (card) openCard(card);
    });

    elements.sections.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!event.target.classList || !event.target.classList.contains('spot-card')) return;
      event.preventDefault();
      openCard(event.target);
    });

    global.addEventListener('qz:favchange', updateStats);
    global.addEventListener('qz:authchange', updateStats);
  }

  function init() {
    global.TravelUI.initShell();
    elements.statTotal.textContent = String(global.GZ_SPOTS.length);
    elements.statLevel5a.textContent = String(
      global.GZ_SPOTS.filter(function (spot) { return spot.level === '5A'; }).length
    );
    updateStats();
    bindEvents();
    render();
  }

  init();
})(window);
