// Canvasin alustus
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML-elementtien haku
const startButton = document.getElementById("startButton"); // Aloita peli -nappi
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
let snake =  {
    xPos: 15,
    yPos: 15,
    fruits: 0,
    length: 3,
    speed: 250,
    direction: null
}; //käärmeeseen tallennettu data
let fruit = {
    xPos: 20,
    yPos: 20
}; // syötävän hedelmän koordinaatit (x, y)
let score = 0; // pisteet
let gameLoopInterval; // Pelin loopin interval
let gameRunning = false; // Tarkistaa, onko peli ajossa
let boardSize = 16;
let difficulty = 1; // 0 = easy, 1 = normal, 2 = hard, 3 = impossible

// Kontrollit
document.addEventListener("Escape", (e) => {
    if (gameRunning) {
        endGame("Game Over");
    }
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        if (gameRunning) return;
        startGame(boardSize, difficulty);
        return;
        }
});
document.addEventListener("keydown", (e) => {
    if (!gameRunning) return;
    else if (e.key === "Escape") endGame("Game Over");
    switch (e.key) {
        case "ArrowUp":
            snake.direction = "up"
            console.log("up arrow pressed")
            break;
        case "ArrowDown":
            snake.direction = "down"
            console.log("down arrow pressed")
            break;
        case "ArrowLeft":
            snake.direction = "left"
            console.log("left arrow pressed")
            break;
        case "ArrowRight":
            snake.direction = "right"
            console.log("right arrow pressed")
            break;
    }
});

function startGame(size, diff) {
    console.log("game start triggered");
    gameRunning = true;
    setInterval(movement, snake.speed);
};

function movement() {
    switch (snake.direction) {
        case "up":
            snake.yPos += 1;
            break;
        case "down":
            snake.yPos -= 1;
            break;
        case "right":
            snake.xPos += 1;
            break;
        case "left":
            snake.xPos -= 1;
            break;
    }
    console.log(snake.xPos, snake.yPos, snake.direction)
};

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
