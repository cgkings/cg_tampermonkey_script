// ==UserScript==
// @name         跳转到Emby播放 (优化版)
// @namespace    http://tampermonkey.net/
// @version      20250422
// @description  在JavBus/Javdb/Sehuatang高亮emby存在的视频，并在详情页提供一键跳转功能(优化速度)
// @match        *://www.javbus.com/*
// @include      *://javdb*.com/v/*
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
// @license      MIT
// ==/UserScript==

// 默认配置
const DEFAULT_CONFIG = {
    embyAPI: "",
    embyBaseUrl: "http://localhost:8096/",
    highlightColor: "#52b54b",
    maxConcurrentRequests: 50,
    cacheTTL: 7 // 缓存有效期(天)
};

// 获取用户配置或使用默认值
function getConfig() {
    return {
        embyAPI: GM_getValue('embyAPI', DEFAULT_CONFIG.embyAPI),
        embyBaseUrl: GM_getValue('embyBaseUrl', DEFAULT_CONFIG.embyBaseUrl),
        highlightColor: GM_getValue('highlightColor', DEFAULT_CONFIG.highlightColor),
        maxConcurrentRequests: GM_getValue('maxConcurrentRequests', DEFAULT_CONFIG.maxConcurrentRequests),
        cacheTTL: GM_getValue('cacheTTL', DEFAULT_CONFIG.cacheTTL)
    };
}

