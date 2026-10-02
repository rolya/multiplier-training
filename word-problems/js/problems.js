/* ==========================================================================
   problems.js — задачи на умножение и деление: числа под уровень, сессия,
   разбор решения для «Помочь»
   Глобальные объекты WP.lang (склонения) и WP.core
   ========================================================================== */

window.WP = window.WP || {};

/* --- Склонение существительных после числа ----------------------------- */

WP.lang = (function () {
  /** 0 — «1 персик», 1 — «2 персика», 2 — «5 персиков» */
  function formIndex(num) {
    var n10 = num % 10;
    var n100 = num % 100;
    if (n10 === 1 && n100 !== 11) return 0;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return 1;
    return 2;
  }

  function isOne(num) { return formIndex(num) === 0; }

  /** Только слово: w(5, PEACH) → «персиков» */
  function w(num, noun) { return noun.forms[formIndex(num)]; }

  /** Число со словом: q(21, CANDY) → «21 конфета» */
  function q(num, noun) { return num + ' ' + w(num, noun); }

  /** То же в винительном падеже: qa(21, CANDY) → «21 конфету» */
  function qa(num, noun) {
    return num + ' ' + (isOne(num) ? noun.acc1 : w(num, noun));
  }

  var RAZ = { forms: ['раз', 'раза', 'раз'], acc1: 'раз' };

  /** «в 3 раза», «в 5 раз» */
  function raz(num) { return 'в ' + q(num, RAZ); }

  return { formIndex: formIndex, isOne: isOne, w: w, q: q, qa: qa, raz: raz, RAZ: RAZ };
})();

