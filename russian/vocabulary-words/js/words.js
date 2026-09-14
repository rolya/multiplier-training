/* ==========================================================================
   words.js — ядро тренажёра «Словарные слова»: сборка сессии, задания,
   варианты букв на каждый пропуск. Данные лежат в words-data.js (VW.data).

   Задание (task):
     { word, masked, chunks, grade, fromMistakes,
       gaps: [{ answer, options }] }
   chunks — куски слова между пропусками: 'авт..б..с' → ['авт', 'б', 'с'].
   Пропусков всегда chunks.length - 1, и ребёнок заполняет их слева направо.
   ========================================================================== */

window.VW = window.VW || {};

VW.core = (function () {
  var data = VW.data;
  var GAP = data.GAP;

  var VOWELS = 'аеёиоуыэюя';
  var CONSONANTS = 'бвгджзйклмнпрстфхцчшщ';

  /* Похожие буквы — из них берём «обманки», когда вариантов просят больше,
     чем есть в датасете. Сначала похожая пара, потом любая буква того же рода. */
  var SIMILAR = {
    'а': 'оя', 'о': 'ау', 'е': 'ия', 'ё': 'ое', 'и': 'ея', 'й': 'и',
    'у': 'оюа', 'ы': 'иа', 'э': 'еи', 'ю': 'уё', 'я': 'еа',
    'б': 'пв', 'в': 'фб', 'г': 'кх', 'д': 'т', 'ж': 'шз', 'з': 'сж',
    'к': 'гх', 'л': 'р', 'м': 'н', 'н': 'м', 'п': 'бф', 'р': 'л',
    'с': 'зц', 'т': 'дс', 'ф': 'вп', 'х': 'кг', 'ц': 'сч', 'ч': 'щц',
    'ш': 'жщ', 'щ': 'шч'
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

  /** Разложить total на parts частей: остаток отдаём первым частям */
  function spread(total, parts) {
    var result = [];
    if (parts <= 0) return result;
    var base = Math.floor(total / parts);
    var extra = total % parts;
    for (var i = 0; i < parts; i++) result.push(base + (i < extra ? 1 : 0));
    return result;
  }

  function normalizeGrades(grades) {
    var list = Array.isArray(grades) ? grades : [];
    var picked = data.GRADES.filter(function (g) {
      return list.indexOf(g) !== -1 || list.indexOf(String(g)) !== -1;
    });
    return picked.length ? picked : data.GRADES.slice();
  }

  /** Все слова выбранных классов; к каждой записи добавляем класс */
  function pool(grades) {
    var list = [];
    normalizeGrades(grades).forEach(function (grade) {
      (data.BY_GRADE[grade] || []).forEach(function (entry) {
        list.push({ entry: entry, grade: grade });
      });
    });
    return list;
  }

  function find(word, grade) {
    var list = data.BY_GRADE[grade] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].word === word) return list[i];
    }
    return null;
  }

  function chunksOf(masked) {
    return masked.split(GAP);
  }

  /* --- Задание ---------------------------------------------------------- */

  function buildTask(item) {
    var entry = item.entry;
    return {
      word: entry.word,
      masked: entry.masked,
      chunks: chunksOf(entry.masked),
      grade: item.grade,
      fromMistakes: !!item.fromMistakes,
      gaps: entry.answers.map(function (answer, i) {
        return { answer: answer, options: (entry.options[i] || [answer]).slice() };
      })
    };
  }

  /**
   * Варианты букв для одного пропуска: всё из датасета плюс, если нужно,
   * «обманки» того же рода (гласная к гласной, согласная к согласной).
   * Пропуски с вариантом «нет буквы» не добираем — там выбор и так понятный.
   */
  function optionsFor(task, gapIndex, count) {
    var gap = task.gaps[gapIndex];
    var options = gap.options.slice();
    var wanted = Math.max(options.length, count || options.length);

    var hasEmpty = options.some(function (o) { return o === ''; });
    var allSingle = options.every(function (o) { return o.length === 1; });

    if (!hasEmpty && allSingle && options.length < wanted) {
      var isVowel = VOWELS.indexOf(gap.answer) !== -1;
      var bank = (SIMILAR[gap.answer] || '') + (isVowel ? VOWELS : CONSONANTS);
      for (var i = 0; i < bank.length && options.length < wanted; i++) {
        var letter = bank.charAt(i);
        if (options.indexOf(letter) === -1) options.push(letter);
      }
    }

    return shuffle(options);
  }

  /**
   * Слово с подставленными буквами. chosen[i] === undefined — пропуск ещё
   * не заполнен, на его место идёт placeholder.
   */
  function fill(task, chosen, placeholder) {
    var out = task.chunks[0];
    for (var i = 1; i < task.chunks.length; i++) {
      var value = chosen && chosen[i - 1] !== undefined && chosen[i - 1] !== null
        ? chosen[i - 1]
        : (placeholder === undefined ? '?' : placeholder);
      out += value + task.chunks[i];
    }
    return out;
  }

  /** Слово с пропусками для печати и списков: 'авт_б_с' */
  function maskedText(task, placeholder) {
    return fill(task, [], placeholder === undefined ? '_' : placeholder);
  }

  function isCorrect(task, gapIndex, value) {
    return task.gaps[gapIndex] && task.gaps[gapIndex].answer === value;
  }

  /* --- Сборка сессии ---------------------------------------------------- */

  /* Ключ только по слову, без класса: некоторые слова есть в программе и
     2, и 3 класса (морковь, помидор). Если включены оба класса, слово всё
     равно должно попасть в тренировку один раз. */
  function keyOf(item) {
    return item.entry.word.toLowerCase();
  }

  /**
   * Ошибки, которые реально попадут в тренировку при выбранных классах.
   *
   * Слово проходит только если оно есть в списке включённого класса — поэтому
   * в режиме одного класса слова другого класса не попадут, что бы ни лежало
   * в истории. Класс берём из включённых, а не из записи об ошибке: «морковь»
   * и «помидор» есть в программе и 2, и 3 класса, и ошибку, записанную в одном
   * классе, нужно повторить и в другом.
   *
   * Эту же функцию вызывает страница настроек, чтобы подпись «слов для
   * повторения» не обещала того, чего в тренировке не будет.
   *
   * @param {Array} grades   — включённые классы
   * @param {Array} mistakes — [{ word, grade, times }] из store.getRecentMistakes
   * @returns {Array} [{ entry, grade, times, fromMistakes }]
   */
  function mistakesInScope(grades, mistakes) {
    var list = normalizeGrades(grades);
    var out = [];
    var seen = {};

    (mistakes || []).forEach(function (m) {
      if (!m || typeof m.word !== 'string') return;
      var grade = null;
      var entry = null;
      for (var i = 0; i < list.length && !entry; i++) {
        entry = find(m.word, list[i]);
        if (entry) grade = list[i];
      }
      if (!entry) return;                       // слова нет в включённых классах
      var key = entry.word.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      out.push({
        entry: entry,
        grade: grade,
        times: parseInt(m.times, 10) || 0,
        fromMistakes: true
      });
    });

    return out;
  }

  /**
   * Слова на тренировку.
   * Сначала — прошлые ошибки (если включено «Повторять мои ошибки»),
   * потом новые слова: поровну между выбранными классами.
   *
   * @param {object} settings — { grades, wordCount, focusMistakes }
   * @param {Array}  mistakes — [{ word, grade }] из storage.getRecentMistakes
   */
  function buildSession(settings, mistakes) {
    var grades = normalizeGrades(settings.grades);
    var limit = settings.wordCount;
    var picked = [];
    var used = {};

    if (settings.focusMistakes && mistakes && mistakes.length) {
      var fromMistakes = mistakesInScope(grades, mistakes);
      fromMistakes.forEach(function (item) { used[keyOf(item)] = true; });
      // Ошибок больше, чем слов в тренировке — берём случайную часть
      if (fromMistakes.length > limit) fromMistakes = shuffle(fromMistakes).slice(0, limit);
      picked = fromMistakes;
    }

    var need = limit - picked.length;
    if (need > 0) {
      var counts = spread(need, grades.length);
      var byGrade = grades.map(function (grade) {
        return shuffle(pool([grade])).filter(function (item) { return !used[keyOf(item)]; });
      });

      grades.forEach(function (grade, i) {
        byGrade[i].splice(0, counts[i]).forEach(function (item) {
          used[keyOf(item)] = true;
          picked.push(item);
        });
      });

      // В каком-то классе слов не хватило — добираем из остальных
      var rest = shuffle(Array.prototype.concat.apply([], byGrade));
      while (picked.length < limit && rest.length) {
        var item = rest.shift();
        used[keyOf(item)] = true;
        picked.push(item);
      }

      // Слов запросили больше, чем есть в датасете — разрешаем повторы
      var all = pool(grades);
      while (picked.length < limit && all.length) {
        picked.push(all[randInt(0, all.length - 1)]);
      }
    }

    return shuffle(picked).map(buildTask);
  }

  /**
   * Самопроверка датасета: подставляем answers в masked и сравниваем с word.
   * Возвращает список проблем — пустой список значит, что всё в порядке.
   */
  function validate() {
    var problems = [];
    data.GRADES.forEach(function (grade) {
      (data.BY_GRADE[grade] || []).forEach(function (entry) {
        var chunks = chunksOf(entry.masked);
        var gaps = chunks.length - 1;
        var where = grade + ' класс, ' + entry.word;
        if (gaps !== entry.answers.length) {
          problems.push(where + ': пропусков ' + gaps + ', ответов ' + entry.answers.length);
        }
        if (gaps !== entry.options.length) {
          problems.push(where + ': пропусков ' + gaps + ', наборов вариантов ' + entry.options.length);
        }
        var built = chunks[0];
        for (var i = 1; i < chunks.length; i++) {
          built += (entry.answers[i - 1] || '?') + chunks[i];
        }
        if (built !== entry.word) {
          problems.push(where + ': из пропусков собирается «' + built + '»');
        }
        entry.options.forEach(function (opts, i) {
          if (opts.indexOf(entry.answers[i]) === -1) {
            problems.push(where + ': правильной буквы нет в вариантах пропуска ' + (i + 1));
          }
        });
      });
    });
    return problems;
  }

  function count(grades) {
    return pool(grades).length;
  }

  return {
    GRADES: data.GRADES,
    shuffle: shuffle,
    spread: spread,
    pool: pool,
    count: count,
    find: find,
    buildTask: buildTask,
    buildSession: buildSession,
    mistakesInScope: mistakesInScope,
    optionsFor: optionsFor,
    fill: fill,
    maskedText: maskedText,
    isCorrect: isCorrect,
    validate: validate
  };
})();
