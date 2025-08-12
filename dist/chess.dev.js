"use strict";

// Chess game logic
// 3D model filenames for each piece (for use with Three.js or similar)
var PIECE_MODELS = {
  wK: 'models/wK.glb',
  wQ: 'models/wQ.glb',
  wR: 'models/wR.glb',
  wB: 'models/wB.glb',
  wN: 'models/wN.glb',
  wP: 'models/wP.glb',
  bK: 'models/bK.glb',
  bQ: 'models/bQ.glb',
  bR: 'models/bR.glb',
  bB: 'models/bB.glb',
  bN: 'models/bN.glb',
  bP: 'models/bP.glb'
};
var PIECES = {
  wK: '♔',
  wQ: '♕',
  wR: '♖',
  wB: '♗',
  wN: '♘',
  wP: '♙',
  bK: '♚',
  bQ: '♛',
  bR: '♜',
  bB: '♝',
  bN: '♞',
  bP: '♟'
};
var board, selected, turn, mode, gameOver;

function initialBoard() {
  return [['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'], ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'], [null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null], ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'], ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']];
}

function renderBoard() {
  var boardDiv = document.getElementById('chessboard');
  boardDiv.innerHTML = '';

  var _loop = function _loop(r) {
    var _loop2 = function _loop2(c) {
      var sq = document.createElement('div');
      sq.className = 'square ' + ((r + c) % 2 ? 'dark' : 'light');
      sq.dataset.row = r;
      sq.dataset.col = c;
      if (selected && selected[0] === r && selected[1] === c) sq.classList.add('selected');
      var piece = board[r][c];
      if (piece) sq.textContent = PIECES[piece];

      sq.onclick = function () {
        return handleSquareClick(r, c);
      };

      boardDiv.appendChild(sq);
    };

    for (var c = 0; c < 8; c++) {
      _loop2(c);
    }
  };

  for (var r = 0; r < 8; r++) {
    _loop(r);
  }

  document.getElementById('turn-indicator').textContent = gameOver ? 'Game Over' : (turn === 'w' ? 'White' : 'Black') + "'s turn";
}

function handleSquareClick(r, c) {
  if (gameOver) return;
  var piece = board[r][c];

  if (selected) {
    if (selected[0] === r && selected[1] === c) {
      selected = null;
      renderBoard();
      return;
    }

    if (isValidMove(selected, [r, c], turn)) {
      movePiece(selected, [r, c]);
      selected = null;
      renderBoard();
      if (mode === 'ai' && turn === 'b' && !gameOver) setTimeout(aiMove, 500);
    } else {
      selected = null;
      renderBoard();
    }
  } else if (piece && piece[0] === turn) {
    selected = [r, c];
    renderBoard();
  }
}

function movePiece(from, to) {
  board[to[0]][to[1]] = board[from[0]][from[1]];
  board[from[0]][from[1]] = null;

  if (isCheckmate(opposite(turn))) {
    gameOver = true;
    document.getElementById('turn-indicator').textContent = (turn === 'w' ? 'White' : 'Black') + ' wins!';
  } else {
    turn = opposite(turn);
  }
}

function opposite(t) {
  return t === 'w' ? 'b' : 'w';
}

