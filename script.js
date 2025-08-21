// script.js - A Gépelős Játék fő logikáját tartalmazó fájl.

// DOM elemek lekérdezése az interakcióhoz
const setupScreen = document.getElementById('setup-screen');
const gameContainer = document.querySelector('.game-container');
const resultsScreen = document.getElementById('results-screen');
const resultsTableBody = document.querySelector('#results-table tbody');

const playerNameInput = document.getElementById('playerName');
const wordCountInput = document.getElementById('wordCount');
const startGameBtn = document.getElementById('startGameBtn');
const newGameBtn = document.getElementById('newGameBtn');
const clearResultsBtn = document.getElementById('clearResultsBtn');

const wordDisplay = document.getElementById('word-display');
const typedTextElement = document.getElementById('typed-text');
const scoreSpan = document.getElementById('score');
const correctCountSpan = document.getElementById('correct-count');
const errorCountSpan = document.getElementById('error-count');
const keyboardContainer = document.getElementById('keyboard');

// Változók inicializálása a játék állapotának tárolásához
let currentWordIndex = 0; // Az aktuális szó indexe a listában
let currentCharIndex = 0; // Az aktuális karakter indexe a szóban
let score = 0; // Pontszám (pontosság %-ban)
let correctCount = 0; // Helyes karakterek száma
let errorCount = 0; // Hibás karakterek száma
let typedChars = ''; // Begépelt karakterek tárolása (jelenleg nem használt, de jó a jövőbeni fejlesztésekhez)
let gameWordCount = 20; // A játékban felhasznált szavak száma
let shuffledWords = []; // A játékban felhasználandó, véletlenszerűen kiválasztott szavak
let playerName = 'Játékos'; // A játékos neve

// A virtuális billentyűzet elrendezése
const keyboardLayout = [
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'ö', 'ü', 'ó'],
    ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ő', 'ú'],
    ['í', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'é', 'á', 'ű'],
    ['y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'],
    [' ']
];

// Eseményfigyelő a "Játék indítása" gombra
startGameBtn.addEventListener('click', () => {
    // Játékos nevének és a szavak számának beállítása
    playerName = playerNameInput.value || 'Játékos';
    gameWordCount = parseInt(wordCountInput.value) || 20;

    // Ellenőrzés, hogy van-e elegendő szó a listában
    if (words.length < gameWordCount) {
        alert('Nincs elegendő szó a játékhoz! Kérjük, válasszon kisebb számot vagy adjon hozzá több szót.');
        return;
    }

    // Képernyők váltása: beállítások elrejtése, játék megjelenítése
    setupScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // A szavak megkeverése és a játékhoz szükséges mennyiség kiválasztása
    shuffledWords = shuffleArray(words).slice(0, gameWordCount);
    startGame();
});

// Eseményfigyelő az "Új játék" gombra az eredmények képernyőn
newGameBtn.addEventListener('click', () => {
    // Visszaváltás a beállítások képernyőre
    resultsScreen.style.display = 'none';
    setupScreen.style.display = 'block';
});

// Eseményfigyelő az "Eredmények törlése" gombra
clearResultsBtn.addEventListener('click', () => {
    // Helyi tárolóban lévő eredmények törlése
    localStorage.removeItem('typingGameResults');
    // A táblázat tartalmának törlése
    resultsTableBody.innerHTML = '';
    alert('Eredmények törölve!');
    // Üres eredménytábla megjelenítése
    displayResults([]);
});


// A játék elindítása (állapot inicializálása)
function startGame() {
    currentWordIndex = 0;
    score = 0;
    correctCount = 0;
    errorCount = 0;
    updateStatus(); // Státusz sáv frissítése
    nextWord(); // Az első szó betöltése
}

// Következő szó betöltése a játékhoz
function nextWord() {
    // Ellenőrzés, hogy van-e még szó a listában
    if (currentWordIndex >= shuffledWords.length) {
        endGame(); // Ha elfogytak a szavak, a játék vége
        return;
    }
    
    // A következő szó beállítása
    const currentWord = shuffledWords[currentWordIndex];
    // A kijelzők ürítése
    wordDisplay.innerHTML = '';
    typedChars = '';
    typedTextElement.innerHTML = '';
    
    // A begépelendő szó karaktereinek kirajzolása span-ekbe
    for (const char of currentWord) {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        charSpan.className = 'char';
        wordDisplay.appendChild(charSpan);

        const placeholderCharSpan = document.createElement('span');
        placeholderCharSpan.textContent = '';
        placeholderCharSpan.className = 'typed-char';
        typedTextElement.appendChild(placeholderCharSpan);
    }
    
    currentCharIndex = 0; // A karakter indexének alaphelyzetbe állítása
    highlightNextChar(); // Az első karakter kiemelése
}

// A játék befejezése és az eredmények mentése/megjelenítése
function endGame() {
    // Eredmények lekérése a helyi tárolóból, vagy üres tömb, ha nincs még
    const results = JSON.parse(localStorage.getItem('typingGameResults')) || [];
    
    // Pontosság kiszámítása
    const totalTyped = correctCount + errorCount;
    const accuracy = totalTyped > 0 ? (correctCount / totalTyped) * 100 : 0;
    score = Math.round(accuracy);
    
    // Új eredményobjektum létrehozása
    const newResult = {
        name: playerName,
        score: score,
        correct: correctCount,
        incorrect: errorCount
    };
    results.push(newResult);
    
    // Rendezés pontszám (pontosság) szerint csökkenő sorrendben
    results.sort((a, b) => b.score - a.score);
    
    // Az eredmények visszamentése a helyi tárolóba
    localStorage.setItem('typingGameResults', JSON.stringify(results));
    
    // Az eredmények megjelenítése a képernyőn
    displayResults(results);

    // Képernyők váltása: játék elrejtése, eredmények megjelenítése
    gameContainer.style.display = 'none';
    resultsScreen.style.display = 'block';
}

