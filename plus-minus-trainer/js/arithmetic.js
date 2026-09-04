/* ==========================================================================
   arithmetic.js — сложение и вычитание: примеры, варианты ответа, подсказки
   Глобальный объект PM.core
   ========================================================================== */

window.PM = window.PM || {};

PM.core = (function () {
  var MAX = 100;    // ни сумма, ни уменьшаемое не выходят за 100
  var MINUS = '−';  // типографский минус — крупным шрифтом читается лучше дефиса

  var LEVEL_TITLES = {
    1: 'без перехода через десяток',
    2: 'двузначное и однозначное с переходом',
    3: 'два двузначных с переходом'
  };

  function tens(n) { return Math.floor(n / 10) * 10; }
  function ones(n) { return n % 10; }

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

  function range(from, to) {
    var list = [];
    for (var v = from; v <= to; v++) list.push(v);
    return list;
  }

  /** Переход через десяток: в сложении единицы дают больше 9, в вычитании единиц не хватает */
  function crossesTen(a, b, op) {
    return op === '+' ? ones(a) + ones(b) > 9 : ones(a) < ones(b);
  }

  function solve(task) {
    return task.op === '+' ? task.a + task.b : task.a - task.b;
  }

  /** Пример без ответа: «47 + 38» */
  function text(task) {
    return task.a + ' ' + (task.op === '+' ? '+' : MINUS) + ' ' + task.b;
  }

  /* --- Пулы примеров ---------------------------------------------------- */

  /**
   * Все примеры уровня для одного действия.
   *
   * Первое число всегда двузначное и не круглое (единицы >= 1) — тогда его
   * есть на что разложить и обе подсказки получаются осмысленными.
   * Второе число: уровень 1 — одно- или двузначное, уровень 2 — однозначное,
   * уровень 3 — двузначное.
   *
   * @param {number} level — 1, 2 или 3
   * @param {string} op    — '+' или '-'
   * @returns {Array} [{ a, b, op, level }]
   */
  function pool(level, op) {
    var list = [];
    for (var a = 11; a <= 99; a++) {
      if (ones(a) === 0) continue;
      for (var b = 1; b <= 99; b++) {
        if (level === 2 && b > 9) break;        // уровень 2 — только однозначное
        if (level === 3 && b < 10) continue;    // уровень 3 — только двузначное
        if (op === '+' && a + b > MAX) break;
        if (op === '-' && a - b < 0) break;
        // Уровень 1 — без перехода, уровни 2 и 3 — обязательно с переходом
        if (crossesTen(a, b, op) !== (level !== 1)) continue;
        list.push({ a: a, b: b, op: op, level: level });
      }
    }
    return list;
  }

  /** Делим n примеров на k уровней поровну; остаток отдаём последним (сложным) */
  function spread(n, k) {
    var base = Math.floor(n / k);
    var rem = n % k;
    var list = [];
    for (var i = 0; i < k; i++) list.push(base + (i >= k - rem ? 1 : 0));
    return list;
  }

  function take(list, count) {
    if (!list.length || count <= 0) return [];
    var picked = shuffle(list).slice(0, count);
    // Примеров запросили больше, чем есть в пуле — разрешаем повторы
    while (picked.length < count) picked.push(list[randInt(0, list.length - 1)]);
    return picked;
  }

  /** Примеры одного уровня: половина на сложение, половина на вычитание */
  function pickForLevel(level, count) {
    if (count <= 0) return [];
    var plus = Math.floor(count / 2);
    var minus = count - plus;
    if (Math.random() < 0.5) {          // при нечётном числе — кому достанется лишний
      var swap = plus;
      plus = minus;
      minus = swap;
    }
    return take(pool(level, '+'), plus).concat(take(pool(level, '-'), minus));
  }

  /**
   * Набор примеров сессии: количество делится между выбранными уровнями поровну.
   * @param {object} settings — настройки из PM.store
   * @returns {Array} [{ a, b, op, level }]
   */
  function buildSessionExamples(settings) {
    var levels = settings.levels;
    var counts = spread(settings.exampleCount, levels.length);
    var out = [];
    levels.forEach(function (level, i) {
      out = out.concat(pickForLevel(level, counts[i]));
    });
    return shuffle(out);
  }

  /* --- Варианты ответа --------------------------------------------------- */

  /**
   * Кнопки с ответами: правильный + «обманки» в пределах 0…100.
   * Сначала берём типичные детские ошибки (забыли переход через десяток —
   * ответ уходит на 10, спутали единицы — на 1–2), потом любые числа.
   *
   * @param {object} task  — пример
   * @param {number} count — сколько всего кнопок
   */
  function buildOptions(task, count) {
    var answer = solve(task);
    var options = [answer];
    var total = Math.max(2, count);

    function push(value) {
      if (options.length >= total) return;
      if (value < 0 || value > MAX) return;
      if (options.indexOf(value) !== -1) return;
      options.push(value);
    }

    shuffle([10, -10, 1, -1, 9, -9, 11, -11, 2, -2, 20, -20]).forEach(function (delta) {
      push(answer + delta);
    });
    shuffle(range(0, MAX)).forEach(function (value) { push(value); });

    return shuffle(options);
  }

  /* --- Подсказки: как решать -------------------------------------------- */

  function step(expr, note) {
    return { expr: expr, note: note || '' };
  }

  function method(title, hint, steps) {
    return { title: title, hint: hint, steps: steps };
  }

  function plus(x, y, res) { return x + ' + ' + y + ' = ' + res; }
  function minus(x, y, res) { return x + ' ' + MINUS + ' ' + y + ' = ' + res; }

  /**
   * Шаг с разбиением единиц: действие остаётся одним, а второе число под ним
   * разбито «треугольником» на две части — добить до круглого десятка и остаток.
   * Рисует это session-page.js, здесь только данные: что до числа, само число,
   * его части и что после.
   *
   * @param {number} a      — первое число
   * @param {number} b      — второе число (его и разбиваем)
   * @param {string} op     — '+' или '-'
   * @param {string} prefix — необязательное начало пояснения
   */
  function splitStep(a, b, op, prefix) {
    var add = op === '+';
    var up = add ? 10 - ones(a) : ones(a);   // сколько до круглого десятка
    var rest = b - up;
    var round = add ? a + up : a - up;
    var res = add ? a + b : a - b;
    var sign = add ? ' + ' : ' ' + MINUS + ' ';
    var before = a + sign;
    var after = ' = ' + res;
    return {
      expr: before + b + after,
      note: (prefix ? prefix + ': ' : '') + up +
        (add ? ' добивает ' : ' спускает ') + a + ' до ' + round +
        ', потом ' + (add ? 'прибавляем' : 'вычитаем') + ' остаток ' + rest,
      split: {
        before: before,
        whole: String(b),
        parts: add ? [String(up), String(rest)] : [MINUS + up, MINUS + rest],
        after: after
      }
    };
  }

  /** Сложение по разрядам: десятки + десятки, единицы + единицы, сложить результаты */
  function digitsAdd(a, b) {
    var tA = tens(a), oA = ones(a), tB = tens(b), oB = ones(b);
    if (tB === 0) {                        // 45 + 3 — десятки первого не меняются
      return [
        step(plus(oA, oB, oA + oB), 'единицы'),
        step(plus(tA, oA + oB, a + b), 'прибавляем к десяткам первого числа')
      ];
    }
    if (oB === 0) {                        // 45 + 30 — у второго числа нет единиц
      return [
        step(plus(tA, tB, tA + tB), 'десятки'),
        step(plus(tA + tB, oA, a + b), 'возвращаем единицы первого числа')
      ];
    }
    return [
      step(plus(tA, tB, tA + tB), 'десятки'),
      step(plus(oA, oB, oA + oB), 'единицы'),
      step(plus(tA + tB, oA + oB, a + b), 'складываем результаты')
    ];
  }

  /** Вычитание по разрядам: десятки − десятки, единицы − единицы, сложить результаты */
  function digitsSub(a, b) {
    var tA = tens(a), oA = ones(a), tB = tens(b), oB = ones(b);
    if (tB === 0) {                        // 58 − 3 — десятки первого не меняются
      return [
        step(minus(oA, oB, oA - oB), 'единицы'),
        step(plus(tA, oA - oB, a - b), 'прибавляем к десяткам первого числа')
      ];
    }
    if (oB === 0) {                        // 58 − 20 — у второго числа нет единиц
      return [
        step(minus(tA, tB, tA - tB), 'десятки'),
        step(plus(tA - tB, oA, a - b), 'возвращаем единицы первого числа')
      ];
    }
    return [
      step(minus(tA, tB, tA - tB), 'десятки'),
      step(minus(oA, oB, oA - oB), 'единицы'),
      step(plus(tA - tB, oA - oB, a - b), 'складываем результаты')
    ];
  }

  /**
   * Сложение по частям второго числа: первое + десятки второго, потом единицы.
   * На уровне 3 второй шаг сам идёт через десяток — рисуем разбиение единиц.
   */
  function partsAdd(a, b) {
    var tB = tens(b), oB = ones(b);
    var mid = a + tB;
    var steps = [];
    if (tB) steps.push(step(plus(a, tB, mid), 'прибавляем десятки второго числа'));
    if (oB) {
      // Ровно до круглого десятка (остаток 0) и без перехода разбивать нечего
      steps.push(ones(mid) + oB > 10
        ? splitStep(mid, oB, '+', 'единицы второго числа')
        : step(plus(mid, oB, a + b), 'прибавляем единицы второго числа'));
    }
    return steps;
  }

  /** Вычитание по частям второго числа: первое − десятки второго, потом единицы */
  function partsSub(a, b) {
    var tB = tens(b), oB = ones(b);
    var mid = a - tB;
    var steps = [];
    if (tB) steps.push(step(minus(a, tB, mid), 'вычитаем десятки второго числа'));
    if (oB) steps.push(step(minus(mid, oB, a - b), 'вычитаем единицы второго числа'));
    return steps;
  }

  /** Уровень 2, сложение: однозначное разбиваем на «добить до десятка» и остаток */
  function splitAdd(a, b) {
    if (b === 10 - ones(a)) {           // разбивать нечего — второе число и есть «добивка»
      return method('добиваем до круглого десятка',
        'Второе число как раз добивает первое до круглого десятка.',
        [step(plus(a, b, a + b), 'до ' + (a + b) + ' не хватало ровно ' + b)]);
    }
    return method('разбиваем единицы',
      'Действие одно, но второе число в уме делим на две части: первая добивает ' +
      'до круглого десятка, вторая — остаток.',
      [splitStep(a, b, '+')]);
  }

  /** Уровень 2, вычитание: однозначное разбиваем на «спуститься до десятка» и остаток */
  function splitSub(a, b) {
    return method('разбиваем единицы',
      'Действие одно, но второе число в уме делим на две части: первая спускает ' +
      'до круглого десятка, вторая — остаток.',
      [splitStep(a, b, '-')]);
  }

  /** Уровень 3, вычитание, метод 1: убрали десятки, единицы сняли по частям */
  function crossSubParts(a, b) {
    var mid = a - tens(b);
    return method('сначала десятки, потом единицы по частям',
      'Вычитаем из первого числа десятки второго. Потом единицы: их в уме делим ' +
      'на две части — первая спускает до круглого десятка, вторая — остаток.',
      [
        step(minus(a, tens(b), mid), 'убрали десятки второго числа'),
        splitStep(mid, ones(b), '-', 'единицы второго числа')
      ]);
  }

  /** Уровень 3, вычитание, метод 2: разность десятков минус разность единиц */
  function crossSubDigits(a, b) {
    var td = tens(a) - tens(b);
    var od = ones(b) - ones(a);
    return method('разность десятков минус разность единиц',
      'Вычитаем десятки. Потом из единиц второго числа вычитаем единицы первого — ' +
      'это то, что мы «заняли». Из разности десятков отнимаем разность единиц.',
      [
        step(minus(tens(a), tens(b), td), 'десятки'),
        step(minus(ones(b), ones(a), od), 'из единиц второго вычитаем единицы первого'),
        step(minus(td, od, a - b), 'из разности десятков вычитаем разность единиц')
      ]);
  }

  /**
   * Подсказка к примеру.
   * @returns {object} { crosses, methods: [{ title, hint, steps }] }
   *   steps — [{ expr, note, sub }], expr — готовая строка вида «40 + 30 = 70»
   */
  function explain(task) {
    var a = task.a, b = task.b, op = task.op, level = task.level;
    var methods;

    if (level === 2) {
      methods = [op === '+' ? splitAdd(a, b) : splitSub(a, b)];
    } else if (op === '+') {
      methods = [
        method('по разрядам',
          'Складываем десятки, складываем единицы, потом складываем результаты.',
          digitsAdd(a, b)),
        method('по частям второго числа',
          'Прибавляем к первому числу десятки второго, потом его единицы.',
          partsAdd(a, b))
      ];
    } else if (level === 1) {
      methods = [
        method('по разрядам',
          'Вычитаем десятки, вычитаем единицы, потом складываем результаты.',
          digitsSub(a, b)),
        method('по частям второго числа',
          'Вычитаем из первого числа десятки второго, потом его единицы.',
          partsSub(a, b))
      ];
    } else {
      methods = [crossSubParts(a, b), crossSubDigits(a, b)];
    }

    // Метод из одного шага просто повторяет пример — показываем, только если других нет
    var full = methods.filter(function (m) { return m.steps.length > 1; });
    if (full.length) methods = full;

    return {
      crosses: crossesTen(a, b, op),
      methods: methods.map(function (m, i) {
        return {
          title: 'Метод ' + (i + 1) + ' · ' + m.title,
          hint: m.hint,
          steps: m.steps
        };
      })
    };
  }

  return {
    MAX: MAX,
    MINUS: MINUS,
    LEVEL_TITLES: LEVEL_TITLES,
    tens: tens,
    ones: ones,
    shuffle: shuffle,
    crossesTen: crossesTen,
    solve: solve,
    text: text,
    pool: pool,
    spread: spread,
    buildSessionExamples: buildSessionExamples,
    buildOptions: buildOptions,
    explain: explain
  };
})();
