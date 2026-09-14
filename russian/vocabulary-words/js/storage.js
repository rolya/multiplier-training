/* ==========================================================================
   storage.js — настройки и история сессий тренажёра «Словарные слова»
   Глобальный объект VW.store (свои ключи, не пересекается с другими тренажёрами)
   ========================================================================== */

window.VW = window.VW || {};

VW.store = (function () {
  var SETTINGS_KEY = 'vw.settings.v1';
  var HISTORY_KEY = 'vw.history.v1';

  var ALL_GRADES = [2, 3];

  var DEFAULTS = {
    grades: [3],          // какие классы берём — можно один или оба
    optionsCount: 3,      // сколько букв показывать на один пропуск
    wordCount: 10,        // слов в тренировке
    focusMistakes: true,  // подмешивать слова с прошлыми ошибками
    mistakeWindow: 5      // за сколько последних сессий смотреть ошибки
  };

  var LIMITS = {
    optionsCount: { min: 2, max: 4 },
    wordCount: { min: 1, max: 40 },
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

  /** Классы: только 2 и 3, без повторов, по возрастанию, хотя бы один */
  function normalizeGrades(raw) {
    if (!Array.isArray(raw)) return DEFAULTS.grades.slice();
    var picked = ALL_GRADES.filter(function (grade) {
      return raw.indexOf(grade) !== -1 || raw.indexOf(String(grade)) !== -1;
    });
    return picked.length ? picked : DEFAULTS.grades.slice();
  }

  function normalize(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    return {
      grades: normalizeGrades(raw.grades),
      optionsCount: clampInt(raw.optionsCount, LIMITS.optionsCount.min,
        LIMITS.optionsCount.max, DEFAULTS.optionsCount),
      wordCount: clampInt(raw.wordCount, LIMITS.wordCount.min,
        LIMITS.wordCount.max, DEFAULTS.wordCount),
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
  /* Запись: { date: ISO-строка, total, correct, helped, grades,            */
  /*           mistakes: [{ word, grade }] }                               */
  /* helped — в скольких словах открывали подсказку «Помочь»                */

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
      grades: normalizeGrades(record.grades),
      mistakes: (record.mistakes || []).map(function (m) {
        return { word: m.word, grade: m.grade };
      })
    });
    write(HISTORY_KEY, list.slice(0, HISTORY_LIMIT));
  }

  /**
   * Уникальные слова с ошибками за последние `windowSize` сессий.
   *
   * @param {number} windowSize — сколько последних сессий просмотреть
   * @returns {Array} [{ word, grade, times }], times — сколько раз ошибались
   */
  function getRecentMistakes(windowSize) {
    var sessions = getHistory().slice(0, windowSize || DEFAULTS.mistakeWindow);
    var map = {};
    sessions.forEach(function (session) {
      (session.mistakes || []).forEach(function (m) {
        var word = typeof m.word === 'string' ? m.word : '';
        var grade = parseInt(m.grade, 10);
        if (!word || ALL_GRADES.indexOf(grade) === -1) return;
        var key = grade + ':' + word;
        if (!map[key]) map[key] = { word: word, grade: grade, times: 0 };
        map[key].times += 1;
      });
    });
    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (x, y) {
        return y.times - x.times || x.grade - y.grade || x.word.localeCompare(y.word, 'ru');
      });
  }

  function clearHistory() {
    write(HISTORY_KEY, []);
  }

  return {
    ALL_GRADES: ALL_GRADES,
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
