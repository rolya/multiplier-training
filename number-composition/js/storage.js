/* ==========================================================================
   storage.js — настройки и история сессий тренажёра «Состав числа»
   Глобальный объект NC.store (собственные ключи, не пересекается с умножением)
   ========================================================================== */

window.NC = window.NC || {};

NC.store = (function () {
  var SETTINGS_KEY = 'nc.settings.v1';
  var HISTORY_KEY = 'nc.history.v1';

  var DEFAULTS = {
    level: 1,             // 1 — «3 + ? = 9»; 2 — плюс «6 + 3 = ?»; 3 — два пропуска
    rangeMin: 2,          // с какого числа тренируем состав
    rangeMax: 10,         // до какого числа тренируем состав
    optionsCount: 4,      // сколько вариантов ответа показывать (минимум 2)
    exampleCount: 20,     // примеров в сессии
    focusMistakes: true,  // обязательно добавлять прошлые ошибки
    mistakeWindow: 5      // за сколько последних сессий брать ошибки
  };

  var LIMITS = {
    rangeMin: { min: 2, max: 100 },
    rangeMax: { min: 2, max: 100 },
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

  function normalize(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var level = parseInt(raw.level, 10);

    // Раньше диапазон был одним числом (только «до») — переносим его в rangeMax
    var rawMax = raw.rangeMax === undefined ? raw.range : raw.rangeMax;
    var rangeMin = clampInt(raw.rangeMin, LIMITS.rangeMin.min, LIMITS.rangeMin.max,
      DEFAULTS.rangeMin);
    var rangeMax = clampInt(rawMax, LIMITS.rangeMax.min, LIMITS.rangeMax.max,
      DEFAULTS.rangeMax);
    if (rangeMin > rangeMax) {
      var swap = rangeMin;
      rangeMin = rangeMax;
      rangeMax = swap;
    }

    return {
      level: (level === 2 || level === 3) ? level : 1,
      rangeMin: rangeMin,
      rangeMax: rangeMax,
      optionsCount: clampInt(raw.optionsCount, LIMITS.optionsCount.min,
        LIMITS.optionsCount.max, DEFAULTS.optionsCount),
      exampleCount: clampInt(raw.exampleCount, LIMITS.exampleCount.min,
        LIMITS.exampleCount.max, DEFAULTS.exampleCount),
      focusMistakes: raw.focusMistakes === undefined
        ? DEFAULTS.focusMistakes
        : !!raw.focusMistakes,
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
  /* Запись: { date: ISO-строка, total, correct, level,                     */
  /*           rangeMin, rangeMax, mistakes: [{ a, b }] }                  */
  /* a + b это состав числа                                                */

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
      level: record.level,
      rangeMin: record.rangeMin,
      rangeMax: record.rangeMax,
      mistakes: (record.mistakes || []).map(function (m) {
        return { a: m.a, b: m.b };
      })
    });
    write(HISTORY_KEY, list.slice(0, HISTORY_LIMIT));
  }

  /**
   * Уникальные ошибки за последние `windowSize` сессий.
   * Берём только те, где сумма попадает в текущий диапазон тренировки.
   *
   * @param {number} windowSize — сколько последних сессий просмотреть
   * @param {number} [minSum]   — отбросить состав числа меньше этого значения
   * @param {number} [maxSum]   — отбросить состав числа больше этого значения
   * @returns {Array} [{ a, b, sum, times }], times — сколько раз ошибались
   */
  function getRecentMistakes(windowSize, minSum, maxSum) {
    var sessions = getHistory().slice(0, windowSize || DEFAULTS.mistakeWindow);
    var from = typeof minSum === 'number' ? minSum : 0;
    var to = typeof maxSum === 'number' ? maxSum : LIMITS.rangeMax.max;
    var map = {};
    sessions.forEach(function (session) {
      (session.mistakes || []).forEach(function (m) {
        var a = parseInt(m.a, 10);
        var b = parseInt(m.b, 10);
        if (isNaN(a) || isNaN(b) || a < 1 || b < 1) return;
        if (a + b < from || a + b > to) return;
        // 3 + 7 и 7 + 3 — один и тот же состав числа
        var lo = Math.min(a, b);
        var hi = Math.max(a, b);
        var key = lo + '+' + hi;
        if (!map[key]) map[key] = { a: lo, b: hi, sum: lo + hi, times: 0 };
        map[key].times += 1;
      });
    });
    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (x, y) {
        return y.times - x.times || x.sum - y.sum || x.a - y.a;
      });
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
