/* ==========================================================================
   composition.js — состав числа: набор примеров, маскировка, варианты ответов
   Глобальный объект NC.core
   ========================================================================== */

window.NC = window.NC || {};

NC.core = (function () {
  var MIN_SUM = 2;   // меньше 2 состав из двух слагаемых (>= 1) не собрать

  /* Какие пропуски бывают на каждом уровне.
     'a'     → ? + 5 = 7          (один правильный вариант)
     'b'     → 3 + ? = 9
     'sum'   → 6 + 3 = ?
     'ab'    → ? + ? = 9          (два правильных варианта)
     'aSum'  → ? + 5 = ?
     'bSum'  → 2 + ? = ?                                                   */
  var PATTERNS = {
    1: ['a', 'b'],
    2: ['a', 'b', 'sum'],
    3: ['ab', 'aSum', 'bSum']
  };

  /* Порядок пропусков в каждом шаблоне — в этом же порядке идут ответы */
  var BLANKS = {
    a: ['a'],
    b: ['b'],
    sum: ['sum'],
    ab: ['a', 'b'],
    aSum: ['a', 'sum'],
    bSum: ['b', 'sum']
  };

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /** Перемешивание (Фишер–Йетс), не меняет исходный массив */
  function shuffle(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = out[i];
      out[i] = out[j];
      out[j] = t;
    }
    return out;
  }

  /** Все числа, состав которых тренируем: от min до max (но не меньше 2) */
  function sumsInRange(min, max) {
    var from = Math.max(MIN_SUM, min);
    var list = [];
    for (var s = from; s <= max; s++) list.push(s);
    return list;
  }

  /** Числа 1…max — из них берём варианты ответа */
  function valuesUpTo(max) {
    var list = [];
    for (var v = 1; v <= max; v++) list.push(v);
    return list;
  }

  /**
   * Случайный состав числа: { a, b, sum }, оба слагаемых >= 1.
   * @param {number} sum
   * @param {boolean} [distinct] — не давать одинаковых слагаемых (для «? + ? = 9»)
   */
  function splitSum(sum, distinct) {
    var a = randInt(1, sum - 1);
    if (distinct && a * 2 === sum && sum > 2) {
      // сдвигаем на единицу в любую сторону, лишь бы остаться в 1…sum-1
      a += (a > 1 && Math.random() < 0.5) ? -1 : 1;
      if (a < 1 || a > sum - 1) a = sum - a;
    }
    return { a: a, b: sum - a, sum: sum };
  }

  function makeExample(sum) {
    var split = splitSum(sum);
    return { a: split.a, b: split.b, sum: sum, fromMistakes: false };
  }

  /**
   * Набор примеров для сессии.
   * 1) ошибки последних сессий, подходящие под диапазон;
   * 2) остаток добираем случайными числами диапазона, для каждого — случайный состав;
   * 3) всё перемешиваем.
   *
   * @param {object} settings — настройки из NC.store
   * @param {Array}  mistakes — [{ a, b }] прошлые ошибки (может быть пустым)
   * @returns {Array} [{ a, b, sum, fromMistakes }]
   */
  function buildSessionExamples(settings, mistakes) {
    var from = Math.max(MIN_SUM, settings.rangeMin);
    var to = Math.max(from, settings.rangeMax);
    var limit = settings.exampleCount;
    var picked = [];
    var usedSums = {};

    if (settings.focusMistakes && mistakes && mistakes.length) {
      var mistakeItems = [];
      var seen = {};
      mistakes.forEach(function (m) {
        var a = parseInt(m.a, 10);
        var b = parseInt(m.b, 10);
        if (isNaN(a) || isNaN(b) || a < 1 || b < 1) return;
        if (a + b < from || a + b > to) return;         // не наш диапазон
        var key = Math.min(a, b) + '/' + Math.max(a, b);
        if (seen[key]) return;
        seen[key] = true;
        mistakeItems.push({ a: a, b: b, sum: a + b, fromMistakes: true });
      });
      // Ошибок больше, чем примеров в тренировке — берём случайную часть
      if (mistakeItems.length > limit) mistakeItems = shuffle(mistakeItems).slice(0, limit);
      picked = mistakeItems;
      picked.forEach(function (item) { usedSums[item.sum] = true; });
    }

    // Сколько нужно новых примеров
    var need = limit - picked.length;
    var fresh = shuffle(sumsInRange(from, to)).filter(function (sum) {
      return !usedSums[sum];
    });

    for (var i = 0; i < fresh.length && need > 0; i++, need--) {
      picked.push(makeExample(fresh[i]));
    }

    // Примеров запросили больше, чем чисел в диапазоне — разрешаем повторы
    var all = sumsInRange(from, to);
    while (need > 0 && all.length) {
      picked.push(makeExample(all[randInt(0, all.length - 1)]));
      need--;
    }

    return shuffle(picked);
  }

  /**
   * Задание для примера: выбираем шаблон пропусков по уровню.
   *
   * @returns {object} { a, b, sum, level, hidden, blanks, answers, fromMistakes }
   *   hidden  — имя шаблона ('a' | 'b' | 'sum' | 'ab' | 'aSum' | 'bSum')
   *   blanks  — какие места скрыты, по порядку слева направо
   *   answers — правильные значения в том же порядке
   */
  function buildTask(example, level) {
    var list = PATTERNS[level] || PATTERNS[1];
    var hidden = list[randInt(0, list.length - 1)];
    var a = example.a;
    var b = example.b;

    // «? + ? = 9»: два одинаковых слагаемых кнопками не набрать (кнопка одна)
    if (hidden === 'ab' && a === b) {
      if (example.sum > 2) {
        var split = splitSum(example.sum, true);
        a = split.a;
        b = split.b;
      } else {
        hidden = Math.random() < 0.5 ? 'aSum' : 'bSum';
      }
    }

    var blanks = BLANKS[hidden];
    var values = { a: a, b: b, sum: example.sum };

    return {
      a: a,
      b: b,
      sum: example.sum,
      fromMistakes: !!example.fromMistakes,
      level: level,
      hidden: hidden,
      blanks: blanks,
      answers: blanks.map(function (slot) { return values[slot]; })
    };
  }

  /** Подставить выбранные значения в пропуски и вернуть полный пример */
  function fill(task, values) {
    var v = { a: task.a, b: task.b, sum: task.sum };
    task.blanks.forEach(function (slot, i) {
      if (values[i] !== undefined && values[i] !== null) v[slot] = values[i];
    });
    return v;
  }

  /**
   * Проверка комбинации: подставляем выбранные числа и смотрим, верно ли равенство.
   * Для уровня 3 «правильная комбинация» — та, при которой пример читается верно.
   */
  function checkAnswer(task, values) {
    if (!values || values.length !== task.blanks.length) return false;
    for (var i = 0; i < values.length; i++) {
      if (typeof values[i] !== 'number' || !isFinite(values[i])) return false;
    }
    var v = fill(task, values);
    return v.a >= 1 && v.b >= 1 && v.a + v.b === v.sum;
  }

  /**
   * Варианты ответа: правильные (один или два) + «обманки» из того же диапазона.
   * Обманка принимается только если с её участием пример нельзя собрать верно —
   * иначе на экране оказалось бы больше правильных комбинаций, чем нужно.
   *
   * @param {object} task     — результат buildTask
   * @param {number} count    — сколько всего вариантов
   * @param {number} maxValue — самое большое число на кнопке (верх диапазона)
   */
  function buildOptions(task, count, maxValue) {
    var options = task.answers.slice();
    var total = Math.max(options.length, count);

    function conflicts(candidate) {
      if (options.indexOf(candidate) !== -1) return true;
      if (task.blanks.length === 1) return checkAnswer(task, [candidate]);
      // Два пропуска: кандидат не должен «срастаться» ни с одним вариантом
      for (var i = 0; i < options.length; i++) {
        if (checkAnswer(task, [candidate, options[i]])) return true;
        if (checkAnswer(task, [options[i], candidate])) return true;
      }
      return false;
    }

    function push(value) {
      if (options.length >= total) return;
      if (typeof value !== 'number' || !isFinite(value)) return;
      if (value < 1 || value > maxValue) return;
      if (conflicts(value)) return;
      options.push(value);
    }

    // Сначала числа рядом с правильными — так выбирать интереснее
    var near = [];
    task.answers.forEach(function (answer) {
      [1, -1, 2, -2, 3, -3].forEach(function (delta) { near.push(answer + delta); });
    });
    shuffle(near).forEach(push);

    // Потом любые остальные числа до верхней границы
    shuffle(valuesUpTo(maxValue)).forEach(push);

    return shuffle(options);
  }

  return {
    MIN_SUM: MIN_SUM,
    PATTERNS: PATTERNS,
    shuffle: shuffle,
    sumsInRange: sumsInRange,
    valuesUpTo: valuesUpTo,
    splitSum: splitSum,
    buildSessionExamples: buildSessionExamples,
    buildTask: buildTask,
    buildOptions: buildOptions,
    checkAnswer: checkAnswer,
    fill: fill
  };
})();
