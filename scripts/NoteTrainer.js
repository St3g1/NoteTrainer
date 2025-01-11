/*
 ToDo:
 - StartButton should be temporarily disabled until access to micro has been granted
 - No tone should be played until the micro dialog has been accepted (not technically...but from a user-interaction)
*/
 
/*--------- Last Settings  --------------------------*/
// Load saved options from localStorage
function loadOptions() {
  initLanguageSelector();
  showNoteNameCheckbox.checked = JSON.parse(localStorage.getItem("showNoteNameCheckbox")) || false;
  playNoteCheckbox.checked = JSON.parse(localStorage.getItem("playNoteCheckbox")) || false;
  useBassClefCheckbox.checked = JSON.parse(localStorage.getItem("useBassClefCheckbox")) || false;
  showSummaryCheckbox.checked = JSON.parse(localStorage.getItem("showSummaryCheckbox")) || false;
  pauseInput.value = localStorage.getItem("pauseInput") || "500";
  pauseInput.disabled = !pauseCheckbox.checked;
  pauseCheckbox.checked = JSON.parse(localStorage.getItem("pauseCheckbox")) || false;
  toleranceInput.value = localStorage.getItem("toleranceInput") || "5";
  languageSelector.value = localStorage.getItem("languageSelector") || currentLanguage;
  const selectedInstrument = localStorage.getItem("selectedInstrument") || "saxTenor";
  document.querySelector(`input[name="instrument"][value="${selectedInstrument}"]`).checked = true;
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

// Save options to localStorage
function saveOptions() {
  localStorage.setItem("showNoteNameCheckbox", JSON.stringify(showNoteNameCheckbox.checked));
  localStorage.setItem("playNoteCheckbox", JSON.stringify(playNoteCheckbox.checked));
  localStorage.setItem("useBassClefCheckbox", JSON.stringify(useBassClefCheckbox.checked));
  localStorage.setItem("showSummaryCheckbox", JSON.stringify(showSummaryCheckbox.checked));
  localStorage.setItem("pauseCheckbox", JSON.stringify(pauseCheckbox.checked));
  localStorage.setItem("pauseInput", pauseInput.value);
  localStorage.setItem("toleranceInput", toleranceInput.value);
  localStorage.setItem("languageSelector", languageSelector.value);
  localStorage.setItem("selectedInstrument", document.querySelector('input[name="instrument"]:checked').value);
  localStorage.setItem("selectedNoteRange", document.querySelector('input[name="noteRange"]:checked').value);
  localStorage.setItem("showSharpCheckbox", JSON.stringify(showSharpCheckbox.checked));
  localStorage.setItem("showFlatCheckbox", JSON.stringify(showFlatCheckbox.checked));
  localStorage.setItem("noteFilterCheckbox", JSON.stringify(noteFilterCheckbox.checked));
  localStorage.setItem("noteFilterInput", noteFilterInput.value);
}

//--------------- OBJECTS ------------------------------
const noteContainer = document.getElementById("noteContainer");
const noteElement = document.getElementById("note");
const clefTrebleElement = document.getElementById("clefTreble");
const clefBassElement = document.getElementById("clefBass");
const sharpElement = document.getElementById("sharp");
const flatElement = document.getElementById("flat");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const noteNameElement = document.getElementById("noteName");
const showNoteNameCheckbox = document.getElementById("showNoteNameCheckbox");
const playNoteCheckbox = document.getElementById("playNoteCheckbox");
const useBassClefCheckbox = document.getElementById("useBassClefCheckbox");
const showSummaryCheckbox = document.getElementById("showSummaryCheckbox");
const pauseCheckbox = document.getElementById("pauseCheckbox");
const pauseInput = document.getElementById("pauseInput");
const toleranceInput = document.getElementById("toleranceInput");
const languageSelector = document.getElementById("languageSelector");
const instrumentSaxTenorRadio = document.getElementById("instrumentSaxTenorRadio");
const instrumentSaxAltRadio = document.getElementById("instrumentSaxAltRadio");
const instrumentRegularRadio = document.getElementById("instrumentRegularRadio");
const smallRangeRadio = document.getElementById("smallRangeRadio");
const middleRangeRadio = document.getElementById("middleRangeRadio");
const largeRangeRadio = document.getElementById("largeRangeRadio");
const noteFilterCheckbox = document.getElementById("noteFilterCheckbox");    
const noteFilterInput = document.getElementById("noteFilterInput");  
const showSharpCheckbox = document.getElementById("showSharpCheckbox");
const showFlatCheckbox = document.getElementById("showFlatCheckbox");
const noteEllipse = document.getElementById("noteEllipse");
const burgerMenu = document.getElementById('burgerMenu');
const optionContainer = document.getElementById('optionContainer');
const instrumentImage = document.getElementById('instrumentImage');
const instruction = document.getElementById('instruction'); 

let currentNote = null;
let audioContext = null;
let model;

//--------------- EVENT LISTENERS ------------------------------
showNoteNameCheckbox.addEventListener('change', () => {
  noteNameElement.textContent = showNoteNameCheckbox.checked && currentNote ? currentNote.name : '';
  saveOptions();
  triedOnce = false; //in order to trigger update of message
  checkNote(null);
});
playNoteCheckbox.addEventListener('change', () => {
  saveOptions(); 
  playMp3(currentNote);
});
useBassClefCheckbox.addEventListener('change', () => {
  saveOptions(); 
  displayNote(currentNote);
});   
showSummaryCheckbox.addEventListener('change', () => { saveOptions(); });
pauseCheckbox.addEventListener('change', () => { pauseInput.disabled = !pauseCheckbox.checked; saveOptions(); });
pauseInput.addEventListener('change', () => { saveOptions();});
toleranceInput.addEventListener('change', () => { saveOptions(); });
instrumentSaxTenorRadio.addEventListener('change', () => { setSelectedNotes(); setFilteredNotes(); initNoteStatistics(); resetWeightedNoteNames(); updateInstrument(); playMp3(currentNote); saveOptions(); nextNote();});
instrumentSaxAltRadio.addEventListener('change', () => { setSelectedNotes(); setFilteredNotes(); initNoteStatistics(); resetWeightedNoteNames(); updateInstrument(); playMp3(currentNote); saveOptions(); nextNote();});
instrumentRegularRadio.addEventListener('change', () => { setSelectedNotes(); setFilteredNotes(); initNoteStatistics(); resetWeightedNoteNames(); updateInstrument(); playMp3(currentNote); saveOptions(); nextNote();});
showSharpCheckbox.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
showFlatCheckbox.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
smallRangeRadio.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
middleRangeRadio.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
largeRangeRadio.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote(); });
noteFilterCheckbox.addEventListener('change', () => { noteFilterInput.disabled = !noteFilterCheckbox.checked; saveOptions(); setFilteredNotes(); resetWeightedNoteNames(); nextNote();}); 
noteFilterInput.addEventListener('change', () => { saveOptions(); setFilteredNotes(); resetWeightedNoteNames();}); 
burgerMenu.addEventListener('click', () => {optionContainer.classList.toggle('active'); updateTexts();});
document.addEventListener('click', (event) => { //close option dialog if clicked outside
  if (!optionContainer.contains(event.target) && !burgerMenu.contains(event.target)) {
    optionContainer.classList.remove('active');
  }
});
instrumentImage.addEventListener('dblclick', () => {playAllNotes(notesFiltered);});
startButton.addEventListener("click", () => {startToneDetection(); });
stopButton.addEventListener("click", () => {
  stopToneDetection();
  handleButtons();
  if(showSummaryCheckbox.checked){
    showSummary();
  } else {
    location.reload();
  }
});

