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

window.onload = () => {
	console.log(responsePrompts.entries);
	fetchCategories().then(() => {
		fetchQuestions().then(() => {
			createBoard(categoryArray, questionArray);
		});
	});
};

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
			// turnLocked = true; disabled for now
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
}

function startGame() {
	// Reset game state (you'll need to implement this based on your game logic)
	// ...

	fetchCategories().then(() => {
		fetchQuestions().then(() => {
			createBoard(categoryArray, questionArray);
		});
	});
}

document
	.querySelector('#submit-answer')
	.addEventListener('click', submitAnswer);

function submitAnswer() {
	console.log('Submit Answer');
	const answer = answerInput.value.trim().toLowerCase();
	const currentTile = document.querySelector('.tile.flipped');
	const question = currentTile.querySelector('.back').textContent;

	// Find the correct answer from questionArray (with error handling)
	const questionObject = questionArray.find((q) => q.question === question);
	if (!questionObject) {
		console.error('Question not found in questionArray:', question);
		return; // Exit the function if the question is not found
	}
	const correctAnswer = questionObject.correctAnswer.toLowerCase();
	console.log('Correct Answer:', correctAnswer);

	// Update #notification instead of responsePrompts
	const notificationDiv = document.getElementById('notifications');

	if (answer === correctAnswer) {
		notificationDiv.textContent = `Correct! The answer is: ${correctAnswer}`;
		if (currentPlayer === 1) {
			player1Score += parseInt(currentTile.querySelector('.front').textContent);
			player1ScoreDisplay.textContent = player1Score;
		} else {
			player2Score += parseInt(currentTile.querySelector('.front').textContent);
			player2ScoreDisplay.textContent = player2Score;
		}
	} else {
		notificationDiv.textContent = `Incorrect! The correct answer is: ${correctAnswer}`;
	}

	// Switch players
	currentPlayer = currentPlayer === 1 ? 2 : 1;

	// Flip the tile back
	currentTile.classList.remove('flipped');

	// Unlock for next turn
	turnLocked = false;

	// Reset input field
	answerInput.value = '';

	// Check for end of game (implementation depends on your game logic)
	// ...
}
