async function api(path, opts) {
  const res = await fetch('/api' + path, opts);
  return res.json();
}

const subjectsEl = document.getElementById('subjects');
const testsEl = document.getElementById('tests');
const contentEl = document.getElementById('content');

let currentSubject = null;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadSubjects() {
  const subs = await api('/subjects');
  subjectsEl.innerHTML = '';
  subs.forEach(s => {
    const b = document.createElement('button');
    b.textContent = s.name;
    b.className = 'tab-btn';
    b.onclick = () => selectSubject(s.id, b);
    subjectsEl.appendChild(b);
  });
}

async function selectSubject(id, btn) {
  Array.from(subjectsEl.children).forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  currentSubject = id;
  const tests = await api(`/subjects/${id}/tests`);
  testsEl.innerHTML = '';
  tests.forEach(t => {
    const b = document.createElement('button');
    b.textContent = t.name;
    b.className = 'tab-btn';
    b.onclick = () => loadTest(t.id);
    testsEl.appendChild(b);
  });
  contentEl.innerHTML = '';
}

// single-question flow
let session = null; // { test, questions, index, correctCount }

async function loadTest(testId) {
  const test = await api(`/tests/${testId}`);
  const questions = shuffle(test.questions);
  session = { test, questions, index: 0, correctCount: 0 };
  renderCurrentQuestion();
}

function clearChildren(el) { while (el.firstChild) el.removeChild(el.firstChild); }

function renderCurrentQuestion() {
  if (!session) return;
  const { test, questions, index } = session;
  if (index >= questions.length) return renderSummary();

  const q = questions[index];
  clearChildren(contentEl);
  const title = document.createElement('h2'); title.textContent = test.name; contentEl.appendChild(title);

  const qBox = document.createElement('div'); qBox.className = 'question';
  const p = document.createElement('div'); p.textContent = `( ${index + 1} / ${questions.length} ) ` + q.text; qBox.appendChild(p);

  const opts = document.createElement('div'); opts.className = 'options';

  let answered = false;

  function handleSelection(btn, value) {
    if (answered) return;
    answered = true;
    // disable all buttons
    Array.from(opts.children).forEach(ch => { ch.disabled = true; ch.classList.add('disabled'); });

    let isCorrect = false;
    if (q.type === 'tf') {
      isCorrect = (value === q.correct);
    } else {
      isCorrect = (value === q.correct);
    }

    if (isCorrect) {
      btn.classList.add('correct');
      session.correctCount++;
    } else {
      btn.classList.add('wrong');
      // highlight correct
      Array.from(opts.children).forEach(ch => {
        if (ch.dataset.value === String(q.correct) || (q.type === 'tf' && ((q.correct === true && ch.textContent === 'Tak') || (q.correct === false && ch.textContent === 'Nie')))) {
          ch.classList.add('correct');
        }
      });
    }

    // show Next button
    const next = document.createElement('button'); next.className = 'btn';
    next.textContent = (session.index + 1 < session.questions.length) ? 'Dalej' : 'Zakończ';
    next.style.marginTop = '12px';
    next.onclick = () => { session.index++; if (session.index < session.questions.length) renderCurrentQuestion(); else renderSummary(); };
    contentEl.appendChild(next);
  }

  if (q.type === 'tf') {
    ['Tak','Nie'].forEach(v => {
      const btn = document.createElement('button'); btn.className = 'tab-btn opt'; btn.textContent = v; btn.dataset.value = (v === 'Tak');
      btn.onclick = () => handleSelection(btn, v === 'Tak');
      opts.appendChild(btn);
    });
  } else if (q.type === 'mcq') {
    // Grid layout: 2x2 for 4 options, column for 3 options
    if (q.options.length === 3) {
      opts.className = 'options mcq-grid-col';
    } else {
      opts.className = 'options mcq-grid';
    }
    q.options.forEach(opt => {
      const btn = document.createElement('button'); btn.className = 'tab-btn opt'; btn.textContent = opt; btn.dataset.value = opt;
      btn.onclick = () => handleSelection(btn, opt);
      opts.appendChild(btn);
    });
  }

  qBox.appendChild(opts);
  contentEl.appendChild(qBox);
}

function renderSummary() {
  clearChildren(contentEl);
  const h = document.createElement('h2'); h.textContent = session.test.name + ' - Wynik'; contentEl.appendChild(h);
  const p = document.createElement('div'); p.textContent = `Poprawne: ${session.correctCount} / ${session.questions.length}`; p.style.marginTop = '8px'; contentEl.appendChild(p);
  const restart = document.createElement('button'); restart.className = 'btn'; restart.textContent = 'Uruchom ponownie test'; restart.style.marginTop = '12px';
  restart.onclick = () => { session.index = 0; session.correctCount = 0; session.questions = shuffle(session.test.questions); renderCurrentQuestion(); };
  contentEl.appendChild(restart);
}

loadSubjects();

// --- Dark mode and Admin UI ---
const darkToggle = document.getElementById('darkToggle');
const adminToggle = document.getElementById('adminToggle');
const adminEl = document.getElementById('admin');
darkToggle.onclick = () => { document.body.classList.toggle('dark'); localStorage.setItem('dark', document.body.classList.contains('dark')); };
if (localStorage.getItem('dark') === 'true') document.body.classList.add('dark');
