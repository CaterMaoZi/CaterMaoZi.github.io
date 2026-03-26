/**
 * 河北漫喵动漫展 - 官方票代身份核对系统
 * 前端交互脚本
 */

// DOM元素
const cnInput = document.getElementById('cnInput');
const queryBtn = document.getElementById('queryBtn');
const resultSection = document.getElementById('resultSection');
const buttonText = queryBtn.querySelector('.button-text');
const buttonLoading = queryBtn.querySelector('.button-loading');

// 绑定事件
queryBtn.addEventListener('click', handleQuery);
cnInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleQuery();
  }
});

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
    // 发送查询请求
    const response = await fetch(`/api/query?cn=${encodeURIComponent(cn)}`);
    const data = await response.json();
    
    // 显示结果
    if (data.success && data.data) {
      showResult(true, data.message, data.data);
    } else {
      showResult(false, data.message);
    }
  } catch (error) {
    console.error('查询失败:', error);
    showResult(false, '查询失败，请检查网络连接后重试');
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
