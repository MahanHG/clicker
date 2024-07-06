require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectToDatabase, User } = require('./database');
const bot = require('./telegramBot');

const app = express();
app.use(cors());
app.use(express.json());

connectToDatabase();

app.post('/save', async (req, res) => {
  try {
    const { telegramId, data } = req.body;
    await User.findOneAndUpdate({ telegramId }, data, { upsert: true });
    res.status(200).send('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Error saving data');
  }
});

app.get('/load/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (user) {
      res.json(user);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).send('Error loading data');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});