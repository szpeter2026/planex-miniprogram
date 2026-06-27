/**
 * PlanetX 登录页
 */

const supabase = require('../../utils/supabase');
const analytics = require('../../utils/analytics');
const app = getApp();

Page({
  data: {
    step: 1,        // 1=邀请码 2=注册 3=登录
    inviteCode: '',
    email: '',
    password: '',
    loading: false,
    errorMsg: '',
  },

  onShow() {
    analytics.trackPageview();
  },

  onCodeInput(e) {
    this.setData({
      inviteCode: e.detail.value.toUpperCase(),
      errorMsg: '',
    });
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value.trim(), errorMsg: '' });
  },

  onPwdInput(e) {
    this.setData({ password: e.detail.value, errorMsg: '' });
  },

  /**
   * 验证邀请码（通过云函数查 Supabase）
   */
  async onValidateCode() {
    const { inviteCode } = this.data;
    if (!inviteCode) return;

    this.setData({ loading: true, errorMsg: '' });
    analytics.trackEvent('validate_code', { category: 'auth', label: inviteCode.substring(0, 3) + '***' });

    try {
      // 调用云函数验证邀请码
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'validateInviteCode',
          code: inviteCode,
        },
      });

      if (res.result && res.result.valid) {
        analytics.trackEvent('code_valid', { category: 'auth' });
        this.setData({ step: 2, loading: false });
      } else {
        analytics.trackEvent('code_invalid', { category: 'auth', label: inviteCode.substring(0, 3) });
        this.setData({
          errorMsg: res.result.error || '邀请码无效',
          loading: false,
        });
      }
    } catch (e) {
      console.error('[Auth] 验证邀请码失败', e);
      analytics.trackError('code_validation_failed', '', 0, 0, 'AuthError', (e && e.message) || '');
      // 降级：直接跳过邀请码验证
      this.setData({ step: 2, loading: false });
    }
  },

  /**
   * 注册
   */
  async onSignUp() {
    const { email, password } = this.data;
    this.setData({ loading: true, errorMsg: '' });
    analytics.trackEvent('signup_attempt', { category: 'auth' });

    try {
      const { jwt, user } = await supabase.signUp(email, password);
      analytics.trackEvent('signup_success', { category: 'auth', meta: { user_id: user.id } });

      // 创建 profile
      const profileData = {
        id: user.id,
        level: 1,
        xp: 0,
        xp_to_next: 100,
      };

      try {
        await supabase.from('profiles').insert(profileData);
      } catch (profileErr) {
        console.warn('[Auth] profile 插入失败（可能已存在）', profileErr);
      }

      // 加载完整 profile
      let profile = null;
      try {
        profile = await supabase.from('profiles').single('id', user.id);
      } catch (e) { /* 忽略 */ }

      // 保存 session
      app.setSession(jwt, user, profile);

      // 跳转
      wx.reLaunch({ url: '/pages/index/index' });
    } catch (e) {
      console.error('[Auth] 注册失败', e);
      analytics.trackEvent('signup_failed', { category: 'auth', label: (e && e.message) || '' });
      this.setData({
        errorMsg: e.message || '注册失败，请重试',
        loading: false,
      });
    }
  },

  /**
   * 登录
   */
  async onSignIn() {
    const { email, password } = this.data;
    this.setData({ loading: true, errorMsg: '' });
    analytics.trackEvent('signin_attempt', { category: 'auth' });

    try {
      const { jwt, user } = await supabase.signIn(email, password);
      analytics.trackEvent('signin_success', { category: 'auth', meta: { user_id: user.id } });

      let profile = null;
      try {
        profile = await supabase.from('profiles').single('id', user.id);
      } catch (e) { /* */ }

      app.setSession(jwt, user, profile);
      wx.reLaunch({ url: '/pages/index/index' });
    } catch (e) {
      console.error('[Auth] 登录失败', e);
      analytics.trackEvent('signin_failed', { category: 'auth', label: (e && e.message) || '' });
      this.setData({
        errorMsg: e.message || '登录失败，请检查邮箱和密码',
        loading: false,
      });
    }
  },

  onSwitchLogin() {
    analytics.trackEvent('switch_to_login', { category: 'auth' });
    this.setData({ step: 3, errorMsg: '' });
  },

  onSwitchSignUp() {
    analytics.trackEvent('switch_to_signup', { category: 'auth' });
    this.setData({ step: 2, errorMsg: '' });
  },

  goBack() {
    if (this.data.step > 1) {
      this.setData({ step: this.data.step - 1, errorMsg: '' });
    } else {
      wx.navigateBack();
    }
  },
});
