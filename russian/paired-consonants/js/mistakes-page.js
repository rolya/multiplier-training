/* ==========================================================================
   mistakes-page.js — печатная страница ошибок «Парные согласные»

   Показываем слова за последние X тренировок: слово с пропуском, ответ и
   проверочные слова. «Скрыть ответы» убирает и ответ, и проверочные слова —
   получается список для работы в тетради.
   ========================================================================== */

(function () {
  var store = PC.store;
  var core = PC.core;
  var settings = store.getSettings();
  var mistakes = core.mistakesInScope(store.getRecentMistakes(settings.mistakeWindow));

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

  /** Проверочное слово как оно есть в датасете */
  function checkText(check) {
    return check.word;
  }

  function render() {
    grid.innerHTML = '';
    mistakes.forEach(function (entry) {
      var task = core.buildTask(entry.item);

      var div = document.createElement('div');
      div.className = 'print-ex';

      var masked = document.createElement('span');
      masked.className = 'print-ex__masked';
      masked.textContent = core.maskedText(task);
      div.appendChild(masked);

      if (showAnswers) {
        var word = document.createElement('b');
        word.className = 'print-ex__word';
        word.textContent = task.word;
        div.appendChild(word);

        var check = document.createElement('span');
        check.className = 'print-ex__check';
        check.textContent = 'проверь: ' + task.check.map(checkText).join(', ');
        div.appendChild(check);
      }

      var times = document.createElement('span');
      times.className = 'print-ex__times';
      times.textContent = 'ошибок: ' + entry.times;
      div.appendChild(times);

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
