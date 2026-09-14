/* ==========================================================================
   settings-page.js — настройки тренажёра «Безударные гласные» (index.html)
   ========================================================================== */

(function () {
  var store = UV.store;
  var core = UV.core;
  var LIMITS = store.LIMITS;
  var settings = store.getSettings();

  var taskInput = document.getElementById('task-count');
  var focusInput = document.getElementById('focus-mistakes');
  var windowInput = document.getElementById('mistake-window');
  var poolNote = document.getElementById('pool-note');
  var mistakesSummary = document.getElementById('mistakes-summary');
  var ruleSource = document.getElementById('rule-source');
  var startBtn = document.getElementById('start-btn');

  // Если в датасете что-то разъехалось, лучше узнать об этом сразу
  var problems = core.validate();
  if (problems.length) console.warn('Безударные гласные — проблемы в датасете:', problems);

  /* --- Отрисовка --- */

  function wordForm(n, one, few, many) {
    var last = n % 10;
    var two = n % 100;
    if (two >= 11 && two <= 14) return many;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
  }

  function renderPool() {
    poolNote.textContent = 'Всего в тренажёре ' + core.count() +
      ' ' + wordForm(core.count(), 'задание', 'задания', 'заданий') +
      ' — хватит надолго, слова каждый раз разные.';
  }

  /* Считаем ошибки тем же кодом, что и сессия: подпись обещает ровно то,
     что попадёт в тренировку. */
  function renderMistakesSummary() {
    var all = store.getRecentMistakes(settings.mistakeWindow);
    if (!all.length) {
      mistakesSummary.textContent = 'Ошибок пока нет — отлично! 🎉';
      return;
    }

    var mine = core.mistakesInScope(all);
    if (!mine.length) {
      mistakesSummary.textContent = 'Сохранённых ошибок: ' + all.length +
        ' — но таких заданий в тренажёре больше нет.';
      return;
    }

    var preview = mine.slice(0, 6).map(function (entry) {
      return core.wordOf(entry.item);
    }).join(', ');
    mistakesSummary.textContent = 'Слов для повторения: ' + mine.length +
      ' (' + preview + (mine.length > 6 ? '…' : '') + ')';
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
      var helped = parseInt(session.helped, 10);
      var li = document.createElement('li');
      li.textContent = when + ' — ' + session.correct + ' из ' + session.total +
        ' правильно' + (session.mistakes && session.mistakes.length
          ? ', ошибок: ' + session.mistakes.length
          : ' 🏆') +
        (helped > 0 ? ', с проверочными словами: ' + helped + ' 💡' : '');
      list.appendChild(li);
    });
  }

  function renderNumbers() {
    taskInput.value = settings.taskCount;
    windowInput.value = settings.mistakeWindow;
    focusInput.checked = settings.focusMistakes;
  }

  function renderAll() {
    ruleSource.textContent = core.SOURCE;
    renderNumbers();
    renderPool();
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

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.stepper__btn');
    if (!btn) return;
    var step = btn.dataset.step;
    if (step === 'tasks-') bump('taskCount', -1);
    if (step === 'tasks+') bump('taskCount', 1);
    if (step === 'window-') bump('mistakeWindow', -1);
    if (step === 'window+') bump('mistakeWindow', 1);
    persist();
    renderNumbers();
    renderMistakesSummary();
  });

  taskInput.addEventListener('change', function () {
    setNumber('taskCount', taskInput);
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
