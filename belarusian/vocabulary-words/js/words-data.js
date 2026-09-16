/* ==========================================================================
   words-data.js — датасет слоўнікавых слоў беларускай мовы (3 класс)

   Одна запись — одно слово. Поля:
     word    — правильное слово целиком, с ударением (знак ́ после гласной);
     masked  — то же слово с пропусками, пропуск обозначен «..»;
     answers — правильные буквы для пропусков, по порядку слева направо;
     options — варианты вставки для каждого пропуска (первый — правильный).

   Пустая строка '' в options — вариант «нет буквы»: так проверяем мягкий знак
   и удвоенные согласные (дзён..ік → «н» или ничего).

   Ударение нужно, чтобы видеть, почему буква пишется так: в безударном слоге
   работает аканне и яканне (гарадскі́ — обе «а» безударные). Над «ё» ударение
   не ставим: в беларускай мове «ё» всегда ударная.

   Пропуск ставим на ту букву, которую на слух не слышно:
   аканне/яканне, мягкий знак, «дц»/«дч», «сч» вместо [шч], двойные согласные.

   Четверти задаются отдельными списками (QUARTER_WORDS) ниже — сами записи
   править не нужно, достаточно вписать слово в список нужной четверти.

   Датасет проверяет сам себя: VW.core.validate() подставляет answers в masked
   и сравнивает с word, а ещё следит, что answers[i] есть в options[i] и что
   все слова из списков четвертей нашлись в своём классе.
   ========================================================================== */

window.VW = window.VW || {};

VW.data = (function () {
  var GAP = '..';   // чем помечен пропуск в masked

  /* --- 3 класс ---------------------------------------------------------- */
  var GRADE_3 = [
    { word: 'адцвіта́ць',  masked: 'а..цвіта́ць',   answers: ['д'],      options: [['д', 'ц']] },
    { word: 'адчыні́ць',   masked: 'а..ч..ні́ць',   answers: ['д', 'ы'], options: [['д', 'ч'], ['ы', 'і']] },
    { word: 'асцяро́жны',  masked: 'асц..ро́жны',   answers: ['я'],      options: [['я', 'е']] },
    { word: 'блішча́ць',   masked: 'бл..шча́ць',    answers: ['і'],      options: [['і', 'я']] },
    { word: 'булён',       masked: 'бу..ён',        answers: ['л'],      options: [['л', 'ль']] },
    { word: 'бутэрбро́д',  masked: 'бут..рбро́..',  answers: ['э', 'д'], options: [['э', 'е'], ['д', 'т']] },
    { word: 'во́блака',    masked: 'во́блак..',     answers: ['а'],      options: [['а', 'о']] },
    { word: 'во́сеньскі',  masked: 'во́сен..скі',   answers: ['ь'],      options: [['ь', '']] },
    { word: 'ву́лей',      masked: 'ву́л..й',       answers: ['е'],      options: [['е', 'я']] },
    { word: 'вы́йсці',     masked: 'вы́..сці',      answers: ['й'],      options: [['й', '']] },
    { word: 'гарадскі́',   masked: 'г..р..дскі́',   answers: ['а', 'а'], options: [['а', 'о'], ['а', 'о']] },
    { word: 'гасці́нец',   masked: 'г..сці́нец',    answers: ['а'],      options: [['а', 'о']] },
    { word: 'дзённік',     masked: 'дзён..ік',      answers: ['н'],      options: [['н', '']] },
    { word: 'звіне́ць',    masked: 'зв..не́ць',     answers: ['і'],      options: [['і', 'е']] },
    { word: 'паву́к',      masked: 'па..у́к',       answers: ['в'],      options: [['в', '']] },
    { word: 'пена́л',      masked: 'п..на́л',       answers: ['е'],      options: [['е', 'і']] },
    { word: 'по́шта',      masked: 'по́шт..',       answers: ['а'],      options: [['а', 'о']] },
    { word: 'пясча́ны',    masked: 'пя..ча́ны',     answers: ['с'],      options: [['с', 'ш']] },
    { word: 'свяці́ць',    masked: 'св..ці́ць',     answers: ['я'],      options: [['я', 'е']] },
    { word: 'смяя́цца',    masked: 'см..я́ц..а',    answers: ['я', 'ц'], options: [['я', 'е'], ['ц', '']] },
    { word: 'сшы́так',     masked: '..шы́так',      answers: ['с'],      options: [['с', 'ш']] },
    { word: 'шча́сце',     masked: 'шча́с..е',      answers: ['ц'],      options: [['ц', 'т']] }
  ];

  /* --- Четверти --------------------------------------------------------- */
  /* Слова учитель даёт четвертями. Ниже — списки слов по четвертям: вписал
     слово в нужный список, и оно появилось в этой четверти и в тренировке,
     и на странице повторения.
     Всё, что ни в один список не попало, идёт в категорию «остальные» (0). */

  var OTHER = 0;

  var QUARTER_WORDS = {
    3: {
      1: ['во́сеньскі', 'сшы́так', 'асцяро́жны', 'смяя́цца', 'блішча́ць'],
      2: ['во́блака', 'шча́сце', 'гасці́нец', 'гарадскі́', 'свяці́ць', 'паву́к', 'пена́л']
    }
  };

  /* Слова, которых нет в классе, — собираем и показываем в validate(),
     чтобы опечатка в списке четверти не осталась незамеченной. */
  var QUARTER_PROBLEMS = [];

  /** Проставить entry.quarter по спискам четвертей */
  function applyQuarters(grade, list) {
    list.forEach(function (entry) { entry.quarter = OTHER; });

    var byQuarter = QUARTER_WORDS[grade] || {};
    Object.keys(byQuarter).forEach(function (key) {
      var id = parseInt(key, 10);
      (byQuarter[key] || []).forEach(function (word) {
        var found = false;
        list.forEach(function (entry) {
          if (entry.word === word) {
            entry.quarter = id;
            found = true;
          }
        });
        if (!found) {
          QUARTER_PROBLEMS.push(grade + ' класс, ' + id + ' четверть: слова «' +
            word + '» нет в списке класса');
        }
      });
    });
  }

  applyQuarters(3, GRADE_3);

  function quarterLabel(id) {
    return id === OTHER ? 'Остальные слова' : id + ' четверть';
  }

  /** Четверти, в которых реально есть слова: по возрастанию, «остальные» — в конце */
  function quartersWithWords(list) {
    var seen = {};
    list.forEach(function (entry) { seen[entry.quarter] = true; });
    return Object.keys(seen)
      .map(function (key) { return parseInt(key, 10); })
      .sort(function (a, b) {
        if (a === OTHER) return 1;
        if (b === OTHER) return -1;
        return a - b;
      });
  }

  var BY_GRADE = { 3: GRADE_3 };

  return {
    GAP: GAP,
    GRADES: [3],
    BY_GRADE: BY_GRADE,
    GRADE_3: GRADE_3,

    OTHER_QUARTER: OTHER,
    QUARTER_PROBLEMS: QUARTER_PROBLEMS,
    quarterLabel: quarterLabel,
    /** Все четверти, которые есть хоть в одном классе — для выбора в настройках */
    QUARTERS: quartersWithWords(GRADE_3),
    /** Четверти внутри одного класса — для страницы повторения */
    quartersOfGrade: function (grade) {
      return quartersWithWords(BY_GRADE[grade] || []);
    }
  };
})();
