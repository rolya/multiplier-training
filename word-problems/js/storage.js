/* ==========================================================================
   storage.js — настройки и история сессий тренажёра «Задачи»
   Глобальный объект WP.store (свои ключи, не пересекается с другими тренажёрами)
   ========================================================================== */

window.WP = window.WP || {};

WP.store = (function () {
  var SETTINGS_KEY = 'wp.settings.v1';
  var HISTORY_KEY = 'wp.history.v1';

  var DEFAULTS = {
    maxNumber: 20,        // уровень: самое большое число в задаче (делимое или произведение)
    exampleCount: 10,     // задач в сессии
    mistakeWindow: 5      // за сколько последних сессий показывать ошибки
  };

  var LIMITS = {
    maxNumber: { min: 10, max: 100 },
    exampleCount: { min: 1, max: 50 },
    mistakeWindow: { min: 1, max: 20 }
  };

  var HISTORY_LIMIT = 50;  // сколько сессий храним всего

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var value = JSON.parse(raw);
      return value === null || value === undefined ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clampInt(value, min, max, fallback) {
    var n = parseInt(value, 10);
    if (isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function normalize(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var out = {};
    Object.keys(LIMITS).forEach(function (field) {
      out[field] = clampInt(raw[field], LIMITS[field].min, LIMITS[field].max, DEFAULTS[field]);
    });
    return out;
  }

  function getSettings() {
    return normalize(read(SETTINGS_KEY, null));
  }

  function saveSettings(settings) {
    var clean = normalize(settings);
    write(SETTINGS_KEY, clean);
    return clean;
  }

  /* --- История сессий -------------------------------------------------- */
  /* Запись: { date: ISO-строка, total, correct, helped, maxNumber,         */
  /*           mistakes: [{ id, x, y }] }                                  */
  /* id — шаблон задачи, x и y — её множители (по ним задача собирается    */
  /* заново с теми же числами)                                             */

  function getHistory() {
    var list = read(HISTORY_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function saveSession(record) {
    var list = getHistory();
    list.unshift({
      date: new Date().toISOString(),
      total: record.total,
      correct: record.correct,
      helped: clampInt(record.helped, 0, record.total || 0, 0),
      maxNumber: record.maxNumber,
      mistakes: (record.mistakes || []).map(function (m) {
        return { id: m.id, x: m.x, y: m.y };
      })
    });
    write(HISTORY_KEY, list.slice(0, HISTORY_LIMIT));
  }

  /**
   * Уникальные ошибки за последние `windowSize` сессий.
   * @returns {Array} [{ id, x, y, times }], times — сколько раз ошибались
   */
  function getRecentMistakes(windowSize) {
    var sessions = getHistory().slice(0, windowSize || DEFAULTS.mistakeWindow);
    var map = {};
    var order = [];
    sessions.forEach(function (session) {
      (session.mistakes || []).forEach(function (m) {
        if (!m || typeof m.id !== 'string') return;
        var key = m.id + ':' + m.x + ':' + m.y;
        if (!map[key]) {
          map[key] = { id: m.id, x: m.x, y: m.y, times: 0 };
          order.push(key);
        }
        map[key].times += 1;
      });
    });
    return order
      .map(function (key) { return map[key]; })
      .sort(function (a, b) { return b.times - a.times; });
  }

  function clearHistory() {
    write(HISTORY_KEY, []);
  }

  return {
    DEFAULTS: DEFAULTS,
    LIMITS: LIMITS,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getHistory: getHistory,
    saveSession: saveSession,
    getRecentMistakes: getRecentMistakes,
    clearHistory: clearHistory
  };
})();
