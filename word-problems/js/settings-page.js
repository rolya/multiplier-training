/* ==========================================================================
   settings-page.js — настройки тренажёра «Задачи на умножение и деление»
   ========================================================================== */

(function () {
  var store = WP.store;
  var core = WP.core;
  var LIMITS = store.LIMITS;
  var settings = store.getSettings();

  var levelInput = document.getElementById('max-number');
  var exampleInput = document.getElementById('example-count');
  var windowInput = document.getElementById('mistake-window');
  var levelNote = document.getElementById('level-note');
  var mistakesSummary = document.getElementById('mistakes-summary');

  // Уровень на кнопках меняется пятёрками, вручную можно ввести любое число
  var LEVEL_STEP = 5;

  /* --- Отрисовка --- */

  /**
   * Сколько разных задач доступно на уровне — и пример: первая задача набора
   * с самыми большими числами, какие допускает уровень
   */
  function renderLevelNote() {
    var pool = core.available(settings.maxNumber);
    var text = 'Разных задач на этом уровне: ' + pool.length + ' из ' + WP.PROBLEMS.length + '.';
    if (pool.length) {
      var top = core.pairs(pool[0], settings.maxNumber).reduce(function (best, pair) {
        return pair.x * pair.y > best.x * best.y ? pair : best;
      });
      text += ' Например: «' + core.build(pool[0], top.x, top.y).text + '»';
    }
    levelNote.textContent = text;
  }

  function renderMistakesSummary() {
    var mistakes = store.getRecentMistakes(settings.mistakeWindow);
    mistakesSummary.textContent = mistakes.length
      ? 'Задач с ошибками для повторения: ' + mistakes.length
      : 'Ошибок пока нет — отлично! 🎉';
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
      var level = session.maxNumber ? ' (до ' + session.maxNumber + ')' : '';
      var helped = parseInt(session.helped, 10);
      var li = document.createElement('li');
      li.textContent = when + level + ' — ' + session.correct + ' из ' + session.total +
        ' правильно' + (session.mistakes && session.mistakes.length
          ? ', ошибок: ' + session.mistakes.length
          : ' 🏆') +
        (helped > 0 ? ', с подсказкой: ' + helped + ' 💡' : '');
      list.appendChild(li);
    });
  }

  function renderNumbers() {
    levelInput.value = settings.maxNumber;
    exampleInput.value = settings.exampleCount;
    windowInput.value = settings.mistakeWindow;
  }

  function renderAll() {
    renderNumbers();
    renderLevelNote();
    renderMistakesSummary();
    renderHistory();
  }

  /* --- Сохранение --- */

  function persist() {
    settings = store.saveSettings(settings);
  }

  function clamp(field, n) {
    return Math.min(LIMITS[field].max, Math.max(LIMITS[field].min, n));
  }

  function setNumber(field, input) {
    var n = parseInt(input.value, 10);
    settings[field] = isNaN(n) ? store.DEFAULTS[field] : clamp(field, n);
    input.value = settings[field];
  }

  function bump(field, delta) {
    settings[field] = clamp(field, settings[field] + delta);
  }

  /** Уровень пятёрками: с 23 вверх — 25, вниз — 20 */
  function bumpLevel(dir) {
    var n = settings.maxNumber;
    var next = dir > 0
      ? Math.floor(n / LEVEL_STEP) * LEVEL_STEP + LEVEL_STEP
      : Math.ceil(n / LEVEL_STEP) * LEVEL_STEP - LEVEL_STEP;
    settings.maxNumber = clamp('maxNumber', next);
  }

  /* --- События --- */

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.stepper__btn');
    if (!btn) return;
    var step = btn.dataset.step;
    if (step === 'level-') bumpLevel(-1);
    if (step === 'level+') bumpLevel(1);
    if (step === 'examples-') bump('exampleCount', -1);
    if (step === 'examples+') bump('exampleCount', 1);
    if (step === 'window-') bump('mistakeWindow', -1);
    if (step === 'window+') bump('mistakeWindow', 1);
    persist();
    renderNumbers();
    renderLevelNote();
    renderMistakesSummary();
  });

  levelInput.addEventListener('change', function () {
    setNumber('maxNumber', levelInput);
    persist();
    renderLevelNote();
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

  document.getElementById('clear-history').addEventListener('click', function () {
    if (!confirm('Удалить историю тренировок и все сохранённые ошибки?')) return;
    store.clearHistory();
    renderMistakesSummary();
    renderHistory();
  });

  document.getElementById('start-btn').addEventListener('click', function () {
    persist();
    window.location.href = 'session.html';
  });

  renderAll();
})();
