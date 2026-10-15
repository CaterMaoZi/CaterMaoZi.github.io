// share-card.js —— Canvas 2D 绘制分享卡（15 维，无第三方依赖）
import { DIMENSIONS } from '../data/dimensions.js';
import { DIM_KEYS, DIMS_META } from './keys.js';

export function drawShareCard(canvas, report) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 440, H = 600;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const key = report.mainDimKey;
  const d = DIMENSIONS[key];
  const color = DIMS_META[key].color;

  ctx.fillStyle = '#f6f1e9'; ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 24, 24, W - 48, H - 48, 24);
  ctx.fillStyle = '#fffdfa'; ctx.fill();
  ctx.strokeStyle = '#e7ddce'; ctx.lineWidth = 1; ctx.stroke();

  const cx = W / 2;
  ctx.textAlign = 'center';

  // 菱形
  ctx.save(); ctx.translate(cx, 70); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#b08a52'; ctx.fillRect(-6, -6, 12, 12); ctx.restore();

  ctx.fillStyle = '#b08a52'; ctx.font = '600 12px -apple-system,"Microsoft YaHei",sans-serif';
  ctx.fillText('Y O U R   T Y P E', cx, 104);

  // 徽标
  const badge = d.en;
  ctx.font = '600 13px -apple-system,"Microsoft YaHei",sans-serif';
  const bw = ctx.measureText(badge).width + 28;
  roundRect(ctx, cx - bw / 2, 120, bw, 26, 13);
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(badge, cx, 138);

  // 大名
  ctx.fillStyle = color; ctx.font = '700 44px -apple-system,"Microsoft YaHei",sans-serif';
  ctx.fillText(d.name, cx, 198);
  ctx.fillStyle = '#6a615a'; ctx.font = '14px -apple-system,"Microsoft YaHei",sans-serif';
  ctx.fillText(d.keywords.join('  ·  '), cx, 226);

  // 迷你雷达
  drawMiniRadar(ctx, cx, 348, 92, report);

  // Top3
  ctx.textAlign = 'center';
  ctx.fillStyle = '#b08a52'; ctx.font = '600 11px -apple-system,"Microsoft YaHei",sans-serif';
  ctx.fillText('T O P   3', cx, 472);
  ctx.fillStyle = '#3a3330'; ctx.font = '600 16px -apple-system,"Microsoft YaHei",sans-serif';
  const top3 = report.topDims.slice(0, 3).map((t) => DIMENSIONS[t.key].name + ' ' + t.score).join('   ');
  ctx.fillText(top3, cx, 496);

  // 描述
  ctx.fillStyle = '#6a615a'; ctx.font = '13px -apple-system,"Microsoft YaHei",sans-serif';
  wrapText(ctx, d.def, cx, 524, W - 110, 20);

  // 底标
  ctx.fillStyle = '#b08a52'; ctx.font = '600 11px -apple-system,"Microsoft YaHei",sans-serif';
  ctx.fillText('十五维恋爱属性测试', cx, H - 46);
  ctx.fillStyle = '#9b9088'; ctx.font = '10px -apple-system,"Microsoft YaHei",sans-serif';
  ctx.fillText('仅供娱乐与自我探索', cx, H - 30);
}

function drawMiniRadar(ctx, cx, cy, R, report) {
  const n = DIM_KEYS.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  // 网格
  ctx.strokeStyle = '#e7ddce'; ctx.lineWidth = 1;
  for (let g = 1; g <= 3; g++) {
    const r = (R * g) / 3;
    ctx.beginPath();
    DIM_KEYS.forEach((_, i) => { const [x, y] = pt(i, r); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.closePath(); ctx.stroke();
  }
  DIM_KEYS.forEach((_, i) => { const [x, y] = pt(i, R); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); });
  // 数据
  ctx.beginPath();
  DIM_KEYS.forEach((k, i) => { const [x, y] = pt(i, R * (report.dims[k].score || 0) / 100); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.closePath();
  ctx.fillStyle = 'rgba(176,138,82,0.2)'; ctx.fill();
  ctx.strokeStyle = '#b08a52'; ctx.lineWidth = 2; ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const chars = [...text]; let line = '';
  for (const ch of chars) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, y); line = ch; y += lh; }
    else line += ch;
  }
  if (line) ctx.fillText(line, x, y);
}
