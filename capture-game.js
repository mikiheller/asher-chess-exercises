// Capture Game - Learn how pieces capture

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Chess piece unicode characters
const pieces = {
    whiteRook: '♖',
    whiteBishop: '♗',
    whiteQueen: '♕',
    whiteKing: '♔',
    blackPawn: '♟'
};

// Piece movement patterns
const pieceTypes = ['rook', 'bishop', 'queen', 'king'];

let currentPuzzle = null;
let selectedPiece = null;
let score = 0;
let streak = 0;
let bestStreak = 0;
let isShowingHint = false;

// LocalStorage key for this game
const BEST_STREAK_KEY = 'captureGame_bestStreak';

// DOM Elements
const chessboard = document.getElementById('chessboard');
const feedback = document.getElementById('feedback');
const scoreDisplay = document.getElementById('scoreDisplay');
const streakDisplay = document.getElementById('streakDisplay');
const bestStreakDisplay = document.getElementById('bestStreakDisplay');
const arrowOverlay = document.getElementById('arrowOverlay');

// Initialize the game
function init() {
    loadBestStreak();
    createBoard();
    generatePuzzle();
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
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const div = document.createElement('div');
            
            // Left column: rank labels
            if (col === 0 && row < 8) {
                div.className = 'square label rank-label';
                div.textContent = ranks[row];
            }
            // Bottom row: file labels
            else if (row === 8 && col > 0) {
                div.className = 'square label file-label';
                div.textContent = files[col - 1];
            }
            // Corner
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
                div.dataset.col = col - 1;
                div.dataset.row = row;
                div.id = `square-${file}${rank}`;
                div.addEventListener('click', handleSquareClick);
            }
            
            chessboard.appendChild(div);
        }
    }
}

// Generate a new puzzle
function generatePuzzle() {
    clearBoard();
    clearArrows();
    clearSelection();
    isShowingHint = false;
    
    // Pick a random piece type
    const pieceType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    
    // Place white piece in a position that allows for interesting puzzles
    const whitePiecePos = getRandomPosition();
    
    // Find all squares this piece can attack
    const attackedSquares = getAttackedSquares(pieceType, whitePiecePos);
    
    // If not enough attacked squares, regenerate
    if (attackedSquares.length < 1) {
        generatePuzzle();
        return;
    }
    
    // Pick one capturable pawn position
    const capturableIndex = Math.floor(Math.random() * attackedSquares.length);
    const capturablePawn = attackedSquares[capturableIndex];
    
    // Generate 2 non-capturable pawn positions
    const nonCapturablePawns = [];
    let attempts = 0;
    while (nonCapturablePawns.length < 2 && attempts < 100) {
        const pos = getRandomPosition();
        const posKey = `${pos.col},${pos.row}`;
        const whiteKey = `${whitePiecePos.col},${whitePiecePos.row}`;
        const capKey = `${capturablePawn.col},${capturablePawn.row}`;
        
        // Make sure it's not on the white piece, not capturable, and not already used
        const isOnWhite = posKey === whiteKey;
        const isOnCapturable = posKey === capKey;
        const isAttacked = attackedSquares.some(sq => sq.col === pos.col && sq.row === pos.row);
        const isAlreadyUsed = nonCapturablePawns.some(p => p.col === pos.col && p.row === pos.row);
        
        if (!isOnWhite && !isOnCapturable && !isAttacked && !isAlreadyUsed) {
            nonCapturablePawns.push(pos);
        }
        attempts++;
    }
    
    // If we couldn't place enough pawns, regenerate
    if (nonCapturablePawns.length < 2) {
        generatePuzzle();
        return;
    }
    
    // Store puzzle state
    currentPuzzle = {
        pieceType,
        whitePiece: whitePiecePos,
        capturablePawn,
        nonCapturablePawns,
        allPawns: [capturablePawn, ...nonCapturablePawns]
    };
    
    // Render the pieces
    renderPuzzle();
}

// Get random board position
function getRandomPosition() {
    return {
        col: Math.floor(Math.random() * 8),
        row: Math.floor(Math.random() * 8)
    };
}

