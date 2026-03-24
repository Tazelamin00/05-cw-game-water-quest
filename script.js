const WINNING_SCORE = 20;
const GAME_DURATION = 30;
const SPAWN_RATE_MS = 850;
const BOMB_SPAWN_CHANCE = 0.25;
const BOMB_SCORE_PENALTY = 2;
const BOMB_TIME_PENALTY = 2;
const CELEBRATION_PARTICLES = 70;

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

const bombMessages = [
  'Bomb hit. Lost 2 cans and 2 seconds.',
  'Careful. That bomb cost you 2 points and 2 seconds.',
  'Wrong click. Bomb penalty: -2 score and -2s.'
];


let currentCans = 0;
let timeLeft = GAME_DURATION;
let gameActive = false;
let spawnInterval;
let timerInterval;
let celebrationTimeout;


const grid = document.querySelector('.game-grid');
const scoreDisplay = document.getElementById('current-cans');
const timerDisplay = document.getElementById('timer');
const messageDisplay = document.getElementById('achievements');
const startButton = document.getElementById('start-game');
const resetButton = document.getElementById('reset-game');
const gameContainer = document.querySelector('.container');
const confettiLayer = document.querySelector('.confetti-layer');
 
// Audio elements
const audioCollect = document.getElementById('audio-collect');
const audioBomb = document.getElementById('audio-bomb');
const audioWin = document.getElementById('audio-win');
const audioTick = document.getElementById('audio-tick');

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
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  // Clear all cells before spawning
  cells.forEach(cell => (cell.innerHTML = ''));

  // Place water can in a random cell
  const canIndex = Math.floor(Math.random() * cells.length);
  cells[canIndex].innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can" aria-label="Collect water can" role="button"></div>
    </div>
  `;

  // With chance, place a bomb in a different random cell
  if (Math.random() < BOMB_SPAWN_CHANCE) {
    let bombIndex;
    do {
      bombIndex = Math.floor(Math.random() * cells.length);
    } while (bombIndex === canIndex);
    cells[bombIndex].innerHTML = `
      <div class="water-can-wrapper">
        <div class="bomb" aria-label="Bomb. Avoid clicking" role="button"></div>
      </div>
    `;
  }
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

function clearCelebration() {
  clearTimeout(celebrationTimeout);
  gameContainer.classList.remove('is-celebrating');
  confettiLayer.innerHTML = '';
}

function celebrateWin() {
  const confettiColors = ['#ffc907', '#2e9df7', '#4fcb53', '#f5402c', '#f16061'];

  clearCelebration();
  gameContainer.classList.add('is-celebrating');

  for (let i = 0; i < CELEBRATION_PARTICLES; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty('--confetti-color', confettiColors[i % confettiColors.length]);
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${1.9 + Math.random() * 1.2}s`;
    piece.style.transform = `translateY(-24px) rotate(${Math.random() * 360}deg)`;
    confettiLayer.appendChild(piece);
  }

  celebrationTimeout = setTimeout(() => {
    clearCelebration();
  }, 3200);
}

function playSoundAlways(audioElem) {
  if (!audioElem) return;
  try {
    // Clone and play to allow overlapping sounds
    const clone = audioElem.cloneNode();
    clone.volume = audioElem.volume;
    clone.play();
  } catch (e) {
    // fallback: reset and play original
    audioElem.currentTime = 0;
    audioElem.play();
  }
}

function handleCanClick(event) {
  if (!gameActive) {
    return;
  }

  if (event.target.classList.contains('bomb')) {
    currentCans = Math.max(0, currentCans - BOMB_SCORE_PENALTY);
    timeLeft = Math.max(0, timeLeft - BOMB_TIME_PENALTY);
    updateScoreDisplay();
    updateTimerDisplay();
    setMessage(getRandomMessage(bombMessages), 'is-penalty');
    event.target.closest('.grid-cell').innerHTML = '';
    playSoundAlways(audioBomb);
    if (timeLeft <= 0) {
      endGame();
    }
    return;
  }

  if (!event.target.classList.contains('water-can')) {
    return;
  }

  currentCans += 1;
  updateScoreDisplay();
  event.target.closest('.grid-cell').innerHTML = '';
  playSoundAlways(audioCollect);
}

function runTimer() {
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();
    if (audioTick && gameActive && timeLeft > 0) {
      audioTick.currentTime = 0;
      audioTick.play();
    }
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return;

  clearCelebration();
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


  if (didWin) {
    celebrateWin();
    if (audioWin) {
      audioWin.currentTime = 0;
      audioWin.play();
    }
  }

  startButton.disabled = false;
  startButton.textContent = 'Play Again';
}

function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearCelebration();
  currentCans = 0;
  timeLeft = GAME_DURATION;
  updateScoreDisplay();
  updateTimerDisplay();
  createGrid();
  setMessage('Round reset. Press start to begin your 30-second round.');
  startButton.disabled = false;
  startButton.textContent = 'Start Game';
}

grid.addEventListener('click', handleCanClick);
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);

updateScoreDisplay();
updateTimerDisplay();
