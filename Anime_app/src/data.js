// Mock Data Engine for AnixApp + Multi-sources
export const MOCK_USER_PROFILE = {
  username: "1Hariton",
  avatar: "https://avatars.githubusercontent.com/u/10240000?v=4",
  status: "+1 в сети",
  registration: "25 апр. 2023",
  stats: {
    animeTotal: 353,
    episodesTotal: 4132,
    watchTime: "1 д. 2 ч.",
    friends: 3,
    watching: 8,
    planned: 156,
    watched: 189,
    onHold: 0,
    dropped: 0,
  }
};

export const MOCK_SCHEDULE = [
  {
    id: 1,
    title: "Аккуратная и симпатичная...",
    episodes: "3 из 12 эп",
    day: "Понедельник",
    poster: "https://shikimori.one/system/animes/original/52000.jpg",
    season: "зима 2026 г.",
    type: "Сериал"
  },
  {
    id: 2,
    title: "Тайная битва за престол...",
    episodes: "3 из 12 эп",
    day: "Понедельник",
    poster: "https://shikimori.one/system/animes/original/53000.jpg",
    season: "зима 2026 г.",
    type: "Сериал"
  },
  {
    id: 3,
    title: "Противостояние святого",
    episodes: "150 из 180 эп",
    day: "Понедельник",
    poster: "https://shikimori.one/system/animes/original/54000.jpg",
    season: "зима 2026 г.",
    type: "Сериал"
  },
  {
    id: 4,
    title: "Рыцарь-скелет вступает в...",
    episodes: "3 из 12 эп",
    day: "Понедельник",
    poster: "https://shikimori.one/system/animes/original/55000.jpg",
    season: "зима 2026 г.",
    type: "Сериал"
  }
];

export const MOCK_RELATED_RELEASES = [
  {
    id: 101,
    title: "Реинкарнация безработного: История о приключениях в другом мире — Сезон 1 (Часть 1)",
    episodes: "11 эп",
    rating: "4.8 ★",
    season: "зима 2021 г.",
    type: "Сериал",
    status: "просмотрено",
    poster: "https://shikimori.one/system/animes/original/39535.jpg",
    description: "Бывает в жизни невезение. Только тридцатичетырёхлетний отаку-неудачник решил изменить свою жизнь..."
  },
  {
    id: 102,
    title: "Реинкарнация безработного: История о приключениях в другом мире — Сезон 1 (Часть 2)",
    episodes: "12 эп",
    rating: "4.9 ★",
    season: "осень 2021 г.",
    type: "Сериал",
    status: "просмотрено",
    poster: "https://shikimori.one/system/animes/original/45576.jpg",
    description: "Продолжение путешествия Рудеуса и Эрис по Демоническому контененту после телепортации..."
  },
  {
    id: 103,
    title: "Реинкарнация безработного: Эрис охотится на гоблинов",
    episodes: "1 эп",
    rating: "4.6 ★",
    season: "весна 2022 г.",
    type: "Спешл",
    status: "просмотрено",
    poster: "https://shikimori.one/system/animes/original/50346.jpg",
    description: "Специальный эпизод, рассказывающий о том, чем занималась Эрис во время событий 16-й серии..."
  },
  {
    id: 104,
    title: "Реинкарнация безработного — Сезон 3 (АНОНС)",
    episodes: "Скоро",
    rating: "5.0 ★",
    season: "2027 г.",
    type: "Анонс",
    status: "в планах",
    poster: "https://shikimori.one/system/animes/original/58000.jpg",
    description: "Официально анонсированный третий сезон приключений Рудеуса Грейрата."
  }
];

export const MOCK_ICON_THEMES = [
  // Тёмные темы (Чёрный фон, белые буквы A H)
  { id: 'dark-white', category: 'Тёмные темы', name: 'Тёмная (Белая корона)', bg: '#000000', crown: '#ffffff', text: '#ffffff', previewBg: '#000000' },
  { id: 'dark-coral', category: 'Тёмные темы', name: 'Тёмная (Коралловая корона)', bg: '#000000', crown: '#e74c3c', text: '#ffffff', previewBg: '#000000' },
  { id: 'dark-burgundy', category: 'Тёмные темы', name: 'Тёмная (Бордовая корона)', bg: '#000000', crown: '#800020', text: '#ffffff', previewBg: '#000000' },
  
  // Светлые темы (Белый фон, чёрные буквы A H)
  { id: 'light-minimal', category: 'Светлые темы', name: 'Светлая (Чёрная корона)', bg: '#ffffff', crown: '#000000', text: '#000000', previewBg: '#f8f9fa' },
  { id: 'light-coral', category: 'Светлые темы', name: 'Светлая (Коралловая корона)', bg: '#ffffff', crown: '#e74c3c', text: '#000000', previewBg: '#f8f9fa' },
  { id: 'light-burgundy', category: 'Светлые темы', name: 'Светлая (Бордовая корона)', bg: '#ffffff', crown: '#800020', text: '#000000', previewBg: '#f8f9fa' },

  // 3D Премиум Золотые варианты
  { id: 'dark-burgundy-gold-3d', category: '3D Золотая Корона', name: 'Бордо 3D Голд (Главная)', bg: '#6b0d25', crown: 'gold-3d', text: '#ffffff', previewBg: '#6b0d25' },
  { id: 'dark-gold-3d', category: '3D Золотая Корона', name: 'Тёмный 3D Голд', bg: '#000000', crown: 'gold-3d', text: '#ffffff', previewBg: '#000000' },
  { id: 'light-gold-3d', category: '3D Золотая Корона', name: 'Светлый 3D Голд', bg: '#ffffff', crown: 'gold-3d', text: '#000000', previewBg: '#f8f9fa' },
];

export const MOCK_SOURCES = [
  { id: "anixart", name: "Anixart CDN (1080p)" },
  { id: "animego", name: "AnimeGo Player" },
  { id: "yummy", name: "YummyAnime" },
  { id: "kinogo", name: "Kinogo.ec" },
  { id: "jutsu", name: "Jut.su (Skip Opening)" },
  { id: "anilibria", name: "AniLibria HD" },
  { id: "seena", name: "Seena Playlist" },
  { id: "torrent", name: "WebTorrent 1080p HEVC" },
];
