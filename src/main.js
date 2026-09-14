const app = document.querySelector("#app");

const ITEMS = [
  { name: "سامي", image: "/images/sami.jpeg" },
  { name: "داود", image: "/images/daoud.png" },
  { name: "ياسمين", image: "/images/yasmin.png" },
  { name: "بشرى", image: "/images/bushra.jpeg" },
  { name: "ليمون", image: "/images/lemon.jpeg" },
  { name: "يد", image: "/images/hand.jpeg" },
  { name: "غزال", image: "/images/gazelle.jpeg" },
  { name: "دجاجة", image: "/images/chicken.jpeg" },
  { name: "زرافة", image: "/images/giraffe.jpeg" },
  { name: "بالون", image: "/images/balloon.jpeg" },
];

const TEAMS = [
  { key: 0, color: "red", title: "الفريق الأحمر", members: "سامي + بشرى" },
  { key: 1, color: "green", title: "الفريق الأخضر", members: "داود + ياسمين" },
];

let game = null;
let timerId = null;

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeQuestion(previousName = "") {
  const available = ITEMS.filter((item) => item.name !== previousName);
  const item = shuffle(available)[0] ?? ITEMS[0];
  const wrong = shuffle(ITEMS.filter((option) => option.name !== item.name)).slice(0, 3);
  return {
    item,
    choices: shuffle([item, ...wrong]),
    locked: false,
    feedback: "اختر الاسم الصحيح للصورة",
    state: "idle",
  };
}

function initialGame() {
  return {
    seconds: 60,
    rope: 50,
    score: [0, 0],
    questions: [makeQuestion(), makeQuestion()],
    ended: false,
    winner: null,
    draw: false,
  };
}

function escapeHTML(value) {
  const el = document.createElement("span");
  el.textContent = value;
  return el.innerHTML;
}

function renderShell(content) {
  app.innerHTML = `
    <header class="site-header">
      <div class="brand" aria-label="لعبة شد الحبل">
        <span class="brand-mark"><b>↔</b></span>
        <span class="brand-copy"><strong>شد <span>الحبل</span></strong><small>لعبة تعليمية بالصور</small></span>
      </div>
      <div class="header-badge">لعب جماعي • فريقان</div>
    </header>
    <main>${content}</main>
    <footer><strong>لعبة شد الحبل</strong><span>اختر الصورة الصحيحة وساعد فريقك على سحب الحبل!</span></footer>`;
}

function renderHome() {
  clearTimer();
  renderShell(`
    <section class="home-page">
      <div class="home-copy">
        <p class="kicker"><span></span> لعبة تعليمية ممتعة</p>
        <h1>لعبة <em>شد الحبل</em></h1>
        <p>صورة تظهر لكل فريق، اختاروا اسمها الصحيح بسرعة، واسحبوا الحبل نحو فريقكم.</p>
        <button class="primary-button" data-action="start">ابدأ اللعبة <span>←</span></button>
      </div>
      <div class="preview-card">
        <div class="preview-team red"><b>الفريق الأحمر</b><span>سامي + بشرى</span></div>
        <div class="preview-rope"><span></span><i>⚑</i></div>
        <div class="preview-team green"><b>الفريق الأخضر</b><span>داود + ياسمين</span></div>
      </div>
      <div class="rules">
        <article><strong>١</strong><b>شاهد الصورة</b><span>لكل فريق صورة مختلفة.</span></article>
        <article><strong>٢</strong><b>اختر الاسم</b><span>أربع إجابات، واحدة صحيحة.</span></article>
        <article><strong>٣</strong><b>اسحب الحبل</b><span>الإجابة الصحيحة تحرك الحبل ٥٪.</span></article>
      </div>
    </section>`);
  document.querySelector('[data-action="start"]')?.addEventListener("click", startGame);
}

function startGame() {
  game = initialGame();
  renderGame();
  timerId = window.setInterval(tick, 1000);
}

function renderGame() {
  if (!game) return;
  const ropePosition = Math.max(5, Math.min(95, game.rope));
  renderShell(`
    <section class="game-page">
      <div class="game-topbar">
        <button class="quit-button" data-action="quit">إنهاء اللعبة</button>
        <div class="game-title">لعبة شد الحبل</div>
        <div class="timer"><small>الوقت</small><strong id="timer-value">${formatTime(game.seconds)}</strong></div>
      </div>

      <section class="arena" aria-label="ساحة شد الحبل">
        <div class="cloud cloud-one"></div><div class="cloud cloud-two"></div>
        <div class="scoreboard">
          <div class="score red-score"><small>الأحمر</small><strong>${game.score[0]}</strong></div>
          <div class="score-center">VS</div>
          <div class="score green-score"><small>الأخضر</small><strong>${game.score[1]}</strong></div>
        </div>
        <div class="rope-scene">
          <div class="person person-red"><span class="head"></span><span class="body"></span><span class="arm"></span><span class="leg leg-one"></span><span class="leg leg-two"></span></div>
          <div class="rope-track">
            <span class="rope-line"></span>
            <span class="center-mark"></span>
            <span class="finish finish-left"></span><span class="finish finish-right"></span>
            <span class="flag" style="left:${ropePosition}%"><i>⚑</i></span>
          </div>
          <div class="person person-green"><span class="head"></span><span class="body"></span><span class="arm"></span><span class="leg leg-one"></span><span class="leg leg-two"></span></div>
        </div>
        <div class="arena-labels"><strong>الفريق الأحمر</strong><span>الحبل في المنتصف</span><strong>الفريق الأخضر</strong></div>
      </section>

      <section class="questions" aria-label="أسئلة الفريقين">
        ${questionPanel(0)}
        <div class="versus-badge">VS</div>
        ${questionPanel(1)}
      </section>
    </section>`);

  bindGameEvents();
}

