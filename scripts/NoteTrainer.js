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

/*--------- Last Settings  --------------------------*/
// Load saved options from localStorage
function loadOptions() {
  initLanguageSelector(); //set language options in GUI
  showNoteNameCheckbox.checked = JSON.parse(localStorage.getItem("showNoteNameCheckbox")) || false;
  showArrowsCheckbox.checked = JSON.parse(localStorage.getItem("showArrowsCheckbox")) || false;
  showGhostNoteCheckbox.checked = JSON.parse(localStorage.getItem("showGhostNoteCheckbox")) || true;
  playNoteCheckbox.checked = JSON.parse(localStorage.getItem("playNoteCheckbox")) || false;
  useMidiCheckbox.checked = JSON.parse(localStorage.getItem("useMidiCheckbox")) || false;
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
  
function saveInstrumentSettings(instrument) {
  localStorage.setItem(`${instrument}_volumeThresholdInput`, volumeThresholdInput.value);
  localStorage.setItem(`${instrument}_toleranceInput`, toleranceInput.value);
  localStorage.setItem(`${instrument}_offsetInput`, offsetInput.value);
}

function initInstrumentSelector() {
  const instrumentNames = Object.keys(instruments);
  const instrumentSelected = instrumentSelector.value;
  while (instrumentSelector.options.length > 0) {instrumentSelector.remove(0);} // Clear the select options
  instrumentNames.forEach(instrumentName => {
    const option = document.createElement('option');
    option.value = instrumentName;
    option.title = getText("tooltips", instruments[instrumentName].key);
    option.textContent = getText("options",  instruments[instrumentName].key);
    instrumentSelector.appendChild(option);
  });
  instrumentSelector.value = instrumentSelected
}

function handlePauseFieldEnableState() {
  pauseInput.disabled = !pauseCheckbox.checked;
  pauseAutoRadioLabel.disabled = !pauseCheckbox.checked;
  pauseTextFieldRadioLabel.disabled = !pauseCheckbox.checked;
  pauseAutoRadio.disabled = !pauseCheckbox.checked;
  pauseTextFieldRadio.disabled = !pauseCheckbox.checked;
}
//--------------- EVENT LISTENERS ------------------------------
showNoteNameCheckbox.addEventListener('change', () => {
  noteNameElement.textContent = showNoteNameCheckbox.checked && currentNote ? currentNote.name : '';
  saveOptions();
  triedOnce = false; //in order to trigger update of message
  checkNote(null);
});
showArrowsCheckbox.addEventListener('change', () => { saveOptions(); hideUpDownArrow(); });
showGhostNoteCheckbox.addEventListener('change', () => { saveOptions(); hideGhostNote(); });  
playNoteCheckbox.addEventListener('change', () => {
  saveOptions(); 
  playMp3(currentNote);
});
useMidiCheckbox.addEventListener('change', () => {
  saveOptions();
  // If MIDI was enabled while running, re-init detection path
  if (running) {
    // stop current detection and restart with new mode
    stopToneDetection();
    startToneDetection();
  }
});
useBassClefCheckbox.addEventListener('change', () => {
  saveOptions(); 
  displayNote(currentNote);
});   
showSummaryCheckbox.addEventListener('change', () => { saveOptions(); });
pauseCheckbox.addEventListener('change', () => { handlePauseFieldEnableState(); resetNoteColor(); saveOptions(); });
pauseInput.addEventListener('change', () => { saveOptions();});
pauseAutoRadio.addEventListener('change', () => { saveOptions();});
pauseTextFieldRadio.addEventListener('change', () => { saveOptions();});
document.getElementById('debugCheckbox').addEventListener('change', () => { if(!document.getElementById('debugCheckbox').checked){debug("");}});
volumeThresholdInput.addEventListener('change', () => { saveOptions(); });
toleranceInput.addEventListener('change', () => { saveOptions(); });
offsetInput.addEventListener('change', () => { saveOptions(); });
instrumentSelector.addEventListener('change', () => { loadInstrumentSettings(instrumentSelector.value); setSelectedNotes(); setFilteredNotes(); initNoteStatistics(); resetWeightedNoteNames(); updateInstrument(); saveOptions(); nextNote(); });
showSharpCheckbox.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
showFlatCheckbox.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
smallRangeRadio.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
middleRangeRadio.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
largeRangeRadio.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
noteFilterCheckbox.addEventListener('change', () => { noteFilterInput.disabled = !noteFilterCheckbox.checked; saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote();}); 
noteFilterInput.addEventListener('change', () => {  saveOptions(); setFilteredNotes(); resetWeightedNoteNames();}); 
burgerMenu.addEventListener('click', () => {optionContainer.classList.toggle('active'); updateTexts();});
document.addEventListener('click', (event) => { //close option dialog if clicked outside
  if (!optionContainer.contains(event.target) && !burgerMenu.contains(event.target)) {
    optionContainer.classList.remove('active');
  }
});
instrumentImage.addEventListener('dblclick', () => {playAllNotes(notesFiltered);});
startButton.addEventListener("click", () => {startToneDetection(); });
continueButton.addEventListener("click", () => {nextNote(); });
stopButton.addEventListener("click", () => {
  releaseWakeLock();
  stopToneDetection();
  handleButtons();
  if(showSummaryCheckbox.checked){
    showSummary();
  } else {
    location.reload();
  }
});

function handleButtons(force = false) {
  if(running || force) {
    startButton.style.display = "none";
    continueButton.style.display = "block";
    stopButton.style.display = "block";
  } else {
    startButton.style.display = "block";
    continueButton.style.display = "none";
    stopButton.style.display = "none";
  }  
}

function isStarted() {
  return startButton.style.display == "none";
}

function updateInstrument() {
  instruction.style.visibility = 'visible'; 
  instruction.style.opacity = '1';
  const instrumentName = document.getElementById('instrumentName');
  instrumentName.innerHTML = getText("options", instruments[instrumentSelector.value].key);
  instrumentImage.src = instruments[instrumentSelector.value].image;
  instrumentImage.style.visibility = 'visible'; 
  instrumentImage.style.opacity = '1';
}

function error(text) {
  document.getElementById('status').innerHTML = '<span class="message-red">Error: ' + text + '</span>';
  return text;
}

function status(text) {
  document.getElementById('status').innerHTML = text;
}

let lastMessage;
function debug(text, reset = false) {
  if(document.getElementById('debugCheckbox').checked){
    if(text != lastMessage){
      document.getElementById('debugMsg').style.display = 'block';
      document.getElementById('debugMsg').innerHTML = (reset ? "" : document.getElementById('debugMsg').innerHTML + "<br>") + text;
    }
    lastMessage = text;
  } else {
    document.getElementById('debugMsg').style.display = 'none';
    document.getElementById('debugMsg').innerHTML = "";
  }   
}

//--------------- NOTE SELECTION ------------------------------
var notesSelected = []; 

function setSelectedNotes() {   
  notesSelected = getSelectedNotes();
}

function getSelectedNotes() {//pick notes based on instrument (different tuning)
  return instruments[instrumentSelector.value].notes;
}

var notesFiltered = [];
function setFilteredNotes(){
  notesFiltered = filterNotes(notesSelected);
}

function filterNotes(notes){
  //Filter notes
  if (smallRangeRadio.checked) {
    notes = notes.filter(note => note.position >= 0 && note.position <= 70);
  } else if (middleRangeRadio.checked) {
    notes = notes.filter(note => note.position >= 0 && note.position <= 140);
  } else if (largeRangeRadio.checked) {
    notes = notes.filter(note => note.position >= (useBassClefCheckbox.checked ? -210 : -70) && note.position <= 210);
  }
  if (!showSharpCheckbox.checked) {
    notes = notes.filter(note => !note.name.includes('#'));
  }
  if (!showFlatCheckbox.checked) {
    notes = notes.filter(note => !note.name.includes('b'));
  }
  if(noteFilterCheckbox.checked){
    const noteFilter = noteFilterInput.value.split(' ').map(n => n.trim()).filter(n => n);
    if (noteFilter.length > 0) {
      const regex = new RegExp(noteFilter.join('|'), 'i');
      notes = notes.filter(note => regex.test(note.name));
      // Check for notes in noteFilter that are not in filteredNotes and add them
      noteFilter.forEach(filterNote => {
        const matchingNote = notesSelected.find(note => note.name === filterNote);
        if (matchingNote && !notes.includes(matchingNote)) {
          notes.push(matchingNote);
          console.log('Added note:', matchingNote.name);
        }
      });
    }
  }
  if(notes.length === 0){error(getText("texts", "noNotes"));} else {status("");}//no notes left
  return notes;
}

var noteStatistics = {};
function initNoteStatistics() {
  noteStatistics = {}; //reset 
  notesSelected.forEach(note => {
    noteStatistics[note.name] = { correct: 0, incorrect: 0 };
  });
}

// Show the next note
function nextNote() {
  debug("Proposing next note. ==============================", false);
  resetNoteColor();
  hideUpDownArrow();
  hideGhostNote();
  blockDetection = false; // Unblock detection after a pause
  triedOnce = false;
  incorrectWhenSilence = false;
  toneWeighted = false; //Only weight a tone as correct/incorrect once per proposed note
  correctNotePlayed = false; // Reset the flag for the next note
  decayTimeoutReached = false; // Reset decay timeout flag
  setTimeout(() => {decayTimeoutReached = true;}, 3000); // Set decay timeout to 3 seconds, until the previous note is detected as incorrect
  currentNote = getNextNote();
  if(isStarted()){displayNote(currentNote)};
  noteContainer.className = "staff"; // Reset staff color
}

//--------------- NOTE DRAWING ------------------------------
let clefSwitchPosition = 0; //threshold to switch between treble and bass clef based on position of note
let offset_global = -60; //using svg for flat and sharp somehow requires a different handling. Used in drawAccidental

// Display the note on the staff
function displayNote(note) {
  // Guard: nothing to display
  if (!note) {
    // clear UI elements that depend on a current note
    currentNote = null;
    noteElement.style.display = 'none';
    ghostNoteElement.style.display = 'none';
    noteNameElement.textContent = '';
    clefTrebleElement.style.display = 'none';
    clefBassElement.style.display = 'none';
    sharpElement.style.display = 'none';
    flatElement.style.display = 'none';
    // hide ledger lines if you have a helper for that (optional)
    return;
  }

  // existing displayNote logic...
  currentNote = note;
  noteElement.style.display = 'block';
  drawClef(note);
  drawNote(note);
  drawNoteName(note);
  drawAccidental(note);
  playMp3(note);
//  setStemDirection(note.position);
}

function drawClef(note){
  // Guard: ensure note object exists and has position
  if (!note || typeof note.position === 'undefined' || note.position === null) {
    // fallback: hide both clefs (or keep previously shown one)
    clefTrebleElement.style.display = 'none';
    clefBassElement.style.display = 'none';
    return;
  }

  if((note.position < clefSwitchPosition) && useBassClefCheckbox.checked){
    clefTrebleElement.style.display = "none";
    clefBassElement.style.display = "block";
  } else {
    clefTrebleElement.style.display = "block";
    clefBassElement.style.display = "none";
  }
}

function drawNoteName(note){
  noteNameElement.textContent = showNoteNameCheckbox.checked ? note.name : ''; // Display or hide note name
}

function drawNote(note){
  drawNoteMain(note, noteElement);
}

function drawGhostNote(note){
  if(!showGhostNoteCheckbox.checked){return null;}
  drawNoteMain(note, ghostNoteElement);
  drawAccidentalMain(note, ghostSharpElement, ghostFlatElement);
}

function hideGhostNote(){
  ghostNoteElement.style.display = "none";
  ghostSharpElement.style.display = "none";
  ghostFlatElement.style.display = "none"; 
}

function drawAccidental(note){
  drawAccidentalMain(note, sharpElement, flatElement);
}

function drawGhostwAccidental(note){
  drawAccidentalMain(note, ghostSharpElement, ghostFlatElement);  
}

function drawNoteMain(note, element){
  element.style.display = 'block'; // Show the note
  const offset = (note.position < clefSwitchPosition) && useBassClefCheckbox.checked ? 120 : 0;
  element.style.bottom = `${note.position+offset+offset_global}px`; // Position dynamically
}

function drawAccidentalMain(note, elementSharp, elementFlat){ //Vorzeichen
  const offset = (note.position < clefSwitchPosition) && useBassClefCheckbox.checked ? 120 : 0;
  elementSharp.style.display = 'none'; //hide 
  elementFlat.style.display = 'none'; //hide
  if (note.name.includes('#')) {
    elementSharp.style.display = 'block'; 
    elementSharp.style.top = `${-(note.position + offset + offset_global -47)}px`; // Adjust position for accidental
  } else if (note.name.includes('b') || note.name.includes('B')) {
    elementFlat.style.display = 'block';
    elementFlat.style.top = `${-(note.position + offset + offset_global - 40)}px`; // Adjust position for accidental
  }        
}

// Draw ledger lines for notes outside the staff
function drawLedgerLines(note, color = 'black') {
  const ledgerLines = document.querySelectorAll('.ledger-line');
  ledgerLines.forEach(line => line.remove());
  const offset = (note.position < clefSwitchPosition) && useBassClefCheckbox.checked ? 120 : 0;
  const position = note.position + offset;
  if (position > 100 || position < 10) {
    const numLines = position > 100 ? Math.abs(Math.ceil((100-position) / 20)) : Math.abs(Math.ceil(position / 20))+1;
    for (let i = 0; i < numLines; i++) {
      const line = document.createElement('div');
      line.className = 'ledger-line';
      linePosition = (position > 100 ? offset_global + 140 + (i * 20) : offset_global + 20 - (i * 20)) - 2;
      if(Math.abs(note.position -42 - linePosition) < 5){
        line.style.backgroundColor = color;
      } else {
        line.style.backgroundColor = "black";
      }
      line.style.bottom = `${linePosition}px`;
      noteContainer.appendChild(line);
    }
  }
}

// Set the direction of the note stem (not used here)
function setStemDirection(position) {
  const stem = noteElement.querySelector('.stem');
  if (position > 50) {
    stem.setAttribute('y', '0');
    noteElement.classList.add('down');
    noteElement.classList.remove('up');
  } else {
    stem.setAttribute('y', '20');
    noteElement.classList.add('up');
    noteElement.classList.remove('down');
  }
}

/*--------- Audio OUTPUT --------------------------*/
// Play the note using Web Audio API

let currentOscillator = null; 
isTonePlaying = false;
function playTone(note) {
  enableAudioContextIfRequired();
  if (currentOscillator) {
    currentOscillator.stop();
    currentOscillator = null;
  }
  oscillator = audioContext.createOscillator();
  oscillator.type = 'sawtooth'; // You can change the type to 'square', 'sine', 'sawtooth', 'triangle'
  oscillator.frequency.setValueAtTime(note.frequency + parseInt(offsetInput.value), audioContext.currentTime);
  oscillator.connect(audioContext.destination);
  oscillator.start();
  isTonePlaying = true;
  oscillator.onended = () => {currentOscillator = null; isTonePlaying = false;}; // Reset the current oscillator when the note has ended
  oscillator.stop(audioContext.currentTime + 1); // Play the note for 1 second
  currentOscillator = oscillator; // Update the current oscillator
}

let currentSource = null; // Variable to keep track of the currently playing source
isMp3Playing = false;
async function playMp3(note) {
  if(!(playNoteCheckbox.checked && note)){return null;} //don't play if checkbox is not checked or note is not defined
  enableAudioContextIfRequired();
  try {
    if (currentSource) {currentSource.stop(); currentSource = null;} // Stop the currently playing source if it exists
    const audioBuffer = await loadMp3(note);
    if (!audioBuffer) {
      throw new Error('AudioBuffer is null or undefined');
    }
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    isMp3Playing = true;
    // Add an event listener for the 'ended' event
    source.onended = () => {currentSource = null; isMp3Playing = false;}; // Reset the current source when the audio has ended
    currentSource = source; // Update the current source
  } catch (error) {
    console.log('Error playing MP3:', error);
  }
}

// Load the audio file for the given note (can only be used with WebServer!)
async function loadMp3(note) {
  try {
    const response = await fetch("https://tobiwern.github.io/NoteTrainer/audio/" + note.mp3);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    playTone(note); //fallback to oscillator if mp3 is not defined
    console.log('Error loading MP3:', error);
    return null;
  }
}

function playAllNotes(notes) {
  enableAudioContextIfRequired();
  let index = 0;
  function playNextNote() {
    if (index < notes.length) {
      const note = notes[index];
      displayNote(note);
      index++;
      setTimeout(playNextNote, 1000); // Wait for 1 second before playing the next note
    }
  }
  playNextNote();
}

function enableAudioContextIfRequired() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

/*----------------------- TONE DETECTION with neuronal network -------------------------------*/
//Based on https://github.com/marl/crepe
const confidenceRequested = 0.8;

function startToneDetection(){
  // If MIDI mode requested, initialize MIDI path, otherwise use model+microphone
  if (useMidiCheckbox.checked) {
    // No model required for MIDI input
    initMIDI().then(() => {
      if (!running) {
        running = true;
        initNoteStatistics();
        handleButtons(true);
        requestWakeLock();
        nextNote();
      }
      saveOptions();
    }).catch((err) => { error("MIDI init failed: " + err); });
  } else {
    loadModel().then(() => {
      if(!running){
        initAudio();
        initNoteStatistics();
        handleButtons(true);
        requestWakeLock();
        nextNote(); 
      }
      saveOptions();
    });
  }
}


function stopToneDetection() {
  running = false;
  // Stop any ongoing audio processing or event listeners here
  detachMIDI();
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
}

function initAudio() {
  enableAudioContextIfRequired()
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        handleAudio(stream);
      })
      .catch(function(err) {
        error('Auf Mikrofon kann nicht zugegriffen werden - ' + err);
      });
  } else if (navigator.getUserMedia) {
    navigator.getUserMedia({ audio: true },
      function(stream) {
        handleAudio(stream);
      },
      function(err) {
        error('Auf Mikrofon kann nicht zugegriffen werden - ' + err);
      });
  } else {
    error('getUserMedia wird von diesem Browser nicht unterstützt. Bitte benutzen sie Chrome oder Firefox.');
  }
}

