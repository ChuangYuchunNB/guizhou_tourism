(function (global) {
  'use strict';

  const INTERVAL = 3000;
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
  if (slides.length < 2) return;

  // 预热轮播图片，避免切换到尚未加载完的图片时出现空画面
  slides.forEach(function (slide) {
    const match = /url\((['"]?)([^'")]+)\1\)/.exec(slide.style.backgroundImage || '');
    if (match) {
      const image = new global.Image();
      image.src = match[2];
    }
  });

  const prevButton = hero.querySelector('[data-hero-prev]');
  const nextButton = hero.querySelector('[data-hero-next]');
  let index = 0;
  let timer = null;

  function show(target) {
    index = (target + slides.length) % slides.length;
    slides.forEach(function (slide, position) {
      slide.classList.toggle('is-active', position === index);
    });
  }

  function stop() {
    if (timer) {
      global.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    timer = global.setInterval(function () {
      show(index + 1);
    }, INTERVAL);
  }

  function step(delta) {
    show(index + delta);
    start();
  }

  if (prevButton) {
    prevButton.addEventListener('click', function () {
      step(-1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      step(1);
    });
  }

  // 页面切到后台时暂停，回到前台继续，避免无意义计时
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  // 首页导航悬浮在轮播图上，滚动后转为实色底，保证文字可读
  const header = document.querySelector('.site-header');
  function syncHeader() {
    if (!header) return;
    header.classList.toggle('is-solid', global.scrollY > 30);
  }
  global.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  show(0);
  start();
})(window);