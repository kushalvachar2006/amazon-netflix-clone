import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function Dots({ color, position, onMouseDown, onMouseEnter, isConnected }) {
  return (
    <div
      className={`dots ${isConnected ? "connected" : ""}`}
      style={{
        backgroundColor: color,
        position: "absolute",
        left: position.x,
        top: position.y,
        cursor: "pointer",
        zIndex: isConnected ? 1 : 2,
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    />
  );
}

function Square({ children, position }) {
  return (
    <div
      className="square_container"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
      }}
    >
      <div className="square">{children}</div>
    </div>
  );
}

function GameBoard({ level }) {
  const colors = ["red", "green", "blue", "yellow", "orange"];
  const i = 3;
  const gridSize = level >= 5 ? i + 1 : i;
  const squareSize = 80;
  const dotSize = 40;

  const [dots, setDots] = useState([]);
  const [connections, setConnections] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const canvasRef = useRef(null);
  const boardRef = useRef(null);

  // Fixed dot initialization logic
  useEffect(() => {
    const newDots = [];
    const totalDots = gridSize * gridSize;
    const colorsToUse = colors.slice(0, Math.floor(totalDots / 2));
    
    // Create pairs of each color
    const dotColors = [];
    colorsToUse.forEach(color => {
      dotColors.push(color, color); // Add each color twice for pairs
    });
    
    // Fill remaining spots with random colors if needed
    while (dotColors.length < totalDots) {
      const randomColor = colorsToUse[Math.floor(Math.random() * colorsToUse.length)];
      dotColors.push(randomColor);
    }
    
    // Shuffle the colors array
    for (let i = dotColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dotColors[i], dotColors[j]] = [dotColors[j], dotColors[i]];
    }

    // Place dots on grid
    let colorIndex = 0;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (colorIndex < dotColors.length) {
          const dot = {
            id: `${row}-${col}`,
            color: dotColors[colorIndex],
            position: {
              x: col * squareSize + squareSize / 2 - dotSize / 2,
              y: row * squareSize + squareSize / 2 - dotSize / 2,
            },
            connected: false,
          };
          newDots.push(dot);
          colorIndex++;
        }
      }
    }

    setDots(newDots);
    setConnections([]);
    setScore(0);
    setGameComplete(false);
  }, [level, gridSize, squareSize, dotSize]);

  // Draw connections on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw completed connections
    connections.forEach((connection) => {
      ctx.strokeStyle = connection.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(
        connection.start.x + dotSize / 2,
        connection.start.y + dotSize / 2
      );
      ctx.lineTo(
        connection.end.x + dotSize / 2,
        connection.end.y + dotSize / 2
      );
      ctx.stroke();
    });
  }, [connections, dotSize]);

  const handleMouseDown = (e, dot) => {
    if (dot.connected) return;

    setIsDragging(true);
    setDragStart(dot);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragStart) return;

    const rect = boardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find if we're hovering over a valid target dot
    const targetDot = dots.find((dot) => {
      if (
        dot.id === dragStart.id ||
        dot.connected ||
        dot.color !== dragStart.color
      )
        return false;

      const dotCenterX = dot.position.x + dotSize / 2;
      const dotCenterY = dot.position.y + dotSize / 2;
      const distance = Math.sqrt(
        Math.pow(mouseX - dotCenterX, 2) + Math.pow(mouseY - dotCenterY, 2)
      );
      return distance <= dotSize / 2;
    });

    if (targetDot) {
      // Auto-connect when hovering over valid target
      const newConnection = {
        id: `${dragStart.id}-${targetDot.id}`,
        start: dragStart.position,
        end: targetDot.position,
        color: dragStart.color,
      };

      setConnections((prev) => [...prev, newConnection]);
      setDots((prev) =>
        prev.map((d) =>
          d.id === dragStart.id || d.id === targetDot.id
            ? { ...d, connected: true }
            : d
        )
      );
      setScore((prev) => prev + 10);

      setIsDragging(false);
      setDragStart(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleMouseEnter = (dot) => {
    if (!isDragging || !dragStart) return;
    
    // Handle connection logic when hovering over a dot during drag
    if (dot.id !== dragStart.id && !dot.connected && dot.color === dragStart.color) {
      const newConnection = {
        id: `${dragStart.id}-${dot.id}`,
        start: dragStart.position,
        end: dot.position,
        color: dragStart.color,
      };

      setConnections((prev) => [...prev, newConnection]);
      setDots((prev) =>
        prev.map((d) =>
          d.id === dragStart.id || d.id === dot.id
            ? { ...d, connected: true }
            : d
        )
      );
      setScore((prev) => prev + 10);

      setIsDragging(false);
      setDragStart(null);
    }
  };

  // Check if game is complete
  useEffect(() => {
    const connectedDots = dots.filter((dot) => dot.connected);
    if (connectedDots.length === dots.length && dots.length > 0) {
      setGameComplete(true);
    }
  }, [dots]);

  const resetGame = () => {
    setDots((prev) => prev.map((dot) => ({ ...dot, connected: false })));
    setConnections([]);
    setScore(0);
    setGameComplete(false);
  };

  return (
    <div
      className="game-board"
      ref={boardRef}
      style={{ position: "relative" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={gridSize * squareSize}
        height={gridSize * squareSize}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Grid squares */}
      {Array.from({ length: gridSize }, (_, row) =>
        Array.from({ length: gridSize }, (_, col) => (
          <Square
            key={`${row}-${col}`}
            position={{
              x: col * squareSize,
              y: row * squareSize,
            }}
          />
        ))
      )}

      {/* Dots */}
      {dots.map((dot) => (
        <Dots
          key={dot.id}
          color={dot.color}
          position={dot.position}
          onMouseDown={(e) => handleMouseDown(e, dot)}
          onMouseEnter={() => handleMouseEnter(dot)}
          isConnected={dot.connected}
        />
      ))}

      <div className="game-stats">
        <p>
          <strong>Score:</strong> {score}
        </p>
        <p>
          <strong>Connected:</strong> {dots.filter((d) => d.connected).length} /{" "}
          {dots.length}
        </p>
        {gameComplete && (
          <div className="completion-message">
            <h3>🎉 Level Complete! 🎉</h3>
            <p>Congratulations! You've connected all the dots!</p>
            <button onClick={resetGame}>Play Again</button>
          </div>
        )}
        <button onClick={resetGame}>Reset Game</button>
      </div>
    </div>
  );
}

function App() {
  const [level, setLevel] = useState(1);

  const handleLevelUp = () => {
    setLevel((prevLevel) => prevLevel + 1);
  };

  const handleLevelDown = () => {
    setLevel((prevLevel) => Math.max(1, prevLevel - 1));
  };

  return (
    <div className="App">
      <h1>Connect Dots Game</h1>
      <div className="instructions">
        <h2>Level: {level}</h2>
        <p>
          <strong>Grid Size:</strong> {level >= 5 ? "4x4" : "3x3"}
        </p>
        <p>
          <strong>Instructions:</strong> Click and drag to connect dots of the
          same color!
        </p>
        <p>
          <strong>Goal:</strong> Connect all matching colored dots to complete
          the level.
        </p>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleLevelUp}>Level Up</button>
        <button onClick={handleLevelDown}>Level Down</button>
      </div>
      <GameBoard level={level} />
    </div>
  );
}

export default App;
