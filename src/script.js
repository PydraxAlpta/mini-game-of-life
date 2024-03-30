"use strict";
const root = document.querySelector("#root");
const board = document.querySelector("#board");
const play = document.querySelector("#play");
const itrSpan = document.querySelector("#itr");
const controls = document.querySelector("#controls");
const ranges = controls.querySelector("#ranges");
const modeBtn = document.querySelector("#mode");
const clearBtn = document.querySelector("#clear");

/**
  0: Editing
  1: Playing
*/
let state = 0;
let cells = [];
let rows = 20;
let columns = 20;
const surviveSet = new Set([2, 3]);
const birthSet = new Set([3]);
const moore = true;
let rate = 50;
let mode = "light";

let intervalRef = null;
let iterations = 0;
function updateIterations() {
  itrSpan.innerText = iterations;
}

function createCell(active, index) {
  const cell = document.createElement("div");
  cell.addEventListener("click", () => {
    !state && cell.classList.toggle("active");
    cells[index] = !cells[index];
  });
  cell.tabIndex = 0;
  cell.className = "cell" + (Boolean(active) ? " active" : "");
  const inner = document.createElement("span");
  cell.appendChild(inner);
  return cell;
}

function createRange(
  label,
  min,
  max,
  value,
  showValue = true,
  minText = min,
  maxText = max,
  step = 1
) {
  const labelEl = document.createElement("label");
  labelEl.className = "label";
  const top = document.createElement("div");
  top.innerText = label + (showValue ? ":" : "");
  if (showValue) {
    const valueSpan = document.createElement("span");
    valueSpan.innerText = value;
    top.appendChild(valueSpan);
  }
  const bottom = document.createElement("div");
  bottom.className = "input";
  const minSpan = document.createElement("span");
  minSpan.innerText = minText;
  const inputEl = document.createElement("input");
  inputEl.type = "range";
  inputEl.min = min;
  inputEl.max = max;
  inputEl.value = value;
  inputEl.step = step;
  const maxSpan = document.createElement("span");
  maxSpan.innerText = maxText;
  bottom.append(minSpan, inputEl, maxSpan);
  labelEl.append(top, bottom);
  inputEl.addEventListener("input", (event) => {
    valueSpan.innerText = event.target.value;
  });
  return [labelEl, inputEl];
}

function drawBoard(cells, board) {
  board.innerHTML = "";
  cells.forEach((active, index) => {
    board.appendChild(createCell(active, index));
  });
}

function start() {
  state = 1;
  play.innerText = "Pause";
  intervalRef = setInterval(update, rate);
}

function stop() {
  state = 0;
  play.innerText = "Play";
  intervalRef && clearInterval(intervalRef);
  intervalRef = null;
}

function initialize() {
  setup();
  // controls
  play.innerText = "Play";
  play.addEventListener("click", () => {
    if (state === 0) {
      start();
    } else {
      stop();
    }
  });
  modeBtn.innerText = "Light Mode";
  modeBtn.addEventListener("click", () => {
    if (mode === "light") {
      mode = "light";
      modeBtn.innerText = "Dark Mode";
    } else {
      mode = "dark";
      modeBtn.innerText = "Light Mode";
    }
    root.classList.toggle("dark");
  });
  clearBtn.addEventListener("click", () => {
    setup();
  });
  const [rowsRange] = createRange("Rows", 5, 25, rows);
  const [columnsRange] = createRange("Columns", 5, 25, columns);
  const [speedRange] = createRange(
    "Speed",
    50,
    500,
    100,
    false,
    "Fast",
    "Slow",
    50
  );
  rowsRange.addEventListener("input", (event) => {
    rows = Number(event.target.value);
    setup();
  });
  columnsRange.addEventListener("input", (event) => {
    columns = Number(event.target.value);
    setup();
  });
  speedRange.addEventListener("input", (event) => {
    let initialState = state;
    if (initialState === 1) {
      stop();
    }
    rate = Number(event.target.value) || 50;
    if (initialState === 1) {
      start();
    }
  });
  ranges.append(rowsRange, columnsRange, speedRange);
}

function setup() {
  board.style = `--columns: ${columns}`;
  cells = [];
  for (let i = 0; i < rows * columns; ++i) {
    cells.push(false);
  }
  stop();
  drawBoard(cells, board);
  iterations = 0;
  updateIterations();
}

function update() {
  const newCells = generateNextIteration(cells);
  drawBoard(newCells, board);
  ++iterations && updateIterations();
  cells = newCells;
}

function getNeighbours(row, column, moore) {
  if (moore) {
    return [
      [row - 1, column - 1],
      [row - 1, column + 0],
      [row - 1, column + 1],
      [row + 0, column - 1],
      [row + 0, column + 1],
      [row + 1, column - 1],
      [row + 1, column + 0],
      [row + 1, column + 1]
    ];
  } else {
    return [
      [row - 1, column + 0],
      [row + 0, column - 1],
      [row + 0, column + 1],
      [row + 1, column + 0]
    ];
  }
}

function determineNextState(index, cells) {
  const column = index % columns;
  const row = Math.floor(index / rows);
  const neighbours = getNeighbours(row, column, moore);
  const alive = cells[index];
  const states = neighbours.map(([r, c]) => isAlive(r, c, cells));
  const live = states.reduce((acc, next) => acc + next, 0);
  if (alive) {
    return surviveSet.has(live);
  } else {
    return birthSet.has(live);
  }
}

function isAlive(row, column, cells) {
  if (row < 0 || row >= rows) {
    return false;
  } else if (column < 0 || column >= columns) {
    return false;
  } else {
    const computedIndex = row * columns + column;
    return cells[computedIndex] ?? false;
  }
}

function generateNextIteration(cells) {
  const newCells = [];
  for (let index = 0; index < cells.length; ++index) {
    newCells.push(determineNextState(index, cells));
  }
  return newCells;
}

window.onload = initialize;