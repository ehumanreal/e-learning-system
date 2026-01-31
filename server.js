const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'questions.json');

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// GET all subjects or POST new subject
app.route('/api/subjects')
  .get((req, res) => {
    const data = readData();
    res.json(data.subjects.map(s => ({ id: s.id, name: s.name })));
  })
  .post((req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const data = readData();
    const makeId = n => (n.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'') + '-' + Date.now().toString().slice(-4));
    const id = makeId(name);
    const subject = { id, name, tests: [] };
    data.subjects.push(subject);
    writeData(data);
    res.json(subject);
  });

app.get('/api/subjects/:subjectId/tests', (req, res) => {
  const data = readData();
  const subject = data.subjects.find(s => s.id === req.params.subjectId);
  if (!subject) return res.status(404).json({ error: 'Not found' });
  res.json(subject.tests.map(t => ({ id: t.id, name: t.name })));
});

app.get('/api/tests/:testId', (req, res) => {
  const data = readData();
  for (const s of data.subjects) {
    const test = s.tests.find(t => t.id === req.params.testId);
    if (test) return res.json(test);
  }
  res.status(404).json({ error: 'Test not found' });
});

app.post('/api/submit', (req, res) => {
  const { testId, answers } = req.body;
  const data = readData();
  let found;
  for (const s of data.subjects) {
    const t = s.tests.find(t => t.id === testId);
    if (t) { found = t; break; }
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
  const data = readData();
  const subject = data.subjects.find(s => s.id === req.params.subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  const makeId = n => (n.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'') + '-' + Date.now().toString().slice(-4));
  const id = makeId(name);
  const test = { id, name, questions: [] };
  subject.tests.push(test);
  writeData(data);
  res.json(test);
});

// ADMIN: create question in a test
app.post('/api/tests/:testId/questions', (req, res) => {
  const { type, text, options, correct } = req.body;
  if (!type || !text) return res.status(400).json({ error: 'type and text required' });
  const data = readData();
  let foundTest = null;
  for (const s of data.subjects) {
    const t = s.tests.find(tt => tt.id === req.params.testId);
    if (t) { foundTest = t; break; }
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
  writeData(data);
  res.json(q);
})
// DELETE endpoints
app.delete('/api/subjects/:subjectId', (req, res) => {
  const data = readData();
  const idx = data.subjects.findIndex(s => s.id === req.params.subjectId);
  if (idx === -1) return res.status(404).json({ error: 'Subject not found' });
  data.subjects.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

app.delete('/api/subjects/:subjectId/tests/:testId', (req, res) => {
  const data = readData();
  const subject = data.subjects.find(s => s.id === req.params.subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  const testIdx = subject.tests.findIndex(t => t.id === req.params.testId);
  if (testIdx === -1) return res.status(404).json({ error: 'Test not found' });
  subject.tests.splice(testIdx, 1);
  writeData(data);
  res.json({ success: true });
});

app.delete('/api/tests/:testId/questions/:questionId', (req, res) => {
  const data = readData();
  for (const s of data.subjects) {
    const test = s.tests.find(t => t.id === req.params.testId);
    if (test) {
      const qIdx = test.questions.findIndex(q => q.id === req.params.questionId);
      if (qIdx === -1) return res.status(404).json({ error: 'Question not found' });
      test.questions.splice(qIdx, 1);
      writeData(data);
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: 'Test not found' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
