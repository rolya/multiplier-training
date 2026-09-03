/* ==========================================================================
   mistakes-page.js — печатная страница ошибок «Состав числа» (mistakes.html)
   Показываем все ошибки за последние X тренировок, без фильтра по диапазону:
   распечатанный список пригодится для любого диапазона.
   ========================================================================== */

(function () {
  var store = NC.store;
  var settings = store.getSettings();
  var mistakes = store.getRecentMistakes(settings.mistakeWindow,
    0, store.LIMITS.rangeMax.max);

  var grid = document.getElementById('grid');
  var summary = document.getElementById('summary');
  var empty = document.getElementById('empty');
  var toggleBtn = document.getElementById('toggle-answers');
  var showAnswers = true;

  if (!mistakes.length) {
    summary.textContent = 'За последние ' + settings.mistakeWindow + ' тренировок ошибок не было.';
    empty.hidden = false;
    toggleBtn.hidden = true;
    return;
  }

  summary.textContent = 'Ошибки за последние ' + settings.mistakeWindow +
    ' тренировок — всего примеров: ' + mistakes.length;

  function render() {
    grid.innerHTML = '';
    mistakes.forEach(function (m) {
      var div = document.createElement('div');
      div.className = 'print-ex';
      // Со скрытыми ответами получается обычный список для решения: 3 + ___ = 9
      div.innerHTML = showAnswers
        ? m.a + ' + <b>' + m.b + '</b> = ' + m.sum +
          '<span class="print-ex__times">ошибок: ' + m.times + '</span>'
        : m.a + ' + ____ = ' + m.sum +
          '<span class="print-ex__times">ошибок: ' + m.times + '</span>';
      grid.appendChild(div);
    });
  }

  toggleBtn.addEventListener('click', function () {
    showAnswers = !showAnswers;
    toggleBtn.textContent = showAnswers ? 'Скрыть ответы' : 'Показать ответы';
    render();
  });

  document.getElementById('print-btn').addEventListener('click', function () {
    window.print();
  });

  render();
})();
