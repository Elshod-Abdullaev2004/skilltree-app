const express = require("express");
const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

// Полный словарь из 10 вопросов для каждого навыка (Fallback)
const FALLBACK_10_QUESTIONS = {
  ru: {
    HTML: [
      {
        question: "Какой семантический тег используется для основного уникального содержимого веб-страницы?",
        options: ["<section>", "<main>", "<article>", "<div>"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой тег хранит метаданные документа, заголовок и ссылки на внешние стили?",
        options: ["<header>", "<head>", "<meta>", "<script>"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой обязательный атрибут тега <img> задает текстовое описание для скринридеров и при сбое загрузки?",
        options: ["title", "description", "alt", "aria-label"],
        correctAnswerIndex: 2,
      },
      {
        question: "Какой элемент HTML5 группирует связанные элементы формы с общей рамкой?",
        options: ["<fieldset>", "<group>", "<form-group>", "<section>"],
        correctAnswerIndex: 0,
      },
      {
        question: "Какой семантический тег лучше всего подходит для независимой публикации (статья блога, карточка товара)?",
        options: ["<aside>", "<section>", "<article>", "<content>"],
        correctAnswerIndex: 2,
      },
      {
        question: "Что объявляет строка <!DOCTYPE html> в первой строке документа?",
        options: ["Версию HTML 4.01", "Режим соответствия стандарту HTML5", "Кодировку UTF-8", "Поддержку XML"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой атрибут ссылки <a> указывает браузеру открыть страницу в новой вкладке?",
        options: ["target=\"_blank\"", "target=\"_new\"", "open=\"newtab\"", "rel=\"external\""],
        correctAnswerIndex: 0,
      },
      {
        question: "Какой элемент предназначен для боковой панели или контента, косвенно связанного с основным материалом?",
        options: ["<nav>", "<aside>", "<sidebar>", "<summary>"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой современный HTML-атрибут позволяет включить нативную отложенную загрузку изображений?",
        options: ["defer=\"true\"", "loading=\"lazy\"", "async", "fetchpriority=\"low\""],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой элемент используется для интерактивного раскрывающегося блока в связке с <summary>?",
        options: ["<accordion>", "<dropdown>", "<details>", "<collapse>"],
        correctAnswerIndex: 2,
      },
    ],
    CSS: [
      {
        question: "Какое свойство Flexbox выравнивает дочерние элементы вдоль главной оси контейнера?",
        options: ["align-items", "justify-content", "flex-direction", "align-content"],
        correctAnswerIndex: 1,
      },
      {
        question: "Как ведет себя элемент со свойством position: absolute?",
        options: [
          "Остается в обычном потоке документа",
          "Позиционируется относительно окна браузера",
          "Позиционируется относительно ближайшего предка с position не static",
          "Фиксируется при прокрутке страницы",
        ],
        correctAnswerIndex: 2,
      },
      {
        question: "Какая единица измерения в CSS рассчитывается относительно размера шрифта корневого элемента <html>?",
        options: ["em", "rem", "vh", "%"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какое правило включает подсчет ширины блока с учетом внутреннего отступа (padding) и границы (border)?",
        options: ["box-sizing: content-box", "box-sizing: border-box", "display: flow-root", "outline: border-box"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какое значение display создает полноценную двухмерную сетку из строк и столбцов?",
        options: ["inline-grid", "flex", "grid", "table"],
        correctAnswerIndex: 2,
      },
      {
        question: "Какой псевдокласс CSS выбирает каждый второй (четный) элемент среди дочерних?",
        options: [":nth-child(even)", ":nth-of-type(odd)", ":even", ":nth(2)"],
        correctAnswerIndex: 0,
      },
      {
        question: "Какое свойство определяет порядок наложения перекрывающихся позиционированных элементов?",
        options: ["layer-index", "z-index", "order", "stack-level"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какое свойство CSS отвечает за плавный переход между различными состояниями элемента?",
        options: ["animation", "transform", "transition", "will-change"],
        correctAnswerIndex: 2,
      },
      {
        question: "Как правильно написать медиа-запрос для экранов с шириной не более 768 пикселей?",
        options: ["@media (min-width: 768px)", "@media screen and (max-width: 768px)", "@device (width <= 768px)", "@query (max-width: 768)"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какое свойство управляет поведением содержимого, если оно не помещается в границы блока?",
        options: ["clip-path", "overflow", "scroll-behavior", "contain"],
        correctAnswerIndex: 1,
      },
    ],
    JavaScript: [
      {
        question: "Какой результат вернет выражение typeof null в стандарте JavaScript?",
        options: ["\"null\"", "\"undefined\"", "\"object\"", "\"number\""],
        correctAnswerIndex: 2,
      },
      {
        question: "Чем объявление переменной через const отличается от let?",
        options: [
          "const имеет функциональную область видимости, а let — блочную",
          "const запрещает повторное присваивание значения переменной",
          "const делает все свойства вложенных объектов неизменяемыми",
          "const не поднимается (no hoisting), а let поднимается",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Что вернет вызов выражения: Boolean([]) && Boolean({})?",
        options: ["false", "true", "undefined", "TypeError"],
        correctAnswerIndex: 1,
      },
      {
        question: "Что такое Event Loop (цикл событий) в среде JavaScript?",
        options: [
          "Библиотека для бесконечных циклов анимаций",
          "Механизм координации выполнения кода, сбора событий и выполнения задач из очередей",
          "Встроенный сборщик мусора V8",
          "Специальный хук React для таймеров",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Что возвращает метод Promise.all(), если хотя бы один из промисов отклонен (rejected)?",
        options: [
          "Массив успешных результатов",
          "Промис, который немедленно отклоняется с ошибкой первого упавшего промиса",
          "undefined",
          "Объект со всеми статусами выполнения",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Что такое замыкание (closure) в JavaScript?",
        options: [
          "Способ закрытия браузерной вкладки через скрипт",
          "Комбинация функции и лексического окружения, в котором эта функция была объявлена",
          "Блокировка объекта от модификации через Object.freeze()",
          "Специальный синтаксис для try...catch",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой метод массива проверяет, удовлетворяет ли хотя бы один элемент условию функции-предиката?",
        options: ["every()", "find()", "some()", "filter()"],
        correctAnswerIndex: 2,
      },
      {
        question: "Что делает оператор опциональной цепочки (?.) в выражении user?.address?.street?",
        options: [
          "Вызывает ошибку TypeError, если user не найден",
          "Возвращает undefined, если свойство слева равно null или undefined, не вызывая ошибку",
          "Присваивает дефолтное значение",
          "Проверяет типы TypeScript в рантайме",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой метод сериализует JavaScript-объект в строку JSON?",
        options: ["JSON.parse()", "JSON.stringify()", "JSON.encode()", "Object.toJSON()"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какое ключевое слово используется для перехвата исключений в асинхронной функции с await?",
        options: ["catchError", "try...catch", "onError", "rescue"],
        correctAnswerIndex: 1,
      },
    ],
    React: [
      {
        question: "Какой хук в React используется для сохранения состояния между рендерами функционального компонента?",
        options: ["useEffect", "useMemo", "useState", "useRef"],
        correctAnswerIndex: 2,
      },
      {
        question: "Для чего в хуке useEffect передается второй аргумент (массив зависимостей)?",
        options: [
          "Для передачи данных в дочерние компоненты",
          "Для указания переменных, при изменении которых эффект должен перезапуститься",
          "Для сортировки элементов списка",
          "Для блокировки рендера",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Зачем при рендере списка элементов в React каждому элементу нужен уникальный проп key?",
        options: [
          "Для стилизации элементов через CSS",
          "Для оптимизации сравнения виртуального дерева DOM и сохранения идентичности узлов",
          "Для автоматической сортировки массива",
          "Это обязательное требование HTML5",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Что делает хук useMemo в React?",
        options: [
          "Сохраняет ссылку на DOM-элемент",
          "Мемоизирует вычисленное значение и пересчитывает его только при изменении зависимостей",
          "Мемоизирует инстанс функционального компонента",
          "Предотвращает закрытие браузера",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Что возвращает хук useRef(initialValue)?",
        options: [
          "Массив из значения и функции-сеттера",
          "Мутабельный объект со свойством .current, изменение которого не вызывает ререндер",
          "Промис с DOM-элементом",
          "Новую копию компонента",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Какое основное правило необходимо соблюдать при вызове хуков в React?",
        options: [
          "Хуки можно вызывать внутри любых циклов и условий if",
          "Хуки следует вызывать только на верхнем уровне функционального компонента",
          "Хуки обязаны вызываться асинхронно через async/await",
          "Хуки вызываются только внутри обработчиков событий onClick",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Для чего используется React Context API?",
        options: [
          "Для замены базы данных на клиенте",
          "Для передачи данных через дерево компонентов без необходимости прокидывать пропсы вручную",
          "Для отправки сетевых запросов к серверу",
          "Для настройки роутинга в браузере",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Что такое React Fragment (<>...</>)?",
        options: [
          "Специальный тип ошибки React",
          "Синтаксис для группировки списка дочерних элементов без создания лишнего узла в DOM",
          "Инструмент для разметки SVG",
          "Альтернатива тегу <html>",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Как передать данные из дочернего компонента в родительский?",
        options: [
          "Через глобальную переменную window",
          "Передав в дочерний компонент колбэк-функцию через props и вызвав ее с данными",
          "С помощью оператора export",
          "React запрещает передачу данных наверх",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Что такое «чистый компонент» (Pure Component) в React?",
        options: [
          "Компонент, не содержащий CSS-стилей",
          "Компонент, который при одинаковых пропсах и состоянии возвращает идентичный JSX без побочных эффектов",
          "Компонент, написанный строго на чистом JavaScript без JSX",
          "Компонент без единой строчки комментариев",
        ],
        correctAnswerIndex: 1,
      },
    ],
    "Next.js": [
      {
        question: "В какой директории в Next.js 13+ (App Router) создаются страницы и маршруты приложения?",
        options: ["pages/", "app/", "routes/", "src/components/"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой тип компонентов создается по умолчанию внутри директории app/ в Next.js?",
        options: ["Client Components", "Server Components", "Static Components", "Edge Components"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какая директива указывает Next.js, что файл является клиентским компонентом?",
        options: ["\"use client\"", "\"client-only\"", "\"use browser\"", "\"export client\""],
        correctAnswerIndex: 0,
      },
      {
        question: "Какой специальный файл в App Router задает общий макет (header, footer) для сегмента маршрута?",
        options: ["template.tsx", "layout.tsx", "main.tsx", "wrapper.tsx"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой компонент Next.js обеспечивает клиентскую навигацию с предварительной загрузкой (prefetching)?",
        options: ["<NavLink>", "<Link>", "<RouteLink>", "<Navigate>"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой файл в папке маршрута автоматически перехватывает ошибки и отображает Fallback UI?",
        options: ["catch.tsx", "error.tsx", "fallback.tsx", "danger.tsx"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какая директива объявляет серверное действие (Server Action) для вызова функции напрямую на сервере?",
        options: ["\"use server\"", "\"server action\"", "\"use api\"", "\"action server\""],
        correctAnswerIndex: 0,
      },
      {
        question: "Какой файл в App Router автоматически отображает скелетон или индикатор загрузки при переходе?",
        options: ["spinner.tsx", "loading.tsx", "pending.tsx", "skeleton.tsx"],
        correctAnswerIndex: 1,
      },
      {
        question: "В чем главное преимущество компонента next/image перед обычным тегом <img>?",
        options: [
          "Поддерживает только формат PNG",
          "Автоматическая оптимизация размера, адаптивность, современные форматы (WebP/AVIF) и lazy-loading",
          "Удаляет фон у фотографий",
          "Преобразует 2D картинки в 3D",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Как в серверном компоненте страницы app/tree/[id]/page.tsx получить параметр id?",
        options: ["Через useParams()", "Через асинхронный/синхронный объект props.params", "Через router.query.id", "Через window.location"],
        correctAnswerIndex: 1,
      },
    ],
    Tailwind: [
      {
        question: "Какой класс Tailwind CSS задает полужирное начертание шрифта (font-weight: 700)?",
        options: ["font-medium", "font-bold", "text-bold", "font-black"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой класс включает режим Flexbox для элемента в Tailwind CSS?",
        options: ["d-flex", "display-flex", "flex", "flexbox"],
        correctAnswerIndex: 2,
      },
      {
        question: "Что означает префикс md: в классе md:flex?",
        options: [
          "Стиль применяется только на экранах среднего размера и шире (от 768px)",
          "Стиль применяется только в темной теме",
          "Элемент отображается с анимацией",
          "Стиль применяется только на экранах меньше 768px",
        ],
        correctAnswerIndex: 0,
      },
      {
        question: "Какой класс задает внутренний отступ (padding) со всех четырех сторон в 16px (1rem)?",
        options: ["p-16", "p-4", "pad-1rem", "padding-4"],
        correctAnswerIndex: 1,
      },
      {
        question: "Как задать состояние при наведении курсора мыши (hover) для цвета фона?",
        options: ["hover:bg-blue-500", "onHover-bg-blue", ":hover(bg-blue)", "bg-hover-blue"],
        correctAnswerIndex: 0,
      },
      {
        question: "Какой класс делает углы элемента полностью круглыми (border-radius: 9999px)?",
        options: ["rounded-circle", "rounded-full", "rounded-max", "radius-pill"],
        correctAnswerIndex: 1,
      },
      {
        question: "Как в Tailwind CSS использовать произвольное точное значение, например ширину 340px?",
        options: ["w(340px)", "w-[340px]", "width-340", "custom-w-340"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой класс скрывает элемент (display: none)?",
        options: ["display-none", "invisible", "hidden", "none"],
        correctAnswerIndex: 2,
      },
      {
        question: "Какой класс центрирует блочный элемент с заданной шириной по горизонтали?",
        options: ["center-x", "mx-auto", "align-center", "m-center"],
        correctAnswerIndex: 1,
      },
      {
        question: "Какой класс задает плотную черную тень со смещением 4px 4px для стиля нео-брутализма?",
        options: ["shadow-[4px_4px_0px_#000]", "drop-shadow-brutal", "shadow-hard-4", "border-shadow-4"],
        correctAnswerIndex: 0,
      },
    ],
  },
  uz: {
    HTML: [
      {
        question: "Veb-sahifaning asosiy noyob mazmunini ifodalash uchun qaysi semantik teg ishlatiladi?",
        options: ["<section>", "<main>", "<article>", "<div>"],
        correctAnswerIndex: 1,
      },
      {
        question: "Hujjatning metama'lumotlari, sarlavhasi va tashqi uslub havolalari qaysi teg ichida saqlanadi?",
        options: ["<header>", "<head>", "<meta>", "<script>"],
        correctAnswerIndex: 1,
      },
      {
        question: "<img> tegida rasm yuklanmay qolganda yoki skrinriderlar uchun muqobil matn qaysi atribut bilan beriladi?",
        options: ["title", "description", "alt", "aria-label"],
        correctAnswerIndex: 2,
      },
      {
        question: "HTML5 da forma elementlarini umumiy hoshiya bilan guruhlash uchun qaysi teg ishlatiladi?",
        options: ["<fieldset>", "<group>", "<form-group>", "<section>"],
        correctAnswerIndex: 0,
      },
      {
        question: "Mustaqil maqola, post yoki mahsulot kartochkasi uchun eng mos semantik teg qaysi?",
        options: ["<aside>", "<section>", "<article>", "<content>"],
        correctAnswerIndex: 2,
      },
      {
        question: "Hujjat boshidagi <!DOCTYPE html> yozuvi nimani bildiradi?",
        options: ["HTML 4.01 versiyasini", "Hujjat HTML5 standartiga muvofiqligini", "UTF-8 kodirovkasini", "XML qo'llab-quvvatlashini"],
        correctAnswerIndex: 1,
      },
      {
        question: "<a> havolasini yangi brauzer oynasida (tab) ochish uchun qaysi atribut ishlatiladi?",
        options: ["target=\"_blank\"", "target=\"_new\"", "open=\"newtab\"", "rel=\"external\""],
        correctAnswerIndex: 0,
      },
      {
        question: "Asosiy mazmunga bilvosita bog'liq yon panel (sidebar) yoki qo'shimcha ma'lumot qaysi tegda joylashadi?",
        options: ["<nav>", "<aside>", "<sidebar>", "<summary>"],
        correctAnswerIndex: 1,
      },
      {
        question: "Rasmlarning kechiktirilgan (lazy) yuklanishini yoqish uchun qaysi HTML atributi ishlatiladi?",
        options: ["defer=\"true\"", "loading=\"lazy\"", "async", "fetchpriority=\"low\""],
        correctAnswerIndex: 1,
      },
      {
        question: "<summary> tegi bilan birgalikda ochiluvchi blok (akkordeon) yaratish uchun qaysi teg ishlatiladi?",
        options: ["<accordion>", "<dropdown>", "<details>", "<collapse>"],
        correctAnswerIndex: 2,
      },
    ],
    CSS: [
      {
        question: "Flexbox-da elementlarni asosiy o'q bo'ylab tekislash uchun qaysi xususiyat ishlatiladi?",
        options: ["align-items", "justify-content", "flex-direction", "align-content"],
        correctAnswerIndex: 1,
      },
      {
        question: "position: absolute xususiyatiga ega element o'zini qanday tutadi?",
        options: [
          "Oddiy oqimda qoladi",
          "Brauzer oynasiga nisbatan joylashadi",
          "Eng yaqin position static bo'lmagan ota elementga nisbatan joylashadi",
          "Skroll qilinganda ekranda qotib turadi",
        ],
        correctAnswerIndex: 2,
      },
      {
        question: "CSS-da ildiz <html> elementi shrift o'lchamiga bog'liq bo'lgan birlik qaysi?",
        options: ["em", "rem", "vh", "%"],
        correctAnswerIndex: 1,
      },
      {
        question: "Blok kengligiga padding va border qo'shilib hisoblanishini qaysi xususiyat ta'minlaydi?",
        options: ["box-sizing: content-box", "box-sizing: border-box", "display: flow-root", "outline: border-box"],
        correctAnswerIndex: 1,
      },
      {
        question: "Qatorlar va ustunlardan iborat 2 o'lchamli to'r yaratish uchun display qanday bo'lishi kerak?",
        options: ["inline-grid", "flex", "grid", "table"],
        correctAnswerIndex: 2,
      },
      {
        question: "Har bir juft elementni tanlash uchun qaysi CSS psevdoklassi ishlatiladi?",
        options: [":nth-child(even)", ":nth-of-type(odd)", ":even", ":nth(2)"],
        correctAnswerIndex: 0,
      },
      {
        question: "Elementlarning bir-birining ustiga chiqish tartibini (Z o'qi bo'yicha) qaysi xususiyat belgilaydi?",
        options: ["layer-index", "z-index", "order", "stack-level"],
        correctAnswerIndex: 1,
      },
      {
        question: "Element holatlari orasidagi silliq o'tishni qaysi CSS xususiyati ta'minlaydi?",
        options: ["animation", "transform", "transition", "will-change"],
        correctAnswerIndex: 2,
      },
      {
        question: "Kengligi 768px gacha bo'lgan ekranlar uchun media so'rov qanday yoziladi?",
        options: ["@media (min-width: 768px)", "@media screen and (max-width: 768px)", "@device (width <= 768px)", "@query (max-width: 768)"],
        correctAnswerIndex: 1,
      },
      {
        question: "Agar kontent blok chegarasidan chiqib ketsa, uni boshqarish uchun qaysi xususiyat ishlatiladi?",
        options: ["clip-path", "overflow", "scroll-behavior", "contain"],
        correctAnswerIndex: 1,
      },
    ],
    JavaScript: [
      {
        question: "JavaScript standartida typeof null ifodasi qanday natija qaytaradi?",
        options: ["\"null\"", "\"undefined\"", "\"object\"", "\"number\""],
        correctAnswerIndex: 2,
      },
      {
        question: "const orqali o'zgaruvchi e'lon qilish let dan nimasi bilan farq qiladi?",
        options: [
          "const funksional ko'rinishga ega, let esa blokli",
          "const o'zgaruvchiga qayta qiymat biriktirishni taqiqlaydi",
          "const ob'ektning barcha ichki xususiyatlarini avtomatik muzlatadi",
          "const o'zgaruvchilari yuqoriga ko'tarilmaydi (no hoisting)",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Boolean([]) && Boolean({}) ifodasining natijasi nima bo'ladi?",
        options: ["false", "true", "undefined", "TypeError"],
        correctAnswerIndex: 1,
      },
      {
        question: "JavaScript-da Event Loop (hodisalar tsikli) nima vazifani bajaradi?",
        options: [
          "Animatsiyalar uchun cheksiz tsikl kutubxonasi",
          "Kod bajarilishi, asinxron hodisalar va navbatlarni (task queues) muvofiqlashtiruvchi mexanizm",
          "Xotirani tozalovchi V8 mexanizmi",
          "Faqat taymerlar uchun maxsus hook",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Promise.all() metodida bitta promiz xato (reject) bersa, nima sodir bo'ladi?",
        options: [
          "Muvaffaqiyatli promizlar natijasi qaytadi",
          "Darhol birinchi yuz bergan xato bilan reject bo'ladi",
          "undefined qaytadi",
          "Barcha promizlar holatini qaytaradi",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "JavaScript-da closure (yopilish) nima?",
        options: [
          "Brauzer oynasini skript orqali yopish usuli",
          "Funksiya va u e'lon qilingan leksik muhit (lexical environment) birikmasi",
          "Object.freeze orqali ob'ektni himoyalash",
          "try...catch xatoliklarni ushlash bloki",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Massiv elementlarining kamida bittasi shartni qanoatlantirishini qaysi metod tekshiradi?",
        options: ["every()", "find()", "some()", "filter()"],
        correctAnswerIndex: 2,
      },
      {
        question: "Optional chaining (?.) operatori user?.address?.street ifodasida nima qiladi?",
        options: [
          "Agar user topilmasa, TypeError xatosini chiqaradi",
          "Agar chap tarafdagi xususiyat null yoki undefined bo'lsa, xatosiz undefined qaytaradi",
          "Standart qiymat belgilaydi",
          "TypeScript turlarini runtime da tekshiradi",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "JavaScript ob'ektini JSON matniga (string) aylantirish uchun qaysi metod ishlatiladi?",
        options: ["JSON.parse()", "JSON.stringify()", "JSON.encode()", "Object.toJSON()"],
        correctAnswerIndex: 1,
      },
      {
        question: "Asinxron funksiyada (async/await) xatoliklarni ushlash uchun qaysi konstruktsiya ishlatiladi?",
        options: ["catchError", "try...catch", "onError", "rescue"],
        correctAnswerIndex: 1,
      },
    ],
    React: [
      {
        question: "React funksional komponentlarida holatni (state) saqlash uchun qaysi hook ishlatiladi?",
        options: ["useEffect", "useMemo", "useState", "useRef"],
        correctAnswerIndex: 2,
      },
      {
        question: "useEffect hookidagi ikkinchi argument (bog'liqliklar massivi) nima uchun kerak?",
        options: [
          "Bolalar komponentiga ma'lumot uzatish uchun",
          "Ushbu qiymatlar o'zgargandagina effekt qayta ishga tushishi uchun",
          "Ro'yxat elementlarini saralash uchun",
          "Render qilishni butunlay to'xtatish uchun",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "React-da ro'yxatlarni render qilishda nima uchun har bir elementga key propi kerak?",
        options: [
          "CSS orqali stillash uchun",
          "Virtual DOM taqqoslashini optimallashtirish va element o'ziga xosligini saqlash uchun",
          "Massivni avtomatik tartiblash uchun",
          "Bu HTML5 ning majburiy talabi",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "useMemo hooki React-da nima vazifani bajaradi?",
        options: [
          "DOM elementiga havola saqlaydi",
          "Hisoblangan qiymatni keshlaydi (memoizatsiya) va faqat bog'liqliklar o'zgarganda qayta hisoblaydi",
          "Komponent nusxasini xotirada saqlaydi",
          "Brauzerni yopilishdan himoyalaydi",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "useRef(initialValue) hooki nima qaytaradi?",
        options: [
          "Qiymat va setter funktsiyasidan iborat massiv",
          "O'zgaruvchan .current xususiyatiga ega ob'ekt, uning o'zgarishi qayta render chaqirmaydi",
          "DOM elementi bilan Promis",
          "Komponentning yangi nusxasini",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "React hooklarini chaqirishda qaysi asosiy qoidaga amal qilish shart?",
        options: [
          "Hooklarni har qanday tsikl yoki if shartlari ichida chaqirish mumkin",
          "Hooklarni faqat funksional komponentning eng yuqori qismida chaqirish kerak",
          "Hooklar faqat asinxron chaqirilishi shart",
          "Hooklar faqat onClick hodisasida ishlaydi",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "React Context API nima maqsadda ishlatiladi?",
        options: [
          "Mijoz tarafida ma'lumotlar bazasini almashtirish uchun",
          "Props drilling qilmasdan daraxt bo'ylab ma'lumotlarni global uzatish uchun",
          "Serverga so'rov yuborish uchun",
          "Brauzer marshrutlarini sozlash uchun",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "React Fragment (<>...</>) nima?",
        options: [
          "React xatoliklarining maxsus turi",
          "DOM-da ortiqcha tugun (div) yaratmasdan elementlarni guruhlash sintaksisi",
          "SVG chizish uchun vosita",
          "<html> tegining o'rnini bosuvchi",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Bolalar komponentidan ota komponentga ma'lumot qanday uzatiladi?",
        options: [
          "window global o'zgaruvchisi orqali",
          "Ota komponentdan props orqali callback funktsiya berib, bolada uni chaqirish orqali",
          "export operatori orqali",
          "React ma'lumotni yuqoriga uzatishga ruxsat bermaydi",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "React-da toza komponent (Pure Component) nima?",
        options: [
          "CSS stillari bo'lmagan komponent",
          "Bir xil props va state uchun nojo'ya ta'sirlarsiz har doim bir xil JSX qaytaruvchi komponent",
          "Faqat toza JS da yozilgan komponent",
          "Ichida izohlar bo'lmagan komponent",
        ],
        correctAnswerIndex: 1,
      },
    ],
    "Next.js": [
      {
        question: "Next.js 13+ (App Router) da sahifalar va marshrutlar qaysi papkada yaratiladi?",
        options: ["pages/", "app/", "routes/", "src/components/"],
        correctAnswerIndex: 1,
      },
      {
        question: "Next.js app/ papkasida komponentlar sukut bo'yicha (default) qanday turda yaratiladi?",
        options: ["Client Components", "Server Components", "Static Components", "Edge Components"],
        correctAnswerIndex: 1,
      },
      {
        question: "Komponentni mijoz (brauzer) komponenti qilish uchun fayl boshiga nima yoziladi?",
        options: ["\"use client\"", "\"client-only\"", "\"use browser\"", "\"export client\""],
        correctAnswerIndex: 0,
      },
      {
        question: "App Router-da marshrut segmenti uchun umumiy qobiqni (header, footer) qaysi fayl belgilaydi?",
        options: ["template.tsx", "layout.tsx", "main.tsx", "wrapper.tsx"],
        correctAnswerIndex: 1,
      },
      {
        question: "Next.js-da oldindan yuklash (prefetching) bilan tezkor o'tishni qaysi komponent ta'minlaydi?",
        options: ["<NavLink>", "<Link>", "<RouteLink>", "<Navigate>"],
        correctAnswerIndex: 1,
      },
      {
        question: "Marshrut papkasida xatoliklarni avtomatik ushlab qolib Fallback UI ko'rsatuvchi fayl qaysi?",
        options: ["catch.tsx", "error.tsx", "fallback.tsx", "danger.tsx"],
        correctAnswerIndex: 1,
      },
      {
        question: "Server funktsiyalarini to'g'ridan-to'g'ri serverda bajarish uchun Server Action qanday e'lon qilinadi?",
        options: ["\"use server\"", "\"server action\"", "\"use api\"", "\"action server\""],
        correctAnswerIndex: 0,
      },
      {
        question: "App Router-da sahifa yuklanish holatini avtomatik ko'rsatish uchun qaysi fayl yaratiladi?",
        options: ["spinner.tsx", "loading.tsx", "pending.tsx", "skeleton.tsx"],
        correctAnswerIndex: 1,
      },
      {
        question: "next/image komponentining oddiy <img> tegiga nisbatan asosiy afzalligi nima?",
        options: [
          "Faqat PNG formatini qo'llab-quvvatlaydi",
          "Avtomatik o'lcham optimallashtirish, moslashuvchanlik, zamonaviy formatlar (WebP/AVIF) va lazy loading",
          "Rasmlar fonini avtomatik olib tashlaydi",
          "2D rasmlarni 3D ga aylantiradi",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "app/tree/[id]/page.tsx server komponentida [id] parametrini qanday olish mumkin?",
        options: ["useParams() orqali", "props.params ob'ekti orqali", "router.query.id orqali", "window.location orqali"],
        correctAnswerIndex: 1,
      },
    ],
    Tailwind: [
      {
        question: "Tailwind CSS-da qalin shriftni (font-weight: 700) o'rnatish uchun qaysi klass ishlatiladi?",
        options: ["font-medium", "font-bold", "text-bold", "font-black"],
        correctAnswerIndex: 1,
      },
      {
        question: "Tailwind CSS-da Flexbox rejimini yoqish uchun qaysi klass yoziladi?",
        options: ["d-flex", "display-flex", "flex", "flexbox"],
        correctAnswerIndex: 2,
      },
      {
        question: "md:flex klassidagi md: prefiksi nimani bildiradi?",
        options: [
          "Stil faqat o'rtacha va undan katta ekranlarda (768px+) qo'llaniladi",
          "Stil faqat qorong'i mavzuda qo'llaniladi",
          "Element animatsiya bilan paydo bo'ladi",
          "Stil faqat 768px dan kichik ekranlarda qo'llaniladi",
        ],
        correctAnswerIndex: 0,
      },
      {
        question: "To'rt tomondan 16px (1rem) ichki bo'shliq (padding) berish uchun qaysi klass ishlatiladi?",
        options: ["p-16", "p-4", "pad-1rem", "padding-4"],
        correctAnswerIndex: 1,
      },
      {
        question: "Sichqoncha ko'rsatkichi ustiga kelgandagi (hover) fon rangini qanday berish mumkin?",
        options: ["hover:bg-blue-500", "onHover-bg-blue", ":hover(bg-blue)", "bg-hover-blue"],
        correctAnswerIndex: 0,
      },
      {
        question: "Element burchaklarini to'liq doira (border-radius: 9999px) qilish uchun qaysi klass ishlatiladi?",
        options: ["rounded-circle", "rounded-full", "rounded-max", "radius-pill"],
        correctAnswerIndex: 1,
      },
      {
        question: "Tailwind CSS-da ixtiyoriy aniq qiymatni (masalan, 340px kenglik) qanday berish mumkin?",
        options: ["w(340px)", "w-[340px]", "width-340", "custom-w-340"],
        correctAnswerIndex: 1,
      },
      {
        question: "Elementni ekrandan yashirish (display: none) uchun qaysi klass ishlatiladi?",
        options: ["display-none", "invisible", "hidden", "none"],
        correctAnswerIndex: 2,
      },
      {
        question: "Kengligi cheklangan blokni gorizontal markazlashtirish uchun qaysi klass ishlatiladi?",
        options: ["center-x", "mx-auto", "align-center", "m-center"],
        correctAnswerIndex: 1,
      },
      {
        question: "Neo-brutalizm uslubidagi 4px 4px qora qattiq soya berish uchun qaysi klass mos keladi?",
        options: ["shadow-[4px_4px_0px_#000]", "drop-shadow-brutal", "shadow-hard-4", "border-shadow-4"],
        correctAnswerIndex: 0,
      },
    ],
  },
};

/**
 * Очищает ответ модели от возможных markdown-оберток и парсит массив из 10 вопросов
 */
function parseAndValidateGemini10Questions(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Пустой ответ от Gemini");
  }

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const data = JSON.parse(cleaned);
  let rawList = [];

  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && Array.isArray(data.questions)) {
    rawList = data.questions;
  } else {
    throw new Error("Ответ модели не является массивом вопросов");
  }

  const validQuestions = [];
  for (const item of rawList) {
    if (
      item &&
      item.question &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      typeof item.correctAnswerIndex === "number" &&
      item.correctAnswerIndex >= 0 &&
      item.correctAnswerIndex <= 3
    ) {
      validQuestions.push({
        question: String(item.question).trim(),
        options: item.options.map((opt) => String(opt).trim()),
        correctAnswerIndex: Math.floor(item.correctAnswerIndex),
      });
    }
  }

  if (validQuestions.length === 0) {
    throw new Error("В ответе Gemini нет валидных вопросов");
  }

  return validQuestions;
}

/**
 * GET /api/questions/generate
 * Генерация экзамена из 10 вопросов по навыку с помощью Gemini 2.5 Flash
 * Query параметры:
 * - skill: название навыка (HTML, CSS, JavaScript, React, Next.js, Tailwind, etc.)
 * - language: язык вопроса (ru или uz)
 */
async function generateHandler(req, res) {
  const skill = (req.query.skill || "JavaScript").toString().trim();
  const language = (req.query.language || "ru").toString().toLowerCase().trim();
  const isUz = language === "uz";

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY;

  const prompt = isUz
    ? `Siz IT sohasidagi qattiqqo'l texnik imtihonchisisiz.
'${skill}' texnologiyasi bo'yicha AYNAN 10 ta turli qiyinlikdagi (asosiy tushunchalardan murakkab arxitekturagacha) sifatli test savollaridan iborat to'liq imtihon tuzing.

Javobni FAQAT va QAT'IY ravishda quyidagi JSON-massiv formatida qaytaring:
[
  {
    "question": "1-savol matni",
    "options": ["1-variant", "2-variant", "3-variant", "4-variant"],
    "correctAnswerIndex": 0
  },
  ...
]

Qoidalar:
- Massivda AYNAN 10 ta ob'ekt bo'lishi shart!
- Har bir ob'ektda "options" massivida AYNAN 4 ta variant bo'lsin.
- "correctAnswerIndex" to'g'ri javob indeksi (0, 1, 2 yoki 3) bo'lishi shart.
- Variantlarning 1 tasi to'g'ri, 3 tasi ishonarli noto'g'ri bo'lsin.
- FAQAT toza JSON qaytaring, hech qanday markdown (\`\`\`json) yoki tushuntirish matni yozmang.`
    : `Ты строгий технический IT-интервьюер и экзаменатор разработчиков.
Составь полноценный экзамен РОВНО из 10 разных практических вопросов разной сложности (от базовых концепций до продвинутых архитектурных нюансов) по технологии '${skill}'.

Верни ответ СТРОГО в виде JSON-массива из 10 объектов:
[
  {
    "question": "Текст вопроса 1",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correctAnswerIndex": 0
  },
  ...
]

Правила:
- В массиве должно быть РОВНО 10 объектов!
- В каждом вопросе в массиве options должно быть РОВНО 4 варианта ответа.
- correctAnswerIndex — числовой индекс правильного ответа (0, 1, 2 или 3).
- Один вариант правильный, три остальных — реалистичные дистракторы.
- Верни ТОЛЬКО валидный чистый JSON без разметки markdown (\`\`\`json) и без постороннего текста.`;

  // Попытка 1: Вызов Gemini через SDK @google/genai
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const parsedList = parseAndValidateGemini10Questions(response.text);
      if (parsedList.length >= 10) {
        return res.status(200).json({
          skill,
          language: isUz ? "uz" : "ru",
          totalQuestions: 10,
          passingScore: 8,
          questions: parsedList.slice(0, 10),
          model: "gemini-2.5-flash",
        });
      }
    } catch (sdkError) {
      console.warn("⚠️ [@google/genai 10 questions] Ошибка SDK:", sdkError.message);

      // Попытка 2: Прямой REST-запрос через axios
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const restRes = await axios.post(
          restUrl,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 12000,
          }
        );

        const textOutput = restRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsedList = parseAndValidateGemini10Questions(textOutput);
        if (parsedList.length >= 10) {
          return res.status(200).json({
            skill,
            language: isUz ? "uz" : "ru",
            totalQuestions: 10,
            passingScore: 8,
            questions: parsedList.slice(0, 10),
            model: "gemini-2.5-flash (REST)",
          });
        }
      } catch (restError) {
        console.warn(
          "⚠️ [Gemini REST 10 questions] Ошибка прямого запроса:",
          restError.response?.data || restError.message
        );
      }
    }
  } else {
    console.warn("⚠️ [Gemini] Переменная GEMINI_API_KEY не задана. Используется резервный пул из 10 вопросов.");
  }

  // Резервный пул из 10 вопросов (Fallback)
  const langKey = isUz ? "uz" : "ru";
  const fallbackDict = FALLBACK_10_QUESTIONS[langKey] || FALLBACK_10_QUESTIONS.ru;
  const fallbackQuestions =
    fallbackDict[skill] ||
    fallbackDict[skill.toLowerCase()] ||
    fallbackDict.JavaScript;

  return res.status(200).json({
    skill,
    language: langKey,
    totalQuestions: fallbackQuestions.length,
    passingScore: 8,
    questions: fallbackQuestions.slice(0, 10),
    model: "fallback-hardcore-10",
  });
}

router.get("/generate", generateHandler);
router.get("/", generateHandler);

module.exports = router;
