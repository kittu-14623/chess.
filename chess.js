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

  function opposite(t) { return t === 'w' ? 'b' : 'w'; }

  // ================= 3D RENDERER =====================

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias:true });
  document.getElementById('chessboard').appendChild(renderer.domElement);

  // Lights
  const light = new THREE.PointLight(0xffffff, 1, 100);
  light.position.set(0, 15, 0);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x555555));

  // Board
  for (let x=0; x<8; x++) {
    for (let z=0; z<8; z++) {
      const geo = new THREE.BoxGeometry(1,0.1,1);
      const mat = new THREE.MeshPhongMaterial({ color:(x+z)%2===0 ? 0xffffff:0x444444 });
      const square = new THREE.Mesh(geo, mat);
      square.position.set(x-3.5, 0, z-3.5);
      scene.add(square);
    }
  }

  // Materials
  const whiteMat = new THREE.MeshPhongMaterial({ color: 0xe0e0e0 });
  const blackMat = new THREE.MeshPhongMaterial({ color: 0x222222 });

  // Create piece mesh
  function createPieceMesh(type, color) {
    let mesh;
    const mat = color==='w'? whiteMat:blackMat;
    switch(type) {
      case 'K':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,1.2,32), mat);
        const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.5,0.1), mat);
        cross.position.y=0.8; mesh.add(cross);
        break;
      case 'Q':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.5,1.1,32), mat);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.2,16,16), mat);
        crown.position.y=0.7; mesh.add(crown);
        break;
      case 'R':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.9,32), mat);
        break;
      case 'B':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.45,1,32), mat);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.15,16,16), mat);
        tip.position.y=0.7; mesh.add(tip);
        break;
      case 'N':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.8,32), mat);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.4,0.2), mat);
        head.position.y=0.6; head.position.z=0.2; mesh.add(head);
        break;
      case 'P':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.35,0.7,32), mat);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13,16,16), mat);
        ball.position.y=0.5; mesh.add(ball);
        break;
      default:
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5), mat);
    }
    return mesh;
  }

  const pieceMeshes = {}; // map pos "r_c" -> mesh

  function render3DBoard() {
    // clear old meshes
    Object.values(pieceMeshes).forEach(m => scene.remove(m));
    Object.keys(pieceMeshes).forEach(k => delete pieceMeshes[k]);

    for (let r=0; r<8; r++) {
      for (let c=0; c<8; c++) {
        const piece = board[r][c];
        if (piece) {
          const mesh = createPieceMesh(piece[1], piece[0]);
          mesh.position.set(c-3.5, 0.15, r-3.5);
          scene.add(mesh);
          pieceMeshes[`${r}_${c}`] = mesh;
        }
      }
    }
    document.getElementById('turn-indicator').textContent = 
      gameOver ? "Game Over" : (turn==='w'?"White":"Black")+"'s turn";
  }

  // ================= MOVES =====================
  function isValidMove(from,to,color){
    // same as your logic (kept for brevity)...
    // [PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING rules go here exactly like your version]
    // (for space, reuse your existing isValidMove function here)
    // ...
    return false;
  }

  function movePiece(from,to){
    const movingPiece = board[from[0]][from[1]];
    const capturedPiece = board[to[0]][to[1]];
    board[to[0]][to[1]] = movingPiece;
    board[from[0]][from[1]] = null;

    if (capturedPiece && capturedPiece[1]==='K') {
      gameOver=true;
      const winner = movingPiece[0]==='w'?'White':'Black';
      document.getElementById('turn-indicator').textContent = winner+" wins!";
      showWinAnimation(winner);
      return;
    }
    turn = opposite(turn);
    render3DBoard();
  }

  function showWinAnimation(winner){
    const anim=document.getElementById('win-animation');
    anim.querySelector('.win-message').textContent = winner+" Wins!";
    anim.style.display="flex";
    setTimeout(()=>{anim.style.display="none"},4000);
  }

  // =============== INIT + CONTROLS ==================
  function resetGame(){
    board = initialBoard();
    selected=null;
    turn='w';
    gameOver=false;
    render3DBoard();
  }

  document.getElementById("mode-human").onclick=()=>{mode="human"; resetGame();};
  document.getElementById("mode-ai").onclick=()=>{mode="ai"; resetGame();};

  camera.position.set(0,10,10);
  camera.lookAt(0,0,0);

  function animate(){ requestAnimationFrame(animate); renderer.render(scene,camera);}
  animate();

  function resizeRenderer(){
    const size = Math.min(window.innerWidth,window.innerHeight)*0.8;
    renderer.setSize(size,size);
    camera.aspect=1; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize",resizeRenderer);
  resizeRenderer();

  resetGame();

