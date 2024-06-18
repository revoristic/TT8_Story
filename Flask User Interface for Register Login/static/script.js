const quizContainer = document.getElementById('quiz-container');
const pageContainer = document.getElementById('page-container');
const submitBtn = document.getElementById('submit-btn');
let questions = [];
let currentQuestionIndex = 0;

fetch('/static/questions.txt')
  .then(response => response.text())
  .then(data => {
    questions = data.trim().split('\n');
    buildQuiz();
    showQuestion(currentQuestionIndex);
  })
  .catch(error => {
    console.error('Error fetching questions:', error);
  });

function buildQuiz() {
  questions.forEach((question, index) => {
    const isSubjective = question.startsWith('SUBJECTIVE:');
    const questionParts = isSubjective ? question.replace('SUBJECTIVE: ', '').split(',') : question.split(',');
    const qText = questionParts[0].trim();
    
    const questionEl = document.createElement('div');
    questionEl.classList.add('question');
    questionEl.setAttribute('data-question-index', index);
    questionEl.innerHTML = `<h3>${qText}</h3>`;
    
    if (isSubjective) {
      const answerEl = document.createElement('textarea');
      answerEl.classList.add('subjective-answer');
      questionEl.appendChild(answerEl);
    } else {
      const options = questionParts.slice(1).map(opt => opt.trim());
      const optionsEl = document.createElement('div');
      optionsEl.classList.add('mcq-options');
      
      options.forEach((option) => {
        const optionEl = document.createElement('label');
        optionEl.classList.add('option');

        const isCorrect = option.endsWith('*');
        const optionText = isCorrect ? option.slice(0, -1).trim() : option;

        optionEl.innerHTML = `
          <input type="radio" name="q${index}" value="${optionText}">
          ${optionText}
        `;

        if (isCorrect) {
          optionEl.dataset.correct = true;
        }

        optionsEl.appendChild(optionEl);
      });
      
      questionEl.appendChild(optionsEl);
    }

    quizContainer.appendChild(questionEl);
  });
}

function showQuestion(index) {
  const questions = document.querySelectorAll('.question');
  questions.forEach((question, idx) => {
    question.style.display = idx === index ? 'block' : 'none';
  });

  if (index === questions.length - 1) {
    submitBtn.style.display = 'block';
    nextBtn.style.display = 'none';
  } else {
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'block';
  }

  if (index === 0) {
    prevBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'block';
  }
}

function checkAnswers() {
  let score = 0;
  const correctAnswers = [];
  const wrongAnswers = [];

  questions.forEach((question, index) => {
    const questionEl = document.querySelector(`.question[data-question-index="${index}"]`);
    const isSubjective = question.startsWith('SUBJECTIVE:');
    
    if (isSubjective) {
      const subjectiveAnswer = question.split(',')[1].trim();
      const userAnswer = questionEl.querySelector('textarea').value.trim();
      if (userAnswer.toLowerCase() === subjectiveAnswer.toLowerCase()) {
        score++;
        correctAnswers.push(questionEl.querySelector('h3').innerText);
      } else {
        wrongAnswers.push({
          question: questionEl.querySelector('h3').innerText,
          selected: userAnswer,
          correct: subjectiveAnswer
        });
      }
    } else {
      const selectedOption = questionEl.querySelector('input[type="radio"]:checked');
      if (selectedOption) {
        const selectedAnswer = selectedOption.value.trim();
        const correctOption = questionEl.querySelector('label[data-correct="true"]');
        const correctAnswer = correctOption ? correctOption.querySelector('input').value.trim() : '';

        if (selectedAnswer === correctAnswer) {
          score++;
          correctAnswers.push(questionEl.querySelector('h3').innerText);
        } else {
          wrongAnswers.push({
            question: questionEl.querySelector('h3').innerText,
            selected: selectedAnswer,
            correct: correctAnswer
          });
        }
      }
    }
  });

  const totalQuestions = questions.length;
  const percentage = ((score / totalQuestions) * 100).toFixed(2);

  pageContainer.classList.add('fade-out');

  setTimeout(() => {
    const url = new URL(window.location.origin + '/summary');
    url.searchParams.set('score', score);
    url.searchParams.set('total', totalQuestions);
    url.searchParams.set('percentage', percentage);
    url.searchParams.set('correct', encodeURIComponent(JSON.stringify(correctAnswers)));
    url.searchParams.set('wrong', encodeURIComponent(JSON.stringify(wrongAnswers)));
    
    console.log(url.toString()); // Debugging: Print the constructed URL
    window.location.href = url.toString();  
  }, 500); 
}


function showNextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
  }
}

function showPrevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion(currentQuestionIndex);
  }
}

submitBtn.addEventListener('click', checkAnswers);

const nextBtn = document.createElement('button');
nextBtn.innerText = 'Next';
nextBtn.addEventListener('click', showNextQuestion);
nextBtn.style.position = 'fixed';
nextBtn.style.bottom = '20px';
nextBtn.style.right = '20px';
document.body.appendChild(nextBtn);

const prevBtn = document.createElement('button');
prevBtn.innerText = 'Previous';
prevBtn.addEventListener('click', showPrevQuestion);
prevBtn.style.position = 'fixed';
prevBtn.style.bottom = '20px';
prevBtn.style.left = '20px';
document.body.appendChild(prevBtn);
