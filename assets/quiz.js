let quizState = {
  daysMeta: [],
  bank: {},
  selection: null, // dayId or "all"
  questions: [],
  current: 0,
  score: 0,
  review: [],
};

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleQuestionOptions(question) {
  const order = shuffle(question.options.map((_, i) => i));
  return {
    ...question,
    options: order.map((i) => question.options[i]),
    correct: order.indexOf(question.correct),
  };
}

async function loadQuizData() {
  const [daysRes, quizRes] = await Promise.all([
    fetch("data/days.json"),
    fetch("data/quiz.json"),
  ]);
  const days = (await daysRes.json()).days;
  const bank = await quizRes.json();
  return { days, bank };
}

function setupScreenHTML() {
  const wrap = document.getElementById("quiz-wrap");
  const availableIds = Object.keys(quizState.bank);
  const totalQuestions = availableIds.reduce(
    (sum, id) => sum + quizState.bank[id].questions.length,
    0
  );

  const dayButtons = availableIds
    .map((id) => {
      const meta = quizState.daysMeta.find((d) => d.id === id);
      const title = meta ? meta.title : `Dia ${id}`;
      const count = quizState.bank[id].questions.length;
      return `
        <button class="quiz-day-btn" data-day="${id}">
          <span class="tag">DIA ${id}</span>
          <span class="title">${title}</span>
          <span class="count">${count} pergunta${count === 1 ? "" : "s"}</span>
        </button>
      `;
    })
    .join("");

  wrap.innerHTML = `
    <div class="quiz-card">
      <div class="term-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="file-name">selecionar-dia.sh</span></div>
      <div class="quiz-card-body">
        <h3>Escolha o que validar</h3>
        <div class="quiz-day-grid">
          ${dayButtons}
          <button class="quiz-day-btn quiz-day-btn-all" data-day="all">
            <span class="tag">TODOS OS DIAS</span>
            <span class="title">Revisão geral</span>
            <span class="count">${totalQuestions} perguntas</span>
          </button>
        </div>
      </div>
    </div>
  `;

  wrap.querySelectorAll(".quiz-day-btn").forEach((btn) => {
    btn.addEventListener("click", () => startQuiz(btn.dataset.day));
  });
}

function startQuiz(selection) {
  quizState.selection = selection;

  let pool = [];
  if (selection === "all") {
    Object.keys(quizState.bank).forEach((id) => {
      const dayTitle = quizState.bank[id].title;
      quizState.bank[id].questions.forEach((q) => pool.push({ ...q, dayTitle }));
    });
  } else {
    const dayTitle = quizState.bank[selection].title;
    pool = quizState.bank[selection].questions.map((q) => ({ ...q, dayTitle }));
  }

  quizState.questions = shuffle(pool).map(shuffleQuestionOptions);
  quizState.current = 0;
  quizState.score = 0;
  quizState.review = [];

  renderQuestion();
}

function renderQuestion() {
  const wrap = document.getElementById("quiz-wrap");
  const total = quizState.questions.length;
  const idx = quizState.current;
  const question = quizState.questions[idx];
  const progress = Math.round((idx / total) * 100);

  const optionsHTML = question.options
    .map((opt, i) => `<button class="quiz-option" data-index="${i}">${opt}</button>`)
    .join("");

  wrap.innerHTML = `
    <div class="quiz-progress">
      <div class="quiz-progress-bar" style="width:${progress}%"></div>
    </div>
    <div class="quiz-card">
      <div class="term-bar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="file-name">pergunta ${idx + 1} de ${total}${question.dayTitle ? ` &mdash; ${question.dayTitle}` : ""}</span>
      </div>
      <div class="quiz-card-body">
        <h3 class="quiz-question">${question.q}</h3>
        <div class="quiz-options">${optionsHTML}</div>
        <div class="quiz-feedback" id="quiz-feedback" hidden></div>
        <div class="quiz-actions" id="quiz-actions" hidden>
          <button class="quiz-next-btn" id="quiz-next-btn">${idx + 1 === total ? "Ver resultado" : "Próxima pergunta"}</button>
        </div>
      </div>
    </div>
  `;

  wrap.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.addEventListener("click", () => answerQuestion(parseInt(btn.dataset.index, 10)));
  });
}

