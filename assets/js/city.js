(function (global) {
  'use strict';

  const doc = document;
  const params = new URLSearchParams(global.location.search);
  const adcode = (params.get('adcode') || '').trim();
  const defaultMode = params.get('mode') === 'spots' ? 'spots' : 'food';

  const data = (global.GZ_CITY_DATA && global.GZ_CITY_DATA[adcode]) || null;

  const els = {
    header: doc.getElementById('cityHeader'),
    kicker: doc.getElementById('cityKicker'),
    name: doc.getElementById('cityName'),
    nick: doc.getElementById('cityNick'),
    desc: doc.getElementById('cityDesc'),
    content: doc.getElementById('cityContent'),
    tabFood: doc.getElementById('tabFood'),
    tabSpots: doc.getElementById('tabSpots'),
    tabFoodCount: doc.getElementById('tabFoodCount'),
    tabSpotsCount: doc.getElementById('tabSpotsCount'),
    note: doc.getElementById('cityNote')
  };

  let currentMode = defaultMode;

  function escape(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function starHtml(rating) {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(r);
    const half = r - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let out = '';
    for (let i = 0; i < full; i++) out += '★';
    if (half) out += '☆';
    for (let j = 0; j < empty; j++) out += '☆';
    return out;
  }

  function renderFoodCard(item) {
    return (
      '<article class="city-item city-item-food">' +
      '<header class="city-item-head">' +
      '<h3 class="city-item-name">' + escape(item.name) + '</h3>' +
      '<span class="city-item-tag">' + escape(item.tag || '') + '</span>' +
      '</header>' +
      '<div class="city-item-rating">' +
      '<span class="city-item-stars">' + starHtml(item.rating) + '</span>' +
      '<span class="city-item-num">' + (Number(item.rating).toFixed(1)) + '</span>' +
      '<span class="city-item-price">' + escape(item.price || '') + '</span>' +
      '</div>' +
      '<p class="city-item-desc">' + escape(item.desc || '') + '</p>' +
      '</article>'
    );
  }

  function renderSpotCard(item, adcode) {
    // 尝试匹配 city.js 中同名景点到 GZ_SPOTS
    let spotHref = '';
    const spots = global.GZ_SPOTS || [];
    const matched = spots.find(function (s) {
      return (
        s.name === item.name ||
        item.name.indexOf(s.name) !== -1 ||
        s.name.indexOf(item.name) !== -1
      );
    });
    if (matched) {
      spotHref = 'city-spot-link';
    }
    return (
      '<article class="city-item city-item-spot' + (spotHref ? ' city-item-linked' : '') + '"' +
      (matched ? ' data-spot-id="' + matched.id + '"' : '') +
      '>' +
      '<header class="city-item-head">' +
      '<h3 class="city-item-name">' + escape(item.name) + '</h3>' +
      '<span class="city-item-level' + (item.level && item.level[0] === '5' ? ' level-5a' : item.level && item.level[0] === '4' ? ' level-4a' : '') + '">' + escape(item.level || '') + '</span>' +
      '</header>' +
      '<div class="city-item-rating">' +
      '<span class="city-item-stars">' + starHtml(item.rating) + '</span>' +
      '<span class="city-item-num">' + (Number(item.rating).toFixed(1)) + '</span>' +
      '</div>' +
      '<p class="city-item-desc">' + escape(item.desc || '') + '</p>' +
      (item.address ? '<address class="city-item-addr">' + escape(item.address) + '</address>' : '') +
      '</article>'
    );
  }

  function render(mode) {
    currentMode = mode;
    if (!data) {
      els.content.innerHTML =
        '<div class="city-empty">' +
        '<h2>找不到这个市/自治州</h2>' +
        '<p>请从贵州地图首页点击进入，或检查链接是否正确。</p>' +
        '<a class="btn btn-solid" href="index.html#page2">返回贵州地图</a>' +
        '</div>';
      return;
    }

    els.tabFood.classList.toggle('is-active', mode === 'food');
    els.tabSpots.classList.toggle('is-active', mode === 'spots');
    els.tabFood.setAttribute('aria-selected', mode === 'food' ? 'true' : 'false');
    els.tabSpots.setAttribute('aria-selected', mode === 'spots' ? 'true' : 'false');

    const list = mode === 'food' ? data.foods : data.spots;
    if (!list || !list.length) {
      els.content.innerHTML = '<p class="city-empty-text">暂无内容。</p>';
      return;
    }

    const html = list
      .map(function (item) {
        return mode === 'food' ? renderFoodCard(item) : renderSpotCard(item);
      })
      .join('');

    els.content.innerHTML = html;

    if (mode === 'spots') {
      els.content.querySelectorAll('.city-item-linked').forEach(function (card) {
        card.addEventListener('click', function () {
          const id = card.getAttribute('data-spot-id');
          if (id) global.location.href = 'spot.html?id=' + encodeURIComponent(id);
        });
      });
    }
  }

  function updateHeaderSolid() {
    if (!els.header) return;
    const solid = global.scrollY > 30;
    els.header.classList.toggle('is-solid', solid);
  }

  function init() {
    if (!data || !global.GZ_CITY_DATA[adcode]) {
      els.kicker.textContent = 'ADCODE · ' + adcode;
      els.name.textContent = '未知区域';
      els.nick.textContent = '（数据暂缺）';
      els.content.innerHTML =
        '<div class="city-empty">' +
        '<h2>找不到这个市/自治州</h2>' +
        '<p>请从贵州地图首页点击进入，或检查链接是否正确。</p>' +
        '<a class="btn btn-solid" href="index.html#page2">返回贵州地图</a>' +
        '</div>';
      els.tabFoodCount.textContent = '0';
      els.tabSpotsCount.textContent = '0';
      return;
    }

    els.kicker.textContent = 'GUIZHOU · ' + adcode;
    els.name.textContent = data.name;
    els.nick.textContent = data.nickname ? '「' + data.nickname + '」' : '';
    els.desc.textContent =
      (data.counties && data.counties.length
        ? '下辖 ' + data.counties.length + ' 个区县：' + data.counties.slice(0, 6).join('、') + (data.counties.length > 6 ? ' 等' : '') + '。'
        : '') +
      '以下是本地代表性的' + data.foods.length + '种美食推荐与' + data.spots.length + '个精选景点。';

    els.tabFoodCount.textContent = String(data.foods.length);
    els.tabSpotsCount.textContent = String(data.spots.length);

    global.document.title = data.name + ' · 美食与景点 · 黔行';

    render(defaultMode);
  }

  if (els.tabFood) {
    els.tabFood.addEventListener('click', function () {
      render('food');
      global.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (els.tabSpots) {
    els.tabSpots.addEventListener('click', function () {
      render('spots');
      global.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  global.addEventListener('scroll', updateHeaderSolid, { passive: true });
  global.addEventListener('resize', updateHeaderSolid);
  updateHeaderSolid();

  if (global.GZ_CITY_DATA) {
    init();
  } else {
    global.addEventListener('load', init);
  }
})(window);
