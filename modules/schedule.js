/**
 * 课表模块 - 课表时间管理
 * 处理课表加载、保存、自动触发倒计时等功能
 */

const ClockSchedule = (function () {
    'use strict';

    const defaultSchedule = [
        { id: 1, label: '小练时间', days: [0, 1, 2, 3, 4, 5, 6], start: '18:50', end: '19:20' },
        { id: 2, label: '自修时间', days: [0, 1, 2, 3, 4, 5, 6], start: '19:20', end: '20:00' },
        { id: 3, label: '自修时间', days: [0, 1, 2, 3, 4, 5, 6], start: '20:10', end: '20:50' },
        { id: 4, label: '晚读时间', days: [0, 1, 2, 3, 4, 5, 6], start: '20:50', end: '21:10' },
        { id: 5, label: '自修时间', days: [0, 1, 2, 3, 4, 5, 6], start: '21:20', end: '22:00' }
    ];

    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    let schedule = [];

    /**
     * 初始化课表模块
     */
    function init() {
        loadSchedule();
        setupEventListeners();
    }

    /**
     * 加载课表
     */
    function loadSchedule() {
        try {
            const saved = localStorage.getItem('clockSchedule');
            if (saved) {
                schedule = JSON.parse(saved);
            } else {
                schedule = JSON.parse(JSON.stringify(defaultSchedule));
            }
        } catch (e) {
            schedule = JSON.parse(JSON.stringify(defaultSchedule));
        }
    }

    /**
     * 保存课表
     */
    function saveSchedule() {
        localStorage.setItem('clockSchedule', JSON.stringify(schedule));
        ClockCore.emit('scheduleChanged', schedule);
    }

    /**
     * 获取课表
     */
    function getSchedule() {
        return schedule;
    }

    /**
     * 添加课表时段
     */
    function addPeriod(period) {
        const newId = schedule.length > 0 ? Math.max(...schedule.map(p => p.id)) + 1 : 1;
        const newPeriod = {
            id: newId,
            label: period.label || '未命名',
            days: period.days || [1, 2, 3, 4, 5],
            start: period.start || '18:00',
            end: period.end || '18:30'
        };
        schedule.push(newPeriod);
        saveSchedule();
        return newPeriod;
    }

    /**
     * 更新课表时段
     */
    function updatePeriod(id, updates) {
        const index = schedule.findIndex(p => p.id === id);
        if (index >= 0) {
            schedule[index] = { ...schedule[index], ...updates };
            saveSchedule();
            return schedule[index];
        }
        return null;
    }

    /**
     * 删除课表时段
     */
    function deletePeriod(id) {
        schedule = schedule.filter(p => p.id !== id);
        saveSchedule();
    }

    /**
     * 检查当前时间是否匹配课表
     */
    function checkSchedule() {
        const state = ClockCountdown.getState();

        // 如果手动计时器运行中，跳过
        if (state.isRunning && !state.currentPeriod) return;

        // 如果有倒计时运行中，跳过
        if (state.timerRemaining > 0 && state.isRunning) return;

        const now = new Date();
        const currentDay = now.getDay();
        const currentMinutes = ClockCore.getCurrentMinutes();

        const period = schedule.find(p => {
            if (!p.days.includes(currentDay)) return false;
            const startMinutes = ClockCore.parseTimeToMinutes(p.start);
            const endMinutes = ClockCore.parseTimeToMinutes(p.end);
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        });

        if (period && (!state.currentPeriod || state.currentPeriod.id !== period.id)) {
            // 启动课表倒计时
            const [endH, endM] = period.end.split(':').map(Number);
            const endTime = new Date();
            endTime.setHours(endH, endM, 0, 0);
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

            if (remaining > 0) {
                ClockCountdown.show(period.label, remaining, false);
                ClockCore.set('currentPeriod', period);
            }
        } else if (!period && state.currentPeriod) {
            // 停止课表倒计时
            ClockCountdown.hide();
            ClockCore.set('currentPeriod', null);
        }
    }

    /**
     * 渲染课表列表
     */
    function renderList() {
        const list = document.getElementById('scheduleList');
        if (!list) return;

        if (schedule.length === 0) {
            list.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px;">暂无课表</div>';
            return;
        }

        list.innerHTML = schedule.map(period => {
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

        // 绑定事件
        list.querySelectorAll('.schedule-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                ClockScheduleUI.openEditModal(id);
            });
        });

        list.querySelectorAll('.schedule-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                deletePeriod(id);
                renderList();
            });
        });
    }

    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        // 添加按钮
        document.getElementById('addScheduleBtn')?.addEventListener('click', () => {
            ClockScheduleUI.openEditModal(null);
        });

        // 保存按钮
        document.getElementById('saveScheduleBtn')?.addEventListener('click', () => {
            ClockScheduleUI.savePeriod();
        });

        // 课表按钮
        document.getElementById('scheduleBtn')?.addEventListener('click', () => {
            renderList();
            ClockModal.open('scheduleModal');
        });

        // 配置导入时更新课表
        ClockCore.on('configImported', (config) => {
            if (config.schedule) {
                schedule = config.schedule;
                saveSchedule();
            }
        });
    }

    // 公开API
    return {
        init,
        getSchedule,
        addPeriod,
        updatePeriod,
        deletePeriod,
        checkSchedule,
        renderList,
        getDayNames: () => dayNames
    };
})();

/**
 * 课表UI模块 - 处理课表编辑界面
 */
const ClockScheduleUI = (function () {
    'use strict';

    let currentEditId = null;

    /**
     * 打开编辑模态框
     */
    function openEditModal(periodId) {
        currentEditId = periodId;
        const modal = document.getElementById('scheduleEditModal');
        const period = periodId ? ClockSchedule.getSchedule().find(p => p.id === periodId) : null;

        document.getElementById('editScheduleLabel').value = period?.label || '';
        document.getElementById('editScheduleStart').value = period?.start || '18:00';
        document.getElementById('editScheduleEnd').value = period?.end || '18:30';

        // 渲染星期选择器
        const daysContainer = document.getElementById('editScheduleDays');
        daysContainer.innerHTML = '';
        const selectedDays = period?.days || [1, 2, 3, 4, 5];

        ClockSchedule.getDayNames().forEach((name, index) => {
            const btn = document.createElement('button');
            btn.className = 'day-btn' + (selectedDays.includes(index) ? ' active' : '');
            btn.textContent = name;
            btn.dataset.day = index;
            btn.type = 'button';
            btn.addEventListener('click', () => btn.classList.toggle('active'));
            daysContainer.appendChild(btn);
        });

        ClockModal.close('scheduleModal');
        ClockModal.open('scheduleEditModal');
    }

    /**
     * 保存时段
     */
    function savePeriod() {
        const label = document.getElementById('editScheduleLabel').value.trim() || '未命名';
        const start = document.getElementById('editScheduleStart').value;
        const end = document.getElementById('editScheduleEnd').value;

        const selectedDays = [];
        document.querySelectorAll('#editScheduleDays .day-btn.active').forEach(btn => {
            selectedDays.push(parseInt(btn.dataset.day));
        });

        if (!start || !end) {
            alert('请填写开始和结束时间');
            return;
        }

        if (currentEditId) {
            ClockSchedule.updatePeriod(currentEditId, { label, days: selectedDays, start, end });
        } else {
            ClockSchedule.addPeriod({ label, days: selectedDays, start, end });
        }

        ClockSchedule.renderList();
        ClockModal.close('scheduleEditModal');
        ClockModal.open('scheduleModal');
    }

    return {
        openEditModal,
        savePeriod
    };
})();
