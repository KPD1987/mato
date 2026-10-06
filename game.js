// Canvasin alustus
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML-elementit
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOverScreen");
const scoreDiv = document.getElementById("score");
const scoreValueSpan = document.getElementById("scoreValue");
const gameOverText = document.getElementById("gameOverText");
const levelInfo = document.getElementById("levelInfo");
const progressInfo = document.getElementById("progressInfo");

// Pelin asetukset
const cellSize = 20;
const pointsPerFruit = 10;
const initialSnakeLength = 3;
const fillRatio = 0.90;

// Laskee tavoitepituuden kentän koosta
function calculateTargetLength(canvasSize) {
    const cellsPerSide = canvasSize / cellSize;
    const totalCells = cellsPerSide * cellsPerSide;

    return Math.floor(totalCells * fillRatio);
}

// Vaikeustasot
const levels = [
    {
        label: "Helppo",
        scoreLimit: 0,
        size: 240,
        speed: 250,
        growthEvery: 2
    },
    {
        label: "Keskivaikea",
        scoreLimit: 0,
        size: 360,
        speed: 120,
        growthEvery: 3
    },
    {
        label: "Vaikein",
        scoreLimit: 0,
        size: 520,
        speed: 30,
        growthEvery: 5
    }
];

// Lasketaan tasonvaihtojen pisteet.
// Madon pituus ja pisteet säilyvät tasolta toiselle.
let startingLength = initialSnakeLength;

for (let i = 0; i < levels.length - 1; i++) {
    const level = levels[i];
    const targetLength = calculateTargetLength(level.size);

    const requiredGrowth = targetLength - startingLength;
    const requiredFruits = requiredGrowth * level.growthEvery;

    levels[i + 1].scoreLimit =
        level.scoreLimit + requiredFruits * pointsPerFruit;

    startingLength = targetLength;
}

// Pelin muuttujat
let width = canvas.width;
let height = canvas.height;
let boardSize = width / cellSize;
let currentLevel = 0;

let snake = {
    xPos: 0,
    yPos: 0,
    fruits: 0,
    length: initialSnakeLength,
    speed: levels[0].speed,
    direction: null,
    body: []
};

let fruit = null;
let score = 0;
let gameRunning = false;
let gameLoopInterval = null;
let nextDirection = null;
let musicTimer = null;
let voiceTimer = null;

// Äänet: sound-kansio sijaitsee HTML-tiedoston vieressä
const music = new Audio("sound/gameBG_music.mp3");
music.loop = true;

// Äänen toistamisen epäonnistuminen ei estä pelaamista
function playAudio(audio) {
    const playback = audio.play();

    if (playback) {
        playback.catch(() => {});
    }
}

function playSFX(name) {
    playAudio(new Audio(`sound/${name}.mp3`));
}

// Pysäytetään ajastimet ja musiikki
function stopTimers() {
    clearInterval(gameLoopInterval);
    clearTimeout(musicTimer);
    clearTimeout(voiceTimer);

    gameLoopInterval = null;
    musicTimer = null;
    voiceTimer = null;

    music.pause();
}

// Päivitetään tason ja etenemisen tiedot
function updateLevelInfo() {
    const level = levels[currentLevel];
    const totalCells = boardSize * boardSize;
    const filledPercent = (
        snake.length / totalCells * 100
    ).toFixed(1);

    levelInfo.textContent =
        `Taso: ${level.label} · ${width} × ${height} px`;

    if (currentLevel < levels.length - 1) {
        const nextLevel = levels[currentLevel + 1];
        const remainingPoints = Math.max(
            0,
            nextLevel.scoreLimit - score
        );

        progressInfo.textContent =
            `Pituus: ${snake.length}/${totalCells} ruutua ` +
            `(${filledPercent} %) · ` +
            `Kasvu joka ${level.growthEvery}. hedelmä · ` +
            `Seuraavaan tasoon ${remainingPoints} pistettä`;
    } else {
        progressInfo.textContent =
            `Pituus: ${snake.length}/${totalCells} ruutua ` +
            `(${filledPercent} %) · ` +
            `Kasvu joka ${level.growthEvery}. hedelmä · ` +
            `Täytä koko kenttä voittaaksesi!`;
    }
}

