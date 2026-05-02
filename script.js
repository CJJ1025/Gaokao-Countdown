/* ==================== 常量定义 ==================== */
const GAOKAO_DATE = new Date('2026-06-07T00:00:00');

const defaultSchedule = [
    { id: 1, label: '小练时间', days: [1, 2, 3, 4, 5], start: '18:50', end: '19:20' },
    { id: 2, label: '自修时间', days: [1, 2, 3, 4, 5], start: '19:20', end: '20:00' },
    { id: 3, label: '自修时间', days: [1, 2, 3, 4, 5], start: '20:10', end: '20:50' },
    { id: 4, label: '晚读时间', days: [1, 2, 3, 4, 5], start: '20:50', end: '21:10' },
    { id: 5, label: '自修时间', days: [1, 2, 3, 4, 5], start: '21:20', end: '22:00' }
];

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/* ==================== 状态管理 ==================== */

let state = {
    timerInterval: null,
    timerRemaining: 0,
    timerInitialDuration: 0,
    currentPeriod: null,
    isRunning: false,
    schedule: [],
    isManualTimer: false, // 是否是手动计时器
    hideControlsTimer: null, // 隐藏控制按钮的定时器
    settings: {
        gaokaoDate: '2026-06-07',
        showTimeWithCountdown: false,
        currentTheme: 'vscode',
        customCss: {}
    }
};

/* ==================== 初始化函数 ==================== */

/**
 * 初始化应用
 * 加载设置、课表，初始化事件监听器，应用主题，启动定时更新
 */
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

/* ==================== 设置管理 ==================== */

/**
 * 从 localStorage 加载用户设置
 * 恢复高考日期、是否同时显示倒计时和时间、当前主题、自定义CSS等设置
 */
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

/**
 * 将当前设置保存到 localStorage
 * 保存用户的所有个性化设置
 */
function saveSettings() {
    localStorage.setItem('clockSettings', JSON.stringify(state.settings));
}

/* ==================== 课表管理 ==================== */

/**
 * 从 localStorage 加载课表数据
 * 如果没有保存的课表，则使用默认课表
 */
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

/**
 * 将课表数据保存到 localStorage
 * 保存用户自定义的课表安排
 */
function saveSchedule() {
    localStorage.setItem('clockSchedule', JSON.stringify(state.schedule));
}

/* ==================== 时间显示 ==================== */

/**
 * 更新当前时间和日期显示
 * 实时显示当前时间（24小时制）和完整日期
 */
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

/**
 * 更新高考倒计时显示
 * 计算距离高考日期的剩余时间，并以天、时、分、秒格式显示
 */
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

/* ==================== 倒计时显示 ==================== */

/**
 * 更新倒计时显示内容
 * 根据剩余秒数计算时、分、秒并更新到页面上
 */
