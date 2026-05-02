/**
 * 倒计时模块 - 倒计时核心功能
 * 处理倒计时显示、控制、暂停/继续/重置等功能
 */

const ClockCountdown = (function() {
    'use strict';

    let timerInterval = null;
    let isRunning = false;
    let timerRemaining = 0;
    let timerInitialDuration = 0;
    let isManualTimer = false;
    let currentPeriod = null;
    let hideControlsTimer = null;

    /**
     * 初始化倒计时模块
     */
    function init() {
        setupEventListeners();
    }

    /**
     * 显示倒计时
     * @param {string} label - 倒计时标签
     * @param {number} duration - 倒计时总时长（秒）
     * @param {boolean} manual - 是否是手动计时器
     */
    function show(label, duration, manual = false) {
        const countdownSection = document.getElementById('countdownSection');
        const timeSection = document.getElementById('timeSection');

        currentPeriod = null;
        timerRemaining = duration;
        timerInitialDuration = duration;
        isManualTimer = manual;

        countdownSection.classList.add('active');
        document.getElementById('countdownLabel').textContent = label;

        const settings = ClockCore.get('settings');
        if (!settings.showTimeWithCountdown) {
            timeSection.classList.add('hidden');
        }

        updateDisplay();
        start();

        // 只有手动计时器才显示控制按钮
        if (isManualTimer) {
            showControls();
        }
    }

    /**
     * 隐藏倒计时
     */
    function hide() {
        const countdownSection = document.getElementById('countdownSection');
        const timeSection = document.getElementById('timeSection');

        stop();
        countdownSection.classList.remove('active');
        document.getElementById('countdownLabel').textContent = '';
        timeSection.classList.remove('hidden');

        currentPeriod = null;
        timerRemaining = 0;
        isManualTimer = false;
        hideControls();
    }

    /**
     * 更新倒计时显示
     */
    function updateDisplay() {
        const time = ClockCore.formatTime(timerRemaining);
        document.getElementById('countdownHours').textContent = time.hours;
        document.getElementById('countdownMinutes').textContent = time.mins;
        document.getElementById('countdownSeconds').textContent = time.secs;
    }

    /**
     * 启动计时器
     */
    function start() {
        if (timerInterval) stopTimerInterval();

        isRunning = true;
        updatePauseResumeIcon();

        timerInterval = setInterval(() => {
            timerRemaining--;
            if (timerRemaining <= 0) {
                stop();
                hide();
            } else {
                updateDisplay();
            }
        }, 1000);
    }

    /**
     * 停止计时器
     */
    function stop() {
        stopTimerInterval();
        isRunning = false;
        updatePauseResumeIcon();
    }

    /**
     * 内部：停止定时器
     */
    function stopTimerInterval() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    /**
     * 暂停
     */
    function pause() {
        stop();
    }

    /**
     * 继续
     */
    function resume() {
        if (timerRemaining > 0) {
            start();
        }
    }

    /**
     * 重置
     */
    function reset() {
        stop();
        timerRemaining = timerInitialDuration;
        updateDisplay();
        start();
    }

    /**
     * 删除倒计时
     */
    function deleteTimer() {
        hide();
    }

    /**
     * 切换暂停/继续
     */
    function toggle() {
        if (isRunning) {
            pause();
        } else {
            resume();
        }
    }

    /**
     * 显示控制按钮
     */
    function showControls() {
        const controls = document.getElementById('countdownControls');
        if (controls) {
            controls.classList.add('visible');
            resetHideTimer();
        }
    }

    /**
     * 隐藏控制按钮
     */
    function hideControls() {
        const controls = document.getElementById('countdownControls');
        if (controls) {
            controls.classList.remove('visible');
        }
        clearHideTimer();
    }

    /**
     * 重置自动隐藏计时器
     */
    function resetHideTimer() {
        clearHideTimer();
        hideControlsTimer = setTimeout(hideControls, 5000);
    }

    /**
     * 清除自动隐藏计时器
     */
    function clearHideTimer() {
        if (hideControlsTimer) {
            clearTimeout(hideControlsTimer);
            hideControlsTimer = null;
        }
    }

    /**
     * 更新暂停/继续图标
     */
    function updatePauseResumeIcon() {
        const pauseIcon = document.getElementById('pauseIcon');
        const playIcon = document.getElementById('playIcon');

        if (pauseIcon && playIcon) {
            if (isRunning) {
                pauseIcon.style.display = 'block';
                playIcon.style.display = 'none';
            } else {
                pauseIcon.style.display = 'none';
                playIcon.style.display = 'block';
            }
        }
    }

    /**
     * 获取当前状态
     */
    function getState() {
        return {
            isRunning,
            timerRemaining,
            timerInitialDuration,
            isManualTimer,
            currentPeriod
        };
    }

    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        // 暂停/继续按钮
        document.getElementById('pauseResumeBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // 如果是课表倒计时，转为手动倒计时
            if (currentPeriod && !isManualTimer) {
                isManualTimer = true;
                currentPeriod = null;
            }

            toggle();
            if (timerRemaining > 0) {
                resetHideTimer();
            }
        });

        // 重置按钮
        document.getElementById('resetCountdownBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (currentPeriod && !isManualTimer) {
                isManualTimer = true;
                currentPeriod = null;
            }

            reset();
            if (timerRemaining > 0) {
                resetHideTimer();
            }
        });

        // 删除按钮
        document.getElementById('deleteCountdownBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteTimer();
        });

        // 点击倒计时区域显示控制按钮
        const countdownTime = document.getElementById('countdownTime');
        countdownTime?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (timerRemaining > 0) {
                showControls();
            }
        });

        // 点击空白处隐藏控制按钮
        document.addEventListener('click', (e) => {
            if (isManualTimer) {
                const controls = document.getElementById('countdownControls');
                const countdownTimeEl = document.getElementById('countdownTime');
                if (!controls?.contains(e.target) && !countdownTimeEl?.contains(e.target)) {
                    hideControls();
                }
            }
        });
    }

    // 公开API
    return {
        init,
        show,
        hide,
        start,
        stop,
        pause,
        resume,
        reset,
        toggle,
        delete: deleteTimer,
        getState,
        showControls,
        hideControls,
        resetHideTimer
    };
})();