function handleAudio(stream){
  status(getText("texts", "activating"));
  console.log('Audio context sample rate = ' + audioContext.sampleRate);
  const mic = audioContext.createMediaStreamSource(stream);
  // We need the buffer size that is a power of two and is longer than 1024 samples when resampled to 16000 Hz.
  // In most platforms where the sample rate is 44.1 kHz or 48 kHz, this will be 4096, giving 10-12 updates/sec.
  const minBufferSize = audioContext.sampleRate / 16000 * 1024;
  for (var bufferSize = 4; bufferSize < minBufferSize; bufferSize *= 2);
  console.log('Buffer size = ' + bufferSize);
  const scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
  scriptNode.onaudioprocess = process_microphone_buffer;
  // It seems necessary to connect the stream to a sink for the pipeline to work, contrary to documentataions.
  // As a workaround, here we create a gain node with zero gain, and connect temp to the system audio output.
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0, audioContext.currentTime);
  mic.connect(scriptNode);
  scriptNode.connect(gain);
  gain.connect(audioContext.destination);
  if (audioContext.state === 'running') {
    status(getText("texts", "starting"));
  }
}

async function loadModel() {
  if(!running){
    status(getText("texts", "loadingModel"));
//    model = await tf.loadModel('https://marl.github.io/crepe/model/model.json');
    model = await tf.loadModel('https://tobiwern.github.io/NoteTrainer/crepe/model/model.json');
    status(getText("texts", "modelLoaded"));
  }
}

