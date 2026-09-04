/* ==========================================================================
   settings-page.js — настройки тренажёра «Сложение и вычитание» (index.html)
   ========================================================================== */

(function () {
  var store = PM.store;
  var core = PM.core;
  var LIMITS = store.LIMITS;
  var settings = store.getSettings();

  var levelChoices = document.querySelectorAll('#level-choices .choice');
  var optionsInput = document.getElementById('options-count');
  var exampleInput = document.getElementById('example-count');
  var windowInput = document.getElementById('mistake-window');
  var spreadNote = document.getElementById('spread-note');
  var mistakesSummary = document.getElementById('mistakes-summary');
  var startBtn = document.getElementById('start-btn');

  /* --- Отрисовка --- */

  function renderLevels() {
    Array.prototype.forEach.call(levelChoices, function (btn) {
      var active = settings.levels.indexOf(parseInt(btn.dataset.value, 10)) !== -1;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /** Сколько примеров достанется каждому уровню — считаем тем же кодом, что и сессия */
  function renderSpread() {
    var counts = core.spread(settings.exampleCount, settings.levels.length);
    var parts = settings.levels.map(function (level, i) {
      return 'уровень ' + level + ' — ' + counts[i];
    });
    spreadNote.textContent = settings.exampleCount + ' ' +
      (settings.exampleCount === 1 ? 'пример' : 'примеров') + ': ' + parts.join(', ') +
      '. Внутри уровня примеры делятся между сложением и вычитанием.';
  }

  function renderMistakesSummary() {
    var mistakes = store.getRecentMistakes(settings.mistakeWindow);
    if (!mistakes.length) {
      mistakesSummary.textContent = 'Ошибок пока нет — отлично! 🎉';
      return;
    }
    var preview = mistakes.slice(0, 6).map(function (m) {
      return core.text(m);
    }).join(', ');
    mistakesSummary.textContent = 'Ошибок для повторения: ' + mistakes.length +
      ' (' + preview + (mistakes.length > 6 ? '…' : '') + ')';
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
      var levels = Array.isArray(session.levels) && session.levels.length
        ? ' (уровни ' + session.levels.join(', ') + ')'
        : '';
      // helped появился позже — в старых записях его может не быть
      var helped = parseInt(session.helped, 10);
      var li = document.createElement('li');
      li.textContent = when + levels + ' — ' + session.correct + ' из ' + session.total +
        ' правильно' + (session.mistakes && session.mistakes.length
          ? ', ошибок: ' + session.mistakes.length
          : ' 🏆') +
        (helped > 0 ? ', с подсказкой: ' + helped + ' 💡' : '');
      list.appendChild(li);
    });
  }

  function renderNumbers() {
    optionsInput.value = settings.optionsCount;
    exampleInput.value = settings.exampleCount;
    windowInput.value = settings.mistakeWindow;
  }

  function renderAll() {
    renderLevels();
    renderNumbers();
    renderSpread();
    renderMistakesSummary();
    renderHistory();
  }

  /* --- Сохранение --- */

  function persist() {
    settings = store.saveSettings(settings);
  }

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

  /* --- События --- */

  Array.prototype.forEach.call(levelChoices, function (btn) {
    btn.addEventListener('click', function () {
      var level = parseInt(btn.dataset.value, 10);
      var at = settings.levels.indexOf(level);
      // Хотя бы один уровень должен остаться включённым
      if (at !== -1 && settings.levels.length === 1) return;
      if (at !== -1) settings.levels.splice(at, 1);
      else settings.levels.push(level);
      persist();
      renderLevels();
      renderSpread();
    });
  });

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.stepper__btn');
    if (!btn) return;
    var step = btn.dataset.step;
    if (step === 'options-') bump('optionsCount', -1);
    if (step === 'options+') bump('optionsCount', 1);
    if (step === 'examples-') bump('exampleCount', -1);
    if (step === 'examples+') bump('exampleCount', 1);
    if (step === 'window-') bump('mistakeWindow', -1);
    if (step === 'window+') bump('mistakeWindow', 1);
    persist();
    renderNumbers();
    renderSpread();
    renderMistakesSummary();
  });

  optionsInput.addEventListener('change', function () {
    setNumber('optionsCount', optionsInput);
    persist();
  });

  exampleInput.addEventListener('change', function () {
    setNumber('exampleCount', exampleInput);
    persist();
    renderSpread();
  });

  windowInput.addEventListener('change', function () {
    setNumber('mistakeWindow', windowInput);
    persist();
    renderMistakesSummary();
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