function updateCountdownDisplay() {
    const hours = Math.floor(state.timerRemaining / 3600);
    const mins = Math.floor((state.timerRemaining % 3600) / 60);
    const secs = state.timerRemaining % 60;

    document.getElementById('countdownHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('countdownMinutes').textContent = String(mins).padStart(2, '0');
    document.getElementById('countdownSeconds').textContent = String(secs).padStart(2, '0');
}

/**
 * 更新暂停/继续按钮图标
 * 根据计时器运行状态切换显示暂停图标或播放图标
 */
function updatePauseResumeIcon() {
    const pauseIcon = document.getElementById('pauseIcon');
    const playIcon = document.getElementById('playIcon');

    if (state.isRunning) {
        pauseIcon.style.display = 'block';
        playIcon.style.display = 'none';
    } else {
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'block';
    }
}

/* ==================== 倒计时控制 ==================== */

/**
 * 显示倒计时
 * @param {string} label - 倒计时标签
 * @param {number} duration - 倒计时总时长（秒）
 * @param {boolean} isManual - 是否是手动计时器
 */
function showCountdown(label, duration, isManual = false) {
    const countdownSection = document.getElementById('countdownSection');
    const timeSection = document.getElementById('timeSection');

    state.currentPeriod = null;
    state.timerRemaining = duration;
    state.timerInitialDuration = duration;
    state.isManualTimer = isManual; // 设置是否是手动计时器
    countdownSection.classList.add('active');
    document.getElementById('countdownLabel').textContent = label;

    if (!state.settings.showTimeWithCountdown) {
        timeSection.classList.add('hidden');
    }

    updateCountdownDisplay();
    startTimer();
    
    // 只有手动计时器才显示控制按钮
    if (state.isManualTimer) {
        showCountdownControls();
    }
}

/**
 * 显示倒计时控制按钮
 */
function showCountdownControls() {
    const controls = document.getElementById('countdownControls');
    if (controls) {
        controls.classList.add('visible');
        // 重置自动隐藏计时器
        resetHideControlsTimer();
    }
}

/**
 * 隐藏倒计时控制按钮
 */
function hideCountdownControls() {
    const controls = document.getElementById('countdownControls');
    if (controls) {
        controls.classList.remove('visible');
    }
    // 清除自动隐藏计时器
    clearHideControlsTimer();
}

/**
 * 重置自动隐藏计时器
 */
function resetHideControlsTimer() {
    clearHideControlsTimer();
    // 5秒后自动隐藏
    state.hideControlsTimer = setTimeout(hideCountdownControls, 5000);
}

/**
 * 清除自动隐藏计时器
 */
function clearHideControlsTimer() {
    if (state.hideControlsTimer) {
        clearTimeout(state.hideControlsTimer);
        state.hideControlsTimer = null;
    }
}

/**
 * 隐藏倒计时
 * 停止计时器，隐藏倒计时区域，恢复时间显示
 */
function hideCountdown() {
    const countdownSection = document.getElementById('countdownSection');
    const timeSection = document.getElementById('timeSection');

    stopTimer();
    countdownSection.classList.remove('active');
    document.getElementById('countdownLabel').textContent = '';
    timeSection.classList.remove('hidden');

    state.currentPeriod = null;
    state.timerRemaining = 0;
    state.isManualTimer = false; // 重置手动计时器标识
    hideCountdownControls(); // 隐藏控制按钮
}

/* ==================== 计时器控制 ==================== */

/**
 * 启动计时器
 * 清除之前的计时器，每秒更新一次倒计时，时间为0时自动停止
 */
function startTimer() {
    if (state.timerInterval) stopTimer();

    state.isRunning = true;
    updatePauseResumeIcon();

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

/**
 * 停止计时器
 * 清除定时器，更新运行状态和按钮显示
 */
function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    state.isRunning = false;
    document.getElementById('countdownBtn').classList.remove('active');
    updatePauseResumeIcon();
}

/**
 * 暂停计时器
 * 调用 stopTimer 实现暂停功能
 */
function pauseTimer() {
    stopTimer();
}

/**
 * 继续计时器
 * 如果还有剩余时间，则重新启动计时器
 */
function resumeTimer() {
    if (state.timerRemaining > 0) {
        startTimer();
    }
}

/**
 * 重置计时器
 * 将倒计时重置为初始时长，然后重新启动
 */
function resetTimer() {
    stopTimer();
    state.timerRemaining = state.timerInitialDuration;
    updateCountdownDisplay();
    startTimer();
}

/**
 * 删除倒计时
 * 调用 hideCountdown 完全关闭倒计时
 */
function deleteCountdown() {
    hideCountdown();
}

/**
 * 切换计时器状态
 * - 有倒计时：显示/隐藏控制按钮
 * - 无倒计时：打开设置模态框
 */
function toggleTimer() {
    if (state.timerRemaining > 0) {
        // 有倒计时，切换控制按钮显示
        const controls = document.getElementById('countdownControls');
        if (controls.classList.contains('visible')) {
            hideCountdownControls();
        } else {
            showCountdownControls();
        }
    } else {
        // 无倒计时，打开设置模态框
        openModal('countdownModal');
    }
}

/* ==================== 课表检查 ==================== */

/**
 * 检查当前时间是否匹配课表时间段
 * 如果匹配且需要开始新倒计时，则自动启动；如果不匹配且当前倒计时是课表驱动的，则自动停止
 */
function checkSchedule() {
    console.log('checkSchedule called', {
        isRunning: state.isRunning,
        currentPeriod: state.currentPeriod,
        timerRemaining: state.timerRemaining,
        isManualTimer: state.isManualTimer
    });
    
    if (state.isRunning && !state.currentPeriod) {
        console.log('checkSchedule: 手动计时器运行中，跳过');
        return;
    }
    if (state.timerRemaining > 0 && state.isRunning) {
        console.log('checkSchedule: 有倒计时运行中，跳过');
        return;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    console.log('checkSchedule: 当前时间', now.toLocaleTimeString(), '星期', currentDay, '分钟数', currentMinutes);

    const period = state.schedule.find(p => {
        if (!p.days.includes(currentDay)) return false;
        const [startH, startM] = p.start.split(':').map(Number);
        const [endH, endM] = p.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const inRange = currentMinutes >= startMinutes && currentMinutes < endMinutes;
        console.log('检查课表', p.label, '开始', startMinutes, '结束', endMinutes, '在范围内:', inRange);
        return inRange;
    });

    console.log('checkSchedule: 找到的period', period);
    
    if (period && (!state.currentPeriod || state.currentPeriod.id !== period.id)) {
        console.log('checkSchedule: 启动课表倒计时', period.label);
        state.currentPeriod = period;
        const now = new Date();
        const [endH, endM] = period.end.split(':').map(Number);
        const endTime = new Date();
        endTime.setHours(endH, endM, 0, 0);
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        console.log('checkSchedule: 剩余秒数', remaining);

        if (remaining > 0) {
            showCountdown(period.label, remaining, false);
        }
    } else if (!period && state.currentPeriod) {
        console.log('checkSchedule: 停止课表倒计时');
        hideCountdown();
    }
}

/* ==================== 模态框控制 ==================== */

/**
 * 打开指定的模态框
 * @param {string} modalId - 模态框元素的 id
 */
function openModal(modalId) {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById(modalId).classList.add('active');
}

/**
 * 关闭指定的模态框
 * @param {string} modalId - 模态框元素的 id
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    setTimeout(() => {
        if (!document.querySelector('.modal.active')) {
            document.getElementById('modalOverlay').classList.remove('active');
        }
    }, 100);
}

/* ==================== 事件监听 ==================== */

/**
 * 初始化所有事件监听器
 * 绑定按钮点击、键盘事件、主题选择等所有交互事件
 */
function initEventListeners() {
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    document.getElementById('countdownBtn').addEventListener('click', toggleTimer);
    document.getElementById('scheduleBtn').addEventListener('click', openScheduleModal);
    document.getElementById('settingsBtn').addEventListener('click', () => openModal('settingsModal'));
    document.getElementById('personalizeBtn').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const panel = document.getElementById('personalizeSidePanel');
        if (panel) {
            panel.classList.toggle('active');
        }
    });

    document.getElementById('closePersonalizeSide').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const panel = document.getElementById('personalizeSidePanel');
        if (panel) {
            panel.classList.remove('active');
        }
    });

    // 暂停/继续按钮
    document.getElementById('pauseResumeBtn').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // 如果是课表倒计时，点击后转为手动倒计时
        if (state.currentPeriod && !state.isManualTimer) {
            state.isManualTimer = true;
            state.currentPeriod = null;
        }
        if (state.isRunning) {
            pauseTimer();
        } else {
            resumeTimer();
        }
        if (state.timerRemaining > 0) {
            resetHideControlsTimer();
        }
    });
    
    // 重置按钮
    document.getElementById('resetCountdownBtn').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        // 如果是课表倒计时，点击后转为手动倒计时
        if (state.currentPeriod && !state.isManualTimer) {
            state.isManualTimer = true;
            state.currentPeriod = null;
        }
        resetTimer();
        if (state.timerRemaining > 0) {
            resetHideControlsTimer();
        }
    });

    // 删除按钮
    document.getElementById('deleteCountdownBtn').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        deleteCountdown();
    });
    
    // 点击倒计时区域显示控制按钮（有倒计时时）
    const countdownTime = document.getElementById('countdownTime');
    countdownTime.addEventListener('click', function(e) {
        e.stopPropagation();
        if (state.timerRemaining > 0) {
            showCountdownControls();
        }
    });

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
            // 预设计时器是手动计时器，显示控制按钮
            showCountdown('倒计时', minutes * 60, true);
            closeModal('countdownModal');
        });
    });

    document.getElementById('startCustomTimer').addEventListener('click', () => {
        const minutes = parseInt(document.getElementById('customMinutes').value);
        if (minutes && minutes > 0) {
            // 自定义计时器是手动计时器，显示控制按钮
            showCountdown('倒计时', minutes * 60, true);
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

    document.getElementById('advancedModeToggleSide').addEventListener('change', (e) => {
        const panel = document.getElementById('advancedPanelSide');
        panel.style.display = e.target.checked ? 'block' : 'none';
        if (e.target.checked) {
            updateElementSelectorSide();
        }
    });

    document.getElementById('elementSelectorSide').addEventListener('change', updateCssEditorSide);
    document.getElementById('applyCssBtnSide').addEventListener('click', applyCustomCssSide);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            document.getElementById('modalOverlay').classList.remove('active');
            const sidePanel = document.getElementById('personalizeSidePanel');
            if (sidePanel) {
                sidePanel.classList.remove('active');
            }
        }
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });
    
    // 点击空白处隐藏控制按钮和个性化侧边面板
    document.addEventListener('click', function(e) {
        // 处理倒计时控制按钮
        if (state.isManualTimer) {
            const countdownControls = document.getElementById('countdownControls');
            const countdownTime = document.getElementById('countdownTime');
            // 检查点击是否不是在倒计时区域或控制按钮区域
            if (!countdownControls.contains(e.target) && 
                !countdownTime.contains(e.target)) {
                hideCountdownControls();
            }
        }
        
        // 处理个性化侧边面板
        const personalizeSidePanel = document.getElementById('personalizeSidePanel');
        const personalizeBtn = document.getElementById('personalizeBtn');
        if (personalizeSidePanel.classList.contains('active')) {
            // 检查点击是否不是在侧边面板或个性化按钮上
            if (!personalizeSidePanel.contains(e.target) && 
                !personalizeBtn.contains(e.target)) {
                personalizeSidePanel.classList.remove('active');
            }
        }
    });
}

