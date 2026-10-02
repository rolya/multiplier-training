/* ==========================================================================
   scene.js — картинка к задаче из значков-эмодзи
   Глобальный объект WP.scene

   Два режима:
     'task' — что дано в условии: группы, кучка «всего», полоски сравнения;
              то, что нужно найти, нарисовано знаком «?»
     'help' — как решается: предметы уже разложены по группам, полоски
              разбиты на равные части
   ========================================================================== */

window.WP = window.WP || {};

WP.scene = (function () {
  var lang = WP.lang;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /**
   * Одинаковые значки ровными рядами — так их легче считать.
   * cols — сколько в ряду; по умолчанию до 10, как в рядах счётной рамки.
   * На телефоне в ряду не больше 5 (--cols-narrow, см. style.css)
   */
  function icons(icon, count, cols) {
    var wrap = el('div', 'icons');
    var n = Math.max(1, Math.min(count, cols || 10));
    wrap.style.setProperty('--cols', n);
    wrap.style.setProperty('--cols-narrow', n <= 5 ? n : Math.ceil(n / Math.ceil(n / 5)));
    for (var i = 0; i < count; i++) wrap.appendChild(el('span', 'ico', icon));
    return wrap;
  }

  /** Коробка-группа: сверху значок группы, внутри предметы или «?» */
  function box(head, icon, count, caption, mark) {
    var node = el('div', 'box' + (mark ? ' box--' + mark : ''));
    node.appendChild(el('div', 'box__head', head));
    if (count === null) node.appendChild(el('div', 'box__q', '?'));
    // В коробке до 5 в ряд, больше — в два ряда поровну: 6 → 3 и 3, 8 → 4 и 4
    else node.appendChild(icons(icon, count, count <= 5 ? count : Math.ceil(count / 2)));
    if (caption) node.appendChild(el('div', 'box__count', caption));
    return node;
  }

  function groups(list) {
    var wrap = el('div', 'groups');
    list.forEach(function (node) { wrap.appendChild(node); });
    return wrap;
  }

  /** Кучка «всего»: все предметы вперемешку и подпись */
  function pile(icon, count, caption) {
    var node = el('div', 'pile');
    node.appendChild(icons(icon, count));
    node.appendChild(el('div', 'pile__count', caption));
    return node;
  }

  function arrow(text) {
    return el('div', 'scene__arrow', '⬇️ ' + text);
  }

  function caption(text) {
    return el('div', 'scene__caption', text);
  }

  /**
   * Полоска сравнения.
   * segs — массив количеств: каждое число — отдельный кусочек полоски
   *        (null — неизвестный кусочек «?»)
   */
  function bar(entity, segs, note, mark) {
    var node = el('div', 'bar' + (mark ? ' bar--' + mark : ''));
    node.appendChild(el('div', 'bar__label', entity.label));
    var body = el('div', 'bar__body');
    segs.forEach(function (count) {
      if (count === null) {
        body.appendChild(el('div', 'seg seg--q', '?'));
        return;
      }
      var seg = el('div', 'seg');
      seg.appendChild(icons(entity.icon, count));
      seg.appendChild(el('div', 'seg__count', String(count)));
      body.appendChild(seg);
    });
    node.appendChild(body);
    if (note) node.appendChild(el('div', 'bar__note', note));
    return node;
  }

  function bars(list) {
    var wrap = el('div', 'bars');
    list.forEach(function (node) { wrap.appendChild(node); });
    return wrap;
  }

  function repeat(value, times) {
    var list = [];
    for (var i = 0; i < times; i++) list.push(value);
    return list;
  }

  /** «3 + 3 + 3 = 9» */
  function sum(value, times) {
    return repeat(value, times).join(' + ') + ' = ' + value * times;
  }

  /** Картинка в режиме «условие» */
  function taskScene(t) {
    var tpl = t.tpl;
    var x = t.x;
    var y = t.y;
    var p = t.p;
    var raz = lang.raz(y);

    switch (t.kind) {
      case 'mul':
        return [groups(repeat(0, x).map(function () {
          return box(tpl.groupIcon, tpl.itemIcon, y, 'по ' + y);
        })), caption('Сколько всего ' + tpl.itemIcon + '?')];

      case 'div':
        return [
          pile(tpl.itemIcon, p, 'Всего: ' + p),
          arrow('поровну'),
          groups(repeat(0, x).map(function () { return box(tpl.groupIcon, '', null); }))
        ];

      case 'divBy':
        return [
          pile(tpl.itemIcon, p, 'Всего: ' + p),
          arrow('по ' + y),
          groups([
            box(tpl.groupIcon, tpl.itemIcon, y, 'по ' + y),
            box(tpl.groupIcon, '', null, 'сколько таких?', 'ghost')
          ])
        ];

      case 'more':
        return [bars([bar(tpl.a, [x]), bar(tpl.b, [null], raz + ' больше', 'find')])];

      case 'less':
        return [bars([bar(tpl.a, [p]), bar(tpl.b, [null], raz + ' меньше', 'find')])];

      case 'cmp':
        return [bars([bar(tpl.a, [p]), bar(tpl.b, [x])]),
          caption('Во сколько раз ' + tpl.ask + '?')];

      case 'indMore':
        return [bars([bar(tpl.a, [p], 'это ' + raz + ' больше, чем ⬇️'),
          bar(tpl.b, [null], '', 'find')])];

      case 'indLess':
        return [bars([bar(tpl.a, [x], 'это ' + raz + ' меньше, чем ⬇️'),
          bar(tpl.b, [null], '', 'find')])];
    }
    return [];
  }

  /** Картинка в режиме «как решать» */
  function helpScene(t) {
    var tpl = t.tpl;
    var x = t.x;
    var y = t.y;
    var p = t.p;

    switch (t.kind) {
      case 'mul':
        return [groups(repeat(0, x).map(function () {
          return box(tpl.groupIcon, tpl.itemIcon, y, 'по ' + y);
        })), caption(sum(y, x) + ', а короче: ' + y + ' · ' + x + ' = ' + p)];

      case 'div':
        return [groups(repeat(0, x).map(function () {
          return box(tpl.groupIcon, tpl.itemIcon, y, String(y), 'found');
        })), caption('Раскладываем по одному в каждую группу по кругу, пока не кончатся. ' +
          'Везде вышло по ' + y + '.')];

      case 'divBy':
        return [groups(repeat(0, x).map(function (_, i) {
          return box(tpl.groupIcon + ' ' + (i + 1), tpl.itemIcon, y, 'по ' + y, 'found');
        })), caption('Откладываем по ' + y + ', пока не кончатся. Групп получилось ' + x + '.')];

      case 'more':
      case 'indLess':
        return [bars([bar(tpl.a, [x]), bar(tpl.b, repeat(x, y), '', 'found')]),
          caption(sum(x, y) + ', а короче: ' + x + ' · ' + y + ' = ' + p)];

      case 'less':
      case 'indMore':
        return [bars([bar(tpl.a, repeat(x, y)), bar(tpl.b, [x], '', 'found')]),
          caption(p + ' делим на ' + y + ' равных частей — в одной части ' + x + '.')];

      case 'cmp':
        return [bars([bar(tpl.a, repeat(x, y)), bar(tpl.b, [x], '', 'found')]),
          caption('По ' + x + ' помещается в ' + p + ' ' + lang.q(y, lang.RAZ) + '.')];
    }
    return [];
  }

  /** Размер значков: на картинке их примерно столько, сколько произведение задачи */
  function sizeClass(t) {
    var n = t.p;
    if (n <= 24) return 'scene--l';
    if (n <= 60) return 'scene--m';
    return 'scene--s';
  }

  /**
   * @param {object} task — задача из WP.core
   * @param {string} mode — 'task' или 'help'
   * @returns {HTMLElement}
   */
  function render(task, mode) {
    var node = el('div', 'scene ' + sizeClass(task));
    var parts = mode === 'help' ? helpScene(task) : taskScene(task);
    parts.forEach(function (part) { node.appendChild(part); });
    return node;
  }

  return { render: render };
})();
