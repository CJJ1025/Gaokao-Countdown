/**
 * 班级时钟 - 主入口文件
 * 加载并初始化所有模块
 */

const ClockApp = (function() {
    'use strict';

    /**
     * 初始化应用
     */
    async function init() {
        console.log('班级时钟初始化中...');

        // 初始化核心模块（最先加载）
        ClockCore.init();

        // 初始化主题模块
        ClockTheme.init();

        // 初始化倒计时模块
        ClockCountdown.init();

        // 初始化课表模块
        ClockSchedule.init();

        // 初始化动画模块
        ClockAnimation.init();

        // 初始化网格编辑模块
        ClockGrid.init();

        // 初始化个性化模块
        ClockPersonalize.init();

        // 初始化模态框模块
        ClockModal.init();

        // 设置主要事件监听
        setupMainEventListeners();

        // 启动定时任务
        startIntervals();

        // 更新显示
        updateDisplays();

        console.log('班级时钟初始化完成');
        ClockCore.emit('appInitialized');
    }

    /**
     * 设置主要事件监听
     */
    function setupMainEventListeners() {
        // 全屏按钮
        document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);

        // 倒计时按钮
        document.getElementById('countdownBtn')?.addEventListener('click', handleCountdownBtnClick);

        // 设置按钮
        document.getElementById('settingsBtn')?.addEventListener('click', () => ClockModal.open('settingsModal'));

        // 预设倒计时按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                ClockCountdown.show('倒计时', minutes * 60, true);
                ClockModal.close('countdownModal');
            });
        });

        // 自定义倒计时
        document.getElementById('startCustomTimer')?.addEventListener('click', () => {
            const minutes = parseInt(document.getElementById('customMinutes').value);
            if (minutes && minutes > 0) {
                ClockCountdown.show('倒计时', minutes * 60, true);
                ClockModal.close('countdownModal');
                document.getElementById('customMinutes').value = '';
            }
        });

        // 保存设置
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            const settings = ClockCore.get('settings');
            settings.gaokaoDate = document.getElementById('gaokaoDate').value;
            settings.showTimeWithCountdown = document.getElementById('showTimeWithCountdown').checked;
            ClockCore.set('settings', settings);
            ClockCore.emit('settingsChanged', settings);
            ClockModal.close('settingsModal');
        });

        // 主题选择
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (theme) {
                    ClockTheme.applyTheme(theme);
                }
            });
        });

        // 应用自定义CSS
        document.getElementById('applyCssBtnSide')?.addEventListener('click', () => {
            const selector = document.getElementById('elementSelectorSide')?.value;
            const cssText = document.getElementById('cssEditorSide')?.value;
            if (selector && cssText !== undefined) {
                ClockTheme.applyCustomCss(selector, cssText);
            }
        });

        // 导出配置
        document.getElementById('exportConfigBtn')?.addEventListener('click', () => {
            ClockPersonalize.exportConfig();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
            }
        });

        // 全屏变化
        document.addEventListener('fullscreenchange', () => {
            document.body.classList.toggle('fullscreen-mode', !!document.fullscreenElement);
        });
    }

    /**
     * 处理倒计时按钮点击
     */
    function handleCountdownBtnClick() {
        const state = ClockCountdown.getState();

        if (state.timerRemaining > 0) {
            // 有倒计时，切换控制按钮显示
            const controls = document.getElementById('countdownControls');
            if (controls?.classList.contains('visible')) {
                ClockCountdown.hideControls();
            } else {
                ClockCountdown.showControls();
            }
        } else {
            // 无倒计时，打开模态框
            ClockModal.open('countdownModal');
        }
    }

    /**
     * 切换全屏
     */
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * 启动定时任务
     */
    function startIntervals() {
        // 每秒更新时间
        setInterval(updateCurrentTime, 1000);

        // 每秒更新高考倒计时
        setInterval(updateGaokaoCountdown, 1000);

        // 每秒检查课表
        setInterval(() => ClockSchedule.checkSchedule(), 1000);
    }

    /**
     * 更新所有显示
     */
    function updateDisplays() {
        updateCurrentTime();
        updateGaokaoCountdown();
    }

    /**
     * 更新当前时间
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

        const timeEl = document.getElementById('currentTime');
        const dateEl = document.getElementById('currentDate');

        if (timeEl) timeEl.textContent = timeStr;
        if (dateEl) dateEl.textContent = dateStr;
    }

    /**
     * 更新高考倒计时
     */
    function updateGaokaoCountdown() {
        const settings = ClockCore.get('settings');
        const gaokaoDate = new Date(settings?.gaokaoDate + 'T00:00:00');
        const now = new Date();
        const diff = gaokaoDate - now;

        if (diff <= 0) {
            document.getElementById('gaokaoDays').textContent = '  0';
            document.getElementById('gaokaoHours').textContent = '00';
            document.getElementById('gaokaoMinutes').textContent = '00';
            document.getElementById('gaokaoSeconds').textContent = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const daysEl = document.getElementById('gaokaoDays');
        const hoursEl = document.getElementById('gaokaoHours');
        const minutesEl = document.getElementById('gaokaoMinutes');
        const secondsEl = document.getElementById('gaokaoSeconds');

        if (daysEl) daysEl.textContent = String(days).padStart(3, ' ');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    // 公开API
    return {
        init
    };
})();

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => ClockApp.init());
