/**
 * PlanetX 小程序埋点 SDK
 *
 * 从 Web 版 analytics.js 移植，适配小程序环境。
 * 覆盖：PV/UV、行为事件、错误捕获
 *
 * 用法：
 *   const analytics = require('../../utils/analytics');
 *   analytics.track('button_click', { label: '进入星际空间' });
 *
 * Web 版原路径：looma-zervi/web/static/js/analytics.js
 * API 端点共用 looma-zervi 后端
 */

// ── 配置 ──────────────────────────────────
// 生产环境：腾讯云 looma-zervi (Nginx → FastAPI :8010)
// 开发环境：替换为 127.0.0.1:8010 使用本地 analytics 服务器
var API_BASE = 'https://api.genz.ltd';
var ENDPOINTS = {
  pageview: API_BASE + '/v1/analytics/pageview',
  event:    API_BASE + '/v1/analytics/event',
  error:    API_BASE + '/v1/analytics/error',
  feedback: API_BASE + '/v1/analytics/feedback',
};

// ── Session / 指纹 ────────────────────────
var SESSION_KEY = '_looma_sid';
var FP_KEY = '_looma_fp';

function getSessionId() {
  var sid = wx.getStorageSync(SESSION_KEY);
  if (!sid) {
    sid = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    wx.setStorageSync(SESSION_KEY, sid);
  }
  return sid;
}

function getFingerprint() {
  var fp = wx.getStorageSync(FP_KEY);
  if (!fp) {
    var info = wx.getSystemInfoSync();
    var components = [
      info.brand || '',
      info.model || '',
      info.pixelRatio || '',
      info.language || '',
      info.version || '',
    ];
    fp = 'fp_' + simpleHash(components.join('|'));
    wx.setStorageSync(FP_KEY, fp);
  }
  return fp;
}

function simpleHash(str) {
  var hash = 0, i, chr;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ── 设备信息缓存 ──────────────────────────
var deviceInfo = null;
function getDeviceInfo() {
  if (!deviceInfo) {
    deviceInfo = wx.getSystemInfoSync();
  }
  return deviceInfo;
}

function getCurrentPage() {
  var pages = getCurrentPages();
  if (pages.length > 0) {
    return pages[pages.length - 1].route || '';
  }
  return '';
}

// ── 网络发送 ──────────────────────────────
function sendRequest(url, data) {
  wx.request({
    url: url,
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    data: data,
    success: function () {},
    fail: function (err) {
      // 静默失败 — 埋点不应影响业务
      console.warn('[Analytics] 上报失败', err.errMsg);
    },
  });
}

// ── PV 追踪 ───────────────────────────────
function trackPageview(route) {
  var info = getDeviceInfo();
  var data = {
    path: route || getCurrentPage(),
    title: '',
    referrer: '',
    session_id: getSessionId(),
    fingerprint: getFingerprint(),
    screen_width: info.screenWidth,
    screen_height: info.screenHeight,
    timestamp: new Date().toISOString(),
  };
  sendRequest(ENDPOINTS.pageview, data);
}

// ── 行为事件 ──────────────────────────────
function trackEvent(eventName, opts) {
  opts = opts || {};
  var app = getApp();
  var data = {
    event: eventName,
    category: opts.category || 'general',
    label: opts.label || '',
    value: opts.value || null,
    meta: opts.meta || null,
    path: opts.path || getCurrentPage(),
    session_id: getSessionId(),
    user_id: (app && app.globalData && app.globalData.supabaseUser)
      ? app.globalData.supabaseUser.id
      : null,
    timestamp: new Date().toISOString(),
  };
  sendRequest(ENDPOINTS.event, data);
}

// ── 错误捕获 ──────────────────────────────
function trackError(message, source, lineno, colno, errorType, stack) {
  var info = getDeviceInfo();
  var data = {
    message: (message || '').substring(0, 1000),
    source: (source || '').substring(0, 500),
    lineno: lineno || 0,
    colno: colno || 0,
    error_type: errorType || 'Error',
    stack: (stack || '').substring(0, 4000),
    path: getCurrentPage(),
    user_agent: info.brand + ' ' + info.model + ' WeChat ' + info.version,
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
  };
  sendRequest(ENDPOINTS.error, data);
}

// ── 反馈收集 ──────────────────────────────
function trackFeedback(type, message, email) {
  var data = {
    type: type,
    message: message,
    email: email || '',
    path: getCurrentPage(),
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
  };
  sendRequest(ENDPOINTS.feedback, data);
}

// ── 启动耗时上报 ──────────────────────────
function trackTiming(label, duration) {
  trackEvent('timing', {
    category: 'performance',
    label: label,
    value: Math.round(duration),
  });
}

// ── 导出 ──────────────────────────────────
module.exports = {
  trackPageview: trackPageview,
  trackEvent: trackEvent,
  trackError: trackError,
  trackFeedback: trackFeedback,
  trackTiming: trackTiming,
  getSessionId: getSessionId,
};
