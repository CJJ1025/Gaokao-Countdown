const defaultSettings = {
    showCustomTimers: true,
    showClock: true,
    showGaokao: true,
    showLongFormat: true,
    customTimersOrder: 1,
    clockOrder: 2,
    gaokaoOrder: 3,
    customTimersSize: 4.5,
    specialTimerSize: 12,
    clockSize: 5
};

let settings = { ...defaultSettings };

function loadSettings() {
    const saved = localStorage.getItem('clockSettings');
    if (saved) {
        settings = { ...defaultSettings, ...JSON.parse(saved) };
    }
    applySettings();
    updateSettingsUI();
}

function saveSettings() {
    localStorage.setItem('clockSettings', JSON.stringify(settings));
}

function applySettings() {
    document.querySelector('.custom-timers-section').style.display = settings.showCustomTimers ? 'block' : 'none';
    document.querySelector('.clock-section').style.display = settings.showClock ? 'block' : 'none';
    document.querySelector('.gaokao-section').style.display = settings.showGaokao ? 'block' : 'none';

    const container = document.querySelector('.container');
    const sections = [
        { el: document.querySelector('.custom-timers-section'), order: settings.customTimersOrder },
        { el: document.querySelector('.clock-section'), order: settings.clockOrder },
        { el: document.querySelector('.gaokao-section'), order: settings.gaokaoOrder }
    ].sort((a, b) => a.order - b.order);

    sections.forEach(s => container.appendChild(s.el));

    updateFullscreenSizes();
}

function updateFullscreenSizes() {
    document.documentElement.style.setProperty('--custom-timers-size', `${settings.customTimersSize}em`);
    document.documentElement.style.setProperty('--special-timer-size', `${settings.specialTimerSize}em`);
    document.documentElement.style.setProperty('--clock-size', `${settings.clockSize}em`);
}

