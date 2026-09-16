/* ==========================================================================
   settings-page.js — настройки тренажёра «Слоўнікавыя словы» (index.html)
   Копия настроек русского тренажёра без выбора класса: беларускія словы
   пока только за 3 класс, поэтому плитки классов на странице нет.
   ========================================================================== */

(function () {
  var store = VW.store;
  var core = VW.core;
  var LIMITS = store.LIMITS;
  var settings = store.getSettings();

  // Плиток классов на странице нет (класс один) — список пустой, циклы по нему молчат
  var gradeChoices = document.querySelectorAll('#grade-choices .choice');
  var quarterChoices = document.getElementById('quarter-choices');
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

  var wordForm = core.wordForm;

  /* Плитки четвертей рисуем из данных, а не из разметки: появится в
     words-data.js список 2 четверти — плитка добавится сама. */
  function buildQuarters() {
    var values = [core.ALL_QUARTERS].concat(core.QUARTERS);
    values.forEach(function (value) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.dataset.value = value;
      btn.setAttribute('aria-pressed', 'false');
      btn.appendChild(document.createTextNode(
        value === core.ALL_QUARTERS ? 'Все четверти' : core.quarterLabel(value)
      ));
      btn.appendChild(document.createElement('small'));
      quarterChoices.appendChild(btn);
    });
  }

  /** Значение четверти, записанное в плитке ('all' или число) */
  function quarterOf(btn) {
    return btn.dataset.value === core.ALL_QUARTERS
      ? core.ALL_QUARTERS
      : parseInt(btn.dataset.value, 10);
  }

  /** Отмечаем выбранную четверть и пишем, сколько в ней слов выбранных классов */
  function renderQuarters() {
    Array.prototype.forEach.call(quarterChoices.children, function (btn) {
      var value = quarterOf(btn);
      btn.setAttribute('aria-pressed', value === settings.quarter ? 'true' : 'false');
      var n = core.count(settings.grades, value);
      btn.querySelector('small').textContent = n ? n + ' ' + wordForm(n) : 'слов нет';
    });
  }

  /**
   * Сколько слов есть для тренировки — считаем тем же кодом, что и сессия.
   * Если в выбранной четверти слов нет, говорим об этом и выключаем «Старт».
   */
  function renderSpread() {
    var available = core.count(settings.grades, settings.quarter);
    var where = settings.quarter === core.ALL_QUARTERS
      ? 'Всего слов'
      : 'Слов в этой четверти (' + core.quarterLabel(settings.quarter).toLowerCase() + ')';

    if (!available) {
      spreadNote.textContent = 'В этой четверти слов пока нет — выбери другую четверть.';
      spreadNote.classList.add('spread--warn');
      startBtn.disabled = true;
      return;
    }

    spreadNote.classList.remove('spread--warn');
    startBtn.disabled = false;

    spreadNote.textContent = 'В тренировке ' + settings.wordCount + ' ' +
      wordForm(settings.wordCount) + '. ' + where + ': ' + available + '.';
  }

  /* Считаем только те ошибки, которые действительно попадут в тренировку при
     выбранной четверти — тем же кодом, что и сессия. Иначе в режиме 2 класса
     подпись обещала бы повторить слова 3 класса, которых в тренировке не будет. */
  function renderMistakesSummary() {
    var all = store.getRecentMistakes(settings.mistakeWindow);
    if (!all.length) {
      mistakesSummary.textContent = 'Ошибок пока нет — отлично! 🎉';
      return;
    }

    var mine = core.mistakesInScope(settings.grades, all, settings.quarter);
    var other = all.length - mine.length;

    if (!mine.length) {
      mistakesSummary.textContent = 'Сохранённых ошибок: ' + all.length +
        ' — но все они из другой четверти, в эту тренировку не попадут.';
      return;
    }

    var preview = mine.slice(0, 6).map(function (item) {
      return item.entry.word;
    }).join(', ');
    mistakesSummary.textContent = 'Слов для повторения: ' + mine.length +
      ' (' + preview + (mine.length > 6 ? '…' : '') + ')' +
      (other > 0 ? '. Ещё ' + other + ' — из другой четверти, не попадут.' : '');
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
      var grades = '';   // класс один, в истории его не пишем
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
    renderQuarters();
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
      renderQuarters();
      renderSpread();
      renderMistakesSummary();
    });
  });

  // Четверть всегда одна: клик по плитке просто переключает выбор
  quarterChoices.addEventListener('click', function (event) {
    var btn = event.target.closest('.choice');
    if (!btn) return;
    settings.quarter = quarterOf(btn);
    persist();
    renderQuarters();
    renderSpread();
    renderMistakesSummary();
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

  buildQuarters();
  renderAll();
})();
