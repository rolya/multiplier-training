/* ==========================================================================
   settings-page.js — страница настроек тренажёра «Состав числа» (index.html)
   ========================================================================== */

(function () {
  var store = NC.store;
  var LIMITS = store.LIMITS;
  var settings = store.getSettings();

  var levelChoices = document.querySelectorAll('#level-choices .choice');
  var minInput = document.getElementById('range-min');
  var maxInput = document.getElementById('range-max');
  var rangeNote = document.getElementById('range-note');
  var optionsInput = document.getElementById('options-count');
  var exampleInput = document.getElementById('example-count');
  var focusInput = document.getElementById('focus-mistakes');
  var windowInput = document.getElementById('mistake-window');
  var mistakesSummary = document.getElementById('mistakes-summary');
  var startBtn = document.getElementById('start-btn');

  /* --- Отрисовка --- */

  function renderLevel() {
    Array.prototype.forEach.call(levelChoices, function (btn) {
      var active = parseInt(btn.dataset.value, 10) === settings.level;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderRange() {
    minInput.value = settings.rangeMin;
    maxInput.value = settings.rangeMax;
    var count = settings.rangeMax - settings.rangeMin + 1;
    var list = [];
    for (var n = settings.rangeMin; n <= settings.rangeMax && list.length < 4; n++) {
      list.push(n);
    }
    var preview = count > 4
      ? list.slice(0, 3).join(', ') + ', … ' + settings.rangeMax
      : list.join(', ');
    rangeNote.textContent = count === 1
      ? 'Тренируем состав числа ' + settings.rangeMin
      : 'Тренируем состав чисел: ' + preview + ' — всего ' + count;
  }

  function renderMistakesSummary() {
    var mistakes = store.getRecentMistakes(settings.mistakeWindow,
      settings.rangeMin, settings.rangeMax);
    if (!mistakes.length) {
      mistakesSummary.textContent =
        'Ошибок для этого диапазона пока нет — отлично! 🎉';
      return;
    }
    var preview = mistakes.slice(0, 8).map(function (m) {
      return m.a + '+' + m.b;
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
      // В старых записях диапазон был одним числом (только «до»)
      var from = session.rangeMin;
      var to = session.rangeMax === undefined ? session.range : session.rangeMax;
      var extra = to ? ' (состав ' + (from || 2) + '…' + to + ')' : '';
      var li = document.createElement('li');
      li.textContent = when + extra + ' — ' + session.correct + ' из ' + session.total +
        ' правильно' + (session.mistakes && session.mistakes.length
          ? ', ошибок: ' + session.mistakes.length
          : ' 🏆');
      list.appendChild(li);
    });
  }

  function renderAll() {
    renderLevel();
    renderRange();
    optionsInput.value = settings.optionsCount;
    exampleInput.value = settings.exampleCount;
    focusInput.checked = settings.focusMistakes;
    windowInput.value = settings.mistakeWindow;
    renderMistakesSummary();
    renderHistory();
  }

  /* --- Сохранение --- */

  function persist() {
    settings = store.saveSettings(settings);
  }

  // Только читает поле и приводит к допустимым границам; persist() — за вызывающим,
  // иначе normalize() успеет поменять границы диапазона местами (см. alignRange).
  function setNumber(field, input) {
    var n = parseInt(input.value, 10);
    if (isNaN(n)) n = store.DEFAULTS[field];
    settings[field] = Math.min(LIMITS[field].max, Math.max(LIMITS[field].min, n));
    input.value = settings[field];
  }

  function bump(field, delta) {
    settings[field] = Math.min(LIMITS[field].max,
      Math.max(LIMITS[field].min, settings[field] + delta));
  }

  /* «с» не может быть больше «до» — вторая граница подтягивается к изменённой */
  function alignRange(moved) {
    if (settings.rangeMin <= settings.rangeMax) return;
    if (moved === 'rangeMin') settings.rangeMax = settings.rangeMin;
    else settings.rangeMin = settings.rangeMax;
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
    if (step === 'min-') { bump('rangeMin', -1); alignRange('rangeMin'); }
    if (step === 'min+') { bump('rangeMin', 1); alignRange('rangeMin'); }
    if (step === 'max-') { bump('rangeMax', -1); alignRange('rangeMax'); }
    if (step === 'max+') { bump('rangeMax', 1); alignRange('rangeMax'); }
    if (step === 'options-') bump('optionsCount', -1);
    if (step === 'options+') bump('optionsCount', 1);
    if (step === 'examples-') bump('exampleCount', -1);
    if (step === 'examples+') bump('exampleCount', 1);
    if (step === 'window-') bump('mistakeWindow', -1);
    if (step === 'window+') bump('mistakeWindow', 1);
    persist();
    renderRange();
    optionsInput.value = settings.optionsCount;
    exampleInput.value = settings.exampleCount;
    windowInput.value = settings.mistakeWindow;
    renderMistakesSummary();
  });

  minInput.addEventListener('change', function () {
    setNumber('rangeMin', minInput);
    alignRange('rangeMin');
    persist();
    renderRange();
    renderMistakesSummary();
  });

  maxInput.addEventListener('change', function () {
    setNumber('rangeMax', maxInput);
    alignRange('rangeMax');
    persist();
    renderRange();
    renderMistakesSummary();
  });

  optionsInput.addEventListener('change', function () {
    setNumber('optionsCount', optionsInput);
    persist();
  });

  exampleInput.addEventListener('change', function () {
    setNumber('exampleCount', exampleInput);
    persist();
  });

  windowInput.addEventListener('change', function () {
    setNumber('mistakeWindow', windowInput);
    persist();
    renderMistakesSummary();
  });

  focusInput.addEventListener('change', function () {
    settings.focusMistakes = focusInput.checked;
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
