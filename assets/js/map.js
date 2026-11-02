(function (global) {
  'use strict';

  const doc = document;
  const CITY_BASE = 'https://geo.datav.aliyun.com/areas_v3/bound/';
  const PROVINCE_URL = CITY_BASE + '520000_full.json';
  const ANIM_MS = 800;

  // adcode -> 市/州简称
  const GZ_CITY_NAMES = {
    '520100': '贵阳市',
    '520200': '六盘水市',
    '520300': '遵义市',
    '520400': '安顺市',
    '520500': '毕节市',
    '520600': '铜仁市',
    '522300': '黔西南州',
    '522600': '黔东南州',
    '522700': '黔南州'
  };

  let stage = null;
  let chart = null;
  let selectedAdcode = null;
  let waitEChartsTimer = 0;
  let provinceFeatures = [];
  const nameToAdcode = Object.create(null);
  const shortNames = Object.create(null);
  // 自建命中检测：GeoJSON 顶点投影成像素后的多边形
  let hitAreas = [];
  let hitDirty = true;
  let hoveredName = null;
  let hoverRaf = 0;

  function make(tag, className, id) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (id) node.id = id;
    return node;
  }

  function showFallback(target) {
    target.innerHTML = '';
    const box = make('div', 'fp-map-fallback');
    const title = make('h3', 'fp-map-fallback-title');
    title.textContent = '全省地图暂未加载，直接点击下方城市';
    box.appendChild(title);

    const grid = make('div', 'fp-map-fallback-grid');
    Object.keys(GZ_CITY_NAMES).forEach(function (adcode) {
      const btn = make('button', 'fp-map-fallback-btn');
      btn.type = 'button';
      btn.setAttribute('data-city-adcode', adcode);
      btn.innerHTML =
        '<span class="fp-map-fallback-name">' + GZ_CITY_NAMES[adcode] + '</span>' +
        '<span class="fp-map-fallback-chev">›</span>';
      grid.appendChild(btn);
    });
    box.appendChild(grid);

    const hint = make('p', 'fp-map-fallback-hint');
    hint.textContent = '（可能是网络问题，刷新页面后若恢复可重新显示交互式地图）';
    box.appendChild(hint);

    target.appendChild(box);

    grid.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-city-adcode]');
      if (!btn) return;
      const adcode = btn.getAttribute('data-city-adcode');
      global.location.href = 'city.html?adcode=' + adcode + '&mode=spots';
    });
  }

  async function loadGeoJSON(url) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } catch (err) {
      return null;
    }
  }

  function getCityByAdcode(adcode) {
    const data = global.GZ_CITY_DATA;
    if (!data) return null;
    return data[String(adcode)] || null;
  }

  function indexFeatures(geoJSON) {
    provinceFeatures = (geoJSON && geoJSON.features) || [];
    provinceFeatures.forEach(function (feat) {
      const props = feat.properties || {};
      if (props.adcode == null || !props.name) return;
      nameToAdcode[props.name] = String(props.adcode);
      if (GZ_CITY_NAMES[String(props.adcode)]) {
        shortNames[props.name] = GZ_CITY_NAMES[String(props.adcode)];
      }
    });
  }

  // ECharts 回调参数顶层没有 adcode，需要从 data 或区域名反查
  function resolveAdcode(params) {
    if (!params) return null;
    if (params.data && params.data.adcode != null) return String(params.data.adcode);
    if (params.name && nameToAdcode[params.name]) return nameToAdcode[params.name];
    return null;
  }

  function shortLabel(params) {
    return shortNames[params.name] || params.name || '';
  }

  // 生成 series.data；传入 focusAdcode 时给选中/未选中区域配不同样式（淡出效果）
  function provinceData(focusAdcode) {
    return provinceFeatures.map(function (feat) {
      const props = feat.properties || {};
      const item = { name: props.name, adcode: props.adcode, value: 50 };
      if (focusAdcode != null) {
        const selected = String(props.adcode) === String(focusAdcode);
        item.itemStyle = selected
          ? {
              areaColor: '#f4d58b',
              borderColor: '#ffffff',
              borderWidth: 2.4,
              shadowColor: 'rgba(244, 213, 139, 0.55)',
              shadowBlur: 22
            }
          : {
              areaColor: '#0a453c',
              borderColor: '#06302a',
              borderWidth: 0.8
            };
      }
      return item;
    });
  }

  function optionForProvince(provinceGeoJSON) {
    indexFeatures(provinceGeoJSON);
    return {
      backgroundColor: 'transparent',
      animationDurationUpdate: ANIM_MS,
      animationEasingUpdate: 'cubicInOut',
      tooltip: {
        trigger: 'item',
        formatter: function (params) {
          const name = shortLabel(params);
          const adcode = resolveAdcode(params);
          const city = adcode ? getCityByAdcode(adcode) : null;
          if (!city) return name;
          return (
            '<div class="fp-map-tip">' +
            '<strong>' + name + '</strong>' +
            '<span class="fp-map-tip-sub">' + (city.nickname || '') + '</span>' +
            '<div class="fp-map-tip-stats">' +
            '<em>' + city.foods.length + '</em> 美食推荐 · ' +
            '<em>' + city.spots.length + '</em> 景点精选' +
            '</div>' +
            '</div>'
          );
        },
        backgroundColor: 'rgba(7, 42, 36, 0.92)',
        borderColor: 'rgba(244, 213, 139, 0.55)',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        extraCssText: 'box-shadow: 0 16px 34px -20px rgba(0,0,0,0.65); border-radius: 10px; padding: 10px 14px;'
      },
      series: [
        {
          name: '贵州全省',
          type: 'map',
          map: 'guizhou',
          roam: false,
          zoom: 1.15,
          selectedMode: false,
          label: {
            show: true,
            color: '#f6fbf7',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'PingFang SC, "Noto Serif SC", sans-serif',
            formatter: shortLabel
          },
          itemStyle: {
            areaColor: '#0d6b5c',
            borderColor: '#084a41',
            borderWidth: 1.2
          },
          emphasis: {
            label: {
              color: '#f4d58b',
              fontSize: 15
            },
            itemStyle: {
              areaColor: '#0b8773',
              borderColor: '#f4d58b',
              borderWidth: 2
            }
          },
          select: {
            label: { color: '#ffffff' },
            itemStyle: {
              areaColor: '#f4d58b',
              borderColor: '#ffffff',
              borderWidth: 2.5
            }
          },
          data: provinceData(null)
        }
      ]
    };
  }

  function createSideButtons(parentNode, adcode) {
    parentNode.querySelectorAll('.fp-map-side-btn').forEach(function (node) {
      node.parentNode.removeChild(node);
    });

    const city = getCityByAdcode(adcode);
    if (!city) return;

    const foodBtn = make('button', 'fp-map-side-btn fp-map-side-btn-food');
    foodBtn.type = 'button';
    foodBtn.innerHTML =
      '<span class="fp-map-side-icon">🍜</span>' +
      '<span class="fp-map-side-text">查看 ' + city.name + ' 的美食推荐</span>';
    foodBtn.addEventListener('click', function () {
      global.location.href = 'city.html?adcode=' + adcode + '&mode=food';
    });

    const spotBtn = make('button', 'fp-map-side-btn fp-map-side-btn-spot');
    spotBtn.type = 'button';
    spotBtn.innerHTML =
      '<span class="fp-map-side-icon">🏞️</span>' +
      '<span class="fp-map-side-text">查看 ' + city.name + ' 的景点精选</span>';
    spotBtn.addEventListener('click', function () {
      global.location.href = 'city.html?adcode=' + adcode + '&mode=spots';
    });

    parentNode.appendChild(foodBtn);
    parentNode.appendChild(spotBtn);
  }

  function createBackButton(parentNode) {
    parentNode.querySelectorAll('.fp-map-back-btn').forEach(function (node) {
      node.parentNode.removeChild(node);
    });

    const btn = make('button', 'fp-map-back-btn');
    btn.type = 'button';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
      '<path d="M15 18 9 12l6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '<span>返回全省视图</span>';

    btn.addEventListener('click', function () {
      resetView();
    });

    parentNode.appendChild(btn);
  }

  function removeFloatingButtons(parentNode) {
    if (!parentNode) return;
    parentNode.querySelectorAll('.fp-map-back-btn, .fp-map-side-btn').forEach(function (node) {
      node.parentNode.removeChild(node);
    });
  }

  function resetView() {
    if (!chart) return;
    selectedAdcode = null;
    global.GZ_MAP_ACTIVE = false;
    hitDirty = true;
    hoveredName = null;
    removeFloatingButtons(stage);

    chart.setOption({
      series: [
        {
          map: 'guizhou',
          zoom: 1.15,
          center: null,
          data: provinceData(null),
          label: {
            show: true,
            color: '#f6fbf7',
            fontSize: 13,
            fontWeight: 600,
            formatter: shortLabel
          },
          itemStyle: {
            areaColor: '#0d6b5c',
            borderColor: '#084a41',
            borderWidth: 1.2
          },
          emphasis: {
            disabled: false,
            label: { color: '#f4d58b', fontSize: 15 },
            itemStyle: {
              areaColor: '#0b8773',
              borderColor: '#f4d58b',
              borderWidth: 2
            }
          },
          select: { disabled: false }
        }
      ]
    });
  }

  async function focusOn(adcode) {
    if (!chart || selectedAdcode) return;
    const key = String(adcode);
    const city = getCityByAdcode(key);
    if (!city) return;

    selectedAdcode = key;
    global.GZ_MAP_ACTIVE = true;
    hitDirty = true;
    hoveredName = null;
    if (chart.getDom()) chart.getDom().style.cursor = 'default';

    // 选中市的几何中心（GeoJSON properties.center = [lng, lat]）
    let center = null;
    const feat = provinceFeatures.find(function (f) {
      return f.properties && String(f.properties.adcode) === key;
    });
    if (feat && feat.properties && feat.properties.center) {
      center = feat.properties.center;
    }

    // 第一阶段：选中市高亮放大居中，其他市淡出变暗
    chart.setOption({
      series: [
        {
          zoom: 2.1,
          center: center,
          data: provinceData(key),
          label: {
            formatter: function (params) {
              return nameToAdcode[params.name] === key ? shortLabel(params) : '';
            }
          },
          emphasis: { disabled: true },
          select: { disabled: true }
        }
      ]
    });

    // 并行拉取该市区县 GeoJSON
    const cityGeoJSON = await loadGeoJSON(CITY_BASE + key + '_full.json');

    global.setTimeout(function () {
      if (selectedAdcode !== key) return;

      // 第二阶段：切换为该市下辖区县视图
      if (cityGeoJSON) {
        global.echarts.registerMap('city_' + key, cityGeoJSON);
        chart.setOption({
          series: [
            {
              map: 'city_' + key,
              zoom: 1.02,
              center: center,
              data: [],
              label: {
                show: true,
                color: '#1a3a30',
                fontSize: 12.5,
                fontWeight: 600,
                formatter: '{b}'
              },
              itemStyle: {
                areaColor: '#dcece5',
                borderColor: '#ffffff',
                borderWidth: 1.2
              },
              emphasis: {
                disabled: false,
                label: { color: '#084a41', fontSize: 14 },
                itemStyle: {
                  areaColor: '#f4d58b',
                  borderColor: '#b9842c',
                  borderWidth: 2
                }
              },
              select: { disabled: true }
            }
          ]
        });
      }

      createBackButton(stage);
      createSideButtons(stage, key);
    }, ANIM_MS + 120);
  }

  // ---------- 自建命中检测（不依赖 ECharts 的事件层） ----------

  function canvasRect() {
    return chart.getDom().getBoundingClientRect();
  }

  function projectAreas() {
    if (!chart) return;
    hitAreas = [];
    provinceFeatures.forEach(function (feat) {
      const props = feat.properties || {};
      if (!GZ_CITY_NAMES[String(props.adcode)]) return;
      const geom = feat.geometry || {};
      const polys =
        geom.type === 'Polygon' ? [geom.coordinates] :
        geom.type === 'MultiPolygon' ? geom.coordinates : [];
      const rings = [];
      let failed = false;
      polys.forEach(function (poly) {
        if (failed) return;
        poly.forEach(function (ring) {
          if (failed) return;
          const projected = [];
          for (let i = 0; i < ring.length; i++) {
            const p = chart.convertToPixel({ seriesIndex: 0 }, ring[i]);
            if (!p || isNaN(p[0]) || isNaN(p[1])) {
              failed = true;
              return;
            }
            projected.push(p);
          }
          if (projected.length > 2) rings.push(projected);
        });
      });
      if (failed || !rings.length) return;
      hitAreas.push({ adcode: String(props.adcode), name: props.name, rings: rings });
    });
    hitDirty = false;
  }

  // 奇偶规则，可正确处理内环（洞）
  function pointInRings(rings, x, y) {
    let inside = false;
    for (let r = 0; r < rings.length; r++) {
      const ring = rings[r];
      let j = ring.length - 1;
      for (let i = 0; i < ring.length; i++) {
        const xi = ring[i][0];
        const yi = ring[i][1];
        const xj = ring[j][0];
        const yj = ring[j][1];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
        j = i;
      }
    }
    return inside;
  }

  function areaAt(clientX, clientY) {
    if (hitDirty || !hitAreas.length) projectAreas();
    const rect = canvasRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (let i = 0; i < hitAreas.length; i++) {
      if (pointInRings(hitAreas[i].rings, x, y)) return hitAreas[i];
    }
    return null;
  }

  function attachHitTest() {
    stage.addEventListener('click', function (event) {
      if (selectedAdcode) return;
      if (event.target.closest && event.target.closest('.fp-map-side-btn, .fp-map-back-btn')) return;
      const area = areaAt(event.clientX, event.clientY);
      if (area) focusOn(area.adcode);
    });

    stage.addEventListener('mousemove', function (event) {
      if (selectedAdcode) return;
      const cx = event.clientX;
      const cy = event.clientY;
      if (hoverRaf) return;
      hoverRaf = global.requestAnimationFrame(function () {
        hoverRaf = 0;
        if (!chart || selectedAdcode) return;
        const area = areaAt(cx, cy);
        const name = area ? area.name : null;
        if (name === hoveredName) return;
        if (hoveredName) {
          chart.dispatchAction({ type: 'downplay', seriesIndex: 0, name: hoveredName });
        }
        hoveredName = name;
        if (name) {
          chart.dispatchAction({ type: 'highlight', seriesIndex: 0, name: name });
          chart.getDom().style.cursor = 'pointer';
        } else {
          chart.getDom().style.cursor = 'default';
        }
      });
    });
  }

  function attachEvents() {
    chart.on('click', function (params) {
      if (selectedAdcode) return;
      const adcode = resolveAdcode(params);
      if (!adcode) return;
      focusOn(adcode);
    });

    attachHitTest();

    global.addEventListener('resize', function () {
      if (!chart) return;
      chart.resize();
      hitDirty = true;
      hoveredName = null;
    });
  }

  function waitECharts(target) {
    if (global.echarts) {
      init(target);
      return;
    }
    global.clearTimeout(waitEChartsTimer);
    waitEChartsTimer = global.setTimeout(function () {
      if (global.echarts) {
        init(target);
      } else {
        showFallback(target);
      }
    }, 6000);
  }

  async function init(target) {
    stage = target;
    if (!global.echarts) {
      showFallback(target);
      return;
    }

    const provinceGeoJSON = await loadGeoJSON(PROVINCE_URL);
    if (!provinceGeoJSON) {
      showFallback(target);
      return;
    }

    global.echarts.registerMap('guizhou', provinceGeoJSON);

    const mount = make('div', 'fp-map-canvas', 'fpMapEcharts');
    target.appendChild(mount);

    chart = global.echarts.init(mount, null, { renderer: 'canvas' });
    chart.setOption(optionForProvince(provinceGeoJSON));

    attachEvents();
  }

  global.GZ_MAP_READY = function (target) {
    waitECharts(target);
  };
})(window);
