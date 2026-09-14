/* ==========================================================================
   consonants.js — ядро тренажёра «Парные согласные в корне слова»:
   сборка сессии, задания, подсказки. Данные лежат в consonants-data.js (PC.data).

   Задание (task):
     { id, task, before, after, answer, options, word, hint,
       ways:  ['мн', 'однокор', …]        — способы проверки без повторов,
       check: [{ word, stressAt, pos, way, wayCode }],
       fromMistakes }
   before / after — куски слова вокруг пропуска: 'ло[...]кий' → 'ло' и 'кий'.
   Пропуск в задании всегда ровно один.
   ========================================================================== */

window.PC = window.PC || {};

PC.core = (function () {
  var data = PC.data;
  var GAP = data.GAP;

  /* Способы проверки словами, понятными ребёнку: что именно сделать со словом.
     Ключи — коды way из датасета, полные названия — в data.WAY. */
  var WAY_ACTION = {
    'форма':   { emoji: '🔄', action: 'Измени форму слова: нет чего? чем? о чём?' },
    'мн':      { emoji: '🔢', action: 'Назови много: один — много' },
    'ласк':    { emoji: '🥰', action: 'Назови ласково' },
    'кратк':   { emoji: '✂️', action: 'Скажи кратко: какой? — каков?' },
    'сравн':   { emoji: '⚖️', action: 'Сравни два предмета: узкий — уже' },
    'детёныш': { emoji: '🐣', action: 'Назови детёныша' },
    'однокор': { emoji: '🌳', action: 'Подбери однокоренное слово — из той же семьи' }
  };

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /**
   * В датасете безударных гласных ударный гласный отмечен ЗАГЛАВНОЙ буквой
   * («вЁсны») — ядро общее, поэтому такую отметку понимаем и здесь.
   * В проверочных словах на парные согласные отметок нет: возвращаем -1.
   */
  function stressOf(word) {
    for (var i = 0; i < word.length; i++) {
      var ch = word.charAt(i);
      if (ch !== ch.toLowerCase()) {
        return { text: word.toLowerCase(), at: i };
      }
    }
    return { text: word, at: -1 };
  }

  function wayInfo(code) {
    var extra = WAY_ACTION[code] || { emoji: '🌳', action: data.WAY[code] || code };
    return { code: code, name: data.WAY[code] || code, emoji: extra.emoji, action: extra.action };
  }

  function wordOf(item) {
    var parts = String(item.task).split(GAP);
    return parts[0] + item.answer + parts[1];
  }

  /* --- Задание ---------------------------------------------------------- */

  function buildTask(item, fromMistakes) {
    var parts = String(item.task).split(GAP);

    var check = (item.check || []).map(function (row) {
      var stress = stressOf(row[0]);
      return {
        word: stress.text,
        stressAt: stress.at,
        pos: data.POS[row[1]] || row[1],
        wayCode: row[2],
        way: data.WAY[row[2]] || row[2]
      };
    });

    // Способы проверки без повторов — в том порядке, в каком идут слова
    var ways = [];
    check.forEach(function (c) {
      if (ways.indexOf(c.wayCode) === -1) ways.push(c.wayCode);
    });

    return {
      id: item.id,
      task: item.task,
      before: parts[0],
      after: parts[1],
      answer: item.answer,
      options: String(item.options).split(''),
      word: parts[0] + item.answer + parts[1],
      hint: data.HINTS[item.hint || 0] || data.HINTS[0],
      ways: ways,
      check: check,
      fromMistakes: !!fromMistakes
    };
  }

  /** Буквы на выбор — те же, что в датасете, но вперемешку */
  function optionsFor(task) {
    return shuffle(task.options);
  }

  function isCorrect(task, value) {
    return task.answer === value;
  }

  /** Слово с пропуском для списков и печати: 'в_сенний' */
  function maskedText(task, placeholder) {
    return task.before + (placeholder === undefined ? '_' : placeholder) + task.after;
  }

  function find(id) {
    var items = data.ITEMS;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function findByWord(word) {
    var items = data.ITEMS;
    for (var i = 0; i < items.length; i++) {
      if (wordOf(items[i]) === word) return items[i];
    }
    return null;
  }

  function count() {
    return data.ITEMS.length;
  }

  /* --- Сборка сессии ---------------------------------------------------- */

  /**
   * Ошибки, которые попадут в тренировку: записи из истории превращаем
   * в задания датасета. Ищем по id; если задание с таким id теперь про другое
   * слово (датасет правили), ищем по самому слову.
   *
   * Эту же функцию вызывает страница настроек — чтобы подпись «слов для
   * повторения» считалась тем же кодом, что и сессия.
   *
   * @param {Array} mistakes — [{ id, word, times }] из store.getRecentMistakes
   * @returns {Array} [{ item, times }]
   */
  function mistakesInScope(mistakes) {
    var out = [];
    var seen = {};

    (mistakes || []).forEach(function (m) {
      if (!m) return;
      var item = find(parseInt(m.id, 10));
      if (item && m.word && wordOf(item) !== m.word) item = null;
      if (!item && m.word) item = findByWord(m.word);
      if (!item || seen[item.id]) return;
      seen[item.id] = true;
      out.push({ item: item, times: parseInt(m.times, 10) || 0 });
    });

    return out;
  }

  /**
   * Задания на тренировку: сначала прошлые ошибки (если включено
   * «Повторять мои ошибки»), потом новые слова — случайные и без повторов.
   *
   * @param {object} settings — { taskCount, focusMistakes }
   * @param {Array}  mistakes — [{ id, word }] из store.getRecentMistakes
   */
  function buildSession(settings, mistakes) {
    var limit = settings.taskCount;
    var picked = [];
    var used = {};

    if (settings.focusMistakes && mistakes && mistakes.length) {
      var fromMistakes = mistakesInScope(mistakes);
      // Ошибок больше, чем заданий в тренировке — берём случайную часть
      if (fromMistakes.length > limit) fromMistakes = shuffle(fromMistakes).slice(0, limit);
      fromMistakes.forEach(function (entry) {
        used[entry.item.id] = true;
        picked.push({ item: entry.item, fromMistakes: true });
      });
    }

    var rest = shuffle(data.ITEMS).filter(function (item) { return !used[item.id]; });
    while (picked.length < limit && rest.length) {
      var item = rest.shift();
      used[item.id] = true;
      picked.push({ item: item, fromMistakes: false });
    }

    // Заданий запросили больше, чем есть в датасете — только тогда повторы
    while (picked.length < limit && data.ITEMS.length) {
      picked.push({ item: data.ITEMS[randInt(0, data.ITEMS.length - 1)], fromMistakes: false });
    }

    return shuffle(picked).map(function (entry) {
      return buildTask(entry.item, entry.fromMistakes);
    });
  }

  /**
   * Самопроверка датасета. Возвращает список проблем — пустой список значит,
   * что всё в порядке. Страница настроек вызывает её при загрузке.
   */
  function validate() {
    var problems = [];
    var seen = {};

    data.ITEMS.forEach(function (item) {
      var where = '№' + item.id + ' «' + item.task + '»';
      var parts = String(item.task).split(GAP);

      if (parts.length !== 2) {
        problems.push(where + ': пропусков ' + (parts.length - 1) + ', а нужен ровно один');
        return;
      }
      if (seen[item.id]) problems.push(where + ': id повторяется');
      seen[item.id] = true;

      if (String(item.answer).length !== 1) {
        problems.push(where + ': ответ должен быть одной буквой');
      }
      if (String(item.options).indexOf(item.answer) === -1) {
        problems.push(where + ': правильной буквы нет в options');
      }
      if (String(item.options).length < 2) {
        problems.push(where + ': меньше двух букв на выбор');
      }
      if (!data.HINTS[item.hint || 0]) {
        problems.push(where + ': нет подсказки номер ' + item.hint);
      }
      if (!item.check || !item.check.length) {
        problems.push(where + ': нет проверочных слов');
      }

      (item.check || []).forEach(function (row) {
        if (!row[0]) problems.push(where + ': пустое проверочное слово');
        if (!data.POS[row[1]]) problems.push(where + ': неизвестная часть речи «' + row[1] + '»');
        if (!data.WAY[row[2]]) problems.push(where + ': неизвестный способ проверки «' + row[2] + '»');
        else if (!WAY_ACTION[row[2]]) problems.push(where + ': способ «' + row[2] + '» не объяснён ребёнку');
      });
    });

    return problems;
  }

  return {
    TITLE: data.TITLE,
    GRADE: data.GRADE,
    SOURCE: data.SOURCE,
    RULE: data.RULE,
    shuffle: shuffle,
    count: count,
    find: find,
    wordOf: wordOf,
    wayInfo: wayInfo,
    buildTask: buildTask,
    buildSession: buildSession,
    mistakesInScope: mistakesInScope,
    optionsFor: optionsFor,
    maskedText: maskedText,
    isCorrect: isCorrect,
    validate: validate
  };
})();
