/* ==========================================================================
   problems-data.js — набор задач на умножение и деление (шаблоны)
   Глобальный массив WP.PROBLEMS

   Каждая задача — шаблон: числа в ней подставляются под выбранный уровень.
   Числа задаются парой множителей x и y и их произведением p = x · y.
   Произведение — самое большое число задачи, оно не превышает уровень
   (результат умножения или делимое). Множители — из таблицы умножения,
   по умолчанию от 2 до 10; у шаблона можно сузить диапазон (x: [мин, макс]).

   Виды задач (kind) и что в них известно / что ищем:
     mul     — x групп по y в каждой, сколько всего?            → p = y · x
     div     — p разложили поровну на x групп, сколько в одной? → y = p : x
     divBy   — p разложили по y в группу, сколько групп?         → x = p : y
     more    — A = x, B в y раз больше. Сколько B?               → p = x · y
     less    — A = p, B в y раз меньше. Сколько B?               → x = p : y
     cmp     — A = p, B = x. Во сколько раз больше/меньше?       → y = p : x
     indMore — A = p, это в y раз больше, чем B. Сколько B?      → x = p : y
     indLess — A = x, это в y раз меньше, чем B. Сколько B?      → p = x · y

   Поля шаблона:
     text(v, h)  — условие; v = { x, y, p }, h — помощник склонений (WP.lang)
     Задачи с группами (mul, div, divBy):
       group  — существительное «группы» (тарелка), groupIcon, each — «На каждой»
       item   — что лежит в группах (персик), itemIcon
     Задачи на сравнение (more, less, cmp, indMore, indLess):
       a, b   — две величины: { label, icon }; a — та, что известна из условия
                (в cmp — бо́льшая), b — та, что ищем (в cmp — меньшая)
       unit   — в чём меряем ответ (ряд, банка, кг); aUnit — если у A другое слово
       ask    — только в cmp: «больше» или «меньше» (как спрашивают в задаче)

   Существительные: n(одна, две, пять, [одну — винительный падеж женского рода])
   ========================================================================== */

window.WP = window.WP || {};

