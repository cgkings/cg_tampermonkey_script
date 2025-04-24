// ==UserScript==
// @name         跳转到Emby播放
// @namespace    https://github.com/cgkings
// @version      0.0.3
// @description  👆👆👆👆👆👆👆在 ✅JavBus✅Javdb✅Sehuatang 高亮emby存在的视频，并提供标注一键跳转功能！！！
// @author       cgkings
// @match        *://www.javbus.com/*
// @match        *://javdb*.com/v/*
// @match        *://javdb*.com/search?q=*
// @match        *://www.javdb.com/*
// @match        *://javdb.com/*
// @match        *://*.sehuatang.*/*
// @match        *://*.sehuatang.net/*
// @match        https://.*/thread-*
// @match        https://.*/forum.php?mod=viewthread&tid=*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-start
// @priority     1
// @license      MIT
// @supportURL   https://github.com/cgkings/cg_tampermonkey_script/issues
// @homepageURL  https://github.com/cgkings/cg_tampermonkey_script
// @icon         data:image/png;base64,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
// @license MIT
// ==/UserScript==

(function () {
    'use strict';

    // 全局配置对象
    const Config = {
        get embyAPI() { return GM_getValue('embyAPI', '') },
        get embyBaseUrl() { return GM_getValue('embyBaseUrl', '') },
        get highlightColor() { return GM_getValue('highlightColor', '#52b54b') },
        get maxConcurrentRequests() { return GM_getValue('maxConcurrentRequests', 50) },
        set embyAPI(val) { GM_setValue('embyAPI', val) },
        set embyBaseUrl(val) { GM_setValue('embyBaseUrl', val) },
        set highlightColor(val) { GM_setValue('highlightColor', val) },
        set maxConcurrentRequests(val) { GM_setValue('maxConcurrentRequests', val) },
        isValid() { return !!this.embyAPI && !!this.embyBaseUrl }
    };

    // 初始化DOM样式
    GM_addStyle(`
        .emby-jump-settings-panel {position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; border-radius:8px; box-shadow:0 0 20px rgba(0,0,0,0.3); padding:20px; z-index:10000; width:400px; max-width:90%; display:none}
        .emby-jump-settings-header {display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #eee}
        .emby-jump-settings-close {cursor:pointer; font-size:18px; color:#999}
        .emby-jump-settings-field {margin-bottom:15px}
        .emby-jump-settings-field label {display:block; margin-bottom:5px; font-weight:bold}
        .emby-jump-settings-field input {width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box}
        .emby-jump-settings-buttons {display:flex; justify-content:flex-end; gap:10px; margin-top:15px}
        .emby-jump-settings-buttons button {padding:8px 15px; border:none; border-radius:4px; cursor:pointer}
        .emby-jump-settings-save {background-color:#52b54b; color:white}
        .emby-jump-settings-cancel {background-color:#f0f0f0; color:#333}
        .emby-jump-status-indicator {position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.7); color:white; padding:8px 12px; border-radius:4px; font-size:14px; z-index:9999; transition:opacity 0.3s; box-shadow:0 2px 8px rgba(0,0,0,0.2); max-width:300px; display:flex; align-items:center; opacity:0}
        .emby-jump-status-indicator .progress {display:inline-block; margin-left:10px; width:100px; height:6px; background:rgba(255,255,255,0.3); border-radius:3px}
        .emby-jump-status-indicator .progress-bar {height:100%; background:#52b54b; border-radius:3px; transition:width 0.3s}
        .emby-jump-status-indicator.success {background-color:rgba(82,181,75,0.9)}
        .emby-jump-status-indicator.error {background-color:rgba(220,53,69,0.9)}
        .emby-jump-status-indicator .close-btn {margin-left:10px; cursor:pointer; font-size:16px; font-weight:bold}
    `);

    // 单例状态指示器
    const Status = (() => {
        let el, bar, timeout;
        const debounce = (fn, ms) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), ms);
            };
        };

        // 创建UI
        const createUI = () => {
            if (el) return;
            el = document.createElement('div');
            el.className = 'emby-jump-status-indicator';
            el.innerHTML = `<span class="status-text">准备中...</span><div class="progress"><div class="progress-bar"></div></div><span class="close-btn">&times;</span>`;
            document.body.appendChild(el);
            bar = el.querySelector('.progress-bar');
            el.querySelector('.close-btn').addEventListener('click', hide);
        };

        // 显示消息
        const show = (msg, type = '') => {
            createUI();
            if (timeout) clearTimeout(timeout);
            el.className = 'emby-jump-status-indicator ' + type;
            el.querySelector('.status-text').textContent = msg;
            el.style.opacity = '1';
        };

        // 隐藏
        const hide = () => {
            if (!el) return;
            el.style.opacity = '0';
            timeout = setTimeout(() => {
                if (el && el.parentNode) el.parentNode.removeChild(el);
                el = bar = null;
            }, 300);
        };

        // 更新进度
        const updateProgress = (current, total) => {
            const percent = Math.min(Math.round((current / total) * 100), 100);
            if (bar) bar.style.width = `${percent}%`;
            show(`查询中: ${current}/${total} (${percent}%)`);
        };

        return {
            show,
            success: (msg, autoHide) => { show(msg, 'success'); if (autoHide) setTimeout(hide, 3000); },
            error: (msg, autoHide) => { show(msg, 'error'); if (autoHide) setTimeout(hide, 5000); },
            updateProgress,
            updateProgressDebounced: debounce(updateProgress, 100),
            hide
        };
    })();

    // 设置面板
    const SettingsUI = {
        show() {
            let panel = document.getElementById('emby-jump-settings-panel');
            if (panel) { panel.style.display = 'block'; return; }

            panel = document.createElement('div');
            panel.id = 'emby-jump-settings-panel';
            panel.className = 'emby-jump-settings-panel';
            panel.innerHTML = `
                <div class="emby-jump-settings-header">
                    <h3 style="margin:0">Emby 设置</h3>
                    <span class="emby-jump-settings-close">&times;</span>
                </div>
                <div class="emby-jump-settings-field">
                    <label for="emby-url">Emby 服务器地址</label>
                    <input type="text" id="emby-url" placeholder="例如: http://192.168.1.100:8096/" value="${Config.embyBaseUrl}">
                    <small style="color:#666">请确保包含http://或https://前缀和最后的斜杠 /</small>
                </div>
                <div class="emby-jump-settings-field">
                    <label for="emby-api">Emby API密钥</label>
                    <input type="text" id="emby-api" placeholder="在Emby设置中获取API密钥" value="${Config.embyAPI}">
                </div>
                <div class="emby-jump-settings-field">
                    <label for="highlight-color">高亮颜色</label>
                    <input type="color" id="highlight-color" value="${Config.highlightColor}">
                </div>
                <div class="emby-jump-settings-field">
                    <label for="max-requests">最大并发请求数</label>
                    <input type="number" id="max-requests" min="1" max="100" value="${Config.maxConcurrentRequests}">
                    <small style="color:#666">因为是本地请求，可以设置较大值</small>
                </div>
                <div class="emby-jump-settings-buttons">
                    <button class="emby-jump-settings-cancel">取消</button>
                    <button class="emby-jump-settings-save">保存</button>
                </div>
            `;

            document.body.appendChild(panel);

            // 绑定事件
            const closePanel = () => panel.style.display = 'none';
            panel.querySelector('.emby-jump-settings-close').addEventListener('click', closePanel);
            panel.querySelector('.emby-jump-settings-cancel').addEventListener('click', closePanel);
            panel.querySelector('.emby-jump-settings-save').addEventListener('click', () => {
                const url = document.getElementById('emby-url').value;
                if (!url.match(/^https?:\/\/.+\/$/)) {
                    alert('请输入有效的Emby服务器地址，包含http://或https://前缀和最后的斜杠 /');
                    return;
                }

                Config.embyBaseUrl = url;
                Config.embyAPI = document.getElementById('emby-api').value;
                Config.highlightColor = document.getElementById('highlight-color').value;
                Config.maxConcurrentRequests = parseInt(document.getElementById('max-requests').value, 10);

                closePanel();
                alert('设置已保存！请刷新页面以应用更改。');
            });

            panel.style.display = 'block';
        }
    };

    // Emby API和请求控制
    class EmbyAPI {
        constructor() {
            this.active = 0;
            this.waiting = [];
            this.total = 0;
            this.completed = 0;
        }

        // 查询单个番号
        async fetchData(code) {
            if (!code) return { Items: [] };

            try {
                const url = `${Config.embyBaseUrl}emby/Users/${Config.embyAPI}/Items?api_key=${Config.embyAPI}&Recursive=true&IncludeItemTypes=Movie&SearchTerm=${encodeURIComponent(code.trim())}&Fields=Name,Id,ServerId`;
                const response = await this.request(url);
                const data = JSON.parse(response.responseText);
                return data;
            } catch (error) {
                console.error(`查询数据出错 ${code}:`, error);
                return { Items: [] };
            }
        }

        // 批量查询
        async batchQuery(codes) {
            if (!codes || codes.length === 0) return [];

            this.total = codes.length;
            this.completed = 0;
            const results = new Array(this.total);

            return new Promise(resolve => {
                const checkComplete = () => {
                    if (this.completed >= this.total && this.active === 0) {
                        const found = results.filter(r => r?.Items?.length > 0).length;
                        Status.success(`查询完成: 找到${found}个匹配项`, false);
                        resolve(results);
                    }
                };

                const processRequest = (index) => {
                    const code = codes[index];
                    this.active++;
                    Status.updateProgressDebounced(this.completed, this.total);

                    this.fetchData(code).then(result => {
                        results[index] = result;
                        this.active--;
                        this.completed++;

                        if (this.waiting.length > 0) {
                            processRequest(this.waiting.shift());
                        }

                        checkComplete();
                    }).catch(() => {
                        results[index] = null;
                        this.active--;
                        this.completed++;

                        if (this.waiting.length > 0) {
                            processRequest(this.waiting.shift());
                        }

                        checkComplete();
                    });
                };

                for (let i = 0; i < this.total; i++) {
                    if (this.active < Config.maxConcurrentRequests) {
                        processRequest(i);
                    } else {
                        this.waiting.push(i);
                    }
                }
            });
        }

        // 通用请求方法
        request(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url,
                    headers: { accept: "application/json" },
                    timeout: 10000,
                    onload: res => res.status >= 200 && res.status < 300 ? resolve(res) : reject(new Error(`HTTP错误: ${res.status}`)),
                    onerror: () => reject(new Error("请求错误")),
                    ontimeout: () => reject(new Error("请求超时"))
                });
            });
        }

        // 创建Emby链接元素
        createLink(data) {
            if (!data?.Items?.length) return null;

            const item = data.Items[0];
            const embyUrl = `${Config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

            const el = document.createElement('div');
            el.style.cssText = `background:${Config.highlightColor};border-radius:3px;padding:3px 6px;margin-top:5px;margin-bottom:3px`;
            el.className = 'emby-jump-link';
            el.innerHTML = `<a href="${embyUrl}" style="color:white;text-decoration:none" target="_blank"><b>跳转到emby👉</b></a>`;

            return el;
        }

        // 高亮视频项
        highlightItem(element) {
            let current = element;
            const containerClasses = ['item', 'masonry-brick', 'grid-item', 'movie-list'];

            while (current && current !== document.body) {
                for (const className of containerClasses) {
                    if (current.classList?.contains(className)) {
                        current.style.cssText += `border:3px solid ${Config.highlightColor};background-color:${Config.highlightColor}22`;
                        return current;
                    }
                }
                current = current.parentElement;
            }

            return null;
        }
    }

    // 站点处理器基类
    const BaseProcessor = {
        init(api) {
            this.api = api;
            this.processed = new WeakSet();
            return this;
        },

        // 处理列表项
        async processItems(items) {
            if (!items?.length) return;

            Status.show(`正在收集番号: 共${items.length}个项目`);

            // 收集番号
            const toProcess = [];
            const codes = [];

            for (const item of items) {
                if (this.processed.has(item)) continue;
                this.processed.add(item);

                const code = this.extractCode(item);
                const element = this.getElement(item);

                if (code && element) {
                    toProcess.push({ element, code });
                    codes.push(code);
                }
            }

            if (codes.length > 0) {
                const results = await this.api.batchQuery(codes);
                const processedElements = [];

                // 处理结果
                for (let i = 0; i < results.length; i++) {
                    if (i < toProcess.length && results[i]?.Items?.length > 0) {
                        const { element } = toProcess[i];
                        const link = this.api.createLink(results[i]);

                        if (link) {
                            const target = element.parentNode || element;
                            this.api.highlightItem(element);

                            processedElements.push({
                                target,
                                link,
                                position: element.nextSibling
                            });
                        }
                    }
                }

                // 批量插入DOM
                requestAnimationFrame(() => {
                    processedElements.forEach(({ target, link, position }) => {
                        target.insertBefore(link, position);
                    });
                });
            }
        },

        // 主处理函数
        async process() {
            const items = document.querySelectorAll(this.listSelector);
            if (items.length > 0) await this.processItems(items);
            await this.processDetailPage();
            this.setupObserver();
        },

        // 观察器设置
        setupObserver() {
            let pending = [];
            let timer = null;

            const processMutations = () => {
                const newElements = [];

                for (const mutation of pending) {
                    if (mutation.type === 'childList') {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType !== 1) continue;

                            if (node.matches?.(this.listSelector)) {
                                newElements.push(node);
                            }

                            if (node.querySelectorAll) {
                                node.querySelectorAll(this.listSelector).forEach(el => {
                                    newElements.push(el);
                                });
                            }
                        }
                    }
                }

                if (newElements.length > 0) {
                    this.processItems(newElements);
                }

                pending = [];
                timer = null;
            };

            new MutationObserver(mutations => {
                pending.push(...mutations);
                if (!timer) timer = setTimeout(processMutations, 300);
            }).observe(document.body, { childList: true, subtree: true });
        }
    };

    // 站点处理器
    const Processors = {
        javbus: Object.assign(Object.create(BaseProcessor), {
            listSelector: '.item.masonry-brick, #waterfall .item',
            extractCode: item => item.querySelector('.item date')?.textContent?.trim(),
            getElement: item => item.querySelector('.item date'),

            async processDetailPage() {
                const infoElement = document.querySelector('.col-md-3.info p');
                if (!infoElement) return;

                const spans = infoElement.querySelectorAll('span');
                if (spans.length > 1) {
                    const code = spans[1].textContent?.trim();
                    if (code) {
                        Status.show('查询中...');
                        const data = await this.api.fetchData(code);
                        if (data.Items?.length > 0) {
                            const link = this.api.createLink(data);
                            if (link) {
                                spans[1].parentNode.insertBefore(link, spans[1].nextSibling);
                                Status.success('找到匹配项', false);
                            }
                        } else {
                            Status.error('未找到匹配项', false);
                        }
                    }
                }
            }
        }),

        javdb: Object.assign(Object.create(BaseProcessor), {
            listSelector: '.movie-list .item, .grid-item',
            extractCode: item => item.querySelector('.video-title strong')?.textContent?.trim(),
            getElement: item => item.querySelector('.video-title strong'),

            async processDetailPage() {
                const detailElement = document.querySelector('body > section > div > div.video-detail > h2 > strong') ||
                    document.querySelector('.video-detail h2 strong');

                if (!detailElement) return;

                const code = detailElement.textContent.trim().split(' ')[0];
                if (code) {
                    Status.show('查询中...');
                    const data = await this.api.fetchData(code);
                    if (data.Items?.length > 0) {
                        const link = this.api.createLink(data);
                        if (link) {
                            detailElement.parentNode.insertBefore(link, detailElement.nextSibling);
                            Status.success('找到匹配项', false);
                        }
                    } else {
                        Status.error('未找到匹配项', false);
                    }
                }
            }
        }),

        sehuatang: Object.assign(Object.create(BaseProcessor), {
            listSelector: '',

            async process() {
                const title = document.title.trim();
                const codes = this.extractCodes(title);

                if (codes.length > 0) {
                    Status.show(`找到${codes.length}个可能的番号，开始查询...`);

                    const results = await this.api.batchQuery(codes);
                    let foundAny = false;

                    for (const data of results) {
                        if (data?.Items?.length > 0) {
                            const container = document.querySelector('#thread_subject') ||
                                document.querySelector('h1.ts') ||
                                document.querySelector('h1');

                            if (container) {
                                const link = this.api.createLink(data);
                                if (link) {
                                    container.parentNode.insertBefore(link, container.nextSibling);
                                    foundAny = true;
                                }
                            }
                        }
                    }

                    if (foundAny) Status.success('找到匹配项', false);
                    else Status.error('未找到匹配项', false);
                }
            },

            extractCodes(title) {
                if (!title) return [];

                const patterns = [
                    /([a-zA-Z]{2,15})[-\s]?(\d{2,15})/i,
                    /FC2[-\s]?PPV[-\s]?(\d{6,7})/i
                ];

                const results = [];
                for (const pattern of patterns) {
                    const match = title.match(pattern);
                    if (match) {
                        if (match[2]) results.push(`${match[1]}-${match[2]}`);
                        else if (match[1]) results.push(match[0]);
                    }
                }

                return results;
            }
        })
    };

    // 站点检测
    function detectSite() {
        if (location.hostname.includes('javbus') || document.querySelector('footer')?.textContent?.includes('JavBus')) {
            return 'javbus';
        }

        if (location.hostname.includes('javdb') || document.querySelector('#footer')?.textContent?.includes('javdb')) {
            return 'javdb';
        }

        if (location.hostname.includes('sehuatang') || document.querySelector('#flk')?.textContent?.includes('色花堂')) {
            return 'sehuatang';
        }

        return null;
    }

    // 主函数
    async function main() {
        console.log('Emby跳转脚本启动 (极简版)');

        // 注册菜单命令
        GM_registerMenuCommand("Emby 设置", () => SettingsUI.show());

        // 检查API配置
        if (!Config.isValid()) {
            Status.error('配置无效', true);
            setTimeout(() => {
                alert('请先设置您的Emby服务器地址和API密钥');
                SettingsUI.show();
            }, 500);
            return;
        }

        Status.show('正在初始化...');

        // 检测当前站点
        const site = detectSite();
        if (!site) {
            Status.error('未识别到支持的站点', false);
            return;
        }

        Status.show(`检测到站点: ${site}，开始处理...`);

        // 创建并执行站点处理器
        const processor = Processors[site].init(new EmbyAPI());
        if (processor) await processor.process();
    }

    // 页面加载完成后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
})();