const GAOKAO_DATE = new Date('2026-06-07T00:00:00');

const defaultSchedule = [
    { id: 1, label: '小练时间', days: [1, 2, 3, 4, 5], start: '18:50', end: '19:20' },
    { id: 2, label: '自修时间', days: [1, 2, 3, 4, 5], start: '19:20', end: '20:00' },
    { id: 3, label: '自修时间', days: [1, 2, 3, 4, 5], start: '20:10', end: '20:50' },
    { id: 4, label: '晚读时间', days: [1, 2, 3, 4, 5], start: '20:50', end: '21:10' },
    { id: 5, label: '自修时间', days: [1, 2, 3, 4, 5], start: '21:20', end: '22:00' }
];

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

let state = {
    timerInterval: null,
    timerRemaining: 0,
    currentPeriod: null,
    isRunning: false,
    schedule: [],
    settings: {
        gaokaoDate: '2026-06-07',
        showTimeWithCountdown: false,
        currentTheme: 'vscode',
        customCss: {}
    }
};

function init() {
    try {
        loadSettings();
        loadSchedule();
    } catch (e) {
        console.error('初始化加载数据失败:', e);
        localStorage.clear();
    }
    
    initEventListeners();
    applyTheme(state.settings.currentTheme);
    updateCurrentTime();
    updateGaokaoCountdown();
    checkSchedule();
    
    setInterval(updateCurrentTime, 1000);
    setInterval(updateGaokaoCountdown, 1000);
    setInterval(checkSchedule, 1000);
}

function loadSettings() {
    const saved = localStorage.getItem('clockSettings');
    if (saved) {
        try {
            state.settings = { ...state.settings, ...JSON.parse(saved) };
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }
    
    document.getElementById('gaokaoDate').value = state.settings.gaokaoDate;
    document.getElementById('showTimeWithCountdown').checked = state.settings.showTimeWithCountdown;
}

function saveSettings() {
    localStorage.setItem('clockSettings', JSON.stringify(state.settings));
}

function loadSchedule() {
    const saved = localStorage.getItem('clockSchedule');
    if (saved) {
        try {
            state.schedule = JSON.parse(saved);
        } catch (e) {
            state.schedule = JSON.parse(JSON.stringify(defaultSchedule));
        }
    } else {
        state.schedule = JSON.parse(JSON.stringify(defaultSchedule));
    }
}

function saveSchedule() {
    localStorage.setItem('clockSchedule', JSON.stringify(state.schedule));
}

function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
    const dateStr = now.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        weekday: 'long'
    });
    
    document.getElementById('currentTime').textContent = timeStr;
    document.getElementById('currentDate').textContent = dateStr;
}

