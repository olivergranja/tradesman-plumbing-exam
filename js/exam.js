/* ═══════════════════════════════════════════════════════════════
   Texas Plumbing Prep — Exam Engine
   © 2025 Oliver Granja – ViscaCode

   Handles:
     - Exam selection and building (3 unique versions)
     - Answer option shuffling with A/B/C/D balance
     - Timer (5 minutes with color-coded warnings)
     - Question rendering and navigation
     - Results calculation and review display
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ──────────────────────────────────────────────────────────────
  // CONFIGURATION
  // ──────────────────────────────────────────────────────────────
  const TIME_PER_QUESTION = 300;       // 5 minutes per question (in seconds)
  const TOTAL_QUESTIONS = 80;
  const POINTS_PER_Q = 100 / TOTAL_QUESTIONS; // 1.25 pts each
  const PASS_THRESHOLD = 70;           // points needed to pass
  const LETTERS = ['A', 'B', 'C', 'D'];

  // ──────────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────────
  let selectedExam = null;
  let examQuestions = [];
  let currentIndex = 0;
  let userAnswers = [];
  let timerInterval = null;
  let secondsLeft = TIME_PER_QUESTION;
  let examsCache = null;

  // ──────────────────────────────────────────────────────────────
  // SEEDED RANDOMIZATION
  // Deterministic shuffles so each exam version is reproducible
  // ──────────────────────────────────────────────────────────────

  /**
   * Fisher-Yates shuffle using a linear congruential generator
   * seeded with the provided number. Returns a new array.
   */
  function seededShuffle(arr, seed) {
    const result = arr.slice();
    let s = seed >>> 0;
    for (let i = result.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Generate all 24 permutations of [0,1,2,3].
   */
  function allPermutations() {
    const perms = [];
    const permute = (arr, start) => {
      if (start === arr.length - 1) {
        perms.push(arr.slice());
        return;
      }
      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]];
        permute(arr, start + 1);
        [arr[start], arr[i]] = [arr[i], arr[start]];
      }
    };
    permute([0, 1, 2, 3], 0);
    return perms;
  }

  // ──────────────────────────────────────────────────────────────
  // EXAM BUILDER
  // ──────────────────────────────────────────────────────────────

  /**
   * Build a single exam version:
   *   1. Pick N questions from each topic using the seed
   *   2. Combine with the exam's trap questions
   *   3. Shuffle full ordering
   *   4. Shuffle each question's options so correct answers
   *      alternate across A/B/C/D (no 3-in-a-row same letter)
   */
  function buildExam(seed, trapIndices) {
    // Step 1: pick regular questions by topic
    const regularIndices = [];
    TOPIC_DISTRIBUTION.forEach(({ range, count }) => {
      const topicPool = [];
      for (let i = range[0]; i <= range[1]; i++) topicPool.push(i);
      regularIndices.push(...seededShuffle(topicPool, seed + range[0]).slice(0, count));
    });

    // Step 2 & 3: combine and shuffle overall order
    const combinedIndices = seededShuffle(
      [...regularIndices, ...trapIndices],
      seed * 7
    );

    // Step 4: shuffle each question's options
    return shuffleQuestionOptions(combinedIndices, seed);
  }

  /**
   * Shuffle the 4 options of each question such that:
   *   - No 3 consecutive questions share the same correct-letter index
   *   - Distribution of correct letters stays reasonably balanced
   */
  function shuffleQuestionOptions(indices, seed) {
    let s = (seed * 13 + 7) >>> 0;
    const rng = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s;
    };

    const result = [];
    const letterCount = [0, 0, 0, 0];
    let prevLetter = -1;
    let prevPrevLetter = -1;
    const idealPerLetter = Math.ceil(indices.length / 4);

    for (let qi = 0; qi < indices.length; qi++) {
      const original = QUESTION_BANK[indices[qi]];
      const perms = allPermutations();

      // Random-order the permutations so each question tries them differently
      for (let i = perms.length - 1; i > 0; i--) {
        const j = rng() % (i + 1);
        [perms[i], perms[j]] = [perms[j], perms[i]];
      }

      // Find first permutation that satisfies the constraints
      let chosenPerm = null;
      for (const perm of perms) {
        const newCorrect = perm.indexOf(original.c);
        // Rule 1: no 3-in-a-row same letter
        if (newCorrect === prevLetter && newCorrect === prevPrevLetter) continue;
        // Rule 2: soft balance — don't exceed ideal + 2 per letter
        if (letterCount[newCorrect] >= idealPerLetter + 2) continue;
        chosenPerm = perm;
        break;
      }
      if (!chosenPerm) chosenPerm = perms[0];

      const newOptions = chosenPerm.map(oldIdx => original.o[oldIdx]);
      const newCorrectIdx = chosenPerm.indexOf(original.c);

      result.push({
        s: original.s,
        q: original.q,
        o: newOptions,
        c: newCorrectIdx,
        e: original.e
      });

      letterCount[newCorrectIdx]++;
      prevPrevLetter = prevLetter;
      prevLetter = newCorrectIdx;
    }

    return result;
  }

  /**
   * Build all 3 exam versions on demand (cached).
   */
  function getExams() {
    if (examsCache) return examsCache;
    examsCache = [
      buildExam(1001, TRAP_SETS[1]),
      buildExam(2002, TRAP_SETS[2]),
      buildExam(3003, TRAP_SETS[3]),
    ];
    return examsCache;
  }

  // ──────────────────────────────────────────────────────────────
  // UI: START SCREEN
  // ──────────────────────────────────────────────────────────────

  function selectExam(examNum) {
    selectedExam = examNum;
    document.querySelectorAll('.exam-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.getElementById(`card-${examNum}`).classList.add('selected');

    const startBtn = document.getElementById('btn-start');
    startBtn.disabled = false;
    startBtn.textContent = `START EXAM ${examNum} →`;
  }

  function startExam() {
    if (!selectedExam) return;

    examQuestions = getExams()[selectedExam - 1];
    userAnswers = new Array(examQuestions.length).fill(null);
    currentIndex = 0;
    secondsLeft = TIME_PER_QUESTION;

    document.getElementById('screen-start').style.display = 'none';
    document.getElementById('screen-quiz').style.display = 'block';
    document.getElementById('timer-bar').style.display = 'flex';

    renderQuestion();
    startTimer();
  }

  // ──────────────────────────────────────────────────────────────
  // TIMER (per-question: 5 minutes each)
  //   - Resets to 5:00 on every new question
  //   - Pauses when the user selects an answer (to read feedback)
  //   - If time runs out, marks the question as unanswered and auto-advances
  // ──────────────────────────────────────────────────────────────

  function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      secondsLeft--;
      updateTimerDisplay();
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        handleQuestionTimeout();
      }
    }, 1000);
  }

  /**
   * Reset timer to full time and start counting again.
   * Called each time a new question is shown.
   */
  function resetTimer() {
    secondsLeft = TIME_PER_QUESTION;
    startTimer();
  }

  /**
   * Stop the timer without resetting. Used when the user answers
   * so they can read the feedback without time pressure.
   */
  function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  /**
   * Called when the 5-minute limit for a single question runs out.
   *   - Leave the question unanswered (null)
   *   - If it's the last question → finish exam
   *   - Otherwise → auto-advance to next question
   */
  function handleQuestionTimeout() {
    if (currentIndex === examQuestions.length - 1) {
      // Last question — end exam
      document.getElementById('timeout-overlay').classList.add('show');
    } else {
      // Auto-advance to next question with a fresh 5:00 timer
      currentIndex++;
      resetTimer();
      renderQuestion();
    }
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const display = document.getElementById('time-display');
    const progress = document.getElementById('time-progress');

    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    progress.style.width = `${(secondsLeft / TIME_PER_QUESTION) * 100}%`;

    // Reset status classes
    display.className = '';
    progress.className = '';

    // Apply warning/danger states (last 2 min yellow, last 1 min red)
    if (secondsLeft <= 60) {
      display.classList.add('danger');
      progress.classList.add('danger');
    } else if (secondsLeft <= 120) {
      display.classList.add('warning');
      progress.classList.add('warning');
    }
  }

  // ──────────────────────────────────────────────────────────────
  // UI: QUIZ SCREEN
  // ──────────────────────────────────────────────────────────────

  function renderQuestion() {
    const question = examQuestions[currentIndex];
    const userAnswer = userAnswers[currentIndex];
    const isTrap = question.s.includes('Trap');

    // Build options HTML
    const optionsHTML = question.o.map((optText, i) => {
      let cssClass = '';
      if (userAnswer !== null) {
        if (i === question.c) cssClass = 'correct';
        else if (i === userAnswer) cssClass = 'wrong';
        else cssClass = 'reveal';
      }
      return `
        <li>
          <button class="option-btn ${cssClass}" data-option="${i}" ${userAnswer !== null ? 'disabled' : ''}>
            <span class="opt-letter">${LETTERS[i]}</span>
            <span>${optText}</span>
          </button>
        </li>`;
    }).join('');

    // Section/trap pill
    const pillHTML = isTrap
      ? `<span class="trap-pill">⚠️ Trap Question</span>`
      : `<span class="section-pill">${question.s}</span>`;

    // Feedback box (shown after answering)
    const feedbackHTML = userAnswer !== null
      ? `<div class="feedback-box ${userAnswer === question.c ? 'correct-fb' : 'wrong-fb'}">
           ${userAnswer === question.c ? '✅' : '❌'} ${question.e}
         </div>`
      : '';

    // Build card
    document.getElementById('question-container').innerHTML = `
      <div class="question-card">
        <div class="q-tag">
          Question ${currentIndex + 1} of ${examQuestions.length} &nbsp;·&nbsp; 1.25 pts
          ${pillHTML}
        </div>
        <p class="q-text">${question.q}</p>
        <ul class="options-list">${optionsHTML}</ul>
        ${feedbackHTML}
      </div>`;

    // Attach option click handlers
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.option, 10)));
    });

    // Update counter
    document.getElementById('q-counter').textContent =
      `Q ${currentIndex + 1} / ${examQuestions.length} — Exam ${selectedExam}`;

    // Update nav buttons
    document.getElementById('btn-prev').disabled = currentIndex === 0;

    const nextBtn = document.getElementById('btn-next');
    const isLastQuestion = currentIndex === examQuestions.length - 1;
    nextBtn.textContent = isLastQuestion ? 'Finish Exam' : 'Next →';
    nextBtn.disabled = userAnswers[currentIndex] === null;
    nextBtn.onclick = isLastQuestion ? finishExam : () => goToQuestion(1);
  }

  function selectAnswer(optionIndex) {
    if (userAnswers[currentIndex] !== null) return;
    userAnswers[currentIndex] = optionIndex;
    // Pause timer once answered — gives user time to read explanation
    pauseTimer();
    renderQuestion();
  }

  function goToQuestion(direction) {
    const nextIdx = currentIndex + direction;
    if (nextIdx < 0 || nextIdx >= examQuestions.length) return;

    currentIndex = nextIdx;

    // Decide timer behavior BEFORE rendering so display is correct
    if (userAnswers[currentIndex] === null) {
      // New/unanswered question → reset to full 5:00 and start counting
      resetTimer();
    } else {
      // Already answered → stop the timer and show "✓ Answered"
      pauseTimer();
      const timeDisplay = document.getElementById('time-display');
      const timeProgress = document.getElementById('time-progress');
      timeDisplay.textContent = '✓ Answered';
      timeDisplay.className = '';
      timeProgress.style.width = '100%';
      timeProgress.className = '';
    }

    renderQuestion();
  }

  function finishExam() {
    if (userAnswers[currentIndex] === null) return;
    clearInterval(timerInterval);
    showResults();
  }

  // ──────────────────────────────────────────────────────────────
  // UI: RESULT SCREEN
  // ──────────────────────────────────────────────────────────────

  function showResults() {
    clearInterval(timerInterval);
    document.getElementById('timeout-overlay').classList.remove('show');
    document.getElementById('screen-quiz').style.display = 'none';
    document.getElementById('timer-bar').style.display = 'none';
    document.getElementById('screen-result').style.display = 'block';
    window.scrollTo(0, 0);

    // Calculate stats
    const correctCount = userAnswers.reduce(
      (acc, ans, i) => acc + (ans === examQuestions[i].c ? 1 : 0), 0
    );
    const wrongCount = userAnswers.reduce(
      (acc, ans, i) => acc + (ans !== null && ans !== examQuestions[i].c ? 1 : 0), 0
    );
    const skippedCount = userAnswers.filter(a => a === null).length;
    const points = parseFloat((correctCount * POINTS_PER_Q).toFixed(1));
    const passed = points >= PASS_THRESHOLD;

    // Update score ring
    const scoreNum = document.getElementById('score-num');
    const scoreRing = document.getElementById('score-ring');
    scoreNum.textContent = points % 1 === 0 ? points : points.toFixed(1);
    scoreRing.style.borderColor = passed ? 'var(--green)' : 'var(--red)';
    scoreNum.style.color = passed ? 'var(--green)' : 'var(--red)';

    // Update messages
    document.getElementById('result-title').textContent =
      passed ? '🎉 EXAM PASSED!' : '📚 KEEP STUDYING';
    document.getElementById('result-msg').textContent = passed
      ? `Great job! You scored ${points}/100 on Exam ${selectedExam} and met the 70-point minimum to pass.`
      : `You scored ${points}/100 on Exam ${selectedExam}. You need at least 70 points. Review the answers below and try again!`;

    // Update stat boxes
    const statCorrect = document.getElementById('stat-correct');
    const statWrong = document.getElementById('stat-wrong');
    const statSkipped = document.getElementById('stat-skipped');
    const statPts = document.getElementById('stat-pts');

    statCorrect.textContent = correctCount;
    statCorrect.classList.add('correct-val');
    statWrong.textContent = wrongCount;
    statWrong.classList.add('wrong-val');
    statSkipped.textContent = skippedCount;
    statSkipped.classList.add('skipped-val');
    statPts.textContent = points;
    statPts.classList.add('pts-val');

    // Build review list
    document.getElementById('review-list').innerHTML = examQuestions.map((q, i) => {
      const userAns = userAnswers[i];
      const isCorrect = userAns === q.c;
      const icon = userAns === null ? '⬜' : isCorrect ? '✅' : '❌';

      let answerLine;
      if (userAns === null) {
        answerLine = `<span style="color:var(--muted)">Not answered</span> &nbsp;·&nbsp;
                      Correct: <span class="correct-ans">${LETTERS[q.c]}. ${q.o[q.c]}</span>`;
      } else if (isCorrect) {
        answerLine = `Your answer: <span class="correct-ans">${LETTERS[userAns]}. ${q.o[userAns]}</span>`;
      } else {
        answerLine = `Your answer: <span class="wrong-ans">${LETTERS[userAns]}. ${q.o[userAns]}</span> &nbsp;·&nbsp;
                      Correct: <span class="correct-ans">${LETTERS[q.c]}. ${q.o[q.c]}</span>`;
      }

      const explanationHTML = !isCorrect
        ? `<div class="review-a" style="margin-top:5px;font-style:italic;color:var(--muted)">💡 ${q.e}</div>`
        : '';

      return `
        <div class="review-item">
          <div class="review-icon">${icon}</div>
          <div>
            <div class="review-q">Q${i + 1}. ${q.q}</div>
            <div class="review-a">${answerLine}</div>
            ${explanationHTML}
          </div>
        </div>`;
    }).join('');
  }

  function restartExam() {
    selectedExam = null;
    document.getElementById('screen-result').style.display = 'none';
    document.getElementById('screen-start').style.display = 'block';
    document.querySelectorAll('.exam-card').forEach(card => {
      card.classList.remove('selected');
    });

    const startBtn = document.getElementById('btn-start');
    startBtn.disabled = true;
    startBtn.textContent = 'SELECT AN EXAM TO BEGIN';

    window.scrollTo(0, 0);
  }

  // ──────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ──────────────────────────────────────────────────────────────

  function init() {
    // Exam card click handlers
    document.querySelectorAll('.exam-card').forEach(card => {
      card.addEventListener('click', () => {
        selectExam(parseInt(card.dataset.exam, 10));
      });
    });

    // Start button
    document.getElementById('btn-start').addEventListener('click', startExam);

    // Navigation buttons
    document.getElementById('btn-prev').addEventListener('click', () => goToQuestion(-1));

    // Restart button
    document.getElementById('btn-restart').addEventListener('click', restartExam);

    // Timeout "View Results" button
    document.getElementById('btn-timeout-view').addEventListener('click', showResults);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
