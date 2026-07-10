/* ============================================
   CARES site logic
   ============================================ */

// ---- CONFIGURE THIS ----
// Paste the Web App URL you get after deploying the Google Apps Script
// (see google-apps-script.gs + DEPLOYMENT.md for the exact steps).
const SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
// -------------------------

// Remembers whoever filled out the interest form so their quiz score
// can be linked to the same person for research purposes.
let participant = { firstName: "", lastName: "", phone: "", zip: "" };

async function sendToSheet(payload) {
  if (!SCRIPT_URL || SCRIPT_URL.startsWith("PASTE_")) {
    console.warn("SCRIPT_URL is not configured yet — see DEPLOYMENT.md. Payload was:", payload);
    return { ok: false, reason: "not-configured" };
  }
  try {
    // Apps Script web apps behave best with a simple no-cors text/plain POST.
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    });
    return { ok: true };
  } catch (err) {
    console.error("Submit failed:", err);
    return { ok: false, reason: "network" };
  }
}

/* ============ Interest form (Section 4) ============ */
const interestForm = document.getElementById("interest-form");
const interestStatus = document.getElementById("interest-status");

interestForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const zip = document.getElementById("zip").value.trim();

  if (!firstName || !lastName || !phone || !/^\d{5}$/.test(zip)) {
    interestStatus.textContent = "Please fill in every field (zip code should be 5 digits).";
    interestStatus.dataset.state = "error";
    return;
  }

  participant = { firstName, lastName, phone, zip };

  const submitBtn = interestForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  interestStatus.textContent = "Submitting…";
  interestStatus.dataset.state = "pending";

  await sendToSheet({
    formType: "interest",
    firstName,
    lastName,
    phone,
    zip,
    timestamp: new Date().toISOString()
  });

  interestStatus.textContent = "Thanks! You're on the list.";
  interestStatus.dataset.state = "ok";
  submitBtn.disabled = false;
  interestForm.reset();
});

/* ============ Section 2: Reaction time test ============ */
const stage = document.getElementById("reaction-stage");
const content = document.getElementById("reaction-content");
const readout = document.getElementById("reaction-readout");

const STOP_SIGN_SVG = `
  <svg class="reaction__stopsign" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="29,4 71,4 96,29 96,71 71,96 29,96 4,71 4,29"
      fill="#C8102E" stroke="#fff" stroke-width="4"/>
    <text x="50" y="60" font-family="Oswald, sans-serif" font-size="24" fill="#fff"
      text-anchor="middle" font-weight="700" letter-spacing="1">STOP</text>
  </svg>`;

let reactionState = "idle"; // idle | waiting | go
let waitTimer = null;
let goTime = 0;

function resetReactionStage() {
  reactionState = "idle";
  stage.className = "reaction__stage";
  content.innerHTML = `<p class="reaction__prompt">Tap to start</p>`;
}

function startReaction() {
  clearTimeout(waitTimer);
  reactionState = "waiting";
  stage.className = "reaction__stage is-waiting";
  content.innerHTML = `<p class="reaction__prompt">Wait for it…</p>`;
  readout.textContent = "";

  const delay = 1200 + Math.random() * 2800; // 1.2s–4s
  waitTimer = setTimeout(() => {
    reactionState = "go";
    goTime = performance.now();
    stage.className = "reaction__stage is-go";
    content.innerHTML = STOP_SIGN_SVG;
  }, delay);
}

function handleStageActivate() {
  if (reactionState === "idle") {
    startReaction();
    return;
  }
  if (reactionState === "waiting") {
    // Clicked too soon
    clearTimeout(waitTimer);
    stage.className = "reaction__stage is-early";
    content.innerHTML = `<p class="reaction__prompt">Too soon!</p>`;
    readout.textContent = "Wait for the stop sign to appear, then tap. Tap to try again.";
    reactionState = "idle";
    return;
  }
  if (reactionState === "go") {
    const ms = Math.round(performance.now() - goTime);
    let msg;
    if (ms < 250) msg = "Lightning fast!";
    else if (ms < 400) msg = "Great reflexes!";
    else if (ms < 600) msg = "Solid reaction time.";
    else msg = "Stay alert out there — keep practicing!";
    readout.textContent = `${ms} ms — ${msg} Tap to try again.`;
    resetReactionStage();
  }
}

stage.addEventListener("click", handleStageActivate);
stage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleStageActivate();
  }
});

/* ---- Game tab switching ---- */
const gameTabs = document.querySelectorAll(".game-tab");
const gamePanels = document.querySelectorAll(".game-panel");

gameTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    gameTabs.forEach((t) => {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
    });
    gamePanels.forEach((p) => {
      p.classList.remove("is-active");
      p.hidden = true;
    });
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    const panel = document.getElementById(tab.dataset.panel);
    panel.classList.add("is-active");
    panel.hidden = false;
  });
});

/* ---- Game 2: Traffic Light Reaction ---- */
const lightStage = document.getElementById("light-stage");
const lightPrompt = document.getElementById("light-prompt");
const lightReadout = document.getElementById("light-readout");
const bulbRed = document.getElementById("bulb-red");
const bulbYellow = document.getElementById("bulb-yellow");
const bulbGreen = document.getElementById("bulb-green");

let lightState = "idle"; // idle | red | yellow | green
let lightTimer = null;
let lightGoTime = 0;

function setBulbs(on) {
  bulbRed.classList.toggle("is-on", on === "red");
  bulbYellow.classList.toggle("is-on", on === "yellow");
  bulbGreen.classList.toggle("is-on", on === "green");
}

function resetLightStage() {
  clearTimeout(lightTimer);
  lightState = "idle";
  setBulbs(null);
  lightPrompt.textContent = "Tap to start";
}

function startLightSequence() {
  lightState = "red";
  setBulbs("red");
  lightPrompt.textContent = "Red — get ready…";
  lightReadout.textContent = "";

  const redDelay = 1000 + Math.random() * 2000;
  lightTimer = setTimeout(() => {
    lightState = "yellow";
    setBulbs("yellow");
    lightPrompt.textContent = "Almost… wait for green";

    const yellowDelay = 500 + Math.random() * 700;
    lightTimer = setTimeout(() => {
      lightState = "green";
      setBulbs("green");
      lightPrompt.textContent = "GREEN — GO!";
      lightGoTime = performance.now();
    }, yellowDelay);
  }, redDelay);
}

function handleLightActivate() {
  if (lightState === "idle") {
    startLightSequence();
    return;
  }
  if (lightState === "red") {
    clearTimeout(lightTimer);
    lightReadout.textContent = "Too soon — that light was still red! Tap to try again.";
    resetLightStage();
    return;
  }
  if (lightState === "yellow") {
    clearTimeout(lightTimer);
    lightReadout.textContent = "Not yet — yellow means get ready, not go! Tap to try again.";
    resetLightStage();
    return;
  }
  if (lightState === "green") {
    const ms = Math.round(performance.now() - lightGoTime);
    lightReadout.textContent = `${ms} ms — nice! You waited for the green. Tap to try again.`;
    resetLightStage();
  }
}

lightStage.addEventListener("click", handleLightActivate);
lightStage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleLightActivate();
  }
});

/* ---- Game 3: Look Both Ways ---- */
const laneLeft = document.getElementById("lane-left");
const laneRight = document.getElementById("lane-right");
const laneLeftStatus = document.getElementById("lane-left-status");
const laneRightStatus = document.getElementById("lane-right-status");
const checkLeftBtn = document.getElementById("check-left");
const checkRightBtn = document.getElementById("check-right");
const crossNowBtn = document.getElementById("cross-now");
const crossingReadout = document.getElementById("crossing-readout");

let crossingRound = 1;
const CROSSING_TOTAL_ROUNDS = 3;
let crossingWins = 0;
let leftHasCar = false;
let rightHasCar = false;
let leftChecked = false;
let rightChecked = false;

function newCrossingRound() {
  leftHasCar = Math.random() < 0.5;
  rightHasCar = Math.random() < 0.5;
  leftChecked = false;
  rightChecked = false;
  laneLeft.className = "crossing__lane crossing__lane--left";
  laneRight.className = "crossing__lane crossing__lane--right";
  laneLeftStatus.textContent = "?";
  laneRightStatus.textContent = "?";
  crossNowBtn.disabled = true;
  crossingReadout.textContent = `Round ${crossingRound} of ${CROSSING_TOTAL_ROUNDS} — tap Check Left or Check Right to begin.`;
}

function updateCrossingReadiness() {
  if (leftChecked && rightChecked) {
    crossNowBtn.disabled = false;
    if (!leftHasCar && !rightHasCar) {
      crossingReadout.textContent = "Both sides clear — safe to cross!";
    } else {
      crossingReadout.textContent = "A car is coming — crossing now would not be safe.";
    }
  }
}

checkLeftBtn.addEventListener("click", () => {
  leftChecked = true;
  laneLeftStatus.textContent = leftHasCar ? "🚗" : "Clear";
  laneLeft.classList.add(leftHasCar ? "crossing__lane--checked-car" : "crossing__lane--checked-clear");
  updateCrossingReadiness();
});

