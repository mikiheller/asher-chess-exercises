// Chess Square Naming Game

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']; // Display from top to bottom

let currentSquare = null;
let score = 0;
let streak = 0;
let bestStreak = 0;
let isShowingHint = false;

// LocalStorage key for this game
const BEST_STREAK_KEY = 'nameSquares_bestStreak';

// DOM Elements
const chessboard = document.getElementById('chessboard');
const answerInput = document.getElementById('answerInput');
const feedback = document.getElementById('feedback');
const scoreDisplay = document.getElementById('scoreDisplay');
const streakDisplay = document.getElementById('streakDisplay');
const bestStreakDisplay = document.getElementById('bestStreakDisplay');
const arrowOverlay = document.getElementById('arrowOverlay');

// Initialize the game
function init() {
    loadBestStreak();
    createBoard();
    selectRandomSquare();
    setupEventListeners();
}

// Load best streak from localStorage
function loadBestStreak() {
    const saved = localStorage.getItem(BEST_STREAK_KEY);
    if (saved) {
        bestStreak = parseInt(saved, 10);
        bestStreakDisplay.textContent = bestStreak;
    }
}

// Save best streak to localStorage
function saveBestStreak() {
    localStorage.setItem(BEST_STREAK_KEY, bestStreak.toString());
}

// Create the chessboard
function createBoard() {
    chessboard.innerHTML = '';
    
    // Create all rows including labels
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const div = document.createElement('div');
            
            // Left column: rank labels (8-1)
            if (col === 0 && row < 8) {
                div.className = 'square label rank-label';
                div.textContent = ranks[row];
            }
            // Bottom row: file labels (a-h)
            else if (row === 8 && col > 0) {
                div.className = 'square label file-label';
                div.textContent = files[col - 1];
            }
            // Corner (bottom-left)
            else if (row === 8 && col === 0) {
                div.className = 'square label corner';
            }
            // Regular squares
            else if (col > 0 && row < 8) {
                const file = files[col - 1];
                const rank = ranks[row];
                const isLight = (col + row) % 2 === 1;
                
                div.className = `square ${isLight ? 'light' : 'dark'}`;
                div.dataset.square = `${file}${rank}`;
                div.id = `square-${file}${rank}`;
            }
            
            chessboard.appendChild(div);
        }
    }
}

// Select a random square to highlight
function selectRandomSquare() {
    // Clear previous highlight
    if (currentSquare) {
        const prevSquare = document.getElementById(`square-${currentSquare}`);
        if (prevSquare) {
            prevSquare.classList.remove('highlighted');
        }
    }
    
    // Clear arrows
    clearArrows();
    isShowingHint = false;
    
    // Pick a new random square
    const randomFile = files[Math.floor(Math.random() * 8)];
    const randomRank = ranks[Math.floor(Math.random() * 8)];
    currentSquare = `${randomFile}${randomRank}`;
    
    // Highlight it
    const newSquare = document.getElementById(`square-${currentSquare}`);
    if (newSquare) {
        newSquare.classList.add('highlighted');
    }
    
    // Clear input and feedback
    answerInput.value = '';
    feedback.textContent = '';
    feedback.className = 'feedback';
    answerInput.focus();
}

// Check the answer
function checkAnswer() {
    const answer = answerInput.value.toLowerCase().trim();
    
    if (answer === '') return;
    
    if (answer === currentSquare) {
        // Correct!
        showFeedback(true);
        
        if (!isShowingHint) {
            score++;
            streak++;
        }
        
        updateScore();
        
        // Move to next square after a delay
        setTimeout(() => {
            selectRandomSquare();
        }, 1000);
    } else {
        // Wrong
        showFeedback(false);
        streak = 0;
        updateScore();
        
        if (!isShowingHint) {
            // Show hint arrows
            showHintArrows();
            isShowingHint = true;
        }
        
        // Clear input for retry
        answerInput.value = '';
        answerInput.focus();
    }
}

// Show feedback (checkmark or X)
function showFeedback(isCorrect) {
    feedback.textContent = isCorrect ? '✓' : '✗';
    feedback.className = `feedback ${isCorrect ? 'success' : 'error'}`;
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
    
    // Update best streak if current streak is higher
    if (streak > bestStreak) {
        bestStreak = streak;
        bestStreakDisplay.textContent = bestStreak;
        saveBestStreak();
    }
}

// Show hint arrows pointing to the file and rank labels
function showHintArrows() {
    const square = document.getElementById(`square-${currentSquare}`);
    if (!square) return;
    
    const boardRect = chessboard.getBoundingClientRect();
    const squareRect = square.getBoundingClientRect();
    
    // Calculate center of the highlighted square relative to the board
    const squareCenterX = squareRect.left - boardRect.left + squareRect.width / 2;
    const squareCenterY = squareRect.top - boardRect.top + squareRect.height / 2;
    
    // Get the file label position (bottom row)
    const file = currentSquare[0];
    const fileIndex = files.indexOf(file);
    const fileLabelX = squareCenterX; // Same X as the square
    const fileLabelY = boardRect.height - 15; // Bottom row
    
    // Get the rank label position (left column)
    const rank = currentSquare[1];
    const rankIndex = ranks.indexOf(rank);
    const rankLabelX = 15; // Left column
    const rankLabelY = squareCenterY; // Same Y as the square
    
    // Clear existing arrows
    clearArrows();
    
    // Create arrow to file label (pointing down)
    const fileArrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    fileArrow.setAttribute('x1', squareCenterX);
    fileArrow.setAttribute('y1', squareCenterY + squareRect.height / 2 + 5);
    fileArrow.setAttribute('x2', fileLabelX);
    fileArrow.setAttribute('y2', fileLabelY - 10);
    fileArrow.setAttribute('class', 'arrow-line visible');
    arrowOverlay.appendChild(fileArrow);
    
    // Create arrow to rank label (pointing left)
    const rankArrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rankArrow.setAttribute('x1', squareCenterX - squareRect.width / 2 - 5);
    rankArrow.setAttribute('y1', squareCenterY);
    rankArrow.setAttribute('x2', rankLabelX + 20);
    rankArrow.setAttribute('y2', rankLabelY);
    rankArrow.setAttribute('class', 'arrow-line visible');
    arrowOverlay.appendChild(rankArrow);
}

// Clear arrows
function clearArrows() {
    const arrows = arrowOverlay.querySelectorAll('.arrow-line');
    arrows.forEach(arrow => arrow.remove());
}

// Event listeners
function setupEventListeners() {
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    // Auto-submit when 2 characters are entered
    answerInput.addEventListener('input', () => {
        if (answerInput.value.length === 2) {
            // Small delay for better UX
            setTimeout(checkAnswer, 100);
        }
    });
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', init);


