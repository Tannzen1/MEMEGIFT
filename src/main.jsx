import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const cases = [
  { id: 1, name: 'Мемный старт', price: 25, icon: '🎁', color: 'violet', reward: 'Сюрприз' },
  { id: 2, name: 'Неоновый', price: 75, icon: '🌌', color: 'blue', reward: 'Редкий приз' },
  { id: 3, name: 'Золотой', price: 150, icon: '👑', color: 'gold', reward: 'Особый приз' },
];

function App() {
  const [tab, setTab] = useState('cases');
  const [balance, setBalance] = useState(500);
  const [message, setMessage] = useState('');
  const [upgrade, setUpgrade] = useState(50);
  const user = tg?.initDataUnsafe?.user;
  const displayName = user?.first_name || 'Игрок';

  function openCase(item) {
    if (balance < item.price) return setMessage('Недостаточно виртуальных монет');
    setBalance(v => v - item.price);
    setMessage(`Кейс «${item.name}» открыт! Демонстрационный режим: призы пока не начисляются.`);
  }

  return <div className="app-shell">
    <header className="topbar"><div className="brand-mark">M</div><div><div className="brand">MEMEGIFT</div><div className="tagline">ТВОЯ КОЛЛЕКЦИЯ СЮРПРИЗОВ</div></div><div className="balance">🪙 {balance}</div></header>
    <section className="welcome"><div><p className="eyebrow">ДОБРО ПОЖАЛОВАТЬ</p><h1>Привет, {displayName}!</h1><p className="muted">Открывай кейсы и собирай коллекцию</p></div><div className="hero-gift">🎁</div></section>
    {message && <div className="notice" onClick={() => setMessage('')}>{message}<span> ×</span></div>}
    <main>
      {tab === 'cases' && <><div className="section-heading"><div><p className="eyebrow">ИСПЫТАЙ УДАЧУ</p><h2>Популярные кейсы</h2></div><span className="subtle">3 кейса</span></div><div className="case-grid">{cases.map(item => <article className={`case-card ${item.color}`} key={item.id}><div className="case-icon">{item.icon}</div><div className="case-name">{item.name}</div><div className="case-reward">{item.reward}</div><button onClick={() => openCase(item)}>Открыть · {item.price} 🪙</button></article>)}</div><div className="info-panel"><span>✨</span><div><b>Каждое открытие — сюрприз</b><p>Это стартовая демо-версия. Реальные призы, платежи и случайные выпадения подключим отдельно.</p></div></div></>}
      {tab === 'upgrade' && <><div className="section-heading"><div><p className="eyebrow">УЛУЧШАЙ КОЛЛЕКЦИЮ</p><h2>Апгрейд</h2></div></div><div className="upgrade-panel"><div className="upgrade-orb">🎁</div><div className="upgrade-arrow">↗</div><div className="upgrade-orb target">💎</div><h3>Попробуй улучшение</h3><p className="muted">Выбери шанс улучшения</p><input type="range" min="10" max="90" value={upgrade} onChange={e => setUpgrade(Number(e.target.value))}/><div className="chance">{upgrade}% <span>шанс</span></div><button className="primary" onClick={() => setMessage('Механика апгрейда будет подключена на следующем этапе.')}>Попробовать</button></div></>}
      {tab === 'games' && <><div className="section-heading"><div><p className="eyebrow">РАЗВЛЕЧЕНИЯ</p><h2>Игры</h2></div></div><div className="game-card"><span>🎯</span><div><b>Мини-игры скоро появятся</b><p className="muted">Готовим игровые режимы для MEMEGIFT.</p></div></div><div className="game-card"><span>🎲</span><div><b>Ежедневный бонус</b><p className="muted">Система бонусов будет добавлена позже.</p></div></div></>}
      {tab === 'profile' && <><div className="section-heading"><div><p className="eyebrow">ТВОЙ АККАУНТ</p><h2>Профиль</h2></div></div><div className="profile-card"><div className="avatar">{displayName.slice(0,1).toUpperCase()}</div><h2>{displayName}</h2><p className="muted">{user?.username ? '@' + user.username : 'Участник MEMEGIFT'}</p><div className="stats"><div><b>{balance}</b><span>Монеты</span></div><div><b>0</b><span>Подарки</span></div><div><b>0</b><span>Апгрейды</span></div></div></div><button className="support-button" onClick={() => setMessage('Поддержка будет подключена через бота на следующем этапе.')}>💬 Написать в поддержку</button></>}
    </main>
    <nav className="bottom-nav">{[['cases','🎁','Кейсы'],['upgrade','⚡','Апгрейд'],['games','🎮','Игры'],['profile','👤','Профиль']].map(([id,icon,label]) => <button className={tab===id?'active':''} key={id} onClick={()=>{setTab(id);setMessage('')}}><span>{icon}</span>{label}</button>)}</nav>
    <footer>MEMEGIFT · STARTER BUILD</footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
