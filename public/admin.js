const ADMIN_PASSWORD = 'Naukasuper123';

async function api(path, opts) {
  const res = await fetch('/api' + path, opts);
  return res.json();
}

// Login UI elements
const loginContainer = document.getElementById('loginContainer');
const content = document.getElementById('content');
const header = document.getElementById('header');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const logoutBtn = document.getElementById('logoutBtn');
const darkToggle2 = document.getElementById('darkToggle2');

// Check if already logged in
function checkLogin() {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    showAdminPanel();
  } else {
    showLoginScreen();
  }
}

function showLoginScreen() {
  loginContainer.style.display = 'flex';
  content.style.display = 'none';
  header.style.display = 'none';
}

function showAdminPanel() {
  loginContainer.style.display = 'none';
  content.style.display = 'block';
  header.style.display = 'flex';
}

loginBtn.onclick = () => {
  const pwd = passwordInput.value;
  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    errorMsg.textContent = '';
    showAdminPanel();
    passwordInput.value = '';
    initAdminPanel();
  } else {
    errorMsg.textContent = 'Nieprawidłowe hasło!';
    passwordInput.value = '';
  }
};

passwordInput.onkeypress = (e) => {
  if (e.key === 'Enter') loginBtn.click();
};

logoutBtn.onclick = () => {
  sessionStorage.removeItem('adminLoggedIn');
  showLoginScreen();
  errorMsg.textContent = '';
};

// Dark mode
darkToggle2.onclick = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('dark', document.body.classList.contains('dark'));
};

if (localStorage.getItem('dark') === 'true') document.body.classList.add('dark');

// Admin Panel Logic
const createSubjectBtn = document.getElementById('createSubjectBtn');
const newSubjectName = document.getElementById('newSubjectName');
const selectSubjectForTest = document.getElementById('selectSubjectForTest');
const createTestBtn = document.getElementById('createTestBtn');
const newTestName = document.getElementById('newTestName');

const selectSubjectForQuestion = document.getElementById('selectSubjectForQuestion');
const selectTestForQuestion = document.getElementById('selectTestForQuestion');
const questionType = document.getElementById('questionType');
const questionText = document.getElementById('questionText');
const mcqOptionsInputs = document.getElementById('mcqOptionsInputs');
const mcqOptInputs = () => Array.from(document.querySelectorAll('.mcqOpt'));
const mcqCorrect = document.getElementById('mcqCorrect');
const tfCorrectInputs = document.getElementById('tfCorrectInputs');
const createQuestionBtn = document.getElementById('createQuestionBtn');

const selectSubjectForDelete = document.getElementById('selectSubjectForDelete');
const deleteSubjectBtn = document.getElementById('deleteSubjectBtn');
const selectSubjectForTestDelete = document.getElementById('selectSubjectForTestDelete');
const selectTestForDelete = document.getElementById('selectTestForDelete');
const deleteTestBtn = document.getElementById('deleteTestBtn');
const selectSubjectForQuestionDelete = document.getElementById('selectSubjectForQuestionDelete');
const selectTestForQuestionDelete = document.getElementById('selectTestForQuestionDelete');
const selectQuestionForDelete = document.getElementById('selectQuestionForDelete');
const deleteQuestionBtn = document.getElementById('deleteQuestionBtn');

function refreshAdminSubjectSelects() {
  api('/subjects').then(subs => {
    [selectSubjectForTest, selectSubjectForQuestion].forEach(sel => {
      sel.innerHTML = '';
      subs.forEach(s => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.name; sel.appendChild(o); });
    });
    onSubjectForQuestionChange();
  });
}

function refreshDeleteSelects() {
  api('/subjects').then(subs => {
    [selectSubjectForDelete, selectSubjectForTestDelete, selectSubjectForQuestionDelete].forEach(sel => {
      sel.innerHTML = '';
      subs.forEach(s => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.name; sel.appendChild(o); });
      // set first option selected if present
      if (sel.options.length > 0) sel.selectedIndex = 0;
    });
    // trigger onchange chains to populate dependent selects
    if (typeof selectSubjectForTestDelete.onchange === 'function') selectSubjectForTestDelete.onchange();
    if (typeof selectSubjectForQuestionDelete.onchange === 'function') selectSubjectForQuestionDelete.onchange();
  });
}

