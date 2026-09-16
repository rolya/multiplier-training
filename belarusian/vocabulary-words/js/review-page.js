/* ==========================================================================
   review-page.js — страница «Повторить»: все слоўнікавыя словы по четвертям.
   Буквы, которые в тренажёре скрыты пропусками, показываем жирным — это то,
   что нужно запомнить. Кнопкой «Спрятать буквы» список превращается в
   проверку себя: на месте букв остаётся прочерк.
   ========================================================================== */

(function () {
  var core = VW.core;
  var data = VW.data;

  var host = document.getElementById('grades');
  var toggleBtn = document.getElementById('toggle-letters');
  var showLetters = true;

  /** Слово одной строкой: обычные куски текстом, «нужные» буквы жирными */
  function wordNode(entry, grade) {
    var task = core.buildTask({ entry: entry, grade: grade });
    var li = document.createElement('li');
    li.className = 'review-word';

    core.accentParts(task).forEach(function (part) {
      if (!part.accent) {
        li.appendChild(document.createTextNode(part.text));
        return;
      }
      var b = document.createElement('b');
      b.className = 'review-word__accent';
      // Спрятанная буква — прочерк той же ширины, чтобы строка не прыгала
      b.textContent = showLetters ? part.text : '_';
      if (!showLetters) b.classList.add('review-word__accent--hidden');
      li.appendChild(b);
    });

    return li;
  }

  /** Заголовок с числом слов справа */
  function heading(tag, text, count, className) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    var badge = document.createElement('span');
    badge.className = 'review-count';
    badge.textContent = count + ' ' + core.wordForm(count);
    el.appendChild(badge);
    return el;
  }

  function listNode(words, grade) {
    var list = document.createElement('ul');
    list.className = 'review-list';
    words.forEach(function (entry) {
      list.appendChild(wordNode(entry, grade));
    });
    return list;
  }

  function render() {
    host.innerHTML = '';

    data.GRADES.forEach(function (grade) {
      var words = data.BY_GRADE[grade] || [];
      if (!words.length) return;

      var card = document.createElement('div');
      card.className = 'card';
      card.appendChild(heading('h2', grade + ' класс', words.length));

      var groups = core.byQuarter(grade);
      if (groups.length === 1) {
        // Класс без разбивки по четвертям — просто список
        card.appendChild(listNode(groups[0].words, grade));
      } else {
        groups.forEach(function (group) {
          card.appendChild(heading('h3', group.label, group.words.length,
            'review-quarter'));
          card.appendChild(listNode(group.words, grade));
        });
      }

      host.appendChild(card);
    });
  }

  toggleBtn.addEventListener('click', function () {
    showLetters = !showLetters;
    toggleBtn.textContent = showLetters ? 'Спрятать буквы' : 'Показать буквы';
    render();
  });

  document.getElementById('print-btn').addEventListener('click', function () {
    window.print();
  });

  render();
})();
