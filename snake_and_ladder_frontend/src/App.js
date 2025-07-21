import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Snake and Ladder Game Board Size (10x10)
 */
const BOARD_SIZE = 10;
const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;

// snakes and ladders mapping: [start, end] (1-based index)
const SNAKES = [
  { from: 99, to: 7 },
  { from: 92, to: 35 },
  { from: 74, to: 44 },
  { from: 64, to: 24 },
  { from: 62, to: 19 },
  { from: 49, to: 11 },
  { from: 46, to: 25 },
  { from: 16, to: 6 },
];
const LADDERS = [
  { from: 2, to: 38 },
  { from: 7, to: 14 },
  { from: 8, to: 31 },
  { from: 15, to: 26 },
  { from: 21, to: 42 },
  { from: 28, to: 84 },
  { from: 36, to: 44 },
  { from: 51, to: 67 },
  { from: 71, to: 91 },
  { from: 78, to: 98 },
  { from: 87, to: 94 },
];

/**
 * Player colors
 */
const PLAYER_COLORS = [
  '#2e8b57',  // green (primary)
  '#f4a460',  // sand (secondary)
  '#ffd700',  // gold (accent)
  '#c44536',  // playful red
];

// Generate initial player state
function generatePlayers(numPlayers) {
  return Array.from({ length: numPlayers }, (_, i) => ({
    id: i,
    pos: 1,
    name: `Player ${i + 1}`,
    color: PLAYER_COLORS[i],
    isWinner: false,
  }));
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [numPlayers, setNumPlayers] = useState(2);
  const [players, setPlayers] = useState(() => generatePlayers(2));
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [gameStatus, setGameStatus] = useState('setup'); // 'setup', 'active', 'ended'
  const [message, setMessage] = useState('');

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Reset players when the number of players changes
  useEffect(() => {
    setPlayers(generatePlayers(numPlayers));
    setCurrentPlayer(0);
    setDice(1);
    setGameStatus('setup');
    setMessage('');
  }, [numPlayers]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  const handleStart = () => {
    setGameStatus('active');
    setMessage(`Game started! ${players[0].name}'s turn.`);
  };

  // PUBLIC_INTERFACE
  const animateDice = (die) => {
    setRolling(true);
    // Animate dice for 1 second
    let interval = null;
    let ticks = 0;
    interval = setInterval(() => {
      setDice(Math.ceil(Math.random() * 6));
      ticks += 1;
      if (ticks >= 10) {
        clearInterval(interval);
        setDice(die);
        setRolling(false);
      }
    }, 75);
  };

  // PUBLIC_INTERFACE
  const rollDice = () => {
    if (rolling || gameStatus !== 'active') return;
    const die = Math.ceil(Math.random() * 6);
    animateDice(die);

    setTimeout(() => {
      movePlayer(die);
    }, 800); // wait for animation to finish
  };

  // PUBLIC_INTERFACE
  const movePlayer = (steps) => {
    setPlayers(prevPlayers => {
      const newPlayers = [...prevPlayers];
      let player = { ...newPlayers[currentPlayer] };
      let newPos = player.pos + steps;
      let info = null;

      if (newPos > 100) newPos = player.pos; // can't overshoot 100

      // Check for snake or ladder
      let snake = SNAKES.find(s => s.from === newPos);
      let ladder = LADDERS.find(l => l.from === newPos);
      if (ladder) {
        info = `Yay! ${player.name} found a ladder to ${ladder.to}.`;
        newPos = ladder.to;
      } else if (snake) {
        info = `Oh no! ${player.name} got bitten by a snake and slides to ${snake.to}.`;
        newPos = snake.to;
      }

      if (newPos === 100) {
        player.isWinner = true;
        setGameStatus('ended');
        setMessage(`${player.name} has won the game!`);
      } else {
        setMessage(
          info ||
            `${player.name} moved to cell ${newPos}.`
        );
      }

      player.pos = newPos;
      newPlayers[currentPlayer] = player;
      return newPlayers;
    });

    // Change turn
    setTimeout(() => {
      setCurrentPlayer(prev => {
        let next = (prev + 1) % numPlayers;
        return next;
      });
    }, 50);
  };

  // Change message when turn changes
  useEffect(() => {
    if (gameStatus === 'active') {
      if (players[currentPlayer].isWinner) return;
      setMessage(`${players[currentPlayer].name}'s turn.`);
    }
    // eslint-disable-next-line
  }, [currentPlayer]);

  // PUBLIC_INTERFACE
  const handleReset = () => {
    setPlayers(generatePlayers(numPlayers));
    setCurrentPlayer(0);
    setDice(1);
    setGameStatus('setup');
    setMessage('');
  };

  // Board rendering utility: get player tokens for a cell
  const tokensAtCell = (cell) =>
    players
      .filter((pl) => pl.pos === cell)
      .map((pl, i) => (
        <span
          key={pl.id}
          className="player-token"
          style={{
            background: pl.color,
            border: `2.5px solid #222`,
            left: `${(i % 2) * 18 + 6}px`,
            top: `${Math.floor(i / 2) * 18 + 6}px`,
            zIndex: 2 + i,
          }}
          title={pl.name}
        ></span>
      ));

  // Board cells: top left is cell 100, bottom left is cell 91, bottom right is cell 1
  const boardCells = () => {
    let cells = [];
    for (let row = BOARD_SIZE; row >= 1; row--) {
      let base = (row - 1) * BOARD_SIZE;
      let rowCells = [];
      for (let col = 1; col <= BOARD_SIZE; col++) {
        const oddRow = BOARD_SIZE % 2 ? row % 2 : (row + 1) % 2;
        let n = base + (oddRow ? col : BOARD_SIZE - col + 1);

        // Draw ladders/snakes head or tail
        let snakeHead = SNAKES.find(s => s.from === n);
        let snakeTail = SNAKES.find(s => s.to === n);
        let ladderStart = LADDERS.find(l => l.from === n);
        let ladderEnd = LADDERS.find(l => l.to === n);

        rowCells.push(
          <div className={`cell`} key={n}>
            <div className="cell-num">{n}</div>
            {tokensAtCell(n)}
            {snakeHead && (
              <span className="snake" title="Snake head">🐍</span>
            )}
            {snakeTail && (
              <span className="snake-tail" title="Snake tail">🟢</span>
            )}
            {ladderStart && (
              <span className="ladder" title="Ladder base">🪜</span>
            )}
            {ladderEnd && (
              <span className="ladder-top" title="Ladder top">💡</span>
            )}
          </div>
        );
      }
      cells.push(
        <div className="board-row" key={`row-${row}`}>
          {rowCells}
        </div>
      );
    }
    return cells;
  };

  // Render main
  return (
    <div className="App">
      <header>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1 className="game-title" style={{ color: "#2e8b57" }}>
          🐍 Snake and Ladder 🎲
        </h1>
      </header>
      <main className="game-layout">
        {/* Sidebar or Bottom Player Area depending on screen */}
        <section className="players-area">
          <h3>Players</h3>
          <div className="players-list">
            {players.map((pl, i) => (
              <div
                className={`player-card${currentPlayer === i ? ' active' : ''}${pl.isWinner ? ' winner' : ''}`}
                key={pl.id}
                style={{
                  borderColor: pl.color,
                  background: pl.isWinner ? '#ffd70022' : '',
                }}
              >
                <span
                  className="player-badge"
                  style={{ background: pl.color }}
                  title={pl.name}
                />
                <span>{pl.name}</span>
                <span style={{ fontSize: '0.8em', color: '#888' }}>at {pl.pos}</span>
                {pl.isWinner && <span className="winner-label">🏆 Winner!</span>}
              </div>
            ))}
          </div>
          <div className="game-controls">
            {gameStatus === 'setup' && (
              <>
                <label className="players-selection-label">
                  Players:
                  <select
                    value={numPlayers}
                    onChange={e => setNumPlayers(Number(e.target.value))}
                    disabled={gameStatus !== 'setup'}
                  >
                    {[2, 3, 4].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="btn"
                  onClick={handleStart}
                  style={{ marginTop: 8 }}
                >Start Game</button>
              </>
            )}
            {gameStatus !== 'setup' && (
              <button className="btn secondary" onClick={handleReset}>
                Reset Game
              </button>
            )}
          </div>
          <div className="turn-indicator">
            {gameStatus === 'active' && (
              <div>
                <span style={{
                  fontWeight: 600,
                  color: players[currentPlayer].color,
                }}>
                  {players[currentPlayer].name}
                </span>'s turn
              </div>
            )}
            {gameStatus === 'ended' && (
              <div style={{ fontWeight: 600, color: '#ffd700' }}>
                🎉 Game Over!
              </div>
            )}
          </div>
        </section>

        {/* Board Area */}
        <section className="board-area">
          <div className="snake-ladder-board">
            {boardCells()}
          </div>
          <div className="dice-area">
            <DiceRenderer value={dice} rolling={rolling} />
            <button
              className="btn large"
              onClick={rollDice}
              disabled={rolling || gameStatus !== 'active' ||
                players[currentPlayer].isWinner}
              style={{ marginLeft: 18 }}
            >
              {gameStatus === 'ended'
                ? '🎮 Game Ended'
                : rolling
                  ? 'Rolling...'
                  : 'Roll Dice'}
            </button>
          </div>
          <div className="game-message" role="status">
            {message}
          </div>
        </section>
      </main>
      <footer className="game-footer">
        <span>
          Made with <span role="img" aria-label="love">💚</span> – React Snake &amp; Ladder!
        </span>
      </footer>
    </div>
  );
}

// Dice with simple animation dots
function DiceRenderer({ value, rolling }) {
  return (
    <div
      className={`dice${rolling ? ' rolling' : ''}`}
      aria-label={`Dice shows value ${value}`}
      role="img"
    >
      {Array.from({ length: 6 }).map((_, idx) => (
        <span
          className={`dice-dot${idx < value ? ' visible' : ''}`}
          key={idx}
        />
      ))}
      <span className="dice-value-label">{value}</span>
    </div>
  );
}

export default App;