function setOptionEnableState(state){ //no longer in use
  showNoteNameCheckbox.disabled = !state;
  playNoteCheckbox.disabled = !state;
  useBassClefCheckbox.disabled = !state;
  showSummaryCheckbox.disabled = !state;
  toleranceInput.disabled = !state;
  pauseCheckbox.disabled = !state;
  pauseInput.disabled = !state;
  instrumentSaxTenorRadio.disabled = !state;
  instrumentSaxAltRadio.disabled = !state;
  instrumentRegularRadio.disabled = !state;
  smallRangeRadio.disabled = !state;
  middleRangeRadio.disabled = !state;
  largeRangeRadio.disabled = !state;
  showSharpCheckbox.disabled = !state;
  showFlatCheckbox.disabled = !state;
  noteFilterCheckbox.disabled = !state;
}

function handleButtons(force = false) {
  if(running || force) {
    startButton.textContent = getText("main", "continue"); // Change button text to "Weiter"
    startButton.style.backgroundColor = "gray"; // Change button color to gray
    stopButton.style.display = "block";
  } else {
    startButton.textContent = getText("main", "startButton"); // Change button text to "Start"
    startButton.style.backgroundColor = "green"; // Change button color to gray
    stopButton.style.display = "none";
  }  
}

function updateInstrument() {
  instruction.style.visibility = 'visible'; 
  instruction.style.opacity = '1';
  const instrumentName = document.getElementById('instrumentName');
  if (instrumentSaxTenorRadio.checked) {
    instrumentImage.src = 'images/saxTenor.png';
    instrumentName.innerHTML = getText("options", "instrumentSaxTenorRadio"); 
  } else if (instrumentSaxAltRadio.checked) {
    instrumentImage.src = 'images/saxAlt.png';
    instrumentName.innerHTML = getText("options", "instrumentSaxAltRadio"); 
  } else {
    instrumentImage.src = 'images/piano.png';
    instrumentName.innerHTML = getText("options", "instrumentRegularRadio"); 
  }
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

function debug(text) {
  document.getElementById('debugMsg').style.display = 'block';
  document.getElementById('debugMsg').innerHTML = document.getElementById('debugMsg').innerHTML + "<br>=============================<br>" + text;
}

//--------------- NOTE SELECTION ------------------------------
var notesSelected = []; 

function setSelectedNotes() {   
  notesSelected = getSelectedNotes();
}

function getSelectedNotes() {//pick notes based on instrument (different tuning)
  let notes;
  if (instrumentSaxTenorRadio.checked) {
    notes = allNotes_sax_tenor;
  } else if (instrumentSaxAltRadio.checked) {
    notes = allNotes_sax_alt;
  } else {
    notes = allNotes_regular;
  }  
  return notes;
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
    notes = notes.filter(note => note.position >= -70 && note.position <= 210);
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
    }
  }
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
  noteEllipse.setAttribute("fill", "black"); // Reset note color after delay
  triedOnce = false;
  decayTimeoutReached = false; // Reset decay timeout flag
  setTimeout(() => {decayTimeoutReached = true;}, 3000); // Set decay timeout to 3 seconds, until the previous note is detected as incorrect
  toneWeighted = false; //Only weight a tone as correct/incorrect once per proposed note
  correctNotePlayed = false; // Reset the flag for the next note
  currentNote = getNextNote();
  displayNote(currentNote);
  noteContainer.className = "staff"; // Reset staff color
}

