// ==UserScript==
// @name         跳转到Emby播放
// @namespace    https://github.com/cgkings
// @version      0.0.5
// @description  👆👆👆👆👆👆👆在 ✅JavBus✅Javdb✅Sehuatang 高亮emby存在的视频，并提供标注一键跳转功能
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

    // =====================
    // 核心配置与样式
    // =====================

    // 默认配置
    const DEFAULT_CONFIG = {
        embyAPI: "",
        embyBaseUrl: "",
        highlightColor: "#52b54b",
        maxConcurrentRequests: 50
    };

    // CSS样式（整合所有样式定义）
    const STYLES = `
    .emby-jump-settings-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        padding: 20px;
        z-index: 10000;
        width: 400px;
        max-width: 90%;
        display: none;
    }
    .emby-jump-settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    }
    .emby-jump-settings-close {
        cursor: pointer;
        font-size: 18px;
        color: #999;
    }
    .emby-jump-settings-field {
        margin-bottom: 15px;
    }
    .emby-jump-settings-field label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    .emby-jump-settings-field input, .emby-jump-settings-field select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    }
    .emby-jump-settings-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    }
    .emby-jump-settings-buttons button {
        padding: 8px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .emby-jump-settings-save {
        background-color: #52b54b;
        color: white;
    }
    .emby-jump-settings-cancel {
        background-color: #f0f0f0;
        color: #333;
    }
    .emby-jump-status-indicator {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 9999;
        transition: opacity 0.3s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        max-width: 300px;
        display: flex;
        align-items: center;
        opacity: 1;
    }
    .emby-jump-status-indicator .progress {
        display: inline-block;
        margin-left: 10px;
        width: 100px;
        height: 6px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
    }
    .emby-jump-status-indicator .progress-bar {
        height: 100%;
        background: #52b54b;
        border-radius: 3px;
        transition: width 0.3s;
    }
    .emby-jump-status-indicator.success {
        background-color: rgba(82, 181, 75, 0.9);
    }
    .emby-jump-status-indicator.error {
        background-color: rgba(220, 53, 69, 0.9);
    }
    .emby-jump-status-indicator .close-btn {
        margin-left: 10px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
    }
    `;

    // =====================
    // 辅助函数
    // =====================

    // 简化的DOM选择器函数
    const $ = (selector, context = document) => context.querySelectorAll(selector);
    const $$ = (selector, context = document) => context.querySelector(selector);

    // 从标题中提取番号的辅助函数
    function extractCodesFromTitle(title) {
        if (!title) return [];

        const patterns = [
            /([a-zA-Z]{2,15})[-\s]?(\d{2,15})/i,
            /FC2[-\s]?PPV[-\s]?(\d{6,7})/i
        ];

        const results = [];
        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                if (match[2]) {
                    results.push(`${match[1]}-${match[2]}`);
                } else if (match[1]) {
                    results.push(match[0]);
                }
            }
        }

        return results;
    }

    // 寻找视频项容器
    function findVideoItemContainer(element) {
        let current = element;
        const containerClasses = ['item', 'masonry-brick', 'grid-item', 'movie-list'];

        while (current && current !== document.body) {
            for (const className of containerClasses) {
                if (current.classList && current.classList.contains(className)) {
                    return current;
                }
            }
            current = current.parentElement;
        }

        return element;
    }

    // =====================
    // 配置管理
    // =====================

    // 配置管理类
    class ConfigManager {
        constructor() {
            this.config = this.getConfig();
        }

        getConfig() {
            return {
                embyAPI: GM_getValue('embyAPI', DEFAULT_CONFIG.embyAPI),
                embyBaseUrl: GM_getValue('embyBaseUrl', DEFAULT_CONFIG.embyBaseUrl),
                highlightColor: GM_getValue('highlightColor', DEFAULT_CONFIG.highlightColor),
                maxConcurrentRequests: GM_getValue('maxConcurrentRequests', DEFAULT_CONFIG.maxConcurrentRequests),
            };
        }

        isConfigValid() {
            return !!this.config.embyAPI && !!this.config.embyBaseUrl;
        }

        showSettingsPanel() {
            // 检查是否已存在面板
            let panel = document.getElementById('emby-jump-settings-panel');
            if (panel) {
                panel.style.display = 'block';
                return;
            }

            // 创建设置面板
            panel = document.createElement('div');
            panel.id = 'emby-jump-settings-panel';
            panel.className = 'emby-jump-settings-panel';
            panel.innerHTML = `
                <div class="emby-jump-settings-header">
                    <h3 style="margin: 0;">Emby 设置</h3>
                    <span class="emby-jump-settings-close">&times;</span>
                </div>
 
                <div class="emby-jump-settings-field">
                    <label for="emby-url">Emby 服务器地址</label>
                    <input type="text" id="emby-url" placeholder="例如: http://192.168.1.100:8096/" value="${this.config.embyBaseUrl}">
                    <small style="color:#666;">请确保包含http://或https://前缀和最后的斜杠 /</small>
                </div>
 
                <div class="emby-jump-settings-field">
                    <label for="emby-api">Emby API密钥</label>
                    <input type="text" id="emby-api" placeholder="在Emby设置中获取API密钥" value="${this.config.embyAPI}">
                </div>
 
                <div class="emby-jump-settings-field">
                    <label for="highlight-color">高亮颜色</label>
                    <input type="color" id="highlight-color" value="${this.config.highlightColor}">
                </div>
 
                <div class="emby-jump-settings-field">
                    <label for="max-requests">最大并发请求数</label>
                    <input type="number" id="max-requests" min="1" max="100" value="${this.config.maxConcurrentRequests}">
                    <small style="color:#666;">因为是本地请求，可以设置较大值</small>
                </div>
 
                <div class="emby-jump-settings-buttons">
                    <button class="emby-jump-settings-cancel">取消</button>
                    <button class="emby-jump-settings-save">保存</button>
                </div>
            `;

            document.body.appendChild(panel);

            // 绑定事件
            panel.querySelector('.emby-jump-settings-close').addEventListener('click', () => {
                panel.style.display = 'none';
            });

            panel.querySelector('.emby-jump-settings-cancel').addEventListener('click', () => {
                panel.style.display = 'none';
            });

            panel.querySelector('.emby-jump-settings-save').addEventListener('click', () => {
                const newConfig = {
                    embyBaseUrl: document.getElementById('emby-url').value,
                    embyAPI: document.getElementById('emby-api').value,
                    highlightColor: document.getElementById('highlight-color').value,
                    maxConcurrentRequests: parseInt(document.getElementById('max-requests').value, 10),
                };

                // 验证URL格式
                if (!newConfig.embyBaseUrl.match(/^https?:\/\/.+\/$/)) {
                    alert('请输入有效的Emby服务器地址，包含http://或https://前缀和最后的斜杠 /');
                    return;
                }

                // 保存设置
                for (const [key, value] of Object.entries(newConfig)) {
                    GM_setValue(key, value);
                }

                this.config = newConfig;
                panel.style.display = 'none';
                alert('设置已保存！请刷新页面以应用更改。');
            });

            panel.style.display = 'block';
        }
    }

    // =====================
    // 状态指示器
    // =====================

    // 单例状态指示器
    const statusIndicator = (() => {
        let instance = null;

        class StatusIndicator {
            constructor() {
                this.element = null;
                this.progressBar = null;
                this.timeout = null;
                this.total = 0;
                this.current = 0;
            }

            init() {
                if (this.element) return;

                this.element = document.createElement('div');
                this.element.className = 'emby-jump-status-indicator';
                this.element.innerHTML = `
                    <span class="status-text">准备中...</span>
                    <div class="progress">
                        <div class="progress-bar" style="width: 0%"></div>
                    </div>
                    <span class="close-btn">&times;</span>
                `;
                document.body.appendChild(this.element);
                this.progressBar = this.element.querySelector('.progress-bar');

                // 添加关闭按钮事件
                this.element.querySelector('.close-btn').addEventListener('click', () => this.hide());
            }

            show(message, type = '') {
                this.init();

                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }

                this.element.className = 'emby-jump-status-indicator ' + type;
                this.element.querySelector('.status-text').textContent = message;
                this.element.style.opacity = '1';
            }

            updateProgress(current, total) {
                this.current = current;
                this.total = total;

                const percent = Math.min(Math.round((current / total) * 100), 100);
                this.progressBar.style.width = `${percent}%`;
                this.show(`查询中: ${current}/${total} (${percent}%)`);
            }

            success(message, autoHide = false) {
                this.show(message, 'success');
                if (autoHide) {
                    this.timeout = setTimeout(() => this.hide(), 3000);
                }
            }

            error(message, autoHide = false) {
                this.show(message, 'error');
                if (autoHide) {
                    this.timeout = setTimeout(() => this.hide(), 5000);
                }
            }

            hide() {
                if (!this.element) return;
                this.element.style.opacity = '0';
                this.timeout = setTimeout(() => {
                    if (this.element && this.element.parentNode) {
                        this.element.parentNode.removeChild(this.element);
                    }
                    this.element = null;
                    this.progressBar = null;
                }, 300);
            }

            reset() {
                this.current = 0;
                this.total = 0;
                if (this.progressBar) {
                    this.progressBar.style.width = '0%';
                }
            }
        }

        return {
            getInstance: function () {
                if (!instance) {
                    instance = new StatusIndicator();
                }
                return instance;
            }
        };
    })();

    // =====================
    // 请求队列类
    // =====================

    class RequestQueue {
        constructor(maxConcurrent = 50) {
            this.maxConcurrent = maxConcurrent;
            this.active = 0;
            this.waiting = [];
            this.results = [];
            this.status = statusIndicator.getInstance();
            this.totalRequests = 0;
            this.completedRequests = 0;
        }

        start(requests) {
            this.totalRequests = requests.length;
            this.completedRequests = 0;
            this.results = new Array(this.totalRequests);

            if (this.totalRequests === 0) return Promise.resolve([]);

            this.status.show(`开始查询: 共${this.totalRequests}个项目`);

            return new Promise((resolve) => {
                // 检查是否完成
                const checkComplete = () => {
                    if (this.completedRequests >= this.totalRequests && this.active === 0) {
                        const foundCount = this.results.filter(r => r && r.Items && r.Items.length > 0).length;
                        this.status.success(`查询完成: 找到${foundCount}个匹配项`, false);
                        resolve(this.results);
                    }
                };

                // 处理单个请求
                const processRequest = (index) => {
                    const request = requests[index];
                    this.active++;

                    // 更新进度
                    this.status.updateProgress(this.completedRequests, this.totalRequests);

                    request().then(result => {
                        this.results[index] = result;
                        this.active--;
                        this.completedRequests++;

                        // 处理等待队列中的下一个请求
                        if (this.waiting.length > 0) {
                            const nextIndex = this.waiting.shift();
                            processRequest(nextIndex);
                        }

                        checkComplete();
                    }).catch(error => {
                        console.error('请求错误:', error);
                        this.results[index] = null;
                        this.active--;
                        this.completedRequests++;

                        // 处理等待队列中的下一个请求
                        if (this.waiting.length > 0) {
                            const nextIndex = this.waiting.shift();
                            processRequest(nextIndex);
                        }

                        checkComplete();
                    });
                };

                // 开始处理请求
                for (let i = 0; i < this.totalRequests; i++) {
                    if (this.active < this.maxConcurrent) {
                        processRequest(i);
                    } else {
                        this.waiting.push(i);
                    }
                }
            });
        }
    }

    // =====================
    // Emby API类
    // =====================

    class EmbyAPI {
        constructor(config) {
            this.config = config;
            this.embyCache = new Map();
        }

        // 查询单个番号
        async fetchEmbyData(code) {
            if (!code) return { Items: [] };

            // 检查缓存
            if (this.embyCache.has(code)) {
                return this.embyCache.get(code);
            }

            try {
                const encodedCode = encodeURIComponent(code.trim());
                const url = `${this.config.embyBaseUrl}emby/Users/${this.config.embyAPI}/Items?api_key=${this.config.embyAPI}&Recursive=true&IncludeItemTypes=Movie&SearchTerm=${encodedCode}&Fields=Name,Id,ServerId`;

                const response = await this.makeRequest(url);
                const data = JSON.parse(response.responseText);
                this.embyCache.set(code, data); // 缓存结果
                return data;
            } catch (error) {
                console.error(`查询数据出错 ${code}:`, error);
                return { Items: [] };
            }
        }

        // 通用请求方法
        makeRequest(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    headers: { accept: "application/json" },
                    timeout: 10000, // 10秒超时
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) {
                            resolve(res);
                        } else {
                            reject(new Error(`HTTP错误: ${res.status}`));
                        }
                    },
                    onerror: (e) => {
                        reject(new Error("请求错误"));
                    },
                    ontimeout: () => {
                        reject(new Error("请求超时"));
                    }
                });
            });
        }

        // 批量查询多个番号
        async batchQuery(codes) {
            const requestQueue = new RequestQueue(this.config.maxConcurrentRequests);

            // 创建请求函数数组
            const requests = codes.map(code => {
                return () => this.fetchEmbyData(code);
            });

            // 启动批量查询
            return await requestQueue.start(requests);
        }

        // 插入Emby链接，检查是否已存在类似链接以避免冲突
        insertEmbyLink(targetElement, data) {
            if (!targetElement || !data || !data.Items || data.Items.length === 0) return;

            try {
                const item = data.Items[0];
                const embyUrl = `${this.config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

                // 确保目标元素是DOM元素
                const domElement = targetElement.nodeType ? targetElement : targetElement[0];
                if (!domElement) return;

                // 检查是否已有链接（包括其他脚本可能添加的链接）
                const parentElement = domElement.parentElement || domElement;
                const existingLinks = parentElement.querySelectorAll('a[href*="emby"], a[href*="watch"], a[href*="play"]');
                let container;

                if (existingLinks.length > 0) {
                    // 找到最后一个链接的容器，在其后添加
                    const lastLink = existingLinks[existingLinks.length - 1];
                    container = lastLink.closest('div');

                    // 如果找到容器，检查是否已包含我们的链接
                    if (container) {
                        const existingEmbyLink = container.querySelector(`a[href="${embyUrl}"]`);
                        if (existingEmbyLink) return; // 已存在相同链接，不再添加
                    }
                }

                // 创建链接元素
                const embyLink = document.createElement('div');
                embyLink.style.background = this.config.highlightColor;
                embyLink.style.borderRadius = '3px';
                embyLink.style.padding = '3px 6px';
                embyLink.style.marginTop = '5px';
                embyLink.className = 'emby-jump-link';
                embyLink.innerHTML = `<a href="${embyUrl}" style="color: white; text-decoration: none;" target="_blank"><b>跳转到emby👉</b></a>`;

                // 插入链接
                if (container) {
                    // 在现有容器后添加
                    container.parentNode.insertBefore(embyLink, container.nextSibling);
                } else if (domElement.parentNode) {
                    // 直接在目标元素后添加
                    domElement.parentNode.insertBefore(embyLink, domElement.nextSibling);
                }

                // 高亮视频项
                const videoItem = findVideoItemContainer(domElement);
                if (videoItem) {
                    videoItem.style.borderWidth = "3px";
                    videoItem.style.borderStyle = "solid";
                    videoItem.style.borderColor = this.config.highlightColor;
                    videoItem.style.backgroundColor = this.config.highlightColor + "22";
                }
            } catch (error) {
                console.error('插入Emby链接时出错:', error);
            }
        }
    }

    // =====================
    // 站点处理
    // =====================

    // 处理列表项共用方法
    async function processListItems(items, getCodeFn, getElementFn, api, processedElements) {
        return new Promise(async (resolve) => {
            if (items.length === 0) {
                resolve();
                return;
            }

            const status = statusIndicator.getInstance();
            status.show(`正在收集番号: 共${items.length}个项目`);

            // 收集番号
            const itemsToProcess = [];
            const codes = [];

            Array.from(items).forEach(item => {
                if (processedElements.has(item)) return;
                processedElements.add(item);

                const code = getCodeFn(item);
                const element = getElementFn(item);

                if (code && element) {
                    itemsToProcess.push({ element, code });
                    codes.push(code);
                }
            });

            if (codes.length > 0) {
                const results = await api.batchQuery(codes);

                // 处理结果
                for (let i = 0; i < results.length; i++) {
                    if (i < itemsToProcess.length && results[i] && results[i].Items && results[i].Items.length > 0) {
                        api.insertEmbyLink(itemsToProcess[i].element, results[i]);
                    }
                }
            }

            resolve();
        });
    }

    // 站点处理策略
    const siteStrategies = {
        // JavBus站点
        javbus: {
            detect: () => {
                return window.location.hostname.includes('javbus') ||
                    $$('footer')?.textContent?.includes('JavBus');
            },
            process: async (api, processedElements) => {
                const status = statusIndicator.getInstance();

                // 列表页处理
                const listItems = $('.item.masonry-brick, #waterfall .item');
                await processListItems(listItems,
                    item => $$('.item date', item)?.textContent?.trim(),
                    item => $$('.item date', item),
                    api,
                    processedElements
                );

                // 详情页处理
                const infoElement = $$('.col-md-3.info p');
                if (infoElement) {
                    const spans = infoElement.querySelectorAll('span');
                    if (spans.length > 1) {
                        const code = spans[1].textContent?.trim();
                        if (code) {
                            status.show('查询中...');
                            const data = await api.fetchEmbyData(code);
                            if (data.Items?.length > 0) {
                                api.insertEmbyLink(spans[1], data);
                                status.success('找到匹配项', false);
                            } else {
                                status.error('未找到匹配项', false);
                            }
                        }
                    }
                }
            }
        },

        // JavDB站点
        javdb: {
            detect: () => {
                return window.location.hostname.includes('javdb') ||
                    $$('#footer')?.textContent?.includes('javdb');
            },
            process: async (api, processedElements) => {
                const status = statusIndicator.getInstance();

                // 列表页处理
                const listItems = $('.movie-list .item, .grid-item');
                await processListItems(listItems,
                    item => $$('.video-title strong', item)?.textContent?.trim(),
                    item => $$('.video-title strong', item),
                    api,
                    processedElements
                );

                // 详情页处理
                const detailElement = $$('body > section > div > div.video-detail > h2 > strong') ||
                    $$('.video-detail h2 strong');
                if (detailElement) {
                    const code = detailElement.textContent.trim().split(' ')[0];
                    if (code) {
                        status.show('查询中...');
                        const data = await api.fetchEmbyData(code);
                        if (data.Items?.length > 0) {
                            api.insertEmbyLink(detailElement, data);
                            status.success('找到匹配项', false);
                        } else {
                            status.error('未找到匹配项', false);
                        }
                    }
                }
            }
        },

        // 色花堂论坛
        sehuatang: {
            detect: () => {
                return window.location.hostname.includes('sehuatang') ||
                    $('#flk')?.textContent?.includes('色花堂');
            },
            process: async (api, processedElements) => {
                const status = statusIndicator.getInstance();

                const title = document.title.trim();
                const codes = extractCodesFromTitle(title);

                if (codes.length > 0) {
                    status.show(`找到${codes.length}个可能的番号，开始查询...`);

                    const results = await api.batchQuery(codes);
                    let foundAny = false;

                    for (let i = 0; i < results.length; i++) {
                        const data = results[i];
                        if (data && data.Items && data.Items.length > 0) {
                            const container = $$('#thread_subject') ||
                                $$('h1.ts') ||
                                $$('h1');
                            if (container) {
                                const item = data.Items[0];
                                const embyUrl = `${api.config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

                                const embyLink = document.createElement('div');
                                embyLink.style.background = api.config.highlightColor;
                                embyLink.style.borderRadius = '3px';
                                embyLink.style.padding = '3px 6px';
                                embyLink.style.marginTop = '5px';
                                embyLink.style.marginBottom = '10px';
                                embyLink.innerHTML = `<a href="${embyUrl}" style="color: white; text-decoration: none;" target="_blank"><b>跳转到emby👉</b></a>`;

                                container.parentNode.insertBefore(embyLink, container.nextSibling);
                                foundAny = true;
                            }
                        }
                    }

                    if (foundAny) {
                        status.success('找到匹配项', false);
                    } else {
                        status.error('未找到匹配项', false);
                    }
                }
            }
        }
    };

    // =====================
    // DOM观察器
    // =====================

    // 设置DOM变化观察器，用于处理动态加载的内容
    function setupObserver(api, processedElements) {
        // 已知站点的选择器映射
        const siteSelectors = {
            javbus: '.item.masonry-brick, #waterfall .item',
            javdb: '.movie-list .item, .grid-item',
            sehuatang: ''  // 色花堂主要处理标题，不需要监听动态元素
        };

        // 确定当前站点
        let currentSite = null;
        let selector = '';

        for (const [site, strategy] of Object.entries(siteStrategies)) {
            if (strategy.detect()) {
                currentSite = site;
                selector = siteSelectors[site];
                break;
            }
        }

        // 如果没有有效的选择器，不需要设置观察器
        if (!selector) return;

        // 创建观察器
        const observer = new MutationObserver((mutations) => {
            let newElements = [];

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {  // 元素节点
                            // 检查节点本身是否匹配
                            if (node.matches && node.matches(selector)) {
                                newElements.push(node);
                            }

                            // 检查子节点是否匹配
                            if (node.querySelectorAll) {
                                const matches = node.querySelectorAll(selector);
                                if (matches.length > 0) {
                                    newElements = [...newElements, ...matches];
                                }
                            }
                        }
                    });
                }
            });

            // 处理新添加的元素
            if (newElements.length > 0) {
                // 根据当前站点处理新元素
                if (currentSite === 'javbus') {
                    processListItems(
                        newElements,
                        item => $('.item date', item)?.textContent?.trim(),
                        item => $('.item date', item),
                        api,
                        processedElements
                    );
                } else if (currentSite === 'javdb') {
                    processListItems(
                        newElements,
                        item => $('.video-title strong', item)?.textContent?.trim(),
                        item => $('.video-title strong', item),
                        api,
                        processedElements
                    );
                }
            }
        });

        // 观察整个文档体
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    // =====================
    // 主函数
    // =====================

    async function main() {
        console.log('Emby跳转脚本启动 (优化精简版)');
        const status = statusIndicator.getInstance();
        const processedElements = new WeakSet(); // 使用WeakSet跟踪已处理元素

        // 添加样式
        GM_addStyle(STYLES);

        // 初始化配置管理器
        const configManager = new ConfigManager();

        // 注册菜单命令
        GM_registerMenuCommand("Emby 设置", () => configManager.showSettingsPanel());

        // 检查API配置
        if (!configManager.isConfigValid()) {
            console.log('Emby 配置无效或未设置');
            status.error('配置无效', true);
            setTimeout(() => {
                alert('请先设置您的Emby服务器地址和API密钥');
                configManager.showSettingsPanel();
            }, 500);
            return;
        }

        status.show('正在初始化...');

        // 初始化API
        const api = new EmbyAPI(configManager.config);

        // 识别当前站点并处理
        let siteFound = false;
        for (const [site, strategy] of Object.entries(siteStrategies)) {
            if (strategy.detect()) {
                siteFound = true;
                status.show(`检测到站点: ${site}，开始处理...`);
                await strategy.process(api, processedElements);

                // 设置观察器以处理动态内容
                setupObserver(api, processedElements);
                break;
            }
        }

        if (!siteFound) {
            status.error('未识别到支持的站点', false);
        }
    }

    // 当文档加载完成后启动脚本
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(main, 800));
    } else {
        setTimeout(main, 800);
    }
})();