function updateSettingsUI() {
    document.getElementById('showCustomTimers').checked = settings.showCustomTimers;
    document.getElementById('showClock').checked = settings.showClock;
    document.getElementById('showGaokao').checked = settings.showGaokao;
    document.getElementById('showLongFormat').checked = settings.showLongFormat;
    document.getElementById('customTimersOrder').value = settings.customTimersOrder;
    document.getElementById('clockOrder').value = settings.clockOrder;
    document.getElementById('gaokaoOrder').value = settings.gaokaoOrder;
    document.getElementById('customTimersSize').value = settings.customTimersSize;
    document.getElementById('specialTimerSize').value = settings.specialTimerSize;
    document.getElementById('clockSize').value = settings.clockSize;
    document.querySelector('#customTimersSize + .size-value').textContent = `${settings.customTimersSize}em`;
    document.querySelector('#specialTimerSize + .size-value').textContent = `${settings.specialTimerSize}em`;
    document.querySelector('#clockSize + .size-value').textContent = `${settings.clockSize}em`;
}

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (settings.showLongFormat && hours > 0) {
        return `${String(hours).padStart(2, ' ')}:${String(minutes).padStart(2, ' ')}:${String(seconds).padStart(2, '0')}`;
    } else {
        const totalMinutes = hours * 60 + minutes;
        return `${String(totalMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('currentTime').textContent = `${hours}:${minutes}:${seconds}`;

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    document.getElementById('currentDate').textContent = `${year}年${month}月${day}日 ${weekday}`;
}

function updateGaokaoCountdown() {
    const now = new Date();
    const gaokaoDate = new Date('2026-06-07T09:00:00');
    const diff = gaokaoDate - now;

    if (diff <= 0) {
        document.getElementById('gaokaoDays').textContent = '00';
        document.getElementById('gaokaoHours').textContent = '00';
        document.getElementById('gaokaoMinutes').textContent = '00';
        document.getElementById('gaokaoSeconds').textContent = '00';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('gaokaoDays').textContent = String(days).padStart(2, '0');
    document.getElementById('gaokaoHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('gaokaoMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('gaokaoSeconds').textContent = String(seconds).padStart(2, '0');
}

const specialTimeSlots = [
    { start: '18:50', end: '19:20', name: '小练', duration: 30 },
    { start: '19:20', end: '20:00', name: '自修', duration: 40 },
    { start: '20:10', end: '20:50', name: '自修', duration: 40 },
    { start: '20:50', end: '21:10', name: '晚读', duration: 20 },
    { start: '21:20', end: '22:00', name: '自修', duration: 40 }
];

let specialTimerState = {
    active: false,
    remaining: 0,
    paused: false,
    currentSlot: null,
    intervalId: null
};

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function getCurrentMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function checkSpecialTimer() {
    const currentMinutes = getCurrentMinutes();
    const currentSeconds = new Date().getSeconds();

    let activeSlot = null;
    for (const slot of specialTimeSlots) {
        const startMinutes = timeToMinutes(slot.start);
        const endMinutes = timeToMinutes(slot.end);

        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            activeSlot = slot;
            break;
        }
    }

    if (activeSlot) {
        if (specialTimerState.currentSlot !== activeSlot.name) {
            if (specialTimerState.intervalId) {
                clearInterval(specialTimerState.intervalId);
            }
            specialTimerState.active = true;
            specialTimerState.paused = false;
            specialTimerState.currentSlot = activeSlot.name;
            specialTimerState.remaining = activeSlot.duration * 60 - currentSeconds;

            document.getElementById('specialTimerSection').style.display = 'block';
            startSpecialCountdown();
        } else if (!specialTimerState.paused) {
            const endMinutes = timeToMinutes(activeSlot.end);
            const remainingMinutes = endMinutes - currentMinutes - 1;
            const remainingSeconds = 60 - currentSeconds;
            specialTimerState.remaining = remainingMinutes * 60 + remainingSeconds;
        }
    } else {
        if (specialTimerState.active) {
            specialTimerState.active = false;
            specialTimerState.currentSlot = null;
            if (specialTimerState.intervalId) {
                clearInterval(specialTimerState.intervalId);
            }
            document.getElementById('specialTimerSection').style.display = 'none';
        }
    }
}

function startSpecialCountdown() {
    if (specialTimerState.intervalId) {
        clearInterval(specialTimerState.intervalId);
    }

    specialTimerState.intervalId = setInterval(() => {
        if (specialTimerState.paused) return;

        if (specialTimerState.remaining <= 0) {
            clearInterval(specialTimerState.intervalId);
            playBeep();
            document.getElementById('specialTimerSection').classList.add('timer-finished');
            setTimeout(() => {
                document.getElementById('specialTimerSection').classList.remove('timer-finished');
            }, 3000);
            return;
        }

        specialTimerState.remaining--;
        updateSpecialTimerDisplay();
    }, 1000);
}

function updateSpecialTimerDisplay() {
    const timeStr = formatTime(specialTimerState.remaining);
    const [min, sec] = timeStr.split(':').slice(-2);
    document.getElementById('specialMinutes').textContent = min;
    document.getElementById('specialSeconds').textContent = sec;
}

const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenIcon = document.getElementById('fullscreenIcon');
const exitFullscreenIcon = document.getElementById('exitFullscreenIcon');

function updateFullscreenUI() {
    if (document.fullscreenElement) {
        fullscreenIcon.style.display = 'none';
        exitFullscreenIcon.style.display = 'block';
        fullscreenBtn.classList.add('gray');
        fullscreenBtn.title = '退出全屏';
        document.body.classList.add('fullscreen-mode');
    } else {
        fullscreenIcon.style.display = 'block';
        exitFullscreenIcon.style.display = 'none';
        fullscreenBtn.classList.remove('gray');
        fullscreenBtn.title = '全屏';
        document.body.classList.remove('fullscreen-mode');
    }
}

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error('全屏请求失败:', err);
        });
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', updateFullscreenUI);
updateFullscreenUI();

const timerControlBtn = document.getElementById('timerControlBtn');
const timerPopup = document.getElementById('timerPopup');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPopup = document.getElementById('settingsPopup');

function updateTimerControlVisibility() {
    if (document.fullscreenElement) {
        timerControlBtn.style.display = 'none';
        settingsBtn.style.display = 'none';
        timerPopup.classList.remove('show');
        settingsPopup.classList.remove('show');
    } else {
        timerControlBtn.style.display = 'flex';
        settingsBtn.style.display = 'flex';
    }
}

document.addEventListener('fullscreenchange', () => {
    updateFullscreenUI();
    updateTimerControlVisibility();
});
updateTimerControlVisibility();

timerControlBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPopup.classList.remove('show');
    timerPopup.classList.toggle('show');
});

settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    timerPopup.classList.remove('show');
    settingsPopup.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!timerPopup.contains(e.target) && e.target !== timerControlBtn) {
        timerPopup.classList.remove('show');
    }
    if (!settingsPopup.contains(e.target) && e.target !== settingsBtn) {
        settingsPopup.classList.remove('show');
    }
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        addQuickTimer(minutes);
        timerPopup.classList.remove('show');
    });
});

document.getElementById('customTimerBtn').addEventListener('click', () => {
    const input = document.getElementById('customMinutes');
    const minutes = parseInt(input.value);
    if (minutes && minutes > 0) {
        addQuickTimer(minutes);
        input.value = '';
        timerPopup.classList.remove('show');
    }
});

function addQuickTimer(minutes) {
    const names = {
        150: '150分钟',
        120: '120分钟',
        75: '75分钟',
        45: '45分钟',
        30: '30分钟'
    };
    const name = names[minutes] || `${minutes}分钟`;

    const timer = {
        id: ++customTimerId,
        name: name,
        totalSeconds: minutes * 60,
        remaining: minutes * 60,
        running: false,
        intervalId: null
    };

    customTimers.push(timer);
    saveCustomTimers();
    renderCustomTimers();
}

let customTimers = [];
let customTimerId = 0;

function loadCustomTimers() {
    const saved = localStorage.getItem('customTimers');
    if (saved) {
        customTimers = JSON.parse(saved);
        renderCustomTimers();
    }
}

function saveCustomTimers() {
    localStorage.setItem('customTimers', JSON.stringify(customTimers));
}

function renderCustomTimers() {
    const container = document.getElementById('customTimersList');
    const section = document.querySelector('.custom-timers-section');
    container.innerHTML = '';

    if (customTimers.length === 0) {
        section.classList.add('empty');
    } else {
        section.classList.remove('empty');
    }

    customTimers.forEach(timer => {
        const timerElement = document.createElement('div');
        timerElement.className = 'custom-timer-item';
        if (timer.remaining === 0 && timer.totalSeconds > 0) {
            timerElement.classList.add('timer-finished');
        }

        const timeDisplay = formatTime(timer.remaining);

        timerElement.innerHTML = `
            <div class="custom-timer-info">
                <div class="custom-timer-name">${timer.name}</div>
                <div class="custom-timer-time">${timeDisplay}</div>
            </div>
            <div class="custom-timer-controls">
                <button class="toggle-btn" data-id="${timer.id}">
                    ${timer.running ? '暂停' : '开始'}
                </button>
                <button class="reset-btn" data-id="${timer.id}">重置</button>
                <button class="delete-btn" data-id="${timer.id}">删除</button>
            </div>
        `;

        container.appendChild(timerElement);
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            toggleCustomTimer(id);
        });
    });

    document.querySelectorAll('.reset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            resetCustomTimer(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteCustomTimer(id);
        });
    });
}

function toggleCustomTimer(id) {
    const timer = customTimers.find(t => t.id === id);
    if (!timer || timer.remaining === 0) return;

    if (timer.running) {
        timer.running = false;
        if (timer.intervalId) {
            clearInterval(timer.intervalId);
        }
    } else {
        timer.running = true;
        timer.intervalId = setInterval(() => {
            if (timer.remaining <= 0) {
                clearInterval(timer.intervalId);
                timer.running = false;
                playBeep();
                renderCustomTimers();
                return;
            }
            timer.remaining--;
            renderCustomTimers();
        }, 1000);
    }

    saveCustomTimers();
    renderCustomTimers();
}

function resetCustomTimer(id) {
    const timer = customTimers.find(t => t.id === id);
    if (!timer) return;

    if (timer.intervalId) {
        clearInterval(timer.intervalId);
    }
    timer.remaining = timer.totalSeconds;
    timer.running = false;
    timer.intervalId = null;

    saveCustomTimers();
    renderCustomTimers();
}

function deleteCustomTimer(id) {
    const timerIndex = customTimers.findIndex(t => t.id === id);
    if (timerIndex === -1) return;

    const timer = customTimers[timerIndex];
    if (timer.intervalId) {
        clearInterval(timer.intervalId);
    }

    customTimers.splice(timerIndex, 1);
    saveCustomTimers();
    renderCustomTimers();
}

function playBeep() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 800;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.5, audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + 0.5);
        }, 600);

        setTimeout(() => {
            const osc3 = audioContext.createOscillator();
            const gain3 = audioContext.createGain();
            osc3.connect(gain3);
            gain3.connect(audioContext.destination);
            osc3.frequency.value = 800;
            osc3.type = 'sine';
            gain3.gain.setValueAtTime(0.5, audioContext.currentTime);
            gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            osc3.start(audioContext.currentTime);
            osc3.stop(audioContext.currentTime + 0.5);
        }, 1200);
    } catch (e) {
        console.error('播放提示音失败:', e);
    }
}

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        applyTheme(theme);
    });
});

function applyTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-neon', 'theme-ocean', 'theme-forest', 'theme-custom');
    
    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');

    localStorage.setItem('timerTheme', theme);
}

document.getElementById('applyCustomBtn').addEventListener('click', () => {
    const bgColor = document.getElementById('bgColor').value;
    const textColor = document.getElementById('textColor').value;
    const accentColor = document.getElementById('accentColor').value;

    document.body.style.setProperty('--bg-primary', bgColor);
    document.body.style.setProperty('--bg-secondary', adjustColor(bgColor, 15));
    document.body.style.setProperty('--bg-tertiary', adjustColor(bgColor, 25));
    document.body.style.setProperty('--bg-hover', adjustColor(bgColor, 35));
    document.body.style.setProperty('--text-primary', textColor);
    document.body.style.setProperty('--text-secondary', adjustColor(textColor, -30));
    document.body.style.setProperty('--accent-blue', accentColor);
    document.body.style.setProperty('--accent-green', adjustColor(accentColor, -20));
    document.body.style.setProperty('--accent-orange', '#ffab91');
    document.body.style.setProperty('--accent-yellow', '#fff59d');
    document.body.style.setProperty('--border-color', adjustColor(accentColor, -30));

    document.body.classList.remove('theme-dark', 'theme-neon', 'theme-ocean', 'theme-forest');
    document.body.classList.add('theme-custom');

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    localStorage.setItem('timerTheme', 'custom');
    localStorage.setItem('customTheme', JSON.stringify({ bgColor, textColor, accentColor }));

    settingsPopup.classList.remove('show');
});

document.getElementById('resetThemeBtn').addEventListener('click', () => {
    document.body.classList.remove('theme-dark', 'theme-neon', 'theme-ocean', 'theme-forest', 'theme-custom');
    document.body.removeAttribute('style');

    document.getElementById('bgColor').value = '#1e1e1e';
    document.getElementById('textColor').value = '#cccccc';
    document.getElementById('accentColor').value = '#4fc1ff';

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-theme="default"]').classList.add('active');

    localStorage.removeItem('timerTheme');
    localStorage.removeItem('customTheme');

    settingsPopup.classList.remove('show');
});

function adjustColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function loadTheme() {
    const savedTheme = localStorage.getItem('timerTheme');
    if (savedTheme) {
        if (savedTheme === 'custom') {
            const customTheme = localStorage.getItem('customTheme');
            if (customTheme) {
                const { bgColor, textColor, accentColor } = JSON.parse(customTheme);
                document.getElementById('bgColor').value = bgColor;
                document.getElementById('textColor').value = textColor;
                document.getElementById('accentColor').value = accentColor;
                
                document.body.style.setProperty('--bg-primary', bgColor);
                document.body.style.setProperty('--bg-secondary', adjustColor(bgColor, 15));
                document.body.style.setProperty('--bg-tertiary', adjustColor(bgColor, 25));
                document.body.style.setProperty('--bg-hover', adjustColor(bgColor, 35));
                document.body.style.setProperty('--text-primary', textColor);
                document.body.style.setProperty('--text-secondary', adjustColor(textColor, -30));
                document.body.style.setProperty('--accent-blue', accentColor);
                document.body.style.setProperty('--accent-green', adjustColor(accentColor, -20));
                document.body.style.setProperty('--accent-orange', '#ffab91');
                document.body.style.setProperty('--accent-yellow', '#fff59d');
                document.body.style.setProperty('--border-color', adjustColor(accentColor, -30));
                
                document.body.classList.add('theme-custom');
            }
        } else {
            applyTheme(savedTheme);
        }
    }
}

document.querySelectorAll('.size-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        e.target.nextElementSibling.textContent = `${value}em`;
    });
});

document.getElementById('applySettingsBtn').addEventListener('click', () => {
    settings.showCustomTimers = document.getElementById('showCustomTimers').checked;
    settings.showClock = document.getElementById('showClock').checked;
    settings.showGaokao = document.getElementById('showGaokao').checked;
    settings.showLongFormat = document.getElementById('showLongFormat').checked;
    settings.customTimersOrder = parseInt(document.getElementById('customTimersOrder').value);
    settings.clockOrder = parseInt(document.getElementById('clockOrder').value);
    settings.gaokaoOrder = parseInt(document.getElementById('gaokaoOrder').value);
    settings.customTimersSize = parseFloat(document.getElementById('customTimersSize').value);
    settings.specialTimerSize = parseFloat(document.getElementById('specialTimerSize').value);
    settings.clockSize = parseFloat(document.getElementById('clockSize').value);

    saveSettings();
    applySettings();
    settingsPopup.classList.remove('show');
});

document.getElementById('resetSettingsBtn').addEventListener('click', () => {
    settings = { ...defaultSettings };
    saveSettings();
    applySettings();
    updateSettingsUI();
    settingsPopup.classList.remove('show');
});

function updateAll() {
    updateCurrentTime();
    updateGaokaoCountdown();
    checkSpecialTimer();
}

updateAll();
setInterval(updateAll, 1000);
loadSettings();
loadTheme();
loadCustomTimers();
