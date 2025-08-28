// Chess game logic
// 3D model filenames for each piece (for use with Three.js or similar)
const PIECE_MODELS = {
    wK: 'models/wK.glb', wQ: 'models/wQ.glb', wR: 'models/wR.glb', wB: 'models/wB.glb', wN: 'models/wN.glb', wP: 'models/wP.glb',
    bK: 'models/bK.glb', bQ: 'models/bQ.glb', bR: 'models/bR.glb', bB: 'models/bB.glb', bN: 'models/bN.glb', bP: 'models/bP.glb'
};
const PIECES = {
    wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
    bK: ' ♚', bQ: ' ♛', bR: '  ♜', bB: '♝', bN: '♞', bP: '♟'
};

let board, selected, turn, mode, gameOver;

function initialBoard() {
    return [
        ['bR','bN','bB','bQ','bK','bB','bN','bR'],
        ['bP','bP','bP','bP','bP','bP','bP','bP'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['wP','wP','wP','wP','wP','wP','wP','wP'],
        ['wR','wN','wB','wQ','wK','wB','wN','wR']
    ];
}

function renderBoard() {
    const boardDiv = document.getElementById('chessboard');
    boardDiv.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            sq.className = 'square ' + ((r+c)%2 ? 'dark' : 'light');
            sq.dataset.row = r;
            sq.dataset.col = c;
            if (selected && selected[0] === r && selected[1] === c) sq.classList.add('selected');
            const piece = board[r][c];
            if (piece) {
                const span = document.createElement('span');
                span.textContent = PIECES[piece];
                span.className = piece[0] === 'w' ? 'white-piece' : 'black-piece';
                sq.appendChild(span);
            }
            sq.onclick = () => handleSquareClick(r, c);
            boardDiv.appendChild(sq);
        }
    }
    document.getElementById('turn-indicator').textContent = gameOver ? 'Game Over' : (turn === 'w' ? 'White' : 'Black') + "'s turn";
}

function handleSquareClick(r, c) {
    if (gameOver) return;
    const piece = board[r][c];
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
    const movingPiece = board[from[0]][from[1]];
    const capturedPiece = board[to[0]][to[1]];
    board[to[0]][to[1]] = movingPiece;
    board[from[0]][from[1]] = null;

    // Check if a king was captured
    if (capturedPiece && (capturedPiece[1] === 'K')) {
        gameOver = true;
        const winner = movingPiece[0] === 'w' ? 'White' : 'Black';
        document.getElementById('turn-indicator').textContent = winner + ' wins by capturing the king!';
        showWinAnimation(winner);
        resizeRenderer(); // Ensure renderer matches device size
        return;
    }

    // Check for checkmate as usual
    if (isCheckmate(opposite(turn))) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = (turn === 'w' ? 'White' : 'Black') + ' wins!';
        showWinAnimation(turn === 'w' ? 'White' : 'Black');
    } else {
        turn = opposite(turn);
    }
    resizeRenderer(); // Ensure renderer matches device size
}

function showWinAnimation(winner) {
    const anim = document.getElementById('win-animation');
    const msg = anim.querySelector('.win-message');
    msg.textContent = winner + ' Wins!';
    anim.style.display = 'flex';
    setTimeout(() => { anim.style.display = 'none'; }, 4000); // Hide after 4 seconds
}

function opposite(t) { return t === 'w' ? 'b' : 'w'; }

function isValidMove(from, to, color) {
    const piece = board[from[0]][from[1]];
    if (!piece || piece[0] !== color) return false;
    if (from[0] === to[0] && from[1] === to[1]) return false;
    const target = board[to[0]][to[1]];
    if (target && target[0] === color) return false;
    const dr = to[0] - from[0];
    const dc = to[1] - from[1];

    // Board boundaries
    if (to[0] < 0 || to[0] > 7 || to[1] < 0 || to[1] > 7) return false;

    // Pawn moves
    if (piece[1] === 'P') {
        const dir = color === 'w' ? -1 : 1;
        // Normal move
        if (dc === 0 && dr === dir && !target) return true;
        // Double move from start
        if (dc === 0 && dr === 2 * dir && from[0] === (color === 'w' ? 6 : 1) && !target && !board[from[0] + dir][from[1]]) return true;
        // Capture
        if (Math.abs(dc) === 1 && dr === dir && target && target[0] !== color) return true;
        // TODO: En passant
        return false;
    }

    // Knight moves
    if (piece[1] === 'N') {
        if ((Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2)) return true;
        return false;
    }

    // Bishop moves
    if (piece[1] === 'B') {
        if (Math.abs(dr) !== Math.abs(dc)) return false;
        for (let i = 1; i < Math.abs(dr); i++) {
            if (board[from[0] + i * Math.sign(dr)][from[1] + i * Math.sign(dc)]) return false;
        }
        return true;
    }

    // Rook moves
    if (piece[1] === 'R') {
        if (dr !== 0 && dc !== 0) return false;
        if (dr === 0) {
            for (let i = 1; i < Math.abs(dc); i++) {
                if (board[from[0]][from[1] + i * Math.sign(dc)]) return false;
            }
        } else {
            for (let i = 1; i < Math.abs(dr); i++) {
                if (board[from[0] + i * Math.sign(dr)][from[1]]) return false;
            }
        }
        return true;
    }

    // Queen moves
    if (piece[1] === 'Q') {
        if (Math.abs(dr) === Math.abs(dc)) {
            for (let i = 1; i < Math.abs(dr); i++) {
                if (board[from[0] + i * Math.sign(dr)][from[1] + i * Math.sign(dc)]) return false;
            }
            return true;
        } else if (dr === 0 || dc === 0) {
            if (dr === 0) {
                for (let i = 1; i < Math.abs(dc); i++) {
                    if (board[from[0]][from[1] + i * Math.sign(dc)]) return false;
                }
            } else {
                for (let i = 1; i < Math.abs(dr); i++) {
                    if (board[from[0] + i * Math.sign(dr)][from[1]]) return false;
                }
            }
            return true;
        }
        return false;
    }

    // King moves
    if (piece[1] === 'K') {
        if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return true;
        // TODO: Castling
        return false;
    }

    return false;
}

