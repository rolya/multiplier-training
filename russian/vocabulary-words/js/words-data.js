/* ==========================================================================
   words-data.js — датасет словарных слов (2 и 3 класс)

   Одна запись — одно слово. Поля:
     word    — правильное слово целиком;
     masked  — то же слово с пропусками, пропуск обозначен «..»;
     answers — правильные буквы для пропусков, по порядку слева направо;
     options — варианты вставки для каждого пропуска (первый — правильный).

   Пустая строка '' в options — вариант «нет буквы»: так проверяем удвоенные
   согласные (гру..па → «п» или ничего).

   Четверти задаются отдельными списками (QUARTER_WORDS) ниже — сами записи
   править не нужно, достаточно вписать слово в список нужной четверти.

   Датасет проверяет сам себя: VW.core.validate() подставляет answers в masked
   и сравнивает с word, а ещё следит, что answers[i] есть в options[i] и что
   все слова из списков четвертей нашлись в своём классе.
   ========================================================================== */

window.VW = window.VW || {};

VW.data = (function () {
  var GAP = '..';   // чем помечен пропуск в masked

  /* --- 2 класс ---------------------------------------------------------- */
  /* Список по учебной программе Беларуси. «Беларусь» и «Родина» пишутся
     с большой буквы — так они и показываются ребёнку. */
  var GRADE_2 = [
    { word: 'язык',        masked: 'яз..к',        answers: ['ы'],           options: [['ы', 'и']] },
    { word: 'хорошо',      masked: 'х..р..шо',     answers: ['о', 'о'],      options: [['о', 'а'], ['о', 'а']] },
    { word: 'ребята',      masked: 'р..бята',      answers: ['е'],           options: [['е', 'и']] },
    { word: 'сорока',      masked: 'с..рока',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'корова',      masked: 'к..рова',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'огород',      masked: '..г..ро..',    answers: ['о', 'о', 'д'], options: [['о', 'а'], ['о', 'а'], ['д', 'т']] },
    { word: 'яблоко',      masked: 'ябл..к..',     answers: ['о', 'о'],      options: [['о', 'а'], ['о', 'а']] },
    { word: 'Беларусь',    masked: 'Бел..русь',    answers: ['а'],           options: [['а', 'о']] },
    { word: 'ягода',       masked: 'яг..да',       answers: ['о'],           options: [['о', 'а']] },
    { word: 'дорога',      masked: 'д..рога',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'воробей',     masked: 'в..р..бей',    answers: ['о', 'о'],      options: [['о', 'а'], ['о', 'а']] },
    { word: 'заяц',        masked: 'за..ц',        answers: ['я'],           options: [['я', 'е']] },
    { word: 'сентябрь',    masked: 'с..нтябрь',    answers: ['е'],           options: [['е', 'и']] },
    { word: 'октябрь',     masked: 'окт..брь',     answers: ['я'],           options: [['я', 'е']] },
    { word: 'ноябрь',      masked: 'н..ябрь',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'декабрь',     masked: 'д..кабрь',     answers: ['е'],           options: [['е', 'и']] },
    { word: 'вчера',       masked: 'вч..ра',       answers: ['е'],           options: [['е', 'и']] },
    { word: 'берёза',      masked: 'б..рёза',      answers: ['е'],           options: [['е', 'и']] },
    { word: 'мороз',       masked: 'м..ро..',      answers: ['о', 'з'],      options: [['о', 'а'], ['з', 'с']] },
    { word: 'маленький',   masked: 'м..ленький',   answers: ['а'],           options: [['а', 'о']] },
    { word: 'ворона',      masked: 'в..рона',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'комната',     masked: 'к..мната',     answers: ['о'],           options: [['о', 'а']] },
    { word: 'помидор',     masked: 'п..м..дор',    answers: ['о', 'и'],      options: [['о', 'а'], ['и', 'е']] },
    { word: 'воскресенье', masked: 'в..скр..сенье', answers: ['о', 'е'],     options: [['о', 'а'], ['е', 'и']] },
    { word: 'соловей',     masked: 'с..л..вей',    answers: ['о', 'о'],      options: [['о', 'а'], ['о', 'а']] },
    { word: 'сахар',       masked: 'сах..р',       answers: ['а'],           options: [['а', 'о']] },
    { word: 'портфель',    masked: 'портф..ль',    answers: ['е'],           options: [['е', 'и']] },
    { word: 'карандаш',    masked: 'к..р..ндаш',   answers: ['а', 'а'],      options: [['а', 'о'], ['а', 'о']] },
    { word: 'город',       masked: 'г..ро..',      answers: ['о', 'д'],      options: [['о', 'а'], ['д', 'т']] },
    { word: 'магазин',     masked: 'м..г..зин',    answers: ['а', 'а'],      options: [['а', 'о'], ['а', 'о']] },
    { word: 'молоко',      masked: 'м..л..ко',     answers: ['о', 'о'],      options: [['о', 'а'], ['о', 'а']] },
    { word: 'класс',       masked: 'клас..',       answers: ['с'],           options: [['с', '']] },
    { word: 'белорусский', masked: 'бел..рус..кий', answers: ['о', 'с'],     options: [['о', 'а'], ['с', '']] },
    { word: 'Родина',      masked: 'Род..на',      answers: ['и'],           options: [['и', 'е']] },
    { word: 'конечно',     masked: 'к..не..но',    answers: ['о', 'ч'],      options: [['о', 'а'], ['ч', 'ш']] },
    { word: 'учитель',     masked: 'уч..тель',     answers: ['и'],           options: [['и', 'е']] },
    { word: 'погода',      masked: 'п..года',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'морковь',     masked: 'м..рковь',     answers: ['о'],           options: [['о', 'а']] },
    { word: 'вагон',       masked: 'в..гон',       answers: ['а'],           options: [['а', 'о']] },
    { word: 'зарядка',     masked: 'з..ря..ка',    answers: ['а', 'д'],      options: [['а', 'о'], ['д', 'т']] },
    { word: 'каникулы',    masked: 'к..никулы',    answers: ['а'],           options: [['а', 'о']] },
    { word: 'дежурный',    masked: 'д..журный',    answers: ['е'],           options: [['е', 'и']] },
    { word: 'месяц',       masked: 'мес..ц',       answers: ['я'],           options: [['я', 'е']] }
  ];

  /* --- 3 класс ---------------------------------------------------------- */
  var GRADE_3 = [
    { word: 'автобус',   masked: 'авт..б..с',    answers: ['о', 'у'],      options: [['о', 'а'], ['у', 'о']] },
    { word: 'аппетит',   masked: 'апп..тит',     answers: ['е'],           options: [['е', 'и']] },
    { word: 'берег',     masked: 'б..рег',       answers: ['е'],           options: [['е', 'и']] },
    { word: 'болото',    masked: 'б..лото',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'ветер',     masked: 'в..тер',       answers: ['е'],           options: [['е', 'и']] },
    { word: 'девочка',   masked: 'дев..чка',     answers: ['о'],           options: [['о', 'а']] },
    { word: 'дятел',     masked: 'дят..л',       answers: ['е'],           options: [['е', 'и']] },
    { word: 'жаворонок', masked: 'ж..в..р..нок', answers: ['а', 'о', 'о'], options: [['а', 'о'], ['о', 'а'], ['о', 'а']] },
    { word: 'календарь', masked: 'к..л..ндарь',  answers: ['а', 'е'],      options: [['а', 'о'], ['е', 'и']] },
    { word: 'картина',   masked: 'к..ртина',     answers: ['а'],           options: [['а', 'о']] },
    { word: 'картофель', masked: 'к..рт..ф..ль', answers: ['а', 'о', 'е'], options: [['а', 'о'], ['о', 'а'], ['е', 'и']] },
    { word: 'квартира',  masked: 'кв..ртира',    answers: ['а'],           options: [['а', 'о']] },
    { word: 'конфета',   masked: 'к..нф..та',    answers: ['о', 'е'],      options: [['о', 'а'], ['е', 'и']] },
    { word: 'корзина',   masked: 'к..рз..на',    answers: ['о', 'и'],      options: [['о', 'а'], ['и', 'е']] },
    { word: 'коридор',   masked: 'к..р..дор',    answers: ['о', 'и'],      options: [['о', 'а'], ['и', 'е']] },
    { word: 'костёр',    masked: 'к..стёр',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'крапива',   masked: 'кр..пива',     answers: ['а'],           options: [['а', 'о']] },
    { word: 'ладонь',    masked: 'л..донь',      answers: ['а'],           options: [['а', 'о']] },
    { word: 'метро',     masked: 'м..тро',       answers: ['е'],           options: [['е', 'и']] },
    { word: 'морковь',   masked: 'м..рковь',     answers: ['о'],           options: [['о', 'а']] },
    { word: 'неделя',    masked: 'н..деля',      answers: ['е'],           options: [['е', 'и']] },
    { word: 'огурец',    masked: 'огур..ц',      answers: ['е'],           options: [['е', 'и']] },
    { word: 'орех',      masked: 'ор..х',        answers: ['е'],           options: [['е', 'и']] },
    { word: 'пальто',    masked: 'п..льто',      answers: ['а'],           options: [['а', 'о']] },
    { word: 'помидор',   masked: 'п..м..дор',    answers: ['о', 'и'],      options: [['о', 'а'], ['и', 'е']] },
    { word: 'посуда',    masked: 'п..суда',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'пшеница',   masked: 'пш..ница',     answers: ['е'],           options: [['е', 'и']] },
    { word: 'рюкзак',    masked: 'рюкз..к',      answers: ['а'],           options: [['а', 'о']] },
    { word: 'рябина',    masked: 'ряб..на',      answers: ['и'],           options: [['и', 'е']] },
    { word: 'салат',     masked: 'с..лат',       answers: ['а'],           options: [['а', 'о']] },
    { word: 'сапоги',    masked: 'с..п..ги',     answers: ['а', 'о'],      options: [['а', 'о'], ['о', 'а']] },
    { word: 'синица',    masked: 'с..ница',      answers: ['и'],           options: [['и', 'е']] },
    { word: 'смородина', masked: 'см..р..дина',  answers: ['о', 'о'],      options: [['о', 'а'], ['о', 'а']] },
    { word: 'собака',    masked: 'с..бака',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'суббота',   masked: 'су..б..та',    answers: ['б', 'о'],      options: [['б', ''], ['о', 'а']] },
    { word: 'телевизор', masked: 'т..л..виз..р', answers: ['е', 'е', 'о'], options: [['е', 'и'], ['е', 'и'], ['о', 'а']] },
    { word: 'товарищ',   masked: 'т..варищ',     answers: ['о'],           options: [['о', 'а']] },
    { word: 'трамвай',   masked: 'тр..мвай',     answers: ['а'],           options: [['а', 'о']] },
    { word: 'улица',     masked: 'ул..ца',       answers: ['и'],           options: [['и', 'е']] },
    { word: 'урожай',    masked: 'ур..жай',      answers: ['о'],           options: [['о', 'а']] },
    { word: 'футбол',    masked: 'ф..тб..л',     answers: ['у', 'о'],      options: [['у', 'о'], ['о', 'а']] },
    { word: 'человек',   masked: 'ч..л..век',    answers: ['е', 'о'],      options: [['е', 'и'], ['о', 'а']] },
    { word: 'черника',   masked: 'ч..рн..ка',    answers: ['е', 'и'],      options: [['е', 'и'], ['и', 'е']] },
    { word: 'яблоня',    masked: 'ябл..ня',      answers: ['о'],           options: [['о', 'а']] }
  ];

  /* --- Четверти --------------------------------------------------------- */
  /* Слова учитель даёт четвертями. Ниже — списки слов по четвертям: вписал
     слово в нужный список, и оно появилось в этой четверти и в тренировке,
     и на странице повторения.
     Всё, что ни в один список не попало, идёт в категорию «остальные» (0).
     Во 2 классе разбивки по четвертям нет — там все слова «остальные». */

  var OTHER = 0;

  var QUARTER_WORDS = {
    2: {},
    3: {
      1: [
        'болото', 'девочка', 'яблоня', 'собака', 'телевизор', 'картина',
        'коридор', 'корзина', 'крапива', 'урожай', 'ветер', 'товарищ', 'пальто'
      ]
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

  applyQuarters(2, GRADE_2);
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

  var BY_GRADE = { 2: GRADE_2, 3: GRADE_3 };

  return {
    GAP: GAP,
    GRADES: [2, 3],
    BY_GRADE: BY_GRADE,
    GRADE_2: GRADE_2,
    GRADE_3: GRADE_3,

    OTHER_QUARTER: OTHER,
    QUARTER_PROBLEMS: QUARTER_PROBLEMS,
    quarterLabel: quarterLabel,
    /** Все четверти, которые есть хоть в одном классе — для выбора в настройках */
    QUARTERS: quartersWithWords(GRADE_2.concat(GRADE_3)),
    /** Четверти внутри одного класса — для страницы повторения */
    quartersOfGrade: function (grade) {
      return quartersWithWords(BY_GRADE[grade] || []);
    }
  };
})();
