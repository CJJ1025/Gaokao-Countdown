/**
 * 模态框模块 - 模态框管理
 * 处理所有模态框的打开、关闭等操作
 */

const ClockModal = (function() {
    'use strict';

    /**
     * 打开模态框
     */
    function open(modalId) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById(modalId);

        if (!overlay || !modal) return;

        overlay.classList.add('active');
        modal.classList.add('active');
        ClockCore.emit('modalOpened', { modalId });
    }

    /**
     * 关闭模态框
     */
    function close(modalId) {
        const modal = document.getElementById(modalId);

        if (!modal) return;

        modal.classList.remove('active');

        setTimeout(() => {
            const activeModals = document.querySelectorAll('.modal.active');
            if (activeModals.length === 0) {
                document.getElementById('modalOverlay')?.classList.remove('active');
            }
        }, 100);

        ClockCore.emit('modalClosed', { modalId });
    }

    /**
     * 关闭所有模态框
     */
    function closeAll() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.getElementById('modalOverlay')?.classList.remove('active');
        ClockCore.emit('allModalsClosed');
    }

    /**
     * 初始化模态框模块
     */
    function init() {
        setupEventListeners();
    }

    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        // 关闭按钮
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    close(modal.id);
                }
            });
        });

        // 点击遮罩关闭
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                closeAll();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAll();
                // 关闭侧边面板
                document.getElementById('personalizeSidePanel')?.classList.remove('active');
            }
        });
    }

    // 公开API
    return {
        open,
        close,
        closeAll,
        init
    };
})();
