const categoryRow = document.getElementById('category-row');
const questionGrid = document.getElementById('question-grid');
const player1ScoreDisplay = document.getElementById('player1-score');
const player2ScoreDisplay = document.getElementById('player2-score');
const answerInput = document.getElementById('answer-input');
const submitAnswerButton = document.getElementById('submit-answer');
const responsePrompts = document.querySelectorAll('#notifications');
let categoryArray = [];
let questionArray = [];
let player1Score = 0;
let player2Score = 0;
let currentPlayer = 1;
let turnLocked = false;
// window.onload should run the start game function
window.onload = startGame;

async function fetchCategories() {
	try {
		const response = await fetch('https://the-trivia-api.com/v2/categories');
		const data = await response.json();
		const categories = Object.keys(data);
		const shuffledCategories = categories.sort(() => 0.5 - Math.random());
		categoryArray = shuffledCategories.slice(0, 6);
		console.log('Fetched Categories:', categoryArray);
	} catch (error) {
		console.error('Error fetching categories:', error);
	}
}

async function fetchQuestions() {
	for (const category of categoryArray) {
		try {
			const response = await fetch(
				`https://the-trivia-api.com/api/questions?categories=${category}&limit=5`
			);

			if (!response.ok) {
				console.error(`API request failed for ${category}:`, response.status);
				continue;
			}

			const data = await response.json();
			if (data && data.length > 0) {
				questionArray.push(...data);
				console.log(`Fetched questions for ${category}`);
			}

			await new Promise((resolve) => setTimeout(resolve, 500));
		} catch (error) {
			console.error(`Error fetching questions for ${category}:`, error);
		}
	}
	console.log('Fetched Questions:', questionArray);
}

function createTile(content, isCategory, questionData) {
	const tile = document.createElement('div');
	tile.classList.add('tile');
	const front = document.createElement('div');
	front.classList.add('front');
	front.textContent = content;
	const back = document.createElement('div');
	back.classList.add('back');

	if (questionData && questionData.question) {
		back.textContent = questionData.question;
	} else {
		console.warn('Missing question data:', questionData);
		back.textContent = 'Question not available';
	}

	tile.appendChild(front);
	tile.appendChild(back);

	if (!isCategory) {
		tile.addEventListener('click', () => {
			if (turnLocked) return;
			tile.classList.add('flipped');
			// turnLocked = true; // Disabled for now
			answerInput.focus();
		});
	}

	return tile;
}

function createBoard(categoryArray, questionArray) {
	categoryRow.innerHTML = '';
	questionGrid.innerHTML = '';

	categoryArray.forEach((category) => {
		const categoryTile = createTile(category, true);
		categoryRow.appendChild(categoryTile);
	});

	let questionIndex = 0;

	for (let i = 0; i < categoryArray.length; i++) {
		const category = categoryArray[i];
		for (let j = 0; j < 5; j++) {
			const question = questionArray[questionIndex];
			const pointValue = (j + 1) * 200;
			const questionTile = createTile(pointValue, false, question);
			questionGrid.appendChild(questionTile);
			questionIndex++;
		}
	}
	showColumn(currentColumn);
}

let currentColumn = 0;

function showColumn(columnIndex) {
	const columnWidth = document.querySelector('.tile').offsetWidth; // Get tile width
	const scrollAmount = columnIndex * columnWidth;

	// Scroll to the specified column
	categoryRow.scrollLeft = scrollAmount;
	questionGrid.scrollLeft = scrollAmount;
}

// Touch event handling for swiping (simplified example)
let touchStartX = 0;
let touchEndX = 0;

questionGrid.addEventListener('touchstart', (e) => {
	touchStartX = e.touches[0].clientX;
});

questionGrid.addEventListener('touchend', (e) => {
	touchEndX = e.changedTouches[0].clientX;

	if (touchEndX < touchStartX) {
		// Swipe left
		currentColumn = Math.min(currentColumn + 1, 5); // 5 is the max column index
		showColumn(currentColumn);
	} else if (touchEndX > touchStartX) {
		// Swipe right
		currentColumn = Math.max(currentColumn - 1, 0);
		showColumn(currentColumn);
	}
});

const startButton = document.getElementById('new-game');
startButton.addEventListener('click', startGame);

function startGame() {
	console.log('Starting new game...');
	document.getElementById('p1').classList.add('active');
	categoryArray = [];
	questionArray = [];
	player1Score = 0;
	player2Score = 0;
	player1ScoreDisplay.textContent = player1Score;
	player2ScoreDisplay.textContent = player2Score;
	currentPlayer = 1;
	turnLocked = false;
	document.getElementById('notifications').textContent = '';
	answerInput.value = '';

	fetchCategories().then(() => {
		fetchQuestions().then(() => {
			createBoard(categoryArray, questionArray);
		});
	});
}

const answerButton = document.getElementById('submit-answer');
answerButton.addEventListener('click', checkAnswer);

function checkAnswer() {
	console.log('Checking answer...');
	const answer = answerInput.value.trim().toLowerCase();
	const flippedTile = document.querySelector('.tile.flipped');
	const questionText = flippedTile.querySelector('.back').textContent;

	const questionObject = questionArray.find((q) => q.question === questionText);

	if (questionObject) {
		const correctAnswer = questionObject.correctAnswer.toLowerCase();

		if (answer === correctAnswer) {
			document.getElementById('notifications').textContent = 'Correct!';
			if (currentPlayer === 1) {
				player1Score += parseInt(
					flippedTile.querySelector('.front').textContent
				);
				player1ScoreDisplay.textContent = player1Score;
			} else {
				player2Score += parseInt(
					flippedTile.querySelector('.front').textContent
				);
				player2ScoreDisplay.textContent = player2Score;
			}

			// Clear question text and remove event listener after updating score
			flippedTile.removeEventListener('click', () => {
				if (turnLocked) return;
				tile.classList.add('flipped');
				turnLocked = true;
				answerInput.focus();
			});
			flippedTile.querySelector('.back').textContent = '';
		} else {
			document.getElementById(
				'notifications'
			).textContent = `Incorrect! The correct answer was ${correctAnswer}`;

			switchPlayer(); // Call switchPlayer only after a failed answer

			// Clear question text and remove event listener after displaying message
			flippedTile.removeEventListener('click', () => {
				if (turnLocked) return;
				tile.classList.add('flipped');
				turnLocked = true;
				answerInput.focus();
			});
			flippedTile.querySelector('.back').textContent = '';
		}

		turnLocked = false;
		answerInput.value = '';
	} else {
		console.error('Question not found in questionArray!');
	}
}

function switchPlayer() {
	currentPlayer = currentPlayer === 1 ? 2 : 1;
	document.getElementById('p1').classList.toggle('active');
	document.getElementById('p2').classList.toggle('active');
}
