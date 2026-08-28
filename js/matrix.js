/* ==========================================================================
   matrix.js — матрица примеров, набор примеров для сессии, варианты ответов
   Глобальный объект MT.core
   ========================================================================== */

window.MT = window.MT || {};

MT.core = (function () {
  var MAX = 10;

  /** Полная матрица умножения: [{ a, b, product }] */
  function buildMatrix(includeOne) {
    var min = includeOne ? 1 : 2;
    var list = [];
    for (var a = min; a <= MAX; a++) {
      for (var b = min; b <= MAX; b++) {
        list.push({ a: a, b: b, product: a * b });
      }
    }
    return list;
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

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function key(item) {
    return item.a + 'x' + item.b;
  }

  /**
   * Набор примеров для сессии.
   * 1) матрица в режиме shuffle;
   * 2) сначала — прошлые ошибки (если включён фокус на ошибках);
   * 3) добираем случайными примерами до нужного количества;
   * 4) ещё раз перемешиваем.
   *
   * @param {object} settings — настройки из MT.store
   * @param {Array}  mistakes — [{a, b}] прошлые ошибки (может быть пустым)
   * @returns {Array} [{ a, b, product, fromMistakes }]
   */
  function buildSessionExamples(settings, mistakes) {
    var matrix = shuffle(buildMatrix(settings.includeOne));
    var allowed = {};
    matrix.forEach(function (item) { allowed[key(item)] = item; });

    var limit = settings.exampleCount;
    var picked = [];
    var used = {};

    if (settings.focusMistakes && mistakes && mistakes.length) {
      // Ошибки, которые попадают в текущую матрицу (учитываем настройку «на 1»)
      var mistakeItems = [];
      mistakes.forEach(function (m) {
        var found = allowed[m.a + 'x' + m.b];
        if (found && !used[key(found)]) {
          used[key(found)] = true;
          mistakeItems.push({
            a: found.a, b: found.b, product: found.product, fromMistakes: true
          });
        }
      });
      // Если ошибок больше, чем примеров в сессии — берём случайную часть
      if (mistakeItems.length > limit) mistakeItems = shuffle(mistakeItems).slice(0, limit);
      picked = mistakeItems;
      used = {};
      picked.forEach(function (item) { used[key(item)] = true; });
    }

    for (var i = 0; i < matrix.length && picked.length < limit; i++) {
      var item = matrix[i];
      if (used[key(item)]) continue;
      used[key(item)] = true;
      picked.push({ a: item.a, b: item.b, product: item.product, fromMistakes: false });
    }

    // Если примеров в сессии больше, чем клеток в матрице — разрешаем повторы
    while (picked.length < limit && matrix.length) {
      var extra = matrix[randInt(0, matrix.length - 1)];
      picked.push({
        a: extra.a, b: extra.b, product: extra.product, fromMistakes: false
      });
    }

    return shuffle(picked);
  }

  /**
   * Задание для примера с учётом уровня.
   * Уровень 1: «7 × 3 = ?»   → ответ = произведение
   * Уровень 2: «? × 3 = 21» или «7 × ? = 21» → ответ = скрытый множитель
   *
   * @returns {object} { a, b, product, level, hidden, answer, parts }
   *   hidden: 'product' | 'a' | 'b'
   *   parts:  { a, b, product } — строки для показа ('?' у скрытого)
   */
  function buildTask(example, level) {
    var hidden;
    if (level === 2) {
      hidden = Math.random() < 0.5 ? 'a' : 'b';
    } else {
      hidden = 'product';
    }

    var answer = hidden === 'product' ? example.product : example[hidden];

    return {
      a: example.a,
      b: example.b,
      product: example.product,
      fromMistakes: !!example.fromMistakes,
      level: level,
      hidden: hidden,
      answer: answer,
      parts: {
        a: hidden === 'a' ? '?' : String(example.a),
        b: hidden === 'b' ? '?' : String(example.b),
        product: hidden === 'product' ? '?' : String(example.product)
      }
    };
  }

  /**
   * Варианты ответа: правильный + правдоподобные «обманки», перемешанные.
   * @param {object} task — результат buildTask
   * @param {number} count — сколько всего вариантов (1..10)
   */
  function buildOptions(task, count) {
    var answer = task.answer;
    var pool = [];
    // Скрыт множитель — обманки тоже должны быть множителями (1..10)
    var maxValue = task.hidden === 'product' ? MAX * MAX : MAX;

    function push(value) {
      if (typeof value !== 'number' || !isFinite(value)) return;
      if (value === answer || value < 1 || value > maxValue) return;
      if (pool.indexOf(value) !== -1) return;
      pool.push(value);
    }

    if (task.hidden === 'product') {
      // Типичные детские ошибки: сдвиг на один множитель, соседние строки/столбцы
      var a = task.a;
      var b = task.b;
      push(a * b + a); push(a * b - a);
      push(a * b + b); push(a * b - b);
      push(a * b + 1); push(a * b - 1);
      push((a + 1) * b); push((a - 1) * b);
      push(a * (b + 1)); push(a * (b - 1));
      push(a + b);
      // Добираем случайными произведениями из таблицы
      var guard = 0;
      while (pool.length < count - 1 && guard < 300) {
        push(randInt(1, 10) * randInt(1, 10));
        guard++;
      }
    } else {
      // Скрыт множитель — обманки из 1..10, ближайшие числа приоритетнее
      push(answer + 1); push(answer - 1); push(answer + 2); push(answer - 2);
      var order = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      order.forEach(push);
    }

    var options = shuffle(pool).slice(0, Math.max(0, count - 1));
    options.push(answer);
    return shuffle(options);
  }

  return {
    MAX: MAX,
    buildMatrix: buildMatrix,
    shuffle: shuffle,
    buildSessionExamples: buildSessionExamples,
    buildTask: buildTask,
    buildOptions: buildOptions
  };
})();