function questionPanel(index) {
  const team = TEAMS[index];
  const question = game.questions[index];
  const disabled = question.locked || game.ended;
  const choices = question.choices.map((choice) => `
    <button class="choice-button" data-team="${index}" data-answer="${escapeHTML(choice.name)}" ${disabled ? "disabled" : ""}>
      ${escapeHTML(choice.name)}
    </button>`).join("");

  return `<article class="question-panel ${team.color} ${question.state}" data-panel="${index}">
    <div class="panel-head">
      <div class="team-dot"></div>
      <div><small>${team.title}</small><strong>${team.members}</strong></div>
      <span class="score-pill">${game.score[index]}</span>
    </div>
    <div class="image-frame">
      <img src="${question.item.image}" alt="صورة السؤال" draggable="false" />
    </div>
    <p class="instruction">ما اسم هذه الصورة؟</p>
    <div class="choices">${choices}</div>
    <p class="feedback" aria-live="polite">${escapeHTML(question.feedback)}</p>
  </article>`;
}

function bindGameEvents() {
  document.querySelector('[data-action="quit"]')?.addEventListener("click", () => {
    if (confirm("هل تريد إنهاء اللعبة والعودة إلى البداية؟")) renderHome();
  });
  document.querySelectorAll(".choice-button").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.team);
      const answer = button.dataset.answer || "";
      answerQuestion(index, answer);
    });
  });
}

function answerQuestion(index, answer) {
  if (!game || game.ended) return;
  const question = game.questions[index];
  if (!question || question.locked) return;

  question.locked = true;
  const correct = answer === question.item.name;
  question.state = correct ? "correct" : "wrong";
  question.feedback = correct ? "أحسنت! سحبتم الحبل ٥٪ 🎉" : `ليست صحيحة. الإجابة هي: ${question.item.name}`;

  if (correct) {
    game.score[index] += 1;
    game.rope += index === 0 ? -5 : 5;
  }

  renderGame();

  if (game.rope <= 5) {
    endGame(0);
    return;
  }
  if (game.rope >= 95) {
    endGame(1);
    return;
  }

  window.setTimeout(() => {
    if (!game || game.ended) return;
    const previous = question.item.name;
    game.questions[index] = makeQuestion(previous);
    renderGame();
  }, correct ? 650 : 850);
}

function tick() {
  if (!game || game.ended) return;
  game.seconds -= 1;
  const timer = document.querySelector("#timer-value");
  if (timer) timer.textContent = formatTime(game.seconds);
  if (game.seconds <= 0) finishByScore();
}

function finishByScore() {
  if (!game || game.ended) return;
  if (game.score[0] > game.score[1]) endGame(0);
  else if (game.score[1] > game.score[0]) endGame(1);
  else if (game.rope < 50) endGame(0);
  else if (game.rope > 50) endGame(1);
  else endGame(null, true);
}

function endGame(winner, draw = false) {
  if (!game || game.ended) return;
  game.ended = true;
  game.winner = winner;
  game.draw = draw;
  clearTimer();

  const title = draw ? "تعادل رائع!" : `${TEAMS[winner].title} يفوز!`;
  const subtitle = draw ? "تساوى الفريقان في النقاط والحبل في المنتصف." : "أداء رائع! لقد وصلتم إلى نهاية الجولة.";
  const winnerClass = draw ? "draw" : TEAMS[winner].color;
  const overlay = document.createElement("div");
  overlay.className = "result-overlay";
  overlay.innerHTML = `
    <div class="result-card ${winnerClass}">
      <div class="trophy">🏆</div>
      <p class="kicker"><span></span> انتهت الجولة <span></span></p>
      <h2>${escapeHTML(title)}</h2>
      <p>${escapeHTML(subtitle)}</p>
      <div class="final-score">
        <div class="red"><small>الفريق الأحمر</small><strong>${game.score[0]}</strong></div>
        <b>—</b>
        <div class="green"><small>الفريق الأخضر</small><strong>${game.score[1]}</strong></div>
      </div>
      <div class="result-actions">
        <button data-result="again">العب مرة أخرى</button>
        <button class="secondary" data-result="home">العودة للبداية</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));
  overlay.querySelector('[data-result="again"]')?.addEventListener("click", () => {
    overlay.remove();
    startGame();
  });
  overlay.querySelector('[data-result="home"]')?.addEventListener("click", () => {
    overlay.remove();
    renderHome();
  });
}

function clearTimer() {
  if (timerId !== null) window.clearInterval(timerId);
  timerId = null;
}

function formatTime(seconds) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

renderHome();
