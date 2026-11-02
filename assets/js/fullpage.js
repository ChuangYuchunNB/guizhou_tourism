(function (global) {
  'use strict';

  const doc = document;
  const main = doc.querySelector('main');
  if (!main) { console.warn('[fp] no <main>'); return; }
  if (doc.querySelector('.fp-viewport')) { console.warn('[fp] already initialized'); return; }

  const reduceMotion =
    typeof global.matchMedia === 'function' &&
    global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 实际使用时 900px 以下降级，但允许 headless 测试正常执行
  const tooNarrow = global.innerWidth < 900;
  const hero = main.querySelector('.hero');
  if (!hero) { console.warn('[fp] no .hero'); return; }

  let browse = null;
  Array.prototype.some.call(main.children, function (node) {
    if (node.classList && node.classList.contains('container')) {
      browse = node;
      return true;
    }
    return false;
  });
  if (!browse) { console.warn('[fp] no browse container'); return; }

  const parts = { head: null, search: null, filter: null, result: null, list: null };
  Array.prototype.forEach.call(browse.children, function (node) {
    const name = node.classList;
    if (name.contains('browse-head')) parts.head = node;
    else if (name.contains('browse-search-row')) parts.search = node;
    else if (name.contains('filter-wrap')) parts.filter = node;
    else if (name.contains('result-bar')) parts.result = node;
    else if (name.contains('spot-sections')) parts.list = node;
  });

  const header = doc.querySelector('.site-header');
  const footer = doc.querySelector('.site-footer');
  const DURATION = 900;
  const LABELS = ['首页', '贵州地图', '景区列表'];
  let mapInited = false;

  function make(tag, className, id) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (id) node.id = id;
    return node;
  }

  function buildLevels() {
    const wrap = make('div', 'fp-levels');
    const levels = Array.isArray(global.GZ_LEVELS) ? global.GZ_LEVELS : [];
    const spots = Array.isArray(global.GZ_SPOTS) ? global.GZ_SPOTS : [];

    levels.forEach(function (level) {
      const count = spots.filter(function (spot) {
        return spot.level === level.key;
      }).length;
      const card = make('button', 'fp-level');
      card.type = 'button';
      card.setAttribute('data-fp-level', level.key);
      card.setAttribute('aria-label', '筛选' + level.label + '，共 ' + count + ' 个景区');
      card.innerHTML =
        '<span class="fp-level-key">' + level.key + '</span>' +
        '<span class="fp-level-desc">' + level.desc + '</span>' +
        '<span class="fp-level-count">' + count + ' 个景区</span>';
      wrap.appendChild(card);
    });

    return wrap;
  }

  function buildMapStage() {
    const wrap = make('div', 'fp-map-stage', 'fpMapStage');

    const head = make('div', 'fp-map-head');
    head.innerHTML =
      '<p class="fp-map-kicker">GUIZHOU · 行政区划</p>' +
      '<h3>点击任一市/自治州<br><em>查看下辖区县与本地美食美景</em></h3>' +
      '<p class="fp-map-sub">9 个市、3 个自治州，山水与烟火都值得走一走</p>';
    wrap.appendChild(head);

    const canvas = make('div', 'fp-map-wrap');
    canvas.id = 'fpMapCanvas';
    wrap.appendChild(canvas);

    return wrap;
  }

  const viewport = make('div', 'fp-viewport', 'fpTrackHolder');
  const track = make('div', 'fp-track', 'fpTrack');

  const page1 = make('section', 'fp-section fp-section-hero', 'page1');
  page1.setAttribute('aria-label', '首页主视觉');
  page1.appendChild(hero);

  const page2 = make('section', 'fp-section fp-section-map', 'page2');
  page2.setAttribute('aria-label', '贵州省行政区划地图');
  page2.appendChild(buildMapStage());

  const page3 = make('section', 'fp-section fp-section-list', 'page3');
  page3.setAttribute('aria-label', '景区列表');
  const box3 = make('div', 'container');
  if (parts.search) box3.appendChild(parts.search);
  if (parts.filter) box3.appendChild(parts.filter);
  if (parts.result) box3.appendChild(parts.result);
  if (parts.list) box3.appendChild(parts.list);
  page3.appendChild(box3);
  if (footer) page3.appendChild(footer);

  track.appendChild(page1);
  track.appendChild(page2);
  track.appendChild(page3);
  viewport.appendChild(track);

  const hint = make('div', 'fp-hint');
  hint.innerHTML =
    '<span>向下滚动</span>' +
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M6 9.5 12 15.5 18 9.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  page1.appendChild(hint);

  function markReveal(root, selectors) {
    selectors.forEach(function (selector) {
      Array.prototype.forEach.call(root.querySelectorAll(selector), function (node) {
        node.classList.add('fp-reveal');
      });
    });
  }

  markReveal(page1, ['.hero-eyebrow', '.hero h1', '.hero-desc', '.hero-stats']);
  markReveal(page2, ['.fp-map-head h3', '.fp-map-sub']);
  markReveal(page3, ['.browse-search-row', '.filter-wrap', '.result-bar', '.spot-sections']);

  const dots = make('nav', 'fp-dots', 'fpDots');
  dots.setAttribute('aria-label', '整屏导航');
  const dotButtons = LABELS.map(function (label, i) {
    const button = make('button', 'fp-dot');
    button.type = 'button';
    button.setAttribute('aria-label', '前往第 ' + (i + 1) + ' 屏：' + label);
    button.innerHTML =
      '<span class="fp-dot-label">' + label + '</span>' +
      '<span class="fp-dot-mark"></span>';
    dots.appendChild(button);
    return button;
  });

  const sections = [page1, page2, page3];
  let index = 0;
  let locked = false;
  let lockTimer = 0;
  let height = 0;

  function heightOf() {
    return viewport.clientHeight || global.innerHeight;
  }

  function paint() {
    track.style.transform = 'translate3d(0, ' + -index * height + 'px, 0)';
  }

  function updateHash() {
    if (!global.history || !global.history.replaceState) return;
    const hash = '#page' + (index + 1);
    if (global.location.hash === hash) return;
    global.history.replaceState(
      null,
      '',
      global.location.pathname + global.location.search + hash
    );
  }

  function setActive() {
    sections.forEach(function (section, i) {
      const active = i === index;
      section.classList.toggle('is-active', active);
      if ('inert' in section) section.inert = !active;

      const items = section.querySelectorAll('.fp-reveal');
      Array.prototype.forEach.call(items, function (item, k) {
        item.style.transitionDelay = active ? (0.1 + k * 0.08).toFixed(2) + 's' : '0s';
      });
    });

    dotButtons.forEach(function (button, i) {
      const active = i === index;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });

    if (header) header.classList.toggle('is-solid', index > 0);

    // 第一次进入地图屏时再初始化，避免浪费 GeoJSON 加载
    if (index === 1 && !mapInited && typeof global.GZ_MAP_READY === 'function') {
      const canvas = doc.getElementById('fpMapCanvas');
      if (canvas) {
        mapInited = true;
        global.GZ_MAP_READY(canvas);
      }
    }
  }

  function lock() {
    locked = true;
    global.clearTimeout(lockTimer);
    lockTimer = global.setTimeout(function () {
      locked = false;
    }, DURATION + 120);
  }

  function goTo(target) {
    target = Math.max(0, Math.min(sections.length - 1, target));
    if (target === index) return;
    index = target;
    paint();
    setActive();
    updateHash();
    lock();
  }

  function move(dir) {
    if (locked) return;
    goTo(index + dir);
  }

  function innerScrollable(dir) {
    const section = sections[index];
    if (!section.classList.contains('fp-section-list')) return false;
    const max = section.scrollHeight - section.clientHeight;
    if (max <= 2) return false;
    return dir > 0 ? section.scrollTop < max - 2 : section.scrollTop > 2;
  }

  function scrollListBy(amount) {
    const section = sections[index];
    if (typeof section.scrollBy === 'function') {
      section.scrollBy({ top: amount, behavior: 'smooth' });
    } else {
      section.scrollTop += amount;
    }
  }

  function resetListScroll() {
    const section = sections[2];
    if (section.scrollTop <= 0) return;
    if (typeof section.scrollTo === 'function') {
      section.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      section.scrollTop = 0;
    }
  }

  const hashMatch = /page(\d+)/.exec(global.location.hash || '');
  if (hashMatch) {
    index = Math.max(0, Math.min(sections.length - 1, parseInt(hashMatch[1], 10) - 1));
  }

  doc.documentElement.classList.add('fp-mode');
  main.appendChild(viewport);
  if (!browse.children.length) browse.parentNode.removeChild(browse);
  doc.body.appendChild(dots);

  height = heightOf();
  track.style.transition = 'none';
  paint();
  void track.offsetHeight;
  track.style.transition = '';

  setActive();
  updateHash();

  let acc = 0;
  let accTimer = 0;

  doc.addEventListener(
    'wheel',
    function (event) {
      if (event.ctrlKey || event.defaultPrevented) return;
      if (doc.body.classList.contains('modal-open')) return;

      // 地图屏且处于选中聚焦态时，放行给 ECharts roam 处理，不切屏
      if (index === 1 && global.GZ_MAP_ACTIVE) return;

      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      if (innerScrollable(delta)) return;

      event.preventDefault();
      if (locked) return;

      acc += delta;
      global.clearTimeout(accTimer);
      accTimer = global.setTimeout(function () {
        acc = 0;
      }, 260);

      if (Math.abs(acc) < 60) return;
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      move(dir);
    },
    { passive: false }
  );

  doc.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

    const target = event.target;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }
    if (doc.body.classList.contains('modal-open')) return;

    const key = event.key;
    let dir = 0;
    if (key === 'ArrowDown' || key === 'PageDown' || key === ' ') dir = 1;
    else if (key === 'ArrowUp' || key === 'PageUp') dir = -1;

    if (key === 'Home') {
      event.preventDefault();
      goTo(0);
      return;
    }

    if (key === 'End') {
      event.preventDefault();
      goTo(sections.length - 1);
      return;
    }

    if (!dir) return;

    if (innerScrollable(dir)) {
      event.preventDefault();
      const step = key === 'ArrowDown' || key === 'ArrowUp';
      scrollListBy(dir * (step ? 120 : height * 0.9));
      return;
    }

    event.preventDefault();
    move(dir);
  });

  let touchY = 0;
  let touchTop = 0;
  let touching = false;

  viewport.addEventListener(
    'touchstart',
    function (event) {
      if (event.touches.length !== 1) {
        touching = false;
        return;
      }
      touching = true;
      touchY = event.touches[0].clientY;
      touchTop = sections[index].scrollTop;
    },
    { passive: true }
  );

  viewport.addEventListener(
    'touchend',
    function (event) {
      if (!touching) return;
      touching = false;
      const dy = touchY - event.changedTouches[0].clientY;
      if (Math.abs(dy) < 56) return;
      if (Math.abs(sections[index].scrollTop - touchTop) > 6) return;
      move(dy > 0 ? 1 : -1);
    },
    { passive: true }
  );

  global.addEventListener('resize', function () {
    const next = heightOf();
    if (next === height) return;
    height = next;
    track.style.transition = 'none';
    paint();
    void track.offsetHeight;
    track.style.transition = '';
  });

  global.addEventListener('hashchange', function () {
    const match = /page(\d+)/.exec(global.location.hash || '');
    if (!match) return;
    goTo(parseInt(match[1], 10) - 1);
  });

  dotButtons.forEach(function (button, i) {
    button.addEventListener('click', function () {
      goTo(i);
    });
  });

  if (parts.filter) {
    parts.filter.addEventListener('click', function (event) {
      if (event.target.closest('[data-level-filter]')) resetListScroll();
    });
  }

  if (parts.search) {
    const input = parts.search.querySelector('#searchInput');
    if (input) input.addEventListener('input', resetListScroll);
  }
})(window);