// Eredmények táblázatának megjelenítése
function displayResults(results) {
    resultsTableBody.innerHTML = ''; // Táblázat törlése
    const medals = ['🥇', '🥈', '🥉']; // Érem ikonok

    // Eredmények bejárása és táblázatba illesztése
    results.forEach((result, index) => {
        const row = resultsTableBody.insertRow();
        const rankCell = row.insertCell(0);
        const nameCell = row.insertCell(1);
        const scoreCell = row.insertCell(2);
        
        const rank = index + 1;
        rankCell.textContent = rank;
        
        nameCell.textContent = result.name;
        // Érem hozzáadása az első 3 helyezetthez
        if (rank <= 3) {
            nameCell.innerHTML = `<span class="medal">${medals[rank - 1]}</span>${result.name}`;
        }
        
        scoreCell.textContent = `${result.score}%`;
    });
}

// A következő begépelendő karakter kiemelése
function highlightNextChar() {
    const allChars = document.querySelectorAll('.char');
    allChars.forEach((char, index) => {
        if (index === currentCharIndex) {
            char.style.textDecoration = 'underline'; // Aláhúzás
        } else {
            char.style.textDecoration = 'none'; // Aláhúzás eltávolítása
        }
    });
}

// Eseményfigyelő a billentyűlenyomásra (keydown)
document.addEventListener('keydown', (event) => {
    // Ellenőrzés, hogy Enter billentyűt nyomtak-e
    if (event.key === 'Enter') {
        // Ha egy szó véget ért, Enter-rel lehet továbblépni
        if (currentCharIndex === shuffledWords[currentWordIndex].length) {
            // A pontszám logikája a szó végén
            const wordLength = shuffledWords[currentWordIndex].length;
            const totalTyped = correctCount + errorCount;
            const correctRatio = totalTyped > 0 ? correctCount / totalTyped : 0;
            // A pontszám frissítése a szó hosszának és pontosságának arányában
            score += Math.round(correctRatio * wordLength * 10);
            
            currentWordIndex++; // Következő szó
            updateStatus(); // Státusz sáv frissítése
            nextWord(); // Következő szó betöltése
        }
    } else {
        // Hagyományos karakter gépelése
        handleKey(event.key); // A gépelés kezelése
        animateKey(event.key, true); // Billentyű animáció bekapcsolása
    }
});

// Eseményfigyelő a billentyű felengedésére (keyup)
document.addEventListener('keyup', (event) => {
    animateKey(event.key, false); // Billentyű animáció kikapcsolása
});

// Billentyű animáció (nyomás/felengedés)
function animateKey(key, isPressed) {
    const keyElement = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
    if (keyElement) {
        if (isPressed) {
            keyElement.classList.add('key-pressed');
        } else {
            keyElement.classList.remove('key-pressed');
        }
    }
}

// Begépelt karakterek kezelése
function handleKey(key) {
    // Kilépési feltételek
    if (currentWordIndex >= shuffledWords.length || key.length > 1) {
        return;
    }
    
    const currentWord = shuffledWords[currentWordIndex];
    if (currentCharIndex >= currentWord.length) {
        return;
    }

    const currentChar = currentWord[currentCharIndex];
    
    // Szóköz karakter kezelése, hogy ne lehessen a szó elején szóköz
    if (key === ' ' && currentCharIndex === 0) {
        return;
    }
    
    // A begépelt karakter elemének megkeresése
    const typedCharElement = typedTextElement.querySelectorAll('.typed-char')[currentCharIndex];
    typedCharElement.textContent = key;

    // Helyes vagy hibás gépelés ellenőrzése
    if (key === currentChar) {
        const charElement = document.querySelectorAll('.char')[currentCharIndex];
        charElement.classList.add('correct');
        typedCharElement.classList.add('correct');
        
        correctCount++;
        currentCharIndex++;
    } else {
        const charElement = document.querySelectorAll('.char')[currentCharIndex];
        charElement.classList.add('incorrect');
        typedCharElement.classList.add('incorrect');

        errorCount++;
        currentCharIndex++;
    }
    
    highlightNextChar(); // A következő karakter kiemelése
    updateStatus(); // Státusz sáv frissítése
}

// Státusz sáv frissítése (pontszám, helyes/hibás)
function updateStatus() {
    const totalTyped = correctCount + errorCount;
    const accuracy = totalTyped > 0 ? (correctCount / totalTyped) * 100 : 0;
    score = Math.round(accuracy);
    
    scoreSpan.textContent = `${score}%`;
    correctCountSpan.textContent = correctCount;
    errorCountSpan.textContent = errorCount;
}

// Segéd függvény: tömb elemeinek véletlenszerű megkeverése (Fisher-Yates algoritmus)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// A virtuális billentyűzet létrehozása a DOM-ban
function createKeyboard() {
    for (const row of keyboardLayout) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        for (const keyChar of row) {
            const keyDiv = document.createElement('div');
            keyDiv.className = 'key';
            // "Space" felirat a szóköz billentyűre
            keyDiv.textContent = keyChar === ' ' ? 'Space' : keyChar;
            // "data-key" attribútum a billentyű azonosítására
            keyDiv.setAttribute('data-key', keyChar);
            if (keyChar === ' ') {
                keyDiv.classList.add('space-key');
            }
            // Eseményfigyelő kattintásra (mobil vagy egér esetén)
            keyDiv.addEventListener('click', () => {
                handleKey(keyChar);
            });
            rowDiv.appendChild(keyDiv);
        }
        keyboardContainer.appendChild(rowDiv);
    }
}

// Billentyűzet létrehozásának indítása
createKeyboard();