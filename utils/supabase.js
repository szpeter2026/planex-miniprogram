/**
 * Supabase REST 客户端（小程序版）
 * 
 * 小程序里不能直接用 @supabase/supabase-js CDN
 * 直接调 Supabase REST API + GoTrue Auth API
 */

const SUPABASE_URL = 'https://ihuddnluwggbdppheixu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O6vccVYBMxJrN_Vq2Td4Nw_2kHNQHu7';

/**
 * 通用 Supabase REST 请求
 */
function supabaseRequest(path, options = {}) {
  const { method = 'GET', body, jwt } = options;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
  };
  if (jwt) {
    headers['Authorization'] = 'Bearer ' + jwt;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: SUPABASE_URL + path,
      method: method,
      header: headers,
      data: body,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject({ code: res.statusCode, message: res.data });
        }
      },
      fail(err) {
        reject({ code: 0, message: err.errMsg });
      },
    });
  });
}

/**
 * 注册（邮箱+密码）
 */
function signUp(email, password) {
  return supabaseRequest('/auth/v1/signup', {
    method: 'POST',
    body: { email, password },
  });
}

/**
 * 登录（邮箱+密码）
 */
function signIn(email, password) {
  return supabaseRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  }).then(data => {
    // 格式：{ access_token, user, ... }
    return {
      jwt: data.access_token,
      user: data.user,
    };
  });
}

/**
 * 获取当前用户 session
 */
function getSession(jwt) {
  return supabaseRequest('/auth/v1/user', { jwt });
}

/**
 * 查询表数据
 */
function from(table) {
  return {
    async select(columns = '*') {
      const query = new URLSearchParams();
      if (columns !== '*') query.set('select', columns);
      return supabaseRequest(`/rest/v1/${table}?${query.toString()}`, {
        jwt: getApp().globalData.supabaseJwt,
      });
    },

    async eq(column, value) {
      return supabaseRequest(
        `/rest/v1/${table}?select=*&${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`,
        { jwt: getApp().globalData.supabaseJwt }
      );
    },

    async insert(data) {
      return supabaseRequest(`/rest/v1/${table}`, {
        method: 'POST',
        body: data,
        jwt: getApp().globalData.supabaseJwt,
      });
    },

    async update(data, match) {
      let path = `/rest/v1/${table}`;
      if (match) {
        const [col, val] = Object.entries(match)[0];
        path += `?${encodeURIComponent(col)}=eq.${encodeURIComponent(val)}`;
      }
      return supabaseRequest(path, {
        method: 'PATCH',
        body: data,
        jwt: getApp().globalData.supabaseJwt,
      });
    },

    async upsert(data) {
      return supabaseRequest(`/rest/v1/${table}`, {
        method: 'POST',
        body: data,
        jwt: getApp().globalData.supabaseJwt,
      });
    },

    async single(column, value) {
      const res = await supabaseRequest(
        `/rest/v1/${table}?select=*&${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`,
        { jwt: getApp().globalData.supabaseJwt }
      );
      return Array.isArray(res) ? res[0] : res;
    },
  };
}

module.exports = {
  signUp,
  signIn,
  getSession,
  from,
};
