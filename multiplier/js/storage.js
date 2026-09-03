/* ==========================================================================
   storage.js — настройки и история сессий в localStorage
   Глобальный объект MT.store
   ========================================================================== */

window.MT = window.MT || {};

MT.store = (function () {
  var SETTINGS_KEY = 'mt.settings.v1';
  var HISTORY_KEY = 'mt.history.v1';

  var DEFAULTS = {
    level: 1,             // 1 — «7 × 3 = ?», 2 — «? × 3 = 21»
    optionsCount: 4,      // 0..10; 0 — поле для ввода
    exampleCount: 30,     // примеров в сессии
    focusMistakes: true,  // обязательно добавлять прошлые ошибки
    mistakeWindow: 5,     // за сколько последних сессий брать ошибки
    includeOne: true      // включать умножение на 1
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
    return {
      level: raw.level === 2 ? 2 : 1,
      optionsCount: clampInt(raw.optionsCount, 0, 10, DEFAULTS.optionsCount),
      exampleCount: clampInt(raw.exampleCount, 1, 100, DEFAULTS.exampleCount),
      focusMistakes: raw.focusMistakes === undefined
        ? DEFAULTS.focusMistakes
        : !!raw.focusMistakes,
      mistakeWindow: clampInt(raw.mistakeWindow, 1, 20, DEFAULTS.mistakeWindow),
      includeOne: raw.includeOne === undefined ? DEFAULTS.includeOne : !!raw.includeOne
    };
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
  /* Запись: { date: ISO-строка, total, correct, mistakes: [{a, b}] }      */

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
      mistakes: (record.mistakes || []).map(function (m) {
        return { a: m.a, b: m.b };
      })
    });
    write(HISTORY_KEY, list.slice(0, HISTORY_LIMIT));
  }

  /**
   * Уникальные ошибки за последние `windowSize` сессий.
   * Возвращает [{ a, b, times }], times — сколько раз ошибались.
   */
  function getRecentMistakes(windowSize) {
    var sessions = getHistory().slice(0, windowSize || DEFAULTS.mistakeWindow);
    var map = {};
    sessions.forEach(function (session) {
      (session.mistakes || []).forEach(function (m) {
        var a = parseInt(m.a, 10);
        var b = parseInt(m.b, 10);
        if (isNaN(a) || isNaN(b)) return;
        var key = a + 'x' + b;
        if (!map[key]) map[key] = { a: a, b: b, times: 0 };
        map[key].times += 1;
      });
    });
    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (x, y) {
        return y.times - x.times || x.a - y.a || x.b - y.b;
      });
  }

  function clearHistory() {
    write(HISTORY_KEY, []);
  }

  return {
    DEFAULTS: DEFAULTS,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getHistory: getHistory,
    saveSession: saveSession,
    getRecentMistakes: getRecentMistakes,
    clearHistory: clearHistory
  };
})();
