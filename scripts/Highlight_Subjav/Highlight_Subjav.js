// ==UserScript==
// @name         Supjav标题关键字渐变高亮
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  对supjav网站标题中包含关键字的影片应用标题渐变背景，不包含的标题淡化显示
// @author       Your Name
// @match        https://supjav.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // 默认关键字列表
    let keywords = GM_getValue('keywords', '无码破解,Reducing Mosaic');

    // 添加样式
    GM_addStyle(`
        /* 标题渐变背景样式 - 只应用于包含关键字的标题链接 */
        .title-gradient {
            background: linear-gradient(to bottom, #ff9800 0%, #ffeb3b 50%, #4CAF50 100%) !important;
            color: #000 !important;
            padding: 2px 5px !important;
            border-radius: 3px !important;
            text-decoration: none !important;
        }

        /* 淡化样式 - 只应用于不包含关键字的标题链接的父元素 */
        .fade-title {
            opacity: 0.5;
            transition: opacity 0.3s;
        }

        /* 鼠标悬停时恢复不透明度 */
        .fade-title:hover {
            opacity: 1;
        }
    `);

    // 注册设置菜单
    GM_registerMenuCommand("设置关键字", showSettings);

    // 设置面板
    function showSettings() {
        const settingsHTML = `
            <div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%);
                background:#fff; padding:20px; border-radius:5px; z-index:9999; box-shadow:0 0 10px rgba(0,0,0,0.3);">
                <h3 style="margin-top:0;">关键字设置</h3>
                <div style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px;">关键字(逗号分隔):</label>
                    <textarea id="keywords-input" style="width:300px; padding:5px;" rows="3">${keywords}</textarea>
                </div>
                <div style="text-align:right;">
                    <button id="save-settings" style="padding:5px 10px; background:#4CAF50; color:white; border:none; border-radius:3px; cursor:pointer;">保存</button>
                    <button id="cancel-settings" style="padding:5px 10px; background:#f44336; color:white; border:none; border-radius:3px; cursor:pointer; margin-left:10px;">取消</button>
                </div>
            </div>
        `;

        // 创建设置面板
        const settingsContainer = document.createElement('div');
        settingsContainer.innerHTML = settingsHTML;
        document.body.appendChild(settingsContainer);

        // 绑定事件
        document.getElementById('save-settings').addEventListener('click', () => {
            // 保存新的关键字列表
            keywords = document.getElementById('keywords-input').value;
            GM_setValue('keywords', keywords);

            // 重新应用规则
            document.body.removeChild(settingsContainer);
            applyRules();
        });

        document.getElementById('cancel-settings').addEventListener('click', () => {
            document.body.removeChild(settingsContainer);
        });
    }

    // 应用规则
    function applyRules() {
        // 清除旧的样式
        document.querySelectorAll('.title-gradient').forEach(el => {
            el.classList.remove('title-gradient');
        });

        document.querySelectorAll('.fade-title').forEach(el => {
            el.classList.remove('fade-title');
        });

        // 获取所有关键字
        const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
        if (keywordList.length === 0) return;

        // 获取所有标题链接
        const titleLinks = document.querySelectorAll('.post h3 a');

        titleLinks.forEach(link => {
            const title = link.textContent.trim();

            // 检查是否包含关键字
            let containsKeyword = false;

            for (const keyword of keywordList) {
                if (title.includes(keyword)) {
                    containsKeyword = true;
                    break;
                }
            }

            // 应用效果
            if (containsKeyword) {
                // 包含关键字的渐变效果直接应用在链接上
                link.classList.add('title-gradient');
            } else {
                // 不包含关键字的淡化效果应用在整个post元素上
                const postElement = getPostElement(link);
                if (postElement) {
                    postElement.classList.add('fade-title');
                }
            }
        });
    }

    // 获取包含链接的post元素
    function getPostElement(element) {
        let current = element;
        while (current && !current.classList.contains('post')) {
            current = current.parentElement;
        }
        return current;
    }

    // 监听页面内容变化
    function observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            let shouldApplyRules = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    // 检查添加的节点是否包含文章
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList?.contains('post') || node.querySelectorAll('.post h3 a').length > 0) {
                                shouldApplyRules = true;
                                break;
                            }
                        }
                    }

                    if (shouldApplyRules) break;
                }
            }

            if (shouldApplyRules) {
                // 等待一段时间确保DOM已完全加载
                setTimeout(applyRules, 200);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 页面加载完成后初始化
    function init() {
        console.log('Supjav标题关键字渐变高亮脚本已加载');
        applyRules();
        observeDOMChanges();
    }

    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();