function updateGaokaoCountdown() {
    const gaokaoDate = new Date(state.settings.gaokaoDate + 'T00:00:00');
    const now = new Date();
    const diff = gaokaoDate - now;
    
    if (diff <= 0) {
        document.getElementById('gaokaoDays').textContent = '000';
        document.getElementById('gaokaoHours').textContent = '00';
        document.getElementById('gaokaoMinutes').textContent = '00';
        document.getElementById('gaokaoSeconds').textContent = '00';
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('gaokaoDays').textContent = String(days).padStart(3, '0');
    document.getElementById('gaokaoHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('gaokaoMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('gaokaoSeconds').textContent = String(seconds).padStart(2, '0');
}

function updateCountdownDisplay() {
    const hours = Math.floor(state.timerRemaining / 3600);
    const mins = Math.floor((state.timerRemaining % 3600) / 60);
    const secs = state.timerRemaining % 60;
    document.getElementById('countdownHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('countdownMinutes').textContent = String(mins).padStart(2, '0');
    document.getElementById('countdownSeconds').textContent = String(secs).padStart(2, '0');
}

function showCountdown(label, duration) {
    const countdownSection = document.getElementById('countdownSection');
    const timeSection = document.getElementById('timeSection');
    
    state.currentPeriod = null;
    state.timerRemaining = duration;
    countdownSection.classList.add('active');
    document.getElementById('countdownLabel').textContent = label;
    
    if (!state.settings.showTimeWithCountdown) {
        timeSection.classList.add('hidden');
    }
    
    updateCountdownDisplay();
    startTimer();
}

function hideCountdown() {
    const countdownSection = document.getElementById('countdownSection');
    const timeSection = document.getElementById('timeSection');
    
    stopTimer();
    countdownSection.classList.remove('active');
    document.getElementById('countdownLabel').textContent = '';
    timeSection.classList.remove('hidden');
    
    state.currentPeriod = null;
    state.timerRemaining = 0;
}

function startTimer() {
    if (state.timerInterval) stopTimer();
    
    state.isRunning = true;
    document.getElementById('countdownBtn').classList.add('active');
    
    state.timerInterval = setInterval(() => {
        state.timerRemaining--;
        if (state.timerRemaining <= 0) {
            stopTimer();
            hideCountdown();
        } else {
            updateCountdownDisplay();
        }
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    state.isRunning = false;
    document.getElementById('countdownBtn').classList.remove('active');
}

function toggleTimer() {
    if (state.isRunning) {
        stopTimer();
    } else if (state.timerRemaining > 0) {
        startTimer();
    } else {
        openModal('countdownModal');
    }
}

function openScheduleModal() {
    renderScheduleList();
    openModal('scheduleModal');
}

function resetTimer() {
    stopTimer();
    if (state.currentPeriod) {
        const now = new Date();
        const [endH, endM] = state.currentPeriod.end.split(':').map(Number);
        const endTime = new Date();
        endTime.setHours(endH, endM, 0, 0);
        state.timerRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
        updateCountdownDisplay();
        startTimer();
    } else {
        hideCountdown();
    }
}

function checkSchedule() {
    if (state.isRunning && !state.currentPeriod) return;
    if (state.timerRemaining > 0 && state.isRunning) return;
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const period = state.schedule.find(p => {
        if (!p.days.includes(currentDay)) return false;
        const [startH, startM] = p.start.split(':').map(Number);
        const [endH, endM] = p.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    });
    
    if (period && (!state.currentPeriod || state.currentPeriod.id !== period.id)) {
        state.currentPeriod = period;
        const now = new Date();
        const [endH, endM] = period.end.split(':').map(Number);
        const endTime = new Date();
        endTime.setHours(endH, endM, 0, 0);
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        if (remaining > 0) {
            showCountdown(period.label, remaining);
        }
    } else if (!period && state.currentPeriod) {
        hideCountdown();
    }
}

function openModal(modalId) {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    setTimeout(() => {
        if (!document.querySelector('.modal.active')) {
            document.getElementById('modalOverlay').classList.remove('active');
        }
    }, 100);
}

function initEventListeners() {
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    document.getElementById('countdownBtn').addEventListener('click', toggleTimer);
    document.getElementById('scheduleBtn').addEventListener('click', openScheduleModal);
    document.getElementById('settingsBtn').addEventListener('click', () => openModal('settingsModal'));
    document.getElementById('personalizeBtn').addEventListener('click', () => openModal('personalizeModal'));
    
    document.getElementById('closeCountdownModal').addEventListener('click', () => closeModal('countdownModal'));
    document.getElementById('closeScheduleModal').addEventListener('click', () => closeModal('scheduleModal'));
    document.getElementById('closeScheduleEditModal').addEventListener('click', () => closeModal('scheduleEditModal'));
    document.getElementById('closeSettingsModal').addEventListener('click', () => closeModal('settingsModal'));
    document.getElementById('closePersonalizeModal').addEventListener('click', () => closeModal('personalizeModal'));
    
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            setTimeout(() => {
                document.getElementById('modalOverlay').classList.remove('active');
            }, 100);
        }
    });
    
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.minutes);
            showCountdown('手动倒计时', minutes * 60);
            closeModal('countdownModal');
        });
    });
    
    document.getElementById('startCustomTimer').addEventListener('click', () => {
        const minutes = parseInt(document.getElementById('customMinutes').value);
        if (minutes && minutes > 0) {
            showCountdown('手动倒计时', minutes * 60);
            closeModal('countdownModal');
            document.getElementById('customMinutes').value = '';
        }
    });
    
    document.getElementById('addScheduleBtn').addEventListener('click', () => {
        closeModal('scheduleModal');
        openScheduleEditModal(null);
    });
    
    document.getElementById('saveScheduleBtn').addEventListener('click', saveScheduleEdit);
    
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        state.settings.gaokaoDate = document.getElementById('gaokaoDate').value;
        state.settings.showTimeWithCountdown = document.getElementById('showTimeWithCountdown').checked;
        saveSettings();
        updateGaokaoCountdown();
        closeModal('settingsModal');
    });
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            applyTheme(theme);
            state.settings.currentTheme = theme;
            saveSettings();
        });
    });
    
    document.getElementById('advancedModeToggle').addEventListener('change', (e) => {
        const panel = document.getElementById('advancedPanel');
        panel.style.display = e.target.checked ? 'block' : 'none';
        if (e.target.checked) {
            updateElementSelector();
        }
    });
    
    document.getElementById('elementSelector').addEventListener('change', updateCssEditor);
    document.getElementById('applyCssBtn').addEventListener('click', applyCustomCss);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            document.getElementById('modalOverlay').classList.remove('active');
        }
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen-mode');
    } else {
        document.exitFullscreen();
        document.body.classList.remove('fullscreen-mode');
    }
}

function applyTheme(theme) {
    document.body.classList.remove('theme-cyberpunk', 'theme-ink', 'theme-mahiro');
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    if (theme !== 'vscode') {
        document.body.classList.add('theme-' + theme);
    }
    
    if (theme === 'cyberpunk') {
        document.documentElement.style.setProperty('--font-size-countdown', '10em');
    } else if (theme === 'ink') {
        document.documentElement.style.setProperty('--font-size-countdown', '9em');
    } else if (theme === 'mahiro') {
        document.documentElement.style.setProperty('--font-size-countdown', '9em');
    } else {
        document.documentElement.style.removeProperty('--font-size-countdown');
    }
}

