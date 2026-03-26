/**
 * 河北漫喵动漫展 - 官方票代身份核对系统
 * 前端交互脚本（纯静态版本 - 支持 GitHub Pages 部署）
 */

// DOM元素
const cnInput = document.getElementById('cnInput');
const queryBtn = document.getElementById('queryBtn');
const resultSection = document.getElementById('resultSection');
const buttonText = queryBtn.querySelector('.button-text');
const buttonLoading = queryBtn.querySelector('.button-loading');

// 缓存票代数据
let agentsData = null;

// 绑定事件
queryBtn.addEventListener('click', handleQuery);
cnInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleQuery();
  }
});

/**
 * 获取数据文件路径（支持 GitHub Pages 子路径部署）
 * @returns {string} 数据文件的完整路径
 */
function getDataPath() {
  // 获取当前页面的基础路径
  // GitHub Pages 可能部署在子路径，如 https://username.github.io/repo-name/
  const basePath = window.location.pathname.replace(/\/$/, '');
  // 使用相对路径，自动适应当前位置
  return './data.json';
}

/**
 * 加载票代数据
 * @returns {Promise<Array>} 票代数据数组
 */
async function loadAgentsData() {
  // 如果已缓存，直接返回
  if (agentsData) {
    return agentsData;
  }
  
  try {
    const dataPath = getDataPath();
    const response = await fetch(dataPath);
    
    if (!response.ok) {
      throw new Error(`加载数据失败: ${response.status}`);
    }
    
    agentsData = await response.json();
    return agentsData;
  } catch (error) {
    console.error('加载数据文件失败:', error);
    throw error;
  }
}

/**
 * 根据CN查询票代
 * @param {string} cn - 圈名
 * @returns {object|null} 票代信息或null
 */
async function queryByCN(cn) {
  const agents = await loadAgentsData();
  return agents.find(agent => agent.cn === cn) || null;
}

/**
 * 处理查询请求
 */
async function handleQuery() {
  const cn = cnInput.value.trim();
  
  // 验证输入
  if (!cn) {
    showResult(false, '请输入票代的CN(圈名)');
    return;
  }
  
  // 显示加载状态
  setLoading(true);
  
  try {
    // 查询票代数据
    const agent = await queryByCN(cn);
    
    if (agent) {
      // 查询成功
      showResult(true, '身份核对成功，官方票代确认无误！', agent);
    } else {
      // 查询失败
      showResult(false, '身份核对失败，请立刻核查对方身份！官方交流群：1055807210');
    }
  } catch (error) {
    console.error('查询失败:', error);
    showResult(false, '数据加载失败，请刷新页面后重试');
  } finally {
    setLoading(false);
  }
}

/**
 * 显示查询结果
 * @param {boolean} success - 是否成功
 * @param {string} message - 提示消息
 * @param {object} agentData - 票代数据（可选）
 */
function showResult(success, message, agentData = null) {
  resultSection.style.display = 'block';
  
  if (success && agentData) {
    // 成功结果
    resultSection.innerHTML = `
      <div class="result-success">
        <div class="success-icon"></div>
        <h2 class="success-title">${message}</h2>
        
        <div class="info-card">
          <h3 class="info-title">票代信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">数字ID</span>
              <span class="info-value">${escapeHtml(agentData.id)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">CN(圈名)</span>
              <span class="info-value">${escapeHtml(agentData.cn)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">性别</span>
              <span class="info-value">${escapeHtml(agentData.gender)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">票代等级</span>
              <span class="info-value">${escapeHtml(agentData.level)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">微信</span>
              <span class="info-value">${escapeHtml(agentData.wechat)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">QQ号</span>
              <span class="info-value">${escapeHtml(agentData.qq)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // 失败结果
    resultSection.innerHTML = `
      <div class="result-fail">
        <div class="fail-icon"></div>
        <h2 class="fail-title">身份核对失败</h2>
        <p class="fail-message">${escapeHtml(message)}</p>
      </div>
    `;
  }
  
  // 滚动到结果区域
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * 设置加载状态
 * @param {boolean} loading - 是否加载中
 */
function setLoading(loading) {
  queryBtn.disabled = loading;
  cnInput.disabled = loading;
  
  if (loading) {
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline-flex';
  } else {
    buttonText.style.display = 'inline';
    buttonLoading.style.display = 'none';
  }
}

/**
 * HTML转义，防止XSS攻击
 * @param {string} text - 需要转义的文本
 * @returns {string} - 转义后的文本
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