// Get all squares a piece can attack from a position
function getAttackedSquares(pieceType, pos) {
    const squares = [];
    
    switch (pieceType) {
        case 'rook':
            // Horizontal and vertical
            for (let i = 0; i < 8; i++) {
                if (i !== pos.col) squares.push({ col: i, row: pos.row });
                if (i !== pos.row) squares.push({ col: pos.col, row: i });
            }
            break;
            
        case 'bishop':
            // Diagonals
            for (let i = 1; i < 8; i++) {
                if (pos.col + i < 8 && pos.row + i < 8) squares.push({ col: pos.col + i, row: pos.row + i });
                if (pos.col - i >= 0 && pos.row + i < 8) squares.push({ col: pos.col - i, row: pos.row + i });
                if (pos.col + i < 8 && pos.row - i >= 0) squares.push({ col: pos.col + i, row: pos.row - i });
                if (pos.col - i >= 0 && pos.row - i >= 0) squares.push({ col: pos.col - i, row: pos.row - i });
            }
            break;
            
        case 'queen':
            // Combination of rook and bishop
            for (let i = 0; i < 8; i++) {
                if (i !== pos.col) squares.push({ col: i, row: pos.row });
                if (i !== pos.row) squares.push({ col: pos.col, row: i });
            }
            for (let i = 1; i < 8; i++) {
                if (pos.col + i < 8 && pos.row + i < 8) squares.push({ col: pos.col + i, row: pos.row + i });
                if (pos.col - i >= 0 && pos.row + i < 8) squares.push({ col: pos.col - i, row: pos.row + i });
                if (pos.col + i < 8 && pos.row - i >= 0) squares.push({ col: pos.col + i, row: pos.row - i });
                if (pos.col - i >= 0 && pos.row - i >= 0) squares.push({ col: pos.col - i, row: pos.row - i });
            }
            break;
            
        case 'king':
            // One square in any direction
            const kingMoves = [
                { dc: 0, dr: 1 }, { dc: 0, dr: -1 },
                { dc: 1, dr: 0 }, { dc: -1, dr: 0 },
                { dc: 1, dr: 1 }, { dc: 1, dr: -1 },
                { dc: -1, dr: 1 }, { dc: -1, dr: -1 }
            ];
            for (const move of kingMoves) {
                const newCol = pos.col + move.dc;
                const newRow = pos.row + move.dr;
                if (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
                    squares.push({ col: newCol, row: newRow });
                }
            }
            break;
    }
    
    return squares;
}

// Render the puzzle on the board
function renderPuzzle() {
    const { pieceType, whitePiece, allPawns } = currentPuzzle;
    
    // Get piece character
    let pieceChar;
    switch (pieceType) {
        case 'rook': pieceChar = pieces.whiteRook; break;
        case 'bishop': pieceChar = pieces.whiteBishop; break;
        case 'queen': pieceChar = pieces.whiteQueen; break;
        case 'king': pieceChar = pieces.whiteKing; break;
    }
    
    // Place white piece
    const whiteSquare = getSquareElement(whitePiece.col, whitePiece.row);
    if (whiteSquare) {
        whiteSquare.textContent = pieceChar;
        whiteSquare.classList.add('has-piece', 'white-piece');
    }
    
    // Place pawns
    for (const pawn of allPawns) {
        const pawnSquare = getSquareElement(pawn.col, pawn.row);
        if (pawnSquare) {
            pawnSquare.textContent = pieces.blackPawn;
            pawnSquare.classList.add('has-piece', 'black-pawn');
        }
    }
}

// Get square element by col/row
function getSquareElement(col, row) {
    const file = files[col];
    const rank = ranks[row];
    return document.getElementById(`square-${file}${rank}`);
}

// Clear all pieces from board
function clearBoard() {
    const squares = document.querySelectorAll('.square.has-piece');
    squares.forEach(sq => {
        sq.textContent = '';
        sq.classList.remove('has-piece', 'white-piece', 'black-pawn', 'selected');
    });
}

// Clear selection state
function clearSelection() {
    selectedPiece = null;
    const selected = document.querySelector('.square.selected');
    if (selected) selected.classList.remove('selected');
}

// Handle square click
function handleSquareClick(e) {
    const square = e.target;
    const col = parseInt(square.dataset.col);
    const row = parseInt(square.dataset.row);
    
    // If no piece selected and clicked on white piece, select it
    if (!selectedPiece && square.classList.contains('white-piece')) {
        selectedPiece = { col, row };
        square.classList.add('selected');
        feedback.textContent = '';
        feedback.className = 'feedback';
        return;
    }
    
    // If piece is selected and clicked on a pawn, try to capture
    if (selectedPiece && square.classList.contains('black-pawn')) {
        const targetCol = col;
        const targetRow = row;
        
        // Check if this is the capturable pawn
        const isCorrect = (
            targetCol === currentPuzzle.capturablePawn.col &&
            targetRow === currentPuzzle.capturablePawn.row
        );
        
        if (isCorrect) {
            // Correct capture!
            showSuccess();
            if (!isShowingHint) {
                score++;
                streak++;
            }
            updateScore();
            
            // Generate new puzzle after delay
            setTimeout(() => {
                generatePuzzle();
            }, 1500);
        } else {
            // Wrong pawn
            showError();
            streak = 0;
            updateScore();
            
            if (!isShowingHint) {
                showMovementHint();
                isShowingHint = true;
            }
            
            clearSelection();
        }
        return;
    }
    
    // If piece is selected and clicked elsewhere, deselect
    if (selectedPiece) {
        clearSelection();
    }
}

// Show success feedback
function showSuccess() {
    feedback.textContent = 'nom nom nom 😋';
    feedback.className = 'feedback success';
    clearSelection();
    clearArrows();
}

