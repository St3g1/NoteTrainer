/*
 ToDo:
 - StartButton should be temporarily disabled until access to micro has been granted
 - No tone should be played until the micro dialog has been accepted (not technically...but from a user-interaction)
 - Show note intonation if close to the note (currently for all notes, should be only done for the same note)
 - Percentage Tolerance (not in Hz)
 */

//--------------- OBJECTS ------------------------------
const noteContainer = document.getElementById("noteContainer");
const noteElement = document.getElementById("note");
const ghostNoteElement = document.getElementById("ghostNote");
const clefTrebleElement = document.getElementById("clefTreble");
const clefBassElement = document.getElementById("clefBass");
const sharpElement = document.getElementById("sharp");
const flatElement = document.getElementById("flat");
const ghostSharpElement = document.getElementById("ghostSharp");
const ghostFlatElement = document.getElementById("ghostFlat");
const startButton = document.getElementById("startButton");
const continueButton = document.getElementById("continueButton");
const stopButton = document.getElementById("stopButton");
const noteNameElement = document.getElementById("noteName");
const showNoteNameCheckbox = document.getElementById("showNoteNameCheckbox");
const showArrowsCheckbox = document.getElementById("showArrowsCheckbox");
const showGhostNoteCheckbox = document.getElementById("showGhostNoteCheckbox");
const playNoteCheckbox = document.getElementById("playNoteCheckbox");
const useMidiCheckbox = document.getElementById("useMidiCheckbox");
const ignoreOctaveCheckbox = document.getElementById("ignoreOctaveCheckbox");
const useBassClefCheckbox = document.getElementById("useBassClefCheckbox");
const showSummaryCheckbox = document.getElementById("showSummaryCheckbox");
const pauseCheckbox = document.getElementById("pauseCheckbox");
const pauseInput = document.getElementById("pauseInput");
const pauseAutoRadioLabel = document.getElementById("pauseAutoRadioLabel");
const pauseTextFieldRadioLabel = document.getElementById("pauseTextFieldRadioLabel");
const pauseAutoRadio = document.getElementById("pauseAutoRadio");
const pauseTextFieldRadio = document.getElementById("pauseTextFieldRadio");
const volumeThresholdInput = document.getElementById("volumeThresholdInput");
const toleranceInput = document.getElementById("toleranceInput");
const offsetInput = document.getElementById("offsetInput");
const languageSelector = document.getElementById("languageSelector");
const smallRangeRadio = document.getElementById("smallRangeRadio");
const middleRangeRadio = document.getElementById("middleRangeRadio");
const largeRangeRadio = document.getElementById("largeRangeRadio");
const noteFilterCheckbox = document.getElementById("noteFilterCheckbox");    
const noteFilterInput = document.getElementById("noteFilterInput");  
const showSharpCheckbox = document.getElementById("showSharpCheckbox");
const showFlatCheckbox = document.getElementById("showFlatCheckbox");
const noteEllipse = document.getElementById("noteEllipse");
const noteUp = document.getElementById("noteUp");
const noteDown = document.getElementById("noteDown");
const burgerMenu = document.getElementById('burgerMenu');
const optionContainer = document.getElementById('optionContainer');
const instrumentSelector = document.getElementById("instrumentSelector");
const instrumentImage = document.getElementById('instrumentImage');

const instruction = document.getElementById('instruction'); 

let currentNote = null;
let audioContext = null;
let model;

/* --- Gamification additions (state & helpers) --- */
let lives = 5;
const MAX_LIVES = 5;
let totalScore = 0;
const NOTE_TIME_LIMIT = 30; // seconds per note
let noteTimer = null;
let noteStartTimestamp = null;
const HIGHSCORE_KEY = 'noteTrainerHighscores';