function answerQuestion(chosenIndex) {
  const question = quizState.questions[quizState.current];
  const optionButtons = document.querySelectorAll(".quiz-option");
  const isCorrect = chosenIndex === question.correct;

  optionButtons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === question.correct) btn.classList.add("correct");
    else if (i === chosenIndex) btn.classList.add("wrong");
  });

  if (isCorrect) quizState.score++;

  quizState.review.push({
    q: question.q,
    dayTitle: question.dayTitle,
    chosen: question.options[chosenIndex],
    correctAnswer: question.options[question.correct],
    isCorrect,
    explain: question.explain,
  });

  const feedbackEl = document.getElementById("quiz-feedback");
  feedbackEl.hidden = false;
  feedbackEl.className = `quiz-feedback ${isCorrect ? "is-correct" : "is-wrong"}`;
  feedbackEl.innerHTML = `<span class="icon">${isCorrect ? "✅" : "❌"}</span><p>${question.explain}</p>`;

  document.getElementById("quiz-actions").hidden = false;
  document.getElementById("quiz-next-btn").addEventListener("click", nextQuestion);
}

function nextQuestion() {
  quizState.current++;
  if (quizState.current < quizState.questions.length) {
    renderQuestion();
  } else {
    renderResult();
  }
}

function renderResult() {
  const wrap = document.getElementById("quiz-wrap");
  const total = quizState.questions.length;
  const score = quizState.score;
  const pct = Math.round((score / total) * 100);

  let verdict = "Vale revisar as anotações desse dia antes de seguir.";
  if (pct >= 80) verdict = "Mandou bem — conhecimento consolidado.";
  else if (pct >= 50) verdict = "Base ok, mas vale revisar alguns pontos.";

  const wrongReview = quizState.review.filter((r) => !r.isCorrect);
  const reviewHTML = wrongReview.length
    ? wrongReview
        .map(
          (r) => `
        <div class="quiz-review-item">
          <p class="quiz-review-q">${r.dayTitle ? `<span class="quiz-review-tag">${r.dayTitle}</span>` : ""}${r.q}</p>
          <p class="quiz-review-wrong">Sua resposta: ${r.chosen}</p>
          <p class="quiz-review-correct">Correta: ${r.correctAnswer}</p>
          <p class="quiz-review-explain">${r.explain}</p>
        </div>
      `
        )
        .join("")
    : `<p class="quiz-review-empty">Sem erros para revisar — mandou muito bem!</p>`;

  wrap.innerHTML = `
    <div class="quiz-card">
      <div class="term-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="file-name">resultado.log</span></div>
      <div class="quiz-card-body quiz-result">
        <div class="quiz-score">${score}/${total}</div>
        <p class="quiz-verdict">${verdict}</p>
        <div class="quiz-result-actions">
          <button class="quiz-next-btn" id="quiz-retry-btn">Refazer esse quiz</button>
          <button class="quiz-secondary-btn" id="quiz-back-btn">Escolher outro dia</button>
        </div>
        <h4 class="quiz-review-title">Revisão</h4>
        ${reviewHTML}
      </div>
    </div>
  `;

  document.getElementById("quiz-retry-btn").addEventListener("click", () => startQuiz(quizState.selection));
  document.getElementById("quiz-back-btn").addEventListener("click", setupScreenHTML);
}

async function initQuiz() {
  const wrap = document.getElementById("quiz-wrap");
  try {
    const { days, bank } = await loadQuizData();
    quizState.daysMeta = days;
    quizState.bank = bank;

    if (!Object.keys(bank).length) {
      wrap.innerHTML = `<div class="empty-note"><div class="icon">$_</div><p>Ainda não há perguntas cadastradas em <code>data/quiz.json</code>.</p></div>`;
      return;
    }

    setupScreenHTML();
  } catch (err) {
    wrap.innerHTML = `<div class="empty-note"><div class="icon">!</div><p>Não foi possível carregar o quiz.</p><p>Rode este site com um servidor local (ex: <code>python3 -m http.server</code>) em vez de abrir o arquivo diretamente.</p></div>`;
  }
}
