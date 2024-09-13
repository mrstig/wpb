// app.js

// DOM Elements
const gridElement = document.getElementById('grid');
const wordElement = document.getElementById('word');
const scoreValueElement = document.getElementById('score-value');
const wordListElement = document.getElementById('word-list');
// const submitWordButton = document.getElementById('submit-word'); // Removed
const finishGameButton = document.getElementById('finish-game');
const rotateBoardButton = document.getElementById('rotate-board');
const totalWordsValueElement = document.getElementById('total-words-value');

// New DOM Elements for Modals
const modalOverlay = document.getElementById('modal-overlay');
const confirmationModal = document.getElementById('confirmation-modal');
const confirmFinishButton = document.getElementById('confirm-finish');
const cancelFinishButton = document.getElementById('cancel-finish');

const missedWordsOverlay = document.getElementById('missed-words-overlay');
const missedWordsModal = document.getElementById('missed-words-modal');
const missedWordsCountElement = document.getElementById('missed-words-count');
const missedWordsListElement = document.getElementById('missed-words-list');
const playAgainButton = document.getElementById('play-again');
const exitGameButton = document.getElementById('exit-game');

// Game Variables
const gridSize = 4;
let grid = [];
let selectedTiles = [];
let currentWord = '';
let score = 0;
let foundWords = [];
let allValidWords = new Set();

// Boggle Dice Configuration
const boggleDice = [
  'AAEEGN',
  'ABBJOO',
  'ACHOPS',
  'AFFKPS',
  'AOOTTW',
  'CIMOTU',
  'DEILRX',
  'DELRVY',
  'DISTTY',
  'EEGHNW',
  'EEINSU',
  'EHRTVW',
  'EIOSST',
  'ELRTTY',
  'HIMNQU',
  'HLNNRZ',
];

// Trie Root
let trieRoot;

// Load the word list from words.txt
let wordList = [];

function loadWordList() {
  fetch('words.txt')
    .then(response => response.text())
    .then(data => {
      wordList = data
        .split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 3); // Optional: Filter out short words

      // Build the Trie after loading the word list
      trieRoot = buildTrie(wordList);

      // Initialize the game after the word list is ready
      initGame();
    })
    .catch(error => {
      console.error('Error loading word list:', error);
      alert('Failed to load word list. Please try again.');
    });
}

// Trie Node Class
class TrieNode {
  constructor() {
    this.children = {};
    this.isWord = false;
  }
}

// Build the Trie for the dictionary
function buildTrie(words) {
  const root = new TrieNode();
  for (const word of words) {
    let node = root;
    for (const char of word) {
      const uppercaseChar = char.toUpperCase();
      if (!node.children[uppercaseChar]) {
        node.children[uppercaseChar] = new TrieNode();
      }
      node = node.children[uppercaseChar];
    }
    node.isWord = true;
  }
  return root;
}

// Generate the grid using Boggle dice
function generateGrid() {
  grid = []; // Clear the grid array
  const shuffledDice = boggleDice.sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffledDice.length; i++) {
    const die = shuffledDice[i];
    const letter = die[Math.floor(Math.random() * die.length)];
    const tile = {
      letter: letter === 'Q' ? 'Qu' : letter,
      x: i % gridSize,
      y: Math.floor(i / gridSize),
      selected: false,
      element: null,
    };
    grid.push(tile);
  }
}

// Render the grid on the page
function renderGrid() {
  gridElement.innerHTML = '';
  grid.forEach((tile, index) => {
    const tileElement = document.createElement('div');
    tileElement.classList.add('tile');
    if (tile.letter === 'Qu') {
      tileElement.classList.add('qu');
    }

    // Create inner elements for adjusted sensitivity
    const tileInner = document.createElement('div');
    tileInner.classList.add('tile-inner');

    const tileContent = document.createElement('div');
    tileContent.classList.add('tile-content');
    tileContent.textContent = tile.letter;

    tileInner.appendChild(tileContent);
    tileElement.appendChild(tileInner);

    tile.element = tileElement;
    gridElement.appendChild(tileElement);
  });

  addGridEventListeners();
}