// 添加样式
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
#emby-progress-bar {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    z-index: 9999;
    font-size: 12px;
    transition: opacity 0.3s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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
        </div>
        
        <div class="emby-settings-field">
            <label for="cache-ttl">缓存有效期(天)</label>
            <input type="number" id="cache-ttl" min="1" max="30" value="${config.cacheTTL}">
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
            cacheTTL: parseInt(document.getElementById('cache-ttl').value, 10)
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
    const processedElements = new WeakSet(); // 使用WeakSet跟踪已处理元素

    // 日志函数
    function logInfo(message) {
        console.log(`[Emby跳转] ${message}`);
    }

    function logError(message) {
        console.error(`[Emby跳转] ${message}`);
    }

    // 初始化缓存
    let embyCache;
    try {
        const savedCache = GM_getValue('embyCache', '{}');
        embyCache = new Map(Object.entries(JSON.parse(savedCache)));

        // 清理过期缓存项
        const now = Date.now();
        const CACHE_EXPIRY = config.cacheTTL * 24 * 60 * 60 * 1000;

        let expiredCount = 0;
        for (const [key, item] of embyCache.entries()) {
            if (!item.timestamp || (now - item.timestamp > CACHE_EXPIRY)) {
                embyCache.delete(key);
                expiredCount++;
            }
        }

        logInfo(`缓存初始化完成，清理了${expiredCount}个过期条目，当前缓存项数：${embyCache.size}`);
    } catch (e) {
        logError(`初始化缓存失败: ${e.message}`);
        embyCache = new Map();
    }

    // 定期保存缓存
    setInterval(() => {
        try {
            const cacheObj = Object.fromEntries(embyCache);
            GM_setValue('embyCache', JSON.stringify(cacheObj));
            logInfo(`缓存已保存，共${embyCache.size}项`);
        } catch (e) {
            logError(`保存缓存失败: ${e.message}`);
        }
    }, 60000);

    // 进度指示器
    function showProgress(message, percent = -1) {
        let progressBar = document.getElementById('emby-progress-bar');

        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'emby-progress-bar';
            document.body.appendChild(progressBar);
        }

        if (message === null) {
            // 隐藏进度条
            progressBar.style.opacity = '0';
            setTimeout(() => {
                if (progressBar.parentNode) {
                    progressBar.parentNode.removeChild(progressBar);
                }
            }, 300);
            return;
        }

        progressBar.style.opacity = '1';
        if (percent >= 0) {
            progressBar.innerHTML = `${message} (${Math.round(percent)}%)`;
        } else {
            progressBar.textContent = message;
        }
    }

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

    // 队列管理 - 使用Promise.all控制并发
    class RequestQueue {
        constructor(maxConcurrent = 50) {
            this.maxConcurrent = maxConcurrent;
            this.activeRequests = 0;
            this.queue = [];
        }

        async add(fn) {
            if (this.activeRequests >= this.maxConcurrent) {
                // 等待队列中的一个请求完成
                await new Promise(resolve => this.queue.push(resolve));
            }

            this.activeRequests++;
            try {
                return await fn();
            } finally {
                this.activeRequests--;
                if (this.queue.length > 0) {
                    const next = this.queue.shift();
                    next();
                }
            }
        }
    }

    const requestQueue = new RequestQueue(config.maxConcurrentRequests);

    // Emby API基础类
    class EmbyAPI {
        constructor() {
            this.config = getConfig();
            this.cacheHits = 0;
            this.cacheMisses = 0;
        }

        // 查询Emby数据
        async fetchEmbyData(code) {
            logInfo(`查询番号: ${code}`);

            // 检查缓存
            if (embyCache.has(code)) {
                this.cacheHits++;
                logInfo(`缓存命中: ${code}`);
                return embyCache.get(code).data;
            }

            this.cacheMisses++;
            showProgress(`查询中: ${code}`);

            try {
                const encodedCode = encodeURIComponent(code.trim());
                // 根据番号格式选择API端点
                let url;
                if (code.match(/^[a-zA-Z]+-\d+$/i) || code.match(/^FC2-PPV-\d+$/i)) {
                    // 标准番号格式，使用ItemsByName
                    url = `${this.config.embyBaseUrl}emby/Items/ItemsByName?name=${encodedCode}&api_key=${this.config.embyAPI}&Recursive=true&IncludeItemTypes=Movie`;
                    logInfo(`使用精确搜索API: ${code}`);
                } else {
                    // 其他格式，使用标准搜索
                    url = `${this.config.embyBaseUrl}emby/Users/${this.config.embyAPI}/Items?api_key=${this.config.embyAPI}&Recursive=true&IncludeItemTypes=Movie&SearchTerm=${encodedCode}`;
                    logInfo(`使用标准搜索API: ${code}`);
                }

                const response = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        headers: { accept: "application/json" },
                        onload: (res) => {
                            if (res.status >= 200 && res.status < 300) {
                                resolve(res);
                            } else {
                                reject(new Error(`HTTP error: ${res.status}`));
                            }
                        },
                        onerror: (e) => {
                            reject(new Error("Error fetching Emby data"));
                        }
                    });
                });

                const data = JSON.parse(response.responseText);
                logInfo(`${code} 搜索结果: 找到 ${data.Items?.length || 0} 个匹配项`);

                // 更新缓存
                embyCache.set(code, {
                    data: data,
                    timestamp: Date.now()
                });

                return data;
            } catch (error) {
                logError(`查询失败 ${code}: ${error.message}`);
                return { Items: [] };
            } finally {
                showProgress(null);
            }
        }

        // 插入Emby链接
        insertEmbyLink(targetElement, data) {
            if (!targetElement || !data || !data.Items || data.Items.length === 0) {
                logInfo('无法插入Emby链接: 无匹配结果或目标元素无效');
                return;
            }

            try {
                // 只处理第一个匹配项
                const item = data.Items[0];
                const embyUrl = `${this.config.embyBaseUrl}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`;

                // 确保目标元素是DOM元素
                const domElement = targetElement.nodeType ? targetElement : targetElement[0];
                if (!domElement) {
                    logInfo('DOM元素无效，无法插入链接');
                    return;
                }

                // 检查是否已有链接
                const parentElement = domElement.parentElement || domElement;
                if (parentElement.querySelector && parentElement.querySelector(`a[href="${embyUrl}"]`)) {
                    logInfo(`已存在链接，跳过插入: ${item.Name}`);
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
                    logInfo(`成功标记并添加链接: ${item.Name}`);
                }
            } catch (error) {
                logError(`插入Emby链接时出错: ${error.message}`);
            }
        }
    }

    // 寻找视频项容器 (向上查找最近的容器元素)
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

        return element; // 如果找不到合适的容器，返回原始元素
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
                // 列表页处理
                const listItems = $('.item.masonry-brick, #waterfall .item');
                if (listItems.length > 0) {
                    logInfo(`发现列表项: ${listItems.length}个`);

                    const promises = Array.from(listItems).map(item => {
                        if (processedElements.has(item)) return Promise.resolve();
                        processedElements.add(item);

                        const fanhao = $$('.item date', item)?.textContent?.trim();
                        if (!fanhao) return Promise.resolve();

                        logInfo(`识别到番号: ${fanhao}`);

                        return requestQueue.add(async () => {
                            const data = await api.fetchEmbyData(fanhao);
                            if (data.Items?.length > 0) {
                                api.insertEmbyLink($$('.item date', item), data);
                            } else {
                                logInfo(`${fanhao} 在Emby中未找到匹配`);
                            }
                        });
                    });

                    await Promise.all(promises);
                }

                // 详情页处理
                const infoElement = $$('.col-md-3.info p');
                if (infoElement) {
                    const spans = infoElement.querySelectorAll('span');
                    if (spans.length > 1) {
                        const code = spans[1].textContent?.trim();
                        if (code) {
                            logInfo(`详情页识别到番号: ${code}`);
                            const data = await api.fetchEmbyData(code);
                            if (data.Items?.length > 0) {
                                api.insertEmbyLink(spans[1], data);
                            } else {
                                logInfo(`${code} 在Emby中未找到匹配`);
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
                // 列表页处理
                const listItems = $('.movie-list .item, .grid-item');
                if (listItems.length > 0) {
                    logInfo(`发现列表项: ${listItems.length}个`);

                    const promises = Array.from(listItems).map(item => {
                        if (processedElements.has(item)) return Promise.resolve();
                        processedElements.add(item);

                        const titleElement = $$('.video-title strong', item);
                        if (!titleElement) return Promise.resolve();

                        const code = titleElement.textContent.trim();
                        if (!code) return Promise.resolve();

                        logInfo(`识别到番号: ${code}`);

                        return requestQueue.add(async () => {
                            const data = await api.fetchEmbyData(code);
                            if (data.Items?.length > 0) {
                                api.insertEmbyLink(titleElement, data);
                            } else {
                                logInfo(`${code} 在Emby中未找到匹配`);
                            }
                        });
                    });

                    await Promise.all(promises);
                }

                // 详情页处理
                const detailElement = $$('body > section > div > div.video-detail > h2 > strong') ||
                    $$('.video-detail h2 strong');
                if (detailElement) {
                    const code = detailElement.textContent.trim().split(' ')[0];
                    if (code) {
                        logInfo(`详情页识别到番号: ${code}`);
                        const data = await api.fetchEmbyData(code);
                        if (data.Items?.length > 0) {
                            api.insertEmbyLink(detailElement, data);
                        } else {
                            logInfo(`${code} 在Emby中未找到匹配`);
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
                const title = document.title.trim();
                const codes = extractCodesFromTitle(title);

                if (codes.length > 0) {
                    logInfo(`从标题中提取到番号: ${codes.join(', ')}`);

                    const promises = codes.map(code => {
                        return requestQueue.add(async () => {
                            const data = await api.fetchEmbyData(code);
                            if (data.Items?.length > 0) {
                                const container = $('#thread_subject')[0] ||
                                    $('h1.ts')[0] ||
                                    $('h1')[0];
                                if (container) {
                                    api.insertEmbyLink(container, data);
                                }
                            } else {
                                logInfo(`${code} 在Emby中未找到匹配`);
                            }
                        });
                    });

                    await Promise.all(promises);
                } else {
                    logInfo('从标题中未提取到番号: ' + title);
                }
            }
        }
    };

    // 主函数
    async function main() {
        logInfo('脚本启动 (优化版)');

        // 检查API配置
        if (!config.embyAPI) {
            logInfo('Emby API未配置');
            setTimeout(() => {
                alert('请先设置您的Emby服务器地址和API密钥');
                createSettingsPanel();
            }, 500);
            return;
        }

        // 初始化API
        const api = new EmbyAPI();

        // 记录开始时间
        const startTime = performance.now();

        // 识别当前站点并处理
        let siteDetected = false;
        for (const [site, strategy] of Object.entries(siteStrategies)) {
            if (strategy.detect()) {
                siteDetected = true;
                logInfo(`检测到站点: ${site}`);
                await strategy.process(api);
                break;
            }
        }

        if (!siteDetected) {
            logInfo('未检测到支持的站点');
        }

        // 计算总耗时
        const totalTime = performance.now() - startTime;
        logInfo(`处理完成，总耗时: ${totalTime.toFixed(2)}ms`);

        // 输出缓存统计
        const hitRate = (api.cacheHits > 0 || api.cacheMisses > 0) ?
            (api.cacheHits / (api.cacheHits + api.cacheMisses) * 100).toFixed(2) + '%' : '0%';
        logInfo(`缓存统计 - 命中: ${api.cacheHits}, 未命中: ${api.cacheMisses}, 命中率: ${hitRate}`);
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