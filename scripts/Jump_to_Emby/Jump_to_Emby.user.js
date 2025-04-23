// ==UserScript==
// @name         跳转到Emby播放
// @namespace    https://github.com/cgkings
// @version      0.0.2
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
// @license MIT
// ==/UserScript==

// 默认配置
const DEFAULT_CONFIG = {
    embyAPI: "",
    embyBaseUrl: "http://localhost:8096/",
    highlightColor: "#52b54b",
    maxConcurrentRequests: 50, // 并发请求数
};

// 获取用户配置或使用默认值
function getConfig() {
    return {
        embyAPI: GM_getValue('embyAPI', DEFAULT_CONFIG.embyAPI),
        embyBaseUrl: GM_getValue('embyBaseUrl', DEFAULT_CONFIG.embyBaseUrl),
        highlightColor: GM_getValue('highlightColor', DEFAULT_CONFIG.highlightColor),
        maxConcurrentRequests: GM_getValue('maxConcurrentRequests', DEFAULT_CONFIG.maxConcurrentRequests),
    };
}

// 添加UI样式
GM_addStyle(`
.emby-settings-panel {
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
.emby-settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}
.emby-settings-close {
    cursor: pointer;
    font-size: 18px;
    color: #999;
}
.emby-settings-field {
    margin-bottom: 15px;
}
.emby-settings-field label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}
.emby-settings-field input, .emby-settings-field select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
}
.emby-settings-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
}
.emby-settings-buttons button {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
.emby-settings-save {
    background-color: #52b54b;
    color: white;
}
.emby-settings-cancel {
    background-color: #f0f0f0;
    color: #333;
}
 
/* 状态指示器样式 */
.emby-status-indicator {
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
.emby-status-indicator .progress {
    display: inline-block;
    margin-left: 10px;
    width: 100px;
    height: 6px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
}
.emby-status-indicator .progress-bar {
    height: 100%;
    background: #52b54b;
    border-radius: 3px;
    transition: width 0.3s;
}
.emby-status-indicator.success {
    background-color: rgba(82, 181, 75, 0.9);
}
.emby-status-indicator.error {
    background-color: rgba(220, 53, 69, 0.9);
}
`);

// 创建设置面板
function createSettingsPanel() {
    const config = getConfig();

    // 检查是否已存在面板
    let panel = document.getElementById('emby-settings-panel');
    if (panel) {
        panel.style.display = 'block';
        return;
    }

    // 创建设置面板
    panel = document.createElement('div');
    panel.id = 'emby-settings-panel';
    panel.className = 'emby-settings-panel';
    panel.innerHTML = `
        <div class="emby-settings-header">
            <h3 style="margin: 0;">Emby 设置</h3>
            <span class="emby-settings-close">&times;</span>
        </div>
 
        <div class="emby-settings-field">
            <label for="emby-url">Emby 服务器地址</label>
            <input type="text" id="emby-url" placeholder="例如: http://192.168.1.100:8096/" value="${config.embyBaseUrl}">
            <small style="color:#666;">请确保包含http://或https://前缀和最后的斜杠 /</small>
        </div>
 
        <div class="emby-settings-field">
            <label for="emby-api">Emby API密钥</label>
            <input type="text" id="emby-api" placeholder="在Emby设置中获取API密钥" value="${config.embyAPI}">
        </div>
 
        <div class="emby-settings-field">
            <label for="highlight-color">高亮颜色</label>
            <input type="color" id="highlight-color" value="${config.highlightColor}">
        </div>
 
        <div class="emby-settings-field">
            <label for="max-requests">最大并发请求数</label>
            <input type="number" id="max-requests" min="1" max="100" value="${config.maxConcurrentRequests}">
            <small style="color:#666;">因为是本地请求，可以设置较大值</small>
        </div>
 
        <div class="emby-settings-buttons">
            <button class="emby-settings-cancel">取消</button>
            <button class="emby-settings-save">保存</button>
        </div>
    `;

    document.body.appendChild(panel);

    // 绑定事件
    panel.querySelector('.emby-settings-close').addEventListener('click', () => {
        panel.style.display = 'none';
    });

    panel.querySelector('.emby-settings-cancel').addEventListener('click', () => {
        panel.style.display = 'none';
    });

    panel.querySelector('.emby-settings-save').addEventListener('click', () => {
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

        panel.style.display = 'none';
        alert('设置已保存！请刷新页面以应用更改。');
    });

    panel.style.display = 'block';
}

