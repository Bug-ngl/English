// admin page that edits questions.json client-side and allows download/save
const editor = document.getElementById('editor');
const loadSample = document.getElementById('load-sample');
const saveLocal = document.getElementById('save-local');
const download = document.getElementById('download');

const SAMPLE = JSON.stringify([
  {
    "question":"Which sentence is grammatically correct?",
    "answers":["He go to school.","He goes to school.","He going to school.","He gone to school."],
    "correct":1,
    "difficulty":"easy"
  },
  {
    "question":"Choose the past form of 'teach'.",
    "answers":["teached","taught","teach","took"],
    "correct":1,
    "difficulty":"medium"
  }
], null, 2);

function loadFromRemote(){
  fetch('assets/data/questions.json').then(r=>r.text()).then(txt=>{
    editor.value = txt;
  }).catch(_=>{ editor.value = SAMPLE; });
}
loadSample.addEventListener('click', ()=> editor.value = SAMPLE);
saveLocal.addEventListener('click', ()=>{
  try{
    const parsed = JSON.parse(editor.value);
    localStorage.setItem('quiz.questions', JSON.stringify(parsed));
    alert('Saved to localStorage as quiz.questions');
  }catch(e){ alert('Invalid JSON: ' + e.message) }
});
download.addEventListener('click', ()=>{
  try{
    const parsed = JSON.parse(editor.value);
    const blob = new Blob([JSON.stringify(parsed, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='questions.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(e){ alert('Invalid JSON: ' + e.message) }
});

// load from localStorage or remote on start
const local = localStorage.getItem('quiz.questions');
if (local){ editor.value = JSON.stringify(JSON.parse(local), null, 2); }
else loadFromRemote();