function updateElementSelector() {
    const selector = document.getElementById('elementSelector');
    const elements = [
        { value: '#currentTime', label: '当前时间' },
        { value: '#currentDate', label: '当前日期' },
        { value: '#countdownTime', label: '倒计时时间' },
        { value: '#countdownLabel', label: '倒计时标签' },
        { value: '#gaokaoSection', label: '高考倒计时区域' },
        { value: '.app-container', label: '整个页面' }
    ];
    
    selector.innerHTML = elements.map(e => `<option value="${e.value}">${e.label}</option>`).join('');
}

function updateCssEditor() {
    const selector = document.getElementById('elementSelector').value;
    const editor = document.getElementById('cssEditor');
    
    if (state.settings.customCss[selector]) {
        editor.value = state.settings.customCss[selector];
    } else {
        editor.value = '';
    }
}

function applyCustomCss() {
    const selector = document.getElementById('elementSelector').value;
    const cssText = document.getElementById('cssEditor').value;
    
    state.settings.customCss[selector] = cssText;
    saveSettings();
    
    let styleEl = document.getElementById('custom-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-style';
        document.head.appendChild(styleEl);
    }
    
    let allCss = '';
    for (const [sel, css] of Object.entries(state.settings.customCss)) {
        if (css.trim()) {
            allCss += `${selector === sel ? sel : sel} { ${css} }\n`;
        }
    }
    styleEl.textContent = allCss;
}

function openScheduleEditModal(periodId) {
    const modal = document.getElementById('scheduleEditModal');
    let period = null;
    
    if (periodId) {
        period = state.schedule.find(p => p.id === periodId);
    }
    
    document.getElementById('editScheduleLabel').value = period ? period.label : '';
    document.getElementById('editScheduleStart').value = period ? period.start : '18:00';
    document.getElementById('editScheduleEnd').value = period ? period.end : '18:30';
    
    const daysContainer = document.getElementById('editScheduleDays');
    daysContainer.innerHTML = '';
    
    const selectedDays = period ? period.days : [1, 2, 3, 4, 5];
    
    dayNames.forEach((name, index) => {
        const btn = document.createElement('button');
        btn.className = 'day-btn' + (selectedDays.includes(index) ? ' active' : '');
        btn.textContent = name;
        btn.dataset.day = index;
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
        daysContainer.appendChild(btn);
    });
    
    modal.dataset.periodId = periodId || '';
    openModal('scheduleEditModal');
}

function saveScheduleEdit() {
    const modal = document.getElementById('scheduleEditModal');
    const periodId = modal.dataset.periodId;
    
    const label = document.getElementById('editScheduleLabel').value.trim() || '未命名';
    const start = document.getElementById('editScheduleStart').value;
    const end = document.getElementById('editScheduleEnd').value;
    
    const selectedDays = [];
    document.querySelectorAll('#editScheduleDays .day-btn').forEach(btn => {
        if (btn.classList.contains('active')) {
            selectedDays.push(parseInt(btn.dataset.day));
        }
    });
    
    if (!start || !end) {
        alert('请填写开始和结束时间');
        return;
    }
    
    if (periodId) {
        const period = state.schedule.find(p => p.id === parseInt(periodId));
        if (period) {
            period.label = label;
            period.days = selectedDays;
            period.start = start;
            period.end = end;
        }
    } else {
        const newId = state.schedule.length > 0 ? Math.max(...state.schedule.map(p => p.id)) + 1 : 1;
        state.schedule.push({
            id: newId,
            label,
            days: selectedDays,
            start,
            end
        });
    }
    
    saveSchedule();
    closeModal('scheduleEditModal');
    renderScheduleList();
}

function renderScheduleList() {
    const list = document.getElementById('scheduleList');
    
    if (state.schedule.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px;">暂无课表</div>';
        return;
    }
    
    list.innerHTML = state.schedule.map(period => {
        const daysText = period.days.map(d => dayNames[d]).join('、');
        return `
            <div class="schedule-item" data-id="${period.id}">
                <div class="schedule-info">
                    <div class="schedule-label">${period.label}</div>
                    <div class="schedule-time">${period.start} - ${period.end}</div>
                    <div class="schedule-days">${daysText}</div>
                </div>
                <div class="schedule-actions">
                    <button class="schedule-action-btn edit" data-id="${period.id}" title="编辑">✎</button>
                    <button class="schedule-action-btn delete" data-id="${period.id}" title="删除">×</button>
                </div>
            </div>
        `;
    }).join('');
    
    list.querySelectorAll('.schedule-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            closeModal('scheduleModal');
            openScheduleEditModal(id);
        });
    });
    
    list.querySelectorAll('.schedule-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            state.schedule = state.schedule.filter(p => p.id !== id);
            saveSchedule();
            renderScheduleList();
        });
    });
}

document.addEventListener('DOMContentLoaded', init);