//--------------- NOTE DRAWING ------------------------------
let clefSwitchPosition = 0; //threshold to switch between treble and bass clef based on position of note
let offset_global = -60; //using svg for flat and sharp somehow requires a different handling. Used in drawAccidental

// Display the note on the staff
function displayNote(note) {
  drawClef(note);
  drawNote(note);
  drawLedgerLines(note);
  drawNoteName(note);
  drawAccidental(note);
  playMp3(note);
//  setStemDirection(note.position);
}

function drawClef(note){
  if((note.position < clefSwitchPosition) && useBassClefCheckbox.checked){
    clefTrebleElement.style.display = "none";
    clefBassElement.style.display = "block";
  } else {
    clefTrebleElement.style.display = "block";
    clefBassElement.style.display = "none";
  }
}

function drawNote(note){
  noteElement.style.display = 'block'; // Show the note
  const offset = (note.position < clefSwitchPosition) && useBassClefCheckbox.checked ? 120 : 0;
  noteElement.style.bottom = `${note.position+offset+offset_global}px`; // Position dynamically
}

function drawNoteName(note){
  noteNameElement.textContent = showNoteNameCheckbox.checked ? note.name : ''; // Display or hide note name
}

function drawAccidental(note){ //Vorzeichen
  const offset = (note.position < clefSwitchPosition) && useBassClefCheckbox.checked ? 120 : 0;
  sharpElement.style.display = 'none'; //hide 
  flatElement.style.display = 'none'; //hide
  if (note.name.includes('#')) {
    sharpElement.style.display = 'block'; 
    sharpElement.style.top = `${-(note.position + offset + offset_global -47)}px`; // Adjust position for accidental
  } else if (note.name.includes('b') || note.name.includes('B')) {
    flatElement.style.display = 'block';
    flatElement.style.top = `${-(note.position + offset + offset_global - 40)}px`; // Adjust position for accidental
  }        
}

