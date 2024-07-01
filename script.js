document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand(); // Expand the Web App to full view
        console.log(tg.initDataUnsafe); // Log init data to see user info
    }

    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-button');
    let gold = 0;
    let enemyHP = 100;
    let timer = 30;
    let level = 1;
    let isTimerRunning = false;
    let intervalId;
    let attackDamage = 10; // Base attack damage
    const telegramId = tg.initDataUnsafe.user.id;
    const name = tg.initDataUnsafe.user.first_name;

    async function fetchPlayerData(telegramId) {
        try {
            const response = await fetch(`/api/player/${telegramId}`);
            if (!response.ok) {
                throw new Error('Player not found, creating new player.');
            }
            const data = await response.json();
            gold = data.gold;
            level = data.level;
            updateUI();
        } catch (error) {
            console.error('Error fetching player data:', error);
            await createPlayer(telegramId, name);
        }
    }

    async function createPlayer(telegramId, name) {
        try {
            const response = await fetch('/api/player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegramId, name }),
            });
            const data = await response.json();
            gold = data.gold;
            level = data.level;
            updateUI();
        } catch (error) {
            console.error('Error creating player:', error);
        }
    }

    async function savePlayerData(telegramId, gold, level, upgrades, goldPerHour) {
        try {
            const response = await fetch(`/api/player/${telegramId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gold, level, upgrades, goldPerHour }),
            });
            const data = await response.json();
            gold = data.gold;
            level = data.level;
            updateUI();
        } catch (error) {
            console.error('Error saving player data:', error);
        }
    }

    async function fetchUpgradeData() {
        try {
            const response = await fetch('/api/upgrades');
            const data = await response.json();
            displayUpgrades(data);
        } catch (error) {
            console.error('Failed to fetch upgrade data:', error);
            alert('Failed to fetch upgrade data. Please try again later.');
        }
    }
    
    function initializeGame() {
        loadInitialAnimations();
        fetchUpgradeData();
        fetchPlayerData(telegramId);
    }

    function displayUpgrades(data) {
        const upgradesContainer = document.getElementById('upgrades');
        upgradesContainer.innerHTML = '';
    
        data.forEach(upgrade => {
            const upgradeElement = createUpgradeElement(upgrade);
            upgradesContainer.appendChild(upgradeElement);
        });
    }

    function createUpgradeElement(upgrade) {
        const upgradeElement = document.createElement('div');
        upgradeElement.classList.add('upgrade-item');

        const imageElement = document.createElement('img');
        imageElement.src = `assets/animations/upgrades/${upgrade.image}`;
        imageElement.addEventListener('click', () => {
            let currentLevel = level;
            let currentCost = upgrade.costs[currentLevel - 1];
            
            if (gold >= currentCost) {
                gold -= currentCost;
                savePlayerData(telegramId, gold, level, [], 0); // You may need to update the params as needed
                level++;
                updateUI();

                if (upgrade.name === 'Upgrade 1') { // Check if this is Upgrade 1
                    increaseAttackDamage(upgrade.damageIncrease);
                }

                // Update the UI with new cost
                costElement.textContent = `Cost: ${upgrade.costs[level - 1]}`;
            } else {
                alert('Not enough gold!');
            }

            updateUI();
        });
        upgradeElement.appendChild(imageElement);

        const nameElement = document.createElement('p');
        nameElement.textContent = upgrade.name;
        upgradeElement.appendChild(nameElement);

        const costElement = document.createElement('p');
        costElement.textContent = `Cost: ${upgrade.costs[level - 1]}`;
        upgradeElement.appendChild(costElement);

        return upgradeElement;
    }

    function increaseAttackDamage(bonus) {
        attackDamage += bonus;
    }

    document.getElementById('hero').classList.add('active');
    navButtons[0].classList.add('active');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-target');
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === target) {
                    page.classList.add('active');
                }
            });
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    const enemyHPSpan = document.getElementById('enemy-hp');
    const timerSpan = document.getElementById('timer');

    const canvas = document.getElementById('enemy-animation');
    const smokeContainer = document.getElementById('smoke-container');

    canvas.addEventListener('click', (event) => {
        if (!isTimerRunning) {
            startTimer();
        }
        const damage = 10;
        enemyHP -= getEffectiveDamage();
        gold += damage; // Increase gold by the damage dealt
        savePlayerData(telegramId, gold, level, [], 0); // You may need to update the params as needed
        showDamageNumber(event.clientX, event.clientY, getEffectiveDamage() ); // Show damage number
        if (enemyHP <= 0) {
            levelUp();
        } else {
            playDamageAnimation();
        }
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        createSmokeAnimation(x, y);
        updateUI();
    });
    function getEffectiveDamage() {
        let effectiveDamage = attackDamage;
        // Implement logic to calculate additional effects or multipliers
        return effectiveDamage;
    }

    function showDamageNumber(x, y, damage) {
        const damageNumber = document.createElement('div');
        damageNumber.className = 'damage-number';
        damageNumber.textContent = `${damage}`;
        document.body.appendChild(damageNumber);

        damageNumber.style.left = `${x}px`;
        damageNumber.style.top = `${y}px`;

        damageNumber.addEventListener('animationend', () => {
            document.body.removeChild(damageNumber);
        });
    }

    function startTimer() {
        isTimerRunning = true;
        intervalId = setInterval(() => {
            if (timer > 0) {
                timer--;
            } else {
                gameOver();
            }
            updateUI();
        }, 1000);
    }

    function resetTimer() {
        clearInterval(intervalId);
        timer = 30;
        isTimerRunning = false;
    }

    function updateUI() {
        enemyHPSpan.textContent = `HP: ${enemyHP}`;
        timerSpan.textContent = `Time: ${timer}s`;

        const fightTotalGoldSpan = document.getElementById('fight-total-gold');
        if (fightTotalGoldSpan) {
            fightTotalGoldSpan.textContent = gold;
        }

        const heroTotalGoldSpan = document.getElementById('hero-total-gold');
        if (heroTotalGoldSpan) {
            heroTotalGoldSpan.textContent = gold;
        }

        const goldImages = document.querySelectorAll('.gold-image');
        goldImages.forEach(img => {
            img.src = 'assets/animations/orc/coinflip.png'; // Set the source of the gold image
            img.alt = 'Gold'; // Optional: Set alt text for accessibility
        });
    }

    function levelUp() {
        gold += 50;
        savePlayerData(telegramId, gold, level, [], 0); // You may need to update the params as needed
        enemyHP = 100 + (level * 10);
        resetTimer();
        level++;
        alert('Level up!');
        loadRandomAnimationSet();
    }

    function gameOver() {
        resetTimer();
        alert('Game over!');
    }

    const ctx = canvas.getContext('2d');
    let spriteSheet;
    let spriteData;
    let dmgSpriteSheet;
    let dmgSpriteData;
    let smokeSpriteSheet;
    let smokeSpriteData;
    let currentFrame = 0;
    let frames = [];
    let dmgFrames = [];
    let smokeFrames = [];
    const frameSpeed = 1;
    let frameCount = 0;
    let isDamageAnimation = false;

    function loadAnimationSet(baseName) {
        return Promise.all([
            fetch(`assets/animations/orc/${baseName}.json`)
                .then(response => response.json())
                .then(data => {
                    spriteData = data;
                    frames = Object.values(spriteData.frames).map(frame => frame.frame);
                    return new Promise((resolve, reject) => {
                        spriteSheet = new Image();
                        spriteSheet.onload = resolve;
                        spriteSheet.onerror = reject;
                        spriteSheet.src = `assets/animations/orc/${baseName}.png`;
                    });
                }),
            fetch(`assets/animations/orc/${baseName}_dmg.json`)
                .then(response => response.json())
                .then(data => {
                    dmgSpriteData = data;
                    dmgFrames = Object.values(dmgSpriteData.frames).map(frame => frame.frame);
                    return new Promise((resolve, reject) => {
                        dmgSpriteSheet = new Image();
                        dmgSpriteSheet.onload = resolve;
                        dmgSpriteSheet.onerror = reject;
                        dmgSpriteSheet.src = `assets/animations/orc/${baseName}_dmg.png`;
                    });
                }),
            fetch('assets/animations/orc/smoke.json')
                .then(response => response.json())
                .then(data => {
                    smokeSpriteData = data;
                    smokeFrames = Object.values(smokeSpriteData.frames).map(frame => frame.frame);
                    return new Promise((resolve, reject) => {
                        smokeSpriteSheet = new Image();
                        smokeSpriteSheet.onload = resolve;
                        smokeSpriteSheet.onerror = reject;
                        smokeSpriteSheet.src = 'assets/animations/orc/smoke.png';
                    });
                })
        ]).then(() => {
            animate();
        }).catch(error => console.error('Error loading sprite:', error));
    }

    function loadInitialAnimations() {
        loadAnimationSet('ogre');
    }

    function loadRandomAnimationSet() {
        const animationSets = ['ogre', 'lvl2_ogre', 'lvl3_ogre'];
        const randomSet = animationSets[Math.floor(Math.random() * animationSets.length)];
        loadAnimationSet(randomSet);
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const frame = isDamageAnimation ? dmgFrames[currentFrame] : frames[currentFrame];
        const sheet = isDamageAnimation ? dmgSpriteSheet : spriteSheet;

        ctx.drawImage(sheet,
            frame.x, frame.y,
            frame.w, frame.h,
            0, 0, canvas.width, canvas.height);

        frameCount++;
        if (frameCount >= frameSpeed) {
            frameCount = 0;
            currentFrame++;
            if (isDamageAnimation && currentFrame >= dmgFrames.length) {
                isDamageAnimation = false;
                currentFrame = 0;
            } else if (!isDamageAnimation && currentFrame >= frames.length) {
                currentFrame = 0;
            }
        }

        requestAnimationFrame(animate);
    }

    function playDamageAnimation() {
        isDamageAnimation = true;
        currentFrame = 0;
    }

    function createSmokeAnimation(x, y) {
        const smokeCanvas = document.createElement('canvas');
        smokeCanvas.width = 256;
        smokeCanvas.height = 256;
        smokeCanvas.style.position = 'absolute';
        smokeCanvas.style.left = `${x - smokeCanvas.width / 2}px`;
        smokeCanvas.style.top = `${y - smokeCanvas.height / 2}px`;
        smokeCanvas.style.zIndex = '2';
        smokeContainer.appendChild(smokeCanvas);

        const smokeCtx = smokeCanvas.getContext('2d');
        let smokeFrameIndex = 0;

        function drawSmokeFrame() {
            smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
            const smokeFrame = smokeFrames[smokeFrameIndex];
            smokeCtx.drawImage(smokeSpriteSheet,
                smokeFrame.x, smokeFrame.y,
                smokeFrame.w, smokeFrame.h,
                0, 0, smokeCanvas.width, smokeCanvas.height);

            smokeFrameIndex++;
            if (smokeFrameIndex < smokeFrames.length) {
                requestAnimationFrame(drawSmokeFrame);
            } else {
                smokeContainer.removeChild(smokeCanvas);
            }
        }

        drawSmokeFrame();
    }

    const heroCanvas = document.getElementById('hero-animation');
    const heroCtx = heroCanvas.getContext('2d');
    let heroSpriteSheet;
    let heroSpriteData;
    let heroFrames = [];
    let heroFrameCount = 0;
    let heroCurrentFrame = 0;

    function loadHeroAnimation() {
        fetch('assets/animations/orc/hero.json')
            .then(response => response.json())
            .then(data => {
                heroSpriteData = data;
                heroFrames = Object.values(heroSpriteData.frames).map(frame => frame.frame);
                heroSpriteSheet = new Image();
                heroSpriteSheet.onload = () => {
                    heroAnimate();
                };
                heroSpriteSheet.src = 'assets/animations/orc/hero.png';
            })
            .catch(error => console.error('Error loading hero sprite:', error));
    }

    function heroAnimate() {
        heroCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);

        const frame = heroFrames[heroCurrentFrame];
        heroCtx.drawImage(heroSpriteSheet,
            frame.x, frame.y,
            frame.w, frame.h,
            0, 0, heroCanvas.width, heroCanvas.height);

        heroFrameCount++;
        if (heroFrameCount >= frameSpeed) {
            heroFrameCount = 0;
            heroCurrentFrame++;
            if (heroCurrentFrame >= heroFrames.length) {
                heroCurrentFrame = 0;
            }
        }

        requestAnimationFrame(heroAnimate);
    }

    loadHeroAnimation();
    initializeGame();
    loadInitialAnimations();
});
