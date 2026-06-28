/**
 * PlanetX 统一配置
 * 
 * 所有环境相关的 URL/Key 集中管理，方便切换环境。
 */

// ── API 后端（Looma）──────────────────────────────────────────────
const API_BASE = 'https://api.genz.ltd';

// ── Supabase ───────────────────────────────────────────────────────
const SUPABASE_URL = 'https://ihuddnluwggbdppheixu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodWRkbmx1d2dnYmRwcGhlaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDcwNDEsImV4cCI6MjA5ODAyMzA0MX0._nd6pJvhMjWoqt4CtBW344UC59sILk31PaMU-NYc8fk';

module.exports = {
  API_BASE,
  SUPABASE_URL,
  SUPABASE_KEY,
};
