const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/telegram_game', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const playerSchema = new mongoose.Schema({
    telegramId: Number,
    name: String,
    gold: { type: Number, default: 0 },
    upgrades: { type: Array, default: [] },
    goldPerHour: { type: Number, default: 0 },
});

const Player = mongoose.model('Player', playerSchema);

app.post('/api/player', async (req, res) => {
    const { telegramId, name } = req.body;

    let player = await Player.findOne({ telegramId });
    if (!player) {
        player = new Player({ telegramId, name });
        await player.save();
    }

    res.json(player);
});

app.get('/api/player/:telegramId', async (req, res) => {
    const { telegramId } = req.params;

    let player = await Player.findOne({ telegramId });
    if (!player) {
        return res.status(404).send('Player not found');
    }

    res.json(player);
});

app.put('/api/player/:telegramId', async (req, res) => {
    const { telegramId } = req.params;
    const { gold, upgrades, goldPerHour } = req.body;

    let player = await Player.findOne({ telegramId });
    if (!player) {
        return res.status(404).send('Player not found');
    }

    player.gold = gold;
    player.upgrades = upgrades;
    player.goldPerHour = goldPerHour;
    await player.save();

    res.json(player);
});

const upgrades = [
    { "name": "Upgrade 1", "costs": [50, 75, 100, 125, 150], "image": "upgrade1.png", "damageIncrease": 10 },
    { "name": "Upgrade 2", "costs": [75, 100, 125, 150, 175], "image": "upgrade2.png" },
    { "name": "Upgrade 3", "costs": [100, 125, 150, 175, 200], "image": "upgrade3.png" },
    { "name": "Upgrade 4", "costs": [125, 150, 175, 200, 225], "image": "upgrade4.png" },
    { "name": "Upgrade 5", "costs": [150, 175, 200, 225, 250], "image": "upgrade5.png" }
    // Add more upgrades as needed
];

function getUpgradesData() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(JSON.stringify(upgrades));
        }, 1000);
    });
}

app.get('/api/upgrades', (req, res) => {
    res.json(upgradesData);
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});