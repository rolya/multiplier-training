/* ==========================================================================
   session-page.js — тренировка и итоги «Безударные гласные» (session.html)

   В слове один пропуск: ребёнок выбирает букву кнопкой. Неверная буква —
   красная и выключается, можно выбрать другую. Слово считается ошибкой,
   если была хотя бы одна неверная попытка.

   Подсказок две:
     «💡 Как проверить»       — способы проверки (изменить форму, назвать
                                ласково…), сами проверочные слова не показывает;
     «🆘 Проверочные слова»   — проверочные слова с частью речи и способом
                                образования. Открытое до ответа — считается
                                подсказкой (оранжевая карточка в итогах).
   После верного ответа проверочные слова открываются сами — это уже не
   подсказка, а разбор.
   ========================================================================== */

(function () {
  var store = UV.store;
  var core = UV.core;

  var settings = store.getSettings();
  var tasks = [];
  var results = [];      // [{ task, wrong: bool, helped: bool }]
  var index = 0;
  var chosen = null;     // выбранная буква
  var answered = false;

  var el = {
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
    bar: document.getElementById('progress-bar'),
    counter: document.getElementById('counter'),
    word: document.getElementById('word'),
    wordHint: document.getElementById('word-hint'),
    options: document.getElementById('options'),
    feedback: document.getElementById('feedback'),
    helpRow: document.querySelector('.help-row'),
    wayBtn: document.getElementById('way-btn'),
    checkBtn: document.getElementById('check-btn'),
    helpWays: document.getElementById('help-ways'),
    waysList: document.getElementById('ways-list'),
    helpCheck: document.getElementById('help-check'),
    checkLead: document.getElementById('check-lead'),
    checksList: document.getElementById('checks-list'),
    nextBtn: document.getElementById('next-btn'),
    resultEmoji: document.getElementById('result-emoji'),
    resultScore: document.getElementById('result-score'),
    resultText: document.getElementById('result-text'),
    resultGrid: document.getElementById('result-grid'),
    againBtn: document.getElementById('again-btn')
  };

  var PRAISE = ['Молодец! 🎉', 'Верно! ⭐', 'Точно! 👍', 'Супер! 🚀', 'Правильно! 🍭'];
  var RETRY = ['Ой, попробуй ещё 🤔', 'Не та буква… ещё раз! 💪', 'Почти! Подумай ещё 🙂'];

  var LEAD_HELP = 'Вот проверочные слова — выбери подходящее и услышь нужную букву:';
  var LEAD_DONE = 'Проверь себя — вот как это слово проверяют:';

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /* --- Отрисовка задания ------------------------------------------------ */

  function renderProgress() {
    el.counter.textContent = 'Слово ' + (index + 1) + ' из ' + tasks.length;
    el.bar.style.width = (index / tasks.length * 100) + '%';
  }

  function renderWord(task) {
    el.word.innerHTML = '';
    el.word.appendChild(document.createTextNode(task.before));

    var gap = document.createElement('span');
    gap.className = 'gap' + (chosen === null ? '' : ' gap--filled');
    gap.textContent = chosen === null ? '?' : chosen;
    el.word.appendChild(gap);

    el.word.appendChild(document.createTextNode(task.after));
  }

  function renderOptions(task) {
    el.options.innerHTML = '';
    core.optionsFor(task).forEach(function (value) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.textContent = value;
      btn.addEventListener('click', function () { onLetterClick(btn, value, task); });
      el.options.appendChild(btn);
    });
  }

  /** Проверочное слово: ударный гласный подсвечен красным */
  function checkWordNode(check) {
    var span = document.createElement('span');
    span.className = 'check__word';
    if (check.stressAt >= 0) {
      span.appendChild(document.createTextNode(check.word.slice(0, check.stressAt)));
      var mark = document.createElement('span');
      mark.className = 'stress';
      mark.textContent = check.word.charAt(check.stressAt);
      span.appendChild(mark);
      span.appendChild(document.createTextNode(check.word.slice(check.stressAt + 1)));
    } else {
      span.textContent = check.word;
    }
    return span;
  }

  function renderWays(task) {
    el.waysList.innerHTML = '';
    task.ways.forEach(function (code) {
      var way = core.wayInfo(code);
      var li = document.createElement('li');
      li.className = 'way';

      var emoji = document.createElement('span');
      emoji.className = 'way__emoji';
      emoji.textContent = way.emoji;

      var text = document.createElement('span');
      text.appendChild(document.createTextNode(way.action));
      var name = document.createElement('span');
      name.className = 'way__name';
      name.textContent = way.name;
      text.appendChild(name);

      li.appendChild(emoji);
      li.appendChild(text);
      el.waysList.appendChild(li);
    });
  }

  function renderChecks(task) {
    el.checksList.innerHTML = '';
    task.check.forEach(function (check) {
      var li = document.createElement('li');
      li.className = 'check';
      li.appendChild(checkWordNode(check));

      var about = document.createElement('span');
      about.className = 'check__about';
      about.textContent = check.pos + ' · ' + check.way;
      li.appendChild(about);

      el.checksList.appendChild(li);
    });
  }

  function hideHelp() {
    el.helpWays.hidden = true;
    el.helpCheck.hidden = true;
    el.wayBtn.textContent = '💡 Как проверить';
    el.checkBtn.textContent = '🆘 Проверочные слова';
  }

  function showTask() {
    var task = tasks[index];
    answered = false;
    chosen = null;
    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    el.nextBtn.hidden = true;
    el.nextBtn.textContent = index === tasks.length - 1 ? 'Итоги 🏁' : 'Далее ➡️';
    el.helpRow.hidden = false;
    el.checkLead.textContent = LEAD_HELP;
    hideHelp();

    renderProgress();
    renderWord(task);
    el.wordHint.textContent = task.hint;
    renderOptions(task);
    renderWays(task);
    renderChecks(task);
  }

  /* --- Ответы ----------------------------------------------------------- */

  function ensureResult() {
    if (!results[index]) {
      results[index] = { task: tasks[index], wrong: false, helped: false };
    }
    return results[index];
  }

  function onLetterClick(btn, value, task) {
    if (answered || btn.disabled) return;

    if (!core.isCorrect(task, value)) {
      btn.classList.add('is-wrong', 'shake');
      btn.disabled = true;
      el.feedback.textContent = pick(RETRY);
      el.feedback.className = 'feedback feedback--no';
      ensureResult().wrong = true;
      return;
    }

    answered = true;
    chosen = value;
    ensureResult();

    btn.classList.add('is-correct', 'pop');
    Array.prototype.forEach.call(el.options.children, function (other) {
      other.disabled = true;
    });

    renderWord(task);
    el.feedback.textContent = pick(PRAISE);
    el.feedback.className = 'feedback feedback--ok';
    el.wordHint.textContent = 'Прочитай слово вслух вместе с проверочным 🔊';

    // Разбор после ответа: проверочные слова открываются сами
    el.helpRow.hidden = true;
    el.helpWays.hidden = true;
    el.checkLead.textContent = LEAD_DONE;
    el.helpCheck.hidden = false;

    el.nextBtn.hidden = false;
    el.nextBtn.focus();
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
    var helpedList = results.filter(function (r) { return r && r.helped; });
    var correct = total - wrongList.length;

    store.saveSession({
      total: total,
      correct: correct,
      helped: helpedList.length,
      mistakes: wrongList.map(function (r) {
        return { id: r.task.id, word: r.task.word };
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
      el.resultText.textContent = 'Хорошая работа! Разберём слова с ошибками.';
    } else {
      el.resultEmoji.textContent = '🤗';
      el.resultText.textContent = 'Ничего страшного — потренируемся ещё, и всё получится!';
    }

    el.resultGrid.innerHTML = '';
    results.forEach(function (r) {
      if (!r) return;
      // Красный — были ошибки, оранжевый — верно, но смотрел проверочные слова
      var kind = r.wrong ? 'ex--no' : (r.helped ? 'ex--help' : 'ex--ok');
      var mark = r.wrong ? '✗' : (r.helped ? '✓ 💡' : '✓');

      var div = document.createElement('div');
      div.className = 'ex';
      div.classList.add(kind);

      var word = document.createElement('b');
      word.textContent = r.task.word;
      div.appendChild(word);

      var sign = document.createElement('span');
      sign.className = 'ex__mark';
      sign.textContent = mark;
      div.appendChild(sign);

      var check = r.task.check[0];
      if (check) {
        var about = document.createElement('span');
        about.className = 'ex__check';
        about.textContent = 'проверь: ' + check.word;
        div.appendChild(about);
      }

      el.resultGrid.appendChild(div);
    });

    el.quiz.hidden = true;
    el.result.hidden = false;
    window.scrollTo(0, 0);
  }

  /* --- Старт ------------------------------------------------------------ */

  el.nextBtn.addEventListener('click', onNext);

  el.wayBtn.addEventListener('click', function () {
    el.helpWays.hidden = !el.helpWays.hidden;
    el.wayBtn.textContent = el.helpWays.hidden ? '💡 Как проверить' : '🙈 Спрятать способы';
  });

  el.checkBtn.addEventListener('click', function () {
    el.helpCheck.hidden = !el.helpCheck.hidden;
    el.checkBtn.textContent = el.helpCheck.hidden
      ? '🆘 Проверочные слова'
      : '🙈 Спрятать проверочные';
    // Одно слово — одна отметка, сколько раз ни открывай и ни закрывай подсказку
    if (!el.helpCheck.hidden) ensureResult().helped = true;
  });

  document.addEventListener('keydown', function (event) {
    // На самой кнопке Enter обрабатывает браузер — чтобы не перескочить два слова
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

  tasks = core.buildSession(settings, store.getRecentMistakes(settings.mistakeWindow));
  if (!tasks.length) {
    el.word.textContent = 'Нет заданий 🤷';
    el.counter.textContent = '';
    el.wordHint.textContent = 'Проверь настройки тренировки.';
    el.helpRow.hidden = true;
  } else {
    showTask();
  }
})();
