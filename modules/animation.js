/**
 * 动画模块 - 动画效果系统
 * 处理预设动画、自定义动画触发条件等功能
 */

const ClockAnimation = (function() {
    'use strict';

    // 预设动画类型
    const presetAnimations = {
        fade: {
            name: '淡入淡出',
            css: `
                @keyframes clockFadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `,
            className: 'clock-animate-fade'
        },
        scale: {
            name: '缩放弹跳',
            css: `
                @keyframes clockScaleIn {
                    0% { opacity: 0; transform: scale(0.8); }
                    50% { transform: scale(1.05); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `,
            className: 'clock-animate-scale'
        },
        slide: {
            name: '滑入滑出',
            css: `
                @keyframes clockSlideIn {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `,
            className: 'clock-animate-slide'
        },
        pulse: {
            name: '脉冲呼吸',
            css: `
                @keyframes clockPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.02); }
                }
            `,
            className: 'clock-animate-pulse'
        },
        neon: {
            name: '霓虹闪烁',
            css: `
                @keyframes clockNeon {
                    0%, 100% { 
                        text-shadow: 0 0 10px var(--accent-color), 0 0 20px var(--accent-color);
                        opacity: 1;
                    }
                    50% { 
                        text-shadow: 0 0 20px var(--accent-color), 0 0 40px var(--accent-color), 0 0 60px var(--accent-color);
                        opacity: 0.9;
                    }
                }
            `,
            className: 'clock-animate-neon'
        }
    };

    // 触发条件选项
    const triggerOptions = {
        load: '页面加载时',
        hover: '悬停时',
        loop: '循环播放',
        countdown: '倒计时变化时',
        schedule: '课表倒计时时'
    };

    let currentAnimation = null;
    let animationStyleEl = null;
    let isEnabled = false;

    /**
     * 初始化动画模块
     */
    function init() {
        createAnimationStyleElement();
        loadAnimationSettings();
        setupEventListeners();
    }

    /**
     * 创建动画样式元素
     */
    function createAnimationStyleElement() {
        animationStyleEl = document.getElementById('clock-animation-style') || document.createElement('style');
        animationStyleEl.id = 'clock-animation-style';
        document.head.appendChild(animationStyleEl);
    }

    /**
     * 加载动画设置
     */
    function loadAnimationSettings() {
        const saved = ClockCore.get('animation');
        if (saved && saved.enabled) {
            applyAnimation(saved.type, saved.trigger);
        }
    }

    /**
     * 应用动画
     */
    function applyAnimation(type, trigger = 'load') {
        if (!presetAnimations[type]) {
            console.warn('Animation type not found:', type);
            return false;
        }

        const animation = presetAnimations[type];

        // 注入CSS
        animationStyleEl.textContent = animation.css;

        // 移除旧动画类
        Object.values(presetAnimations).forEach(anim => {
            document.body.classList.remove(anim.className);
        });

        // 添加新动画类
        document.body.classList.add(animation.className);

        // 保存设置
        ClockCore.set('animation', { enabled: true, type, trigger });
        currentAnimation = { type, trigger };

        // 根据触发条件应用动画
        applyAnimationByTrigger(type, trigger);

        ClockCore.emit('animationChanged', currentAnimation);
        return true;
    }

    /**
     * 根据触发条件应用动画
     */
    function applyAnimationByTrigger(type, trigger) {
        const elements = getAnimatedElements();
        const animation = presetAnimations[type];
        const duration = 1000;

        // 移除旧的动画事件监听
        removeAnimationListeners();

        switch (trigger) {
            case 'load':
                elements.forEach(el => {
                    el.style.animation = `${animation.className.replace('clock-animate-', '')} ${duration}ms ease-out forwards`;
                });
                break;

            case 'hover':
                elements.forEach(el => {
                    el.style.animation = 'none';
                    el.addEventListener('mouseenter', () => {
                        el.style.animation = `${animation.className.replace('clock-animate-', '')} ${duration}ms ease-out forwards`;
                    });
                    el.addEventListener('mouseleave', () => {
                        el.style.animation = 'none';
                    });
                });
                break;

            case 'loop':
                elements.forEach(el => {
                    el.style.animation = `${animation.className.replace('clock-animate-', '')} ${duration}ms ease-in-out infinite`;
                });
                break;

            case 'countdown':
            case 'schedule':
                // 这些由外部事件触发
                break;
        }
    }

    /**
     * 获取需要动画的元素
     */
    function getAnimatedElements() {
        return [
            document.getElementById('currentTime'),
            document.getElementById('currentDate'),
            document.getElementById('countdownSection'),
            document.getElementById('gaokaoSection')
        ].filter(Boolean);
    }

    /**
     * 移除动画事件监听
     */
    function removeAnimationListeners() {
        // 会在重新应用时自动清理
    }

    /**
     * 触发动画（用于倒计时/课表触发）
     */
    function triggerAnimation() {
        const anim = ClockCore.get('animation');
        if (!anim || !anim.enabled) return;

        const animation = presetAnimations[anim.type];
        if (!animation) return;

        const elements = getAnimatedElements();
        elements.forEach(el => {
            el.style.animation = 'none';
            void el.offsetWidth; // 强制重绘
            el.style.animation = `${animation.className.replace('clock-animate-', '')} 1000ms ease-out forwards`;
        });
    }

    /**
     * 禁用动画
     */
    function disable() {
        Object.values(presetAnimations).forEach(anim => {
            document.body.classList.remove(anim.className);
        });
        const elements = getAnimatedElements();
        elements.forEach(el => {
            el.style.animation = 'none';
        });
        animationStyleEl.textContent = '';
        ClockCore.set('animation', { enabled: false });
        isEnabled = false;
        currentAnimation = null;
    }

    /**
     * 获取当前动画设置
     */
    function getCurrentAnimation() {
        return currentAnimation;
    }

    /**
     * 获取所有动画类型
     */
    function getAnimationTypes() {
        return Object.entries(presetAnimations).map(([key, value]) => ({
            key,
            name: value.name
        }));
    }

    /**
     * 获取所有触发条件
     */
    function getTriggerOptions() {
        return Object.entries(triggerOptions).map(([key, value]) => ({
            key,
            name: value
        }));
    }

    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        // 监听倒计时变化
        ClockCountdown.getState && ClockCore.on('countdownChanged', triggerAnimation);

        // 监听课表变化
        ClockCore.on('scheduleTriggered', triggerAnimation);

        // 监听配置导入
        ClockCore.on('configImported', (config) => {
            if (config.animation && config.animation.enabled) {
                applyAnimation(config.animation.type, config.animation.trigger);
            }
        });
    }

    // 公开API
    return {
        init,
        applyAnimation,
        disable,
        triggerAnimation,
        getCurrentAnimation,
        getAnimationTypes,
        getTriggerOptions,
        getPresetAnimations: () => presetAnimations
    };
})();
