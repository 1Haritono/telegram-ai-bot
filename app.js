document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // STATE & CONSTANTS
    // ----------------------------------------------------
    let currentTab = 'simulator';
    let currentSimIndex = 0;
    
    // Quiz State
    let quizCurrentQuestion = 0;
    let quizScore = 0;
    let quizAnswers = []; // stores { questionIndex, selectedOptionIndex, isCorrect }

    // 21 Image Moderation Categories
    const moderationCategories = [
        { id: 'logo', name: 'Логотип Т-Банка / Tinkoff / TBANK' },
        { id: 'finance', name: 'Инвестиции и финансы (графики, крипта)' },
        { id: 'mourning', name: 'Траурная тематика (венки, гробы, свечи)' },
        { id: 'children', name: 'Дети до 12 лет (как главный объект)' },
        { id: 'religion', name: 'Религия (храмы, кресты, полумесяцы)' },
        { id: 'weapons', name: 'Оружие и Военная техника (огнестрел, танки)' },
        { id: 'alcohol', name: 'Алкоголь (бутылки, бокалы, бары)' },
        { id: 'medical', name: 'Медицинские изделия (таблетки, шприцы)' },
        { id: 'lgbt', name: 'ЛГБТ (радужные флаги, однополые пары)' },
        { id: 'insults', name: 'Оскорбления / Неприличные жесты' },
        { id: 'terrorism', name: 'Терроризм / Радикальная одежда' },
        { id: 'nazi', name: 'Нацистская символика (свастика, руны)' },
        { id: 'violence', name: 'Насилие / Драки / Издевательства' },
        { id: 'suicide', name: 'Суицид / Попытки членовредительства' },
        { id: 'cruelty', name: 'Жестокое обращение с животными' },
        { id: 'blood', name: 'Кровь / Открытые раны' },
        { id: 'nudity', name: 'Эротика / Обнаженное тело / Игрушки' }
    ];

    // Simulator Cases
    const simulatorCases = [
        {
            id: 1,
            category: 'electronics',
            categoryName: 'Электроника (Смартфоны)',
            title1: 'Смартфон Xiaomi Redmi Note 13 4G 8/256GB Global Midnight Black',
            title2: 'Xiaomi Redmi Note 13 4G 8/256GB EAC (Черный)',
            specs1: {
                'Бренд': 'Xiaomi',
                'Модель': 'Redmi Note 13 4G',
                'Цвет': 'Midnight Black (Черный)',
                'RAM': '8 ГБ',
                'ROM': '256 ГБ',
                'Регион': 'Global',
                'Состояние': 'Новый'
            },
            specs2: {
                'Бренд': 'Xiaomi',
                'Модель': 'Redmi Note 13 4G',
                'Цвет': 'Черный',
                'RAM': '8 ГБ',
                'ROM': '256 ГБ',
                'Регион': 'EAC',
                'Состояние': 'Новый'
            },
            correctStatus: '1', // Fully identical
            hint: 'В правилах Т-Банка четко указано, что различия в сертификации/регионах (EAC, Global, CN) игнорируются при мэтчинге. Цвета Midnight Black и Черный являются синонимами.',
            explanation: 'Оба смартфона имеют одинаковые технические характеристики (Redmi Note 13 4G, 8 ГБ RAM, 256 ГБ ROM). Различия в региональных версиях (EAC и Global) игнорируются. Цвета Midnight Black и Черный идентичны (синонимы). Товары должны быть склеены.',
            template: `Правильный ответ:

Из названий товаров понятно, что:
Модель: Xiaomi Redmi Note 13 4G (идентичны);
Цвет: Midnight Black / Черный (синонимы);
Оперативная память: 8 ГБ (идентичны);
Встроенная память: 256 ГБ (идентичны);
Состояние товара: Новые
✓ Оба товара новые, т.к. не указано иное;

Тип и комплектация: 2 physical Nano-SIM (идентичны).

ВЫВОД:
Полностью идентичные товары.
Все физические характеристики, бренд и модель совпадают. Разница в регионе дистрибуции (Global/EAC) по правилам игнорируется.
Можно объединить в одну товарную карточку.`
        },
        {
            id: 2,
            category: 'electronics',
            categoryName: 'Электроника (Ловушка Редиректа)',
            title1: 'Смартфон Apple iPhone 15 128GB Black (EAC)',
            title2: 'Apple iPhone 15 256GB Black (EAC) [Ссылка перенаправила]',
            specs1: {
                'Бренд': 'Apple',
                'Модель': 'iPhone 15',
                'Цвет': 'Black',
                'RAM': '6 ГБ',
                'ROM': '128 ГБ',
                'Состояние': 'Новый'
            },
            specs2: {
                'Бренд': 'Apple',
                'Модель': 'iPhone 15',
                'Цвет': 'Black',
                'RAM': '6 ГБ',
                'ROM': '256 ГБ (из-за отсутствия 128ГБ)',
                'Состояние': 'Новый'
            },
            correctStatus: '2', // Different variants
            hint: 'Обратите внимание: кликнув по ссылке продавца на 128GB, вы перенаправились на 256GB из-за отсутствия товара на складе. Оценивайте ИСХОДНУЮ карточку, а не ту, на которую перенаправило.',
            explanation: 'Это классическая ловушка авто-редиректа. В базе числился iPhone 15 128GB против iPhone 15 256GB. Различия по объему памяти (128GB vs 256GB) представляют собой разные варианты одной модели.',
            template: `Правильный ответ:

Из названий товаров понятно, что:
Модель: Apple iPhone 15 (идентичны);
Цвет: Black (идентичны);
Оперативная память: 6 ГБ (идентичны);
Встроенная память: 128 ГБ / 256 ГБ (различаются);
Состояние товара: Новые
✓ Оба товара новые, т.к. не указано иное;

Тип и комплектация: 1 Nano-SIM + eSIM.

ВЫВОД:
Различные варианты одной и той же модели одного бренда.
Модель и цвет совпадают, но имеется различие в объеме встроенной памяти (128 ГБ и 256 ГБ).
Товары подлежат объединению в одну карточку с переключателем памяти.`
        },
        {
            id: 3,
            category: 'electronics',
            categoryName: 'Электроника (Линейные модификаторы)',
            title1: 'Смартфон HONOR X7b 8/128GB Изумрудный зеленый',
            title2: 'Смартфон HONOR X7c 8/128GB Зеленый',
            specs1: {
                'Бренд': 'HONOR',
                'Модель': 'X7b',
                'Цвет': 'Изумрудный зеленый',
                'RAM': '8 ГБ',
                'ROM': '128 ГБ',
                'Процессор': 'Snapdragon 680'
            },
            specs2: {
                'Бренд': 'HONOR',
                'Модель': 'X7c',
                'Цвет': 'Зеленый',
                'RAM': '8 ГБ',
                'ROM': '128 ГБ',
                'Процессор': 'MediaTek Helio G85'
            },
            correctStatus: '3', // Completely different
            hint: 'Буквенные суффиксы "b" и "c" в названиях HONOR X7b и X7c указывают на совершенно разные платформы и поколения устройств.',
            explanation: 'Буквы-модификаторы X7b и X7c определяют разные поколения смартфонов с отличающимся дизайном, процессорами и дисплеями. Объединять их строго запрещено.',
            template: `Правильный ответ:

Из названий товаров понятно, что:
Модель: HONOR X7b / X7c (различаются линейными суффиксами);
Цвет: Изумрудный зеленый / Зеленый (синонимы);
Оперативная память: 8 ГБ (идентичны);
Встроенная память: 128 ГБ (идентичны);
Состояние товара: Новые
✓ Оба товара новые.

Тип и комплектация: 2 Nano-SIM.

ВЫВОД:
Полностью отличаются.
Разные базовые модели с отличающимися процессорами и суффиксами в названии серии (X7b против X7c).
Карточки должны быть разделены.`
        },
        {
            id: 4,
            category: 'beauty',
            categoryName: 'Косметика и Уход',
            title1: 'Увлажняющий дневной крем для лица Garnier Сияние 50мл',
            title2: 'Питательный ночной крем для лица Garnier Сияние 50мл',
            specs1: {
                'Бренд': 'Garnier',
                'Серия': 'Сияние',
                'Тип крема': 'Дневной увлажняющий',
                'Объем': '50 мл'
            },
            specs2: {
                'Бренд': 'Garnier',
                'Серия': 'Сияние',
                'Тип крема': 'Ночной питательный',
                'Объем': '50 мл'
            },
            correctStatus: '3', // Completely different
            hint: 'Формула и время нанесения косметики (дневной крем vs ночной крем) меняют назначение продукта. Можно ли их мэтчить как варианты?',
            explanation: 'Назначение крема (Дневной vs Ночной) определяет совершенно разную химическую формулу и правила использования. Это разные товары, мэтчить их как варианты одной карточки запрещено.',
            template: `Правильный ответ:

Из названий товаров понятно, что:
Модель: Garnier Сияние Дневной / Ночной крем (различаются типом);
Цвет: Не применимо;
Оперативная память: Не применимо;
Встроенная память: Не применимо;
Состояние товара: Новые
✓ Продукты в фабричной упаковке.

Тип и комплектация: Объем 50 мл (идентичны).

ВЫВОД:
Полностью отличаются.
Дневной и ночной кремы имеют разную формулу, текстуру и функциональное назначение. Объединение в одну карточку запрещено.
Карточки должны существовать раздельно.`
        },
        {
            id: 5,
            category: 'appliances',
            categoryName: 'Бытовая техника (Вендоркод)',
            title1: 'Духовой шкаф Maunfeld EOEM.516B черный',
            title2: 'Встраиваемая духовка Maunfeld EOEM.516S серебристый',
            specs1: {
                'Бренд': 'Maunfeld',
                'Вендоркод': 'EOEM.516B',
                'Цвет': 'Черный',
                'Объем': '51 л'
            },
            specs2: {
                'Бренд': 'Maunfeld',
                'Вендоркод': 'EOEM.516S',
                'Цвет': 'Серебристый',
                'Объем': '51 л'
            },
            correctStatus: '2', // Different variants
            hint: 'Вендоркоды отличаются только последним символом (B - Black, S - Silver). Это классическая разметка вариантов.',
            explanation: 'Вендоркоды отличаются только финальной буквой (EOEM.516B vs EOEM.516S), обозначающей цвет модели (Black/Silver). Это варианты одной модели, они группируются в одну карточку.',
            template: `Правильный ответ:

Из названий товаров понятно, что:
Модель: Maunfeld EOEM.516 (идентичны);
Цвет: Черный / Серебристый (различаются);
Оперативная память: Не применимо;
Встроенная память: Не применимо;
Состояние товара: Новые
✓ Оба духовых шкафа поставляются новыми.

Тип и комплектация: Объем камеры 51 литр (идентичны).

ВЫВОД:
Различные варианты одной и той же модели одного бренда.
Товары отличаются только цветом корпуса, что отражено в последней литере вендоркода (B/S).
Рекомендуется объединить в одну карточку с переключателем цвета.`
        },
        {
            id: 6,
            category: 'rooms',
            categoryName: 'Отели (Т-Путешествия)',
            title1: 'Запрос: Номер Стандарт с балконом, 2 взрослых',
            title2: 'Предложение отеля: Номер Стандарт (Superior Balcony), 2 взрослых',
            specs1: {
                'Тип номера': 'Стандарт',
                'Качество': 'Standard',
                'Размещение': '2 взрослых',
                'Балкон': 'Требуется'
            },
            specs2: {
                'Тип номера': 'Стандарт',
                'Качество': 'Superior (Выше стандарта)',
                'Размещение': '2 взрослых',
                'Балкон': 'Есть (Superior Balcony)'
            },
            correctStatus: 'fit', // Fits! (For rooms we use custom buttons)
            hint: 'Качество "Superior" выше запрашиваемого "Standard". Балкон в предложении присутствует. Подходит ли такое предложение клиенту?',
            explanation: 'Предложение превышает или полностью покрывает требования клиента. Тип совпадает (Standard), качество выше (Superior - допустимо в пользу клиента), балкон присутствует, вместимость соответствует. Оффер подходит.',
            template: `Запрос: Стандарт с балконом (2 взрослых)
Оффер: Standard Superior Balcony (2 взрослых)

Вывод по правилам Т-Путешествий:
Оффер ПОЛНОСТЬЮ ПОДХОДИТ.
Качество номера выше требуемого (Superior взамен Standard, что разрешено), балкон физически присутствует в описании номера отеля. Вместимость соответствует.`
        },
        {
            id: 7,
            category: 'rooms',
            categoryName: 'Отели (Т-Путешествия - Баланс Балкона)',
            title1: 'Запрос: Люкс (Suite) с балконом, 2 взрослых',
            title2: 'Предложение отеля: Люкс (Suite) с французским балконом, 2 взрослых',
            specs1: {
                'Тип номера': 'Люкс (Suite)',
                'Балкон': 'Требуется'
            },
            specs2: {
                'Тип номера': 'Люкс (Suite)',
                'Балкон': 'Французский балкон'
            },
            correctStatus: 'not_fit',
            hint: 'В правилах четко указано: "French balcony" (французский балкон) НЕ является настоящим балконом.',
            explanation: 'В запросе явно требуется балкон. Французский балкон представляет собой ограждение прямо перед панорамным окном без выступающей площадки. Согласно инструкции, французский балкон не удовлетворяет требованию о наличии полноценного балкона.',
            template: `Запрос: Люкс с балконом
Оффер: Люкс с французским балконом

Вывод по правилам Т-Путешествий:
Оффер НЕ ПОДХОДИТ.
Французский балкон не приравнивается к полноценному балкону по правилам разметки. Условие клиента о наличии балкона не выполнено.`
        },
        {
            id: 8,
            category: 'moderation',
            categoryName: 'Модерация Изображений (CV)',
            imageUrl: 'tbank_card_promo.webp', // We will generate placeholder / use SVGs in render
            correctStatus: 'violation',
            violations: ['logo'],
            hint: 'На рекламном баннере отчетливо виден логотип Т-Банка или его символика. Относится ли это к категории "Лого Т-Банка"?',
            explanation: 'Изображение содержит официальный логотип Т-Банка в качестве промо-материала. Это прямое попадание под 1-ю категорию нарушений ("Лого Т-Банка").',
            template: `Результат модерации изображения:
Выявлено нарушение: Лого Т-Банка.
На рекламном баннере присутствует товарный знак / логотип банка.`
        },
        {
            id: 9,
            category: 'moderation',
            categoryName: 'Модерация Изображений (CV - Финансы)',
            imageUrl: 'crypto_chart.webp',
            correctStatus: 'violation',
            violations: ['finance'],
            hint: 'На графике отображены биржевые свечи, курсы валют или биткоин.',
            explanation: 'Биржевые графики, свечи и символы криптовалют относятся к категории "Инвестиции и финансы". Изображение должно быть размечено с этим флагом.',
            template: `Результат модерации изображения:
Выявлено нарушение: Инвестиции и финансы.
На скриншоте присутствуют биржевые графики свечного типа и значки криптовалют.`
        }
    ];

    // Quiz Questions (10 items)
    const quizQuestions = [
        {
            question: "Как нужно разметить товары: Смартфон TECNO Spark 20C 8/256GB и TECNO Spark 30C 8/256GB?",
            context: "Характеристики полностью совпадают, цвета одинаковые. Разница только в поколении (Spark 20C против 30C).",
            options: [
                "Полностью идентичные товары (склеить в одну кнопку)",
                "Различные варианты одной и той же модели (группировать)",
                "Полностью отличаются (разделить в разные карточки)",
                "Не хватает информации"
            ],
            correctIndex: 2,
            explanation: "Буквенные и числовые модификаторы линеек (Spark 20C vs 30C) обозначают разные поколения устройств и аппаратные платформы. Склеивать их нельзя ни в каком виде."
        },
        {
            question: "Что делать с версиями смартфона EAC (РСТ) и CN (Китай) при мэтчинге, если все физические свойства идентичны?",
            context: "Один товар подписан как EAC, второй — как китайская версия CN.",
            options: [
                "Разделить как полностью отличающиеся",
                "Склеить как полностью идентичные (игнорировать регион)",
                "Группировать как варианты одной модели",
                "Отправить на ручную доработку (не хватает информации)"
            ],
            correctIndex: 1,
            explanation: "Региональные сертификации (EAC, Global, CN, Ростест) по правилам Т-Банка полностью игнорируются при мэтчинге. Товары считаются идентичными."
        },
        {
            question: "Можно ли объединять в одну карточку товары с разным состоянием: Новый смартфон и Восстановленный (Refurbished/Б.У.)?",
            context: "Модель, цвет, память совпадают на 100%.",
            options: [
                "Да, как разные варианты одной модели",
                "Да, как полностью идентичные товары",
                "Нет, это полностью отличающиеся товары",
                "Только если восстановлен на официальном заводе"
            ],
            correctIndex: 2,
            explanation: "Инструкция строго запрещает склеивать Новые товары с бывшими в употреблении (Б/У) или восстановленными (Refurbished) устройствами."
        },
        {
            question: "В косметике: Шампунь Garnier Fructis Sos 400 мл и Кондиционер Garnier Fructis Sos 400 мл. Какое решение?",
            context: "Одна серия, один бренд, один объем.",
            options: [
                "Полностью идентичные товары",
                "Различные варианты одной модели (группировать с переключателем)",
                "Полностью отличаются (разделить)",
                "Не хватает информации"
            ],
            correctIndex: 2,
            explanation: "Шампунь и кондиционер — это разные типы продуктов. Объединять разные типы продуктов в косметике запрещено, даже если они из одной линейки."
        },
        {
            question: "Какое из этих отличий в косметике НЕЛЬЗЯ группировать как варианты?",
            context: "Что делает косметические средства абсолютно разными товарами?",
            options: [
                "Объем упаковки (30 мл против 50 мл)",
                "Разный аромат / запах (Лаванда против Розы)",
                "Количество штук в комплекте (5 шт против 10 шт)",
                "Тон косметического средства (оттенки помады)"
            ],
            correctIndex: 1,
            explanation: "Разные запахи/ароматы (Лаванда, Роза, Цитрус и т.д.) делают косметический продукт уникальным, объединять их в одну карточку запрещено."
        },
        {
            question: "Вендоркод пылесоса: EACM-16 HP/N3 на первом сайте и EACM-14 FM/N3 на втором. Это...",
            context: "По данным из спецификаций, они отличаются только мощностью и цветом.",
            options: [
                "Полностью идентичные товары",
                "Различные варианты одной и той же модели",
                "Полностью отличаются",
                "Не хватает информации"
            ],
            correctIndex: 1,
            explanation: "Если вендоркоды бытовой техники различаются только в конце строки (обозначая цвет, размер или мощность), и они сгруппированы на сайтах продавцов, их мэтчат как варианты."
        },
        {
            question: "Запрос в Т-Путешествиях: Люкс с балконом. Оффер: Люкс с французским балконом. Подходит ли оффер?",
            context: "Все остальные характеристики отеля совпадают.",
            options: [
                "Да, подходит",
                "Нет, не подходит",
                "Подходит только со скидкой",
                "Не хватает информации для принятия решения"
            ],
            correctIndex: 1,
            explanation: "Французский балкон не является полноценным балконом. Если клиент явно запросил балкон, оффер с французским балконом считается не подходящим."
        },
        {
            question: "Запрос в Т-Путешествиях: Номер Стандарт. Оффер: Номер Люкс (Suite). Подходит ли оффер?",
            context: "Вместимость и дата совпадают.",
            options: [
                "Да, подходит (повышение категории разрешено)",
                "Нет, не подходит (тип номера должен строго совпадать)",
                "Подходит только если Люкс дешевле стандарта",
                "Не хватает информации"
            ],
            correctIndex: 1,
            explanation: "Тип номера (Standard, Suite, Apartment, Studio) обязан строго совпадать. Превышение категории номера на другой тип (например, Люкс вместо Стандарта) считается несовпадением."
        },
        {
            question: "Изображение: Чат поддержки Т-Банка с логом транзакции, прикрепленный к отзыву. Какое нарушение по правилам CV модерации?",
            context: "На скриншоте видна надпись 'Т-Банк' и желтая плашка сообщения.",
            options: [
                "Нарушение 'Лого Т-Банка' (нужно флагнуть)",
                "Нарушение 'Инвестиции и финансы'",
                "Нарушений нет (логотип в контексте системного интерфейса не флагуется)",
                "Нарушение 'Оскорбления'"
            ],
            correctIndex: 2,
            explanation: "Надписи, скриншоты чатов, выписки и логотипы в контексте обычных пользовательских скриншотов без прямой рекламы НЕ флагуются как нарушение логотипа."
        },
        {
            question: "Какое изображение относится к категории 'Траурная тематика'?",
            context: "Модерация картинок.",
            options: [
                "Надгробие на старинном кладбище с крестом",
                "Букет из 15 красных роз на фоне свадебной арки",
                "Цветы рядом с горящими свечами или похоронные венки",
                "Изображение осеннего леса с опавшими листьями"
            ],
            correctIndex: 2,
            explanation: "Похоронные венки, гробы, кремационные урны и цветы рядом с горящими свечами однозначно классифицируются как 'Траурная тематика'. Одинокие могилы с религиозным контекстом без атрибутов похорон идут в категорию 'Религия'."
        }
    ];

    // ----------------------------------------------------
    // DOM ELEMENTS
    // ----------------------------------------------------
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Simulator DOM
    const simCategoryBadge = document.getElementById('sim-category');
    const simProgressText = document.getElementById('sim-progress');
    const prevSimBtn = document.getElementById('prev-sim-btn');
    const nextSimBtn = document.getElementById('next-sim-btn');
    const comparisonContainer = document.getElementById('comparison-container');
    const statusOptionButtons = document.querySelectorAll('.status-option-btn');
    const checkDecisionBtn = document.getElementById('check-decision-btn');
    const showHintBtn = document.getElementById('show-hint-btn');
    const feedbackPanel = document.getElementById('feedback-panel');
    const feedbackStatusTitle = document.getElementById('feedback-status-title');
    const feedbackText = document.getElementById('feedback-text');
    const feedbackTemplateCode = document.getElementById('feedback-template-code');
    const copyFeedbackBtn = document.getElementById('copy-feedback-template');
    const imageModerationSelector = document.getElementById('image-moderation-selector');
    const violationsCheckboxesContainer = document.querySelector('.violations-checkboxes');
    
    // Rulebook DOM
    const ruleNavButtons = document.querySelectorAll('.rule-nav-btn');
    const rulebookContentArea = document.getElementById('rulebook-content-area');
    
    // Generator DOM
    const genCategory = document.getElementById('gen-category');
    const genModel = document.getElementById('gen-model');
    const genColor = document.getElementById('gen-color');
    const genRam = document.getElementById('gen-ram');
    const genRom = document.getElementById('gen-rom');
    const genState = document.getElementById('gen-state');
    const genSpecs = document.getElementById('gen-specs');
    const genStatus = document.getElementById('gen-status');
    const genJustification = document.getElementById('gen-justification');
    const genAction = document.getElementById('gen-action');
    const generatedMarkdownCode = document.getElementById('generated-markdown-code');
    const copyGeneratedBtn = document.getElementById('copy-generated-btn');

    // Quiz DOM
    const quizStartScreen = document.getElementById('quiz-start-screen');
    const quizQuestionScreen = document.getElementById('quiz-question-screen');
    const quizResultScreen = document.getElementById('quiz-result-screen');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizQuestionNum = document.getElementById('quiz-question-num');
    const quizProgressBar = document.getElementById('quiz-progress-bar');
    const quizQuestionText = document.getElementById('quiz-question-text');
    const quizQuestionContext = document.getElementById('quiz-question-context');
    const quizOptionsContainer = document.getElementById('quiz-options-container');
    const quizSubmitBtn = document.getElementById('quiz-submit-btn');
    const quizResultScore = document.getElementById('quiz-result-score');
    const quizResultTitle = document.getElementById('quiz-result-title');
    const quizResultDesc = document.getElementById('quiz-result-desc');
    const quizResultBreakdown = document.getElementById('quiz-result-breakdown');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    // Add Reset All UI button handler
    const resetAllBtn = document.getElementById('reset-all-btn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', () => {
            // Reset state variables
            currentTab = 'simulator';
            currentSimIndex = 0;
            quizCurrentQuestion = 0;
            quizScore = 0;
            quizAnswers = [];
            // Switch to default tab
            switchTab('simulator');
            // Additional UI resets if needed
            if (feedbackPanel) feedbackPanel.classList.add('hidden');
        });
    }

    // ----------------------------------------------------
    // INITIALIZATION & TAB NAVIGATION
    // ----------------------------------------------------
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    function switchTab(tabId) {
        currentTab = tabId;
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        tabContents.forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Specific Tab Init Logic
        if (tabId === 'rulebook') {
            renderRulebook('electronics');
        } else if (tabId === 'generator') {
            updateGeneratedTemplate();
        }
    }

    // ----------------------------------------------------
    // SIMULATOR LOGIC
    // ----------------------------------------------------
    let selectedStatusValue = null;

    function renderSimulatorCase(index) {
        const item = simulatorCases[index];
        selectedStatusValue = null;
        feedbackPanel.classList.add('hidden');
        
        // Reset selections
        statusOptionButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Progress text
        simProgressText.textContent = `Кейс ${index + 1} из ${simulatorCases.length}`;
        simCategoryBadge.textContent = item.categoryName;

        // Dynamic render of comparison area
        comparisonContainer.innerHTML = '';
        
        if (item.category === 'moderation') {
            // Render Image Moderation view
            imageModerationSelector.classList.remove('hidden');
            // Hide standard status options and show custom binary moderation options
            document.querySelector('.status-selector-grid').innerHTML = `
                <button class="status-option-btn" data-status="no_violation">
                    <span class="status-name">Нарушений нет</span>
                    <span class="status-desc">Изображение соответствует правилам размещения.</span>
                </button>
                <button class="status-option-btn" data-status="violation">
                    <span class="status-name">Есть нарушения</span>
                    <span class="status-desc">Выберите категории нарушений ниже.</span>
                </button>
            `;
            
            // Re-bind click event to newly created buttons
            const newStatusButtons = document.querySelectorAll('.status-selector-grid .status-option-btn');
            newStatusButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    newStatusButtons.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedStatusValue = btn.getAttribute('data-status');
                    
                    const listContainer = document.getElementById('image-moderation-selector');
                    if (selectedStatusValue === 'violation') {
                        listContainer.style.display = 'block';
                    } else {
                        listContainer.style.display = 'none';
                        // uncheck checkboxes
                        document.querySelectorAll('.violation-label input').forEach(input => input.checked = false);
                    }
                });
            });

            // Render CV moderation checkboxes
            violationsCheckboxesContainer.innerHTML = '';
            moderationCategories.forEach(cat => {
                const label = document.createElement('label');
                label.className = 'violation-label';
                label.innerHTML = `
                    <input type="checkbox" value="${cat.id}">
                    <span>${cat.name}</span>
                `;
                violationsCheckboxesContainer.appendChild(label);
            });

            // Main display card
            comparisonContainer.innerHTML = `
                <div class="moderation-card-content">
                    <div class="moderation-image-container">
                        <div class="image-placeholder">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            <span>[Изображение: ${item.imageUrl}]</span>
                            <span style="font-size: 0.8rem; margin-top:0.5rem; text-align:center; padding: 0 10px;">${item.categoryName === 'Модерация Изображений (CV - Финансы)' ? 'Скриншот котировок Биткоина и графиков свечей' : 'Рекламный плакат Т-Банка с логотипом'}</span>
                        </div>
                    </div>
                </div>
            `;
            
        } else if (item.category === 'rooms') {
            imageModerationSelector.classList.add('hidden');
            imageModerationSelector.style.display = 'none';
            // Show custom Room status buttons
            document.querySelector('.status-selector-grid').innerHTML = `
                <button class="status-option-btn" data-status="fit">
                    <span class="status-name">Подходит (Мэтч)</span>
                    <span class="status-desc">Оффер удовлетворяет все критерии запроса покупателя.</span>
                </button>
                <button class="status-option-btn" data-status="not_fit">
                    <span class="status-name">Не подходит</span>
                    <span class="status-desc">Несовпадение типа номера, вместимости или отсутствие балкона.</span>
                </button>
            `;
            
            const newStatusButtons = document.querySelectorAll('.status-selector-grid .status-option-btn');
            newStatusButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    newStatusButtons.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedStatusValue = btn.getAttribute('data-status');
                });
            });

            // Two cards for Room Request and Hotel Offer
            renderTwoCards(item.title1, item.specs1, item.title2, item.specs2);

        } else {
            // Standard Products
            imageModerationSelector.classList.add('hidden');
            imageModerationSelector.style.display = 'none';
            
            // Standard choices
            document.querySelector('.status-selector-grid').innerHTML = `
                <button class="status-option-btn" data-status="1">
                    <span class="status-num">1</span>
                    <span class="status-name">Полностью идентичные</span>
                    <span class="status-desc">Слияние в одну карточку. Совпадает всё до мелочей.</span>
                </button>
                <button class="status-option-btn" data-status="2">
                    <span class="status-num">2</span>
                    <span class="status-name">Разные варианты</span>
                    <span class="status-desc">Разный цвет, объем, память или размер одной модели.</span>
                </button>
                <button class="status-option-btn" data-status="3">
                    <span class="status-num">3</span>
                    <span class="status-name">Полностью отличаются</span>
                    <span class="status-desc">Разные бренды, линейки (Pro/Max), типы товаров или Б/У.</span>
                </button>
                <button class="status-option-btn" data-status="4">
                    <span class="status-num">4</span>
                    <span class="status-name">Не хватает информации</span>
                    <span class="status-desc">Противоречивые спецификации или отсутствие важных данных.</span>
                </button>
            `;
            
            const newStatusButtons = document.querySelectorAll('.status-selector-grid .status-option-btn');
            newStatusButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    newStatusButtons.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedStatusValue = btn.getAttribute('data-status');
                });
            });

            renderTwoCards(item.title1, item.specs1, item.title2, item.specs2);
        }
    }

    function renderTwoCards(title1, specs1, title2, specs2) {
        let tableRows1 = '';
        for (const [key, value] of Object.entries(specs1)) {
            tableRows1 += `<tr><td class="label">${key}</td><td class="value">${value}</td></tr>`;
        }
        let tableRows2 = '';
        for (const [key, value] of Object.entries(specs2)) {
            tableRows2 += `<tr><td class="label">${key}</td><td class="value">${value}</td></tr>`;
        }

        comparisonContainer.innerHTML = `
            <div class="product-card">
                <h4>Товар / Запрос 1</h4>
                <div class="product-title">${title1}</div>
                <table class="product-meta-table">${tableRows1}</table>
            </div>
            <div class="product-card">
                <h4>Товар / Предложение 2</h4>
                <div class="product-title">${title2}</div>
                <table class="product-meta-table">${tableRows2}</table>
            </div>
        `;
    }

    // Prev / Next bindings
    prevSimBtn.addEventListener('click', () => {
        if (currentSimIndex > 0) {
            currentSimIndex--;
            renderSimulatorCase(currentSimIndex);
        }
    });

    nextSimBtn.addEventListener('click', () => {
        if (currentSimIndex < simulatorCases.length - 1) {
            currentSimIndex++;
            renderSimulatorCase(currentSimIndex);
        }
    });

    showHintBtn.addEventListener('click', () => {
        const item = simulatorCases[currentSimIndex];
        alert(`Подсказка: ${item.hint}`);
    });

    checkDecisionBtn.addEventListener('click', () => {
        if (!selectedStatusValue) {
            alert('Пожалуйста, выберите один из вариантов решения!');
            return;
        }

        const item = simulatorCases[currentSimIndex];
        let isCorrect = false;

        if (item.category === 'moderation') {
            const checkedBoxes = Array.from(document.querySelectorAll('.violation-label input:checked')).map(el => el.value);
            if (selectedStatusValue === item.correctStatus) {
                if (selectedStatusValue === 'violation') {
                    // Check if selected violations match
                    const hasCorrectViolations = item.violations.every(v => checkedBoxes.includes(v)) && checkedBoxes.length === item.violations.length;
                    isCorrect = hasCorrectViolations;
                } else {
                    isCorrect = true;
                }
            }
        } else {
            isCorrect = (selectedStatusValue === item.correctStatus);
        }

        // Show feedback panel
        feedbackPanel.classList.remove('hidden');
        if (isCorrect) {
            feedbackPanel.className = 'sidebar-block glass-panel explanation-card correct';
            feedbackStatusTitle.innerHTML = '<span class="icon">✓</span><h4>Правильно!</h4>';
        } else {
            feedbackPanel.className = 'sidebar-block glass-panel explanation-card incorrect';
            feedbackStatusTitle.innerHTML = '<span class="icon">✗</span><h4>Ошибка в ответе</h4>';
        }
        
        feedbackText.textContent = item.explanation;
        feedbackTemplateCode.textContent = item.template;
    });

    copyFeedbackBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(feedbackTemplateCode.textContent);
        alert('Шаблон скопирован в буфер обмена!');
    });

    // ----------------------------------------------------
    // RULEBOOK LOGIC
    // ----------------------------------------------------
    ruleNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            ruleNavButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderRulebook(btn.getAttribute('data-rule'));
        });
    });

    function renderRulebook(ruleId) {
        if (ruleId === 'electronics') {
            rulebookContentArea.innerHTML = `
                <h3>📱 Смартфоны и Электроника</h3>
                <p>Мэтчинг электроники требует предельной точности в отношении брендов, суффиксов линеек, объемов памяти и физического состояния устройств.</p>
                
                <h4>1. Допускается группировка в одну карточку (Варианты):</h4>
                <ul>
                    <li><strong>Цвет (Color):</strong> Синонимичные названия переводятся (Black / Черный), разные расцветки связываются переключателями цветов в карточке.</li>
                    <li><strong>Память (RAM / ROM):</strong> Спецификации по ОЗУ и встроенной памяти считаются вариантами конфигурации одной модели (например, 128ГБ и 256ГБ).</li>
                    <li><strong>Конфигурация SIM-карт:</strong> Версии с одной SIM, Dual-SIM или поддержкой eSIM объединяются в одну карточку.</li>
                </ul>

                <h4>2. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО объединять (Полностью отличаются):</h4>
                <ul>
                    <li><strong>Буквенные и цифровые суффиксы:</strong> Pro, Max, Plus, Ultra, а также индексы серий (HONOR X7b vs X7c) указывают на кардинальные отличия аппаратной части.</li>
                    <li><strong>Состояние товара:</strong> Новый смартфон ни в коем случае нельзя объединять с Б/У, уцененными или восстановленными (Refurbished) устройствами.</li>
                </ul>

                <div class="rules-comparison-grid">
                    <div class="rule-compare-card do-match">
                        <h5>✓ Варианты / Идентичные</h5>
                        <p>iPhone 15 Pro 128GB EAC (Grey) <br><strong>и</strong><br> iPhone 15 Pro 256GB Global (Серый)</p>
                    </div>
                    <div class="rule-compare-card dont-match">
                        <h5>✗ Разные карточки (Разделять)</h5>
                        <p>Samsung Galaxy S24 Ultra <br><strong>и</strong><br> Samsung Galaxy S24 Plus (Разные линейки)</p>
                    </div>
                </div>
            `;
        } else if (ruleId === 'beauty') {
            rulebookContentArea.innerHTML = `
                <h3>🧴 Косметика и Уход</h3>
                <p>Категория косметики чувствительна к назначению средств, типам кожи, объемам флаконов и комплектности.</p>
                
                <h4>1. Группировка разрешена (Варианты):</h4>
                <ul>
                    <li><strong>Оттенок (Тон / Код):</strong> Разные цвета губных помад, лаков для ногтей, оттенки тональных средств.</li>
                    <li><strong>Объем и вес:</strong> Упаковки крема 30 мл и 50 мл, флаконы мицеллярной воды 200 мл и 400 мл.</li>
                    <li><strong>Количество (Штуки):</strong> Наборы спонжей по 5, 10 или 50 штук одного типа.</li>
                </ul>

                <h4>2. ЗАПРЕЩЕНО мэтчить:</h4>
                <ul>
                    <li><strong>Тип продукта:</strong> Шампунь и ополаскиватель/кондиционер одной линейки — это разные товары.</li>
                    <li><strong>Тип кожи / Формула:</strong> Дневной крем и Ночной крем; крем для жирной кожи и сухой кожи.</li>
                    <li><strong>Ароматы / Отдушки:</strong> Крем с запахом розы и кокоса — разные товары.</li>
                    <li><strong>Подарочные наборы:</strong> Набор "Крем + Маска" нельзя склеивать с отдельной баночкой этого крема.</li>
                </ul>
            `;
        } else if (ruleId === 'appliances') {
            rulebookContentArea.innerHTML = `
                <h3>🔌 Бытовая техника и Вендоркоды</h3>
                <p>В бытовой технике вендоркод (код производителя) является главным идентификатором товара.</p>
                
                <h4>Правила сопоставления по вендоркодам:</h4>
                <ul>
                    <li><strong>Полное совпадение:</strong> Если вендоркоды полностью одинаковы (например, <i>EOEM.516B</i> на обоих сайтах) — товары мэтчатся как полностью идентичные.</li>
                    <li><strong>Различие в последнем символе:</strong> Небольшие изменения на концах кодов (например, <i>602</i> vs <i>606</i>) часто кодируют цвет или комплект поставки. Это группируется как варианты одной карточки.</li>
                    <li><strong>Различия в написании:</strong> Пробелы, тире и регистр (<i>DW6083PRT</i> vs <i>DW 6083P-RT</i>) считаются опечатками форматирования. Товары считаются идентичными, если характеристики совпадают.</li>
                    <li><strong>Отсутствие кода:</strong> Если у обоих товаров нет кодов и модель размыта, выставляется статус "Не хватает информации".</li>
                </ul>
            `;
        } else if (ruleId === 'rooms') {
            rulebookContentArea.innerHTML = `
                <h3>🏨 Отели и комнаты (Т-Путешествия)</h3>
                <p>Сравнение предложений комнат отелей опирается на соответствие типа комнаты и неконфликтность ее параметров.</p>
                
                <h4>Ключевые параметры разметки:</h4>
                <ul>
                    <li><strong>Тип комнаты (Обязательно):</strong> Standard, Studio, Apartment, Suite, Capsule, Villa. Если типы комнат различаются, оффер не подходит.</li>
                    <li><strong>Качество:</strong> Повышение класса (например, Deluxe вместо Standard) разрешено. Понижение — нет.</li>
                    <li><strong>Балкон:</strong> Если в запросе оговорен балкон, в предложении он обязан присутствовать. Понятие "Французский балкон" балконом не является.</li>
                    <li><strong>Спальные места:</strong> Sofa/Sofa-bed считается дополнительным местом. King/Queen/Double взаимозаменяемы для двух человек.</li>
                </ul>
            `;
        } else if (ruleId === 'moderation') {
            rulebookContentArea.innerHTML = `
                <h3>🖼️ Модерация Изображений (CV)</h3>
                <p>Анализ изображений на предмет контентных нарушений и соответствия стандартам Т-Банка.</p>
                
                <h4>Популярные категории нарушений:</h4>
                <ul>
                    <li><strong>Логотип Т-Банка:</strong> Флагуются все явные изображения бренда, надписи "Tinkoff", "Т-Банк", "TBANK" на рекламных баннерах. <i>Исключение:</i> Скриншоты личных кабинетов в текстах отзывов не флагуются.</li>
                    <li><strong>Инвестиции и финансы:</strong> Флагуются биржевые котировки, финансовые графики, иконки Биткоина и других криптовалют.</li>
                    <li><strong>Траурная тематика:</strong> Цветы у гроба, ритуальные венки, горящие похоронные свечи.</li>
                    <li><strong>Дети:</strong> Дети в возрасте до 12 лет, являющиеся центральным объектом съемки.</li>
                    <li><strong>Оружие:</strong> Огнестрельное оружие, ножи боевого назначения, танки, беспилотники военного типа.</li>
                </ul>
            `;
        }
    }

    // ----------------------------------------------------
    // TEMPLATE GENERATOR LOGIC
    // ----------------------------------------------------
    const generatorInputs = [genCategory, genModel, genColor, genRam, genRom, genState, genSpecs, genStatus, genJustification, genAction];
    
    generatorInputs.forEach(input => {
        input.addEventListener('input', updateGeneratedTemplate);
        input.addEventListener('change', updateGeneratedTemplate);
    });

    function updateGeneratedTemplate() {
        const category = genCategory.value;
        const model = genModel.value || '[Не указано]';
        const color = genColor.value || '[Не указано]';
        const ram = (category === 'beauty' || category === 'other') ? 'Не применимо' : (genRam.value || '[Не указано]');
        const rom = (category === 'beauty' || category === 'other') ? 'Не применимо' : (genRom.value || '[Не указано]');
        
        let stateText = 'Новые';
        let stateCheck = 'Оба товара новые, т.к. не указано иное / нет упоминаний уценки';
        if (genState.value === 'used') {
            stateText = 'Уцененный / Б/У';
            stateCheck = 'Товары отличаются по состоянию (один из товаров уценен или восстановлен)';
        }

        const specs = genSpecs.value || '[Не указано]';
        const status = genStatus.value;
        const justification = genJustification.value || '[Укажите детальное обоснование со ссылкой на правила инструкции]';
        const action = genAction.value || 'Можно объединить в одну товарную карточку';

        const markdownResult = `Правильный ответ:

Из названий товаров понятно, что:
Модель: ${model};
Цвет: ${color};
Оперативная память: ${ram};
Встроенная память: ${rom};
Состояние товара: ${stateText}
✓ [${stateCheck}];

Тип и комплектация: ${specs}.

ВЫВОД:
${status}.
${justification}.
${action}.`;

        generatedMarkdownCode.textContent = markdownResult;
    }

    copyGeneratedBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(generatedMarkdownCode.textContent);
        alert('Сгенерированный Markdown скопирован в буфер обмена!');
    });

    // ----------------------------------------------------
    // QUIZ LOGIC
    // ----------------------------------------------------
    startQuizBtn.addEventListener('click', () => {
        quizStartScreen.classList.remove('active');
        quizQuestionScreen.classList.add('active');
        quizCurrentQuestion = 0;
        quizScore = 0;
        quizAnswers = [];
        loadQuizQuestion(quizCurrentQuestion);
    });

    function loadQuizQuestion(index) {
        const q = quizQuestions[index];
        quizQuestionNum.textContent = `Вопрос ${index + 1} из ${quizQuestions.length}`;
        quizProgressBar.style.width = `${((index + 1) / quizQuestions.length) * 100}%`;
        quizQuestionText.textContent = q.question;
        quizQuestionContext.textContent = q.context;

        // Render Options
        quizOptionsContainer.innerHTML = '';
        q.options.forEach((opt, oIdx) => {
            const label = document.createElement('label');
            label.className = 'quiz-option-label';
            label.innerHTML = `
                <input type="radio" name="quiz_opt" value="${oIdx}">
                <span>${opt}</span>
            `;
            
            label.addEventListener('click', () => {
                document.querySelectorAll('.quiz-option-label').forEach(el => el.classList.remove('selected'));
                label.classList.add('selected');
                const radio = label.querySelector('input');
                if (radio) radio.checked = true;
            });

            quizOptionsContainer.appendChild(label);
        });
    }

    quizSubmitBtn.addEventListener('click', () => {
        const selectedOption = document.querySelector('input[name="quiz_opt"]:checked');
        if (!selectedOption) {
            alert('Пожалуйста, выберите один вариант ответа!');
            return;
        }

        const selectedIndex = parseInt(selectedOption.value, 10);
        const q = quizQuestions[quizCurrentQuestion];
        const isCorrect = (selectedIndex === q.correctIndex);

        if (isCorrect) {
            quizScore++;
        }

        quizAnswers.push({
            questionIndex: quizCurrentQuestion,
            selectedOptionIndex: selectedIndex,
            isCorrect: isCorrect
        });

        quizCurrentQuestion++;

        if (quizCurrentQuestion < quizQuestions.length) {
            loadQuizQuestion(quizCurrentQuestion);
        } else {
            showQuizResults();
        }
    });

    function showQuizResults() {
        quizQuestionScreen.classList.remove('active');
        quizResultScreen.classList.add('active');
        
        quizResultScore.textContent = `${quizScore}/${quizQuestions.length}`;
        
        const pct = (quizScore / quizQuestions.length) * 100;
        
        if (pct >= 80) {
            quizResultTitle.textContent = 'Квалификация пройдена!';
            quizResultDesc.textContent = `Поздравляем! Вы набрали ${pct}%. Вы отлично ориентируетесь в правилах мэтчинга и модерации Т-Банка.`;
            document.querySelector('.result-score-circle').style.borderColor = 'var(--success)';
        } else {
            quizResultTitle.textContent = 'Квалификация не пройдена';
            quizResultDesc.textContent = `Вы набрали только ${pct}%. Пожалуйста, перечитайте справочник правил и попробуйте пройти тест еще раз.`;
            document.querySelector('.result-score-circle').style.borderColor = 'var(--error)';
        }

        // Render Breakdown details
        quizResultBreakdown.innerHTML = '';
        quizAnswers.forEach((ans, idx) => {
            const q = quizQuestions[ans.questionIndex];
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `
                <span class="result-item-q">${idx + 1}. ${q.question}</span>
                <span class="result-item-badge ${ans.isCorrect ? 'correct' : 'incorrect'}">
                    ${ans.isCorrect ? 'Правильно' : 'Ошибка'}
                </span>
            `;
            quizResultBreakdown.appendChild(div);
        });
    }

    restartQuizBtn.addEventListener('click', () => {
        quizResultScreen.classList.remove('active');
        quizStartScreen.classList.add('active');
    });

    // ----------------------------------------------------
    // SETUP INITIAL SIMULATOR CASE
    // ----------------------------------------------------
    renderSimulatorCase(currentSimIndex);
});