function loadHighscoresLocal() {
  try {
    const raw = localStorage.getItem(HIGHSCORE_KEY) || '[]';
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}
function saveHighscoresLocal(list) {
  try {
    const trimmed = list.slice().sort((a,b) => b.score - a.score).slice(0,5);
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('saveHighscoresLocal', e);
  }
}

function gamificationEnabled() {
  const cb = document.getElementById('enableGamificationCheckbox');
  if (cb) return cb.checked;
  try { return JSON.parse(localStorage.getItem('enableGamification')) !== false; } catch (_) { return true; }
}
function setGamificationEnabled(v) {
  const cb = document.getElementById('enableGamificationCheckbox'); if (cb) cb.checked = !!v; localStorage.setItem('enableGamification', JSON.stringify(!!v));
  const hud = document.getElementById('hud'); const dlg = document.getElementById('endGameDialog'); if (hud) hud.classList.toggle('hidden', !v); if (dlg) dlg.classList.toggle('hidden', !v);
}

function updateHud() {
  const livesEl = document.getElementById('hudLivesVal');
  const scoreEl = document.getElementById('hudScoreVal');
  if (livesEl) livesEl.textContent = lives;
  if (scoreEl) scoreEl.textContent = totalScore;
}

function scoreForElapsed(elapsedSeconds) {
  const s = Math.round(100 * (1 - (elapsedSeconds / NOTE_TIME_LIMIT)));
  return Math.max(0, s);
}

function startNoteTimer() {
  if (!gamificationEnabled()) return;
  stopNoteTimer();
  noteStartTimestamp = Date.now();
  const timerEl = document.getElementById('hudTimerVal'); if (timerEl) timerEl.textContent = NOTE_TIME_LIMIT + 's';
  noteTimer = setInterval(() => {
    if (!noteStartTimestamp) return;
    const elapsed = (Date.now() - noteStartTimestamp) / 1000;
    const remaining = Math.max(0, NOTE_TIME_LIMIT - elapsed);
    if (timerEl) timerEl.textContent = Math.ceil(remaining) + 's';
    if (elapsed >= NOTE_TIME_LIMIT) { stopNoteTimer(); handleNoteTimeout(); }
  }, 250);
}
function stopNoteTimer() { if (noteTimer) { clearInterval(noteTimer); noteTimer = null; } noteStartTimestamp = null; const timerEl = document.getElementById('hudTimerVal'); if (timerEl) timerEl.textContent = '0s'; }

function onCorrectNoteScored() {
  if (!gamificationEnabled()) return;
  if (!noteStartTimestamp) return;
  const elapsed = (Date.now() - noteStartTimestamp) / 1000;
  const points = scoreForElapsed(elapsed);
  totalScore += points;
  stopNoteTimer();
  updateHud();
  status("<span class='message-green">" + getText("texts", "correct", {note: currentNote.name}) + "</span> + " + points + " pts");
}
function handleIncorrectOrTimeout(reason) {
  if (!gamificationEnabled()) return;
  lives = Math.max(0, lives - 1);
  stopNoteTimer();
  updateHud();
  if (lives <= 0) { endGame(); } else { if (reason === 'timeout') { status("<span class='message-red'>Time's up!</span>"); } setTimeout(() => { nextNote(); }, 700); }
}
function handleNoteTimeout() { debug('Note timeout reached'); accountIncorrectNotePlayed(); handleIncorrectOrTimeout('timeout'); }

function endGame() {
  stopToneDetection();
  stopNoteTimer();
  const dlg = document.getElementById('endGameDialog');
  if (!dlg) { saveHighscoreAuto('AAA'); window.location.href = 'highscores.html'; return; }
  const finalScoreEl = document.getElementById('finalScore'); if (finalScoreEl) finalScoreEl.textContent = totalScore;
  const initialsInput = document.getElementById('initialsInput'); if (initialsInput) initialsInput.value = 'AAA';
  dlg.style.display = 'block';
  const saveBtn = document.getElementById('saveHighscoreButton'); const cancelBtn = document.getElementById('cancelHighscoreButton');
  if (saveBtn) { saveBtn.onclick = () => { const input = document.getElementById('initialsInput'); let name = (input && input.value) ? input.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3) : 'AAA'; if (name.length < 3) name = name.padEnd(3, 'A'); const highs = loadHighscoresLocal(); highs.push({ name, score: totalScore, date: new Date().toISOString() }); saveHighscoresLocal(highs); dlg.style.display = 'none'; window.location.href = 'highscores.html'; }; }
  if (cancelBtn) { cancelBtn.onclick = () => { dlg.style.display = 'none'; window.location.href = 'highscores.html'; }; }
}
function saveHighscoreAuto(name) { const highs = loadHighscoresLocal(); highs.push({ name, score: totalScore, date: new Date().toISOString() }); saveHighscoresLocal(highs); }

function initGameState() { lives = MAX_LIVES; totalScore = 0; stopNoteTimer(); updateHud(); }

/*--------- Last Settings  --------------------------*/
// Load saved options from localStorage
function loadOptions() {
  initLanguageSelector(); //set language options in GUI
  showNoteNameCheckbox.checked = JSON.parse(localStorage.getItem("showNoteNameCheckbox")) || false;
  showArrowsCheckbox.checked = JSON.parse(localStorage.getItem("showArrowsCheckbox")) || false;
  showGhostNoteCheckbox.checked = JSON.parse(localStorage.getItem("showGhostNoteCheckbox")) || true;
  playNoteCheckbox.checked = JSON.parse(localStorage.getItem("playNoteCheckbox")) || false;
  useMidiCheckbox.checked = JSON.parse(localStorage.getItem("useMidiCheckbox")) || false;
  ignoreOctaveCheckbox.checked = JSON.parse(localStorage.getItem("ignoreOctaveCheckbox")) || false;
  useBassClefCheckbox.checked = JSON.parse(localStorage.getItem("useBassClefCheckbox")) || false;
  showSummaryCheckbox.checked = JSON.parse(localStorage.getItem("showSummaryCheckbox")) || false;
  pauseInput.value = localStorage.getItem("pauseInput") || "500";
  pauseCheckbox.checked = JSON.parse(localStorage.getItem("pauseCheckbox")) || true;
  handlePauseFieldEnableState();
  const selectedPause = localStorage.getItem("selectedPause") || "auto";
  document.querySelector(`input[name="pauseOption"][value="${selectedPause}"]`).checked = true;
  languageSelector.value = localStorage.getItem("languageSelector") || currentLanguage;
  initInstrumentSelector();
  instrumentSelector.value = localStorage.getItem("instrumentSelector") || "regular";
  loadInstrumentSettings(instrumentSelector.value); // Load instrument-specific settings
  const selectedNoteRange = localStorage.getItem("selectedNoteRange") || "small";
  document.querySelector(`input[name="noteRange"][value="${selectedNoteRange}"]`).checked = true;
  showSharpCheckbox.checked = JSON.parse(localStorage.getItem("showSharpCheckbox")) || false;
  showFlatCheckbox.checked = JSON.parse(localStorage.getItem("showFlatCheckbox")) || false;
  noteFilterCheckbox.checked = JSON.parse(localStorage.getItem("noteFilterCheckbox")) || false;
  noteFilterInput.value = localStorage.getItem("noteFilterInput") || "C D E F G A H";
  noteFilterInput.disabled = !noteFilterCheckbox.checked;
  setLanguage(languageSelector.value)
  updateInstrument();
  setSelectedNotes();
  setFilteredNotes();
  resetWeightedNoteNames();
  // gamification checkbox wiring
  const gamificationCb = document.getElementById('enableGamificationCheckbox');
  if (gamificationCb) {
    gamificationCb.checked = JSON.parse(localStorage.getItem('enableGamification')) !== false;
    gamificationCb.addEventListener('change', (e) => setGamificationEnabled(e.target.checked));
    setGamificationEnabled(gamificationCb.checked);
  } else {
    // fallback: ensure HUD visibility matches stored flag
    setGamificationEnabled(JSON.parse(localStorage.getItem('enableGamification')) !== false);
  }
}

function loadInstrumentSettings(instrument) {
  volumeThresholdInput.value = localStorage.getItem(`${instrument}_volumeThresholdInput`) || "1";
  toleranceInput.value = localStorage.getItem(`${instrument}_toleranceInput`) || "5";
  offsetInput.value = localStorage.getItem(`${instrument}_offsetInput`) || "0";
}

// Save options to localStorage
function saveOptions() {
  localStorage.setItem("showNoteNameCheckbox", JSON.stringify(showNoteNameCheckbox.checked));
  localStorage.setItem("showArrowsCheckbox", JSON.stringify(showArrowsCheckbox.checked));
  localStorage.setItem("showGhostNoteCheckbox", JSON.stringify(showGhostNoteCheckbox.checked));
  localStorage.setItem("playNoteCheckbox", JSON.stringify(playNoteCheckbox.checked));
  localStorage.setItem("useMidiCheckbox", JSON.stringify(useMidiCheckbox.checked));
  localStorage.setItem("ignoreOctaveCheckbox", JSON.stringify(ignoreOctaveCheckbox.checked));
  localStorage.setItem("useBassClefCheckbox", JSON.stringify(useBassClefCheckbox.checked));
  localStorage.setItem("showSummaryCheckbox", JSON.stringify(showSummaryCheckbox.checked));
  localStorage.setItem("pauseCheckbox", JSON.stringify(pauseCheckbox.checked));
  localStorage.setItem("pauseInput", pauseInput.value);
  const selectedPause = document.querySelector('input[name="pauseOption"]:checked').value;
  localStorage.setItem("selectedPause", selectedPause);
  localStorage.setItem("languageSelector", languageSelector.value);
  localStorage.setItem("instrumentSelector", instrumentSelector.value);
  saveInstrumentSettings(instrumentSelector.value); // Save instrument-specific settings
  localStorage.setItem("selectedNoteRange", document.querySelector('input[name="noteRange"]:checked').value);
  localStorage.setItem("showSharpCheckbox", JSON.stringify(showSharpCheckbox.checked));
  localStorage.setItem("showFlatCheckbox", JSON.stringify(showFlatCheckbox.checked));
  localStorage.setItem("noteFilterCheckbox", JSON.stringify(noteFilterCheckbox.checked));
  localStorage.setItem("noteFilterInput", noteFilterInput.value);
}