// Add event listeners to the grid
function addGridEventListeners() {
  // Remove previous event listeners to prevent duplicates
  gridElement.removeEventListener('touchstart', onTouchStart);
  gridElement.removeEventListener('touchmove', onTouchMove);
  gridElement.removeEventListener('touchend', onTouchEnd);
  gridElement.removeEventListener('mousedown', onTouchStart);
  gridElement.removeEventListener('mousemove', onTouchMove);
  gridElement.removeEventListener('mouseup', onTouchEnd);

  // Add touch event listeners to the grid
  gridElement.addEventListener('touchstart', onTouchStart);
  gridElement.addEventListener('touchmove', onTouchMove);
  gridElement.addEventListener('touchend', onTouchEnd);

  // For mouse support (optional)
  gridElement.addEventListener('mousedown', onTouchStart);
  gridElement.addEventListener('mousemove', onTouchMove);
  gridElement.addEventListener('mouseup', onTouchEnd);
}

// Handle touch events
let isSelecting = false;

function onTouchStart(event) {
  event.preventDefault();
  isSelecting = true;
  const index = getTileIndexFromEvent(event);
  if (index !== null) {
    selectTile(index);
  }
}

function onTouchMove(event) {
  event.preventDefault();
  if (!isSelecting) return;
  const index = getTileIndexFromEvent(event);
  if (index !== null) {
    selectTile(index);
  }
}

function onTouchEnd(event) {
  event.preventDefault();
  isSelecting = false;

  if (currentWord.length > 0) {
    submitCurrentWord();
  } else {
    // Reset selection if no word has been formed
    resetSelection();
  }
}

function getTileIndexFromEvent(event) {
  const touch = event.touches ? event.touches[0] : event;
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  if (element && element.classList.contains('tile-content')) {
    const tileElement = element.closest('.tile');
    return Array.from(gridElement.children).indexOf(tileElement);
  }
  return null;
}

// Select or deselect a tile
function selectTile(index) {
  const tile = grid[index];

  // Check if the tile is already selected
  if (tile.selected) {
    // If it's the last selected tile, do nothing
    if (index === selectedTiles[selectedTiles.length - 1]) {
      return;
    }
    // If it's the previous tile, deselect the last tile
    else if (
      selectedTiles.length >= 2 &&
      index === selectedTiles[selectedTiles.length - 2]
    ) {
      // Deselect the last tile
      const lastTileIndex = selectedTiles.pop();
      const lastTile = grid[lastTileIndex];
      lastTile.selected = false;
      lastTile.element.classList.remove('selected');

      // Update the current word
      currentWord = currentWord.slice(0, -lastTile.letter.length); // Adjust for 'Qu'
      wordElement.textContent = currentWord;

      // Update word appearance
      wordElement.classList.remove('valid-word', 'invalid-word');
      return;
    } else {
      // Ignore other already selected tiles
      return;
    }
  } else {
    // Check adjacency
    if (selectedTiles.length > 0) {
      const lastTileIndex = selectedTiles[selectedTiles.length - 1];
      const lastTile = grid[lastTileIndex];
      if (!isAdjacent(tile, lastTile)) {
        return;
      }
    }

    // Proceed with selection
    tile.selected = true;
    tile.element.classList.add('selected');
    selectedTiles.push(index);
    currentWord += tile.letter.toUpperCase();
    wordElement.textContent = currentWord;

    // Reset word styling during selection
    wordElement.classList.remove('valid-word', 'invalid-word');
  }
}

// Check if two tiles are adjacent
function isAdjacent(tile1, tile2) {
  const dx = Math.abs(tile1.x - tile2.x);
  const dy = Math.abs(tile1.y - tile2.y);
  return dx <= 1 && dy <= 1;
}

// Reset the current selection
function resetSelection() {
  selectedTiles.forEach((index) => {
    const tile = grid[index];
    tile.selected = false;
    tile.element.classList.remove('selected');
  });
  selectedTiles = [];
  currentWord = '';
  wordElement.textContent = '';
  wordElement.classList.remove('valid-word', 'invalid-word');
}

// Submit the current word
function submitCurrentWord() {
  if (
    currentWord.length >= 3 &&
    !foundWords.includes(currentWord) &&
    allValidWords.has(currentWord)
  ) {
    // Valid word found
    foundWords.push(currentWord);
    const wordItem = document.createElement('li');
    wordItem.textContent = currentWord;
    wordListElement.appendChild(wordItem);
    score += calculateWordScore(currentWord);
    scoreValueElement.textContent = score;

    // Provide visual feedback for valid word
    wordElement.classList.add('valid-word');
    setTimeout(() => {
      wordElement.classList.remove('valid-word');
      resetSelection();
    }, 500);
  } else {
    // Invalid word
    // Provide subtle feedback for invalid word
    wordElement.classList.add('invalid-word');
    setTimeout(() => {
      wordElement.classList.remove('invalid-word');
      resetSelection();
    }, 500);
  }
}

