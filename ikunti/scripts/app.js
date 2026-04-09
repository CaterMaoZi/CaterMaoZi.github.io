// SBTI App Logic
const DRUNK_TRIGGER_QUESTION_ID = 'drink_gate_q2';

const app = {
  shuffledQuestions: [],
  answers: {},
  previewMode: false
};

const screens = {
  intro: document.getElementById('intro'),
  test: document.getElementById('test'),
  result: document.getElementById('result')
};

const questionList = document.getElementById('questionList');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const submitBtn = document.getElementById('submitBtn');
const testHint = document.getElementById('testHint');

function showScreen(name) {
  Object.entries(screens).forEach(function(entry) {
    var key = entry[0];
    var el = entry[1];
    if (key === name) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shuffle(array) {
  var arr = array.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function getVisibleQuestions() {
  var visible = app.shuffledQuestions.slice();
  var gateIndex = -1;
  for (var i = 0; i < visible.length; i++) {
    if (visible[i].id === 'drink_gate_q1') {
      gateIndex = i;
      break;
    }
  }
  if (gateIndex !== -1 && app.answers['drink_gate_q1'] === 3) {
    visible.splice(gateIndex + 1, 0, specialQuestions[1]);
  }
  return visible;
}

function getQuestionMetaLabel(q) {
  if (q.special) return '补充题';
  return app.previewMode ? dimensionMeta[q.dim].name : '维度已隐藏';
}

function renderQuestions() {
  var visibleQuestions = getVisibleQuestions();
  questionList.innerHTML = '';
  visibleQuestions.forEach(function(q, index) {
    var card = document.createElement('article');
    card.className = 'question';

    var optionsHtml = '';
    var codes = ['A', 'B', 'C', 'D'];
    q.options.forEach(function(opt, i) {
      var code = codes[i] || String(i + 1);
      var checked = app.answers[q.id] === opt.value ? 'checked' : '';
      var selectedClass = app.answers[q.id] === opt.value ? ' selected' : '';
      optionsHtml += '<label class="option' + selectedClass + '">' +
        '<input type="radio" name="' + q.id + '" value="' + opt.value + '" ' + checked + ' />' +
        '<div class="option-code">' + code + '</div>' +
        '<div>' + opt.label + '</div>' +
        '</label>';
    });

    card.innerHTML = '<div class="question-meta">' +
      '<div class="badge">第 ' + (index + 1) + ' 题</div>' +
      '<div>' + getQuestionMetaLabel(q) + '</div>' +
      '</div>' +
      '<div class="question-title">' + q.text + '</div>' +
      '<div class="options">' + optionsHtml + '</div>';

    questionList.appendChild(card);
  });

  questionList.querySelectorAll('input[type="radio"]').forEach(function(input) {
    input.addEventListener('change', function(e) {
      var name = e.target.name;
      var value = Number(e.target.value);
      app.answers[name] = value;

      // Update visual selection
      var parent = e.target.closest('.options');
      parent.querySelectorAll('.option').forEach(function(opt) {
        opt.classList.remove('selected');
      });
      e.target.closest('.option').classList.add('selected');

      if (name === 'drink_gate_q1') {
        if (value !== 3) {
          delete app.answers['drink_gate_q2'];
        }
        renderQuestions();
        return;
      }

      updateProgress();
    });
  });

  updateProgress();
}

function updateProgress() {
  var visibleQuestions = getVisibleQuestions();
  var total = visibleQuestions.length;
  var done = 0;
  visibleQuestions.forEach(function(q) {
    if (app.answers[q.id] !== undefined) done++;
  });
  var percent = total ? (done / total) * 100 : 0;
  progressBar.style.width = percent + '%';
  progressText.textContent = done + ' / ' + total;
  var complete = done === total && total > 0;
  submitBtn.disabled = !complete;
  testHint.textContent = complete
    ? '都做完了。现在可以把你的电子魂魄交给结果页审判。'
    : '全选完才会放行。世界已经够乱了，起码把题做完整。';
}

function sumToLevel(score) {
  if (score <= 3) return 'L';
  if (score === 4) return 'M';
  return 'H';
}

function levelNum(level) {
  if (level === 'L') return 1;
  if (level === 'M') return 2;
  return 3;
}

function parsePattern(pattern) {
  return pattern.replace(/-/g, '').split('');
}

function getDrunkTriggered() {
  return app.answers[DRUNK_TRIGGER_QUESTION_ID] === 2;
}

function computeResult() {
  var rawScores = {};
  var levels = {};
  Object.keys(dimensionMeta).forEach(function(dim) { rawScores[dim] = 0; });

  questions.forEach(function(q) {
    rawScores[q.dim] += Number(app.answers[q.id] || 0);
  });

  Object.keys(rawScores).forEach(function(dim) {
    levels[dim] = sumToLevel(rawScores[dim]);
  });

  var boostConfig = {
    'IKUN': { dist: 3, exact: 2 },
    'hot-chicken': { dist: 3, exact: 0 },
    'CartierRR': { dist: 1, exact: 1 },
    'SYNB': { dist: 2, exact: 1 }
  };
  var userVector = dimensionOrder.map(function(dim) { return levelNum(levels[dim]); });
  var ranked = NORMAL_TYPES.map(function(type) {
    var vector = parsePattern(type.pattern).map(levelNum);
    var distance = 0;
    var exact = 0;
    for (var i = 0; i < vector.length; i++) {
      var diff = Math.abs(userVector[i] - vector[i]);
      distance += diff;
      if (diff === 0) exact += 1;
    }
    var boost = boostConfig[type.code];
    if (boost) {
      distance = Math.max(0, distance - boost.dist);
      exact = Math.min(15, exact + boost.exact);
    }
    var similarity = Math.max(0, Math.round((1 - distance / 30) * 100));
    return Object.assign({}, type, TYPE_LIBRARY[type.code], { distance: distance, exact: exact, similarity: similarity });
  }).sort(function(a, b) {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (b.exact !== a.exact) return b.exact - a.exact;
    return b.similarity - a.similarity;
  });

  var bestNormal = ranked[0];
  var drunkTriggered = getDrunkTriggered();

  var finalType;
  var modeKicker = '你的主类型';
  var badge = '匹配度 ' + bestNormal.similarity + '% · 精准命中 ' + bestNormal.exact + '/15 维';
  var sub = '维度命中度较高，当前结果可视为你的第一人格画像。';
  var special = false;

  if (drunkTriggered) {
    finalType = TYPE_LIBRARY.DRUNK;
    modeKicker = '隐藏人格已激活';
    badge = '匹配度 100% · 酒精异常因子已接管';
    sub = '乙醇亲和性过强，系统已直接跳过常规人格审判。';
    special = true;
  } else if (bestNormal.similarity < 60) {
    finalType = TYPE_LIBRARY.HHHH;
    modeKicker = '系统强制兜底';
    badge = '标准人格库最高匹配仅 ' + bestNormal.similarity + '%';
    sub = '标准人格库对你的脑回路集体罢工了，于是系统把你强制分配给了 HHHH。';
    special = true;
  } else {
    finalType = bestNormal;
  }

  return {
    rawScores: rawScores,
    levels: levels,
    ranked: ranked,
    bestNormal: bestNormal,
    finalType: finalType,
    modeKicker: modeKicker,
    badge: badge,
    sub: sub,
    special: special
  };
}

function renderDimList(result) {
  var dimList = document.getElementById('dimList');
  dimList.innerHTML = dimensionOrder.map(function(dim) {
    var level = result.levels[dim];
    var explanation = DIM_EXPLANATIONS[dim][level];
    var score = result.rawScores[dim];
    var pct = Math.round(((score - 2) / 4) * 100);
    var barColor = level === 'H' ? '#4d6a53' : (level === 'M' ? '#8aaa8f' : '#c5d5c8');
    return '<div class="dim-item">' +
      '<div class="dim-item-top">' +
      '<div class="dim-item-name">' + dimensionMeta[dim].name + '</div>' +
      '<div class="dim-item-score">' + level + ' / ' + score + '分</div>' +
      '</div>' +
      '<div class="dim-bar-wrap"><div class="dim-bar" style="width:' + pct + '%;background:' + barColor + '"></div></div>' +
      '<p>' + explanation + '</p>' +
      '</div>';
  }).join('');
}

function renderResult() {
  var result = computeResult();
  var type = result.finalType;

  document.getElementById('resultModeKicker').textContent = result.modeKicker;
  document.getElementById('resultTypeName').textContent = type.code + '（' + type.cn + '）';
  document.getElementById('matchBadge').textContent = result.badge;
  document.getElementById('resultTypeSub').textContent = result.sub;
  document.getElementById('resultDesc').textContent = type.desc;
  document.getElementById('posterCaption').textContent = type.intro;

  var posterBox = document.getElementById('posterBox');
  var posterImage = document.getElementById('posterImage');
  var imageSrc = typeof TYPE_IMAGES !== 'undefined' ? TYPE_IMAGES[type.code] : null;
  if (imageSrc) {
    posterImage.src = imageSrc;
    posterImage.alt = type.code + '（' + type.cn + '）';
    posterBox.classList.remove('no-image');
    posterBox.classList.add('has-image');
  } else {
    posterImage.removeAttribute('src');
    posterImage.alt = '';
    posterBox.classList.add('no-image');
    posterBox.classList.remove('has-image');
  }
  document.getElementById('posterEmoji').textContent = type.emoji || '';

  document.getElementById('funNote').textContent = result.special
    ? '本测试纯属作者乐子人做出来的，不要相信任何东西，别拿它当诊断、面试、相亲、分手、招魂、算命或人生判决书。说你是什么你也别信'
    : '本测试纯属作者乐子人做出来的，不要相信任何东西，别拿它当诊断、面试、相亲、分手、招魂、算命或人生判决书。说你是什么你也别信';

  renderDimList(result);
  showScreen('result');
}

function startTest(preview) {
  app.previewMode = preview || false;
  app.answers = {};
  var shuffledRegular = shuffle(questions);
  var insertIndex = Math.floor(Math.random() * shuffledRegular.length) + 1;
  app.shuffledQuestions = shuffledRegular.slice(0, insertIndex).concat([specialQuestions[0]]).concat(shuffledRegular.slice(insertIndex));
  renderQuestions();
  showScreen('test');
}

document.getElementById('startBtn').addEventListener('click', function() { startTest(false); });
document.getElementById('backIntroBtn').addEventListener('click', function() { showScreen('intro'); });
document.getElementById('submitBtn').addEventListener('click', renderResult);
document.getElementById('restartBtn').addEventListener('click', function() { startTest(false); });
document.getElementById('toTopBtn').addEventListener('click', function() { showScreen('intro'); });

document.getElementById('shareBtn').addEventListener('click', function() {
  var typeName = document.getElementById('resultTypeName').textContent;
  var domain = window.location.hostname;
  var text = '\u6211\u5728\u3010IKUN-SBTI\u3011\u6d4b\u8bd5\u4e2d\u53d6\u5f97\u3010' + typeName + '\u3011\u7ed3\u679c\uff0c\u70b9\u51fb\u6d4b\u8bd5\uff1ahttps://' + domain;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showShareModal();
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showShareModal();
  }
});

function showShareModal() {
  var existing = document.getElementById('shareModalMask');
  if (existing) existing.remove();
  var mask = document.createElement('div');
  mask.id = 'shareModalMask';
  mask.className = 'share-modal-mask';
  mask.innerHTML = '<div class="share-modal">' +
    '<div class="share-modal-icon">\uD83D\uDCCB</div>' +
    '<div class="share-modal-text">\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f\uff0c\u53bb\u5fae\u4fe1\u670b\u53cb\u5708\u7c98\u8d34\u53d1\u9001</div>' +
    '<button class="share-modal-btn" id="shareModalClose">\u77e5\u9053\u4e86</button>' +
    '</div>';
  document.body.appendChild(mask);
  document.getElementById('shareModalClose').addEventListener('click', function() { mask.remove(); });
  mask.addEventListener('click', function(e) { if (e.target === mask) mask.remove(); });
}

// 图片点击放大
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('expand-qr-clickable')) {
    var overlay = document.createElement('div');
    overlay.className = 'img-overlay';
    var img = document.createElement('img');
    img.src = e.target.src;
    img.alt = e.target.alt;
    overlay.appendChild(img);
    overlay.addEventListener('click', function() { overlay.remove(); });
    document.body.appendChild(overlay);
  }
});