function isValidMove(from, to, color) {
  // Full chess move validation
  var piece = board[from[0]][from[1]];
  if (!piece || piece[0] !== color) return false;
  if (from[0] === to[0] && from[1] === to[1]) return false;
  var target = board[to[0]][to[1]];
  if (target && target[0] === color) return false;
  var dr = to[0] - from[0];
  var dc = to[1] - from[1]; // Board boundaries

  if (to[0] < 0 || to[0] > 7 || to[1] < 0 || to[1] > 7) return false; // Pawn

  if (piece[1] === 'P') {
    var dir = color === 'w' ? -1 : 1; // Move forward

    if (dc === 0 && dr === dir && !target) return true; // First move: two squares

    if (dc === 0 && dr === 2 * dir && !target && (color === 'w' && from[0] === 6 || color === 'b' && from[0] === 1) && !board[from[0] + dir][from[1]]) return true; // Capture

    if (Math.abs(dc) === 1 && dr === dir && target && target[0] !== color) return true; // TODO: En passant

    return false;
  } // Knight


  if (piece[1] === 'N') {
    if (Math.abs(dr) === 2 && Math.abs(dc) === 1 || Math.abs(dr) === 1 && Math.abs(dc) === 2) return true;
    return false;
  } // Bishop


  if (piece[1] === 'B') {
    if (Math.abs(dr) !== Math.abs(dc)) return false;
    var stepR = dr > 0 ? 1 : -1;
    var stepC = dc > 0 ? 1 : -1;

    for (var i = 1; i < Math.abs(dr); i++) {
      if (board[from[0] + i * stepR][from[1] + i * stepC]) return false;
    }

    return true;
  } // Rook


  if (piece[1] === 'R') {
    if (dr !== 0 && dc !== 0) return false;

    if (dr === 0) {
      var step = dc > 0 ? 1 : -1;

      for (var _i = 1; _i < Math.abs(dc); _i++) {
        if (board[from[0]][from[1] + _i * step]) return false;
      }
    } else {
      var _step = dr > 0 ? 1 : -1;

      for (var _i2 = 1; _i2 < Math.abs(dr); _i2++) {
        if (board[from[0] + _i2 * _step][from[1]]) return false;
      }
    }

    return true;
  } // Queen


  if (piece[1] === 'Q') {
    if (Math.abs(dr) === Math.abs(dc)) {
      var _stepR = dr > 0 ? 1 : -1;

      var _stepC = dc > 0 ? 1 : -1;

      for (var _i3 = 1; _i3 < Math.abs(dr); _i3++) {
        if (board[from[0] + _i3 * _stepR][from[1] + _i3 * _stepC]) return false;
      }

      return true;
    } else if (dr === 0 || dc === 0) {
      if (dr === 0) {
        var _step2 = dc > 0 ? 1 : -1;

        for (var _i4 = 1; _i4 < Math.abs(dc); _i4++) {
          if (board[from[0]][from[1] + _i4 * _step2]) return false;
        }
      } else {
        var _step3 = dr > 0 ? 1 : -1;

        for (var _i5 = 1; _i5 < Math.abs(dr); _i5++) {
          if (board[from[0] + _i5 * _step3][from[1]]) return false;
        }
      }

      return true;
    }

    return false;
  } // King


  if (piece[1] === 'K') {
    if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return true; // TODO: Castling

    return false;
  }

  return false;
}

function isCheckmate(color) {
  // Demo: check if king is captured
  var king = color + 'K';

  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      if (board[r][c] === king) return false;
    }
  }

  return true;
}

function aiMove() {
  // Smarter AI: pick the best move based on material gain and safety
  var pieceValues = {
    K: 1000,
    Q: 9,
    R: 5,
    B: 3,
    N: 3,
    P: 1
  };
  var moves = [];

  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
      var piece = board[r][c];

      if (piece && piece[0] === 'b') {
        for (var dr = 0; dr < 8; dr++) {
          for (var dc = 0; dc < 8; dc++) {
            if (isValidMove([r, c], [dr, dc], 'b')) {
              var score = 0;
              var target = board[dr][dc];

              if (target && target[0] === 'w') {
                score += pieceValues[target[1]] || 0;
              } // Simulate move and check if piece is immediately capturable


              var original = board[dr][dc];
              board[dr][dc] = piece;
              board[r][c] = null;
              var safe = true;

              for (var rr = 0; rr < 8; rr++) {
                for (var cc = 0; cc < 8; cc++) {
                  var opp = board[rr][cc];

                  if (opp && opp[0] === 'w' && isValidMove([rr, cc], [dr, dc], 'w')) {
                    safe = false;
                    break;
                  }
                }

                if (!safe) break;
              }

              board[r][c] = piece;
              board[dr][dc] = original;
              if (safe) score += 0.5; // prefer safe moves

              moves.push({
                from: [r, c],
                to: [dr, dc],
                score: score
              });
            }
          }
        }
      }
    }
  }

  if (moves.length === 0) return;
  moves.sort(function (a, b) {
    return b.score - a.score;
  });
  var best = moves[0];
  movePiece(best.from, best.to);
  renderBoard();
}

function setMode(m) {
  mode = m;
  resetGame();
}

function resetGame() {
  board = initialBoard();
  selected = null;
  turn = 'w';
  gameOver = false;
  renderBoard();
  if (mode === 'ai' && turn === 'b') setTimeout(aiMove, 500);
}

document.getElementById('mode-human').onclick = function () {
  return setMode('human');
};

document.getElementById('mode-ai').onclick = function () {
  return setMode('ai');
}; // Start game


mode = 'human';
resetGame();
//# sourceMappingURL=chess.dev.js.map
