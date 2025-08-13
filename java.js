// --- State ---
const X = "X";
const O = "O";
let board = Array(9).fill(""); // index 0..8
let playerTurn = true;         // ผู้เล่นเป็น X ก่อน
let lock = false;              // กันคลิกระหว่าง AI คิด
let scores = { you: 0, ai: 0, draw: 0 };
let difficulty = "Nightmare";  // Normal | Hard | Nightmare

// --- Elements ---
const boardEl = document.getElementById("board");
const youEl = document.getElementById("you");
const aiEl = document.getElementById("ai");
const drawEl = document.getElementById("draw");
const modeLabel = document.getElementById("mode-label");
const dlg = document.getElementById("result-dialog");
const dlgText = document.getElementById("result-text");

const btnNormal = document.getElementById("btn-normal");
const btnHard = document.getElementById("btn-hard");
const btnNightmare = document.getElementById("btn-nightmare");
const btnResetBoard = document.getElementById("btn-reset-board");
const btnResetScore = document.getElementById("btn-reset-score");

// --- Init board UI ---
function renderBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("button");
    cell.className = "cell" + (board[i] ? " disabled" : "");
    cell.dataset.idx = i;
    cell.setAttribute("aria-label", `cell ${i}`);
    cell.textContent = board[i];
    if (board[i] === X) cell.classList.add("x");
    if (board[i] === O) cell.classList.add("o");
    cell.addEventListener("click", onCellClick);
    boardEl.appendChild(cell);
  }
}

function setActiveDifficultyButton() {
  [btnNormal, btnHard, btnNightmare].forEach(b => b.classList.remove("active"));
  if (difficulty === "Normal") btnNormal.classList.add("active");
  else if (difficulty === "Hard") btnHard.classList.add("active");
  else btnNightmare.classList.add("active");
}

function updateScorePanel() {
  youEl.textContent = scores.you;
  aiEl.textContent = scores.ai;
  drawEl.textContent = scores.draw;
  modeLabel.textContent = `โหมด: ${difficulty}`;
}

function resetBoard(keepTurn = true) {
  board = Array(9).fill("");
  lock = false;
  if (!keepTurn) playerTurn = true;
  renderBoard();
}

function resetScores() {
  scores = { you: 0, ai: 0, draw: 0 };
  updateScorePanel();
}

// --- Game logic ---
function lines() {
  return [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
  ];
}

function winner(b) {
  for (const [a, c, d] of lines()) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

function isFull(b) {
  return b.every(v => v !== "");
}

function emptyIndices(b) {
  const res = [];
  for (let i = 0; i < b.length; i++) if (!b[i]) res.push(i);
  return res;
}

// Minimax (perfect play for O)
function minimax(b, isMax) {
  const w = winner(b);
  if (w === O) return 1;
  if (w === X) return -1;
  if (isFull(b)) return 0;

  if (isMax) {
    let best = -999;
    for (const idx of emptyIndices(b)) {
      b[idx] = O;
      best = Math.max(best, minimax(b, false));
      b[idx] = "";
    }
    return best;
  } else {
    let best = 999;
    for (const idx of emptyIndices(b)) {
      b[idx] = X;
      best = Math.min(best, minimax(b, true));
      b[idx] = "";
    }
    return best;
  }
}

function randomMove(b) {
  const empties = emptyIndices(b);
  return empties[Math.floor(Math.random() * empties.length)];
}

function bestMove(b) {
  // Normal: 100% random
  if (difficulty === "Normal") return randomMove(b);
  // Hard: 30% random พลาดได้
  if (difficulty === "Hard" && Math.random() < 0.3) return randomMove(b);

  // Nightmare: เลือกที่ดีที่สุดด้วย minimax
  let bestScore = -999, move = null;
  for (const idx of emptyIndices(b)) {
    b[idx] = O;
    const sc = minimax(b, false);
    b[idx] = "";
    if (sc > bestScore) {
      bestScore = sc;
      move = idx;
    }
  }
  return move ?? randomMove(b);
}

// --- Turn handlers ---
function onCellClick(e) {
  if (lock) return;
  const idx = Number(e.currentTarget.dataset.idx);
  if (board[idx]) return;

  board[idx] = X;
  renderBoard();

  const w = winner(board);
  if (w || isFull(board)) return finishIfDone();

  lock = true;
  setTimeout(() => {
    const aiIdx = bestMove(board);
    board[aiIdx] = O;
    renderBoard();
    lock = false;
    finishIfDone();
  }, 120); // หน่วงให้ดูลื่นขึ้น
}

function finishIfDone() {
  const w = winner(board);
  if (w === X) {
    scores.you += 1;
    updateScorePanel();
    showResult("คุณชนะ!");
    return;
  }
  if (w === O) {
    scores.ai += 1;
    updateScorePanel();
    showResult("AI ชนะ!");
    return;
  }
  if (isFull(board)) {
    scores.draw += 1;
    updateScorePanel();
    showResult("เสมอ!");
  }
}

function showResult(text) {
  dlgText.textContent = text;
  dlg.showModal();
  dlg.addEventListener("close", () => {
    resetBoard(true);
  }, { once: true });
}

// --- Wire buttons ---
btnNormal.addEventListener("click", () => { difficulty = "Normal"; setActiveDifficultyButton(); updateScorePanel(); resetBoard(true); });
btnHard.addEventListener("click", () => { difficulty = "Hard"; setActiveDifficultyButton(); updateScorePanel(); resetBoard(true); });
btnNightmare.addEventListener("click", () => { difficulty = "Nightmare"; setActiveDifficultyButton(); updateScorePanel(); resetBoard(true); });

btnResetBoard.addEventListener("click", () => resetBoard(true));
btnResetScore.addEventListener("click", () => resetScores());

// --- Boot ---
setActiveDifficultyButton();
updateScorePanel();
renderBoard();
