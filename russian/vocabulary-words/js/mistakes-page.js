/* ==========================================================================
   mistakes-page.js — печатная страница ошибок «Словарные слова»
   Показываем слова за последние X тренировок; ответы можно скрыть, чтобы
   распечатать список слов с пропусками и вписать буквы в тетради.
   ========================================================================== */

(function () {
  var store = VW.store;
  var core = VW.core;
  var settings = store.getSettings();
  var mistakes = store.getRecentMistakes(settings.mistakeWindow);

  var grid = document.getElementById('grid');
  var summary = document.getElementById('summary');
  var empty = document.getElementById('empty');
  var toggleBtn = document.getElementById('toggle-answers');
  var showAnswers = true;

  if (!mistakes.length) {
    summary.textContent = 'За последние ' + settings.mistakeWindow +
      ' тренировок ошибок не было.';
    empty.hidden = false;
    toggleBtn.hidden = true;
    return;
  }

  summary.textContent = 'Ошибки за последние ' + settings.mistakeWindow +
    ' тренировок — всего слов: ' + mistakes.length;

  function render() {
    grid.innerHTML = '';
    mistakes.forEach(function (m) {
      var entry = core.find(m.word, m.grade);
      var task = entry ? core.buildTask({ entry: entry, grade: m.grade }) : null;
      var masked = task ? core.maskedText(task) : m.word;

      var div = document.createElement('div');
      div.className = 'print-ex print-ex--word';
      div.innerHTML = '<span class="print-ex__masked">' + masked + '</span>' +
        (showAnswers ? '<b class="print-ex__word">' + m.word + '</b>' : '') +
        '<span class="print-ex__times">' + m.grade + ' класс, ошибок: ' + m.times + '</span>';
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
