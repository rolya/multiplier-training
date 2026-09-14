/* ==========================================================================
   settings-page.js — настройки тренажёра «Словарные слова» (index.html)
   ========================================================================== */

(function () {
  var store = VW.store;
  var core = VW.core;
  var LIMITS = store.LIMITS;
  var settings = store.getSettings();

  var gradeChoices = document.querySelectorAll('#grade-choices .choice');
  var optionsInput = document.getElementById('options-count');
  var wordInput = document.getElementById('word-count');
  var focusInput = document.getElementById('focus-mistakes');
  var windowInput = document.getElementById('mistake-window');
  var spreadNote = document.getElementById('spread-note');
  var mistakesSummary = document.getElementById('mistakes-summary');
  var startBtn = document.getElementById('start-btn');

  // Если в датасете что-то разъехалось, лучше узнать об этом сразу
  var problems = core.validate();
  if (problems.length) console.warn('Словарные слова — проблемы в датасете:', problems);

  /* --- Отрисовка --- */

  function renderGrades() {
    Array.prototype.forEach.call(gradeChoices, function (btn) {
      var active = settings.grades.indexOf(parseInt(btn.dataset.value, 10)) !== -1;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function wordForm(n) {
    var last = n % 10;
    var two = n % 100;
    if (two >= 11 && two <= 14) return 'слов';
    if (last === 1) return 'слово';
    if (last >= 2 && last <= 4) return 'слова';
    return 'слов';
  }

  /** Сколько слов достанется каждому классу — считаем тем же кодом, что и сессия */
  function renderSpread() {
    var counts = core.spread(settings.wordCount, settings.grades.length);
    var parts = settings.grades.map(function (grade, i) {
      return grade + ' класс — ' + counts[i];
    });
    var available = core.count(settings.grades);
    spreadNote.textContent = settings.wordCount + ' ' + wordForm(settings.wordCount) +
      ': ' + parts.join(', ') + '. Всего слов в выбранных классах: ' + available + '.';
  }

  /* Считаем только те ошибки, которые действительно попадут в тренировку при
     выбранных классах — тем же кодом, что и сессия. Иначе в режиме 2 класса
     подпись обещала бы повторить слова 3 класса, которых в тренировке не будет. */
  function renderMistakesSummary() {
    var all = store.getRecentMistakes(settings.mistakeWindow);
    if (!all.length) {
      mistakesSummary.textContent = 'Ошибок пока нет — отлично! 🎉';
      return;
    }

    var mine = core.mistakesInScope(settings.grades, all);
    var other = all.length - mine.length;

    if (!mine.length) {
      mistakesSummary.textContent = 'Сохранённых ошибок: ' + all.length +
        ' — но все они из другого класса, в эту тренировку не попадут.';
      return;
    }

    var preview = mine.slice(0, 6).map(function (item) {
      return item.entry.word;
    }).join(', ');
    mistakesSummary.textContent = 'Слов для повторения: ' + mine.length +
      ' (' + preview + (mine.length > 6 ? '…' : '') + ')' +
      (other > 0 ? '. Ещё ' + other + ' — из другого класса, не попадут.' : '');
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
      var grades = Array.isArray(session.grades) && session.grades.length
        ? ' (' + session.grades.join(' и ') + ' класс)'
        : '';
      var helped = parseInt(session.helped, 10);
      var li = document.createElement('li');
      li.textContent = when + grades + ' — ' + session.correct + ' из ' + session.total +
        ' правильно' + (session.mistakes && session.mistakes.length
          ? ', ошибок: ' + session.mistakes.length
          : ' 🏆') +
        (helped > 0 ? ', с подсказкой: ' + helped + ' 💡' : '');
      list.appendChild(li);
    });
  }

  function renderNumbers() {
    optionsInput.value = settings.optionsCount;
    wordInput.value = settings.wordCount;
    windowInput.value = settings.mistakeWindow;
    focusInput.checked = settings.focusMistakes;
  }

  function renderAll() {
    renderGrades();
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

  Array.prototype.forEach.call(gradeChoices, function (btn) {
    btn.addEventListener('click', function () {
      var grade = parseInt(btn.dataset.value, 10);
      var at = settings.grades.indexOf(grade);
      // Хотя бы один класс должен остаться включённым
      if (at !== -1 && settings.grades.length === 1) return;
      if (at !== -1) settings.grades.splice(at, 1);
      else settings.grades.push(grade);
      persist();
      renderGrades();
      renderSpread();
      renderMistakesSummary();
    });
  });

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.stepper__btn');
    if (!btn) return;
    var step = btn.dataset.step;
    if (step === 'options-') bump('optionsCount', -1);
    if (step === 'options+') bump('optionsCount', 1);
    if (step === 'words-') bump('wordCount', -1);
    if (step === 'words+') bump('wordCount', 1);
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

  wordInput.addEventListener('change', function () {
    setNumber('wordCount', wordInput);
    persist();
    renderSpread();
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