// Muutetaan kentän kokoa ja nopeutta.
// Madon ja hedelmän koordinaatit säilyvät.
function setLevel(levelIndex) {
    currentLevel = levelIndex;

    const level = levels[currentLevel];

    width = level.size;
    height = level.size;

    canvas.width = width;
    canvas.height = height;

    boardSize = width / cellSize;
    snake.speed = level.speed;

    updateLevelInfo();

    if (gameRunning) {
        resetTimer();
    }
}

// Tarkistetaan pisteistä seuraava vaikeustaso
function checkDifficulty() {
    let nextLevel = 0;

    for (let i = 0; i < levels.length; i++) {
        if (score >= levels[i].scoreLimit) {
            nextLevel = i;
        }
    }

    if (nextLevel !== currentLevel) {
        setLevel(nextLevel);
    }
}

// Palataan aloitusvalikkoon
function returnToMenu() {
    stopTimers();

    gameRunning = false;
    nextDirection = null;
    score = 0;

    snake.fruits = 0;
    snake.length = initialSnakeLength;
    snake.direction = null;
    snake.body = [];

    scoreValueSpan.textContent = score;

    setLevel(0);

    menu.style.display = "block";
    gameOverScreen.style.display = "none";
    scoreDiv.style.display = "none";

    ctx.clearRect(0, 0, width, height);
}

// Näppäimistökontrollit
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        returnToMenu();
        return;
    }

    // Painikkeet käsittelevät Enterin itse
    if (e.target.tagName === "BUTTON") return;

    if (e.key === "Enter" && !gameRunning) {
        e.preventDefault();
        startGame();
        return;
    }

    if (!gameRunning) return;

    const directions = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
    };

    const requested = directions[e.key];

    if (!requested) return;

    // Estetään sivun vieriminen nuolinäppäimillä
    e.preventDefault();

    const opposite = {
        up: "down",
        down: "up",
        left: "right",
        right: "left"
    };

    // Hyväksytään vain yksi suunnanmuutos per askel
    if (nextDirection !== null) return;

    // Alussa vartalo on pään vasemmalla puolella
    const currentDirection = snake.direction || "right";

    // Täyskäännös on estetty
    if (requested === opposite[currentDirection]) return;

    // Samansuuntaiset painallukset eivät kuluta käännöstä
    if (
        snake.direction !== null &&
        requested === currentDirection
    ) {
        return;
    }

    nextDirection = requested;
});

// Pelin aloitus
function startGame() {
    if (gameRunning) return;

    stopTimers();

    score = 0;

    snake.fruits = 0;
    snake.length = initialSnakeLength;
    snake.direction = null;

    nextDirection = null;

    // Jokainen uusi peli alkaa helpolta tasolta
    setLevel(0);

    snake.xPos = Math.floor(boardSize / 2);
    snake.yPos = Math.floor(boardSize / 2);

    // Luodaan vartalo pään vasemmalle puolelle
    snake.body = Array.from(
        { length: snake.length },
        (_, i) => ({
            xPos: snake.xPos - i,
            yPos: snake.yPos
        })
    );

    scoreValueSpan.textContent = score;

    spawnFruit();

    menu.style.display = "none";
    gameOverScreen.style.display = "none";
    scoreDiv.style.display = "block";

    gameRunning = true;

    updateLevelInfo();
    drawGame();
    resetTimer();

    playSFX("gameStart_SFX");

    music.currentTime = 0;

    musicTimer = setTimeout(() => {
        if (gameRunning) {
            playAudio(music);
        }
    }, 500);
}

// Käynnistetään tai päivitetään liikkumisajastin
function resetTimer() {
    clearInterval(gameLoopInterval);

    gameLoopInterval = setInterval(
        movement,
        snake.speed
    );
}

