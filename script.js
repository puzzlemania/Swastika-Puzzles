const puzzleSelect = document.getElementById("puzzleSelect");
const gridContainer = document.getElementById("grid");
const acrossClues = document.getElementById("acrossClues");
const downClues = document.getElementById("downClues");
const messagePopup = document.getElementById("messagePopup");
const messageText = document.getElementById("messageText");
const timerDisplay = document.getElementById("timer");

let solutionMap = {};
let timerInterval = null;
let secondsElapsed = 0;

/* ===============================
   TIMER
================================ */

function startTimer() {
  clearInterval(timerInterval);
  secondsElapsed = 0;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimerDisplay() {
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  timerDisplay.textContent =
    `Time: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

/* ===============================
   LOAD DROPDOWN
================================ */

async function loadDropdown() {
  const response = await fetch("./puzzles/puzzleList.json");
  const list = await response.json();

  for (let file of list.puzzles) {
    const res = await fetch(file);
    const data = await res.json();

    const option = document.createElement("option");
    option.value = file;
    option.textContent = data.title;
    puzzleSelect.appendChild(option);
  }
}

loadDropdown();

/* ===============================
   LOAD PUZZLE
================================ */

async function loadPuzzle() {
  const file = puzzleSelect.value;
  if (!file) return;

  const response = await fetch(file);
  const data = await response.json();

  document.getElementById("puzzleTitle").textContent = data.title;

  generateGrid(data);
  addNumbers(data);
  generateClues(data);
  startTimer();
}

/* ===============================
   GENERATE GRID
================================ */

function generateGrid(data) {
  gridContainer.innerHTML = "";
  solutionMap = {};

  const size = data.gridSize;
  const grid = Array(size).fill(null).map(() => Array(size).fill(""));

  data.words.forEach(wordObj => {
    const { word, row, col, direction } = wordObj;

    for (let i = 0; i < word.length; i++) {
      const r = direction === "horizontal" ? row : row + i;
      const c = direction === "horizontal" ? col + i : col;

      grid[r][c] = word[i];
      solutionMap[`${r}-${c}`] = word[i];
    }
  });

  gridContainer.style.gridTemplateColumns = `repeat(${size}, 40px)`;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");

      if (grid[r][c] === "") {
        cell.className = "black-cell";
      } else {
        cell.className = "cell";

        const input = document.createElement("input");
        input.maxLength = 1;
        input.dataset.row = r;
        input.dataset.col = c;

        input.addEventListener("input", e => {
          e.target.value = e.target.value
            .toUpperCase()
            .replace(/[^A-Z]/g, "");

          input.classList.remove("correct", "wrong", "incomplete");
        });

        cell.appendChild(input);
      }

      gridContainer.appendChild(cell);
    }
  }
}

/* ===============================
   SHARED NUMBERING
================================ */

function addNumbers(data) {
  let number = 1;
  const startMap = {};

  data.words.forEach(word => {
    const key = `${word.row}-${word.col}`;

    if (!startMap[key]) {
      startMap[key] = number;
      number++;
    }

    word.number = startMap[key];
  });

  document.querySelectorAll(".cell").forEach(cell => {
    const input = cell.querySelector("input");
    if (!input) return;

    const key = `${input.dataset.row}-${input.dataset.col}`;

    if (startMap[key]) {
      const numberDiv = document.createElement("div");
      numberDiv.className = "cell-number";
      numberDiv.textContent = startMap[key];
      cell.appendChild(numberDiv);
    }
  });
}

/* ===============================
   GENERATE CLUES
================================ */

function generateClues(data) {
  acrossClues.innerHTML = "";
  downClues.innerHTML = "";

  data.words.forEach(word => {
    const li = document.createElement("li");
    li.textContent = `${word.number}. ${word.clue}`;

    if (word.direction === "horizontal") {
      acrossClues.appendChild(li);
    } else {
      downClues.appendChild(li);
    }
  });
}

/* ===============================
   CHECK PUZZLE
================================ */

function checkPuzzle() {
  let hasBlank = false;
  let hasWrong = false;

  document.querySelectorAll(".cell input").forEach(input => {
    const key = `${input.dataset.row}-${input.dataset.col}`;
    const correctLetter = solutionMap[key];

    input.classList.remove("correct", "wrong", "incomplete");

    if (input.value === "") {
      input.classList.add("incomplete");
      hasBlank = true;
    } else if (input.value === correctLetter) {
      input.classList.add("correct");
    } else {
      input.classList.add("wrong");
      hasWrong = true;
    }
  });

  stopTimer();

  if (!hasBlank && !hasWrong) {
    showPopup("Congratulations! You solved it!");
  } 
  else if (hasBlank) {
    showPopup("Some letters are missing!");
  } 
  else {
    showPopup("Some answers are incorrect!");
  }
}

/* ===============================
   GIVE UP
================================ */

function giveUp() {
  stopTimer();

  document.querySelectorAll(".cell input").forEach(input => {
    const key = `${input.dataset.row}-${input.dataset.col}`;
    const correctLetter = solutionMap[key];

    input.classList.remove("correct", "wrong", "incomplete");

    if (input.value === "") {
      input.classList.add("incomplete");   // Orange
    } 
    else if (input.value === correctLetter) {
      input.classList.add("correct");      // Green
    } 
    else {
      input.classList.add("wrong");        // Red
    }

    input.value = correctLetter; // Reveal answer
  });

  showPopup("Solution revealed.");
}

/* ===============================
   POPUP
================================ */

function showPopup(message) {
  messageText.textContent = message;
  messagePopup.style.display = "flex";
}

function closePopup() {
  messagePopup.style.display = "none";
}