/* ==================== 全屏模式 ==================== */

/**
 * 切换全屏/退出全屏
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen-mode');
    } else {
        document.exitFullscreen();
        document.body.classList.remove('fullscreen-mode');
    }
}

/* ==================== 主题应用 ==================== */

/**
 * 应用指定的主题
 * @param {string} theme - 主题名称 ('vscode'|'cyberpunk'|'ink'|'mahiro')
 */
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

/* ==================== 高级编辑 - 主模态框 ==================== */

/**
 * 更新元素选择下拉框内容（主模态框）
 * 填充可自定义样式的页面元素选项
 */
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

/**
 * 更新CSS编辑器内容（主模态框）
 * 根据选择的元素加载已保存的自定义CSS
 */
function updateCssEditor() {
    const selector = document.getElementById('elementSelector').value;
    const editor = document.getElementById('cssEditor');

    if (state.settings.customCss[selector]) {
        editor.value = state.settings.customCss[selector];
    } else {
        editor.value = '';
    }
}

/**
 * 应用自定义CSS样式（主模态框）
 * 将用户输入的CSS保存并应用到页面上
 */
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
            allCss += `${sel} { ${css} }\n`;
        }
    }
    styleEl.textContent = allCss;
}

/* ==================== 高级编辑 - 侧边面板 ==================== */

