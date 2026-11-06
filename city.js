﻿﻿﻿/**
 * 贵州美食与景点 city.js
 * 支持两种模式：
 *   1. 独立页面模式：直接访问 city.html?adcode=xxx&mode=food
 *   2. SPA 模式：    Router.registerCityInit(CitySPA.init) 由 router.js 调用
 */
(function (global) {
  'use strict';

  const doc = document;

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
    const linked = item.id ? ' city-item-linked' : '';
    return (
      '<article class="city-item city-item-food' + linked + '"' +
      (item.id ? ' data-food-id="' + item.id + '"' : '') +
      '>' +
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
    // 首页列表 + 城市列表专属景点，都能匹配到详情页
    const spots = (global.GZ_SPOTS || []).concat(global.GZ_EXTRA_SPOTS || []);
    const matched = spots.find(function (s) {
      return (
        s.name === item.name ||
        item.name.indexOf(s.name) !== -1 ||
        s.name.indexOf(item.name) !== -1
      );
    });
    const spotHref = matched ? 'city-spot-link' : '';
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

  // ---- 核心渲染 ----
  function render(mode, els, adcode) {
    const data = (global.GZ_CITY_DATA && global.GZ_CITY_DATA[adcode]) || null;

    if (!data) {
      els.content.innerHTML =
        '<div class="city-empty">' +
        '<h2>找不到这个市/自治州</h2>' +
        '<p>请从贵州地图首页点击进入，或检查链接是否正确。</p>' +
        '<a class="btn btn-solid" data-go-home="list">返回贵州地图</a>' +
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
          if (!id) return;
          // SPA 优先
          if (global.Router && global.Router.goSpot) {
            global.Router.goSpot(id);
          } else {
            global.location.href = 'spot.html?id=' + encodeURIComponent(id);
          }
        });
      });
    }

    if (mode === 'food') {
      els.content.querySelectorAll('.city-item-food[data-food-id]').forEach(function (card) {
        card.addEventListener('click', function () {
          const id = card.getAttribute('data-food-id');
          if (!id) return;
          // SPA 优先
          if (global.Router && global.Router.goFood) {
            global.Router.goFood(id);
          } else {
            global.location.href = 'food.html?id=' + encodeURIComponent(id);
          }
        });
      });
    }
  }

  // ---- 初始化（支持重复调用） ----
  function initCity(options) {
    options = options || {};
    const adcode = (options.adcode || '').trim();
    const mode = options.mode === 'spots' ? 'spots' : 'food';

    if (!adcode) return;

    // 找 DOM（支持 SPA 容器前缀 #spaCity 和独立页面直接 ID）
    var spaCity = doc.getElementById('spaCity');
    var prefix = spaCity && !spaCity.hidden ? '#spaCity ' : '';

    const els = {
      header: doc.querySelector(prefix + '#cityHeader') || doc.getElementById('cityHeader'),
      kicker: doc.querySelector(prefix + '#cityKicker') || doc.getElementById('cityKicker'),
      name: doc.querySelector(prefix + '#cityName') || doc.getElementById('cityName'),
      nick: doc.querySelector(prefix + '#cityNick') || doc.getElementById('cityNick'),
      desc: doc.querySelector(prefix + '#cityDesc') || doc.getElementById('cityDesc'),
      content: doc.querySelector(prefix + '#cityContent') || doc.getElementById('cityContent'),
      tabFood: doc.querySelector(prefix + '#tabFood') || doc.getElementById('tabFood'),
      tabSpots: doc.querySelector(prefix + '#tabSpots') || doc.getElementById('tabSpots'),
      tabFoodCount: doc.querySelector(prefix + '#tabFoodCount') || doc.getElementById('tabFoodCount'),
      tabSpotsCount: doc.querySelector(prefix + '#tabSpotsCount') || doc.getElementById('tabSpotsCount'),
      note: doc.querySelector(prefix + '#cityNote') || doc.getElementById('cityNote')
    };

    const data = (global.GZ_CITY_DATA && global.GZ_CITY_DATA[adcode]) || null;

    // 更新 header
    if (!data) {
      if (els.kicker) els.kicker.textContent = 'ADCODE · ' + adcode;
      if (els.name) els.name.textContent = '未知区域';
      if (els.nick) els.nick.textContent = '（数据暂缺）';
      if (els.content) els.content.innerHTML =
        '<div class="city-empty"><h2>找不到这个市/自治州</h2><p>请从贵州地图首页点击进入。</p></div>';
      if (els.tabFoodCount) els.tabFoodCount.textContent = '0';
      if (els.tabSpotsCount) els.tabSpotsCount.textContent = '0';
      return;
    }

    if (els.kicker) els.kicker.textContent = 'GUIZHOU · ' + adcode;
    if (els.name) els.name.textContent = data.name;
    if (els.nick) els.nick.textContent = data.nickname ? '「' + data.nickname + '」' : '';
    if (els.desc) els.desc.textContent =
      (data.counties && data.counties.length
        ? '下辖 ' + data.counties.length + ' 个区县：' + data.counties.slice(0, 6).join('、') + (data.counties.length > 6 ? ' 等' : '') + '。'
        : '') +
      '以下是本地代表性的' + data.foods.length + '种美食推荐与' + data.spots.length + '个精选景点。';
    if (els.tabFoodCount) els.tabFoodCount.textContent = String(data.foods.length);
    if (els.tabSpotsCount) els.tabSpotsCount.textContent = String(data.spots.length);

    doc.title = data.name + ' · 美食与景点 · 黔行';

    // tab 点击事件（只绑一次）
    if (els.tabFood && !els.tabFood.__bound) {
      els.tabFood.__bound = true;
      els.tabFood.addEventListener('click', function () {
        render('food', els, adcode);
        global.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (els.tabSpots && !els.tabSpots.__bound) {
      els.tabSpots.__bound = true;
      els.tabSpots.addEventListener('click', function () {
        render('spots', els, adcode);
        global.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    render(mode, els, adcode);
  }

  // ---- 独立页面自动启动 ----
  // 只有 #cityHeader 存在（即当前是独立 city.html 页面）才自动跑
  var standaloneHeader = doc.getElementById('cityHeader');
  if (standaloneHeader) {
    var params = new URLSearchParams(global.location.search);
    initCity({
      adcode: params.get('adcode') || '',
      mode: params.get('mode')
    });
  }

  // ---- SPA 注册 ----
  if (global.Router && global.Router.registerCityInit) {
    global.Router.registerCityInit(initCity);
  }

  // 全局暴露（方便调试）
  global.CitySPA = { init: initCity };
})(window);
