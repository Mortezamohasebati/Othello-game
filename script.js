const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const scoreBody = document.getElementById("score-body");
let gameMode = "";
const ROWS = 8;
const COLS = 8;
let board = [];
let currentPlayer = 1;
let turn = 1;

function startGame(mode) {
  gameMode = mode;
  document.getElementById("mode-selection").style.display = "none";
  document.getElementById("game-container").style.display = "block";
  initializeBoard();
}

function initializeBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  board[3][3] = 1;
  board[3][4] = 2;
  board[4][3] = 2;
  board[4][4] = 1;
  renderBoard();
  updateScoreTable();
}

function renderBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("click", () => handleCellClick(row, col));
      if (board[row][col] === 1) {
        const piece = document.createElement("div");
        piece.classList.add("piece", "white");
        cell.appendChild(piece);
      } else if (board[row][col] === 2) {
        const piece = document.createElement("div");
        piece.classList.add("piece", "black");
        cell.appendChild(piece);
      }
      boardElement.appendChild(cell);
    }
  }
}

function isValidMove(row, col, player) {
  if (board[row][col] !== 0) return false;
  const opponent = player === 1 ? 2 : 1;
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];
  for (const [dr, dc] of directions) {
    let r = row + dr, c = col + dc, foundOpponent = false;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      if (board[r][c] === opponent) {
        foundOpponent = true;
      } else if (board[r][c] === player && foundOpponent) {
        return true;
      } else {
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return false;
}

function applyMove(row, col, player, boardState = board) {
  boardState[row][col] = player;
  const opponent = player === 1 ? 2 : 1;
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];
  for (const [dr, dc] of directions) {
    let r = row + dr, c = col + dc, cellsToFlip = [];
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      if (boardState[r][c] === opponent) {
        cellsToFlip.push([r, c]);
      } else if (boardState[r][c] === player) {
        for (const [fr, fc] of cellsToFlip) {
          boardState[fr][fc] = player;
        }
        break;
      } else {
        break;
      }
      r += dr;
      c += dc;
    }
  }
}

function handleCellClick(row, col) {
  if (isValidMove(row, col, currentPlayer)) {
    applyMove(row, col, currentPlayer);
    if (gameMode === "multiplayer") {
      nextTurn();
    } else if (gameMode === "single") {
      currentPlayer = 2;
      setTimeout(makeAIMove, 500);
    }
  }
}

function makeAIMove() {
  const bestMove = minimax(board, 4, -Infinity, Infinity, true).move;
  if (bestMove) {
    applyMove(bestMove[0], bestMove[1], currentPlayer);
    nextTurn();
  }
}

function nextTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  renderBoard();
  updateScoreTable();
  const validMoves = getValidMoves(currentPlayer);
  if (!validMoves.length) {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    if (!getValidMoves(currentPlayer).length) {
      endGame();
      return;
    }
  }
  statusElement.textContent = `Player ${currentPlayer}'s turn (${currentPlayer === 1 ? "White" : "Black"})`;
  if (currentPlayer === 2 && gameMode === "single") {
    setTimeout(makeAIMove, 500);
  }
}

function getValidMoves(player) {
  const moves = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (isValidMove(row, col, player)) {
        moves.push([row, col]);
      }
    }
  }
  return moves;
}

function updateScoreTable() {
  const whiteScore = board.flat().filter(cell => cell === 1).length;
  const blackScore = board.flat().filter(cell => cell === 2).length;
  const newRow = document.createElement("tr");
  newRow.innerHTML = `<td>${turn++}</td><td>${whiteScore}</td><td>${blackScore}</td>`;
  scoreBody.appendChild(newRow);
}

function endGame() {
  const whiteScore = board.flat().filter(cell => cell === 1).length;
  const blackScore = board.flat().filter(cell => cell === 2).length;
  if (whiteScore === blackScore) {
    statusElement.textContent = `Game Over! It's a draw! (White: ${whiteScore}, Black: ${blackScore})`;
  } else {
    const winner = whiteScore > blackScore ? "Player 1 (White)" : "Player 2 (Black)";
    statusElement.textContent = `Game Over! ${winner} wins! (White: ${whiteScore}, Black: ${blackScore})`;
  }
}

// Minimax implementation
function minimax(board, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || (getValidMoves(1).length === 0 && getValidMoves(2).length === 0)) {
    return { score: evaluateBoard(board) };
  }
  const player = isMaximizing ? 2 : 1;
  const validMoves = getValidMoves(player);

  if (!validMoves.length) {
    return minimax(board, depth - 1, alpha, beta, !isMaximizing);
  }

  let bestMove = null;
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const [row, col] of validMoves) {
      const newBoard = board.map(row => [...row]);
      applyMove(row, col, player, newBoard);
      const eval = minimax(newBoard, depth - 1, alpha, beta, false).score;
      if (eval > maxEval) {
        maxEval = eval;
        bestMove = [row, col];
      }
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const [row, col] of validMoves) {
      const newBoard = board.map(row => [...row]);
      applyMove(row, col, player, newBoard);
      const eval = minimax(newBoard, depth - 1, alpha, beta, true).score;
      if (eval < minEval) {
        minEval = eval;
        bestMove = [row, col];
      }
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

function evaluateBoard(board) {
  const whiteScore = board.flat().filter(cell => cell === 1).length;
  const blackScore = board.flat().filter(cell => cell === 2).length;
  return blackScore - whiteScore;
}