// Show error feedback
function showError() {
    feedback.textContent = '✗';
    feedback.className = 'feedback error';
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

// Show movement hint arrows
function showMovementHint() {
    clearArrows();
    
    const { pieceType, whitePiece } = currentPuzzle;
    const whiteSquareEl = getSquareElement(whitePiece.col, whitePiece.row);
    if (!whiteSquareEl) return;
    
    const boardRect = chessboard.getBoundingClientRect();
    const squareRect = whiteSquareEl.getBoundingClientRect();
    const squareSize = squareRect.width;
    
    const centerX = squareRect.left - boardRect.left + squareSize / 2;
    const centerY = squareRect.top - boardRect.top + squareSize / 2;
    
    // Board edges (accounting for label areas)
    const labelWidth = 30;
    const labelHeight = 30;
    const boardLeft = labelWidth + squareSize / 2;
    const boardRight = boardRect.width - squareSize / 2;
    const boardTop = squareSize / 2;
    const boardBottom = boardRect.height - labelHeight - squareSize / 2;
    
    // Helper to calculate edge point for a direction
    function getEdgePoint(dx, dy) {
        if (dx === 0 && dy === 0) return { x: centerX, y: centerY };
        
        let steps = 8; // Maximum steps to edge
        
        if (dx !== 0) {
            const stepsX = dx > 0 ? (7 - whitePiece.col) : whitePiece.col;
            steps = Math.min(steps, stepsX);
        }
        if (dy !== 0) {
            const stepsY = dy > 0 ? (7 - whitePiece.row) : whitePiece.row;
            steps = Math.min(steps, stepsY);
        }
        
        return {
            x: centerX + dx * steps * squareSize,
            y: centerY + dy * steps * squareSize
        };
    }
    
    switch (pieceType) {
        case 'rook':
            // 4 cardinal directions to edge
            const rookUp = getEdgePoint(0, -1);
            const rookDown = getEdgePoint(0, 1);
            const rookLeft = getEdgePoint(-1, 0);
            const rookRight = getEdgePoint(1, 0);
            drawArrow(centerX, centerY, rookUp.x, rookUp.y);
            drawArrow(centerX, centerY, rookDown.x, rookDown.y);
            drawArrow(centerX, centerY, rookLeft.x, rookLeft.y);
            drawArrow(centerX, centerY, rookRight.x, rookRight.y);
            break;
            
        case 'bishop':
            // 4 diagonal directions to edge
            const bishopNE = getEdgePoint(1, -1);
            const bishopNW = getEdgePoint(-1, -1);
            const bishopSE = getEdgePoint(1, 1);
            const bishopSW = getEdgePoint(-1, 1);
            drawArrow(centerX, centerY, bishopNE.x, bishopNE.y);
            drawArrow(centerX, centerY, bishopNW.x, bishopNW.y);
            drawArrow(centerX, centerY, bishopSE.x, bishopSE.y);
            drawArrow(centerX, centerY, bishopSW.x, bishopSW.y);
            break;
            
        case 'queen':
            // 8 directions to edge
            const queenUp = getEdgePoint(0, -1);
            const queenDown = getEdgePoint(0, 1);
            const queenLeft = getEdgePoint(-1, 0);
            const queenRight = getEdgePoint(1, 0);
            const queenNE = getEdgePoint(1, -1);
            const queenNW = getEdgePoint(-1, -1);
            const queenSE = getEdgePoint(1, 1);
            const queenSW = getEdgePoint(-1, 1);
            drawArrow(centerX, centerY, queenUp.x, queenUp.y);
            drawArrow(centerX, centerY, queenDown.x, queenDown.y);
            drawArrow(centerX, centerY, queenLeft.x, queenLeft.y);
            drawArrow(centerX, centerY, queenRight.x, queenRight.y);
            drawArrow(centerX, centerY, queenNE.x, queenNE.y);
            drawArrow(centerX, centerY, queenNW.x, queenNW.y);
            drawArrow(centerX, centerY, queenSE.x, queenSE.y);
            drawArrow(centerX, centerY, queenSW.x, queenSW.y);
            break;
            
        case 'king':
            // One square in each direction
            const kingArrows = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 1, dy: -1 }, { dx: 1, dy: 1 },
                { dx: -1, dy: -1 }, { dx: -1, dy: 1 }
            ];
            for (const arrow of kingArrows) {
                // Only draw if the king can actually move there (within board)
                const newCol = whitePiece.col + arrow.dx;
                const newRow = whitePiece.row + arrow.dy;
                if (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
                    const endX = centerX + arrow.dx * squareSize;
                    const endY = centerY + arrow.dy * squareSize;
                    drawArrow(centerX, centerY, endX, endY);
                }
            }
            break;
    }
}

// Draw an arrow from (x1,y1) to (x2,y2)
function drawArrow(x1, y1, x2, y2) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', 'arrow-line movement-arrow visible');
    arrowOverlay.appendChild(line);
}

// Clear all arrows
function clearArrows() {
    const arrows = arrowOverlay.querySelectorAll('.arrow-line');
    arrows.forEach(arrow => arrow.remove());
}

// Start the game
document.addEventListener('DOMContentLoaded', init);