// Draw ledger lines for notes outside the staff
function drawLedgerLines(note) {
  const ledgerLines = document.querySelectorAll('.ledger-line');
  ledgerLines.forEach(line => line.remove());
  const offset = (note.position < clefSwitchPosition) && useBassClefCheckbox.checked ? 120 : 0;
  const position = note.position + offset;
  if (position > 100 || position < 10) {
    const numLines = position > 100 ? Math.abs(Math.ceil((100-position) / 20)) : Math.abs(Math.ceil(position / 20))+1;
    for (let i = 0; i < numLines; i++) {
      const line = document.createElement('div');
      line.className = 'ledger-line';
      line.style.bottom = `${(position > 100 ? offset_global + 140 + (i * 20) : offset_global + 20 - (i * 20)) - 2}px`;
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
function playTone(note) {
  if (currentOscillator) {
    currentOscillator.stop();
    currentOscillator = null;
  }
  oscillator = audioContext.createOscillator();
  oscillator.type = 'sawtooth'; // You can change the type to 'square', 'sine', 'sawtooth', 'triangle'
  oscillator.frequency.setValueAtTime(note.frequency, audioContext.currentTime);
  oscillator.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1); // Play the note for 1 second
  currentOscillator = oscillator; // Update the current oscillator
}

let currentSource = null; // Variable to keep track of the currently playing source
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
    // Add an event listener for the 'ended' event
    source.onended = () => {currentSource = null;};
    currentSource = source; // Update the current source
  } catch (error) {
    console.log('Error playing MP3:', error);
  }
}

// Load the audio file for the given note (can only be used with WebServer!)
async function loadMp3(note) {
  try {
    const response = await fetch("audio/" + note.mp3);
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
var confidenceRequested = 0.8

function startToneDetection(){
  loadModel().then(() => {
    if(!running){
      initAudio();
      initNoteStatistics();
      handleButtons(true);
    }
    nextNote();
    saveOptions();
  });
}

function stopToneDetection() {
  running = false;
  // Stop any ongoing audio processing or event listeners here
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
    model = await tf.loadModel('https://marl.github.io/crepe/model/model.json');
    status(getText("texts", "modelLoaded"));
  }
}

var running = false;

// bin number -> cent value mapping
const cent_mapping = tf.add(tf.linspace(0, 7180, 360), tf.tensor(1997.3794084376191))

function process_microphone_buffer(event) {
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
      //check if the detected note matches to the requested note 
      checkNote((confidence > confidenceRequested) ? predicted_hz : null);
    });
  });
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
var silence = false;
var correctNotePlayed = false;
var pauseTimeout;
var triedOnce = false;
var toneWeighted = false;
var decayTimeoutReached = false;
var toneNamePrevious = null;
function checkNote(detectedFrequency) {
  if (currentNote) {
    if (detectedFrequency) {
      const closestNoteName = getClosestNoteName(detectedFrequency);
      const targetFrequency = currentNote.frequency;
      const frequencyDifference = targetFrequency - detectedFrequency;
      const correct = Math.abs(frequencyDifference) < parseInt(toleranceInput.value); // Allow small tolerance
      if (correct) { //CORRECT
        if(!toneWeighted){
          updateWeightedNoteNames(currentNote.name, "decrement");
          noteStatistics[currentNote.name].correct++;
        }
        correctNotePlayed = true; 
        status("<span class='message-green'>" + getText("texts", "correct", {note: closestNoteName}) + "</span>");
        highlightNote(true);
        toneNamePrevious = currentNote.name;
        if(pauseCheckbox.checked){
          clearTimeout(pauseTimeout); // Clear any existing timeout
          pauseTimeout = setTimeout(() => {
            nextNote(); // Suggest a new note after the pause
          }, parseInt(pauseInput.value));
        } else {  
          nextNote(); // Suggest a new note with no pause
        }
      } else { //INCORRECT          
        if (!correctNotePlayed && ((closestNoteName != toneNamePrevious) || decayTimeoutReached)) { //if a tone was played correctly, discard any wrong notes after that. We enforce different proposed notes so will discard a previous note played again.
          if(closestNoteName === currentNote.name){sign(frequencyDifference) === 1 ? closestNoteName = closestNoteName + "+" : closestNoteName = "-" + closestNoteName;} 
          status("<span class='message-red'>" + getText("texts", "incorrect", {note: closestNoteName}) + "</span>" + (showNoteNameCheckbox.checked ? getText("texts", "desiredNote", {note: currentNote.name}) : getText("texts", "tryAgain")));
          if(!toneWeighted){
            updateWeightedNoteNames(currentNote.name, "increment");
            noteStatistics[currentNote.name].incorrect++;
          }
          highlightNote(false);
        }
      }
      triedOnce = true;
      silence = false;
    } else {
      if(!triedOnce){
        status("<span class='message-red'>" + getText("texts", "playNote") + (showNoteNameCheckbox.checked ? "</span>" + getText("texts", "desiredNote", {note: currentNote.name}) : "</span>"));
      }  
      silence = true; // triggers a new checking interval
    }
  }
}

function highlightNote(correct) {
  noteEllipse.setAttribute("fill", correct ? "green" : "red");
}

