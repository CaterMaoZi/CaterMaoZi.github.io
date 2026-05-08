/* ========================================
   漫喵-预制随舞音频选择目录 — 主脚本 v2
   纯静态 SPA · Hash 路由 · 目录驱动 · 零依赖
   数据源: data/manifest.json（由 scripts/generate-manifest.js 生成）
   ======================================== */

(function () {
  'use strict';

  /* ---- State ---- */
  var catalog = null;
  var BASE = (function () {
    var s = document.currentScript ? document.currentScript.src : '';
    var m = s.match(/(.*\/)assets\/js\/main\.js/);
    return m ? m[1] : './';
  })();

  /* ---- Routes ---- */
  var ROUTES = {
    '/':                          { handler: renderDurations },
    '/duration/:id':              { handler: renderEntryList },
    '/entry/:dId/:eId':           { handler: renderItemList },
    '/detail/:dId/:eId/:itemId':  { handler: renderDetail },
    '/404':                       { handler: render404 }
  };

  /* ---- Router ---- */
  function parseHash() {
    var raw = location.hash.replace(/^#/, '') || '/';
    var parts = raw.split('/').filter(Boolean);
    return { path: '/' + parts.join('/'), parts: parts };
  }

  function matchRoute(path, parts) {
    var keys = Object.keys(ROUTES);
    for (var k = 0; k < keys.length; k++) {
      var pattern = keys[k];
      if (pattern === '/404') continue;
      var patParts = pattern.split('/').filter(Boolean);
      if (patParts.length !== parts.length && pattern !== '/') continue;
      if (pattern === '/' && path === '/') return { handler: ROUTES[pattern].handler, params: {} };
      var match = true;
      var params = {};
      for (var i = 0; i < patParts.length; i++) {
        if (patParts[i].charAt(0) === ':') {
          params[patParts[i].slice(1)] = parts[i];
        } else if (patParts[i] !== parts[i]) {
          match = false; break;
        }
      }
      if (match) return { handler: ROUTES[pattern].handler, params: params };
    }
    return { handler: ROUTES['/404'].handler, params: {} };
  }

  /* ---- Helpers ---- */
  function el(id) { return document.getElementById(id); }
  function esc(str) {
    if (!str && str !== 0) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /* ---- Find helpers in manifest ---- */
  function findDuration(id) {
    return (catalog.durations || []).filter(function (d) { return d.id === id; })[0];
  }
  function findEntry(duration, eId) {
    return (duration.entries || []).filter(function (e) { return e.id === eId; })[0];
  }
  function findItem(entry, itemId) {
    return (entry.items || []).filter(function (i) { return i.id === itemId; })[0];
  }

  /* ---- Render: Duration list (Level 1) ---- */
  function renderDurations() {
    var main = el('app-content');
    var durations = catalog.durations || [];
    el('breadcrumb').innerHTML = '';

    if (durations.length === 0) {
      main.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>暂无时长分类</p></div>';
      return;
    }

    var h = '<div class="section-title"><span class="icon">⏱</span> 按时长选择</div>';
    h += '<div class="duration-list">';
    durations.forEach(function (d) {
      var count = (d.entries || []).length;
      h += '<a class="duration-card" href="#/duration/' + esc(d.id) + '" aria-label="查看 ' + esc(d.name) + ' 分类" tabindex="0">';
      h += '<div class="card-left"><div class="card-icon">⏱</div>';
      h += '<div><div class="card-name">' + esc(d.name) + '</div>';
      if (d.description) h += '<div class="card-desc">' + esc(d.description) + '</div>';
      h += '</div></div>';
      h += '<div style="display:flex;align-items:center;gap:4px">';
      h += '<span class="card-count">' + count + ' 个歌单</span>';
      h += '<span class="card-arrow">→</span></div></a>';
    });
    h += '</div>';
    main.innerHTML = h;
  }

  /* ---- Render: Date entry list (Level 2) ---- */
  function renderEntryList(params) {
    var dId = params.id;
    var duration = findDuration(dId);

    var bc = el('breadcrumb');
    bc.innerHTML = '<a href="#/" tabindex="0">⏱ 时长分类</a><span class="sep">›</span><span class="current">' + esc(duration ? duration.name : dId) + '</span>';

    var main = el('app-content');
    if (!duration) {
      main.innerHTML = '<div class="error-state"><div class="error-icon">🔍</div><p>未找到该时长分类</p><button class="btn btn-outline" onclick="location.hash=\'#/\'" style="margin-top:12px">返回首页</button></div>';
      return;
    }
    var entries = duration.entries || [];

    var h = '<button class="btn-back" onclick="location.hash=\'#/\'" aria-label="返回时长分类"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> 返回时长分类</button>';
    h += '<div class="section-title"><span class="icon">📅</span> ' + esc(duration.name) + ' · 按完成时间选择</div>';

    if (entries.length === 0) {
      h += '<div class="empty-state"><div class="empty-icon">📭</div><p>该时长下暂无歌单</p></div>';
    } else {
      h += '<div class="entry-list">';
      entries.forEach(function (entry) {
        h += '<a class="entry-card" href="#/entry/' + esc(dId) + '/' + esc(entry.id) + '" aria-label="查看 ' + esc(entry.label) + '" tabindex="0">';
        h += '<div class="entry-header">';
        h += '<span class="entry-label">' + esc(entry.label) + '</span>';
        if (entry.tags && entry.tags.length > 0) h += '<span class="tags">' + renderTags(entry.tags) + '</span>';
        h += '</div>';
        var itemCount = (entry.items || []).length;
        var totalSongs = (entry.items || []).reduce(function (s, it) { return s + (it.soundlists || []).length; }, 0);
        h += '<div class="entry-meta">' + itemCount + ' 个音频 · ' + totalSongs + ' 首曲目</div>';
        h += '</a>';
      });
      h += '</div>';
    }
    main.innerHTML = h;
  }

  /* ---- Render: Item list with covers (Level 3) ✨ NEW ---- */
  function renderItemList(params) {
    var dId = params.dId;
    var eId = params.eId;
    var duration = findDuration(dId);
    if (!duration) { render404(); return; }
    var entry = findEntry(duration, eId);
    if (!entry) { render404(); return; }

    var bc = el('breadcrumb');
    bc.innerHTML = '<a href="#/" tabindex="0">⏱ 时长分类</a><span class="sep">›</span>' +
      '<a href="#/duration/' + esc(dId) + '" tabindex="0">' + esc(duration.name) + '</a><span class="sep">›</span>' +
      '<span class="current">' + esc(entry.label) + '</span>';

    var main = el('app-content');
    var items = entry.items || [];

    var h = '<button class="btn-back" onclick="location.hash=\'#/duration/' + esc(dId) + '\'" aria-label="返回日期列表"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> 返回日期列表</button>';
    h += '<div class="section-title"><span class="icon">🎵</span> ' + esc(entry.label) + '</div>';
    if (entry.tags && entry.tags.length > 0) h += '<div class="tags" style="margin-bottom:14px">' + renderTags(entry.tags) + '</div>';

    if (items.length === 0) {
      h += '<div class="empty-state"><div class="empty-icon">📭</div><p>该日期下暂无音频条目</p></div>';
    } else {
      h += '<div class="item-grid">';
      items.forEach(function (item) {
        var info = item.info || {};
        var title = info.title || '音频条目 #' + item.id;
        var coverHTML = item.cover
          ? '<div class="item-cover" style="background-image:url(\'' + esc(item.cover) + '\')"></div>'
          : '<div class="item-cover item-cover-default">🎵</div>';
        var songCount = (item.soundlists || []).length;

        h += '<a class="item-card" href="#/detail/' + esc(dId) + '/' + esc(eId) + '/' + esc(item.id) + '" aria-label="查看 ' + esc(title) + '" tabindex="0">';
        h += coverHTML;
        h += '<div class="item-body">';
        h += '<div class="item-title">' + esc(title) + '</div>';
        h += '<div class="item-meta">' + songCount + ' 首曲目';
        if (info.duration) h += ' · ' + esc(info.duration);
        h += '</div>';
        h += '</div></a>';
      });
      h += '</div>';
    }
    main.innerHTML = h;
  }

  /* ---- Render: Detail page (Level 4) ---- */
  function renderDetail(params) {
    var dId = params.dId;
    var eId = params.eId;
    var itemId = params.itemId;
    var duration = findDuration(dId);
    if (!duration) { render404(); return; }
    var entry = findEntry(duration, eId);
    if (!entry) { render404(); return; }
    var item = findItem(entry, itemId);
    if (!item) { render404(); return; }

    var bc = el('breadcrumb');
    bc.innerHTML = '<a href="#/" tabindex="0">⏱ 时长分类</a><span class="sep">›</span>' +
      '<a href="#/duration/' + esc(dId) + '" tabindex="0">' + esc(duration.name) + '</a><span class="sep">›</span>' +
      '<a href="#/entry/' + esc(dId) + '/' + esc(eId) + '" tabindex="0">' + esc(entry.label) + '</a><span class="sep">›</span>' +
      '<span class="current">详情</span>';

    var main = el('app-content');
    var info = item.info || {};

    var h = '<button class="btn-back" onclick="location.hash=\'#/entry/' + esc(dId) + '/' + esc(eId) + '\'" aria-label="返回音频列表"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> 返回音频列表</button>';

    h += '<div class="detail-card">';
    // Cover image
    if (item.cover) {
      h += '<img class="detail-cover" src="' + esc(item.cover) + '" alt="封面" loading="lazy">';
    }
    h += '<div class="detail-title">' + esc(info.title || entry.label) + '</div>';
    h += '<div class="detail-subtitle">' + esc(duration.name) + ' · ' + esc(entry.label) + '</div>';
    if (entry.tags && entry.tags.length > 0) {
      h += '<div class="detail-tags tags">' + renderTags(entry.tags) + '</div>';
    }
    var songCount = (item.soundlists || []).length;
    if (songCount > 0) {
      h += '<div class="detail-subtitle" style="margin-top:2px">' + songCount + ' 首曲目';
      if (info.duration) h += ' · ' + esc(info.duration);
      h += '</div>';
    }

    h += '<div class="detail-actions">';
    h += '<button class="btn btn-primary" onclick="showPlaylistModal(\'' + esc(dId) + '\',\'' + esc(eId) + '\',\'' + esc(itemId) + '\')" aria-label="查看顺序歌单"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg> 查看顺序歌单</button>';
    h += '<button class="btn btn-secondary" onclick="showInfoModal(\'' + esc(dId) + '\',\'' + esc(eId) + '\',\'' + esc(itemId) + '\')" aria-label="文件信息"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> 文件信息</button>';
    if (item.url) {
      h += '<a class="btn btn-download" href="' + esc(item.url) + '" target="_blank" rel="noopener" aria-label="前往下载"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m7-11l5 5-5 5m5-5H3"/></svg> 前往下载</a>';
    }
    h += '</div></div>';
    main.innerHTML = h;
  }

  function render404() {
    var main = el('app-content');
    main.innerHTML = '<div class="error-state"><div class="error-icon">🔍</div><p>页面未找到</p><button class="btn btn-outline" onclick="location.hash=\'#/\'" style="margin-top:12px">返回首页</button></div>';
    el('breadcrumb').innerHTML = '';
  }

  /* ---- Tags Render ---- */
  function renderTags(tags) {
    return tags.map(function (t) {
      return '<span class="tag" style="color:' + esc(t.color || '#333') + ';background:' + esc(t.bg || '#eee') + '">' + esc(t.text) + '</span>';
    }).join('');
  }

  /* ---- Modal System ---- */
  var activeModal = null;

  function openModal(title, bodyHTML) {
    closeModal();
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', title);
    overlay.innerHTML = '<div class="modal-content">' +
      '<div class="modal-header"><h2>' + esc(title) + '</h2><button class="modal-close" aria-label="关闭" onclick="window._closeModal()">✕</button></div>' +
      '<div class="modal-body">' + bodyHTML + '</div></div>';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) window._closeModal();
    });
    document.body.appendChild(overlay);
    activeModal = overlay;
    var btn = overlay.querySelector('.modal-close');
    if (btn) btn.focus();
  }

  function closeModal() {
    if (activeModal) {
      var o = activeModal;
      o.classList.add('closing');
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 150);
      activeModal = null;
    }
  }

  window._closeModal = closeModal;

  /* ---- Modal: Playlist ---- */
  window.showPlaylistModal = function (dId, eId, itemId) {
    var item = getItem(dId, eId, itemId);
    if (!item) return;
    var pl = item.soundlists || [];
    var info = item.info || {};
    var html = pl.length === 0
      ? '<div class="empty-state"><p>暂无歌单信息</p></div>'
      : '<ol class="playlist-list">' + pl.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    openModal('顺序歌单 — ' + (info.title || '音频条目'), html);
  };

  /* ---- Modal: File Info ---- */
  window.showInfoModal = function (dId, eId, itemId) {
    var item = getItem(dId, eId, itemId);
    if (!item) return;
    var fi = item.info || {};
    var rows = [];
    if (fi.size)       rows.push(['文件大小', esc(fi.size)]);
    if (fi.loudness)   rows.push(['音频响度', esc(fi.loudness)]);
    if (fi.format)     rows.push(['音频格式', esc(fi.format)]);
    if (fi.duration)   rows.push(['时长', esc(fi.duration)]);
    if (fi.bitrate)    rows.push(['码率', esc(fi.bitrate)]);
    if (fi.sampleRate) rows.push(['采样率', esc(fi.sampleRate)]);
    if (fi.channels)   rows.push(['声道', esc(fi.channels)]);

    var html = rows.length === 0
      ? '<div class="empty-state"><p>暂无文件信息</p></div>'
      : '<table class="file-info-table">' + rows.map(function (r) {
          return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>';
        }).join('') + '</table>';
    openModal('文件信息 — ' + (fi.title || '音频条目'), html);
  };

  function getItem(dId, eId, itemId) {
    if (!catalog) return null;
    var duration = findDuration(dId);
    if (!duration) return null;
    var entry = findEntry(duration, eId);
    if (!entry) return null;
    return findItem(entry, itemId);
  }

  /* ---- Init ---- */
  function init() {
    var main = el('app-content');
    main.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', BASE + 'data/manifest.json', true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          catalog = JSON.parse(xhr.responseText);
        } catch (e) {
          main.innerHTML = '<div class="error-state"><div class="error-icon">⚠</div><p>manifest.json 解析失败，请重新运行 scripts/generate-manifest.js</p></div>';
          return;
        }
        document.title = catalog.site ? catalog.site.name : '漫喵随舞目录';
        if (catalog.site && catalog.site.notice) el('notice-text').textContent = catalog.site.notice;
        if (catalog.site && catalog.site.footer)   el('footer-text').textContent = catalog.site.footer;
        route();
      } else {
        main.innerHTML = '<div class="error-state"><div class="error-icon">⚠</div><p>无法加载 manifest.json（HTTP ' + xhr.status + '），请运行 scripts/generate-manifest.js 生成</p></div>';
      }
    };
    xhr.onerror = function () {
      main.innerHTML = '<div class="error-state"><div class="error-icon">⚠</div><p>网络错误，无法加载数据配置</p></div>';
    };
    xhr.send();
  }

  function route() {
    var hi = parseHash();
    var m = matchRoute(hi.path, hi.parts);
    if (!catalog && m.handler !== render404) {
      el('app-content').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      return;
    }
    m.handler(m.params);
  }

  window.addEventListener('hashchange', function () { if (catalog) route(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activeModal) closeModal();
  });

  init();
})();
