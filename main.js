import {QuizManager} from './quizManager.js';

// App-level state
let manager;
let selectedIndex = null;
let timerInterval = null;
let timeLeft = 0;

// DOM
const el = {
  question: document.getElementById('question'),
  answers: document.getElementById('answers'),
  nextBtn: document.getElementById('next-btn'),
  prevBtn: document.getElementById('prev-btn'),
  skipBtn: document.getElementById('skip-btn'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  score: document.getElementById('score'),
  correct: document.getElementById('correct'),
  wrong: document.getElementById('wrong'),
  feedback: document.getElementById('feedback'),
  timer: document.getElementById('timer'),
  difficulty: document.getElementById('difficulty'),
  restartBtn: document.getElementById('restart-btn'),
  downloadJson: document.getElementById('download-json')
};

// Utilities
function formatTime(s){
  if (!s) return '--:--';
  const mm = Math.floor(s/60).toString().padStart(2,'0');
  const ss = (s%60).toString().padStart(2,'0');
  return `${mm}:${ss}`;
}

function loadData(){
  return fetch('assets/data/questions.json').then(r=>r.json());
}

async function boot(){
  const data = await loadData();
  manager = new QuizManager(data, {shuffle: true, perQuestionTime: 195});
  render();
  attachEvents();
}

function render() {
  const q = manager.current;
  el.question.textContent = q.question;
  el.difficulty.textContent = 'Difficulty: ' + (q.difficulty || 'medium');
  el.answers.innerHTML = '';

  // Không shuffle nữa — giữ nguyên chỉ mục đúng trong JSON
  manager.currentShuffledCorrect = q.correct;

  q.answers.forEach((text, i) => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.dataset.index = i;

    // Không hiện A/B/C/D, chỉ hiện nội dung
    li.innerHTML = `<span class="txt">${text}</span>`;

    li.addEventListener('click', () => choose(i));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') choose(i);
    });

    el.answers.appendChild(li);
  });

  updateProgress();
  selectedIndex = null;
  el.nextBtn.disabled = true;
  el.prevBtn.disabled = manager.index === 0;
  el.feedback.textContent = '';
  startTimer(manager.settings.perQuestionTime);
}


function choose(i){
  if (selectedIndex !== null) return; // already answered
  selectedIndex = i;
  const outcome = manager.answer(i);
  // mark UI
  const items = el.answers.querySelectorAll('li');
  items.forEach((li, idx)=>{
    li.classList.remove('selected','correct','wrong');
    if (idx === i) li.classList.add('selected');
    if (idx === outcome.correctIndex) li.classList.add('correct');
    if (idx === i && !outcome.isCorrect) li.classList.add('wrong');
  });
  // update stats
  el.score.textContent = manager.score;
  el.correct.textContent = manager.correctCount;
  el.wrong.textContent = manager.wrongCount;
  el.feedback.textContent = outcome.isCorrect ? 'Đúng 🎉' : 'Ngu quá sai rồi';
  el.feedback.innerHTML = outcome.isCorrect ? `<iframe src="https://giphy.com/embed/ia0sMsvTBUQYb59SjK" width="480" height="269" style="" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/meme-brainrot-clearbox88-ia0sMsvTBUQYb59SjK">via GIPHY</a></p>` : `<iframe src="https://giphy.com/embed/wrmVCNbpOyqgJ9zQTn" width="480" height="480" style="" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/CyberKongz-loading-thought-low-iq-wrmVCNbpOyqgJ9zQTn">via GIPHY</a></p>`;
  el.nextBtn.disabled = false;
  stopTimer();
}

function updateProgress(){
  el.progressFill.style.width = manager.progress() + '%';
  el.progressText.textContent = `Question ${manager.index+1} / ${manager.length}`;
}

function gotoNext(){
  if (manager.canNext()){
    manager.next();
    render();
  } else {
    showResults();
  }
}

function gotoPrev(){
  manager.prev();
  render();
}

function skip(){
  manager.history.push({index:manager.index, chosen:null, skipped:true});
  gotoNext();
}

function showResults(){
  const percent = Math.round((manager.score / manager.length) * 100);
  document.getElementById('app').innerHTML = `
    <section class="panel">
      <h2>Final results</h2>
      <p>Your score: <strong>${manager.score}</strong> (${percent}%)</p>
      <p>Correct: ${manager.correctCount} • Wrong: ${manager.wrongCount}</p>
      <div class="panel-block"><button id="play-again" class="btn primary">Restart</button> </div>
      <h3>Question breakdown</h3>
      <ol>${manager.history.map(h=>{
        const q = manager.questions[h.index];
        const chosen = h.chosen==null ? '<em>skipped</em>' : q.answers[h.chosen];
        const correct = q.answers[q.correct];
        return `<li><strong>${q.question}</strong><div>Chosen: ${chosen} — Correct: ${correct}</div></li>`;
      }).join('')}</ol>
    </section>
  `;
  document.getElementById('play-again').addEventListener('click', ()=>location.reload());
  document.getElementById('export-json').addEventListener('click', ()=>downloadSession());
}

function downloadSession(){
  const payload = {
    timestamp: new Date().toISOString(),
    score: manager.score,
    length: manager.length,
    history: manager.history,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'quiz-session.json'; document.body.appendChild(a); a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Timer helpers
function startTimer(seconds){
  stopTimer();
  if (!seconds || seconds<=0){ el.timer.textContent = ''; return; }
  timeLeft = seconds;
  el.timer.textContent = formatTime(timeLeft);
  timerInterval = setInterval(()=>{
    timeLeft--;
    el.timer.textContent = formatTime(timeLeft);
    if (timeLeft<=0){
      stopTimer();
      el.feedback.textContent = 'Time up — moving to next question';
      // mark as skipped
      manager.history.push({index:manager.index, chosen:null, timedout:true});
      setTimeout(()=>{ if (manager.canNext()) gotoNext(); else showResults(); }, 800);
    }
  }, 1000);
}
function stopTimer(){ if (timerInterval) clearInterval(timerInterval); timerInterval = null; }

// Events
function attachEvents(){
  el.nextBtn.addEventListener('click', gotoNext);
  el.prevBtn.addEventListener('click', gotoPrev);
  el.skipBtn.addEventListener('click', skip);
  el.restartBtn.addEventListener('click', ()=>location.reload());
  el.downloadJson.addEventListener('click', ()=>{ // grab questions and download
    fetch('assets/data/questions.json').then(r=>r.blob()).then(blob=>{
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='questions.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });
  });

  // keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if (e.key >= '1' && e.key <= '9'){
      const idx = parseInt(e.key,10)-1;
      const items = el.answers.querySelectorAll('li');
      if (items[idx]) items[idx].click();
    } else if (e.key === 'Enter'){ if (!el.nextBtn.disabled) el.nextBtn.click(); }
  });

  // theme toggle
  const themeToggle = document.getElementById('toggle-theme');
  themeToggle.addEventListener('click', ()=>{
    const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
  });
}

// Boot app
document.addEventListener('DOMContentLoaded', boot);
