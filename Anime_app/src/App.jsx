import React, { useState } from 'react';
import { 
  Search, Calendar, Bookmark, User, Bell, Settings, 
  Tv, Film, Sparkles, ExternalLink, PlayCircle, Star, Users, CheckCircle
} from 'lucide-react';
import { MOCK_USER_PROFILE, MOCK_SCHEDULE, MOCK_RELATED_RELEASES, MOCK_SOURCES, MOCK_ICON_THEMES } from './data';
import Player from './Player';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // home, related, profile, bookmarks, settings
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('anixart');
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  const [currentQuality, setCurrentQuality] = useState('1080p');
  const [watchTogetherActive, setWatchTogetherActive] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState(MOCK_RELATED_RELEASES[0]);
  const [selectedIconTheme, setSelectedIconTheme] = useState('dark-burgundy-gold-3d');

  // Handle Search Result Ordering (Seena first, then similar)
  const isSearchSeenaMatch = searchQuery.toLowerCase().includes('черный факел') || searchQuery.toLowerCase().includes('чёрный факел');

  return (
    <div className="app-container">
      {/* Left Navigation Sidebar */}
      <nav className="left-nav">
        <div className="logo-icon" onClick={() => setActiveTab('home')} title="Anime King Hab">
          <svg viewBox="0 0 512 512" width="30" height="30" fill="currentColor">
            <g>
              <path d="M 65 360 L 115 200 H 155 L 205 360 H 170 L 158 318 H 112 L 100 360 Z M 121 286 H 149 L 135 236 Z"/>
              <circle cx="218" cy="212" r="10" />
              <circle cx="256" cy="190" r="12" />
              <circle cx="294" cy="212" r="10" />
              <path d="M 218 222 L 236 270 L 256 214 L 276 270 L 294 222 L 310 326 H 202 Z" />
              <rect x="202" y="342" width="108" height="18" rx="4" />
              <path d="M 307 200 H 337 V 264 H 381 V 200 H 411 V 360 H 381 V 292 H 337 V 360 H 307 Z"/>
            </g>
          </svg>
        </div>

        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Tv size={22} />
        </div>
        <div className={`nav-item ${activeTab === 'related' ? 'active' : ''}`} onClick={() => setActiveTab('related')}>
          <Film size={22} />
        </div>
        <div className={`nav-item ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')}>
          <Bookmark size={22} />
        </div>
        <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={22} />
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={22} />
        </div>
      </nav>

      {/* Main Layout Area */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-bar">
          <div className="search-box">
            <Search size={18} color="#8b92a5" />
            <input 
              type="text" 
              placeholder="Поиск аниме, Seena плейлистов, релизов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="top-actions">
            {/* Watch Together Toggle */}
            <button 
              className={`top-action-btn ${watchTogetherActive ? 'active' : ''}`}
              title="Совместный просмотр (Watch Together)"
              onClick={() => setWatchTogetherActive(!watchTogetherActive)}
            >
              <Users size={18} />
            </button>

            {/* Pinned Schedule Icon Toggle */}
            <button 
              className={`top-action-btn ${scheduleOpen ? 'active' : ''}`}
              title="Открыть / Закрыть Расписание"
              onClick={() => setScheduleOpen(!scheduleOpen)}
            >
              <Calendar size={18} />
            </button>

            {/* User Profile Badge (1Hariton) */}
            <div className="user-badge" onClick={() => setActiveTab('profile')}>
              <div className="user-avatar" style={{
                background: `url(${MOCK_USER_PROFILE.avatar}) center/cover`
              }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{MOCK_USER_PROFILE.username}</span>
                <span style={{ fontSize: '11px', color: '#00e676' }}>{MOCK_USER_PROFILE.status}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content & Pinned Schedule Area */}
        <div className="content-layout">
          {/* Main Page Area */}
          <main className="page-content">
            {/* Search Results Screen if Searching */}
            {searchQuery && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ marginBottom: '16px' }}>Результаты поиска для "{searchQuery}"</h2>
                {isSearchSeenaMatch ? (
                  <div>
                    <div style={{ background: 'rgba(124, 77, 255, 0.15)', border: '1px solid #7c4dff', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                      <span style={{ background: '#7c4dff', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        ТОЧНОЕ СОВПАДЕНИЕ (Seena Playlist)
                      </span>
                      <h3 style={{ marginTop: '8px' }}>Чёрный факел (Black Torch) — Полный сезон (1080P)</h3>
                      <p style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>Источник: Seena VOD Engine • Озвучка: AniLibria</p>
                    </div>

                    <h3 style={{ color: '#8b92a5', marginBottom: '12px' }}>Похожие результаты по запросу:</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                      {MOCK_RELATED_RELEASES.map(item => (
                        <div key={item.id} style={{ background: '#181a22', borderRadius: '10px', padding: '10px' }}>
                          <img src={item.poster} style={{ width: '100%', height: '220px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'bold' }}>{item.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#8b92a5' }}>Поиск по каталогам Anixart, AnimeGo, YummyAnime, Kinogo, Jut.su, Seena...</p>
                )}
              </div>
            )}

            {/* Tab: Home Video Player Screen */}
            {activeTab === 'home' && !searchQuery && (
              <div>
                <h2 style={{ marginBottom: '16px' }}>{selectedAnime.title}</h2>

                {/* Source Selection Bar */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#aaa', alignSelf: 'center', marginRight: '6px' }}>Источник:</span>
                  {MOCK_SOURCES.map(src => (
                    <button
                      key={src.id}
                      onClick={() => setSelectedSource(src.id)}
                      style={{
                        background: selectedSource === src.id ? '#7c4dff' : '#181a22',
                        border: '1px solid #262938',
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {src.name}
                    </button>
                  ))}
                </div>

                {/* Seamless Player Component */}
                <Player 
                  source={selectedSource}
                  title={selectedAnime.title}
                  savedSpeed={currentSpeed}
                  savedQuality={currentQuality}
                  onSpeedChange={setCurrentSpeed}
                  onQualityChange={setCurrentQuality}
                  watchTogetherActive={watchTogetherActive}
                />

                {/* Kinopoisk Metadata Badge */}
                <div style={{
                  marginTop: '20px',
                  background: '#181a22',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #262938',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ background: '#ff6600', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Кинопоиск: 8.9 ★
                      </span>
                      <span style={{ background: '#7c4dff', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Anixart: 4.8 ★
                      </span>
                      <span style={{ color: '#aaa', fontSize: '13px' }}>{selectedAnime.season}</span>
                    </div>
                    <p style={{ marginTop: '10px', fontSize: '14px', color: '#ccc' }}>{selectedAnime.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Related Releases (Timeline Anixart Replica) */}
            {activeTab === 'related' && (
              <div>
                <h2>Связанные релизы (Хронология)</h2>
                <p style={{ color: '#8b92a5', fontSize: '13px', marginBottom: '20px' }}>
                  Все сезоны, спешлы, фильмы и анонсы релиза со статусами из вашего профиля
                </p>

                <div className="timeline-container">
                  {MOCK_RELATED_RELEASES.map((rel) => (
                    <div className="timeline-item" key={rel.id} onClick={() => {
                      setSelectedAnime(rel);
                      setActiveTab('home');
                    }} style={{ cursor: 'pointer' }}>
                      <div className="timeline-poster-wrapper">
                        <img src={rel.poster} style={{ width: '90px', height: '130px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div className="status-badge">{rel.status}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <h3 style={{ fontSize: '15px' }}>{rel.title}</h3>
                          <span style={{ color: '#ffc107', fontWeight: 'bold', fontSize: '14px' }}>{rel.rating}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <span style={{ background: '#222634', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#aaa' }}>{rel.episodes}</span>
                          <span style={{ background: '#222634', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#aaa' }}>{rel.season}</span>
                          <span style={{ background: '#222634', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#aaa' }}>{rel.type}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#8b92a5', marginTop: '8px' }}>{rel.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Profile (1Hariton Anixart Stats) */}
            {activeTab === 'profile' && (
              <div>
                <h2>Профиль Anixart: {MOCK_USER_PROFILE.username}</h2>
                <div className="profile-stats-container">
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <img src={MOCK_USER_PROFILE.avatar} style={{ width: '80px', height: '80px', borderRadius: '16px' }} />
                    <div>
                      <h3>{MOCK_USER_PROFILE.username}</h3>
                      <span style={{ color: '#00e676', fontSize: '13px' }}>● {MOCK_USER_PROFILE.status}</span>
                      <p style={{ color: '#8b92a5', fontSize: '12px', marginTop: '4px' }}>Регистрация: {MOCK_USER_PROFILE.registration}</p>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-box">
                      <span style={{ color: '#7c4dff', fontWeight: 'bold', fontSize: '20px' }}>{MOCK_USER_PROFILE.stats.animeTotal}</span>
                      <p style={{ color: '#8b92a5', fontSize: '12px' }}>Всего аниме в списках</p>
                    </div>
                    <div className="stat-box">
                      <span style={{ color: '#00e676', fontWeight: 'bold', fontSize: '20px' }}>{MOCK_USER_PROFILE.stats.episodesTotal}</span>
                      <p style={{ color: '#8b92a5', fontSize: '12px' }}>Просмотрено серий</p>
                    </div>
                    <div className="stat-box">
                      <span style={{ color: '#ff9100', fontWeight: 'bold', fontSize: '20px' }}>{MOCK_USER_PROFILE.stats.watchTime}</span>
                      <p style={{ color: '#8b92a5', fontSize: '12px' }}>Время просмотра</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Tab: Settings & Icon Theme Chooser */}
            {activeTab === 'settings' && (
              <div>
                <h2>Настройки и стили иконок (AKH)</h2>
                <p style={{ color: '#8b92a5', fontSize: '13px', marginBottom: '24px' }}>
                  Выбирайте подходящую иконку для Тёмного или Светлого режима интерфейса
                </p>

                {['Тёмные темы', 'Светлые темы', '3D Золотая Корона'].map((categoryName) => (
                  <div key={categoryName} style={{ background: '#181a22', borderRadius: '16px', padding: '20px', border: '1px solid #262938', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '16px', color: '#7c4dff', fontSize: '16px' }}>{categoryName}</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {MOCK_ICON_THEMES.filter(t => t.category === categoryName).map((themeItem) => (
                        <div
                          key={themeItem.id}
                          onClick={() => setSelectedIconTheme(themeItem.id)}
                          style={{
                            background: selectedIconTheme === themeItem.id ? 'rgba(124,77,255,0.2)' : '#0f1015',
                            border: selectedIconTheme === themeItem.id ? '2px solid #7c4dff' : '1px solid #262938',
                            borderRadius: '14px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Icon Preview Card */}
                          <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '22px',
                            background: themeItem.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            marginBottom: '12px',
                            border: themeItem.bg === '#ffffff' ? '2px solid #000000' : '1px solid #333'
                          }}>
                            <svg viewBox="0 0 512 512" width="65" height="65">
                              <defs>
                                <linearGradient id="gold3dGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#ffe259" />
                                  <stop offset="50%" stopColor="#ffa751" />
                                  <stop offset="100%" stopColor="#e65c00" />
                                </linearGradient>
                              </defs>
                              <g fill={themeItem.crown === 'gold-3d' ? 'url(#gold3dGrad)' : themeItem.crown}>
                                <path d="M 65 360 L 115 200 H 155 L 205 360 H 170 L 158 318 H 112 L 100 360 Z M 121 286 H 149 L 135 236 Z" fill={themeItem.text}/>
                                <circle cx="218" cy="212" r="10" />
                                <circle cx="256" cy="190" r="12" />
                                <circle cx="294" cy="212" r="10" />
                                <path d="M 218 222 L 236 270 L 256 214 L 276 270 L 294 222 L 310 326 H 202 Z" />
                                <rect x="202" y="342" width="108" height="18" rx="4" />
                                <path d="M 307 200 H 337 V 264 H 381 V 200 H 411 V 360 H 381 V 292 H 337 V 360 H 307 Z" fill={themeItem.text}/>
                              </g>
                            </svg>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>{themeItem.name}</span>
                          {selectedIconTheme === themeItem.id && (
                            <span style={{ fontSize: '11px', color: '#00e676', fontWeight: 'bold', marginTop: '4px' }}>✓ Выбрана</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Pinned Schedule Right Sidebar (Does NOT close on click) */}
          {scheduleOpen && (
            <aside className="schedule-sidebar">
              <div className="schedule-header">
                <h3>Расписание</h3>
                <span style={{ fontSize: '12px', color: '#8b92a5' }}>Япония & Китай</span>
              </div>
              <div className="schedule-list">
                {MOCK_SCHEDULE.map(item => (
                  <div 
                    key={item.id} 
                    className="schedule-card"
                    onClick={() => {
                      // Selecting a release loads it into the main viewer without closing schedule sidebar
                      setSelectedAnime({
                        id: item.id,
                        title: item.title,
                        episodes: item.episodes,
                        rating: "4.9 ★",
                        season: item.season,
                        type: item.type,
                        status: "смотрю",
                        poster: item.poster,
                        description: "Новый эпизод выходящего релиза по расписанию."
                      });
                      setActiveTab('home');
                    }}
                  >
                    <img src={item.poster} className="schedule-poster" />
                    <div>
                      <h4 style={{ fontSize: '13px' }}>{item.title}</h4>
                      <span style={{ fontSize: '11px', color: '#7c4dff', fontWeight: 'bold' }}>{item.episodes}</span>
                      <p style={{ fontSize: '11px', color: '#8b92a5', marginTop: '4px' }}>{item.season}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
