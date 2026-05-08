# 新增音频条目 · 操作指南

## 目录规则
/data/ {时长编号} / {日期编号} / {音频编号} /

编号从 1 开始递增，用纯数字即可。

## 步骤

### 1. 新建时长分类（如已存在则跳过）
创建目录，例如 data/4/
放入 setting.json：
{
  "id": "2.5hour",
  "name": "2.5小时",
  "description": "约150分钟随舞歌单"
}

### 2. 新建日期条目
在时长目录下建子目录，例如 data/1/3/
放入 setting.json：
{
  "id": "2026-06-01",
  "label": "2026年6月1日",
  "tags": [
    { "text": "仅宅舞", "color": "#2e7d32", "bg": "#e8f5e9" }
  ]
}

### 3. 新建音频条目
在日期目录下建子目录，例如 data/1/3/1/
放入以下文件：

soundlists.json  （顺序歌单，JSON 数组）
info.json        （文件信息）
url.txt          （下载链接，纯文本一行）
cover.jpg        （可选封面，支持 jpg/png/webp）

### 4. 运行生成器
node scripts/generate-manifest.js

### 5. 提交推送
git add data/ data/manifest.json
git commit -m "新增: 2026年6月1日 歌单"
git push