async function onSubjectForQuestionChange() {
  const sid = selectSubjectForQuestion.value;
  if (!sid) return;
  const tests = await api(`/subjects/${sid}/tests`);
  selectTestForQuestion.innerHTML = '';
  tests.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; selectTestForQuestion.appendChild(o); });
}

selectSubjectForQuestion.onchange = onSubjectForQuestionChange;

questionType.onchange = () => {
  if (questionType.value === 'mcq') { mcqOptionsInputs.style.display = 'block'; tfCorrectInputs.style.display = 'none'; }
  else { mcqOptionsInputs.style.display = 'none'; tfCorrectInputs.style.display = 'block'; }
};

createSubjectBtn.onclick = async () => {
  const name = newSubjectName.value.trim(); if (!name) return alert('Podaj nazwę');
  await api('/subjects', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
  newSubjectName.value = '';
  refreshAdminSubjectSelects();
  refreshDeleteSelects();
  alert('Przedmiot dodany!');
};

createTestBtn.onclick = async () => {
  const name = newTestName.value.trim(); const subjectId = selectSubjectForTest.value; if (!name || !subjectId) return alert('Wypełnij pola');
  await api(`/subjects/${subjectId}/tests`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
  newTestName.value = '';
  refreshAdminSubjectSelects();
  refreshDeleteSelects();
  alert('Sprawdzian dodany!');
};

createQuestionBtn.onclick = async () => {
  const testId = selectTestForQuestion.value; if (!testId) return alert('Wybierz test');
  const type = questionType.value; const text = questionText.value.trim(); if (!text) return alert('Podaj treść pytania');
  if (type === 'mcq') {
    const options = mcqOptInputs().map(i=>i.value.trim()).filter(Boolean);
    const correctIdx = mcqCorrect.value;
    if (options.length < 3) return alert('Podaj wszystkie 3 opcje');
    if (!correctIdx && correctIdx !== '0') return alert('Wybierz poprawną odpowiedź');
    const correctText = options[parseInt(correctIdx)];
    await api(`/tests/${testId}/questions`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'mcq', text, options, correct: correctText }) });
  } else {
    const tf = document.querySelector('input[name="tfCorrect"]:checked'); if (!tf) return alert('Wybierz poprawną odpowiedź');
    const correct = tf.value === 'true';
    await api(`/tests/${testId}/questions`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'tf', text, correct }) });
  }
  questionText.value = ''; mcqOptInputs().forEach(i => i.value=''); mcqCorrect.value = ''; document.querySelectorAll('input[name="tfCorrect"]').forEach(i => i.checked=false);
  await onSubjectForQuestionChange();
  alert('Pytanie dodane!');
};

selectSubjectForTestDelete.onchange = async () => {
  const sid = selectSubjectForTestDelete.value;
  selectTestForDelete.innerHTML = '';
  if (!sid) return;
  const tests = await api(`/subjects/${sid}/tests`);
  tests.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; selectTestForDelete.appendChild(o); });
};

selectSubjectForQuestionDelete.onchange = async () => {
  const sid = selectSubjectForQuestionDelete.value;
  console.log('subjectForQuestionDelete changed ->', sid);
  selectTestForQuestionDelete.innerHTML = '';
  selectQuestionForDelete.innerHTML = '';
  if (!sid) {
    const o = document.createElement('option'); o.value = ''; o.textContent = '-- wybierz przedmiot --'; selectTestForQuestionDelete.appendChild(o);
    return;
  }
  const tests = await api(`/subjects/${sid}/tests`);
  if (!tests || tests.length === 0) {
    const o = document.createElement('option'); o.value = ''; o.textContent = '-- brak sprawdzianów --'; selectTestForQuestionDelete.appendChild(o);
    return;
  }
  tests.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; selectTestForQuestionDelete.appendChild(o); });
  selectTestForQuestionDelete.selectedIndex = 0;
  // populate questions for the first test
  if (typeof selectTestForQuestionDelete.onchange === 'function') selectTestForQuestionDelete.onchange();
};

