/**
 * PlanetX 原生小程序
 * AppID: wx073d0aa7778622da (职链宝/PlanetX)
 * 云开发: jobfirst-basic-4gqdtqwebd96343
 * 数据主存: Supabase (ihuddnluwggbdppheixu)
 */

const analytics = require('./utils/analytics');

App({
  globalData: {
    statusBarHeight: 0,
    navBarHeight: 0,
    // Supabase
    supabaseJwt: null,
    supabaseUser: null,
    // 本地
    profile: null,
    identity: null,  // explorer | captain | wanderer
    level: 1,
    xp: 0,
  },

  onLaunch() {
    // 0. 启动计时
    const startTime = Date.now();

    // 1. 初始化云开发（测试模式下会超时，静默降级）
    try {
      if (wx.cloud) {
        wx.cloud.init({
          env: 'jobfirst-basic-4gqdtqwebd96343',
          traceUser: true,
        });
        console.log('[PlanetX] 云开发初始化完成');
      } else {
        console.warn('[PlanetX] 云开发不可用（需基础库 >= 2.2.3）');
      }
    } catch (e) {
      console.warn('[PlanetX] 云开发初始化失败（测试模式正常现象）:', e.message || e);
    }

    // 2. 计算导航栏高度
    this._calcNavBarHeight();

    // 3. 恢复登录态
    this._restoreSession();

    // 4. 启动耗时上报
    try {
      analytics.trackTiming('app_launch', Date.now() - startTime);
    } catch (e) {}
  },

  onShow(options) {
    // App 切回前台 — 上报 PV
    try {
      analytics.trackPageview();
      analytics.trackEvent('app_show', {
        category: 'lifecycle',
        path: (options && options.path) || '',
      });
    } catch (e) {}
  },

  onError(error) {
    // 全局错误捕获 → 上报埋点
    try {
      analytics.trackError(
        error || 'Unknown Error',
        '',
        0,
        0,
        'AppError',
        ''
      );
    } catch (e) {}
  },

  _calcNavBarHeight() {
    try {
      const { statusBarHeight } = wx.getWindowInfo();
      const { top, height } = wx.getMenuButtonBoundingClientRect();
      this.globalData.statusBarHeight = statusBarHeight;
      this.globalData.navBarHeight = (top - statusBarHeight) * 2 + height;
    } catch (e) {
      this.globalData.statusBarHeight = 20;
      this.globalData.navBarHeight = 44;
    }
  },

  _restoreSession() {
    try {
      const jwt = wx.getStorageSync('psx_jwt');
      const user = wx.getStorageSync('psx_user');
      const profile = wx.getStorageSync('psx_profile');
      if (jwt && user) {
        this.globalData.supabaseJwt = jwt;
        this.globalData.supabaseUser = user;
        this.globalData.profile = profile;
        if (profile) {
          this.globalData.identity = profile.identity;
          this.globalData.level = profile.level || 1;
          this.globalData.xp = profile.xp || 0;
        }
      }
    } catch (e) {
      // ignore
    }
  },

  isLoggedIn() {
    return !!(this.globalData.supabaseJwt && this.globalData.supabaseUser);
  },

  setSession(jwt, user, profile) {
    this.globalData.supabaseJwt = jwt;
    this.globalData.supabaseUser = user;
    this.globalData.profile = profile;
    if (profile) {
      this.globalData.identity = profile.identity;
      this.globalData.level = profile.level || 1;
      this.globalData.xp = profile.xp || 0;
    }
    wx.setStorageSync('psx_jwt', jwt);
    wx.setStorageSync('psx_user', user);
    wx.setStorageSync('psx_profile', profile);
  },

  setProfile(profile) {
    this.globalData.profile = profile;
    this.globalData.identity = profile.identity;
    this.globalData.level = profile.level || 1;
    this.globalData.xp = profile.xp || 0;
    wx.setStorageSync('psx_profile', profile);
  },

  clearSession() {
    this.globalData.supabaseJwt = null;
    this.globalData.supabaseUser = null;
    this.globalData.profile = null;
    this.globalData.identity = null;
    this.globalData.level = 1;
    this.globalData.xp = 0;
    wx.removeStorageSync('psx_jwt');
    wx.removeStorageSync('psx_user');
    wx.removeStorageSync('psx_profile');
  },
});
