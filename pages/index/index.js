/**
 * PlanetX 首页
 */

const app = getApp();
const analytics = require('../../utils/analytics');

Page({
  data: {
    loggedIn: false,
    tested: false,
    level: 1,
    xp: 0,
    identityLabel: '',
    fleetCount: 0,
    totalExplorers: '139+',
    stars: [],
  },

  onLoad() {
    this._genStars();
  },

  onShow() {
    analytics.trackPageview();
    this._refreshState();
  },

  _genStars() {
    const stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7,
      });
    }
    this.setData({ stars });
  },

  _refreshState() {
    try {
      const loggedIn = app.isLoggedIn ? app.isLoggedIn() : false;
      const profile = (app.globalData && app.globalData.profile) || null;

      let identityLabel = '';
      if (profile && profile.identity) {
        const map = {
          explorer: '🚀 星际探索者',
          captain: '🛸 舰队舰长',
          wanderer: '🌌 星际漫游者',
        };
        identityLabel = map[profile.identity] || '';
      }

      this.setData({
        loggedIn,
        tested: !!(profile && profile.personality_type),
        level: (app.globalData && app.globalData.level) || 1,
        xp: (app.globalData && app.globalData.xp) || 0,
        identityLabel,
      });

      // 异步加载舰队数据
      if (loggedIn) {
        this._loadFleetCount();
      }
    } catch (e) {
      console.warn('[Index] _refreshState error:', e);
    }
  },

  async _loadFleetCount() {
    try {
      const supabase = require('../../utils/supabase');
      const members = await supabase.from('fleet_members').eq('user_id', app.globalData.supabaseUser.id);
      if (members && members.length > 0) {
        this.setData({ fleetCount: members.length });
      }
    } catch (e) {
      // 静默失败 — 测试模式或未登录时正常
    }
  },

  goAuth() {
    analytics.trackEvent('click_enter_space', { category: 'cta', label: '首页进入按钮' });
    wx.navigateTo({ url: '/pages/auth/auth' });
  },

  goTest() {
    analytics.trackEvent('click_start_test', { category: 'cta', label: '首页测试按钮' });
    wx.navigateTo({ url: '/pages/test/test' });
  },

  goHub() {
    analytics.trackEvent('click_go_hub', { category: 'navigation', label: '首页跳星图' });
    wx.switchTab({ url: '/pages/hub/hub' });
  },
});