/**
 * 更新元素选择下拉框内容（侧边面板）
 * 填充可自定义样式的页面元素选项
 */
function updateElementSelectorSide() {
    const selector = document.getElementById('elementSelectorSide');
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

/**
 * 更新CSS编辑器内容（侧边面板）
 * 根据选择的元素加载已保存的自定义CSS
 */
function updateCssEditorSide() {
    const selector = document.getElementById('elementSelectorSide').value;
    const editor = document.getElementById('cssEditorSide');

    if (state.settings.customCss[selector]) {
        editor.value = state.settings.customCss[selector];
    } else {
        editor.value = '';
    }
}

/**
 * 应用自定义CSS样式（侧边面板）
 * 将用户输入的CSS保存并应用到页面上
 */
function applyCustomCssSide() {
    const selector = document.getElementById('elementSelectorSide').value;
    const cssText = document.getElementById('cssEditorSide').value;

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
            allCss += `${sel} { ${css} }\n`;
        }
    }
    styleEl.textContent = allCss;
}

/* ==================== 课表编辑 ==================== */

/**
 * 打开课表编辑模态框
 * 先渲染课表列表再打开模态框
 */
function openScheduleModal() {
    renderScheduleList();
    openModal('scheduleModal');
}

/**
 * 打开单个课表时间段编辑模态框
 * @param {number|null} periodId - 要编辑的时间段id，null表示添加新时间段
 */
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

/**
 * 保存课表编辑内容
 * 验证表单，更新或添加时间段，保存到localStorage并刷新列表
 */
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

/**
 * 渲染课表列表
 * 将所有时间段渲染到列表中，包含时间段信息和编辑/删除按钮
 */
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

/* ==================== 页面加载 ==================== */

document.addEventListener('DOMContentLoaded', init);