var running = false;

// bin number -> cent value mapping
const cent_mapping = tf.add(tf.linspace(0, 7180, 360), tf.tensor(1997.3794084376191))

function process_microphone_buffer(event) {
  if (isTonePlaying || isMp3Playing || blockDetection) {return; } // Skip detection if a tone or MP3 is playing
  resample(event.inputBuffer, function(resampled) {
    tf.tidy(() => {
      running = true;
      // run the prediction on the model
      const frame = tf.tensor(resampled.slice(0, 1024));
      const zeromean = tf.sub(frame, tf.mean(frame));
      const framestd = tf.tensor(tf.norm(zeromean).dataSync()/Math.sqrt(1024));
      const normalized = tf.div(zeromean, framestd);
      const input = normalized.reshape([1, 1024]);
      const activation = model.predict([input]).reshape([360]);
      // the confidence of voicing activity and the argmax bin
      const confidence = activation.max().dataSync()[0];
      const center = activation.argMax().dataSync()[0];
      // slice the local neighborhood around the argmax bin
      const start = Math.max(0, center - 4);
      const end = Math.min(360, center + 5);
      const weights = activation.slice([start], [end - start]);
      const cents = cent_mapping.slice([start], [end - start]);
      // take the local weighted average to get the predicted detectedFrequency
      const products = tf.mul(weights, cents);
      const productSum = products.dataSync().reduce((a, b) => a + b, 0);
      const weightSum = weights.dataSync().reduce((a, b) => a + b, 0);
      const predicted_cent = productSum / weightSum;
      const predicted_hz = 10 * Math.pow(2, predicted_cent / 1200.0);
      //get amplitude
      const amplitude = getAmplitude(resampled);
//      console.log('Amplitude:', amplitude);
      //check if the detected note matches to the requested note 
      checkNote(predicted_hz, amplitude, confidence);
    });
  });
}