WP.core = (function () {
  var lang = WP.lang;
  var MUL = '·';
  var DIV = ':';
  var FACTOR = [2, 10];   // множители — из таблицы умножения

  var KIND_TITLES = {
    mul: 'Сколько всего?',
    div: 'Поровну на части',
    divBy: 'По сколько в группе',
    more: 'В несколько раз больше',
    less: 'В несколько раз меньше',
    cmp: 'Во сколько раз?',
    indMore: 'Задача-ловушка: «больше»',
    indLess: 'Задача-ловушка: «меньше»'
  };

  /** Порядок видов — в нём же они чередуются в тренировке */
  var KINDS = ['mul', 'div', 'divBy', 'more', 'less', 'cmp', 'indMore', 'indLess'];

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

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function byId(id) {
    for (var i = 0; i < WP.PROBLEMS.length; i++) {
      if (WP.PROBLEMS[i].id === id) return WP.PROBLEMS[i];
    }
    return null;
  }

  /** Все пары множителей шаблона, у которых произведение не больше уровня */
  function pairs(tpl, max) {
    var xr = tpl.x || FACTOR;
    var yr = tpl.y || FACTOR;
    var list = [];
    for (var x = xr[0]; x <= xr[1]; x++) {
      for (var y = yr[0]; y <= yr[1]; y++) {
        if (x * y <= max) list.push({ x: x, y: y });
      }
    }
    return list;
  }

  /** Шаблоны, которые можно решить на этом уровне (хотя бы одна пара чисел) */
  function available(max) {
    return WP.PROBLEMS.filter(function (tpl) { return pairs(tpl, max).length > 0; });
  }

  /** Ответ задачи и слово к нему */
  function answerOf(tpl, v) {
    switch (tpl.kind) {
      case 'mul': return { value: v.p, text: lang.q(v.p, tpl.item) };
      case 'div': return { value: v.y, text: lang.q(v.y, tpl.item) };
      case 'divBy': return { value: v.x, text: lang.q(v.x, tpl.group) };
      case 'more':
      case 'indLess': return { value: v.p, text: lang.q(v.p, tpl.unit) };
      case 'less':
      case 'indMore': return { value: v.x, text: lang.q(v.x, tpl.unit) };
      case 'cmp': return { value: v.y, text: lang.raz(v.y) + ' ' + tpl.ask };
    }
    return { value: NaN, text: '' };
  }

  /** Готовая задача из шаблона и пары множителей */
  function build(tpl, x, y) {
    var v = { x: x, y: y, p: x * y };
    var answer = answerOf(tpl, v);
    return {
      id: tpl.id,
      kind: tpl.kind,
      tpl: tpl,
      x: v.x,
      y: v.y,
      p: v.p,
      text: tpl.text(v, lang),
      answer: answer.value,
      answerText: answer.text
    };
  }

  function generate(tpl, max) {
    var pair = pick(pairs(tpl, max));
    return build(tpl, pair.x, pair.y);
  }

  /**
   * Задачи на тренировку.
   * Виды задач чередуются по кругу (в каждом круге — в случайном порядке),
   * внутри вида шаблоны не повторяются, пока не закончатся. Числа каждый раз
   * подбираются заново, так что повтор шаблона — всё равно другая задача.
   */
  function buildSession(settings) {
    var max = settings.maxNumber;
    var count = settings.exampleCount;
    var pool = available(max);
    if (!pool.length) return [];

    var byKind = {};
    pool.forEach(function (tpl) {
      (byKind[tpl.kind] = byKind[tpl.kind] || []).push(tpl);
    });
    var kinds = KINDS.filter(function (k) { return byKind[k]; });
    var queues = {};
    kinds.forEach(function (k) { queues[k] = []; });

    function nextOf(kind) {
      if (!queues[kind].length) queues[kind] = shuffle(byKind[kind]);
      return queues[kind].shift();
    }

    var tasks = [];
    while (tasks.length < count) {
      var round = shuffle(kinds);
      for (var i = 0; i < round.length && tasks.length < count; i++) {
        tasks.push(generate(nextOf(round[i]), max));
      }
    }
    return tasks;
  }

  /** Задача из сохранённой ошибки { id, x, y } — или null, если шаблона уже нет */
  function fromMistake(m) {
    var tpl = byId(m.id);
    var x = parseInt(m.x, 10);
    var y = parseInt(m.y, 10);
    if (!tpl || isNaN(x) || isNaN(y) || x < 1 || y < 1) return null;
    return build(tpl, x, y);
  }

  /* --- Разбор для «Помочь» --------------------------------------------- */

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /** Подпись строки сравнения: «🍁 Клёны — 4 ряда» */
  function row(entity, value, noun) {
    return entity.label + ' — ' + (value === null ? '?' : lang.q(value, noun));
  }

  /**
   * Как решать задачу:
   *   title  — вид задачи
   *   rule   — правило словами, с числами этой задачи
   *   record — краткая запись (строки)
   *   expr   — решение одним выражением
   *   answer — ответ со словом
   */
  function explain(task) {
    var tpl = task.tpl;
    var x = task.x;
    var y = task.y;
    var p = task.p;
    var aUnit = tpl.aUnit || tpl.unit;
    var rule;
    var record;
    var expr;

    switch (task.kind) {
      case 'mul':
        rule = 'Здесь одинаковые группы: по ' + y + ' взяли ' + lang.q(x, lang.RAZ) + '. ' +
          'Когда складываем одинаковые числа, удобнее умножить: ' +
          'сколько в одной группе ' + MUL + ' сколько групп.';
        record = [
          cap(lang.w(5, tpl.group)) + ' — ' + x,
          tpl.each + ' — по ' + lang.q(y, tpl.item),
          'Всего — ?'
        ];
        expr = y + ' ' + MUL + ' ' + x + ' = ' + p;
        break;

      case 'div':
        rule = 'Всё разложили поровну на ' + x + ' ' + (lang.formIndex(x) === 1 ? 'части' : 'частей') +
          '. Чтобы узнать, сколько в одной части, делим: всего : сколько частей.';
        record = [
          'Всего — ' + lang.q(p, tpl.item),
          cap(lang.w(5, tpl.group)) + ' — ' + x,
          tpl.each + ' — ?'
        ];
        expr = p + ' ' + DIV + ' ' + x + ' = ' + y;
        break;

      case 'divBy':
        rule = 'Раскладывали по ' + y + '. Узнаём, сколько раз по ' + y + ' помещается в ' + p +
          ', — делим: всего : сколько в одной группе.';
        record = [
          'Всего — ' + lang.q(p, tpl.item),
          tpl.each + ' — по ' + lang.q(y, tpl.item),
          cap(lang.w(5, tpl.group)) + ' — ?'
        ];
        expr = p + ' ' + DIV + ' ' + y + ' = ' + x;
        break;

      case 'more':
        rule = '«' + cap(lang.raz(y)) + ' больше» — значит, ' + lang.q(y, lang.RAZ) +
          ' по ' + x + '. Чтобы увеличить число в несколько раз, умножаем.';
        record = [row(tpl.a, x, aUnit), row(tpl.b, null) + ', ' + lang.raz(y) + ' больше'];
        expr = x + ' ' + MUL + ' ' + y + ' = ' + p;
        break;

      case 'less':
        rule = '«' + cap(lang.raz(y)) + ' меньше» — значит, ' + p + ' делим на ' + y +
          ' равных частей и берём одну. Чтобы уменьшить число в несколько раз, делим.';
        record = [row(tpl.a, p, aUnit), row(tpl.b, null) + ', ' + lang.raz(y) + ' меньше'];
        expr = p + ' ' + DIV + ' ' + y + ' = ' + x;
        break;

      case 'cmp':
        rule = 'Чтобы узнать, во сколько раз одно число больше или меньше другого, ' +
          'большее число делим на меньшее. Смотрим, сколько раз ' + x + ' помещается в ' + p + '.';
        record = [row(tpl.a, p, aUnit), row(tpl.b, x, tpl.unit),
          'Во сколько раз ' + tpl.ask + '?'];
        expr = p + ' ' + DIV + ' ' + x + ' = ' + y + ' (' + lang.raz(y) + ')';
        break;

      case 'indMore':
        rule = 'Осторожно, ловушка! Слово «больше» есть, но умножать не нужно. ' +
          'Если ' + p + ' — это ' + lang.raz(y) + ' больше, чем неизвестное, значит, ' +
          'неизвестное ' + lang.raz(y) + ' меньше. Делим.';
        record = [row(tpl.a, p, aUnit) + ', это ' + lang.raz(y) + ' больше', row(tpl.b, null)];
        expr = p + ' ' + DIV + ' ' + y + ' = ' + x;
        break;

      case 'indLess':
        rule = 'Осторожно, ловушка! Слово «меньше» есть, но делить не нужно. ' +
          'Если ' + x + ' — это ' + lang.raz(y) + ' меньше, чем неизвестное, значит, ' +
          'неизвестное ' + lang.raz(y) + ' больше. Умножаем.';
        record = [row(tpl.a, x, aUnit) + ', это ' + lang.raz(y) + ' меньше', row(tpl.b, null)];
        expr = x + ' ' + MUL + ' ' + y + ' = ' + p;
        break;
    }

    return {
      title: KIND_TITLES[task.kind],
      rule: rule,
      record: record,
      expr: expr,
      answer: task.answerText
    };
  }

  return {
    KINDS: KINDS,
    KIND_TITLES: KIND_TITLES,
    pairs: pairs,
    available: available,
    build: build,
    buildSession: buildSession,
    fromMistake: fromMistake,
    explain: explain
  };
})();
