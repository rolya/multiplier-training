/* ==========================================================================
   storage.js — настройки и история сессий тренажёра «Сложение и вычитание»
   Глобальный объект PM.store (свои ключи, не пересекается с другими тренажёрами)
   ========================================================================== */

window.PM = window.PM || {};

PM.store = (function () {
  var SETTINGS_KEY = 'pm.settings.v1';
  var HISTORY_KEY = 'pm.history.v1';

  var ALL_LEVELS = [1, 2, 3];

  var DEFAULTS = {
    levels: [1, 2, 3],    // какие уровни в тренировке — можно один, два или три
    optionsCount: 4,      // сколько вариантов ответа показывать
    exampleCount: 10,     // примеров в сессии
    mistakeWindow: 5      // за сколько последних сессий смотреть ошибки
  };

  var LIMITS = {
    optionsCount: { min: 2, max: 10 },
    exampleCount: { min: 1, max: 100 },
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

  /** Уровни: только 1, 2, 3, без повторов, по возрастанию, хотя бы один */
  function normalizeLevels(raw) {
    if (!Array.isArray(raw)) return DEFAULTS.levels.slice();
    var picked = ALL_LEVELS.filter(function (level) {
      return raw.indexOf(level) !== -1 || raw.indexOf(String(level)) !== -1;
    });
    return picked.length ? picked : DEFAULTS.levels.slice();
  }

  function normalize(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    return {
      levels: normalizeLevels(raw.levels),
      optionsCount: clampInt(raw.optionsCount, LIMITS.optionsCount.min,
        LIMITS.optionsCount.max, DEFAULTS.optionsCount),
      exampleCount: clampInt(raw.exampleCount, LIMITS.exampleCount.min,
        LIMITS.exampleCount.max, DEFAULTS.exampleCount),
      mistakeWindow: clampInt(raw.mistakeWindow, LIMITS.mistakeWindow.min,
        LIMITS.mistakeWindow.max, DEFAULTS.mistakeWindow)
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
  /* Запись: { date: ISO-строка, total, correct, helped, levels,            */
  /*           mistakes: [{ a, b, op, level }] }                           */
  /* helped — в скольких примерах открывали подсказку «Помочь»             */

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
      levels: normalizeLevels(record.levels),
      mistakes: (record.mistakes || []).map(function (m) {
        return { a: m.a, b: m.b, op: m.op, level: m.level };
      })
    });
    write(HISTORY_KEY, list.slice(0, HISTORY_LIMIT));
  }

  /**
   * Уникальные ошибки за последние `windowSize` сессий.
   * В новые тренировки они не подмешиваются — список нужен, чтобы его
   * распечатать и разобрать вручную.
   *
   * @param {number} windowSize — сколько последних сессий просмотреть
   * @returns {Array} [{ a, b, op, level, answer, times }], times — сколько раз ошибались
   */
  function getRecentMistakes(windowSize) {
    var sessions = getHistory().slice(0, windowSize || DEFAULTS.mistakeWindow);
    var map = {};
    sessions.forEach(function (session) {
      (session.mistakes || []).forEach(function (m) {
        var a = parseInt(m.a, 10);
        var b = parseInt(m.b, 10);
        var op = m.op === '-' ? '-' : '+';
        if (isNaN(a) || isNaN(b)) return;
        var key = a + op + b;
        if (!map[key]) {
          map[key] = {
            a: a,
            b: b,
            op: op,
            level: parseInt(m.level, 10) || 1,
            answer: op === '+' ? a + b : a - b,
            times: 0
          };
        }
        map[key].times += 1;
      });
    });
    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (x, y) {
        return y.times - x.times || x.level - y.level || x.a - y.a || x.b - y.b;
      });
  }

  function clearHistory() {
    write(HISTORY_KEY, []);
  }

  return {
    ALL_LEVELS: ALL_LEVELS,
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