checkRightBtn.addEventListener("click", () => {
  rightChecked = true;
  laneRightStatus.textContent = rightHasCar ? "🚗" : "Clear";
  laneRight.classList.add(rightHasCar ? "crossing__lane--checked-car" : "crossing__lane--checked-clear");
  updateCrossingReadiness();
});

crossNowBtn.addEventListener("click", () => {
  const safe = !leftHasCar && !rightHasCar;
  if (safe) {
    crossingWins++;
    crossingReadout.textContent = `Safe crossing! (${crossingWins}/${crossingRound} so far)`;
  } else {
    crossingReadout.textContent = "You crossed into traffic — in real life that's a crash. Always wait until both sides are clear.";
  }

  if (crossingRound >= CROSSING_TOTAL_ROUNDS) {
    setTimeout(() => {
      crossingReadout.textContent = `Finished! You crossed safely ${crossingWins} out of ${CROSSING_TOTAL_ROUNDS} times. Tap Check Left / Check Right to play again.`;
      crossingRound = 1;
      crossingWins = 0;
      newCrossingRound();
    }, 1600);
  } else {
    crossingRound++;
    setTimeout(newCrossingRound, 1600);
  }
});

newCrossingRound();

/* ---- Game 4: Speed Limit Sign Recognition ---- */
const SPEED_ROUNDS = [
  {
    scenario: "You're driving through a school zone during morning arrival, with a flashing speed sign posted.",
    correct: 15,
    options: [15, 25, 45, 55]
  },
  {
    scenario: "You're driving on a quiet residential neighborhood street.",
    correct: 25,
    options: [15, 25, 45, 65]
  },
  {
    scenario: "You're driving on the interstate outside the city, posted for highway speed.",
    correct: 70,
    options: [45, 55, 65, 70]
  },
  {
    scenario: "You're approaching a highway construction zone with workers present.",
    correct: 45,
    options: [35, 45, 55, 65]
  }
];

let speedRoundIndex = 0;
const speedScenarioEl = document.getElementById("speed-scenario");
const speedSignsEl = document.getElementById("speed-signs");
const speedReadoutEl = document.getElementById("speed-readout");

function renderSpeedRound() {
  const round = SPEED_ROUNDS[speedRoundIndex];
  speedScenarioEl.textContent = round.scenario;
  speedReadoutEl.textContent = "";
  speedSignsEl.innerHTML = "";

  const shuffled = [...round.options].sort(() => Math.random() - 0.5);
  shuffled.forEach((limit) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "speed-sign";
    btn.innerHTML = `<small>SPEED<br>LIMIT</small><strong>${limit}</strong>`;
    btn.addEventListener("click", () => handleSpeedPick(limit, round.correct, btn));
    speedSignsEl.appendChild(btn);
  });
}

function handleSpeedPick(picked, correct, btnEl) {
  const allSigns = speedSignsEl.querySelectorAll(".speed-sign");
  allSigns.forEach((b) => (b.disabled = true));

  if (picked === correct) {
    btnEl.classList.add("is-correct");
    speedReadoutEl.textContent = "Correct!";
  } else {
    btnEl.classList.add("is-wrong");
    allSigns.forEach((b) => {
      if (b.textContent.includes(String(correct))) b.classList.add("is-correct");
    });
    speedReadoutEl.textContent = `Not quite — the posted limit here would be ${correct} mph.`;
  }

  setTimeout(() => {
    speedRoundIndex = (speedRoundIndex + 1) % SPEED_ROUNDS.length;
    renderSpeedRound();
  }, 1400);
}

renderSpeedRound();

