// ==UserScript==
// @name         Emby增强助手-精简版
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  番号识别+媒体信息获取+路径复制，代码精简版
// @author       You
// @match        *://*/web/index.html*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 配置
    const DEFAULT_POS = { top: '120px', right: '20px' };
    const PANEL_STYLE = 'position:fixed;background:rgba(0,0,0,0.85);border-radius:8px;padding:12px;min-width:300px;height:40px;box-shadow:0 4px 12px rgba(0,0,0,0.5);z-index:10000;cursor:move;user-select:none;display:flex;flex-direction:column;justify-content:center;gap:8px;';

    // 工具函数
    function getApiClient() {
        return (typeof ApiClient !== 'undefined') ? ApiClient : window.ApiClient;
    }

    function extractItemId() {
        const match = /id=([^&]+)/.exec(window.location.hash);
        return match ? match[1] : null;
    }

    function extractCode(title) {
        if (!title) return null;
        const patterns = [
            /([a-zA-Z]{2,15})[-\s]?(\d{2,15})/i,
            /(FC2)[-\s]?(PPV)[-\s]?(\d{6,7})/i,
            /([A-Z]{3,6}\d{3,4})/,
            /([a-zA-Z0-9]+-\d+)/i
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                if (match[0].toLowerCase().includes('fc2')) {
                    return 'FC2-PPV-' + match[3];
                }
                return match[0].replace(/\s+/g, '-').toUpperCase();
            }
        }
        return null;
    }

    function processPath(path) {
        if (!path) return '未知路径';

        console.log('processPath 输入:', path);

        try {
            // 直接使用标准的路径处理方法
            // path.replace(/[^\\\/]*$/, '') 会移除最后一个斜杠后的所有内容（即文件名）
            let folderPath = path.replace(/[^\\\/]*$/, '');

            // 移除末尾的斜杠
            if (folderPath.endsWith('\\') || folderPath.endsWith('/')) {
                folderPath = folderPath.slice(0, -1);
            }

            console.log('processPath 输出:', folderPath);
            return folderPath;

        } catch (e) {
            console.error('路径处理失败:', e);
            return path;
        }
    }

    // 位置管理
    function savePosition(pos) {
        try {
            localStorage.setItem('emby-helper-pos', JSON.stringify(pos));
        } catch (e) { }
    }

    function loadPosition() {
        try {
            const saved = localStorage.getItem('emby-helper-pos');
            return saved ? JSON.parse(saved) : DEFAULT_POS;
        } catch (e) {
            return DEFAULT_POS;
        }
    }

    function makeDraggable(el) {
        let isDragging = false, startX, startY, startLeft, startTop;

        el.onmousedown = (e) => {
            if (e.target.classList.contains('clickable') || e.target.tagName === 'BUTTON') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = el.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            e.preventDefault();
        };

        document.onmousemove = (e) => {
            if (!isDragging) return;
            const newLeft = Math.max(0, Math.min(startLeft + e.clientX - startX, window.innerWidth - el.offsetWidth));
            const newTop = Math.max(0, Math.min(startTop + e.clientY - startY, window.innerHeight - el.offsetHeight));
            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';
            el.style.right = 'auto';
        };

        document.onmouseup = () => {
            if (!isDragging) return;
            isDragging = false;
            const rect = el.getBoundingClientRect();
            savePosition({ left: rect.left + 'px', top: rect.top + 'px' });
        };
    }

    // 复制功能
    function copyText(text, el) {
        const copy = async () => {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
        };

        copy().then(() => {
            const orig = el.style.backgroundColor;
            el.style.backgroundColor = '#4caf50';
            el.style.transition = 'background-color 0.3s';
            setTimeout(() => el.style.backgroundColor = orig, 1000);
        }).catch(() => {
            const orig = el.style.backgroundColor;
            el.style.backgroundColor = '#f44336';
            setTimeout(() => el.style.backgroundColor = orig, 1000);
        });
    }

    // 获取数据
    async function getItemData(itemId) {
        const api = getApiClient();
        if (!api) throw new Error('API不可用');

        const userId = api._serverInfo ? api._serverInfo.UserId : api.getCurrentUserId();
        const item = await api.getItem(userId, itemId);

        const code = extractCode(item.Name) || extractCode(item.OriginalTitle) || extractCode(item.SortName);

        return {
            code,
            path: item.Path,
            processedPath: processPath(item.Path),
            name: item.Name,
            item
        };
    }

    async function getMediaInfo(itemId) {
        const api = getApiClient();
        const playback = await api.getPlaybackInfo(itemId, {});
        const data = await getItemData(itemId);
        return { playback, item: data.item };
    }

    // 媒体信息对话框
    function showMediaDialog(media) {
        const existing = document.getElementById('media-dialog');
        if (existing) existing.remove();

        const dialog = document.createElement('div');
        dialog.id = 'media-dialog';
        dialog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:20px;border-radius:8px;max-width:80%;max-height:80%;overflow-y:auto;z-index:20000;';

        const source = media.playback.MediaSources?.[0] || {};
        let video = '未知', audio = '未知', subs = '';

        if (source.MediaStreams) {
            source.MediaStreams.forEach(s => {
                if (s.Type === 'Video') {
                    video = `${s.Codec || '?'} (${s.Width || '?'}x${s.Height || '?'})`;
                } else if (s.Type === 'Audio') {
                    audio = `${s.Codec || '?'} (${s.Channels || '?'}声道)`;
                } else if (s.Type === 'Subtitle') {
                    subs += (subs ? '<br>' : '') + `· ${s.Language || '?'} (${s.Codec || '?'})`;
                }
            });
        }

        dialog.innerHTML = `
            <h3>媒体信息</h3>
            <p><b>名称:</b> ${media.item.Name || '?'}</p>
            <p><b>路径:</b> ${source.Path || '?'}</p>
            <p><b>容器:</b> ${source.Container || '?'}</p>
            <p><b>视频:</b> ${video}</p>
            <p><b>音频:</b> ${audio}</p>
            ${subs ? `<p><b>字幕:</b><br>${subs}</p>` : ''}
            <button onclick="this.parentElement.remove()" style="padding:8px 15px;background:#607D8B;border:none;border-radius:4px;color:white;cursor:pointer;">关闭</button>
        `;

        document.body.appendChild(dialog);
    }

    // 创建面板
    function createPanel(data) {
        const panel = document.createElement('div');
        panel.className = 'emby-helper-panel';

        const pos = loadPosition();
        let style = PANEL_STYLE;
        Object.entries(pos).forEach(([k, v]) => style += `${k}:${v};`);
        panel.style.cssText = style;

        const sites = [
            { name: 'JavDB', url: 'https://javdb.com/search?q=', color: '#96ceb4' },
            { name: 'SupJAV', url: 'https://supjav.com/zh/?s=', color: '#ff6b6b' },
            { name: 'SubtitleCat', url: 'https://www.subtitlecat.com/index.php?search=', color: '#45b7d1' }
        ];

        // 信息行
        const info = document.createElement('div');
        info.style.cssText = 'display:flex;align-items:center;font-size:12px;gap:15px;margin:0;padding:0;';

        const codeEl = document.createElement('div');
        codeEl.style.cssText = 'margin:0;padding:0;';
        codeEl.innerHTML = data.code ?
            `<span style="color:#ccc;">番号:</span> <span class="clickable" style="color:#4fc3f7;cursor:pointer;text-decoration:underline;">${data.code}</span>` :
            `<span style="color:#ccc;">番号: 未检测到</span>`;

        const pathEl = document.createElement('div');
        pathEl.style.cssText = 'flex:1;min-width:0;margin:0;padding:0;';
        pathEl.innerHTML = `<span style="color:#ccc;">路径:</span> <span class="clickable" style="color:#81c784;cursor:pointer;text-decoration:underline;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${data.processedPath}">${data.processedPath}</span>`;

        info.appendChild(codeEl);
        info.appendChild(pathEl);

        // 按钮行
        const buttons = document.createElement('div');
        buttons.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:0;padding:0;';

        // 统一的按钮样式
        const buttonStyle = 'display:inline-block;padding:4px 8px;color:white;text-decoration:none;border-radius:3px;font-size:11px;cursor:pointer;border:none;box-sizing:border-box;line-height:1.2;height:24px;text-align:center;vertical-align:middle;';

        // 站点链接
        if (data.code) {
            sites.forEach(site => {
                const link = document.createElement('a');
                link.href = site.url + encodeURIComponent(data.code);
                link.target = '_blank';
                link.textContent = site.name;
                link.style.cssText = buttonStyle + `background:${site.color};`;
                link.onmouseover = () => link.style.opacity = '0.8';
                link.onmouseout = () => link.style.opacity = '1';
                buttons.appendChild(link);
            });
        }

        // Media Info按钮
        const mediaBtn = document.createElement('button');
        mediaBtn.textContent = 'Media Info';
        mediaBtn.style.cssText = buttonStyle + 'background:#9c27b0;';
        mediaBtn.onmouseover = () => mediaBtn.style.opacity = '0.8';
        mediaBtn.onmouseout = () => mediaBtn.style.opacity = '1';
        mediaBtn.onclick = async () => {
            try {
                const media = await getMediaInfo(extractItemId());
                showMediaDialog(media);
            } catch (e) {
                alert('获取媒体信息失败: ' + e.message);
            }
        };
        buttons.appendChild(mediaBtn);

        panel.appendChild(info);
        panel.appendChild(buttons);

        // 事件绑定
        setTimeout(() => {
            makeDraggable(panel);

            const codeSpan = panel.querySelector('.clickable');
            if (codeSpan && data.code) {
                codeSpan.onclick = () => copyText(data.code, codeSpan);
            }

            const pathSpan = pathEl.querySelector('.clickable');
            if (pathSpan) {
                pathSpan.onclick = () => copyText(data.processedPath, pathSpan);
            }
        }, 0);

        return panel;
    }

    // 主逻辑
    async function addPanel() {
        if (document.querySelector('.emby-helper-panel')) return;

        const itemId = extractItemId();
        if (!itemId) return;

        try {
            const data = await getItemData(itemId);
            const panel = createPanel(data);
            document.body.appendChild(panel);
        } catch (e) {
            console.error('添加面板失败:', e);
        }
    }

    let lastUrl = location.href;
    function handleChange() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            const existing = document.querySelector('.emby-helper-panel');
            if (existing) existing.remove();

            if (location.hash.includes('id=')) {
                setTimeout(addPanel, 800);
            }
        }
    }

    // 初始化
    function init() {
        console.log('Emby增强助手已启动');

        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                setTimeout(handleChange, 100);
            }
        }).observe(document, { subtree: true, childList: true });

        setInterval(() => {
            if (location.hash.includes('id=') && !document.querySelector('.emby-helper-panel')) {
                addPanel();
            }
        }, 3000);

        setTimeout(addPanel, 1500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }

})();