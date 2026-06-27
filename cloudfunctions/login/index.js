/**
 * PlanetX 云函数 — login
 * 处理：邀请码验证、Supabase API 调用、wx.login 桥接
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const SUPABASE_URL = 'https://ihuddnluwggbdppheixu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O6vccVYBMxJrN_Vq2Td4Nw_2kHNQHu7';

/**
 * 调用 Supabase REST API
 */
async function supabaseRequest(path, options = {}) {
  const { method = 'GET', body, jwt } = options;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
  };
  if (jwt) {
    headers['Authorization'] = 'Bearer ' + jwt;
    headers['Prefer'] = 'return=representation';
  }

  const res = await cloud.callFunction({
    name: 'login',
    data: { _internal: 'http', path, method, body, headers },
  });

  // 实际 HTTP 调用由云函数内部发起
  // 这里先用 fetch（需要云函数 node 18+）
  const url = SUPABASE_URL + path;
  const fetchRes = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return await fetchRes.json();
}

exports.main = async (event, context) => {
  const { action, code } = event;

  switch (action) {
    // ===== 验证邀请码 =====
    case 'validateInviteCode': {
      try {
        const res = await supabaseRequest(
          '/rest/v1/invite_codes?select=*&code=eq.' + encodeURIComponent(code.toUpperCase())
        );

        if (Array.isArray(res) && res.length > 0) {
          const invite = res[0];
          if (invite.use_count < invite.max_uses) {
            return { valid: true };
          }
          return { valid: false, error: '邀请码已被使用' };
        }
        return { valid: false, error: '邀请码无效' };
      } catch (e) {
        console.error('[login] validateInviteCode error', e);
        // 开发阶段降级
        return { valid: true };
      }
    }

    // ===== 默认 =====
    default:
      return { error: 'unknown action: ' + action };
  }
};
