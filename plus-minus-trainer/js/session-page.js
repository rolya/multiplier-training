/* ==========================================================================
   session-page.js — тренировка и итоги «Сложение и вычитание» (session.html)
   ========================================================================== */

(function () {
  var store = PM.store;
  var core = PM.core;

  var settings = store.getSettings();
  var tasks = [];
  var results = [];      // [{ task, wrong: bool, helped: bool }]
  var index = 0;
  var answered = false;  // на текущий пример дан верный ответ

  var el = {
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
    bar: document.getElementById('progress-bar'),
    counter: document.getElementById('counter'),
    question: document.getElementById('question'),
    crossHint: document.getElementById('cross-hint'),
    options: document.getElementById('options'),
    feedback: document.getElementById('feedback'),
    helpBtn: document.getElementById('help-btn'),
    help: document.getElementById('help'),
    helpLead: document.getElementById('help-lead'),
    helpMethods: document.getElementById('help-methods'),
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
    tasks = core.buildSessionExamples(settings);
    results = [];
    index = 0;
  }

  /* --- Отрисовка примера ----------------------------------------------- */

  function renderProgress() {
    el.counter.textContent = 'Пример ' + (index + 1) + ' из ' + tasks.length;
    el.bar.style.width = (index / tasks.length * 100) + '%';
  }

  function renderQuestion(task) {
    el.question.innerHTML = core.text(task) + ' = <span class="blank">?</span>' +
      ' <span class="level-tag">ур. ' + task.level + '</span>';
  }

  /** Подсказка про переход через десяток — видна всегда, ещё до ответа */
  function renderCrossHint(task) {
    var crosses = core.crossesTen(task.a, task.b, task.op);
    el.crossHint.className = 'cross-hint ' + (crosses ? 'cross-hint--yes' : 'cross-hint--no');
    el.crossHint.textContent = crosses
      ? '🔟 Переход через десяток есть'
      : '🔟 Перехода через десяток нет';
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
      btn.addEventListener('click', function () { onOptionClick(btn, value, task); });
      el.options.appendChild(btn);
    });
  }

  /* Две палочки «треугольника» от разбиваемого числа к его частям */
  var LEGS = '<svg class="split__legs" viewBox="0 0 100 40" preserveAspectRatio="none"' +
    ' aria-hidden="true"><path d="M50 2 L8 38 M50 2 L92 38"/></svg>';

  /**
   * Строка шага. Обычно это просто текст вида «40 + 30 = 70».
   * Если у шага есть разбиение единиц, второе число рисуем с «треугольником»:
   * под ним расходятся две палочки, а на их концах — части числа.
   */
  function renderStepExpr(s) {
    var expr = document.createElement('span');
    expr.className = 'step__expr';
    if (!s.split) {
      expr.textContent = s.expr;
      return expr;
    }

    expr.className = 'step__expr step__expr--split';
    expr.appendChild(document.createTextNode(s.split.before));

    var whole = document.createElement('span');
    whole.className = 'split';
    whole.appendChild(document.createTextNode(s.split.whole));

    var tree = document.createElement('span');
    tree.className = 'split__tree';
    tree.innerHTML = LEGS;

    var parts = document.createElement('span');
    parts.className = 'split__parts';
    s.split.parts.forEach(function (part) {
      var one = document.createElement('span');
      one.textContent = part;
      parts.appendChild(one);
    });
    tree.appendChild(parts);

    whole.appendChild(tree);
    expr.appendChild(whole);
    expr.appendChild(document.createTextNode(s.split.after));
    return expr;
  }

  /** Панель «Помочь»: два способа решить именно этот пример, по шагам */
  function renderHelp(task) {
    var help = core.explain(task);
    el.helpLead.textContent = help.crosses
      ? 'Здесь есть переход через десяток — смотри, как его пройти.'
      : 'Перехода через десяток нет — считаем по разрядам.';
    el.helpMethods.innerHTML = '';

    help.methods.forEach(function (m) {
      var box = document.createElement('div');
      box.className = 'method';

      var title = document.createElement('h3');
      title.className = 'method__title';
      title.textContent = m.title;
      box.appendChild(title);

      var hint = document.createElement('p');
      hint.className = 'method__hint';
      hint.textContent = m.hint;
      box.appendChild(hint);

      var list = document.createElement('ol');
      list.className = 'method__steps';
      m.steps.forEach(function (s) {
        var item = document.createElement('li');
        item.className = 'step';
        var body = document.createElement('div');
        body.className = 'step__body';

        body.appendChild(renderStepExpr(s));

        if (s.note) {
          var note = document.createElement('span');
          note.className = 'step__note';
          note.textContent = s.note;
          body.appendChild(note);
        }

        item.appendChild(body);
        list.appendChild(item);
      });
      box.appendChild(list);
      el.helpMethods.appendChild(box);
    });
  }

  function hideHelp() {
    el.help.hidden = true;
    el.helpBtn.textContent = '🆘 Помочь';
  }

  function showTask() {
    var task = tasks[index];
    answered = false;
    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    el.nextBtn.hidden = true;
    el.nextBtn.textContent = index === tasks.length - 1 ? 'Итоги 🏁' : 'Далее ➡️';
    hideHelp();

    renderProgress();
    renderQuestion(task);
    renderCrossHint(task);
    renderOptions(task);
    renderHelp(task);
  }

  /* --- Ответы ----------------------------------------------------------- */

  function ensureResult() {
    if (!results[index]) {
      results[index] = { task: tasks[index], wrong: false, helped: false };
    }
    return results[index];
  }

  function onOptionClick(btn, value, task) {
    if (answered || btn.disabled) return;

    if (value === core.solve(task)) {
      btn.classList.add('is-correct', 'pop');
      Array.prototype.forEach.call(el.options.children, function (other) {
        other.disabled = true;
      });
      el.feedback.textContent = pick(PRAISE);
      el.feedback.className = 'feedback feedback--ok';
      ensureResult();
      answered = true;
      el.question.innerHTML = core.text(task) + ' = <b>' + core.solve(task) + '</b>' +
        ' <span class="level-tag">ур. ' + task.level + '</span>';
      el.nextBtn.hidden = false;
      el.nextBtn.focus();
      return;
    }

    btn.classList.add('is-wrong', 'shake');
    btn.disabled = true;
    el.feedback.textContent = pick(RETRY);
    el.feedback.className = 'feedback feedback--no';
    ensureResult().wrong = true;
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
      levels: settings.levels,
      mistakes: wrongList.map(function (r) {
        return { a: r.task.a, b: r.task.b, op: r.task.op, level: r.task.level };
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
      el.resultText.textContent = 'Хорошая работа! Разберём примеры с ошибками.';
    } else {
      el.resultEmoji.textContent = '🤗';
      el.resultText.textContent = 'Ничего страшного — потренируемся ещё, и всё получится!';
    }

    el.resultGrid.innerHTML = '';
    results.forEach(function (r) {
      if (!r) return;
      // Красный — были ошибки, оранжевый — верно, но с подсказкой, зелёный — сразу верно
      var kind = r.wrong ? 'ex--no' : (r.helped ? 'ex--help' : 'ex--ok');
      var mark = r.wrong ? '✗' : (r.helped ? '✓ 💡' : '✓');
      var div = document.createElement('div');
      div.className = 'ex ' + kind;
      div.innerHTML = core.text(r.task) + ' = <b>' + core.solve(r.task) + '</b>' +
        '<span class="ex__mark">' + mark + '</span>';
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
    el.helpBtn.textContent = el.help.hidden ? '🆘 Помочь' : '🙈 Скрыть подсказку';
    // Один пример — одна отметка, сколько раз ни открывай и ни закрывай подсказку
    if (!el.help.hidden) ensureResult().helped = true;
  });

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
    el.crossHint.textContent = 'Включи хотя бы один уровень в настройках.';
    el.helpBtn.hidden = true;
  } else {
    showTask();
  }
})();
