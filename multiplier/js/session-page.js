/* ==========================================================================
   session-page.js — экран тренировки и итогов (session.html)
   ========================================================================== */

(function () {
  var store = MT.store;
  var core = MT.core;

  var settings = store.getSettings();
  var tasks = [];
  var results = [];      // [{ task, wrong: bool }]
  var index = 0;
  var answered = false;  // на текущий пример дан верный ответ

  var el = {
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
    bar: document.getElementById('progress-bar'),
    counter: document.getElementById('counter'),
    question: document.getElementById('question'),
    options: document.getElementById('options'),
    answerBox: document.getElementById('answer-box'),
    answerInput: document.getElementById('answer-input'),
    checkBtn: document.getElementById('check-btn'),
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
      ? store.getRecentMistakes(settings.mistakeWindow)
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

  function renderQuestion(task) {
    function span(text) {
      return text === '?' ? '<span class="blank">?</span>' : text;
    }
    el.question.innerHTML =
      span(task.parts.a) + ' × ' + span(task.parts.b) + ' = ' + span(task.parts.product);
  }

  function renderOptions(task) {
    el.options.innerHTML = '';
    var values = core.buildOptions(task, settings.optionsCount);
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
    el.options.hidden = false;
    el.answerBox.hidden = true;
  }

  function renderInput() {
    el.answerInput.value = '';
    el.answerInput.className = 'answer-input';
    el.answerInput.disabled = false;
    el.checkBtn.disabled = false;
    el.answerBox.hidden = false;
    el.options.hidden = true;
    el.answerInput.focus();
  }

  function showTask() {
    var task = tasks[index];
    answered = false;
    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    el.nextBtn.hidden = true;
    el.nextBtn.textContent = index === tasks.length - 1 ? 'Итоги 🏁' : 'Далее ➡️';

    renderProgress();
    renderQuestion(task);

    if (settings.optionsCount > 0) {
      renderOptions(task);
    } else {
      renderInput();
    }
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

  function onOptionClick(btn, value, task) {
    if (answered || btn.disabled) return;

    if (value === task.answer) {
      btn.classList.add('is-correct', 'pop');
      Array.prototype.forEach.call(el.options.children, function (other) {
        other.disabled = true;
      });
      sayCorrect();
      markSolved();
    } else {
      btn.classList.add('is-wrong', 'shake');
      btn.disabled = true;
      sayWrong();
      markWrongOnce();
    }
  }

  function onCheck() {
    if (answered) return;
    var raw = el.answerInput.value.trim();
    if (raw === '') {
      el.answerInput.classList.remove('is-wrong');
      el.answerInput.classList.add('shake');
      setTimeout(function () { el.answerInput.classList.remove('shake'); }, 400);
      el.answerInput.focus();
      return;
    }
    var value = parseInt(raw, 10);
    var task = tasks[index];

    if (value === task.answer) {
      el.answerInput.className = 'answer-input is-correct pop';
      el.answerInput.disabled = true;
      el.checkBtn.disabled = true;
      sayCorrect();
      markSolved();
    } else {
      el.answerInput.className = 'answer-input is-wrong shake';
      sayWrong();
      markWrongOnce();
      setTimeout(function () {
        el.answerInput.classList.remove('shake');
        el.answerInput.select();
        el.answerInput.focus();
      }, 400);
    }
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
      div.innerHTML = r.task.a + ' × ' + r.task.b + ' = <b>' + r.task.product + '</b>' +
        '<span class="ex__mark">' + (r.wrong ? '✗' : '✓') + '</span>';
      el.resultGrid.appendChild(div);
    });

    el.quiz.hidden = true;
    el.result.hidden = false;
    window.scrollTo(0, 0);
  }

  /* --- Старт ------------------------------------------------------------ */

  el.nextBtn.addEventListener('click', onNext);
  el.checkBtn.addEventListener('click', onCheck);

  el.answerInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onCheck();
    }
  });

  document.addEventListener('keydown', function (event) {
    // На самой кнопке Enter обрабатывает браузер — чтобы не перескочить два примера.
    // В поле ввода Enter — это «Проверить»: переход только следующим нажатием.
    if (event.target === el.nextBtn || event.target === el.answerInput) return;
    if (event.key === 'Enter' && answered && !el.nextBtn.hidden) {
      event.preventDefault();
      onNext();
    }
  });

  // «Начать заново» — возврат на страницу настроек (можно поменять и стартовать снова)
  el.againBtn.addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  createSession();
  if (!tasks.length) {
    el.question.textContent = 'Нет примеров 🤷';
    el.counter.textContent = '';
  } else {
    showTask();
  }
})();