WP.PROBLEMS = (function () {
  function n(one, few, many, acc1) {
    return { forms: [one, few, many], acc1: acc1 || one };
  }

  /* --- Слова --------------------------------------------------------- */

  var PLATE = n('тарелка', 'тарелки', 'тарелок', 'тарелку');
  var PEACH = n('персик', 'персика', 'персиков');
  var DESK = n('парта', 'парты', 'парт', 'парту');
  var PUPIL = n('ученик', 'ученика', 'учеников');
  var ROW = n('ряд', 'ряда', 'рядов');
  var SEAT = n('место', 'места', 'мест');
  var SHELF = n('полка', 'полки', 'полок', 'полку');
  var TOY = n('игрушка', 'игрушки', 'игрушек', 'игрушку');
  var VASE = n('ваза', 'вазы', 'ваз', 'вазу');
  var FLOWER = n('цветок', 'цветка', 'цветов');
  var TENT = n('палатка', 'палатки', 'палаток', 'палатку');
  var PERSON = n('человек', 'человека', 'человек');
  var CRATE = n('ящик', 'ящика', 'ящиков');
  var KG = n('кг', 'кг', 'кг');
  var BOX = n('коробка', 'коробки', 'коробок', 'коробку');
  var PENCIL = n('карандаш', 'карандаша', 'карандашей');
  var PAIR = n('пара', 'пары', 'пар', 'пару');
  var MITTEN = n('варежка', 'варежки', 'варежек', 'варежку');
  var DOG = n('собака', 'собаки', 'собак', 'собаку');
  var PAW = n('лапа', 'лапы', 'лап', 'лапу');
  var PACKAGE = n('упаковка', 'упаковки', 'упаковок', 'упаковку');
  var YOGURT = n('йогурт', 'йогурта', 'йогуртов');
  var BOUQUET = n('букет', 'букета', 'букетов');
  var DAISY = n('ромашка', 'ромашки', 'ромашек', 'ромашку');
  var JAR = n('банка', 'банки', 'банок', 'банку');
  var CUCUMBER = n('огурец', 'огурца', 'огурцов');
  var BASKET = n('корзинка', 'корзинки', 'корзинок', 'корзинку');
  var APPLE = n('яблоко', 'яблока', 'яблок');
  var CANDY = n('конфета', 'конфеты', 'конфет', 'конфету');
  var CHILD = n('ребёнок', 'ребёнка', 'детей');
  var CUP = n('стаканчик', 'стаканчика', 'стаканчиков');
  var BALLOON = n('шарик', 'шарика', 'шариков');
  var KID = n('ребёнок', 'ребёнка', 'ребят');
  var NOTEBOOK = n('тетрадь', 'тетради', 'тетрадей', 'тетрадь');
  var BUSH = n('куст', 'куста', 'кустов');
  var PIE = n('пирожок', 'пирожка', 'пирожков');
  var AQUARIUM = n('аквариум', 'аквариума', 'аквариумов');
  var FISH = n('рыбка', 'рыбки', 'рыбок', 'рыбку');
  var EGG = n('яйцо', 'яйца', 'яиц');
  var METER = n('м', 'м', 'м');
  var DRESS = n('платье', 'платья', 'платьев');
  var LITER = n('л', 'л', 'л');
  var TOURIST = n('турист', 'туриста', 'туристов');
  var BOAT = n('лодка', 'лодки', 'лодок', 'лодку');
  var CM = n('см', 'см', 'см');
  var TASK = n('задача', 'задачи', 'задач', 'задачу');
  var BALL = n('шар', 'шара', 'шаров');
  var BADGE = n('значок', 'значка', 'значков');
  var CHANTERELLE = n('лисичка', 'лисички', 'лисичек', 'лисичку');
  var MUSHROOM = n('гриб', 'гриба', 'грибов');
  var RIDDLE = n('загадка', 'загадки', 'загадок', 'загадку');
  var SHEEP = n('овца', 'овцы', 'овец');
  var GOAT = n('коза', 'козы', 'коз');
  var ARCTIC_FOX = n('песец', 'песца', 'песцов');
  var FOX = n('лиса', 'лисы', 'лис');
  var NUT = n('орех', 'ореха', 'орехов');
  var BIKE = n('велосипед', 'велосипеда', 'велосипедов');
  var PAGE = n('страница', 'страницы', 'страниц', 'страницу');
  var BIRDHOUSE = n('скворечник', 'скворечника', 'скворечников');
  var LETTER = n('письмо', 'письма', 'писем');
  var MAGAZINE = n('журнал', 'журнала', 'журналов');
  var TV = n('телевизор', 'телевизора', 'телевизоров');
  var WASHER = n('стиральная машина', 'стиральные машины', 'стиральных машин', 'стиральную машину');
  var LINE = n('строчка', 'строчки', 'строчек', 'строчку');
  var PARCEL = n('посылка', 'посылки', 'посылок', 'посылку');
  var STICKER = n('наклейка', 'наклейки', 'наклеек', 'наклейку');

  return [
    /* ===== Умножение: сколько всего? ================================== */
    {
      id: 'mul-peaches', kind: 'mul',
      group: PLATE, groupIcon: '🍽️', each: 'На каждой', item: PEACH, itemIcon: '🍑',
      text: function (v, h) {
        return 'Мама разложила на ' + h.qa(v.x, PLATE) + ' по ' + h.q(v.y, PEACH) +
          '. Сколько всего персиков разложила мама?';
      }
    },
    {
      id: 'mul-desks', kind: 'mul', y: [2, 2],
      group: DESK, groupIcon: '🪑', each: 'За каждой', item: PUPIL, itemIcon: '🧒',
      text: function (v, h) {
        return 'В классе ' + h.q(v.x, DESK) + '. За каждой партой сидят ' + h.q(v.y, PUPIL) +
          '. Сколько учеников в классе?';
      }
    },
    {
      id: 'mul-bus', kind: 'mul', y: [2, 4],
      group: ROW, groupIcon: '🚌', each: 'В каждом', item: SEAT, itemIcon: '💺',
      text: function (v, h) {
        return 'В автобусе ' + h.q(v.x, ROW) + ', в каждом ряду по ' + h.q(v.y, SEAT) +
          '. Сколько мест в автобусе?';
      }
    },
    {
      id: 'mul-shelves', kind: 'mul',
      group: SHELF, groupIcon: '🗄️', each: 'На каждой', item: TOY, itemIcon: '🧸',
      text: function (v, h) {
        return 'В магазине ' + h.q(v.x, SHELF) + ', на каждой — по ' + h.q(v.y, TOY) +
          '. Сколько игрушек на всех полках?';
      }
    },
    {
      id: 'mul-vases', kind: 'mul',
      group: VASE, groupIcon: '🏺', each: 'В каждой', item: FLOWER, itemIcon: '🌷',
      text: function (v, h) {
        return 'На столе ' + h.q(v.x, VASE) + ', в каждой — по ' + h.q(v.y, FLOWER) +
          '. Сколько всего цветов в вазах?';
      }
    },
    {
      id: 'mul-tents', kind: 'mul', y: [2, 6],
      group: TENT, groupIcon: '⛺', each: 'В каждой', item: PERSON, itemIcon: '🧑',
      text: function (v, h) {
        return 'Туристы поставили ' + h.qa(v.x, TENT) + '. В каждой палатке живут по ' +
          h.q(v.y, PERSON) + '. Сколько туристов живёт в палатках?';
      }
    },
    {
      id: 'mul-flour', kind: 'mul',
      group: CRATE, groupIcon: '📦', each: 'В каждом', item: KG, itemIcon: '🌾',
      text: function (v, h) {
        return 'В столовую привезли ' + h.qa(v.x, CRATE) + ' муки, по ' + v.y +
          ' кг в каждом. Сколько килограммов муки привезли в столовую?';
      }
    },
    {
      id: 'mul-pencils', kind: 'mul',
      group: BOX, groupIcon: '🗃️', each: 'В каждой', item: PENCIL, itemIcon: '✏️',
      text: function (v, h) {
        return 'У Алеси ' + h.q(v.x, BOX) + ' карандашей, в каждой — по ' + h.q(v.y, PENCIL) +
          '. Сколько карандашей у Алеси?';
      }
    },
    {
      id: 'mul-mittens', kind: 'mul', y: [2, 2],
      group: PAIR, groupIcon: '👐', each: 'В каждой', item: MITTEN, itemIcon: '🧤',
      text: function (v, h) {
        return 'Бабушка связала внукам ' + h.qa(v.x, PAIR) +
          ' варежек. Сколько всего варежек связала бабушка?';
      }
    },
    {
      id: 'mul-paws', kind: 'mul', y: [4, 4],
      group: DOG, groupIcon: '🐕', each: 'У каждой', item: PAW, itemIcon: '🐾',
      text: function (v, h) {
        return 'Во дворе гуляют ' + h.q(v.x, DOG) + '. Сколько лап у всех собак?';
      }
    },
    {
      id: 'mul-yogurt', kind: 'mul', y: [2, 6],
      group: PACKAGE, groupIcon: '🛍️', each: 'В каждой', item: YOGURT, itemIcon: '🥛',
      text: function (v, h) {
        return 'В одной упаковке ' + h.q(v.y, YOGURT) + '. Папа купил ' + h.qa(v.x, PACKAGE) +
          '. Сколько йогуртов купил папа?';
      }
    },
    {
      id: 'mul-daisies', kind: 'mul',
      group: BOUQUET, groupIcon: '💐', each: 'В каждом', item: DAISY, itemIcon: '🌼',
      text: function (v, h) {
        return 'В одном букете ' + h.q(v.y, DAISY) + '. Сколько ромашек в ' + v.x +
          ' таких букетах?';
      }
    },

    /* ===== Деление на равные части: сколько в одной? ================== */
    {
      id: 'div-cucumbers', kind: 'div',
      group: JAR, groupIcon: '🫙', each: 'В каждой', item: CUCUMBER, itemIcon: '🥒',
      text: function (v, h) {
        return 'В ' + h.qa(v.x, JAR) + ' поровну разложили ' + h.qa(v.p, CUCUMBER) +
          '. Сколько огурцов в одной банке?';
      }
    },
    {
      id: 'div-apples', kind: 'div',
      group: BASKET, groupIcon: '🧺', each: 'В каждой', item: APPLE, itemIcon: '🍎',
      text: function (v, h) {
        return 'В ' + h.qa(v.x, BASKET) + ' поровну разложили ' + h.qa(v.p, APPLE) +
          '. По сколько яблок получилось в каждой корзинке?';
      }
    },
    {
      id: 'div-candies', kind: 'div',
      group: CHILD, groupIcon: '🧒', each: 'Каждому', item: CANDY, itemIcon: '🍬',
      text: function (v, h) {
        return 'Мама разделила ' + h.qa(v.p, CANDY) + ' поровну между ' + v.x +
          ' детьми. Сколько конфет получил каждый?';
      }
    },
    {
      id: 'div-cups', kind: 'div',
      group: CUP, groupIcon: '🥤', each: 'В каждом', item: PENCIL, itemIcon: '✏️',
      text: function (v, h) {
        return 'Художник поровну расставил ' + h.qa(v.p, PENCIL) + ' в ' + h.qa(v.x, CUP) +
          '. Сколько карандашей в каждом стаканчике?';
      }
    },
    {
      id: 'div-balloons', kind: 'div',
      group: KID, groupIcon: '🧒', each: 'Каждому', item: BALLOON, itemIcon: '🎈',
      text: function (v, h) {
        return 'Для праздника купили ' + h.qa(v.p, BALLOON) + ' и раздали поровну ' + v.x +
          ' ребятам. Сколько шариков получил каждый?';
      }
    },
    {
      id: 'div-notebooks', kind: 'div',
      group: DESK, groupIcon: '🪑', each: 'На каждой', item: NOTEBOOK, itemIcon: '📒',
      text: function (v, h) {
        return 'Учительница разложила ' + h.qa(v.p, NOTEBOOK) + ' поровну на ' + h.qa(v.x, DESK) +
          '. Сколько тетрадей на каждой парте?';
      }
    },
    {
      id: 'div-roses', kind: 'div',
      group: ROW, groupIcon: '🟫', each: 'В каждом', item: BUSH, itemIcon: '🌹',
      text: function (v, h) {
        return 'Садовник посадил ' + h.qa(v.p, BUSH) + ' роз поровну в ' + h.qa(v.x, ROW) +
          '. Сколько кустов в каждом ряду?';
      }
    },
    {
      id: 'div-pies', kind: 'div',
      group: PLATE, groupIcon: '🍽️', each: 'На каждой', item: PIE, itemIcon: '🥟',
      text: function (v, h) {
        return 'Бабушка разложила ' + h.qa(v.p, PIE) + ' поровну на ' + h.qa(v.x, PLATE) +
          '. Сколько пирожков на каждой тарелке?';
      }
    },
    {
      id: 'div-fish', kind: 'div',
      group: AQUARIUM, groupIcon: '🫧', each: 'В каждом', item: FISH, itemIcon: '🐟',
      text: function (v, h) {
        return 'В ' + v.x + ' аквариумах всего ' + h.q(v.p, FISH) +
          ', в каждом поровну. Сколько рыбок в одном аквариуме?';
      }
    },

    /* ===== Деление по содержанию: сколько групп? ====================== */
    {
      id: 'divby-eggs', kind: 'divBy',
      group: BOX, groupIcon: '📦', each: 'В каждой', item: EGG, itemIcon: '🥚',
      text: function (v, h) {
        return 'На ферме собрали ' + h.qa(v.p, EGG) + ' и разложили в коробки по ' +
          h.q(v.y, EGG) + ' в каждую. Сколько понадобилось коробок?';
      }
    },
    {
      id: 'divby-desks', kind: 'divBy', y: [2, 2],
      group: DESK, groupIcon: '🪑', each: 'За каждой', item: PUPIL, itemIcon: '🧒',
      text: function (v, h) {
        return 'В классе ' + h.q(v.p, PUPIL) + '. Они сели за парты по ' + h.q(v.y, PUPIL) +
          ' за каждую. Сколько парт заняли ученики?';
      }
    },
    {
      id: 'divby-dresses', kind: 'divBy', y: [2, 4],
      group: DRESS, groupIcon: '👗', each: 'На каждое', item: METER, itemIcon: '🧵',
      text: function (v) {
        return 'Из ' + v.p + ' м ткани сшили платья. На каждое платье ушло по ' + v.y +
          ' м. Сколько платьев сшили?';
      }
    },
    {
      id: 'divby-juice', kind: 'divBy', y: [2, 5],
      group: JAR, groupIcon: '🫙', each: 'В каждой', item: LITER, itemIcon: '🧃',
      text: function (v) {
        return 'Мама разлила ' + v.p + ' л сока в банки, по ' + v.y +
          ' л в каждую. Сколько банок понадобилось?';
      }
    },
    {
      id: 'divby-bouquets', kind: 'divBy',
      group: BOUQUET, groupIcon: '💐', each: 'В каждом', item: FLOWER, itemIcon: '🌷',
      text: function (v, h) {
        return 'Девочки собрали ' + h.qa(v.p, FLOWER) + ' и сделали букеты, по ' +
          h.q(v.y, FLOWER) + ' в каждом. Сколько букетов получилось?';
      }
    },
    {
      id: 'divby-boats', kind: 'divBy', y: [2, 4],
      group: BOAT, groupIcon: '🚣', each: 'В каждой', item: TOURIST, itemIcon: '🧑',
      text: function (v, h) {
        return 'В походе ' + h.q(v.p, TOURIST) + '. Для сплава по реке они сели в лодки, по ' +
          h.q(v.y, PERSON) + ' в каждую. Сколько понадобилось лодок?';
      }
    },

    /* ===== Увеличение в несколько раз ================================= */
    {
      id: 'more-trees', kind: 'more',
      a: { label: '🍁 Клёны', icon: '🍁' }, b: { label: '🌳 Берёзы', icon: '🌳' }, unit: ROW,
      text: function (v, h) {
        return 'В саду ' + h.q(v.x, ROW) + ' клёнов, а берёз — ' + h.raz(v.y) +
          ' больше. Сколько рядов берёз в саду?';
      }
    },
    {
      id: 'more-jam', kind: 'more',
      a: { label: '🍓 Малиновое', icon: '🫙' }, b: { label: '🍒 Вишнёвое', icon: '🫙' }, unit: JAR,
      text: function (v, h) {
        return 'На зиму заготовили ' + h.qa(v.x, JAR) + ' малинового варенья, а вишнёвого — ' +
          h.raz(v.y) + ' больше. Сколько банок вишнёвого варенья заготовили?';
      }
    },
    {
      id: 'more-pencil-case', kind: 'more', x: [2, 4],
      a: { label: '↔️ Ширина', icon: '🟦' }, b: { label: '📏 Длина', icon: '🟦' }, unit: CM,
      text: function (v, h) {
        return 'Ширина пенала ' + v.x + ' см, а длина — ' + h.raz(v.y) +
          ' больше. Какова длина пенала?';
      }
    },
    {
      id: 'more-pets', kind: 'more', x: [2, 5],
      a: { label: '🐱 Котёнок', icon: '🟠' }, b: { label: '🐶 Собака', icon: '🟠' }, unit: KG,
      text: function (v, h) {
        return 'Котёнок весит ' + v.x + ' кг, а собака — ' + h.raz(v.y) +
          ' больше. Сколько килограммов весит собака?';
      }
    },
    {
      id: 'more-tasks', kind: 'more',
      a: { label: '👦 Дима', icon: '📘' }, b: { label: '👧 Вика', icon: '📗' }, unit: TASK,
      text: function (v, h) {
        return 'Дима решил ' + h.qa(v.x, TASK) + ', а Вика — ' + h.raz(v.y) +
          ' больше. Сколько задач решила Вика?';
      }
    },
    {
      id: 'more-baubles', kind: 'more',
      a: { label: '🔴 Красные', icon: '🔴' }, b: { label: '🟡 Золотые', icon: '🟡' }, unit: BALL,
      text: function (v, h) {
        return 'На ёлке висят ' + v.x + ' красных ' + h.w(v.x, BALL) + ', а золотых — ' +
          h.raz(v.y) + ' больше. Сколько золотых шаров на ёлке?';
      }
    },

    /* ===== Уменьшение в несколько раз ================================= */
    {
      id: 'less-badges', kind: 'less',
      a: { label: '👦 Вова', icon: '🎖️' }, b: { label: '🧒 Олег', icon: '🎖️' }, unit: BADGE,
      text: function (v, h) {
        return 'У Вовы ' + h.q(v.p, BADGE) + ', а у Олега — ' + h.raz(v.y) +
          ' меньше. Сколько значков у Олега?';
      }
    },
    {
      id: 'less-mushrooms', kind: 'less',
      a: { label: '🍄 Лисички', icon: '🟡' }, b: { label: '🍄‍🟫 Белые', icon: '🟤' },
      aUnit: CHANTERELLE, unit: MUSHROOM,
      text: function (v, h) {
        return 'Собрали ' + h.qa(v.p, CHANTERELLE) + ', а белых грибов — ' + h.raz(v.y) +
          ' меньше. Сколько белых грибов собрали?';
      }
    },
    {
      id: 'less-notebooks', kind: 'less',
      a: { label: '🔲 В клеточку', icon: '📓' }, b: { label: '📏 В линейку', icon: '📔' },
      unit: NOTEBOOK,
      text: function (v, h) {
        return 'У Оли ' + h.q(v.p, NOTEBOOK) + ' в клеточку, а в линейку — ' + h.raz(v.y) +
          ' меньше. Сколько тетрадей в линейку у Оли?';
      }
    },
    {
      id: 'less-riddles', kind: 'less',
      a: { label: '👧 Оля', icon: '❓' }, b: { label: '👧 Варя', icon: '❓' }, unit: RIDDLE,
      text: function (v, h) {
        return 'Оля знает ' + h.qa(v.p, RIDDLE) + ', а Варя — ' + h.raz(v.y) +
          ' меньше. Сколько загадок знает Варя?';
      }
    },
    {
      id: 'less-sheep', kind: 'less',
      a: { label: '🐑 Овцы', icon: '🐑' }, b: { label: '🐐 Козы', icon: '🐐' },
      aUnit: SHEEP, unit: GOAT,
      text: function (v, h) {
        return 'На лугу пасётся стадо: овец — ' + v.p + ', а коз — ' + h.raz(v.y) +
          ' меньше. Сколько коз на лугу?';
      }
    },
    {
      id: 'less-swim', kind: 'less',
      a: { label: '👨 Папа', icon: '🌊' }, b: { label: '👦 Янка', icon: '🌊' }, unit: METER,
      text: function (v, h) {
        return 'Папа проплыл ' + v.p + ' м, а Янка — ' + h.raz(v.y) +
          ' меньше. Сколько метров проплыл Янка?';
      }
    },

    /* ===== Кратное сравнение: во сколько раз? ========================= */
    {
      id: 'cmp-foxes', kind: 'cmp', ask: 'меньше',
      a: { label: '🦊 Песцы', icon: '⚪' }, b: { label: '🦊 Лисы', icon: '🟠' },
      aUnit: ARCTIC_FOX, unit: FOX,
      text: function (v, h) {
        return 'В питомнике ' + h.q(v.p, ARCTIC_FOX) + ' и ' + h.q(v.x, FOX) +
          '. Во сколько раз меньше в питомнике лис, чем песцов?';
      }
    },
    {
      id: 'cmp-squirrel', kind: 'cmp', ask: 'меньше',
      a: { label: '🌰 Орехи', icon: '🌰' }, b: { label: '🍄 Грибы', icon: '🍄' },
      aUnit: NUT, unit: MUSHROOM,
      text: function (v, h) {
        return 'Белочка заготовила на зиму ' + h.qa(v.p, NUT) + ' и ' + h.qa(v.x, MUSHROOM) +
          '. Во сколько раз меньше заготовлено грибов, чем орехов?';
      }
    },
    {
      id: 'cmp-bikes', kind: 'cmp', ask: 'больше',
      a: { label: '🚲 Детские', icon: '🚲' }, b: { label: '🚴 Взрослые', icon: '🚲' }, unit: BIKE,
      text: function (v, h) {
        return 'В магазине продали ' + v.p + (h.isOne(v.p) ? ' детский ' : ' детских ') +
          h.w(v.p, BIKE) + ' и ' + v.x + ' взрослых. Во сколько раз больше продали ' +
          'детских велосипедов, чем взрослых?';
      }
    },
    {
      id: 'cmp-pages', kind: 'cmp', ask: 'меньше',
      a: { label: '👧 Лена', icon: '📄' }, b: { label: '👧 Оля', icon: '📄' }, unit: PAGE,
      text: function (v, h) {
        return 'Лена прочитала ' + h.qa(v.p, PAGE) + ', а Оля — ' + v.x +
          '. Во сколько раз меньше страниц прочитала Оля, чем Лена?';
      }
    },
    {
      id: 'cmp-birdhouses', kind: 'cmp', ask: 'меньше',
      a: { label: '🌳 В парке', icon: '🏠' }, b: { label: '🏫 У школы', icon: '🏠' },
      unit: BIRDHOUSE,
      text: function (v, h) {
        return 'У школы висят ' + h.q(v.x, BIRDHOUSE) + ', а в парке — ' + v.p +
          '. Во сколько раз меньше скворечников у школы, чем в парке?';
      }
    },
    {
      id: 'cmp-swim', kind: 'cmp', ask: 'больше',
      a: { label: '👦 Витя', icon: '🌊' }, b: { label: '👦 Коля', icon: '🌊' }, unit: METER,
      text: function (v) {
        return 'Витя проплыл ' + v.p + ' м, а Коля — ' + v.x +
          ' м. Во сколько раз больше проплыл Витя, чем Коля?';
      }
    },
    {
      id: 'cmp-stickers', kind: 'cmp', ask: 'больше',
      a: { label: '👧 Алеся', icon: '⭐' }, b: { label: '👦 Янка', icon: '⭐' }, unit: STICKER,
      text: function (v, h) {
        return 'У Алеси ' + h.q(v.p, STICKER) + ', а у Янки — ' + h.q(v.x, STICKER) +
          '. Во сколько раз больше наклеек у Алеси, чем у Янки?';
      }
    },

    /* ===== Косвенная форма: «это в … раз больше, чем …» =============== */
    {
      id: 'ind-more-check', kind: 'indMore',
      a: { label: '✅ Проверил', icon: '📒' }, b: { label: '⏳ Осталось', icon: '📒' },
      unit: NOTEBOOK,
      text: function (v, h) {
        return 'Учитель проверил ' + h.qa(v.p, NOTEBOOK) + '. Это ' + h.raz(v.y) +
          ' больше, чем ему осталось проверить. Сколько тетрадей осталось проверить учителю?';
      }
    },
    {
      id: 'ind-more-post', kind: 'indMore',
      a: { label: '✉️ Письма', icon: '✉️' }, b: { label: '📰 Журналы', icon: '📰' },
      aUnit: LETTER, unit: MAGAZINE,
      text: function (v, h) {
        return 'Почтальону надо разнести ' + h.qa(v.p, LETTER) + '. Это ' + h.raz(v.y) +
          ' больше, чем журналов. Сколько журналов нужно разнести почтальону?';
      }
    },
    {
      id: 'ind-more-shop', kind: 'indMore',
      a: { label: '📺 Телевизоры', icon: '📺' }, b: { label: '🫧 Стиральные машины', icon: '🫧' },
      aUnit: TV, unit: WASHER,
      text: function (v, h) {
        return 'В магазине ' + h.q(v.p, TV) + '. Это ' + h.raz(v.y) +
          ' больше, чем стиральных машин. Сколько стиральных машин в магазине?';
      }
    },

    /* ===== Косвенная форма: «это в … раз меньше, чем …» =============== */
    {
      id: 'ind-less-lines', kind: 'indLess',
      a: { label: '👧 Таня', icon: '✍️' }, b: { label: '👧 Вика', icon: '✍️' }, unit: LINE,
      text: function (v, h) {
        return 'Таня написала ' + h.qa(v.x, LINE) + '. Это ' + h.raz(v.y) +
          ' меньше, чем написала Вика. Сколько строчек написала Вика?';
      }
    },
    {
      id: 'ind-less-post', kind: 'indLess',
      a: { label: '📦 Посылки', icon: '📦' }, b: { label: '✉️ Письма', icon: '✉️' },
      aUnit: PARCEL, unit: LETTER,
      text: function (v, h) {
        return 'На почте было ' + h.q(v.x, PARCEL) + '. Это ' + h.raz(v.y) +
          ' меньше, чем писем. Сколько писем было на почте?';
      }
    },
    {
      id: 'ind-less-flour', kind: 'indLess',
      a: { label: '🥄 Взяли', icon: '🌾' }, b: { label: '🛍️ Осталось', icon: '🌾' }, unit: KG,
      text: function (v, h) {
        return 'Из мешка взяли ' + v.x + ' кг муки. Это ' + h.raz(v.y) +
          ' меньше, чем осталось в мешке. Сколько килограммов муки осталось в мешке?';
      }
    }
  ];
})();
