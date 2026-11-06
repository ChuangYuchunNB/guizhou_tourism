/**
 * 导航工具：返回首页时优先使用浏览器 BFCache（历史回退），
 * 让用户从详情页/收藏页/城市页回到首页时零刷新、秒打开。
 * 若浏览器历史里没有可回退的首页，则降级为普通跳转。
 *
 * 额外处理：BFCache 恢复时 ECharts canvas 尺寸会变成 0px，
 * 需要在 pageshow 事件（persisted=true）里强制 resize。
 */
(function () {
  'use strict';

  var HOME_URL = 'index.html';
  var HOME_HASH = '#page2';

  function goHome(target) {
    // 1) 有历史可回退 → history.back()（优先触发 BFCache 秒开）
    if (window.history.length > 1) {
      window.history.back();
      return false;
    }
    // 2) 没有历史记录（用户是新开标签或外部链接直达），保底跳转
    window.location.href = target || HOME_URL;
    return false;
  }

  function goHomeList() {
    return goHome(HOME_URL + HOME_HASH);
  }

  // 暴露到全局
  window.goHome = goHome;
  window.goHomeList = goHomeList;

  // 自动事件委托：拦截所有带 data-go-home 的链接/按钮
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go-home]');
    if (!el) return;
    e.preventDefault();
    var target = el.getAttribute('data-go-home') === 'list'
      ? HOME_URL + HOME_HASH
      : HOME_URL;
    goHome(target);
  }, false);

  // ============================================================
  // BFCache / 磁盘缓存恢复优化：
  // 1. ECharts canvas 在 BFCache 恢复后像素被清空（浏览器规范），
  //    必须 setOption 强制重绘，单纯 resize 不够。
  // 2. fullpage.js 的 transform 位置可能因 reflow 偏移，需要重新 paint。
  // ============================================================
  window.addEventListener('pageshow', function (e) {
    var isBF = !!e.persisted;

    // ---- Fullpage.js 重新 paint ----
    var track = document.getElementById('fpTrack');
    var viewport = document.getElementById('fpTrackHolder');
    if (track && viewport) {
      var height = viewport.clientHeight || window.innerHeight;
      var match = /page(\d+)/.exec(window.location.hash || '');
      var index = match ? Math.max(0, Math.min(2, parseInt(match[1], 10) - 1)) : 0;
      var expectedTransform = 'translate3d(0, ' + (-index * height) + 'px, 0)';
      if (height > 0 && track.style.transform !== expectedTransform) {
        track.style.transition = 'none';
        track.style.transform = expectedTransform;
        void track.offsetHeight;
        track.style.transition = '';
      }
    }

    // ---- ECharts 地图 resize + 强制重绘 ----
    // 无论 BFCache 还是磁盘缓存，都尝试重绘（防尺寸/像素丢失）
    if (typeof window.echarts !== 'undefined') {
      // 在 BFCache 恢复或 hash 切换到地图屏（page2）时触发重绘
      var shouldRedraw = isBF || (match && parseInt(match[1], 10) === 2);
      if (!shouldRedraw) return;

      var mapDom = document.getElementById('fpMapCanvasInner');
      if (mapDom) {
        var chart = window.echarts.getInstanceByDom(mapDom);
        if (chart) {
          // 确保父容器有正确尺寸
          void mapDom.offsetHeight; // 触发 reflow
          requestAnimationFrame(function () {
            try {
              chart.resize();
              // 关键：BFCache 清空 canvas 像素，必须 setOption 强制 ECharts 重绘
              var option = chart.getOption();
              if (option) chart.setOption(option, true); // notMerge=true 全量替换
            } catch (err) {
              // 重绘失败不阻塞页面
            }
          });
        }
      }
    }
  });
})();
