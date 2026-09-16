/* ==========================================================================
   review-page.js — страница «Повторить»: все словарные слова по классам.
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

  function render() {
    host.innerHTML = '';

    data.GRADES.forEach(function (grade) {
      var words = data.BY_GRADE[grade] || [];
      if (!words.length) return;

      var card = document.createElement('div');
      card.className = 'card';

      var title = document.createElement('h2');
      title.textContent = grade + ' класс';
      var count = document.createElement('span');
      count.className = 'review-count';
      count.textContent = words.length + ' слов';
      title.appendChild(count);
      card.appendChild(title);

      var list = document.createElement('ul');
      list.className = 'review-list';
      words.forEach(function (entry) {
        list.appendChild(wordNode(entry, grade));
      });
      card.appendChild(list);

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
