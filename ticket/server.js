const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.DEPLOY_RUN_PORT || 5000;

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

// 读取票代数据
function getTicketAgents() {
  try {
    const dataPath = path.join(__dirname, 'data.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据文件失败:', error);
    return [];
  }
}

// 根据CN查询票代
function queryByCN(cn) {
  const agents = getTicketAgents();
  return agents.find(agent => agent.cn === cn);
}

// 处理API请求
function handleAPIRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 查询接口
  if (pathname === 'https://catermaozi.github.io/ticket/api/query' && req.method === 'GET') {
    const cn = url.searchParams.get('cn');
    
    if (!cn || cn.trim() === '') {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '请输入票代的CN(圈名)' }));
      return;
    }
    
    const agent = queryByCN(cn.trim());
    
    if (agent) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        data: agent,
        message: '身份核对成功，官方票代确认无误！'
      }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        message: '身份核对失败，请立刻核查对方身份！官方交流群：1055807210'
      }));
    }
    return;
  }
  
  // 获取所有票代列表接口（可选，用于调试）
  if (pathname === '/api/agents' && req.method === 'GET') {
    const agents = getTicketAgents();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, data: agents }));
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: '接口不存在' }));
}

// 处理静态文件请求
function handleStaticRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;
  
  // 默认首页
  if (pathname === '/') {
    pathname = 'https://catermaozi.github.io/ticket/index.html';
  }
  
  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// 创建服务器
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // API请求
  if (url.pathname.startsWith('/api/')) {
    handleAPIRequest(req, res);
  } else {
    // 静态文件请求
    handleStaticRequest(req, res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
});
