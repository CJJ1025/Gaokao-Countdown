/**
 * 个性化模块 - 导入导出管理
 * 处理主题导入导出、自定义资源管理等功能
 */

const ClockPersonalize = (function() {
    'use strict';

    /**
     * 初始化个性化模块
     */
    function init() {
        setupEventListeners();
    }

    /**
     * 导出完整配置
     */
    function exportConfig() {
        const config = ClockCore.exportConfig();
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `clock-config-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        ClockCore.emit('configExported', config);
    }

    /**
     * 导入配置文件
     */
    async function importConfig(file) {
        try {
            const text = await file.text();
            const config = JSON.parse(text);
            ClockCore.importConfig(config);
            ClockCore.emit('configImported', config);
            return config;
        } catch (e) {
            console.error('Failed to import config:', e);
            throw new Error('配置文件格式无效');
        }
    }

    /**
     * 处理文件导入（支持拖放）
     */
    function handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                importConfig(file);
            }
        }
    }

    /**
     * 处理文件夹导入（File System Access API）
     */
    async function importFromDirectory() {
        if (!('showDirectoryPicker' in window)) {
            alert('您的浏览器不支持文件夹选择，请使用Chrome或Edge浏览器');
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker();
            const configFile = await dirHandle.getFileHandle('config.json');
            const file = await configFile.getFile();
            const config = JSON.parse(await file.text());

            // 导入背景图（如果存在）
            const backgroundHandle = await dirHandle.getFileHandle('background').catch(() => null);
            if (backgroundHandle) {
                const bgFile = await backgroundHandle.getFile();
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.body.style.backgroundImage = `url(${e.target.result})`;
                    document.body.style.backgroundSize = 'cover';
                };
                reader.readAsDataURL(bgFile);
            }

            ClockCore.importConfig(config);
            ClockCore.emit('configImported', config);
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Failed to import from directory:', e);
            }
        }
    }

    /**
     * 导出到文件夹（File System Access API）
     */
    async function exportToDirectory() {
        if (!('showDirectoryPicker' in window)) {
            alert('您的浏览器不支持文件夹选择，请使用Chrome或Edge浏览器');
            exportConfig();
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker();
            const config = ClockCore.exportConfig();

            // 写入config.json
            const configFile = await dirHandle.getFileHandle('config.json', { create: true });
            const writable = await configFile.createWritable();
            await writable.write(JSON.stringify(config, null, 2));
            await writable.close();

            // 保存背景图（如果有）
            const bgImage = document.body.style.backgroundImage;
            if (bgImage && bgImage !== 'none') {
                const bgUrl = bgImage.match(/url\("?(.+?)"?\)/)?.[1];
                if (bgUrl && bgUrl.startsWith('data:')) {
                    const bgFile = await dirHandle.getFileHandle('background', { create: true });
                    const bgWritable = await bgFile.createWritable();
                    const base64 = bgUrl.split(',')[1];
                    const binary = atob(base64);
                    const array = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        array[i] = binary.charCodeAt(i);
                    }
                    await bgWritable.write(array);
                    await bgWritable.close();
                }
            }

            ClockCore.emit('configExported', config);
            alert('配置已保存到文件夹');
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Failed to export to directory:', e);
            }
        }
    }

    /**
     * 导入主题文件
     */
    async function importThemeFile(file) {
        try {
            const text = await file.text();
            const themeConfig = JSON.parse(text);
            ClockTheme.importTheme(themeConfig);
        } catch (e) {
            console.error('Failed to import theme:', e);
            throw new Error('主题文件格式无效');
        }
    }

    /**
     * 导出当前主题
     */
    function exportCurrentTheme() {
        const themeName = ClockCore.get('currentTheme');
        const themeData = ClockTheme.exportTheme(themeName);
        if (!themeData) {
            alert('无法导出当前主题');
            return;
        }

        const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `theme-${themeName}-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * 保存当前配置为自定义主题
     */
    function saveAsCustomTheme(name) {
        if (!name || !name.trim()) {
            alert('请输入主题名称');
            return;
        }

        const currentTheme = ClockTheme.getCurrentTheme();
        ClockTheme.saveCustomTheme(name.trim(), {
            variables: currentTheme?.variables || {},
            customCss: currentTheme?.customCss || ''
        });

        ClockCore.emit('customThemeCreated', { name: name.trim() });
    }

    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        // 侧边面板开关
        document.getElementById('personalizeBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const panel = document.getElementById('personalizeSidePanel');
            panel?.classList.toggle('active');
        });

        document.getElementById('closePersonalizeSide')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('personalizeSidePanel')?.classList.remove('active');
        });

        // 点击空白处关闭
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('personalizeSidePanel');
            const btn = document.getElementById('personalizeBtn');
            if (panel?.classList.contains('active')) {
                if (!panel.contains(e.target) && !btn.contains(e.target)) {
                    panel.classList.remove('active');
                }
            }
        });
    }

    // 公开API
    return {
        init,
        exportConfig,
        importConfig,
        handleFileDrop,
        importFromDirectory,
        exportToDirectory,
        importThemeFile,
        exportCurrentTheme,
        saveAsCustomTheme
    };
})();