// Madon liikkuminen
function movement() {
    if (!gameRunning) return;

    if (nextDirection !== null) {
        snake.direction = nextDirection;
        nextDirection = null;
    }

    // Mato odottaa ensimmäistä nuolinäppäintä
    if (snake.direction === null) return;

    let x = snake.xPos;
    let y = snake.yPos;

    switch (snake.direction) {
        case "up":
            y--;
            break;

        case "down":
            y++;
            break;

        case "left":
            x--;
            break;

        case "right":
            x++;
            break;
    }

    const eating =
        fruit !== null &&
        x === fruit.xPos &&
        y === fruit.yPos;

    const growthEvery = levels[currentLevel].growthEvery;

    const growing =
        eating &&
        snake.fruits + 1 >= growthEvery;

    // Tarkistetaan törmäys ennen vartalon muuttamista
    if (collision(x, y, growing)) return;

    snake.xPos = x;
    snake.yPos = y;

    // Lisätään uusi pää vartalon alkuun
    snake.body.unshift({
        xPos: x,
        yPos: y
    });

    if (eating) {
        eatFruit();
    }

    // Poistetaan ylimääräinen häntäosa
    while (snake.body.length > snake.length) {
        snake.body.pop();
    }

    // Uusi hedelmä päivitetyn vartalon ja kentän mukaan
    if (eating) {
        spawnFruit();
    }

    scoreValueSpan.textContent = score;

    updateLevelInfo();
    drawGame();

    if (fruit === null) {
        endGame("Voitit! Täytit koko kentän.");
    }
}

// Seinä- ja vartalotörmäykset
function collision(x, y, growing) {
    if (
        x < 0 ||
        y < 0 ||
        x >= boardSize ||
        y >= boardSize
    ) {
        endGame("Osuit seinään — Game Over");
        return true;
    }

    // Viimeinen häntäruutu vapautuu samalla askeleella,
    // ellei mato kasva.
    const bodyToCheck = growing
        ? snake.body
        : snake.body.slice(0, -1);

    const hitBody = bodyToCheck.some((part) => {
        return part.xPos === x && part.yPos === y;
    });

    if (hitBody) {
        endGame("Osuit omaan häntään — Game Over");
        return true;
    }

    return false;
}

// Hedelmän syöminen
function eatFruit() {
    playSFX("eat_SFX");

    score += pointsPerFruit;
    snake.fruits++;

    checkStatChange();
}

// Kasvu nykyisen tason säännöillä
function checkStatChange() {
    const growthEvery = levels[currentLevel].growthEvery;

    if (snake.fruits >= growthEvery) {
        snake.length++;
        snake.fruits = 0;
    }

    // Tasonvaihto tarkistetaan kasvamisen jälkeen
    checkDifficulty();
}

// Hedelmän sijoittaminen vapaaseen ruutuun
function spawnFruit() {
    const freeCells = [];

    // Tallennetaan varatut ruudut nopeaa tarkistusta varten
    const occupiedCells = new Set(
        snake.body.map((part) => {
            return `${part.xPos},${part.yPos}`;
        })
    );

    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            if (!occupiedCells.has(`${x},${y}`)) {
                freeCells.push({
                    xPos: x,
                    yPos: y
                });
            }
        }
    }

    if (freeCells.length === 0) {
        fruit = null;
        return;
    }

    const randomIndex = Math.floor(
        Math.random() * freeCells.length
    );

    fruit = freeCells[randomIndex];
}

// Koko pelin piirtäminen
function drawGame() {
    ctx.clearRect(0, 0, width, height);

    drawFruit();
    drawSnake();
}

