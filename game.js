// Canvasin alustus
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML-elementtien haku
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const escapeButton = document.getElementById("escapeButton");
const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOverScreen");
const scoreDiv = document.getElementById("score");
const scoreValueSpan = document.getElementById("scoreValue");
const gameOverText = document.getElementById("gameOverText");

// Canvasin koko
const width = canvas.width;
const height = canvas.height;

// Madon ja hedelmän koko
const cellSize = 15;

// Pelin muuttujat
let snake = {
    xPos: 15,
    yPos: 15,
    fruits: 0,
    length: 3,
    speed: 250,
    direction: null,
    body: null
};

let fruit = {
    xPos: 8,
    yPos: 8
};

let score = 0;
let gameLoopInterval;
let gameRunning = false;
let boardSize = 16;
let difficulty = 1; // 0 = easy, 1 = normal, 2 = hard, 3 = impossible

// Kontrollit
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        if (!gameRunning) {
            startGame(boardSize, difficulty);
        }
        return;
    }

    if (!gameRunning) return;

    // Estetään sivun vieriminen nuolinäppäimillä
    if (e.key.startsWith("Arrow")) {
        e.preventDefault();
    }

    if (e.key === "Escape") {
        endGame("Game Over");
        return;
    }

    switch (e.key) {
        case "ArrowUp":
            snake.direction = "up";
            break;
        case "ArrowDown":
            snake.direction = "down";
            break;
        case "ArrowLeft":
            snake.direction = "left";
            break;
        case "ArrowRight":
            snake.direction = "right";
            break;
    }
});

// Pelin aloitus
function startGame(size, diff) {
    if (gameRunning) return;

    boardSize = size;
    difficulty = diff;

    // Nollataan madon tiedot
    snake.xPos = 15;
    snake.yPos = 15;
    snake.fruits = 0;
    snake.length = 3;
    snake.direction = null;
    snake.body = null;

    score = 0;
    scoreValueSpan.textContent = score;

    menu.style.display = "none";
    gameOverScreen.style.display = "none";
    scoreDiv.style.display = "block";

    gameRunning = true;

    // Piirretään alkutilanne
    ctx.clearRect(0, 0, width, height);
    drawFruit();
    drawSnake();

    // Käynnistetään pelin ajastin
    gameLoopInterval = setInterval(movement, snake.speed);
}

// Madon liikkuminen
function movement() {
    if (!gameRunning) return;

    switch (snake.direction) {
        case "up":
            snake.yPos -= 1;
            break;
        case "down":
            snake.yPos += 1;
            break;
        case "right":
            snake.xPos += 1;
            break;
        case "left":
            snake.xPos -= 1;
            break;
    }

    // Tyhjennetään edellinen kuva ja piirretään uusi
    ctx.clearRect(0, 0, width, height);
    drawFruit();
    drawSnake();
}

// Madon piirtäminen: vihreä häntä ja oranssi pää
function drawSnake() {
    // Luodaan vartalo ensimmäisellä kutsulla
    if (!snake.body) {
        snake.body = [];

        for (let i = 0; i < snake.length; i++) {
            snake.body.push({
                xPos: snake.xPos - i,
                yPos: snake.yPos
            });
        }
    }

    const head = snake.body[0];

    // Lisätään uusi pää vain, jos mato on liikkunut
    if (head.xPos !== snake.xPos || head.yPos !== snake.yPos) {
        snake.body.unshift({
            xPos: snake.xPos,
            yPos: snake.yPos
        });
    }

    // Rajataan vartalo madon nykyiseen pituuteen
    while (snake.body.length > snake.length) {
        snake.body.pop();
    }

    // Piirretään häntä ensin ja pää viimeisenä
    for (let i = snake.body.length - 1; i >= 0; i--) {
        const part = snake.body[i];

        ctx.fillStyle = i === 0 ? "orange" : "green";

        ctx.fillRect(
            part.xPos * cellSize,
            part.yPos * cellSize,
            cellSize - 1,
            cellSize - 1
        );
    }
}

// Punaisen hedelmän piirtäminen
function drawFruit() {
    ctx.fillStyle = "red";
    ctx.beginPath();

    ctx.arc(
        fruit.xPos * cellSize + cellSize / 2,
        fruit.yPos * cellSize + cellSize / 2,
        cellSize / 2 - 1,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

// Pelin lopettaminen
function endGame(message) {
    clearInterval(gameLoopInterval);
    gameRunning = false;

    gameOverText.textContent = message;
    gameOverScreen.style.display = "block";
}

// Painikkeet
startButton.addEventListener("click", () => {
    startGame(boardSize, difficulty);
});

restartButton.addEventListener("click", () => {
    startGame(boardSize, difficulty);
});

escapeButton.addEventListener("click", () => {
    if (gameRunning) {
        endGame("Game Over");
    }
});