function getAmplitude(dataArray) {
  let sumSquares = 0.0;
  for (const amplitude of dataArray) {
    sumSquares += amplitude * amplitude;
  }
  return Math.sqrt(sumSquares / dataArray.length)*100;
}

// perform resampling the audio to 16000 Hz, on which the model is trained.
// setting a sample rate in AudioContext is not supported by most browsers at the moment.
function resample(audioBuffer, onComplete) {
  const interpolate = (audioBuffer.sampleRate % 16000 != 0);
  const multiplier = audioBuffer.sampleRate / 16000;
  const original = audioBuffer.getChannelData(0);
  const subsamples = new Float32Array(1024);
  for (var i = 0; i < 1024; i++) {
    if (!interpolate) {
      subsamples[i] = original[i * multiplier];
    } else {
      // simplistic, linear resampling
      var left = Math.floor(i * multiplier);
      var right = left + 1;
      var p = i * multiplier - left;
      subsamples[i] = (1 - p) * original[left] + p * original[right];
    }
  }
  onComplete(subsamples);
}

/*----------------------- TONE CHECKING -------------------------------*/
var correctNotePlayed = false;
var triedOnce = false;
var toneWeighted = false;
var decayTimeoutReached = false;
var toneNamePrevious = null;
var incorrectWhenSilence = false;

