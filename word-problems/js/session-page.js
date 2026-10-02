/* ==========================================================================
   session-page.js — тренировка и итоги «Задачи на умножение и деление»
   ========================================================================== */

(function () {
  var store = WP.store;
  var core = WP.core;
  var scene = WP.scene;

  var settings = store.getSettings();
  var tasks = [];
  var results = [];      // [{ task, wrong: bool, helped: bool }]
  var index = 0;
  var answered = false;  // на текущую задачу дан верный ответ

  var el = {
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
    bar: document.getElementById('progress-bar'),
    counter: document.getElementById('counter'),
    problem: document.getElementById('problem'),
    scene: document.getElementById('scene'),
    form: document.getElementById('answer-form'),
    input: document.getElementById('answer-input'),
    checkBtn: document.getElementById('check-btn'),
    answerLine: document.getElementById('answer-line'),
    feedback: document.getElementById('feedback'),
    helpBtn: document.getElementById('help-btn'),
    help: document.getElementById('help'),
    nextBtn: document.getElementById('next-btn'),
    resultEmoji: document.getElementById('result-emoji'),
    resultScore: document.getElementById('result-score'),
    resultText: document.getElementById('result-text'),
    resultList: document.getElementById('result-list'),
    againBtn: document.getElementById('again-btn')
  };

  var PRAISE = ['Молодец! 🎉', 'Верно! ⭐', 'Точно! 👍', 'Супер! 🚀', 'Правильно! 🍭'];
  var RETRY = ['Ой, попробуй ещё 🤔', 'Не то… ещё раз! 💪', 'Почти! Подумай ещё 🙂'];

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* --- Отрисовка задачи ------------------------------------------------ */

  function renderProgress() {
    el.counter.textContent = 'Задача ' + (index + 1) + ' из ' + tasks.length;
    el.bar.style.width = (index / tasks.length * 100) + '%';
  }

  /** Панель «Помочь»: вид задачи, правило, краткая запись, картинка, решение */
  function renderHelp(task) {
    var help = core.explain(task);
    el.help.innerHTML = '';

    el.help.appendChild(node('h3', 'help__title', '🧭 ' + help.title));
    el.help.appendChild(node('p', 'help__lead', help.rule));

    var steps = node('ol', 'method__steps');

    var rec = node('li', 'step');
    var recBody = node('div', 'step__body');
    recBody.appendChild(node('span', 'step__note', 'Краткая запись'));
    var lines = node('div', 'record');
    help.record.forEach(function (line) { lines.appendChild(node('div', 'record__line', line)); });
    recBody.appendChild(lines);
    rec.appendChild(recBody);
    steps.appendChild(rec);

    var pic = node('li', 'step');
    var picBody = node('div', 'step__body');
    picBody.appendChild(node('span', 'step__note', 'Смотри на картинке'));
    picBody.appendChild(scene.render(task, 'help'));
    pic.appendChild(picBody);
    steps.appendChild(pic);

    var sol = node('li', 'step');
    var solBody = node('div', 'step__body');
    solBody.appendChild(node('span', 'step__note', 'Решение'));
    solBody.appendChild(node('span', 'step__expr', help.expr));
    solBody.appendChild(node('span', 'step__note', 'Ответ: ' + help.answer + '.'));
    sol.appendChild(solBody);
    steps.appendChild(sol);

    el.help.appendChild(steps);
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
    el.answerLine.hidden = true;
    el.form.hidden = false;
    el.input.value = '';
    el.input.className = 'answer-input';
    el.input.readOnly = false;
    el.checkBtn.disabled = false;
    hideHelp();

    renderProgress();
    el.problem.textContent = task.text;
    el.scene.innerHTML = '';
    el.scene.appendChild(scene.render(task, 'task'));
    renderHelp(task);
    el.input.focus();
  }

  /* --- Ответы ----------------------------------------------------------- */

  function ensureResult() {
    if (!results[index]) {
      results[index] = { task: tasks[index], wrong: false, helped: false };
    }
    return results[index];
  }

  /** Перезапуск анимации: снять класс, дать браузеру отрисовать, поставить снова */
  function animate(cls) {
    el.input.classList.remove(cls);
    void el.input.offsetWidth;
    el.input.classList.add(cls);
  }

  function onCheck(event) {
    event.preventDefault();
    if (answered) return;
    var task = tasks[index];
    var raw = el.input.value.trim();

    if (!/^\d+$/.test(raw)) {
      el.feedback.textContent = 'Напиши ответ числом ✏️';
      el.feedback.className = 'feedback';
      el.input.focus();
      return;
    }

    if (parseInt(raw, 10) === task.answer) {
      answered = true;
      ensureResult();
      el.input.className = 'answer-input is-correct';
      animate('pop');
      el.input.readOnly = true;
      el.checkBtn.disabled = true;
      el.feedback.textContent = pick(PRAISE);
      el.feedback.className = 'feedback feedback--ok';
      el.answerLine.textContent = '✅ Ответ: ' + task.answerText + '.';
      el.answerLine.hidden = false;
      el.nextBtn.hidden = false;
      el.nextBtn.focus();
      return;
    }

    ensureResult().wrong = true;
    el.input.className = 'answer-input is-wrong';
    animate('shake');
    el.feedback.textContent = pick(RETRY);
    el.feedback.className = 'feedback feedback--no';
    el.input.select();
  }

  function onNext() {
    if (!answered) return;
    if (index >= tasks.length - 1) {
      finish();
      return;
    }
    index++;
    showTask();
    window.scrollTo(0, 0);
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
      maxNumber: settings.maxNumber,
      mistakes: wrongList.map(function (r) {
        return { id: r.task.id, x: r.task.x, y: r.task.y };
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
      el.resultText.textContent = 'Хорошая работа! Разберём задачи с ошибками.';
    } else {
      el.resultEmoji.textContent = '🤗';
      el.resultText.textContent = 'Ничего страшного — потренируемся ещё, и всё получится!';
    }

    el.resultList.innerHTML = '';
    results.forEach(function (r) {
      if (!r) return;
      // Красный — были ошибки, оранжевый — верно, но с подсказкой, зелёный — сразу верно
      var kind = r.wrong ? 'ex--no' : (r.helped ? 'ex--help' : 'ex--ok');
      var mark = r.wrong ? '✗' : (r.helped ? '✓ 💡' : '✓');
      var li = node('li', 'task-card ' + kind);
      li.appendChild(node('span', 'task-card__text', r.task.text));
      var ans = node('span', 'task-card__answer', 'Ответ: ' + r.task.answerText + ' ');
      ans.appendChild(node('span', 'ex__mark', mark));
      li.appendChild(ans);
      el.resultList.appendChild(li);
    });

    el.quiz.hidden = true;
    el.result.hidden = false;
    window.scrollTo(0, 0);
  }

  /* --- Старт ------------------------------------------------------------ */

  el.form.addEventListener('submit', onCheck);
  el.nextBtn.addEventListener('click', onNext);

  // Только цифры — буквы и пробелы в поле не попадают
  el.input.addEventListener('input', function () {
    var digits = el.input.value.replace(/\D/g, '');
    if (digits !== el.input.value) el.input.value = digits;
  });

  el.helpBtn.addEventListener('click', function () {
    el.help.hidden = !el.help.hidden;
    el.helpBtn.textContent = el.help.hidden ? '🆘 Помочь' : '🙈 Скрыть подсказку';
    // Одна задача — одна отметка, сколько раз ни открывай подсказку
    if (!el.help.hidden) ensureResult().helped = true;
  });

  document.addEventListener('keydown', function (event) {
    // На самой кнопке Enter обрабатывает браузер — чтобы не перескочить две задачи
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

  tasks = core.buildSession(settings);
  if (!tasks.length) {
    el.problem.textContent = 'Нет задач для этого уровня 🤷';
    el.counter.textContent = '';
    el.form.hidden = true;
    el.helpBtn.hidden = true;
  } else {
    showTask();
  }
})();