// Madon piirtäminen
function drawSnake() {
    if (snake.body.length === 0) return;

    const center = (part) => ({
        x: (part.xPos + 0.5) * cellSize,
        y: (part.yPos + 0.5) * cellSize
    });

    const colors = [
        "#43b85c", // Vihreä
        "#77cf50", // Vaaleanvihreä
        "#28b7a7", // Turkoosi
        "#529de0", // Sininen
        "#a478dd", // Violetti
        "#ed79ac"  // Vaaleanpunainen
    ];

    // Kasvu avaa uusia värejä
    const unlockedColors = Math.min(
        colors.length,
        Math.max(1, snake.length - 2)
    );

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Piirretään vartalo hännästä päätä kohti
    for (let i = snake.body.length - 1; i >= 1; i--) {
        const a = center(snake.body[i]);
        const b = center(snake.body[i - 1]);

        const color =
            colors[Math.floor((i - 1) / 2) % unlockedColors];

        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        if (i === snake.body.length - 1) {
            // Kapeneva hännän kärki
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy);

            const px =
                (-dy / distance) * cellSize * 0.34;

            const py =
                (dx / distance) * cellSize * 0.34;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x + px, b.y + py);
            ctx.lineTo(b.x - px, b.y - py);
            ctx.closePath();
            ctx.fill();
        } else {
            // Pyöristetty vartalo
            ctx.lineWidth = cellSize * 0.7;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
    }

    // Oranssi pää puolipyöreällä etureunalla
    const head = center(snake.body[0]);

    const angles = {
        right: 0,
        down: Math.PI / 2,
        left: Math.PI,
        up: -Math.PI / 2
    };

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(angles[snake.direction || "right"]);

    const radius = cellSize * 0.43;

    ctx.fillStyle = "#ff9c32";

    ctx.beginPath();
    ctx.moveTo(-radius, -radius);
    ctx.lineTo(0, -radius);

    ctx.arc(
        0,
        0,
        radius,
        -Math.PI / 2,
        Math.PI / 2
    );

    ctx.lineTo(-radius, radius);
    ctx.closePath();
    ctx.fill();

    // Silmät
    for (const eyeY of [
        -radius * 0.52,
        radius * 0.52
    ]) {
        ctx.fillStyle = "white";

        ctx.beginPath();
        ctx.arc(
            radius * 0.25,
            eyeY,
            2.5,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#17202b";

        ctx.beginPath();
        ctx.arc(
            radius * 0.36,
            eyeY,
            1.2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    ctx.restore();
}

// Hedelmän piirtäminen
// Hedelmän piirtäminen omenan näköisenä
function drawFruit() {
    if (fruit === null) return;

    const x = (fruit.xPos + 0.5) * cellSize;
    const y = (fruit.yPos + 0.5) * cellSize;
    const size = cellSize;

    ctx.save();
    ctx.translate(x, y);

    // Omenan punainen runko
    ctx.fillStyle = "#e53935";
    ctx.beginPath();

    // Yläosan lovi
    ctx.moveTo(0, -size * 0.22);

    // Vasen puoli
    ctx.bezierCurveTo(
        -size * 0.42, -size * 0.48,
        -size * 0.48, size * 0.12,
        -size * 0.20, size * 0.35
    );

    // Pohja
    ctx.bezierCurveTo(
        -size * 0.10, size * 0.43,
        -size * 0.04, size * 0.34,
        0, size * 0.35
    );

    ctx.bezierCurveTo(
        size * 0.04, size * 0.34,
        size * 0.10, size * 0.43,
        size * 0.20, size * 0.35
    );

    // Oikea puoli
    ctx.bezierCurveTo(
        size * 0.48, size * 0.12,
        size * 0.42, -size * 0.48,
        0, -size * 0.22
    );

    ctx.closePath();
    ctx.fill();

    // Ruskea varsi
    ctx.strokeStyle = "#795548";
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(0, -size * 0.23);
    ctx.quadraticCurveTo(
        -size * 0.03, -size * 0.34,
        size * 0.04, -size * 0.43
    );
    ctx.stroke();

    // Vihreä lehti
    ctx.fillStyle = "#66bb6a";
    ctx.beginPath();
    ctx.moveTo(size * 0.02, -size * 0.34);

    ctx.quadraticCurveTo(
        size * 0.12, -size * 0.49,
        size * 0.29, -size * 0.40
    );

    ctx.quadraticCurveTo(
        size * 0.18, -size * 0.27,
        size * 0.02, -size * 0.34
    );

    ctx.closePath();
    ctx.fill();

    // Pieni kiilto vasemmalla
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = size * 0.07;

    ctx.beginPath();
    ctx.moveTo(-size * 0.21, -size * 0.13);
    ctx.quadraticCurveTo(
        -size * 0.29, -size * 0.02,
        -size * 0.23, size * 0.10
    );
    ctx.stroke();

    ctx.restore();
}

// Pelin lopettaminen
function endGame(message) {
    stopTimers();
    gameRunning = false;

    gameOverText.textContent = message;
    gameOverScreen.style.display = "block";

    playSFX("gameOver_SFX");

    voiceTimer = setTimeout(() => {
        playSFX("gameOverVoice_SFX");
    }, 1500);
}

// Painikkeet
startButton.addEventListener("click", () => {
    startButton.blur();
    startGame();
});

restartButton.addEventListener("click", () => {
    restartButton.blur();
    startGame();
});

// Alustetaan ensimmäinen taso
setLevel(0);