// Returns true if the king of the given color is in check
function isKingInCheck(color) {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === color + 'K') kingPos = [r, c];
        }
    }
    if (!kingPos) return true; // king is missing (shouldn't happen)
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece[0] !== color) {
                if (isValidMove([r, c], kingPos, opposite(color))) return true;
            }
        }
    }
    return false;
}

// Returns true if the given color is checkmated
function isCheckmate(color) {
    if (!isKingInCheck(color)) return false;
    // Try all moves for color, see if any escape check
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece[0] === color) {
                for (let dr = 0; dr < 8; dr++) {
                    for (let dc = 0; dc < 8; dc++) {
                        if (isValidMove([r, c], [dr, dc], color)) {
                            // Simulate move
                            const backupFrom = board[r][c];
                            const backupTo = board[dr][dc];
                            board[dr][dc] = board[r][c];
                            board[r][c] = null;
                            const stillInCheck = isKingInCheck(color);
                            // Undo move
                            board[r][c] = backupFrom;
                            board[dr][dc] = backupTo;
                            if (!stillInCheck) return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}

function aiMove() {
    // Smarter AI: pick the best move based on material gain and safety
    const pieceValues = { K: 1000, Q: 9, R: 5, B: 3, N: 3, P: 1 };
    let moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece[0] === 'b') {
                for (let dr = 0; dr < 8; dr++) {
                    for (let dc = 0; dc < 8; dc++) {
                        if (isValidMove([r, c], [dr, dc], 'b')) {
                            let score = 0;
                            const target = board[dr][dc];
                            if (target && target[0] === 'w') {
                                score += pieceValues[target[1]] || 0;
                            }
                            // Simulate move and check if piece is immediately capturable
                            const original = board[dr][dc];
                            board[dr][dc] = piece;
                            board[r][c] = null;
                            let safe = true;
                            for (let rr = 0; rr < 8; rr++) {
                                for (let cc = 0; cc < 8; cc++) {
                                    const opp = board[rr][cc];
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
                            moves.push({ from: [r, c], to: [dr, dc], score });
                        }
                    }
                }
            }
        }
    }
    if (moves.length === 0) return;
    moves.sort((a, b) => b.score - a.score);
    const best = moves[0];
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

document.getElementById('mode-human').onclick = () => setMode('human');
document.getElementById('mode-ai').onclick = () => setMode('ai');

// Start game
mode = 'human';
resetGame();

// Basic 3D chess piece placeholders using Three.js

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(400, 400);
document.getElementById('chessboard').appendChild(renderer.domElement);

// Simple board
for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 8; z++) {
        const geometry = new THREE.BoxGeometry(1, 0.1, 1);
        const material = new THREE.MeshPhongMaterial({ color: (x + z) % 2 === 0 ? 0xffffff : 0x444444 });
        const square = new THREE.Mesh(geometry, material);
        square.position.set(x - 3.5, 0, z - 3.5);
        scene.add(square);
    }
}

// Simple lighting
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0, 10, 0);
scene.add(light);

// Piece colors
const whiteMat = new THREE.MeshPhongMaterial({ color: 0xe0e0e0 });
const blackMat = new THREE.MeshPhongMaterial({ color: 0x222222 });

// Piece shapes (placeholder)
function createPiece(type, color) {
    let mesh;
    const mat = color === 'w' ? whiteMat : blackMat;
    switch (type) {
        case 'K': // King
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32), mat);
            const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), mat);
            cross.position.y = 0.8;
            mesh.add(cross);
            break;
        case 'Q': // Queen
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.1, 32), mat);
            const crown = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), mat);
            crown.position.y = 0.7;
            mesh.add(crown);
            break;
        case 'R': // Rook
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 32), mat);
            break;
        case 'B': // Bishop
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1, 32), mat);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), mat);
            tip.position.y = 0.7;
            mesh.add(tip);
            break;
        case 'N': // Knight
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 32), mat);
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.2), mat);
            head.position.y = 0.6;
            head.position.z = 0.2;
            mesh.add(head);
            break;
        case 'P': // Pawn
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.7, 32), mat);
            const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), mat);
            ball.position.y = 0.5;
            mesh.add(ball);
            break;
        default:
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
    }
    return mesh;
}

// Example usage: create a white king and a black queen
const whiteKing = createPiece('K', 'w');
whiteKing.position.set(-2, 0.15, 0);
scene.add(whiteKing);

const blackQueen = createPiece('Q', 'b');
blackQueen.position.set(2, 0.15, 0);
scene.add(blackQueen);

camera.position.set(0, 8, 8);
camera.lookAt(0, 0, 0);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Responsive renderer size
function resizeRenderer() {
    const boardDiv = document.getElementById('chessboard');
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.8; // 80% of the smaller dimension
    renderer.setSize(size, size);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeRenderer);
resizeRenderer();
