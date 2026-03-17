const WINNING_SCORE = 20;
const GAME_DURATION = 30;
const SPAWN_RATE_MS = 850;

const winningMessages = [
  'Victory. You delivered enough water to change the day for a whole community.',
  'You won. Fast hands, strong focus, and 20-plus cans collected.',
  'Mission complete. That round brought clean water within reach.'
];

const losingMessages = [
  'Time is up. Try again and push for 20 cans next round.',
  'Close, but not enough cans this time. Run it back and beat the goal.',
  'The clock won that round. Start again and keep the cans moving.'
];

let currentCans = 0;
let timeLeft = GAME_DURATION;
let gameActive = false;
let spawnInterval;
let timerInterval;

const grid = document.querySelector('.game-grid');
const scoreDisplay = document.getElementById('current-cans');
const timerDisplay = document.getElementById('timer');
const messageDisplay = document.getElementById('achievements');
const startButton = document.getElementById('start-game');

// Creates the 3x3 game grid where items will appear
function createGrid() {
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  
  // Clear all cells before spawning a new water can
  cells.forEach(cell => (cell.innerHTML = ''));

  // Select a random cell from the grid to place the water can
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // Use a template literal to create the wrapper and water-can element
  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can" aria-label="Collect water can" role="button"></div>
    </div>
  `;
}

function updateScoreDisplay() {
  scoreDisplay.textContent = currentCans;
}

function updateTimerDisplay() {
  timerDisplay.textContent = timeLeft;
}

function setMessage(message, stateClass = '') {
  messageDisplay.textContent = message;
  messageDisplay.className = 'achievement';
  if (stateClass) {
    messageDisplay.classList.add(stateClass);
  }
}

function getRandomMessage(messages) {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

function clearBoard() {
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.innerHTML = '';
  });
}

function handleCanClick(event) {
  if (!gameActive || !event.target.classList.contains('water-can')) {
    return;
  }

  currentCans += 1;
  updateScoreDisplay();
  event.target.closest('.grid-cell').innerHTML = '';
}

function runTimer() {
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return;

  currentCans = 0;
  timeLeft = GAME_DURATION;
  gameActive = true;
  updateScoreDisplay();
  updateTimerDisplay();
  createGrid();
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  setMessage('Go. Click every can you can before the 30-second timer expires.', 'is-playing');
  startButton.disabled = true;
  startButton.textContent = 'Game In Progress';
  spawnWaterCan();
  spawnInterval = setInterval(spawnWaterCan, SPAWN_RATE_MS);
  runTimer();
}

function endGame() {
  const didWin = currentCans >= WINNING_SCORE;

  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearBoard();
  setMessage(
    didWin ? getRandomMessage(winningMessages) : getRandomMessage(losingMessages),
    didWin ? 'is-win' : 'is-loss'
  );
  startButton.disabled = false;
  startButton.textContent = 'Play Again';
}

grid.addEventListener('click', handleCanClick);
startButton.addEventListener('click', startGame);

updateScoreDisplay();
updateTimerDisplay();
