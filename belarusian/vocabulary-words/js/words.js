/* ==========================================================================
   words.js — ядро тренажёра «Слоўнікавыя словы»: сборка сессии, задания,
   варианты букв на каждый пропуск. Данные лежат в words-data.js (VW.data).

   Тот же движок, что и у русских словарных слов (russian/vocabulary-words):
   отличаются только датасет, буквы для «обманок» (беларускі алфавіт) и ключи
   хранилища в storage.js. Правишь логику — правь в обоих местах.

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

  var ALL_QUARTERS = 'all';   // значение настройки «все четверти»

  /* Беларускі алфавіт: без «и», «щ» и «ъ», зато с «ў» и «і» — иначе в
     «обманки» попали бы буквы, которых в беларускай мове нет. */
  var VOWELS = 'аеёіоуыэюя';
  var CONSONANTS = 'бвгджзйклмнпрстўфхцчш';

  /* Похожие буквы — из них берём «обманки», когда вариантов просят больше,
     чем есть в датасете. Сначала похожая пара, потом любая буква того же рода. */
  var SIMILAR = {
    'а': 'оя', 'о': 'ау', 'е': 'ія', 'ё': 'ое', 'і': 'ея', 'й': 'і',
    'у': 'ўоа', 'ы': 'іа', 'э': 'еы', 'ю': 'уё', 'я': 'еа', 'ў': 'ув',
    'б': 'пв', 'в': 'фбў', 'г': 'кх', 'д': 'т', 'ж': 'шз', 'з': 'сж',
    'к': 'гх', 'л': 'р', 'м': 'н', 'н': 'м', 'п': 'бф', 'р': 'л',
    'с': 'зц', 'т': 'дс', 'ф': 'вп', 'х': 'кг', 'ц': 'сч', 'ч': 'цш',
    'ш': 'жч'
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

  /**
   * Четверть в настройках: ALL_QUARTERS («все четверти») или id четверти.
   * Всё непонятное считаем «все четверти» — тренировка не должна опустеть
   * из-за мусора в localStorage.
   */
  function normalizeQuarter(quarter) {
    if (quarter === ALL_QUARTERS || quarter === undefined || quarter === null) {
      return ALL_QUARTERS;
    }
    var id = parseInt(quarter, 10);
    return data.QUARTERS.indexOf(id) !== -1 ? id : ALL_QUARTERS;
  }

  function inQuarter(entry, quarter) {
    return quarter === ALL_QUARTERS || entry.quarter === quarter;
  }

  /** Слова выбранных классов и четверти; к каждой записи добавляем класс */
  function pool(grades, quarter) {
    var list = [];
    var wanted = normalizeQuarter(quarter);
    normalizeGrades(grades).forEach(function (grade) {
      (data.BY_GRADE[grade] || []).forEach(function (entry) {
        if (inQuarter(entry, wanted)) list.push({ entry: entry, grade: grade });
      });
    });
    return list;
  }

  /** Слова одного класса, сгруппированные по четвертям — для страницы повторения */
  function byQuarter(grade) {
    var list = data.BY_GRADE[grade] || [];
    return data.quartersOfGrade(grade).map(function (id) {
      return {
        quarter: id,
        label: data.quarterLabel(id),
        words: list.filter(function (entry) { return entry.quarter === id; })
      };
    });
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

  /**
   * Слово, разложенное на куски для показа с выделением: обычные части и
   * буквы из пропусков — те самые, которые нужно запомнить. Нужно странице
   * повторения: там эти буквы печатаются жирным.
   *
   *   'авт..б..с' + ['о','у'] →
   *     [авт][о*][б][у*][с]   (звёздочкой помечено accent: true)
   *
   * Пустые куски пропускаем: у слова «класс» пропуск в конце ('клас..'),
   * и хвост после него — пустая строка.
   */
  function accentParts(task) {
    var parts = [];
    function push(text, accent) {
      if (text) parts.push({ text: text, accent: accent });
    }
    push(task.chunks[0], false);
    for (var i = 1; i < task.chunks.length; i++) {
      push(task.gaps[i - 1] ? task.gaps[i - 1].answer : '', true);
      push(task.chunks[i], false);
    }
    return parts;
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
   * Так же отсекаются слова не из выбранной четверти.
   *
   * @param {Array} grades   — включённые классы
   * @param {Array} mistakes — [{ word, grade, times }] из store.getRecentMistakes
   * @param {*}     quarter  — четверть из настроек ('all' или id)
   * @returns {Array} [{ entry, grade, times, fromMistakes }]
   */
  function mistakesInScope(grades, mistakes, quarter) {
    var list = normalizeGrades(grades);
    var wanted = normalizeQuarter(quarter);
    var out = [];
    var seen = {};

    (mistakes || []).forEach(function (m) {
      if (!m || typeof m.word !== 'string') return;
      var grade = null;
      var entry = null;
      for (var i = 0; i < list.length && !entry; i++) {
        var candidate = find(m.word, list[i]);
        // Слово может быть и во 2, и в 3 классе, но в разных четвертях —
        // берём тот класс, где оно попадает в выбранную четверть
        if (candidate && inQuarter(candidate, wanted)) {
          entry = candidate;
          grade = list[i];
        }
      }
      if (!entry) return;                       // нет в выбранных классах и четверти
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
   * @param {object} settings — { grades, quarter, wordCount, focusMistakes }
   * @param {Array}  mistakes — [{ word, grade }] из storage.getRecentMistakes
   */
  function buildSession(settings, mistakes) {
    var grades = normalizeGrades(settings.grades);
    var quarter = normalizeQuarter(settings.quarter);
    var limit = settings.wordCount;
    var picked = [];
    var used = {};

    if (settings.focusMistakes && mistakes && mistakes.length) {
      var fromMistakes = mistakesInScope(grades, mistakes, quarter);
      fromMistakes.forEach(function (item) { used[keyOf(item)] = true; });
      // Ошибок больше, чем слов в тренировке — берём случайную часть
      if (fromMistakes.length > limit) fromMistakes = shuffle(fromMistakes).slice(0, limit);
      picked = fromMistakes;
    }

    var need = limit - picked.length;
    if (need > 0) {
      var counts = spread(need, grades.length);
      var byGrade = grades.map(function (grade) {
        return shuffle(pool([grade], quarter)).filter(function (item) { return !used[keyOf(item)]; });
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
      var all = pool(grades, quarter);
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
    var problems = (data.QUARTER_PROBLEMS || []).slice();
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

  /** «1 слово / 2 слова / 5 слов» — нужно и настройкам, и странице повторения */
  function wordForm(n) {
    var last = n % 10;
    var two = n % 100;
    if (two >= 11 && two <= 14) return 'слов';
    if (last === 1) return 'слово';
    if (last >= 2 && last <= 4) return 'слова';
    return 'слов';
  }

  function count(grades, quarter) {
    return pool(grades, quarter).length;
  }

  return {
    GRADES: data.GRADES,
    QUARTERS: data.QUARTERS,
    ALL_QUARTERS: ALL_QUARTERS,
    OTHER_QUARTER: data.OTHER_QUARTER,
    quarterLabel: data.quarterLabel,
    normalizeQuarter: normalizeQuarter,
    byQuarter: byQuarter,
    shuffle: shuffle,
    spread: spread,
    wordForm: wordForm,
    pool: pool,
    count: count,
    find: find,
    buildTask: buildTask,
    buildSession: buildSession,
    mistakesInScope: mistakesInScope,
    optionsFor: optionsFor,
    fill: fill,
    accentParts: accentParts,
    maskedText: maskedText,
    isCorrect: isCorrect,
    validate: validate
  };
})();
