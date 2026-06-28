/**
 * PlanetX 云函数 — login
 * 处理：邀请码验证（统一走 Looma API）、wx.login 桥接
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 统一 API 地址 — 邀请码验证统一走后端
const API_BASE = 'https://api.genz.ltd';

exports.main = async (event, context) => {
  const { action, code } = event;

  switch (action) {
    // ===== 验证邀请码（统一走 Looma API）=====
    case 'validateInviteCode': {
      try {
        const fetchRes = await fetch(API_BASE + '/v1/referral/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.toUpperCase() }),
        });
        const data = await fetchRes.json();

        if (data.valid) {
          return { valid: true };
        }
        return { valid: false, error: data.message || '邀请码无效' };
      } catch (e) {
        console.error('[login] validateInviteCode error', e);
        // 开发阶段降级：API 不可用时自动放行
        return { valid: true };
      }
    }

    // ===== 默认 =====
    default:
      return { error: 'unknown action: ' + action };
  }
};
