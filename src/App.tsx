import { useState, useMemo, useEffect, useRef } from 'react';
import { Question, ArrowsClockwise, ArrowCounterClockwise } from '@phosphor-icons/react';
import { PatternCanvas, type PatternCanvasRef } from './components/PatternCanvas';
import { hapticLight } from './utils/haptic';
import { PatternPreview } from './components/PatternPreview';
import { PATTERNS, PATTERN_COUNT } from './data/patterns';
import './App.css';

type Screen = 'start' | 'game' | 'complete';
type OrderMode = 'sequential' | 'random';

const HELP_TEXT = `Натренированный отдых – теория восстановления концентрации;
Паттерны – один из способов её реализации.

Игра требует регулярности. Сначала вы привыкаете к паттернам, а потом используете их как способ восстановления.

Приятного использования!`;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}


export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [orderMode, setOrderMode] = useState<OrderMode>('random');
  const [patternOrder, setPatternOrder] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const canvasRef = useRef<PatternCanvasRef>(null);

  const currentPattern = useMemo(() => {
    if (patternOrder.length === 0) return null;
    const idx = patternOrder[currentIndex];
    return PATTERNS[idx] ?? null;
  }, [patternOrder, currentIndex]);

  const progress = patternOrder.length > 0 ? currentIndex + 1 : 0;
  const progressPct = patternOrder.length > 0 ? (progress / PATTERN_COUNT) * 100 : 0;
  const isLast = progress >= PATTERN_COUNT;

  const startGame = () => {
    const order =
      orderMode === 'random'
        ? shuffle(Array.from({ length: PATTERN_COUNT }, (_, i) => i))
        : Array.from({ length: PATTERN_COUNT }, (_, i) => i);
    setPatternOrder(order);
    setCurrentIndex(0);
    setCompletedCount(0);
    setScreen('game');
  };

  const goNext = () => {
    hapticLight();
    if (canvasRef.current?.hasDrawn()) {
      setCompletedCount((c) => c + 1);
    }
    if (isLast) {
      setScreen('complete');
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const restart = () => {
    setScreen('start');
    setPatternOrder([]);
    setCurrentIndex(0);
    setCompletedCount(0);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as unknown as { Telegram?: { WebApp?: { ready?: () => void } } }).Telegram?.WebApp?.ready) {
      (window as unknown as { Telegram: { WebApp: { ready: () => void } } }).Telegram.WebApp.ready();
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <button
          type="button"
          className="help-btn"
          onClick={() => setHelpOpen(true)}
          aria-label="Справка"
        >
          <Question size={22} weight="bold" />
        </button>
      </header>

      {screen === 'start' && (
        <section className="screen start-screen">
          <PatternPreview pattern={PATTERNS[0]} size={220} className="pattern-preview" />
          <h1>Натренированный отдых</h1>
          <p className="subtitle">«Паттерны»</p>
          <div className="mode-selector">
            <button
              type="button"
              className={`mode-option ${orderMode === 'sequential' ? 'selected' : ''}`}
              onClick={() => setOrderMode('sequential')}
            >
              По порядку
            </button>
            <button
              type="button"
              className={`mode-option ${orderMode === 'random' ? 'selected' : ''}`}
              onClick={() => setOrderMode('random')}
            >
              Случайно
            </button>
          </div>
          <button type="button" className="start-btn" onClick={startGame}>
            Начать
          </button>
        </section>
      )}

      {screen === 'game' && currentPattern && (
        <section className="screen game-screen">
          <div className="progress-section">
            <div className="progress-text">
              <span>{progress}/{PATTERN_COUNT}</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <div className="pattern-container">
            <PatternCanvas
              ref={canvasRef}
              key={currentIndex}
              pattern={currentPattern}
              size={340}
            />
          </div>
          <div className="game-actions">
            <button
              type="button"
              className="undo-btn"
              onClick={handleUndo}
              title="Отменить последнюю линию"
            >
              <ArrowCounterClockwise size={20} weight="bold" />
              Отменить
            </button>
            <button type="button" className="next-btn" onClick={goNext}>
              Дальше
            </button>
          </div>
        </section>
      )}

      {screen === 'complete' && (
        <section className="screen completion-screen">
          <div className="icon-wrap">
            <ArrowsClockwise size={36} weight="bold" color="var(--color-accent)" />
          </div>
          <h2>
            {completedCount === PATTERN_COUNT
              ? 'Все паттерны пройдены'
              : 'Сессия завершена'}
          </h2>
          <p className="completed-stats">
            Пройдено: {completedCount} из {PATTERN_COUNT} паттернов
          </p>
          <button type="button" className="restart-btn" onClick={restart}>
            <ArrowsClockwise size={20} weight="bold" />
            Заново
          </button>
        </section>
      )}

      {helpOpen && (
        <div className="modal-overlay" onClick={() => setHelpOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Справка</h3>
            {HELP_TEXT.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <button type="button" className="modal-close" onClick={() => setHelpOpen(false)}>
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
