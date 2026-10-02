/* ==========================================================================
   mistakes-page.js — печатная страница ошибок «Задачи на умножение и деление»
   Задачи с ошибками за последние X тренировок — с теми же числами. Ответы
   можно скрыть, чтобы распечатать листок и решить задачи в тетради.
   ========================================================================== */

(function () {
  var store = WP.store;
  var core = WP.core;
  var settings = store.getSettings();

  var mistakes = store.getRecentMistakes(settings.mistakeWindow)
    .map(function (m) {
      var task = core.fromMistake(m);
      if (task) task.times = m.times;
      return task;
    })
    .filter(Boolean);

  var list = document.getElementById('list');
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
    ' тренировок — всего задач: ' + mistakes.length;

  function render() {
    list.innerHTML = '';
    mistakes.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'task-card';

      var text = document.createElement('span');
      text.className = 'task-card__text';
      text.textContent = task.text;
      li.appendChild(text);

      var answer = document.createElement('span');
      answer.className = 'task-card__answer';
      answer.textContent = 'Ответ: ' + (showAnswers ? task.answerText : '______________');
      li.appendChild(answer);

      var times = document.createElement('span');
      times.className = 'print-ex__times';
      times.textContent = 'ошибок: ' + task.times;
      li.appendChild(times);

      list.appendChild(li);
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
