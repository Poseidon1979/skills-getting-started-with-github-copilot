// Tetris Game Implementation

// Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
  '#000000', // Empty
  '#00FFFF', // I - Cyan
  '#FFFF00', // O - Yellow
  '#800080', // T - Purple
  '#00FF00', // S - Green
  '#FF0000', // Z - Red
  '#0000FF', // J - Blue
  '#FFA500'  // L - Orange
];

// Tetromino shapes (I, O, T, S, Z, J, L)
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[2, 2], [2, 2]], // O
  [[0, 3, 0], [3, 3, 3]], // T
  [[0, 4, 4], [4, 4, 0]], // S
  [[5, 5, 0], [0, 5, 5]], // Z
  [[6, 0, 0], [6, 6, 6]], // J
  [[0, 0, 7], [7, 7, 7]]  // L
];

// Game state
let canvas, ctx, nextCanvas, nextCtx;
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;
let dropInterval = 1000;
let lastDropTime = 0;

// Initialize the game
function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  nextCanvas = document.getElementById('next-canvas');
  nextCtx = nextCanvas.getContext('2d');

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('pause-btn').addEventListener('click', togglePause);
  document.getElementById('restart-btn').addEventListener('click', startGame);
  
  document.addEventListener('keydown', handleKeyPress);

  resetBoard();
  drawBoard();
}

// Reset the game board
function resetBoard() {
  board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
}

// Start a new game
function startGame() {
  resetBoard();
  score = 0;
  level = 1;
  lines = 0;
  gameRunning = true;
  gamePaused = false;
  dropInterval = 1000;
  
  updateScore();
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('start-btn').disabled = true;
  document.getElementById('pause-btn').disabled = false;
  
  nextPiece = createPiece();
  spawnPiece();
  
  lastDropTime = Date.now();
  if (gameLoop) cancelAnimationFrame(gameLoop);
  gameLoop = requestAnimationFrame(update);
}

// Create a new random piece
function createPiece() {
  const shapeIndex = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[shapeIndex],
    color: shapeIndex + 1,
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
    y: 0
  };
}

// Spawn a new piece
function spawnPiece() {
  currentPiece = nextPiece;
  nextPiece = createPiece();
  
  if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
    gameOver();
  }
  
  drawNextPiece();
}

// Main game loop
function update() {
  if (!gameRunning || gamePaused) {
    gameLoop = requestAnimationFrame(update);
    return;
  }

  const currentTime = Date.now();
  if (currentTime - lastDropTime > dropInterval) {
    moveDown();
    lastDropTime = currentTime;
  }

  drawBoard();
  drawCurrentPiece();
  
  gameLoop = requestAnimationFrame(update);
}

// Handle keyboard input
function handleKeyPress(e) {
  if (!gameRunning || gamePaused) {
    if (e.key === 'p' || e.key === 'P') {
      togglePause();
    }
    return;
  }

  switch (e.key) {
    case 'ArrowLeft':
      moveLeft();
      break;
    case 'ArrowRight':
      moveRight();
      break;
    case 'ArrowDown':
      moveDown();
      break;
    case 'ArrowUp':
    case ' ':
      rotate();
      break;
    case 'p':
    case 'P':
      togglePause();
      break;
  }
}

// Movement functions
function moveLeft() {
  if (isValidMove(currentPiece.x - 1, currentPiece.y, currentPiece.shape)) {
    currentPiece.x--;
  }
}

function moveRight() {
  if (isValidMove(currentPiece.x + 1, currentPiece.y, currentPiece.shape)) {
    currentPiece.x++;
  }
}

function moveDown() {
  if (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
    currentPiece.y++;
    return true;
  } else {
    lockPiece();
    return false;
  }
}

function rotate() {
  const rotated = rotateMatrix(currentPiece.shape);
  if (isValidMove(currentPiece.x, currentPiece.y, rotated)) {
    currentPiece.shape = rotated;
  }
}

// Rotate a matrix 90 degrees clockwise
function rotateMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotated[col][rows - 1 - row] = matrix[row][col];
    }
  }
  
  return rotated;
}

// Check if a move is valid
function isValidMove(x, y, shape) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;
        
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return false;
        }
        
        if (newY >= 0 && board[newY][newX]) {
          return false;
        }
      }
    }
  }
  return true;
}

// Lock the current piece to the board
function lockPiece() {
  for (let row = 0; row < currentPiece.shape.length; row++) {
    for (let col = 0; col < currentPiece.shape[row].length; col++) {
      if (currentPiece.shape[row][col]) {
        const y = currentPiece.y + row;
        const x = currentPiece.x + col;
        if (y >= 0) {
          board[y][x] = currentPiece.color;
        }
      }
    }
  }
  
  clearLines();
  spawnPiece();
}

// Clear completed lines
function clearLines() {
  let linesCleared = 0;
  
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell !== 0)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      row++; // Check this row again
    }
  }
  
  if (linesCleared > 0) {
    lines += linesCleared;
    score += linesCleared * 100 * level;
    
    // Level up every 10 lines
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
      level = newLevel;
      dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }
    
    updateScore();
  }
}

// Update score display
function updateScore() {
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('lines').textContent = lines;
}

// Toggle pause
function togglePause() {
  if (!gameRunning) return;
  
  gamePaused = !gamePaused;
  document.getElementById('pause-btn').textContent = gamePaused ? 'Resume' : 'Pause';
}

// Game over
function gameOver() {
  gameRunning = false;
  document.getElementById('final-score').textContent = score;
  document.getElementById('game-over').classList.remove('hidden');
  document.getElementById('start-btn').disabled = false;
  document.getElementById('pause-btn').disabled = true;
  
  if (gameLoop) {
    cancelAnimationFrame(gameLoop);
  }
}

// Drawing functions
function drawBoard() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) {
        drawBlock(ctx, col, row, board[row][col]);
      }
    }
  }
}

function drawCurrentPiece() {
  if (!currentPiece) return;
  
  for (let row = 0; row < currentPiece.shape.length; row++) {
    for (let col = 0; col < currentPiece.shape[row].length; col++) {
      if (currentPiece.shape[row][col]) {
        drawBlock(ctx, currentPiece.x + col, currentPiece.y + row, currentPiece.color);
      }
    }
  }
}

function drawNextPiece() {
  nextCtx.fillStyle = '#000';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  
  if (!nextPiece) return;
  
  const offsetX = (nextCanvas.width / BLOCK_SIZE - nextPiece.shape[0].length) / 2;
  const offsetY = (nextCanvas.height / BLOCK_SIZE - nextPiece.shape.length) / 2;
  
  for (let row = 0; row < nextPiece.shape.length; row++) {
    for (let col = 0; col < nextPiece.shape[row].length; col++) {
      if (nextPiece.shape[row][col]) {
        drawBlock(nextCtx, offsetX + col, offsetY + row, nextPiece.color);
      }
    }
  }
}

function drawBlock(context, x, y, colorIndex) {
  const color = COLORS[colorIndex];
  const px = x * BLOCK_SIZE;
  const py = y * BLOCK_SIZE;
  
  context.fillStyle = color;
  context.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
  
  context.strokeStyle = '#000';
  context.lineWidth = 1;
  context.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
  
  // Add highlight for 3D effect
  context.fillStyle = 'rgba(255, 255, 255, 0.3)';
  context.fillRect(px + 2, py + 2, BLOCK_SIZE - 4, 4);
  context.fillRect(px + 2, py + 2, 4, BLOCK_SIZE - 4);
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', init);
