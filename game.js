// Canvasin alustus
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML-elementtien haku
const startButton = document.getElementById("startButton"); // Aloita peli -nappi
const enterButton = document.getElementById("enterButton"); // Enter-nappi, jolla voi myös aloittaa pelin
const restartButton = document.getElementById("restartButton"); // Aloita uusi peli -nappi pelin päättyessä
const escapeButton = document.getElementById("escapeButton"); // Lopeta peli -nappi
const menu = document.getElementById("menu"); // Päävalikko
const gameOverScreen = document.getElementById("gameOverScreen"); // Pelin lopetusnäyttö
const scoreDiv = document.getElementById("score"); // Pisteiden näyttö
const scoreValueSpan = document.getElementById("scoreValue"); // Pisteiden arvo
const gameOverText = document.getElementById("gameOverText"); // Pelin lopputeksti

// Canvasin koko
const width = canvas.width;
const height = canvas.height;

// Madon ja hedelmän koko
const cellSize = 15;

// Pelin muuttujat
let snake;
let direction; // Madon koordinaatit (x, y)
let fruit; // syötävän hedelmän koordinaatit (x, y)
let score; // pisteet
let fruitCount; // hedelmien lukumäärä, jotta voidaan tarkistaa, milloin mato kasvaa
let gameLoopInterval; // Pelin loopin interval
let gameRunning = false; // Tarkistaa, onko peli ajossa
let _currentSpeed = 250; // Pelin nopeus (millisekunteina, kuinka usein pelin logiikka päivittyy)

// Kontrollit
document.addEventListener("enter", (e) => {startGame()});
document.addEventListener("Escape", (e) => {
    if (gameRunning) {
        endGame("Game Over");
    }
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        startGame();
        return;
    }
    if (!gameRunning) return;

    else if (e.key === "Escape") endGame("Game Over");

    switch (e.key) {
        case "ArrowUp":
            if (direction.y === 0) direction = { x: 0, y: -1 };
            break;
        case "ArrowDown":
            if (direction.y === 0) direction = { x: 0, y: 1 };
            break;
        case "ArrowLeft":
            if (direction.x === 0) direction = { x: -1, y: 0 };
            break;
        case "ArrowRight":
            if (direction.x === 0) direction = { x: 1, y: 0 };
            break;
    }
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
startButton.addEventListener("enter", startGame);