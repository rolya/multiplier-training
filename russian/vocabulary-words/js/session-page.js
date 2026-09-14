/* ==========================================================================
   session-page.js — тренировка и итоги «Словарные слова» (session.html)

   Слово заполняется по пропускам слева направо: для каждого пропуска свои
   буквы на выбор. Неверная буква — красная и выключается, можно выбрать
   другую. Слово считается ошибкой, если хотя бы в одном пропуске был промах.
   ========================================================================== */

(function () {
  var store = VW.store;
  var core = VW.core;

  var settings = store.getSettings();
  var tasks = [];
  var results = [];      // [{ task, wrong: bool, helped: bool }]
  var index = 0;
  var gapIndex = 0;      // какой пропуск заполняем сейчас
  var chosen = [];       // буквы, уже поставленные в пропуски
  var answered = false;  // слово собрано полностью
  var locked = false;    // короткая пауза между пропусками

  var el = {
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
    bar: document.getElementById('progress-bar'),
    counter: document.getElementById('counter'),
    word: document.getElementById('word'),
    wordHint: document.getElementById('word-hint'),
    options: document.getElementById('options'),
    feedback: document.getElementById('feedback'),
    helpBtn: document.getElementById('help-btn'),
    help: document.getElementById('help'),
    helpWord: document.getElementById('help-word'),
    nextBtn: document.getElementById('next-btn'),
    resultEmoji: document.getElementById('result-emoji'),
    resultScore: document.getElementById('result-score'),
    resultText: document.getElementById('result-text'),
    resultGrid: document.getElementById('result-grid'),
    againBtn: document.getElementById('again-btn')
  };

  var PRAISE = ['Молодец! 🎉', 'Верно! ⭐', 'Точно! 👍', 'Супер! 🚀', 'Правильно! 🍭'];
  var RETRY = ['Ой, попробуй ещё 🤔', 'Не та буква… ещё раз! 💪', 'Почти! Подумай ещё 🙂'];

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /* --- Отрисовка слова -------------------------------------------------- */

  function renderProgress() {
    el.counter.textContent = 'Слово ' + (index + 1) + ' из ' + tasks.length;
    el.bar.style.width = (index / tasks.length * 100) + '%';
  }

  /** Буква в пропуске: пустой вариант («нет буквы») показываем как прочерк */
  function gapSpan(text, extraClass) {
    var span = document.createElement('span');
    span.className = 'gap' + (extraClass ? ' ' + extraClass : '');
    span.textContent = text;
    return span;
  }

  function renderWord(task) {
    el.word.innerHTML = '';
    el.word.appendChild(document.createTextNode(task.chunks[0]));

    for (var i = 1; i < task.chunks.length; i++) {
      var at = i - 1;
      if (chosen[at] !== undefined) {
        el.word.appendChild(gapSpan(chosen[at] === '' ? '' : chosen[at], 'gap--filled'));
      } else if (at === gapIndex && !answered) {
        el.word.appendChild(gapSpan('?', 'gap--now'));
      } else {
        el.word.appendChild(gapSpan('?', ''));
      }
      el.word.appendChild(document.createTextNode(task.chunks[i]));
    }

    var tag = document.createElement('span');
    tag.className = 'grade-tag';
    tag.textContent = task.grade + ' кл.';
    el.word.appendChild(document.createTextNode(' '));
    el.word.appendChild(tag);
  }

  function renderHint(task) {
    if (answered) {
      el.wordHint.textContent = 'Прочитай слово вслух целиком 🔊';
      return;
    }
    var total = task.gaps.length;
    el.wordHint.textContent = total > 1
      ? 'Выбери букву для пропуска ' + (gapIndex + 1) + ' из ' + total
      : 'Выбери букву';
  }

  function renderOptions(task) {
    el.options.innerHTML = '';
    if (answered) return;
    core.optionsFor(task, gapIndex, settings.optionsCount).forEach(function (value) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option option--letter';
      if (value === '') {
        btn.classList.add('option--none');
        btn.textContent = 'нет буквы';
      } else {
        btn.textContent = value;
      }
      btn.dataset.value = value;
      btn.addEventListener('click', function () { onLetterClick(btn, value, task); });
      el.options.appendChild(btn);
    });
  }

  function hideHelp() {
    el.help.hidden = true;
    el.helpBtn.textContent = '🆘 Показать слово';
  }

  function showTask() {
    var task = tasks[index];
    answered = false;
    locked = false;
    gapIndex = 0;
    chosen = [];
    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    el.nextBtn.hidden = true;
    el.nextBtn.textContent = index === tasks.length - 1 ? 'Итоги 🏁' : 'Далее ➡️';
    el.helpBtn.hidden = false;
    el.helpWord.textContent = task.word;
    hideHelp();

    renderProgress();
    renderWord(task);
    renderHint(task);
    renderOptions(task);
  }

  /* --- Ответы ----------------------------------------------------------- */

  function ensureResult() {
    if (!results[index]) {
      results[index] = { task: tasks[index], wrong: false, helped: false };
    }
    return results[index];
  }

  function finishWord(task) {
    answered = true;
    el.feedback.textContent = pick(PRAISE);
    el.feedback.className = 'feedback feedback--ok';
    el.word.innerHTML = '';
    var full = document.createElement('b');
    full.textContent = task.word;
    el.word.appendChild(full);
    var tag = document.createElement('span');
    tag.className = 'grade-tag';
    tag.textContent = task.grade + ' кл.';
    el.word.appendChild(document.createTextNode(' '));
    el.word.appendChild(tag);
    // Кнопки оставляем на месте (выключенными) — зелёная буква видна до «Далее»
    el.helpBtn.hidden = true;
    hideHelp();
    renderHint(task);
    el.nextBtn.hidden = false;
    el.nextBtn.focus();
  }

  function onLetterClick(btn, value, task) {
    if (answered || locked || btn.disabled) return;

    if (!core.isCorrect(task, gapIndex, value)) {
      btn.classList.add('is-wrong', 'shake');
      btn.disabled = true;
      el.feedback.textContent = pick(RETRY);
      el.feedback.className = 'feedback feedback--no';
      ensureResult().wrong = true;
      return;
    }

    chosen[gapIndex] = value;
    btn.classList.add('is-correct', 'pop');
    Array.prototype.forEach.call(el.options.children, function (other) {
      other.disabled = true;
    });
    ensureResult();
    renderWord(task);

    if (gapIndex >= task.gaps.length - 1) {
      finishWord(task);
      return;
    }

    // Пауза, чтобы ребёнок увидел зелёную букву на своём месте
    el.feedback.textContent = 'Верно! Теперь следующий пропуск 👉';
    el.feedback.className = 'feedback feedback--ok';
    locked = true;
    setTimeout(function () {
      locked = false;
      gapIndex++;
      el.feedback.textContent = '';
      el.feedback.className = 'feedback';
      renderWord(task);
      renderHint(task);
      renderOptions(task);
    }, 550);
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
      grades: settings.grades,
      mistakes: wrongList.map(function (r) {
        return { word: r.task.word, grade: r.task.grade };
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
      // Красный — были ошибки, оранжевый — верно, но смотрел слово, зелёный — сразу верно
      var kind = r.wrong ? 'ex--no' : (r.helped ? 'ex--help' : 'ex--ok');
      var mark = r.wrong ? '✗' : (r.helped ? '✓ 💡' : '✓');
      var div = document.createElement('div');
      div.className = 'ex ex--word ' + kind;
      div.innerHTML = '<b>' + r.task.word + '</b>' +
        '<span class="ex__mark">' + mark + '</span>' +
        '<span class="ex__masked">' + core.maskedText(r.task) + '</span>';
      el.resultGrid.appendChild(div);
    });

    el.quiz.hidden = true;
    el.result.hidden = false;
    window.scrollTo(0, 0);
  }

  /* --- Старт ------------------------------------------------------------ */

  el.nextBtn.addEventListener('click', onNext);

  el.helpBtn.addEventListener('click', function () {
    el.help.hidden = !el.help.hidden;
    el.helpBtn.textContent = el.help.hidden ? '🆘 Показать слово' : '🙈 Спрятать слово';
    // Одно слово — одна отметка, сколько раз ни открывай и ни закрывай подсказку
    if (!el.help.hidden) ensureResult().helped = true;
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
    el.word.textContent = 'Нет слов 🤷';
    el.counter.textContent = '';
    el.wordHint.textContent = 'Выбери хотя бы один класс в настройках.';
    el.helpBtn.hidden = true;
  } else {
    showTask();
  }
})();