// 注册菜单命令
GM_registerMenuCommand("Emby 设置", createSettingsPanel);

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
            this.element.className = 'emby-status-indicator';
            this.element.innerHTML = `
                <span class="status-text">准备中...</span>
                <div class="progress">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            `;
            document.body.appendChild(this.element);
            this.progressBar = this.element.querySelector('.progress-bar');
        }

        show(message, type = '') {
            this.init();

            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }

            this.element.className = 'emby-status-indicator ' + type;
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

        success(message, autoHide = true) {
            this.show(message, 'success');
            if (autoHide) {
                this.timeout = setTimeout(() => this.hide(), 3000);
            }
        }

        error(message, autoHide = true) {
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

(function () {
    'use strict';

    // 简化的DOM选择器函数
    const $ = (selector, context = document) => {
        return context.querySelectorAll(selector);
    };

    // 单个元素选择器
    const $$ = (selector, context = document) => {
        return context.querySelector(selector);
    };

    // 配置和缓存
    const config = getConfig();
    const embyCache = new Map(); // 缓存Emby查询结果
    const processedElements = new WeakSet(); // 使用WeakSet跟踪已处理元素

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

    // 请求队列类
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
                        this.status.success(`查询完成: 找到${foundCount}个匹配项`, true);
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

    // Emby API类
    class EmbyAPI {
        constructor() {
            this.config = config;
        }

        // 查询单个番号
        async fetchEmbyData(code) {
            if (!code) return { Items: [] };

            // 检查缓存
            if (embyCache.has(code)) {
                return embyCache.get(code);
            }

            try {
                const encodedCode = encodeURIComponent(code.trim());
                const url = `${this.config.embyBaseUrl}emby/Users/${this.config.embyAPI}/Items?api_key=${this.config.embyAPI}&Recursive=true&IncludeItemTypes=Movie&SearchTerm=${encodedCode}&Fields=Name,Id,ServerId`;

                const response = await this.makeRequest(url);
                const data = JSON.parse(response.responseText);
                embyCache.set(code, data); // 缓存结果
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

        // 插入Emby链接
        insertEmbyLink(targetElement, data) {
            if (!targetElement || !data || !data.Items || data.Items.length === 0) return;

            try {
                const item = data.Items[0];
                const embyUrl = `${this.config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

                // 确保目标元素是DOM元素
                const domElement = targetElement.nodeType ? targetElement : targetElement[0];
                if (!domElement) return;

                // 检查是否已有链接
                const parentElement = domElement.parentElement || domElement;
                if (parentElement.querySelector && parentElement.querySelector(`a[href="${embyUrl}"]`)) {
                    return;
                }

                // 创建链接元素
                const embyLink = document.createElement('div');
                embyLink.style.background = this.config.highlightColor;
                embyLink.style.borderRadius = '3px';
                embyLink.style.padding = '3px 6px';
                embyLink.style.marginTop = '5px';
                embyLink.innerHTML = `<a href="${embyUrl}" style="color: white; text-decoration: none;" target="_blank"><b>跳转到emby👉</b></a>`;

                // 插入链接
                if (domElement.parentNode) {
                    domElement.parentNode.insertBefore(embyLink, domElement.nextSibling);

                    // 高亮视频项
                    const videoItem = findVideoItemContainer(domElement);
                    if (videoItem) {
                        videoItem.style.borderWidth = "3px";
                        videoItem.style.borderStyle = "solid";
                        videoItem.style.borderColor = this.config.highlightColor;
                        videoItem.style.backgroundColor = this.config.highlightColor + "22";
                    }
                }
            } catch (error) {
                console.error('插入Emby链接时出错:', error);
            }
        }
    }

    // 处理站点的共用方法
    function processListItems(items, getCodeFn, getElementFn, api) {
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
            process: async (api) => {
                const status = statusIndicator.getInstance();

                // 列表页处理
                const listItems = $('.item.masonry-brick, #waterfall .item');
                await processListItems(listItems,
                    item => $$('.item date', item)?.textContent?.trim(),
                    item => $$('.item date', item),
                    api
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
                                status.success('找到匹配项');
                            } else {
                                status.error('未找到匹配项');
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
            process: async (api) => {
                const status = statusIndicator.getInstance();

                // 列表页处理
                const listItems = $('.movie-list .item, .grid-item');
                await processListItems(listItems,
                    item => $$('.video-title strong', item)?.textContent?.trim(),
                    item => $$('.video-title strong', item),
                    api
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
                            status.success('找到匹配项');
                        } else {
                            status.error('未找到匹配项');
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
            process: async (api) => {
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
                                api.insertEmbyLink(container, data);
                                foundAny = true;
                            }
                        }
                    }

                    if (foundAny) {
                        status.success('找到匹配项');
                    } else {
                        status.error('未找到匹配项');
                    }
                }
            }
        }
    };

    // 主函数
    async function main() {
        console.log('Emby跳转脚本启动 (优化版)');
        const status = statusIndicator.getInstance();
        status.show('初始化中...');

        // 检查API配置
        if (!config.embyAPI) {
            console.log('Emby API未配置');
            status.error('API未配置');
            setTimeout(() => {
                alert('请先设置您的Emby服务器地址和API密钥');
                createSettingsPanel();
            }, 500);
            return;
        }

        // 初始化API
        const api = new EmbyAPI();

        // 识别当前站点并处理
        let siteFound = false;
        for (const [site, strategy] of Object.entries(siteStrategies)) {
            if (strategy.detect()) {
                siteFound = true;
                status.show(`检测到站点: ${site}，开始处理...`);
                await strategy.process(api);
                break;
            }
        }

        if (!siteFound) {
            status.error('未识别到支持的站点');
        }
    }

    // 启动脚本
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!config.embyAPI) {
                setTimeout(() => {
                    alert('请先设置您的Emby服务器地址和API密钥');
                    createSettingsPanel();
                }, 500);
            } else {
                setTimeout(main, 500);
            }
        });
    } else {
        if (!config.embyAPI) {
            setTimeout(() => {
                alert('请先设置您的Emby服务器地址和API密钥');
                createSettingsPanel();
            }, 500);
        } else {
            setTimeout(main, 500);
        }
    }
})();