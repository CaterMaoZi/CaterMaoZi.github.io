# 河北漫喵动漫展 - 官方票代身份核对系统

## 简介

这是一个用于核对票代身份的网页应用，支持部署在 GitHub Pages 上。

## 功能特点

- 根据票代CN(圈名)查询身份信息
- 显示票代详细信息（数字ID、CN、性别、票代等级、微信、QQ号）
- 查询成功/失败的友好提示
- 响应式设计，支持移动端
- 支持深色模式

## GitHub Pages 部署步骤

### 方法一：直接部署

1. 将项目推送到 GitHub 仓库
2. 进入仓库的 **Settings** → **Pages**
3. 在 **Source** 下选择 `main` 分支，点击 **Save**
4. 等待几分钟后，访问 `https://你的用户名.github.io/仓库名/`

### 方法二：使用 GitHub Actions 自动部署

在仓库中创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 文件结构

```
├── index.html          # 主页面
├── app.js              # 前端交互逻辑
├── data.json           # 票代数据文件
├── styles/
│   └── main.css        # 样式文件
└── README.md           # 说明文档
```

## 如何添加新票代

编辑 `data.json` 文件，按照以下格式添加：

```json
{
  "id": "009",
  "cn": "新票代CN",
  "gender": "女",
  "level": "金牌票代",
  "wechat": "微信号",
  "qq": "QQ号"
}
```

## 示例数据

系统中已预设测试票代：
- 星空小熊（金牌票代）
- 梦幻少女（银牌票代）
- 二次元少年（金牌票代）
- 猫咪酱（铜牌票代）

## 技术栈

- HTML5
- CSS3（响应式设计、深色模式支持）
- 原生 JavaScript（无需框架）

## 注意事项

1. 部署在 GitHub Pages 子路径时，所有资源路径已使用相对路径，无需额外配置
2. `data.json` 文件需要与 `index.html` 放在同一目录下
3. 如需更新票代数据，修改 `data.json` 后推送即可

## 备案信息

备案号：冀ICP备2024091724号-1
