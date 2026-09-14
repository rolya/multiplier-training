/* ==========================================================================
   storage.js — настройки и история сессий тренажёра «Парные согласные»
   Глобальный объект PC.store (свои ключи, не пересекается с другими тренажёрами)
   ========================================================================== */

window.PC = window.PC || {};

PC.store = (function () {
  var SETTINGS_KEY = 'pc.settings.v1';
  var HISTORY_KEY = 'pc.history.v1';

  var DEFAULTS = {
    taskCount: 10,        // слов в тренировке
    focusMistakes: true,  // подмешивать слова с прошлыми ошибками
    mistakeWindow: 5      // за сколько последних сессий смотреть ошибки
  };

  var LIMITS = {
    taskCount: { min: 1, max: 40 },
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
    return {
      taskCount: clampInt(raw.taskCount, LIMITS.taskCount.min,
        LIMITS.taskCount.max, DEFAULTS.taskCount),
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
  /* Запись: { date: ISO-строка, total, correct, helped,                    */
  /*           mistakes: [{ id, word }] }                                   */
  /* helped — в скольких словах открывали проверочные слова                 */
  /* Слово храним вместе с id: если датасет поправят и номера съедут,       */
  /* ошибку всё равно можно будет найти по самому слову.                    */

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
      mistakes: (record.mistakes || []).map(function (m) {
        return { id: m.id, word: m.word };
      })
    });
    write(HISTORY_KEY, list.slice(0, HISTORY_LIMIT));
  }

  /**
   * Уникальные задания с ошибками за последние `windowSize` сессий.
   *
   * @param {number} windowSize — сколько последних сессий просмотреть
   * @returns {Array} [{ id, word, times }], times — сколько раз ошибались
   */
  function getRecentMistakes(windowSize) {
    var sessions = getHistory().slice(0, windowSize || DEFAULTS.mistakeWindow);
    var map = {};
    sessions.forEach(function (session) {
      (session.mistakes || []).forEach(function (m) {
        var id = parseInt(m && m.id, 10);
        if (isNaN(id)) return;
        if (!map[id]) map[id] = { id: id, word: m.word || '', times: 0 };
        map[id].times += 1;
      });
    });
    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (x, y) {
        return y.times - x.times || x.word.localeCompare(y.word, 'ru');
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
