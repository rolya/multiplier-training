/* ==========================================================================
   session-page.js — экран тренировки и итогов «Состав числа» (session.html)
   ========================================================================== */

(function () {
  var store = NC.store;
  var core = NC.core;

  var settings = store.getSettings();
  var tasks = [];
  var results = [];      // [{ task, wrong: bool }]
  var index = 0;
  var answered = false;  // на текущий пример дан верный ответ
  var locked = false;    // короткая пауза после неверной комбинации
  var chosen = [];       // выбранные значения — по порядку пропусков
  var chosenBtns = [];

  var el = {
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
    bar: document.getElementById('progress-bar'),
    counter: document.getElementById('counter'),
    question: document.getElementById('question'),
    hint: document.getElementById('hint-line'),
    options: document.getElementById('options'),
    feedback: document.getElementById('feedback'),
    nextBtn: document.getElementById('next-btn'),
    resultEmoji: document.getElementById('result-emoji'),
    resultScore: document.getElementById('result-score'),
    resultText: document.getElementById('result-text'),
    resultGrid: document.getElementById('result-grid'),
    againBtn: document.getElementById('again-btn')
  };

  var PRAISE = ['Молодец! 🎉', 'Верно! ⭐', 'Точно! 👍', 'Супер! 🚀', 'Правильно! 🍭'];
  var RETRY = ['Ой, попробуй ещё 🤔', 'Не то… ещё раз! 💪', 'Почти! Подумай ещё 🙂'];

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /* --- Создание сессии ------------------------------------------------- */

  function createSession() {
    var mistakes = settings.focusMistakes
      ? store.getRecentMistakes(settings.mistakeWindow, settings.rangeMin, settings.rangeMax)
      : [];
    var examples = core.buildSessionExamples(settings, mistakes);
    tasks = examples.map(function (example) {
      return core.buildTask(example, settings.level);
    });
    results = [];
    index = 0;
  }

  /* --- Отрисовка примера ----------------------------------------------- */

  function renderProgress() {
    el.counter.textContent = 'Пример ' + (index + 1) + ' из ' + tasks.length;
    el.bar.style.width = (index / tasks.length * 100) + '%';
  }

  /** Пример с пропусками; уже выбранные числа подставляем на свои места */
  function renderQuestion(task) {
    var show = { a: String(task.a), b: String(task.b), sum: String(task.sum) };
    task.blanks.forEach(function (slot, i) {
      show[slot] = chosen[i] === undefined
        ? '<span class="blank">?</span>'
        : '<span class="blank blank--filled">' + chosen[i] + '</span>';
    });
    el.question.innerHTML = show.a + ' + ' + show.b + ' = ' + show.sum;
  }

  function renderHint(task) {
    if (answered) {
      el.hint.textContent = '';
      return;
    }
    el.hint.textContent = task.blanks.length > 1
      ? 'Выбери два числа — по порядку, слева направо'
      : 'Выбери число';
  }

  function renderOptions(task) {
    el.options.innerHTML = '';
    var values = core.buildOptions(task, settings.optionsCount, settings.rangeMax);
    values.forEach(function (value) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.textContent = value;
      btn.dataset.value = value;
      btn.addEventListener('click', function () {
        onOptionClick(btn, value, task);
      });
      el.options.appendChild(btn);
    });
  }

  function showTask() {
    var task = tasks[index];
    answered = false;
    locked = false;
    chosen = [];
    chosenBtns = [];
    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    el.nextBtn.hidden = true;
    el.nextBtn.textContent = index === tasks.length - 1 ? 'Итоги 🏁' : 'Далее ➡️';

    renderProgress();
    renderQuestion(task);
    renderHint(task);
    renderOptions(task);
  }

  /* --- Ответы ----------------------------------------------------------- */

  function markWrongOnce() {
    if (!results[index]) results[index] = { task: tasks[index], wrong: false };
    results[index].wrong = true;
  }

  function markSolved() {
    if (!results[index]) results[index] = { task: tasks[index], wrong: false };
    answered = true;
    el.nextBtn.hidden = false;
    el.nextBtn.focus();
  }

  function sayCorrect() {
    el.feedback.textContent = pick(PRAISE);
    el.feedback.className = 'feedback feedback--ok';
  }

  function sayWrong() {
    el.feedback.textContent = pick(RETRY);
    el.feedback.className = 'feedback feedback--no';
  }

  /** Снять выделение с выбранных кнопок (после неверной комбинации) */
  function resetSelection(task) {
    chosenBtns.forEach(function (btn) {
      btn.classList.remove('is-selected', 'is-wrong', 'shake');
    });
    chosen = [];
    chosenBtns = [];
    renderQuestion(task);
  }

  function onOptionClick(btn, value, task) {
    if (answered || locked || btn.disabled) return;

    // Повторный клик по выбранной кнопке — отменить выбор
    var at = chosenBtns.indexOf(btn);
    if (at !== -1) {
      chosenBtns.splice(at, 1);
      chosen.splice(at, 1);
      btn.classList.remove('is-selected');
      renderQuestion(task);
      return;
    }

    if (chosen.length >= task.blanks.length) return;

    chosen.push(value);
    chosenBtns.push(btn);
    btn.classList.add('is-selected');
    renderQuestion(task);

    if (chosen.length < task.blanks.length) return;   // ждём второе число
    evaluate(task);
  }

  function evaluate(task) {
    if (core.checkAnswer(task, chosen)) {
      chosenBtns.forEach(function (b) {
        b.classList.remove('is-selected');
        b.classList.add('is-correct', 'pop');
      });
      Array.prototype.forEach.call(el.options.children, function (other) {
        other.disabled = true;
      });
      sayCorrect();
      markSolved();
      renderHint(task);
      return;
    }

    chosenBtns.forEach(function (b) {
      b.classList.remove('is-selected');
      b.classList.add('is-wrong', 'shake');
    });
    sayWrong();
    markWrongOnce();

    if (task.blanks.length === 1) {
      // Один пропуск — как в тренажёре умножения: неверный вариант выключаем
      chosenBtns.forEach(function (b) { b.disabled = true; });
      chosen = [];
      chosenBtns = [];
      renderQuestion(task);
      return;
    }

    // Два пропуска — комбинация целиком неверна, даём выбрать заново
    locked = true;
    setTimeout(function () {
      locked = false;
      resetSelection(task);
    }, 900);
  }

  function onNext() {
    if (!answered) return;
    if (index >= tasks.length - 1) {
      finish();
      return;
    }
    index++;
    showTask();
  }

  /* --- Итоги ------------------------------------------------------------ */

  function finish() {
    var total = tasks.length;
    var wrongList = results.filter(function (r) { return r && r.wrong; });
    var correct = total - wrongList.length;

    store.saveSession({
      total: total,
      correct: correct,
      level: settings.level,
      rangeMin: settings.rangeMin,
      rangeMax: settings.rangeMax,
      mistakes: wrongList.map(function (r) {
        return { a: r.task.a, b: r.task.b };
      })
    });

    el.bar.style.width = '100%';
    el.resultScore.innerHTML = correct + '<span class="score__of"> / ' + total + '</span>';

    var ratio = total ? correct / total : 0;
    if (ratio === 1) {
      el.resultEmoji.textContent = '🏆';
      el.resultText.textContent = 'Идеально! Ни одной ошибки!';
    } else if (ratio >= 0.8) {
      el.resultEmoji.textContent = '🌟';
      el.resultText.textContent = 'Очень здорово! Осталось совсем чуть-чуть.';
    } else if (ratio >= 0.5) {
      el.resultEmoji.textContent = '💪';
      el.resultText.textContent = 'Хорошая работа! Повторим примеры с ошибками.';
    } else {
      el.resultEmoji.textContent = '🤗';
      el.resultText.textContent = 'Ничего страшного — потренируемся ещё, и всё получится!';
    }

    el.resultGrid.innerHTML = '';
    results.forEach(function (r) {
      if (!r) return;
      var div = document.createElement('div');
      div.className = 'ex ' + (r.wrong ? 'ex--no' : 'ex--ok');
      div.innerHTML = r.task.a + ' + ' + r.task.b + ' = <b>' + r.task.sum + '</b>' +
        '<span class="ex__mark">' + (r.wrong ? '✗' : '✓') + '</span>';
      el.resultGrid.appendChild(div);
    });

    el.quiz.hidden = true;
    el.result.hidden = false;
    window.scrollTo(0, 0);
  }

  /* --- Старт ------------------------------------------------------------ */

  el.nextBtn.addEventListener('click', onNext);

  document.addEventListener('keydown', function (event) {
    // На самой кнопке Enter обрабатывает браузер — чтобы не перескочить два примера
    if (event.target === el.nextBtn) return;
    if (event.key === 'Enter' && answered && !el.nextBtn.hidden) {
      event.preventDefault();
      onNext();
    }
  });

  // «Начать заново» — возврат на страницу настроек
  el.againBtn.addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  createSession();
  if (!tasks.length) {
    el.question.textContent = 'Нет примеров 🤷';
    el.counter.textContent = '';
    el.hint.textContent = 'Увеличь диапазон в настройках.';
  } else {
    showTask();
  }
})();
