/* ==========================================================================
   settings-page.js — страница настроек (index.html)
   ========================================================================== */

(function () {
  var store = MT.store;
  var settings = store.getSettings();

  var levelChoices = document.querySelectorAll('#level-choices .choice');
  var optionsInput = document.getElementById('options-count');
  var optionsNote = document.getElementById('options-note');
  var exampleInput = document.getElementById('example-count');
  var focusInput = document.getElementById('focus-mistakes');
  var windowInput = document.getElementById('mistake-window');
  var includeOneInput = document.getElementById('include-one');
  var mistakesSummary = document.getElementById('mistakes-summary');
  var startBtn = document.getElementById('start-btn');

  /* --- Отрисовка --- */

  function renderLevel() {
    Array.prototype.forEach.call(levelChoices, function (btn) {
      var active = parseInt(btn.dataset.value, 10) === settings.level;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderOptionsNote() {
    optionsNote.textContent = settings.optionsCount === 0
      ? '✍️ вписать ответ самому'
      : 'вариантов на выбор';
  }

  function renderMistakesSummary() {
    var mistakes = store.getRecentMistakes(settings.mistakeWindow);
    if (!mistakes.length) {
      mistakesSummary.textContent = 'Пока ошибок нет — отлично! 🎉';
      return;
    }
    var preview = mistakes.slice(0, 8).map(function (m) {
      return m.a + '×' + m.b;
    }).join(', ');
    mistakesSummary.textContent =
      'Ошибок для повторения: ' + mistakes.length + ' (' + preview +
      (mistakes.length > 8 ? '…' : '') + ')';
  }

  function renderHistory() {
    var card = document.getElementById('history-card');
    var list = document.getElementById('history-list');
    var history = store.getHistory().slice(0, 7);
    if (!history.length) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    list.innerHTML = '';
    history.forEach(function (session) {
      var date = new Date(session.date);
      var when = isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('ru-RU') + ' ' +
          date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      var li = document.createElement('li');
      li.textContent = when + ' — ' + session.correct + ' из ' + session.total +
        ' правильно' + (session.mistakes && session.mistakes.length
          ? ', ошибок: ' + session.mistakes.length
          : ' 🏆');
      list.appendChild(li);
    });
  }

  function renderAll() {
    renderLevel();
    optionsInput.value = settings.optionsCount;
    exampleInput.value = settings.exampleCount;
    focusInput.checked = settings.focusMistakes;
    windowInput.value = settings.mistakeWindow;
    includeOneInput.checked = settings.includeOne;
    renderOptionsNote();
    renderMistakesSummary();
    renderHistory();
  }

  /* --- Сохранение --- */

  function persist() {
    settings = store.saveSettings(settings);
  }

  function setNumber(field, input, min, max) {
    var n = parseInt(input.value, 10);
    if (isNaN(n)) n = store.DEFAULTS[field];
    settings[field] = Math.min(max, Math.max(min, n));
    input.value = settings[field];
    persist();
  }

  /* --- События --- */

  Array.prototype.forEach.call(levelChoices, function (btn) {
    btn.addEventListener('click', function () {
      settings.level = parseInt(btn.dataset.value, 10);
      persist();
      renderLevel();
    });
  });

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.stepper__btn');
    if (!btn) return;
    var step = btn.dataset.step;
    if (step === 'options-') settings.optionsCount = Math.max(0, settings.optionsCount - 1);
    if (step === 'options+') settings.optionsCount = Math.min(10, settings.optionsCount + 1);
    if (step === 'examples-') settings.exampleCount = Math.max(1, settings.exampleCount - 1);
    if (step === 'examples+') settings.exampleCount = Math.min(100, settings.exampleCount + 1);
    if (step === 'window-') settings.mistakeWindow = Math.max(1, settings.mistakeWindow - 1);
    if (step === 'window+') settings.mistakeWindow = Math.min(20, settings.mistakeWindow + 1);
    persist();
    optionsInput.value = settings.optionsCount;
    exampleInput.value = settings.exampleCount;
    windowInput.value = settings.mistakeWindow;
    renderOptionsNote();
    renderMistakesSummary();
  });

  optionsInput.addEventListener('change', function () {
    setNumber('optionsCount', optionsInput, 0, 10);
    renderOptionsNote();
  });

  exampleInput.addEventListener('change', function () {
    setNumber('exampleCount', exampleInput, 1, 100);
  });

  windowInput.addEventListener('change', function () {
    setNumber('mistakeWindow', windowInput, 1, 20);
    renderMistakesSummary();
  });

  focusInput.addEventListener('change', function () {
    settings.focusMistakes = focusInput.checked;
    persist();
  });

  includeOneInput.addEventListener('change', function () {
    settings.includeOne = includeOneInput.checked;
    persist();
  });

  document.getElementById('clear-history').addEventListener('click', function () {
    if (!confirm('Удалить историю тренировок и все сохранённые ошибки?')) return;
    store.clearHistory();
    renderMistakesSummary();
    renderHistory();
  });

  startBtn.addEventListener('click', function () {
    persist();
    window.location.href = 'session.html';
  });

  renderAll();
})();