// Calculate score for a word
function calculateWordScore(word) {
  // Boggle scoring rules
  const length = word.length;
  if (length <= 4) return 1;
  else if (length === 5) return 2;
  else if (length === 6) return 3;
  else if (length === 7) return 5;
  else return 11;
}

// Build a Trie and find all valid words on the board
function findAllWords() {
  allValidWords.clear();
  const visited = Array(grid.length).fill(false);

  for (let i = 0; i < grid.length; i++) {
    dfs(i, trieRoot, '', visited);
  }

  // Update the total words display
  totalWordsValueElement.textContent = allValidWords.size;
}

function dfs(index, node, prefix, visited) {
  const tile = grid[index];
  const letter = tile.letter.toUpperCase();
  const nextNode = node.children[letter];

  if (!nextNode) return; // No words start with this prefix

  const newPrefix = prefix + letter;
  if (nextNode.isWord && newPrefix.length >= 3) {
    allValidWords.add(newPrefix);
  }

  visited[index] = true;

  const neighbors = getAdjacentIndices(index);
  for (const neighborIndex of neighbors) {
    if (!visited[neighborIndex]) {
      dfs(neighborIndex, nextNode, newPrefix, visited);
    }
  }

  visited[index] = false;
}

function getAdjacentIndices(index) {
  const x = index % gridSize;
  const y = Math.floor(index / gridSize);
  const indices = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        indices.push(ny * gridSize + nx);
      }
    }
  }
  return indices;
}

function isValidPrefix(prefix) {
  let node = trieRoot;
  for (const char of prefix) {
    if (!node.children[char]) {
      return false;
    }
    node = node.children[char];
  }
  return true;
}

function isCompleteWord(word) {
  let node = trieRoot;
  for (const char of word) {
    if (!node.children[char]) {
      return false;
    }
    node = node.children[char];
  }
  return node.isWord;
}

// Finish the game
finishGameButton.addEventListener('click', () => {
  // Show the confirmation modal
  modalOverlay.classList.remove('hidden');
});

// Confirmation modal event listeners
confirmFinishButton.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
  showMissedWords();
});

cancelFinishButton.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
});

// Show missed words and offer to play again
function showMissedWords() {
  // Calculate missed words
  const missedWords = Array.from(allValidWords).filter(
    (word) => !foundWords.includes(word)
  );

  // Display missed words
  missedWordsCountElement.textContent = missedWords.length;
  missedWordsListElement.textContent = missedWords.join(', ');

  // Show the missed words modal
  missedWordsOverlay.classList.remove('hidden');
}

// Missed words modal event listeners
playAgainButton.addEventListener('click', () => {
  missedWordsOverlay.classList.add('hidden');
  restartGame();
});

exitGameButton.addEventListener('click', () => {
  missedWordsOverlay.classList.add('hidden');
  alert('Thank you for playing!');
  // Optionally, reset the game or navigate away
});

// Restart the game
function restartGame() {
  // Clear the grid
  grid = [];
  gridElement.innerHTML = '';

  // Reset variables
  selectedTiles = [];
  currentWord = '';
  wordElement.textContent = '';
  wordElement.classList.remove('valid-word', 'invalid-word');

  score = 0;
  scoreValueElement.textContent = score;

  foundWords = [];
  wordListElement.innerHTML = '';

  allValidWords.clear();
  totalWordsValueElement.textContent = '0';

  // Re-initialize the game
  initGame();
}

// Rotate the board
rotateBoardButton.addEventListener('click', rotateBoard);

function rotateBoard() {
  rotateGrid();
}

function rotateGrid() {
  // Create a new grid array
  const newGrid = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = gridSize - 1; y >= 0; y--) {
      const index = y * gridSize + x;
      const tile = grid[index];
      newGrid.push(tile);
    }
  }

  // Update the x and y coordinates of tiles
  newGrid.forEach((tile, index) => {
    tile.x = index % gridSize;
    tile.y = Math.floor(index / gridSize);
  });

  grid = newGrid;

  // Re-render the grid
  renderGrid();
}

// Initialize the game
function initGame() {
  // Hide the loading message
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.style.display = 'none';
  }
  // Show the game container
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.style.display = 'block';
  }

  generateGrid();
  renderGrid();
  findAllWords();
  console.log('All valid words:', allValidWords); // For debugging
}

// Start the process by loading the word list
loadWordList();
