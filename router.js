/**
 * SPA 路由：通过 hash 路由在 index.html 内部切换视图。
 * URL 格式：
 *   #page1 / #page2 / #page3             → fullpage 原 3 屏（首页 hero / 地图 / 列表）
 *   #/city?adcode=520100&mode=food       → 贵州美食与景点（city）
 *   #/spot?id=huangguoshu                → 景区详情（spot）
 *   #/culture?adcode=520100              → 市/州文化概览（culture）
 *
 * 好处：用户永远不离开 index.html，ECharts canvas 不被清空，
 *       返回历史用浏览器原生 back()，100% 秒开无重载。
 */
(function (global) {
  'use strict';

  // ------- 状态 -------
  var currentView = null; // 'home' | 'city' | 'spot' | 'culture'
  var cityInitFn = null;
  var spotInitFn = null;
  var cultureInitFn = null;
  var foodInitFn = null;

  // ------- DOM -------
  var dom = {};

  function ensureDom() {
    if (dom.spaCity !== undefined) return;
    dom.spaCity = document.getElementById('spaCity');
    dom.spaSpot = document.getElementById('spaSpot');
    dom.spaCulture = document.getElementById('spaCulture');
    dom.spaFood = document.getElementById('spaFood');
    dom.fpViewport = document.getElementById('fpTrackHolder');
    dom.fpDots = document.getElementById('fpDots');
  }

  function hideFullpage() {
    if (dom.fpViewport) dom.fpViewport.hidden = true;
    if (dom.fpDots) dom.fpDots.hidden = true;
  }
  function showFullpage() {
    if (dom.fpViewport) dom.fpViewport.hidden = false;
    if (dom.fpDots) dom.fpDots.hidden = false;
  }

  // ------- 视图切换 -------
  function showHome() {
    ensureDom();
    if (dom.spaCity) dom.spaCity.hidden = true;
    if (dom.spaSpot) dom.spaSpot.hidden = true;
    if (dom.spaCulture) dom.spaCulture.hidden = true;
    if (dom.spaFood) dom.spaFood.hidden = true;
    showFullpage();
    document.body.classList.remove('spa-view');
    document.documentElement.classList.add('fp-mode');
    currentView = 'home';
    document.title = '黔行 · 贵州景区导览';
  }

  function showCity(params) {
    ensureDom();
    if (!dom.spaCity) {
      global.location.href = 'city.html?adcode=' + params.adcode + '&mode=' + (params.mode || 'food');
      return;
    }
    hideFullpage();
    if (dom.spaSpot) dom.spaSpot.hidden = true;
    if (dom.spaCulture) dom.spaCulture.hidden = true;
    if (dom.spaFood) dom.spaFood.hidden = true;
    dom.spaCity.hidden = false;
    document.body.classList.add('spa-view');
    document.documentElement.classList.remove('fp-mode');
    currentView = 'city';
    global.scrollTo(0, 0);
    if (cityInitFn) cityInitFn(params);
  }

  function showSpot(params) {
    ensureDom();
    if (!dom.spaSpot) {
      global.location.href = 'spot.html?id=' + encodeURIComponent(params.id || '');
      return;
    }
    hideFullpage();
    if (dom.spaCity) dom.spaCity.hidden = true;
    if (dom.spaCulture) dom.spaCulture.hidden = true;
    if (dom.spaFood) dom.spaFood.hidden = true;
    dom.spaSpot.hidden = false;
    document.body.classList.add('spa-view');
    document.documentElement.classList.remove('fp-mode');
    currentView = 'spot';
    global.scrollTo(0, 0);
    if (spotInitFn) spotInitFn(params);
  }

  function showFood(params) {
    ensureDom();
    if (!dom.spaFood) {
      global.location.href = 'food.html?id=' + encodeURIComponent(params.id || '');
      return;
    }
    hideFullpage();
    if (dom.spaCity) dom.spaCity.hidden = true;
    if (dom.spaSpot) dom.spaSpot.hidden = true;
    if (dom.spaCulture) dom.spaCulture.hidden = true;
    dom.spaFood.hidden = false;
    document.body.classList.add('spa-view');
    document.documentElement.classList.remove('fp-mode');
    currentView = 'food';
    global.scrollTo(0, 0);
    if (foodInitFn) foodInitFn(params);
  }

  function showCulture(params) {
    ensureDom();
    if (!dom.spaCulture) return; // 没有容器时静默忽略
    hideFullpage();
    if (dom.spaCity) dom.spaCity.hidden = true;
    if (dom.spaSpot) dom.spaSpot.hidden = true;
    if (dom.spaFood) dom.spaFood.hidden = true;
    dom.spaCulture.hidden = false;
    document.body.classList.add('spa-view');
    document.documentElement.classList.remove('fp-mode');
    currentView = 'culture';
    global.scrollTo(0, 0);
    if (cultureInitFn) cultureInitFn(params);
  }

  // ------- Hash 解析 -------
  function parseHash() {
    var hash = (global.location.hash || '').replace(/^#/, '');
    if (/^page[1-3]$/.test(hash)) return { view: 'home', page: hash };

    if (hash.startsWith('/city'))   return { view: 'city',    params: parseQuery(hash.split('?')[1] || '') };
    if (hash.startsWith('/spot'))   return { view: 'spot',    params: parseQuery(hash.split('?')[1] || '') };
    if (hash.startsWith('/food'))   return { view: 'food',    params: parseQuery(hash.split('?')[1] || '') };
    if (hash.startsWith('/culture')) return { view: 'culture', params: parseQuery(hash.split('?')[1] || '') };

    return { view: 'home', page: 'page1' };
  }

  function parseQuery(qs) {
    var out = {};
    if (!qs) return out;
    qs.split('&').forEach(function (kv) {
      var parts = kv.split('=');
      if (parts[0]) out[decodeURIComponent(parts[0])] = decodeURIComponent(parts.slice(1).join('=') || '');
    });
    return out;
  }

  function applyRoute() {
    ensureDom();
    var route = parseHash();

    if (route.view === 'home') {
      if (currentView !== 'home') showHome();
      return;
    }
    if (route.view === 'city') {
      if (currentView === 'city' && dom.spaCity && !dom.spaCity.hidden) {
        if (cityInitFn) cityInitFn(route.params); return;
      }
      showCity(route.params); return;
    }
    if (route.view === 'spot') {
      if (currentView === 'spot' && dom.spaSpot && !dom.spaSpot.hidden) {
        if (spotInitFn) spotInitFn(route.params); return;
      }
      showSpot(route.params); return;
    }
    if (route.view === 'food') {
      if (currentView === 'food' && dom.spaFood && !dom.spaFood.hidden) {
        if (foodInitFn) foodInitFn(route.params); return;
      }
      showFood(route.params); return;
    }
    if (route.view === 'culture') {
      if (currentView === 'culture' && dom.spaCulture && !dom.spaCulture.hidden) {
        if (cultureInitFn) cultureInitFn(route.params); return;
      }
      showCulture(route.params); return;
    }
  }

  // ------- 公开 API -------
  var Router = {
    goCity: function (adcode, mode) {
      global.location.hash = '#/city?adcode=' + adcode + '&mode=' + (mode || 'food');
    },
    goSpot: function (id) {
      global.location.hash = '#/spot?id=' + encodeURIComponent(id);
    },
    goFood: function (id) {
      global.location.hash = '#/food?id=' + encodeURIComponent(id);
    },
    goCulture: function (adcode) {
      global.location.hash = '#/culture?adcode=' + adcode;
    },
    goHome: function (page) {
      global.location.hash = '#' + (page || 'page1');
    },
    registerCityInit: function (fn) { cityInitFn = fn; },
    registerSpotInit: function (fn) { spotInitFn = fn; },
    registerFoodInit: function (fn) { foodInitFn = fn; },
    registerCultureInit: function (fn) { cultureInitFn = fn; },
    currentView: function () { return currentView; },
    apply: applyRoute
  };

  function init() {
    ensureDom();
    applyRoute();
    global.addEventListener('hashchange', applyRoute, false);
  }

  global.Router = Router;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, false);
  } else {
    init();
  }
})(window);