/* ============ Section 3: Quiz ============ */
const QUIZ_QUESTIONS = [
  {
    q: "In Tennessee, who is required to wear a seatbelt while a car is moving?",
    options: [
      "Only the driver",
      "The driver and everyone in the front seat",
      "The driver, front seat passengers, and back seat passengers under 17",
      "Seatbelts are optional under 25 mph"
    ],
    correct: 2
  },
  {
    q: "Is texting while driving legal anywhere in Tennessee?",
    options: [
      "Yes, if you're stopped at a red light",
      "Yes, if you're 18 or older",
      "No, it's illegal for all drivers",
      "Only illegal on the interstate"
    ],
    correct: 2
  },
  {
    q: "A driver with a learner's permit or intermediate license can use a hands-free phone while driving.",
    options: [
      "True",
      "False — no phone use at all is allowed until 18"
    ],
    correct: 1
  },
  {
    q: "What time curfew applies to learner's permit holders driving unsupervised?",
    options: [
      "No driving 10 p.m.–6 a.m.",
      "No driving after 8 p.m.",
      "No curfew at all",
      "No driving on weekends"
    ],
    correct: 0
  },
  {
    q: "When you see a stopped emergency vehicle with lights on, what should you do?",
    options: [
      "Speed up to pass quickly",
      "Move over a lane, or slow down if you can't",
      "Stop completely in your lane",
      "Flash your headlights and continue at normal speed"
    ],
    correct: 1
  },
  {
    q: "About what fraction of fatally injured occupants in teen-driver crashes were unrestrained (no seatbelt)?",
    options: ["1 in 20", "1 in 2", "1 in 100", "Nearly all of them"],
    correct: 1
  }
];

let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;

const quizQuestionEl = document.getElementById("quiz-question");
const quizOptionsEl = document.getElementById("quiz-options");
const quizCounterEl = document.getElementById("quiz-counter");
const quizProgressBar = document.getElementById("quiz-progress-bar");
const quizQuestionWrap = document.getElementById("quiz-question-wrap");
const quizResultEl = document.getElementById("quiz-result");
const quizResultScoreEl = document.getElementById("quiz-result-score");
const quizResultMsgEl = document.getElementById("quiz-result-msg");
const quizStatusEl = document.getElementById("quiz-status");

function renderQuizQuestion() {
  quizLocked = false;
  const total = QUIZ_QUESTIONS.length;
  const item = QUIZ_QUESTIONS[quizIndex];

  quizCounterEl.textContent = `Question ${quizIndex + 1} of ${total}`;
  quizProgressBar.style.width = `${((quizIndex) / total) * 100}%`;
  quizQuestionEl.textContent = item.q;
  quizOptionsEl.innerHTML = "";

  item.options.forEach((optionText, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz__option";
    btn.textContent = optionText;
    btn.addEventListener("click", () => selectQuizOption(i, btn));
    quizOptionsEl.appendChild(btn);
  });
}

function selectQuizOption(i, btnEl) {
  if (quizLocked) return;
  quizLocked = true;

  const item = QUIZ_QUESTIONS[quizIndex];
  const allButtons = quizOptionsEl.querySelectorAll(".quiz__option");
  allButtons.forEach((b) => (b.disabled = true));

  if (i === item.correct) {
    quizScore++;
    btnEl.classList.add("is-correct");
  } else {
    btnEl.classList.add("is-wrong");
    allButtons[item.correct].classList.add("is-correct");
  }

  setTimeout(() => {
    quizIndex++;
    if (quizIndex < QUIZ_QUESTIONS.length) {
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  }, 900);
}

function finishQuiz() {
  quizQuestionWrap.hidden = true;
  quizProgressBar.style.width = "100%";
  quizResultEl.hidden = false;

  const total = QUIZ_QUESTIONS.length;
  quizResultScoreEl.textContent = `${quizScore} / ${total}`;

  let msg;
  if (quizScore === total) msg = "Perfect score! You know Tennessee's roads.";
  else if (quizScore >= total - 2) msg = "Great job — you know your stuff.";
  else if (quizScore >= total / 2) msg = "Good effort! A little more practice and you'll ace it.";
  else msg = "Check out the facts above and give it another shot!";
  quizResultMsgEl.textContent = msg;
}

async function submitQuizScore() {
  const btn = document.getElementById("quiz-submit-score");
  btn.disabled = true;
  quizStatusEl.textContent = "Submitting…";
  quizStatusEl.dataset.state = "pending";

  await sendToSheet({
    formType: "quiz",
    firstName: participant.firstName,
    lastName: participant.lastName,
    phone: participant.phone,
    zip: participant.zip,
    score: quizScore,
    total: QUIZ_QUESTIONS.length,
    timestamp: new Date().toISOString()
  });

  quizStatusEl.textContent = "Score submitted. Thanks for playing!";
  quizStatusEl.dataset.state = "ok";
  btn.disabled = false;
}

function retakeQuiz() {
  quizIndex = 0;
  quizScore = 0;
  quizResultEl.hidden = true;
  quizQuestionWrap.hidden = false;
  quizStatusEl.textContent = "";
  renderQuizQuestion();
}

document.getElementById("quiz-submit-score").addEventListener("click", submitQuizScore);
document.getElementById("quiz-retry").addEventListener("click", retakeQuiz);

// Init
resetReactionStage();
renderQuizQuestion();
