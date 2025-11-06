// Lightweight QuizManager - pure JS class, no external deps
export class QuizManager {
  constructor(data = [], {shuffle=false, perQuestionTime=0} = {}) {
    this.raw = Array.isArray(data) ? data.slice() : [];
    this.settings = {shuffle, perQuestionTime};
    this.reset();
    if (this.settings.shuffle) this.shuffleQuestions();
  }

  reset(){
    this.questions = this.raw.slice();
    this.index = 0;
    this.score = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.history = []; // {qIndex, chosen, correct}
  }

  shuffleQuestions(){
    for (let i = this.raw.length -1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [this.raw[i], this.raw[j]] = [this.raw[j], this.raw[i]];
    }
    this.questions = this.raw.slice();
  }

  get length(){ return this.questions.length; }
  get current(){ return this.questions[this.index]; }

  answer(choiceIndex){
    const q = this.current;
    const correct = q.correct;
    const isCorrect = choiceIndex === correct;
    if (isCorrect) { this.score += (q.score||1); this.correctCount++; }
    else this.wrongCount++;
    this.history.push({index:this.index, chosen:choiceIndex, correct});
    return {isCorrect, correctIndex: correct};
  }

  canNext(){ return this.index < this.questions.length - 1; }
  next(){ if (this.canNext()) this.index++; return this.current; }
  prev(){ if (this.index>0) this.index--; return this.current; }
  progress(){ return Math.round(((this.index+1)/this.length)*100); }
}
