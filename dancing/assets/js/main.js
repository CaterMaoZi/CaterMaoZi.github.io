/* ========================================
   漫喵-预制随舞音频选择目录 — 主脚本
   纯静态 SPA · Hash 路由 · 零依赖
   ======================================== */

(function () {
  'use strict';

  /* ---- State ---- */
  let catalog = null;
  const BASE = (function () {
    const s = document.currentScript ? document.currentScript.src : '';
    const m = s.match(/(.*\/)assets\/js\/main\.js/);
    return m ? m[1] : './';
  })();

  /* ---- Routes ---- */
  const ROUTES = {
    '/':              { view: 'durations', handler: renderDurations },
    '/duration/:id':  { view: 'entries',   handler: renderEntries },
    '/detail/:dId/:eId': { view: 'detail', handler: renderDetail },
    '/404':           { view: 'error',     handler: render404 }
  };

  /* ---- Router ---- */
  function parseHash() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const parts = raw.split('/').filter(Boolean);
    return { path: '/' + parts.join('/'), parts };
  }

  function matchRoute(path, parts) {
    for (const [pattern, route] of Object.entries(ROUTES)) {
      const patParts = pattern.split('/').filter(Boolean);
      if (patParts.length !== parts.length && pattern !== '/') continue;
      if (pattern === '/' && path === '/') return { ...route, params: {} };
      if (pattern === '/404') continue;
      let match = true;
      const params = {};
      for (let i = 0; i < patParts.length; i++) {
        if (patParts[i].startsWith(':')) {
          params[patParts[i].slice(1)] = parts[i];
        } else if (patParts[i] !== parts[i]) {
          match = false; break;
        }
      }
      if (match) return { ...route, params };
    }
    return { ...ROUTES['/404'], params: {} };
  }

  function navigate(hash) {
    location.hash = '#' + hash.replace(/^#/, '');
  }

  /* ---- Helpers ---- */
  function el(id) { return document.getElementById(id); }
  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  function formatSize(bytes) {
    if (typeof bytes === 'number') {
      if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + ' MB';
      if (bytes > 1024) return (bytes / 1024).toFixed(0) + ' KB';
      return bytes + ' B';
    }
    return bytes || '未知';
  }

  /* ---- Navigation State ---- */
  let navStack = [];

  function pushNav(current) {
    navStack.push(current);
  }
  function popNav() {
    navStack.pop();
    return navStack[navStack.length - 1] || '/';
  }

  /* ---- Render Views ---- */
  function renderDurations() {
    navStack = ['/'];
    const main = el('app-content');
    const durations = catalog.durations || [];

    if (durations.length === 0) {
      main.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>暂无时长分类</p></div>';
      return;
    }

    let html = '<div class="section-title"><span class="icon">⏱</span> 按时长选择</div>';
    html += '<div class="duration-list">';
    durations.forEach(function (d) {
      const count = (d.entries || []).length;
      html += '<a class="duration-card" href="#/duration/' + esc(d.id) + '" aria-label="查看 ' + esc(d.name) + ' 分类" tabindex="0">';
      html += '<div class="card-left">';
      html += '<div class="card-icon">⏱</div>';
      html += '<div><div class="card-name">' + esc(d.name) + '</div>';
      if (d.description) html += '<div class="card-desc">' + esc(d.description) + '</div>';
      html += '</div></div>';
      html += '<div style="display:flex;align-items:center;gap:4px">';
      html += '<span class="card-count">' + count + ' 个歌单</span>';
      html += '<span class="card-arrow">→</span>';
      html += '</div></a>';
    });
    html += '</div>';
    main.innerHTML = html;
    el('breadcrumb').innerHTML = '';
  }

  function renderEntries(params) {
    const dId = params.id;
    const duration = (catalog.durations || []).find(function (d) { return d.id === dId; });

    const bc = el('breadcrumb');
    bc.innerHTML = '<a href="#/" tabindex="0">⏱ 时长分类</a><span class="sep">›</span><span class="current">' + esc(duration ? duration.name : dId) + '</span>';

    const main = el('app-content');
    if (!duration) {
      main.innerHTML = '<div class="error-state"><div class="error-icon">🔍</div><p>未找到该时长分类</p><button class="btn btn-outline" onclick="location.hash=\'#/\'" style="margin-top:12px">返回首页</button></div>';
      return;
    }
    const entries = duration.entries || [];

    let html = '<button class="btn-back" onclick="location.hash=\'#/\'" aria-label="返回时长分类"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> 返回时长分类</button>';
    html += '<div class="section-title"><span class="icon">📅</span> ' + esc(duration.name) + ' · 按完成时间选择</div>';

    if (entries.length === 0) {
      html += '<div class="empty-state"><div class="empty-icon">📭</div><p>该时长下暂无歌单</p></div>';
    } else {
      html += '<div class="entry-list">';
      entries.forEach(function (entry) {
        html += '<a class="entry-card" href="#/detail/' + esc(dId) + '/' + esc(entry.id) + '" aria-label="查看 ' + esc(entry.label) + '" tabindex="0">';
        html += '<div class="entry-header">';
        html += '<span class="entry-label">' + esc(entry.label) + '</span>';
        if (entry.tags && entry.tags.length > 0) {
          html += '<span class="tags">' + renderTags(entry.tags) + '</span>';
        }
        html += '</div>';
        var plCount = (entry.playlist || []).length;
        html += '<div class="entry-meta">' + plCount + ' 首曲目 · ' + esc(entry.fileInfo ? entry.fileInfo.duration : '') + '</div>';
        html += '</a>';
      });
      html += '</div>';
    }
    main.innerHTML = html;
  }

  function renderDetail(params) {
    const dId = params.dId;
    const eId = params.eId;
    const duration = (catalog.durations || []).find(function (d) { return d.id === dId; });
    if (!duration) { render404(); return; }
    const entry = (duration.entries || []).find(function (e) { return e.id === eId; });
    if (!entry) { render404(); return; }

    const bc = el('breadcrumb');
    bc.innerHTML = '<a href="#/" tabindex="0">⏱ 时长分类</a><span class="sep">›</span><a href="#/duration/' + esc(dId) + '" tabindex="0">' + esc(duration.name) + '</a><span class="sep">›</span><span class="current">' + esc(entry.label) + '</span>';

    const main = el('app-content');
    let html = '<button class="btn-back" onclick="location.hash=\'#/duration/' + esc(dId) + '\'" aria-label="返回日期列表"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> 返回日期列表</button>';

    html += '<div class="detail-card">';
    html += '<div class="detail-title">' + esc(entry.label) + '</div>';
    html += '<div class="detail-subtitle">' + esc(duration.name) + '歌单</div>';
    if (entry.tags && entry.tags.length > 0) {
      html += '<div class="detail-tags tags">' + renderTags(entry.tags) + '</div>';
    }

    html += '<div class="detail-actions">';
    html += '<button class="btn btn-primary" onclick="showPlaylistModal(\'' + esc(dId) + '\',\'' + esc(eId) + '\')" aria-label="查看顺序歌单"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg> 查看顺序歌单</button>';
    html += '<button class="btn btn-secondary" onclick="showInfoModal(\'' + esc(dId) + '\',\'' + esc(eId) + '\')" aria-label="文件信息"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> 文件信息</button>';
    var dl = entry.downloadUrl || '';
    if (dl) {
      html += '<a class="btn btn-download" href="' + esc(dl) + '" target="_blank" rel="noopener" aria-label="前往下载"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m7-11l5 5-5 5m5-5H3"/></svg> 前往下载</a>';
    }
    html += '</div>';

    html += '</div>';
    main.innerHTML = html;
  }

  function render404() {
    const main = el('app-content');
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
  let activeModal = null;

  function openModal(title, bodyHTML) {
    closeModal();
    const overlay = document.createElement('div');
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
    // Focus trap: focus close button
    var btn = overlay.querySelector('.modal-close');
    if (btn) btn.focus();
  }

  function closeModal() {
    if (activeModal) {
      var overlay = activeModal;
      overlay.classList.add('closing');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 150);
      activeModal = null;
    }
  }

  window._closeModal = closeModal;

  /* ---- Modal: Playlist ---- */
  window.showPlaylistModal = function (dId, eId) {
    var entry = getEntry(dId, eId);
    if (!entry) return;
    var pl = entry.playlist || [];
    var html = pl.length === 0
      ? '<div class="empty-state"><p>暂无歌单信息</p></div>'
      : '<ol class="playlist-list">' + pl.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    openModal('顺序歌单 — ' + entry.label, html);
  };

  /* ---- Modal: File Info ---- */
  window.showInfoModal = function (dId, eId) {
    var entry = getEntry(dId, eId);
    if (!entry) return;
    var fi = entry.fileInfo || {};
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
    openModal('文件信息 — ' + entry.label, html);
  };

  function getEntry(dId, eId) {
    if (!catalog) return null;
    var duration = (catalog.durations || []).find(function (d) { return d.id === dId; });
    if (!duration) return null;
    return (duration.entries || []).find(function (e) { return e.id === eId; });
  }

  /* ---- Init ---- */
  function init() {
    var main = el('app-content');
    main.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';

    // Load catalog
    var xhr = new XMLHttpRequest();
    xhr.open('GET', BASE + 'data/catalog.json', true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          catalog = JSON.parse(xhr.responseText);
        } catch (e) {
          main.innerHTML = '<div class="error-state"><div class="error-icon">⚠</div><p>数据配置解析失败，请检查 data/catalog.json 格式</p></div>';
          return;
        }
        document.title = catalog.site ? catalog.site.name : '漫喵随舞目录';
        // Set notice
        if (catalog.site && catalog.site.notice) {
          el('notice-text').textContent = catalog.site.notice;
        }
        // Set footer
        if (catalog.site && catalog.site.footer) {
          el('footer-text').textContent = catalog.site.footer;
        }
        route();
      } else {
        main.innerHTML = '<div class="error-state"><div class="error-icon">⚠</div><p>无法加载数据配置（HTTP ' + xhr.status + '），请确认 data/catalog.json 文件存在</p></div>';
      }
    };
    xhr.onerror = function () {
      main.innerHTML = '<div class="error-state"><div class="error-icon">⚠</div><p>网络错误，无法加载数据配置</p></div>';
    };
    xhr.send();
  }

  function route() {
    var hashInfo = parseHash();
    var matched = matchRoute(hashInfo.path, hashInfo.parts);
    if (!catalog && matched.view !== 'error') {
      el('app-content').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      return;
    }
    matched.handler(matched.params);
  }

  // Listen for hash changes
  window.addEventListener('hashchange', function () {
    if (catalog) route();
  });

  // Keyboard: ESC to close modal
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activeModal) {
      closeModal();
    }
  });

  // Start
  init();
})();