selectTestForQuestionDelete.onchange = async () => {
  const testId = selectTestForQuestionDelete.value;
  console.log('testForQuestionDelete changed ->', testId);
  selectQuestionForDelete.innerHTML = '';
  if (!testId) {
    const o = document.createElement('option'); o.value = ''; o.textContent = '-- wybierz sprawdzian --'; selectQuestionForDelete.appendChild(o);
    return;
  }
  const test = await api(`/tests/${testId}`);
  if (!test || !Array.isArray(test.questions) || test.questions.length === 0) {
    const o = document.createElement('option'); o.value = ''; o.textContent = '-- brak pytań --'; selectQuestionForDelete.appendChild(o);
    return;
  }
  test.questions.forEach(q => { const o = document.createElement('option'); o.value = q.id; o.textContent = q.text.substring(0,40)+'...'; selectQuestionForDelete.appendChild(o); });
  selectQuestionForDelete.selectedIndex = 0;
};

deleteSubjectBtn.onclick = async () => {
  const subjectId = selectSubjectForDelete.value;
  console.log('deleteSubject requested ->', subjectId);
  if (!subjectId) return alert('Wybierz przedmiot');
  if (!confirm('Usunąć przedmiot i wszystkie jego sprawdziany? Ta operacja nie może być cofnięta.')) return;
  try {
    const res = await api(`/subjects/${subjectId}`, { method:'DELETE' });
    if (res && res.success) {
      refreshAdminSubjectSelects();
      refreshDeleteSelects();
      alert('Przedmiot usunięty!');
    } else {
      console.error('Delete subject failed', res);
      alert('Nie udało się usunąć przedmiotu. Sprawdź konsolę.');
    }
  } catch (err) {
    console.error('Error deleting subject', err);
    alert('Błąd podczas usuwania przedmiotu. Sprawdź konsolę.');
  }
};

deleteTestBtn.onclick = async () => {
  const subjectId = selectSubjectForTestDelete.value;
  const testId = selectTestForDelete.value;
  console.log('deleteTest requested ->', { subjectId, testId });
  if (!subjectId || !testId) return alert('Wybierz przedmiot i sprawdzian');
  if (!confirm('Usunąć sprawdzian i wszystkie jego pytania? Ta operacja nie może być cofnięta.')) return;
  try {
    const res = await api(`/subjects/${subjectId}/tests/${testId}`, { method:'DELETE' });
    if (res && res.success) {
      refreshAdminSubjectSelects();
      refreshDeleteSelects();
      if (typeof selectSubjectForTestDelete.onchange === 'function') selectSubjectForTestDelete.onchange();
      alert('Sprawdzian usunięty!');
    } else {
      console.error('Delete test failed', res);
      alert('Nie udało się usunąć sprawdzianu. Sprawdź konsolę.');
    }
  } catch (err) {
    console.error('Error deleting test', err);
    alert('Błąd podczas usuwania sprawdzianu. Sprawdź konsolę.');
  }
};

deleteQuestionBtn.onclick = async () => {
  const testId = selectTestForQuestionDelete.value;
  const questionId = selectQuestionForDelete.value;
  console.log('deleteQuestion requested', { testId, questionId });
  if (!testId || !questionId) return alert('Wybierz sprawdzian i pytanie');
  if (!confirm('Usunąć to pytanie? Ta operacja nie może być cofnięta.')) return;
  // Double-check that the selected question belongs to the selected test
  const test = await api(`/tests/${testId}`);
  if (!test || !Array.isArray(test.questions) || !test.questions.find(q => q.id === questionId)) {
    return alert('Wybrane pytanie nie należy do tego sprawdzianu. Odśwież stronę i spróbuj ponownie.');
  }
  await api(`/tests/${testId}/questions/${questionId}`, { method:'DELETE' });
  refreshAdminSubjectSelects();
  refreshDeleteSelects();
  // ensure selects reflect current data
  if (typeof selectTestForQuestionDelete.onchange === 'function') selectTestForQuestionDelete.onchange();
  alert('Pytanie usunięte!');
};

function initAdminPanel() {
  refreshAdminSubjectSelects();
  refreshDeleteSelects();
}

// Check login on page load
checkLogin();
