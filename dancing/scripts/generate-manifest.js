#!/usr/bin/env node
/**
 * 漫喵随舞 — Manifest 生成器
 * 扫描 /dancing/data/ 目录结构 → 生成 manifest.json（前端唯一数据源）
 *
 * 用法：node scripts/generate-manifest.js
 * 每次增删改 data/ 下内容后运行此脚本，然后 git commit + push
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT = path.join(DATA_DIR, 'manifest.json');
const COVER_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

/* ---- 读 JSON 文件 ---- */
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.warn(`  ⚠ 无法解析: ${path.relative(DATA_DIR, filePath)} — ${e.message}`);
    return null;
  }
}

/* ---- 读文本文件 ---- */
function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch (e) {
    console.warn(`  ⚠ 无法读取: ${path.relative(DATA_DIR, filePath)}`);
    return null;
  }
}

/* ---- 是否是纯数字目录名 ---- */
function isNumDir(name, parentPath) {
  const fullPath = path.join(parentPath, name);
  try {
    const stat = fs.statSync(fullPath);
    return stat.isDirectory() && /^\d+$/.test(name);
  } catch {
    return false;
  }
}

/* ---- 生成相对路径（相对于 dancing/） ---- */
function relPath(absPath) {
  return path.relative(path.join(DATA_DIR, '..'), absPath).replace(/\\/g, '/');
}

/* ---- 扫描三级条目（音频文件） ---- */
function scanItems(l2Path) {
  const items = [];
  const dirs = fs.readdirSync(l2Path)
    .filter(d => isNumDir(d, l2Path))
    .sort((a, b) => parseInt(a) - parseInt(b));

  for (const l3 of dirs) {
    const l3Path = path.join(l2Path, l3);
    const item = {
      id: l3,
      path: relPath(l3Path)
    };

    // soundlists.txt (一行一首, 自动转数组)
    const slPath = path.join(l3Path, 'soundlists.txt');
    if (fs.existsSync(slPath)) {
      const raw = readText(slPath);
      if (raw) {
        item.soundlists = raw.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
      }
    }

    const infoPath = path.join(l3Path, 'info.json');
    if (fs.existsSync(infoPath)) {
      const inf = readJSON(infoPath);
      if (inf) item.info = inf;
    }

    const urlPath = path.join(l3Path, 'url.txt');
    if (fs.existsSync(urlPath)) {
      const url = readText(urlPath);
      if (url) item.url = url;
    }

    for (const ext of COVER_EXTS) {
      const cp = path.join(l3Path, 'cover' + ext);
      if (fs.existsSync(cp)) {
        item.cover = relPath(cp);
        break;
      }
    }

    items.push(item);
  }

  return items;
}

/* ---- 扫描二级条目（日期分类） ---- */
function scanEntries(l1Path) {
  const entries = [];
  const dirs = fs.readdirSync(l1Path)
    .filter(d => isNumDir(d, l1Path))
    .sort((a, b) => parseInt(b) - parseInt(a));

  for (const l2 of dirs) {
    const l2Path = path.join(l1Path, l2);
    const settingPath = path.join(l2Path, 'setting.json');
    if (!fs.existsSync(settingPath)) {
      console.warn(`  ⚠ 缺少 setting.json: ${relPath(l2Path)}`);
      continue;
    }

    const config = readJSON(settingPath);
    if (!config) continue;

    const items = scanItems(l2Path);
    entries.push({
      ...config,
      path: relPath(l2Path),
      items
    });
  }

  return entries;
}

/* ---- 扫描一级目录（时长分类） ---- */
function scanDurations() {
  const durations = [];
  const dirs = fs.readdirSync(DATA_DIR)
    .filter(d => isNumDir(d, DATA_DIR))
    .sort((a, b) => parseInt(a) - parseInt(b));

  for (const l1 of dirs) {
    const l1Path = path.join(DATA_DIR, l1);
    const settingPath = path.join(l1Path, 'setting.json');
    if (!fs.existsSync(settingPath)) {
      console.warn(`⚠ 缺少 setting.json: ${relPath(l1Path)}`);
      continue;
    }

    const config = readJSON(settingPath);
    if (!config) continue;

    const entries = scanEntries(l1Path);
    durations.push({
      ...config,
      path: relPath(l1Path),
      entries
    });
  }

  return durations;
}

/* ---- 入口 ---- */
function main() {
  console.log('🔍 扫描 data/ 目录结构...');

  // 站点配置
  const sitePath = path.join(DATA_DIR, 'site.json');
  let site = { name: '漫喵', notice: '', footer: '' };
  if (fs.existsSync(sitePath)) {
    site = readJSON(sitePath) || site;
  } else {
    console.warn('⚠ 缺少 data/site.json，使用默认站点配置');
  }

  const durations = scanDurations();

  const manifest = { site, durations };
  const totalItems = durations.reduce((sum, d) =>
    sum + d.entries.reduce((s2, e) => s2 + e.items.length, 0), 0
  );

  fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ manifest.json 已生成`);
  console.log(`   ${durations.length} 个时长分类`);
  console.log(`   ${durations.reduce((s, d) => s + d.entries.length, 0)} 个日期条目`);
  console.log(`   ${totalItems} 个音频条目`);
  console.log(`   输出: ${OUTPUT}`);
}

main();
