// result.js —— 结果页装配：读取进度 → 评分 → 渲染板块 → 分享卡导出
import { QUESTIONS } from '../data/questions.js';
import { loadProgress } from '../core/storage.js';
import { scoreTest } from '../core/scoring.js';
import { drawShareCard } from '../core/share-card.js';
import {
  renderMainDim, renderRadar, renderRanking, renderTopDims, renderNeeds,
  renderContrast, renderConflict, renderAttraction, renderMatching, renderGrowth, renderConfidence,
} from '../core/render.js';

const progress = loadProgress();
const answers = progress?.answers || {};

if (!answers || Object.keys(answers).length === 0) {
  document.getElementById('sections').innerHTML =
    `<div class="card"><p>还没有答题记录。</p><a class="btn btn-primary" href="test.html">去测试</a></div>`;
} else {
  const report = scoreTest(answers, QUESTIONS);

  const html = [
    renderConfidence(report),
    renderMainDim(report),
    renderRadar(report),
    renderRanking(report),
    renderTopDims(report),
    renderNeeds(report),
    renderContrast(report),
    renderConflict(report),
    renderAttraction(report),
    renderMatching(report),
    renderGrowth(report),
  ].join('');
  document.getElementById('sections').innerHTML = html;

  const canvas = document.getElementById('share-canvas');
  try {
    drawShareCard(canvas, report);
  } catch (e) {
    canvas.style.display = 'none';
    document.getElementById('save-hint').textContent = '分享卡渲染失败，但不影响其它结果。';
  }

  document.getElementById('save-card').addEventListener('click', () => {
    const hint = document.getElementById('save-hint');
    try {
      canvas.toBlob((blob) => {
        if (!blob) { hint.textContent = '导出失败，请尝试长按图片保存。'; return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `恋爱系别_${report.mainDimKey}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        hint.textContent = '已保存到下载目录。也可右键/长按图片另存。';
      }, 'image/png');
    } catch (e) {
      hint.textContent = '当前环境不支持自动下载，请右键/长按上方图片保存。';
    }
  });
}