function checkNote(detectedFrequency, amplitude, confidence, forceImmediate = false) {
  if (currentNote) { //An intial note was proposed
    if ((confidence > confidenceRequested) && (amplitude > parseFloat(volumeThresholdInput.value))) { // Confidence and amplitude are high enough to consider the detected note
      const closestNote = getClosestNote(detectedFrequency);
      const targetFrequency = currentNote.frequency + parseInt(offsetInput.value); // Add offset
      const frequencyDifference = targetFrequency - detectedFrequency;
      const correct = Math.abs(frequencyDifference) < parseInt(toleranceInput.value); // Allow small tolerance
      if (correct) { //CORRECT
        handleCorrectNotePlayed();
        correctNotePlayed = true; //flag is needed in order to discard any wrong notes after a correct note
        toneNamePrevious = closestNote.name;
        if(incorrectWhenSilence){incorrectWhenSilence=false; debug("Resetting incorrect since correct note played without silence inbetween.");}
        proposeNextNoteWithPauseIfRequested();
      } else { //INCORRECT          
        if (!correctNotePlayed && ((closestNote.name != toneNamePrevious) || decayTimeoutReached)) { //if a tone was played correctly, discard any wrong notes after that. We enforce different proposed notes so will discard a previous note played again.
          incorrectWhenSilence = true; //flag to only count as incorrect if followed by silence
          handleIncorrectNotePlayed(closestNote, targetFrequency, detectedFrequency);
          // If caller requests immediate counting (e.g. MIDI), count incorrect now instead of waiting for silence
          if (forceImmediate) {
            accountIncorrectNotePlayed();
            incorrectWhenSilence = false; // avoid double-counting when silence later occurs
          }
        }
      }
      triedOnce = true;
    } else {
      if(!triedOnce){ //only show message to play note after a new note was proposed
        debug("Silence detected");  
        status("<span class='message-red'>" + getText("texts", "playNote") + (showNoteNameCheckbox.checked ? "</span>" + getText("texts", "desiredNote", {note: currentNote.name}) : "</span>"));
      }
      if(triedOnce && correctNotePlayed && pauseCheckbox.checked && pauseAutoRadio.checked){ //in auto pause mode only propose next note if correct note was played and silence reached
        debug("Silence detected after correct note played. Proposing next note.");
        nextNote();
      }  
      if(incorrectWhenSilence){
        accountIncorrectNotePlayed(); 
      } //case: incorrect => correct w/o silence inbetween should not be counted as incorrect
    }
  }
}

function handleIncorrectNotePlayed(closestNote, targetFrequency, detectedFrequency){
  if(pauseCheckbox.checked ){ //&& pauseTextFieldRadio.checked only if not auto (auto waits for silence to propose next note)
    status("<span class='message-red'>" + getText("texts", "incorrect", {note: closestNote.name}) + "</span>" + (showNoteNameCheckbox.checked ? getText("texts", "desiredNote", {note: currentNote.name}) : getText("texts", "tryAgain")));
    highlightNote(false); //since will always be red when playing with no pause
  // } else {
  //   status((showNoteNameCheckbox.checked ? getText("texts", "desiredNote", {note: currentNote.name}) : getText("texts", "tryAgain")));
  }
  showUpDownArrow(currentNote.name, closestNote.name, targetFrequency, detectedFrequency);
  drawGhostNote(closestNote);
}

function handleCorrectNotePlayed(){
  accountCorrectNotePlayed()
  status("<span class='message-green'>" + getText("texts", "correct", {note: currentNote.name}) + "</span>");
  highlightNote(true);
  hideUpDownArrow();
  hideGhostNote();
}

function accountCorrectNotePlayed(){
  if(!toneWeighted){//only weight a note once per proposed note
    debug("Counting " + currentNote.name + " as CORRECT note.");
    updateWeightedNoteNames(currentNote.name, "decrement");
    noteStatistics[currentNote.name].correct++;
  }
}

function accountIncorrectNotePlayed(){
  if(!toneWeighted){//only weight a note once per proposed note
    debug("Counting " + currentNote.name + " as INCORRECT since silence after incorrect note.");
    updateWeightedNoteNames(currentNote.name, "increment");
    noteStatistics[currentNote.name].incorrect++; 
  }
}

var pauseTimeout;
var blockDetection = false;
function proposeNextNoteWithPauseIfRequested(){
  if(pauseCheckbox.checked){ 
    if(pauseTextFieldRadio.checked){ //only if not auto (auto waits for silence to propose next note)
      blockDetection = true; // Block any detection until the pause is over
      clearTimeout(pauseTimeout); // Clear any existing timeout
      pauseTimeout = setTimeout(() => {
        nextNote(); // Suggest a new note after the pause - this is asynchroneous! - this loop will continue to spin - do we need to block any detection?
      }, parseInt(pauseInput.value));
    }
  } else {  
    nextNote(); // Suggest a new note with no pause
  }
}

function showUpDownArrow(noteName, closestNote, targetFrequency, detectedFrequency){
  hideUpDownArrow();
  const offset = (currentNote.position < clefSwitchPosition) && useBassClefCheckbox.checked ? 120 : 0;
  if(!showArrowsCheckbox.checked){return;}
  if (detectedFrequency < targetFrequency) {
    noteUp.style.display = "block";
    noteUp.style.bottom = `${currentNote.position + 20 + offset + offset_global + 12}px`;
  } else if (detectedFrequency > targetFrequency) {
    noteDown.style.display = "block";
    noteDown.style.bottom = `${currentNote.position - 20 + offset + offset_global + 12}px`;
  }
}

function hideUpDownArrow(){
  noteUp.style.display = "none";
  noteDown.style.display = "none";
}

function highlightNote(correct) {
  noteEllipse.setAttribute("fill", correct ? "green" : "red");
  changeSvgColor('sharp', correct ? "green" : "red");
  changeSvgColor('flat', correct ? "green" : "red"); 
  drawLedgerLines(currentNote, correct ? 'green' : 'red');
}

function changeSvgColor(elementId, color) {
  const svgElement = document.getElementById(elementId);
  const red = "invert(12%) sepia(78%) saturate(7499%) hue-rotate(4deg) brightness(114%) contrast(118%)";
  const green = "invert(17%) sepia(98%) saturate(5389%) hue-rotate(128deg) brightness(97%) contrast(105%)";
  const black = "invert(0%) sepia(27%) saturate(1794%) hue-rotate(2deg) brightness(80%) contrast(97%)";
  let colorNew;
  if(color == "green"){colorNew = green;} else if(color == "red"){colorNew = red;} else {colorNew = black;}
  if (svgElement && colorNew) {
    svgElement.style.filter = colorNew;
  }
}

