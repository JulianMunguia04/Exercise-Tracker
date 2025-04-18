const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let users = [];
let exercises = [];

const findUserById = (id) => users.find(user => user._id === id);
const generateId = () => Math.random().toString(36).substring(2, 9);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const newUser = {
    username,
    _id: generateId()
  };
  
  users.push(newUser);
  res.json(newUser);
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  let { description, duration, date } = req.body;
  

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }
  
  const user = findUserById(_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const exerciseDate = date ? new Date(date) : new Date();
  
  if (isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  
  const newExercise = {
    userId: _id,
    description,
    duration: parseInt(duration),
    date: exerciseDate
  };
  
  exercises.push(newExercise);
  
  res.json({
    _id: user._id,
    username: user.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date.toDateString()
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  
  const user = findUserById(_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  let userExercises = exercises.filter(ex => ex.userId === _id);
  
  if (from) {
    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: 'Invalid from date' });
    }
    userExercises = userExercises.filter(ex => ex.date >= fromDate);
  }
  
  if (to) {
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid to date' });
    }
    userExercises = userExercises.filter(ex => ex.date <= toDate);
  }
  
  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum)) {
      return res.status(400).json({ error: 'Limit must be a number' });
    }
    userExercises = userExercises.slice(0, limitNum);
  }
  
  const log = userExercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date.toDateString()
  }));
  
  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});