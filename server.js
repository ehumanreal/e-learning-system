const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');

// Helper functions for new folder structure
function getSubjectDir(subjectId) {
  return path.join(DATA_DIR, subjectId);
}

function getTestFile(subjectId, testId) {
  return path.join(getSubjectDir(subjectId), `test-${testId}.json`);
}

function loadSubjectIndex(subjectId) {
  const indexFile = path.join(getSubjectDir(subjectId), 'index.json');
  if (fs.existsSync(indexFile)) {
    const raw = fs.readFileSync(indexFile, 'utf8');
    return JSON.parse(raw);
  }
  return null;
}

function loadTest(subjectId, testId) {
  const testFile = getTestFile(subjectId, testId);
  if (fs.existsSync(testFile)) {
    const raw = fs.readFileSync(testFile, 'utf8');
    return JSON.parse(raw);
  }
  return null;
}

function saveTest(subjectId, testId, data) {
  const testFile = getTestFile(subjectId, testId);
  fs.writeFileSync(testFile, JSON.stringify(data, null, 2), 'utf8');
}

function getAllSubjects() {
  const subjects = [];
  if (!fs.existsSync(DATA_DIR)) return subjects;
  const items = fs.readdirSync(DATA_DIR);
  for (const item of items) {
    const itemPath = path.join(DATA_DIR, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const subjectIndex = loadSubjectIndex(item);
      if (subjectIndex) {
        subjects.push(subjectIndex);
      }
    }
  }
  return subjects;
}

function getSubjectTests(subjectId) {
  const tests = [];
  const subjectDir = getSubjectDir(subjectId);
  if (!fs.existsSync(subjectDir)) return tests;
  const files = fs.readdirSync(subjectDir);
  for (const file of files) {
    if (file.startsWith('test-') && file.endsWith('.json')) {
      const testId = file.slice(5, -5); // remove 'test-' and '.json'
      const test = loadTest(subjectId, testId);
      if (test) {
        tests.push({ id: test.id, name: test.name });
      }
    }
  }
  return tests;
}

// GET all subjects or POST new subject
app.route('/api/subjects')
  .get((req, res) => {
    const subjects = getAllSubjects();
    res.json(subjects.map(s => ({ id: s.id, name: s.name })));
  })
  .post((req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const makeId = n => (n.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,''));
    const id = makeId(name);
    const subjectDir = getSubjectDir(id);
    if (!fs.existsSync(subjectDir)) {
      fs.mkdirSync(subjectDir, { recursive: true });
    }
    const subject = { id, name };
    const indexFile = path.join(subjectDir, 'index.json');
    fs.writeFileSync(indexFile, JSON.stringify(subject, null, 2), 'utf8');
    res.json(subject);
  });

app.get('/api/subjects/:subjectId/tests', (req, res) => {
  const tests = getSubjectTests(req.params.subjectId);
  if (tests === undefined) return res.status(404).json({ error: 'Not found' });
  res.json(tests);
});

app.get('/api/tests/:testId', (req, res) => {
  // We need to find which subject this test belongs to
  const subjects = getAllSubjects();
  for (const subject of subjects) {
    const test = loadTest(subject.id, req.params.testId);
    if (test) return res.json(test);
  }
  res.status(404).json({ error: 'Test not found' });
});

app.post('/api/submit', (req, res) => {
  const { testId, answers } = req.body;
  const subjects = getAllSubjects();
  let found = null;
  let subjectId = null;
  for (const subject of subjects) {
    const test = loadTest(subject.id, testId);
    if (test) {
      found = test;
      subjectId = subject.id;
      break;
    }
  }
  if (!found) return res.status(404).json({ error: 'Test not found' });

  let correct = 0;
  for (const q of found.questions) {
    const given = answers[q.id];
    if (q.type === 'tf') {
      if ((given === true || given === 'true') && q.correct === true) correct++;
      if ((given === false || given === 'false') && q.correct === false) correct++;
    } else if (q.type === 'mcq') {
      if (given === q.correct) correct++;
    }
  }
  res.json({ total: found.questions.length, correct });
});

// ADMIN: create a test in a subject
app.post('/api/subjects/:subjectId/tests', (req, res) => {
  const { name } = req.body;
  const subjectDir = getSubjectDir(req.params.subjectId);
  const subjectIndex = loadSubjectIndex(req.params.subjectId);
  if (!subjectIndex) return res.status(404).json({ error: 'Subject not found' });
  
  const makeId = n => (n.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,''));
  const id = makeId(name);
  const test = { id, name, questions: [] };
  saveTest(req.params.subjectId, id, test);
  res.json(test);
});

// ADMIN: create question in a test
app.post('/api/tests/:testId/questions', (req, res) => {
  const { type, text, options, correct } = req.body;
  if (!type || !text) return res.status(400).json({ error: 'type and text required' });
  
  const subjects = getAllSubjects();
  let foundSubjectId = null;
  let foundTest = null;
  
  for (const subject of subjects) {
    const test = loadTest(subject.id, req.params.testId);
    if (test) {
      foundSubjectId = subject.id;
      foundTest = test;
      break;
    }
  }
  
  if (!foundTest) return res.status(404).json({ error: 'Test not found' });
  
  const makeId = n => ('q-' + Date.now().toString().slice(-6));
  const q = { id: makeId(text), type, text };
  if (type === 'mcq') { 
    q.options = Array.isArray(options) ? options : (options ? [options] : []);
    q.correct = correct;
  }
  if (type === 'tf') { 
    q.correct = (correct === true || correct === 'true');
  }
  foundTest.questions.push(q);
  saveTest(foundSubjectId, req.params.testId, foundTest);
  res.json(q);
});
// DELETE endpoints
app.delete('/api/subjects/:subjectId', (req, res) => {
  const subjectDir = getSubjectDir(req.params.subjectId);
  if (!fs.existsSync(subjectDir)) {
    return res.status(404).json({ error: 'Subject not found' });
  }
  fs.rmSync(subjectDir, { recursive: true });
  res.json({ success: true });
});

app.delete('/api/subjects/:subjectId/tests/:testId', (req, res) => {
  const testFile = getTestFile(req.params.subjectId, req.params.testId);
  if (!fs.existsSync(testFile)) {
    return res.status(404).json({ error: 'Test not found' });
  }
  fs.unlinkSync(testFile);
  res.json({ success: true });
});

app.delete('/api/tests/:testId/questions/:questionId', (req, res) => {
  const subjects = getAllSubjects();
  for (const subject of subjects) {
    const test = loadTest(subject.id, req.params.testId);
    if (test) {
      const qIdx = test.questions.findIndex(q => q.id === req.params.questionId);
      if (qIdx === -1) return res.status(404).json({ error: 'Question not found' });
      test.questions.splice(qIdx, 1);
      saveTest(subject.id, req.params.testId, test);
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: 'Test not found' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