function resetNoteColor() { //reset color to black
  noteEllipse.setAttribute("fill", "black"); // Reset note color after delay
  changeSvgColor('sharp', "black");
  changeSvgColor('flat', "black"); 
}

function getClosestNote(frequency) {
  let closestNote = notesSelected[0];
  let minDiff = Math.abs(frequency - closestNote.frequency);
  for (let i = 1; i < notesSelected.length; i++) {
    const diff = Math.abs(frequency - notesSelected[i].frequency);
    if (diff < minDiff) {
      closestNote = notesSelected[i];
      minDiff = diff;
    }
  }
  return closestNote;
}

function getNoteByName(noteName) { //not used
  for (let i = 0; i < notesSelected.length; i++) {
    if (notesSelected[i].name === noteName) {
      return notesSelected[i];
    }
  }
  return null; // Return null if no matching note is found
}

noteNamesWeighted = [];
function resetWeightedNoteNames(){
  noteNamesWeighted = notesFiltered.map(note => note.name); //get note names from list of notes
}

function updateWeightedNoteNames(noteName, type) {
  const noteCount = noteNamesWeighted.filter(item => item === noteName).length;
  if (type === "increment" && noteCount < 3) {
    noteNamesWeighted.push(noteName);
//    debug("updateWeightedNoteNames: " + noteName + " incremented, noteNameWeighted: " + noteNamesWeighted);
  } else if (type === "decrement" && noteCount > 1) {
    const index = noteNamesWeighted.findIndex(item => item === noteName);
    noteNamesWeighted.splice(index, 1);
//    debug("updateWeightedNoteNames: " + noteName + " decremented, noteNameWeighted: " + noteNamesWeighted);
  }
  toneWeighted = true; // Only weight a tone as correct/incorrect once per proposed note (gets reset with nextNote())
}

function getNextNote() {
  let noteNames = noteNamesWeighted;
  if(currentNote && notesFiltered.length > 1){noteNames = noteNames.filter(noteName => !noteName.includes(currentNote.name));} //don't use the same note
  const nextNoteName = noteNames[Math.floor(Math.random() * noteNames.length)]; //Randomize result
  const nextNote = notesFiltered.find(note => note.name === nextNoteName);
  if(!nextNote){debug("getNextNote: no more notes!");}
  return nextNote;
}

