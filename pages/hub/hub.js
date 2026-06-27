const supabase = require('../../utils/supabase');
const analytics = require('../../utils/analytics');
const app = getApp();

Page({
  data: {
    profile: null,
    identityLabel: '',
    level: 1,
    xp: 0,
    tested: false,
    fleet: null,
    missions: [
      { id: 'personality', icon: '🧬', name: '星际人格测试', xp: 100, done: false },
      { id: 'team', icon: '👥', name: '组建三人舰队', xp: 200, done: false },
      { id: 'match', icon: '🔭', name: '星际匹配', xp: 300, done: false },
    ],
  },

  onShow() {
    analytics.trackPageview();
    this._loadData();
  },

  onError(err) {
    analytics.trackError(
      (err && err.message) || 'Hub Error',
      '',
      0,
      0,
      'PageError',
      (err && err.stack) || ''
    );
  },

  async _loadData() {
    const p = app.globalData.profile;
    const map = {
      explorer: '🚀 星际探索者',
      captain: '🛸 舰队舰长',
      wanderer: '🌌 星际漫游者',
    };

    this.setData({
      profile: p,
      identityLabel: p ? (map[p.identity] || '未选择') : '未登录',
      level: app.globalData.level || 1,
      xp: app.globalData.xp || 0,
      tested: !!(p && p.personality_type),
    });

    if (app.isLoggedIn()) {
      await this._loadFleet();
      await this._loadMissions();
    }
  },

  async _loadFleet() {
    try {
      const uid = app.globalData.supabaseUser.id;
      const member = await supabase.from('fleet_members').single('user_id', uid);
      if (member) {
        const fleets = await supabase.from('fleets').eq('id', member.fleet_id);
        const fleet = fleets && fleets.length > 0 ? fleets[0] : null;
        if (fleet) {
          const members = await supabase.from('fleet_members').eq('fleet_id', fleet.id);
          fleet.members = members || [];
          this.setData({ fleet });
          return;
        }
      }
    } catch (e) { /* */ }
    this.setData({ fleet: null });
  },

  async _loadMissions() {
    try {
      const uid = app.globalData.supabaseUser.id;
      const completions = await supabase
        .from('mission_completions')
        .eq('user_id', uid);
      const doneSet = new Set((completions || []).map(c => c.mission_id));
      const missions = this.data.missions.map(m => ({
        ...m,
        done: doneSet.has(m.id),
      }));
      this.setData({ missions });
    } catch (e) { /* */ }
  },

  copyInviteCode() {
    if (this.data.fleet) {
      analytics.trackEvent('copy_invite_code', { category: 'share', label: this.data.fleet.invite_code });
      wx.setClipboardData({ data: this.data.fleet.invite_code });
      wx.showToast({ title: '邀请码已复制', icon: 'success' });
    }
  },

  goTest() {
    analytics.trackEvent('click_start_test', { category: 'cta', label: '从星图进入' });
    wx.navigateTo({ url: '/pages/test/test' });
  },

  goSettings() {
    analytics.trackEvent('click_settings', { category: 'navigation' });
    wx.showToast({ title: '设置页开发中', icon: 'none' });
  },

  goDiscover() {
    analytics.trackEvent('click_discover', { category: 'navigation', label: '星际匹配入口' });
    wx.showToast({ title: '星际匹配即将上线', icon: 'none' });
  },
});
