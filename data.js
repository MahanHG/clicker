const playerData = {
    'user123': { gold: 200, upgrades: [], level: 1 } // Added level property
    // Add more players as needed
};

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

function getPlayerData(userId) {
    return new Promise((resolve, reject) => {
        const data = playerData[userId];
        if (data) {
            resolve(data);
        } else {
            reject(new Error('Player not found'));
        }
    });
}

function updatePlayerGold(userId, newGoldAmount) {
    return new Promise((resolve, reject) => {
        const data = playerData[userId];
        if (data) {
            data.gold = newGoldAmount;
            resolve(data);
        } else {
            reject(new Error('Player not found'));
        }
    });
}

function getPlayerLevel(userId) {
    const data = playerData[userId];
    return data ? data.level : 1;
}