/*----------------------- STATISTICS -------------------------------*/
// Function to show the pop-up dialog with the pie chart
function showSummary() {
  const summaryHeading = document.getElementById('summaryHeading');
  summaryHeading.textContent = getText("summary", "summaryHeading");
  const correctNotes = Object.values(noteStatistics).reduce((sum, stats) => sum + stats.correct, 0);
  const incorrectNotes = Object.values(noteStatistics).reduce((sum, stats) => sum + stats.incorrect, 0);
  // Check if there are any correct or incorrect notes
  if (correctNotes === 0 && incorrectNotes === 0) {
    location.reload();
    return; // Do not show the dialog if there are no notes
  }
  const data = [
    { label: 'Correct', value: correctNotes },
    { label: 'Incorrect', value: incorrectNotes }
  ];
  const chartContainer = document.getElementById('chartContainer');
  chartContainer.innerHTML = ''; // Clear previous chart
  const canvas = document.createElement('canvas');
  chartContainer.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  data.forEach(item => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(100, 75); // Center of the pie chart
    ctx.arc(100, 75, 75, startAngle, startAngle + sliceAngle);
    startAngle += sliceAngle;
    ctx.closePath();
    ctx.fillStyle = item.label === 'Correct' ? 'green' : 'red';
    ctx.fill();
  });
  //summary message
  const summaryMessage = document.getElementById('summaryMessage');
  if(incorrectNotes){
    summaryMessage.innerHTML = getText("summary", "summaryMessage");
  } else {
    summaryMessage.innerHTML = getText("summary", "successMessage"); 
  }
  // Create ranked list of incorrectly played notes
  const rankedListContainer = document.getElementById('rankedListContainer');
  rankedListContainer.innerHTML = ''; // Clear previous list
  const rankedList = document.createElement('ul');
  const sortedNotes = Object.entries(noteStatistics)
    .filter(([name, stats]) => stats.incorrect > 0)
    .sort((a, b) => b[1].incorrect - a[1].incorrect);
  const top3IncorrectNotes = sortedNotes.slice(0, 3);
  top3IncorrectNotes.forEach(([name, stats]) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${name}`;
    rankedList.appendChild(listItem);
  });
  rankedListContainer.appendChild(rankedList);
  const closeButton = document.getElementById('closeButton');
  closeButton.textContent = getText("summary", "closeButton");
  document.getElementById('statisticsDialog').style.display = 'block';
}

// Event listener for the close button
document.getElementById('closeButton').addEventListener('click', () => {
  document.getElementById('statisticsDialog').style.display = 'none';
  location.reload();
});

/*----------------------- LANGUAGE -------------------------------*/

languageSelector.addEventListener('change', (event) => {
  setLanguage(event.target.value);
  if(running && stopButton.style.display == "block") {checkNote(null);} //to update message
  saveOptions();
  updateTexts(); // Update all texts based on the new language
});

function updateTexts() {
  //MAIN GUI
  document.title = getText('main', 'title');
  document.getElementById('title').textContent = getText('main', 'title');
  document.getElementById('instruction').innerHTML = getText('main', 'instruction');
  updateInstrument();
  startButton.textContent = getText("main", "startButton"); // Change button text to "Weiter"
  stopButton.textContent = getText("main", "stopButton"); // Change button text to "Stop"
  continueButton.textContent = getText("main", "continueButton"); // Change button text to "Weiter"
  //OPTIONS
  document.getElementById('optionsTitle').childNodes[0].textContent = getText('options', 'optionsTitle');
  document.getElementById('showNoteNameCheckboxLabel').childNodes[1].textContent = getText('options', 'showNoteNameCheckbox');
  document.getElementById('showNoteNameCheckboxLabel').title = getText('tooltips', 'showNoteNameCheckboxLabel');
  document.getElementById('showArrowsCheckboxLabel').childNodes[1].textContent = getText('options', 'showArrowsCheckbox');
  document.getElementById('showArrowsCheckboxLabel').title = getText('tooltips', 'showArrowsCheckboxLabel');
  document.getElementById('showGhostNoteCheckboxLabel').childNodes[1].textContent = getText('options', 'showGhostNoteCheckbox');
  document.getElementById('showGhostNoteCheckboxLabel').title = getText('tooltips', 'showGhostNoteCheckboxLabel');
  document.getElementById('playNoteCheckboxLabel').childNodes[1].textContent = getText('options', 'playNoteCheckbox');
  document.getElementById('playNoteCheckboxLabel').title = getText('tooltips', 'playNoteCheckboxLabel');
  document.getElementById('useBassClefCheckboxLabel').childNodes[1].textContent = getText('options', 'useBassClefCheckbox');
  document.getElementById('useBassClefCheckboxLabel').title = getText('tooltips', 'useBassClefCheckboxLabel');
  document.getElementById('showSummaryCheckboxLabel').childNodes[1].textContent = getText('options', 'showSummaryCheckbox');
  document.getElementById('showSummaryCheckboxLabel').title = getText('tooltips', 'showSummaryCheckboxLabel');
  document.getElementById('pauseCheckboxLabel').childNodes[1].textContent = getText('options', 'pauseInput');
  document.getElementById('pauseCheckboxLabel').title = getText('tooltips', 'pauseCheckboxLabel');
  document.getElementById('pauseAutoRadioLabel').childNodes[1].textContent = getText('options', 'pauseAutoRadio');
  document.getElementById('pauseAutoRadioLabel').title = getText('tooltips', 'pauseAutoRadioLabel');
  document.getElementById('pauseTextFieldRadioLabel').title = getText('tooltips', 'pauseTextFieldRadioLabel');
  document.getElementById('toneDetectionDiv').textContent = getText('options', 'toneDetection');
  document.getElementById('volumeThresholdInputLabel').childNodes[0].textContent = getText('options', 'volumeThresholdInput');
  document.getElementById('volumeThresholdInputLabel').title = getText('tooltips', 'volumeThresholdInputLabel');
  document.getElementById('toleranceInputLabel').childNodes[0].textContent = getText('options', 'toleranceInput');
  document.getElementById('toleranceInputLabel').title = getText('tooltips', 'toleranceInputLabel');
  document.getElementById('offsetInputLabel').childNodes[0].textContent = getText('options', 'offsetInput');
  document.getElementById('offsetInputLabel').title = getText('tooltips', 'offsetInputLabel');
  document.getElementById('smallRangeRadioLabel').childNodes[1].textContent = getText('options', 'smallRangeRadio');
  document.getElementById('smallRangeRadioLabel').title = getText('tooltips', 'smallRangeRadioLabel');
  document.getElementById('middleRangeRadioLabel').childNodes[1].textContent = getText('options', 'middleRangeRadio');
  document.getElementById('middleRangeRadioLabel').title = getText('tooltips', 'middleRangeRadioLabel');
  document.getElementById('largeRangeRadioLabel').childNodes[1].textContent = getText('options', 'largeRangeRadio');
  document.getElementById('largeRangeRadioLabel').title = getText('tooltips', 'largeRangeRadioLabel');
  document.getElementById('noteFilterCheckboxLabel').childNodes[1].textContent = getText('options', 'noteFilterCheckbox');
  document.getElementById('noteFilterCheckboxLabel').title = getText('tooltips', 'noteFilterCheckboxLabel');
  document.getElementById('showSharpCheckboxLabel').childNodes[1].textContent = getText('options', 'showSharpCheckbox');
  document.getElementById('showSharpCheckboxLabel').title = getText('tooltips', 'showSharpCheckboxLabel');
  document.getElementById('showFlatCheckboxLabel').childNodes[1].textContent = getText('options', 'showFlatCheckbox');
  document.getElementById('showFlatCheckboxLabel').title = getText('tooltips', 'showFlatCheckboxLabel');
  document.getElementById('languageSelectorLabel').textContent = getText('options', 'languageSelector');
  document.getElementById('instrumentTuningDiv').textContent = getText('options', 'instrumentTuning');
  document.getElementById('noteRangeHeadingDiv').textContent = getText('options', 'noteRange');
  document.getElementById('accidentalsDiv').textContent = getText('options', 'accidentals');
  initInstrumentSelector();
  //SUMMARY
  document.getElementById('summaryHeading').textContent = getText('summary', 'summaryHeading');
  document.getElementById('summaryMessage').textContent = getText('summary', 'summaryMessage');
  document.getElementById('closeButton').textContent = getText('summary', 'closeButton');
}

let currentLanguage = 'en'; // Default language is English

function setLanguage(language) {
  currentLanguage = language;
  updateTexts();
}

function getText(group, key, replacements = {}) {
  let text = texts[currentLanguage][group][key];
  for (const [placeholder, value] of Object.entries(replacements)) {
    text = text.replace(`{${placeholder}}`, value);
  }
  return text;
}

function initLanguageSelector() {
  const languages = Object.keys(texts);
  languages.forEach(language => {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = texts[language].prompt;
    languageSelector.appendChild(option);
  });
}

/*----------------------- Keep Screen turned on -------------------------------*/
let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release().then(() => {
      wakeLock = null;
    });
  }
}

/*----------------------- DEBUG (Note mp3) -------------------------------*/

noteIndex = 0;
document.getElementById("top").addEventListener('dblclick', () => {noteIndex=0;});
document.getElementById("top").addEventListener('click', () => {
  noteIndex--;
  if(noteIndex < 0){noteIndex = notesFiltered.length-1;}
  displayNote(notesFiltered[noteIndex]);}
);
document.getElementById("bot").addEventListener('click', () => {
  noteIndex++;
  if(noteIndex >= notesFiltered.length){noteIndex =0;}  
  displayNote(notesFiltered[noteIndex]);}
);

// ---------------- MIDI support --------------------
// Minimal, safe MIDI initialization + handlers.
// Attaches incoming MIDI NoteOn to playTone(...) and forwards frequency to existing checkNote(...) if available.
let midiAccess = null;
let midiInputs = [];

async function initMIDI() {
  if (!navigator.requestMIDIAccess) {
    throw new Error('Web MIDI API not supported in this browser.');
  }
  midiAccess = await navigator.requestMIDIAccess();
  onMIDISuccess(midiAccess);
  // listen for connection/disconnection events
  midiAccess.onstatechange = (e) => {
    onMIDISuccess(midiAccess);
  };
  return;
}

function onMIDISuccess(access) {
  // detach old listeners first
  detachMIDI();
  midiInputs = [];
  for (let input of access.inputs.values()) {
    midiInputs.push(input);
    try {
      input.onmidimessage = onMIDIMessage;
    } catch (err) {
      console.warn('Could not attach onmidimessage for input', input, err);
    }
  }
  if (midiInputs.length === 0) {
    debug('No MIDI inputs found.');
  } else {
    debug('MIDI inputs attached: ' + midiInputs.length);
  }
}

function detachMIDI() {
  if (!midiAccess) return;
  for (let input of midiInputs) {
    try { input.onmidimessage = null; } catch (_) {}
  }
  midiInputs = [];
}

// MIDI message handler: NoteOn => play incoming note and forward to checkNote
// Hilfsfunktion: MIDI-Nummer -> Notenname (z.B. 60 -> C4)
function midiNoteToName(n) {
    const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const name = names[n % 12];
    const octave = Math.floor(n / 12) - 1; // MIDI 60 => C4
    return name + octave;
}

// Ersetze die onMIDIMessage-Funktion durch die folgende async-Variante
async function onMIDIMessage(event) {
  // event.data = [status, data1, data2]
  const [status, data1, data2] = event.data;
  const command = status & 0xf0;
  // Note On (0x90) mit Velocity > 0
  if (command === 0x90 && data2 > 0) {
    const midiNoteNumber = data1;
    const velocity = data2;
    const frequency = 440 * Math.pow(2, (midiNoteNumber - 69) / 12);
    const noteName = midiNoteToName(midiNoteNumber);

    //// UI-Debugausgabe (sichtbar machen)
    //try {
      //const debugSpan = document.getElementById('debugMsg');
      //if (debugSpan) {
        //debugSpan.style.display = 'inline';
        //debugSpan.textContent = `MIDI: ${midiNoteNumber} ${noteName} freq=${frequency.toFixed(2)}Hz vel=${velocity}`;
      //}
      //const statusSpan = document.getElementById('status');
      //if (statusSpan) status.textContent = `Gespielte Note: ${noteName}`;
    //} catch (_) {}

    // Suche ein vorhandenes Sample in der aktuellen Notenliste (falls vorhanden)
    let sampleNote = null;
    try {
      // notesSelected sollte die aktuell verwendeten Noten enthalten
      if (Array.isArray(notesSelected)) {
        sampleNote = notesSelected.find(n => n.name === noteName) || null;
      }
    } catch (_) {
      sampleNote = null;
    }

    // Fallback: nächstgelegene Note (falls kein genaues Sample vorhanden)
    if (!sampleNote) {
      try {
        sampleNote = getClosestNote(frequency);
      } catch (_) {
        sampleNote = null;
      }
    }

    let playedBySample = false;

    // Wenn ein Sample-Objekt mit mp3-Feld existiert, lade & spiele das MP3 (ohne playNoteCheckbox zu beachten)
    if (sampleNote && sampleNote.mp3) {
      try {
        enableAudioContextIfRequired();
        // stoppe evtl. laufende Quelle
        if (currentSource) { try { currentSource.stop(); } catch(_){} currentSource = null; }
        const audioBuffer = await loadMp3(sampleNote); // loadMp3 gibt null zurück und spielt fallback, falls fehlerhaft
        if (audioBuffer) {
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start();
          isMp3Playing = true;
          source.onended = () => { currentSource = null; isMp3Playing = false; };
          currentSource = source;
          playedBySample = true;
        } else {
          playedBySample = false;
        }
      } catch (err) {
        console.warn('Fehler beim Abspielen des Sample-MP3:', err);
        playedBySample = false;
      }
    }

    // Falls kein Sample abgespielt wurde: sauberer Sine-Oszillator als Fallback
    if (!playedBySample) {
      try {
        enableAudioContextIfRequired();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency + parseInt(offsetInput?.value || 0), audioContext.currentTime);
        gain.gain.setValueAtTime(Math.max(0.03, velocity / 127), audioContext.currentTime);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        osc.stop(audioContext.currentTime + 0.6);
      } catch (err) {
        console.error('Oscillator fallback failed', err);
      }
    }

    // Weiterleiten an die Prüf-Logik (checkNote) mit angepasster Amplitude-Skalierung (0..100)
    if (typeof checkNote === 'function') {
      try {
        const amplitudeForCheck = (velocity / 127) * 100; // scale to same range as microphone amplitude
        // forceImmediate=true so MIDI inputs get scored immediately (no waiting for "silence")
        checkNote(frequency, amplitudeForCheck, 100.0, true);
      } catch (err) {
        console.warn('checkNote call failed for MIDI input', err);
      }
    } else {
      console.debug('checkNote nicht definiert — MIDI wird nicht geprüft.');
    }
  }
  // Note Off / NoteOn mit velocity=0 werden hier ignoriert
}

// ---------------- end MIDI support --------------------