function getClosestNoteName(frequency) {
  let closestNote = notesSelected[0];
  let minDiff = Math.abs(frequency - closestNote.frequency);
  for (let i = 1; i < notesSelected.length; i++) {
    const diff = Math.abs(frequency - notesSelected[i].frequency);
    if (diff < minDiff) {
      closestNote = notesSelected[i];
      minDiff = diff;
    }
  }
  return closestNote.name;
}

noteNamesWeighted = [];
function resetWeightedNoteNames(){
  noteNamesWeighted = notesFiltered.map(note => note.name); //get note names from list of notes
}

function updateWeightedNoteNames(noteName, type) {
  const noteCount = noteNamesWeighted.filter(item => item === noteName).length;
  if (type === "increment" && noteCount < 3) {
    noteNamesWeighted.push(noteName);
  } else if (type === "decrement" && noteCount > 1) {
    const index = noteNamesWeighted.findIndex(item => item === noteName);
    noteNamesWeighted.splice(index, 1);
  }
  toneWeighted = true; // Only weight a tone as correct/incorrect once per proposed note (gets reset with nextNote())
}

function getNextNote() {
  let noteNames = noteNamesWeighted;
  if(currentNote && noteNames.length > 1){noteNames = noteNames.filter(noteName => !noteName.includes(currentNote.name));} //don't use the same note
  const nextNoteName = noteNames[Math.floor(Math.random() * noteNames.length)]; //Randomize result
  const nextNote = notesFiltered.find(note => note.name === nextNoteName);
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

document.getElementById('languageSelector').addEventListener('change', (event) => {
  setLanguage(event.target.value);
  if(running) {checkNote(null);} //to update message
  saveOptions();
  updateTexts(); // Update all texts based on the new language
});

function updateTexts() {
  //MAIN GUI
  document.getElementById('title').textContent = getText('main', 'title');
  document.getElementById('instruction').innerHTML = getText('main', 'instruction'); //, { instrument: document.getElementById('instrumentName').textContent });
  updateInstrument();
  handleButtons();
  //OPTIONS
  document.getElementById('optionsTitle').childNodes[0].textContent = getText('options', 'optionsTitle');
  document.getElementById('showNoteNameCheckboxLabel').childNodes[1].textContent = getText('options', 'showNoteNameCheckbox');
  document.getElementById('showNoteNameCheckboxLabel').title = getText('tooltips', 'showNoteNameCheckboxLabel');
  document.getElementById('playNoteCheckboxLabel').childNodes[1].textContent = getText('options', 'playNoteCheckbox');
  document.getElementById('playNoteCheckboxLabel').title = getText('tooltips', 'playNoteCheckboxLabel');
  document.getElementById('useBassClefCheckboxLabel').childNodes[1].textContent = getText('options', 'useBassClefCheckbox');
  document.getElementById('useBassClefCheckboxLabel').title = getText('tooltips', 'useBassClefCheckboxLabel');
  document.getElementById('showSummaryCheckboxLabel').childNodes[1].textContent = getText('options', 'showSummaryCheckbox');
  document.getElementById('showSummaryCheckboxLabel').title = getText('tooltips', 'showSummaryCheckboxLabel');
  document.getElementById('pauseCheckboxLabel').childNodes[1].textContent = getText('options', 'pauseInput');
  document.getElementById('pauseCheckboxLabel').title = getText('tooltips', 'pauseCheckboxLabel');
  document.getElementById('toleranceInputLabel').childNodes[0].textContent = getText('options', 'toleranceInput');
  document.getElementById('toleranceInputLabel').title = getText('tooltips', 'toleranceInputLabel');
  document.getElementById('instrumentSaxTenorRadioLabel').childNodes[1].textContent = getText('options', 'instrumentSaxTenorRadio');
  document.getElementById('instrumentSaxTenorRadioLabel').title = getText('tooltips', 'instrumentSaxTenorRadioLabel');
  document.getElementById('instrumentSaxAltRadioLabel').childNodes[1].textContent = getText('options', 'instrumentSaxAltRadio');
  document.getElementById('instrumentSaxAltRadioLabel').title = getText('tooltips', 'instrumentSaxAltRadioLabel');
  document.getElementById('instrumentRegularRadioLabel').childNodes[1].textContent = getText('options', 'instrumentRegularRadio');
  document.getElementById('instrumentRegularRadioLabel').title = getText('tooltips', 'instrumentRegularRadioLabel');
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
  //SUMMARY
  document.getElementById('summaryHeading').textContent = getText('summary', 'summaryHeading');
  document.getElementById('summaryMessage').textContent = getText('summary', 'summaryMessage');
  document.getElementById('closeButton').textContent = getText('summary', 'closeButton');
}

let currentLanguage = 'en'; // Default language is German

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
