/**
 * PlanetX 星际人格测试（8 题）
 */

const supabase = require('../../utils/supabase');
const analytics = require('../../utils/analytics');
const app = getApp();

const QUESTIONS = [
  {
    text: '在团队中，你更倾向于？',
    options: [
      { emoji: '🛸', text: '探索未知，寻找新方向', value: 'explore' },
      { emoji: '🏗️', text: '稳固防线，守护已有成果', value: 'build' },
      { emoji: '🤝', text: '协调关系，凝聚团队', value: 'connect' },
    ],
  },
  {
    text: '面对困难时，你的第一反应？',
    options: [
      { emoji: '⚔️', text: '直接挑战，迎难而上', value: 'explore' },
      { emoji: '📊', text: '冷静分析，制定计划', value: 'build' },
      { emoji: '🗣️', text: '寻求帮助，共同应对', value: 'connect' },
    ],
  },
  {
    text: '周末你会选择？',
    options: [
      { emoji: '🎨', text: '尝试新爱好学新技能', value: 'explore' },
      { emoji: '📚', text: '按计划完成待办事项', value: 'build' },
      { emoji: '🎉', text: '约朋友聚会社交', value: 'connect' },
    ],
  },
  {
    text: '你认为成功的定义？',
    options: [
      { emoji: '🌍', text: '突破边界创造独特价值', value: 'explore' },
      { emoji: '🏆', text: '稳定积累达成长期目标', value: 'build' },
      { emoji: '💞', text: '被需要被认可建立深度关系', value: 'connect' },
    ],
  },
  {
    text: '选择一份礼物？',
    options: [
      { emoji: '🌟', text: '一张星际旅行海报', value: 'explore' },
      { emoji: '⌚', text: '一块精工机械手表', value: 'build' },
      { emoji: '📖', text: '一本手写友谊日记', value: 'connect' },
    ],
  },
  {
    text: '工作方式偏好？',
    options: [
      { emoji: '🦅', text: '独立负责从零到一', value: 'explore' },
      { emoji: '🐝', text: '系统流程按部就班', value: 'build' },
      { emoji: '🐬', text: '密切协作头脑风暴', value: 'connect' },
    ],
  },
  {
    text: '信息处理方式？',
    options: [
      { emoji: '🔮', text: '跟着直觉走相信第六感', value: 'explore' },
      { emoji: '🔬', text: '数据驱动逻辑先行', value: 'build' },
      { emoji: '💬', text: '听别人怎么看再做决定', value: 'connect' },
    ],
  },
  {
    text: '未来十年最想成为？',
    options: [
      { emoji: '🚀', text: '行业颠覆者', value: 'explore' },
      { emoji: '🏛️', text: '专业权威', value: 'build' },
      { emoji: '🌈', text: '社区领袖', value: 'connect' },
    ],
  },
];

const PERSONALITIES = {
  explorer: { emoji: '🚀', name: '星际探索者', tagline: '勇敢迈向未知', desc: '你不满足于现状，总是渴望突破边界。对新事物充满好奇，敢于冒险，是天生的创新者和行业颠覆者。', categories: [{ label: '探索', score: 85 }, { label: '构建', score: 40 }, { label: '连接', score: 55 }] },
  builder: { emoji: '🏗️', name: '星际建筑师', tagline: '脚踏实地，构建永恒', desc: '你擅长系统思维，注重积累。每一步都经过深思熟虑，是团队中最稳定可靠的基石。', categories: [{ label: '探索', score: 35 }, { label: '构建', score: 88 }, { label: '连接', score: 45 }] },
  connector: { emoji: '🌌', name: '星际漫游者', tagline: '连接万物的桥梁', desc: '你拥有敏锐的共情力，善于在不同的人之间架起桥梁。对人性的深刻理解让你成为不可或缺的社交核心。', categories: [{ label: '探索', score: 45 }, { label: '构建', score: 40 }, { label: '连接', score: 85 }] },
  hybrid: { emoji: '🪐', name: '星际先驱', tagline: '多面手，跨界融合', desc: '你兼具探索者的好奇心、建筑师的执行力和漫游者的共情力，是罕见的全能型人才。', categories: [{ label: '探索', score: 70 }, { label: '构建', score: 65 }, { label: '连接', score: 70 }] },
};

Page({
  data: {
    currentQ: 0,
    totalQs: 8,
    questions: QUESTIONS,
    answers: [],
    done: false,
    result: null,
    startedAt: 0,
  },

  onLoad() {
    this.setData({ startedAt: Date.now() });
  },

  onShow() {
    analytics.trackPageview();
  },

  onError(err) {
    analytics.trackError(
      (err && err.message) || 'Test Error',
      '',
      0,
      0,
      'PageError',
      (err && err.stack) || ''
    );
  },

  onSelect(e) {
    const value = e.currentTarget.dataset.value;
    const answers = [...this.data.answers, value];

    analytics.trackEvent('test_answer', {
      category: 'test',
      value: this.data.currentQ + 1,
      label: value,
    });

    if (this.data.currentQ + 1 >= this.data.totalQs) {
      // 最后一道题，计算结果
      this._calcResult(answers);
    } else {
      this.setData({
        currentQ: this.data.currentQ + 1,
        answers,
      });
    }
  },

  _calcResult(answers) {
    const counts = { explore: 0, build: 0, connect: 0 };
    answers.forEach(v => { if (counts[v] !== undefined) counts[v]++; });

    const max = Math.max(counts.explore, counts.build, counts.connect);
    const tops = Object.entries(counts).filter(([, c]) => c === max);

    let type;
    if (tops.length === 3) type = 'hybrid';
    else if (tops.length === 2) type = 'hybrid';
    else type = tops[0][0] === 'explore' ? 'explorer' : tops[0][0] === 'build' ? 'builder' : 'connector';

    const result = PERSONALITIES[type];
    const total = answers.length;
    result.categories = [
      { label: '探索', score: Math.round(counts.explore / total * 100) },
      { label: '构建', score: Math.round(counts.build / total * 100) },
      { label: '连接', score: Math.round(counts.connect / total * 100) },
    ];

    const duration = Math.round((Date.now() - this.data.startedAt) / 1000);
    analytics.trackEvent('test_complete', {
      category: 'test',
      label: type,
      value: duration,
    });
    analytics.trackTiming('test_duration', duration);

    this.setData({ done: true, result });
  },

  async onFinish() {
    const { result } = this.data;
    if (!app.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    analytics.trackEvent('test_save_attempt', { category: 'test', label: result.name });

    try {
      const uid = app.globalData.supabaseUser.id;
      await supabase.from('profiles').update(
        { personality_type: result },
        { id: uid }
      );
      analytics.trackEvent('test_save_success', { category: 'test' });

      // 标记任务完成
      try {
        await supabase.from('mission_completions').upsert({
          user_id: uid,
          mission_id: 'personality',
        });
      } catch (e) { /* */ }

      // 更新 app 状态
      const profile = { ...app.globalData.profile, personality_type: result };
      profile.level = Math.max(profile.level || 1, 2);
      app.setProfile(profile);

      wx.hideLoading();
      wx.showToast({ title: '星际身份已确认！', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/hub/hub' });
      }, 1000);
    } catch (e) {
      wx.hideLoading();
      console.error('[Test] 保存失败', e);
      analytics.trackError('test_save_failed', '', 0, 0, 'SaveError', (e && e.message) || '');
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },
});
