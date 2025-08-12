"use strict";

// Box Puzzle Game (Sliding Puzzle)
var gridSize = 4;
var boxes = [];

function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var _ref = [array[j], array[i]];
    array[i] = _ref[0];
    array[j] = _ref[1];
  }

  return array;
}

function createBoxes() {
  boxes = Array.from({
    length: gridSize * gridSize
  }, function (_, i) {
    return i;
  }); // Leave last box empty

  boxes = shuffle(boxes);
  renderBoxes();
}

function renderBoxes() {
  var container = document.getElementById('game-container');
  container.innerHTML = '';
  boxes.forEach(function (num, idx) {
    var box = document.createElement('div');
    box.classList.add('box');

    if (num === 0) {
      box.classList.add('empty');
      box.textContent = '';
    } else {
      box.textContent = num;
      box.addEventListener('click', function () {
        return moveBox(idx);
      });
    }

    container.appendChild(box);
  });
}

function moveBox(idx) {
  var emptyIdx = boxes.indexOf(0);
  var validMoves = [emptyIdx - 1, emptyIdx + 1, emptyIdx - gridSize, emptyIdx + gridSize]; // Check if clicked box is adjacent to empty

  if (validMoves.includes(idx) && isAdjacent(idx, emptyIdx)) {
    var _ref2 = [boxes[emptyIdx], boxes[idx]];
    boxes[idx] = _ref2[0];
    boxes[emptyIdx] = _ref2[1];
    renderBoxes();

    if (isSolved()) {
      setTimeout(function () {
        return alert('Congratulations! Puzzle solved!');
      }, 100);
    }
  }
}

function isAdjacent(idx1, idx2) {
  var row1 = Math.floor(idx1 / gridSize);
  var col1 = idx1 % gridSize;
  var row2 = Math.floor(idx2 / gridSize);
  var col2 = idx2 % gridSize;
  return row1 === row2 && Math.abs(col1 - col2) === 1 || col1 === col2 && Math.abs(row1 - row2) === 1;
}

function isSolved() {
  for (var i = 0; i < boxes.length - 1; i++) {
    if (boxes[i] !== i + 1) return false;
  }

  return boxes[boxes.length - 1] === 0;
}

document.getElementById('reset-btn').addEventListener('click', createBoxes);
window.onload = createBoxes;
//# sourceMappingURL=script.dev.js.map
