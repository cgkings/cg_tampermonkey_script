// ==UserScript==
// @name         视频网格标注工具库
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  针对javdb、javbus、supjav等网站提供统一的网格标注功能
// @author       cgkigns
// @license      MIT
// @homepageURL https://github.com/cgkings/cg_tampermonkey_script
// @supportURL  https://github.com/cgkings/cg_tampermonkey_script/issues
// ==/UserScript==

const AVGridMarker = (function () {
    'use strict';

    // 支持的站点配置
    const SITES = {
        JAVDB: {
            name: 'javdb',
            domains: ['javdb.com'],
            selectors: {
                grid: '.movie-list .item, .grid-item',
                title: '.video-title',
                code: '.video-title strong',
                cover: '.cover',
                rating: '.value'
            },
            extractors: {
                code: el => el.querySelector('.video-title strong')?.textContent?.trim(),
                rating: el => {
                    const val = el.querySelector('.value')?.textContent;
                    if (!val) return null;
                    const matches = val.match(/(\d+\.\d+).*?(\d+)/);
                    return matches ? { score: parseFloat(matches[1]), count: parseInt(matches[2]) } : null;
                }
            }
        },
        JAVBUS: {
            name: 'javbus',
            domains: ['javbus.com'],
            selectors: {
                grid: '.item.masonry-brick, #waterfall .item',
                title: '.title',
                code: '.date',
                cover: '.photo-frame',
                rating: null
            },
            extractors: {
                code: el => el.querySelector('.date')?.textContent?.trim(),
                rating: null
            }
        },
        SUPJAV: {
            name: 'supjav',
            domains: ['supjav.com'],
            selectors: {
                grid: '.post',
                title: 'h3 a',
                cover: '.img',
                rating: null
            },
            extractors: {
                code: el => {
                    const title = el.querySelector('h3 a')?.textContent?.trim();
                    if (!title) return null;
                    const match = title.match(/([a-zA-Z0-9]+-\d+)/i);
                    return match ? match[1] : null;
                },
                rating: null
            }
        }
    };

    // 工具函数
    const Util = {
        // 添加样式到文档
        addStyle(css) {
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
            return style;
        },

        // 创建DOM元素
        createEl(tag, attrs = {}, ...children) {
            const el = document.createElement(tag);

            Object.entries(attrs).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'object') {
                    Object.assign(el.style, value);
                } else if (key === 'className') {
                    el.className = value;
                } else if (key.startsWith('on') && typeof value === 'function') {
                    el.addEventListener(key.substring(2).toLowerCase(), value);
                } else {
                    el.setAttribute(key, value);
                }
            });

            children.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    el.appendChild(child);
                }
            });

            return el;
        },

        // 生成唯一ID
        uniqueId(prefix = 'av-marker') {
            return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
        },

        // 节流函数
        throttle(fn, wait = 100) {
            let timeout = null;
            let previous = 0;

            return function (...args) {
                const context = this;
                const now = Date.now();

                if (now - previous > wait) {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    previous = now;
                    fn.apply(context, args);
                } else if (!timeout) {
                    timeout = setTimeout(() => {
                        previous = Date.now();
                        timeout = null;
                        fn.apply(context, args);
                    }, wait - (now - previous));
                }
            };
        },

        // 防抖函数
        debounce(fn, wait = 300) {
            let timeout;
            return function (...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => fn.apply(context, args), wait);
            };
        }
    };

    // 站点检测
    function detectSite() {
        const hostname = location.hostname.toLowerCase();

        for (const siteKey in SITES) {
            const site = SITES[siteKey];
            if (site.domains.some(domain => hostname.includes(domain))) {
                return site;
            }
        }

        // 针对特殊情况的额外检测
        if (document.querySelector('footer')?.textContent?.includes('JavBus')) {
            return SITES.JAVBUS;
        } else if (document.querySelector('#footer')?.textContent?.includes('javdb')) {
            return SITES.JAVDB;
        } else if (document.title.includes('SupJav')) {
            return SITES.SUPJAV;
        }

        return null;
    }

    // DOM观察器
    class Observer {
        constructor() {
            this.callbacks = [];
            this.observer = null;
        }

        // 监听DOM变化
        observe(callback, options = {}) {
            const defaultOptions = {
                selector: null,
                once: false,
                subtree: true,
                childList: true
            };

            const opts = { ...defaultOptions, ...options };

            if (!opts.selector) {
                console.error('观察器需要提供一个选择器');
                return;
            }

            // 如果已存在选择器，则先执行一次
            const existingElements = document.querySelectorAll(opts.selector);
            if (existingElements.length > 0) {
                callback(existingElements);
                if (opts.once) return;
            }

            // 将回调和选项添加到队列
            this.callbacks.push({ callback, options: opts });

            // 如果观察器已存在，不需要再创建
            if (this.observer) return;

            // 创建观察器
            this.observer = new MutationObserver(mutations => {
                let shouldCheck = false;

                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        shouldCheck = true;
                        break;
                    }
                }

                if (!shouldCheck) return;

                // 检查所有回调
                this.callbacks.forEach(item => {
                    const { callback, options } = item;
                    const elements = document.querySelectorAll(options.selector);
                    if (elements.length > 0) {
                        callback(elements);

                        // 如果只需执行一次，移除该回调
                        if (options.once) {
                            this.callbacks = this.callbacks.filter(cb => cb !== item);
                        }
                    }
                });
            });

            // 开始观察
            this.observer.observe(document.body, {
                childList: opts.childList,
                subtree: opts.subtree
            });
        }

        // 停止观察
        disconnect() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            this.callbacks = [];
        }
    }

    // 样式管理
    class StyleManager {
        constructor() {
            this.styles = {};
            this.classPrefix = 'av-marker';

            // 添加基本全局样式
            Util.addStyle(`
          .${this.classPrefix}-fade { transition: opacity 0.2s; }
          .${this.classPrefix}-border { transition: border 0.2s; }
          .${this.classPrefix}-highlight { transition: outline 0.2s, background-color 0.2s; }
          .${this.classPrefix}-badge {
            position: absolute;
            z-index: 10;
            font-weight: bold;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          .${this.classPrefix}-rainbow-border {
            border: 2px solid transparent;
            background-origin: border-box;
            background-clip: padding-box, border-box;
          }
        `);
        }

        // 注册自定义样式
        register(name, style) {
            const className = `${this.classPrefix}-${name}`;
            this.styles[name] = className;

            let css = `.${className} {`;
            Object.entries(style).forEach(([prop, value]) => {
                if (typeof value === 'object') {
                    // 处理嵌套样式对象，如 border: { width, style, color }
                    Object.entries(value).forEach(([subProp, subValue]) => {
                        css += `${prop}-${subProp}: ${subValue}; `;
                    });
                } else {
                    css += `${prop}: ${value}; `;
                }
            });
            css += '}';

            Util.addStyle(css);
            return className;
        }

        // 获取样式类名
        getClassName(name) {
            return this.styles[name] || null;
        }
    }

    // 标记操作核心
    class Marker {
        constructor(site) {
            this.site = site;
            this.styleManager = new StyleManager();
            this.observer = new Observer();
            this.processed = new WeakSet();

            // 预注册常用样式
            this.styleManager.register('fade-strong', { opacity: '0.3' });
            this.styleManager.register('fade-medium', { opacity: '0.5' });
            this.styleManager.register('fade-light', { opacity: '0.7' });
        }

        // 核心标记函数
        mark(selector, condition, styles) {
            const actualSelector = selector || this.site.selectors.grid;
            if (!actualSelector) {
                console.error('无法找到网格选择器');
                return this;
            }

            const processElements = (elements) => {
                elements.forEach(el => {
                    // 避免重复处理
                    if (this.processed.has(el)) return;

                    // 决定是否应用样式
                    let shouldApply = true;
                    let styleToApply = styles;

                    if (typeof condition === 'function') {
                        const result = condition(el);
                        if (result === false) {
                            shouldApply = false;
                        } else if (typeof result === 'string') {
                            // 使用返回的样式名
                            styleToApply = result;
                        }
                    }

                    if (shouldApply) {
                        this.applyStyle(el, styleToApply);
                    }

                    this.processed.add(el);
                });
            };

            // 处理已有元素
            const existingElements = document.querySelectorAll(actualSelector);
            if (existingElements.length > 0) {
                processElements(existingElements);
            }

            // 观察新元素
            this.observer.observe(processElements, {
                selector: actualSelector
            });

            return this;
        }

        // 应用样式到元素
        applyStyle(element, style) {
            if (!element || !style) return;

            if (typeof style === 'string') {
                // 使用预定义样式
                const className = this.styleManager.getClassName(style);
                if (className) {
                    element.classList.add(className);
                } else {
                    // 如果找不到预定义样式，检查是否是内联样式
                    const inline = style.trim();
                    if (inline.includes(':')) {
                        element.style.cssText += inline;
                    } else {
                        // 直接作为类名添加
                        element.classList.add(style);
                    }
                }
            } else if (typeof style === 'object') {
                // 应用内联样式对象
                Object.assign(element.style, style);
            }
        }

        // 淡化元素
        fade(selector, options = {}) {
            const defaultOptions = {
                level: 'medium',  // strong, medium, light 或者数值
                condition: null,
                hover: true
            };

            const opts = { ...defaultOptions, ...options };

            // 确定淡化级别
            let fadeClass = '';
            if (typeof opts.level === 'string') {
                fadeClass = `fade-${opts.level}`;
            } else if (typeof opts.level === 'number') {
                fadeClass = this.styleManager.register(
                    `fade-custom-${opts.level}`,
                    { opacity: opts.level.toString() }
                );
            }

            // 添加悬停恢复效果
            if (opts.hover && typeof opts.level === 'string') {
                this.styleManager.register(
                    `fade-${opts.level}-hover`,
                    {
                        transition: 'opacity 0.2s',
                        ':hover': { opacity: '1 !important' }
                    }
                );
                fadeClass += ` fade-${opts.level}-hover`;
            }

            return this.mark(selector, opts.condition, fadeClass);
        }

        // 添加边框
        border(selector, options = {}) {
            const defaultOptions = {
                width: '3px',
                style: 'solid',
                color: '#ff9800',
                condition: null,
                hover: false,
                rainbow: false
            };

            const opts = { ...defaultOptions, ...options };

            let borderStyle;
            let className;

            if (opts.rainbow) {
                // 创建彩虹边框
                className = this.styleManager.register(
                    `rainbow-border-${Util.uniqueId()}`,
                    {
                        border: '2px solid transparent',
                        'background-origin': 'border-box',
                        'background-clip': 'padding-box, border-box',
                        'background-image': `linear-gradient(to bottom, transparent 0%, transparent 100%), 
                                 linear-gradient(50deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)`
                    }
                );
            } else {
                // 创建普通边框
                borderStyle = `${opts.width} ${opts.style} ${opts.color}`;
                className = this.styleManager.register(
                    `border-${Util.uniqueId()}`,
                    { border: borderStyle }
                );
            }

            // 添加悬停效果
            if (opts.hover) {
                const hoverClass = this.styleManager.register(
                    `border-hover-${Util.uniqueId()}`,
                    { ':hover': { borderWidth: (parseInt(opts.width) + 2) + 'px' } }
                );
                className += ` ${hoverClass}`;
            }

            return this.mark(selector, opts.condition, className);
        }

        // 设置背景
        background(selector, options = {}) {
            const defaultOptions = {
                color: '#f5f5f5',
                gradient: null,
                condition: null,
                hover: false
            };

            const opts = { ...defaultOptions, ...options };

            let bgValue = opts.color;

            // 使用渐变背景
            if (opts.gradient) {
                bgValue = opts.gradient;
            }

            const className = this.styleManager.register(
                `bg-${Util.uniqueId()}`,
                { 'background': bgValue }
            );

            // 添加悬停效果
            if (opts.hover) {
                const hoverClass = this.styleManager.register(
                    `bg-hover-${Util.uniqueId()}`,
                    { ':hover': { background: opts.hoverColor || 'inherit' } }
                );
                className += ` ${hoverClass}`;
            }

            return this.mark(selector, opts.condition, className);
        }

        // 高亮元素
        highlight(selector, options = {}) {
            const defaultOptions = {
                color: '#ff9800',
                useOutline: true,
                outlineWidth: '3px',
                backgroundColor: null,
                condition: null,
                hover: false
            };

            const opts = { ...defaultOptions, ...options };

            let style = {};

            if (opts.useOutline) {
                style.outline = `${opts.outlineWidth} solid ${opts.color}`;
                style.outlineOffset = '0px';
            } else {
                style.border = `${opts.outlineWidth} solid ${opts.color}`;
            }

            if (opts.backgroundColor) {
                style.backgroundColor = opts.backgroundColor;
            }

            const className = this.styleManager.register(
                `highlight-${Util.uniqueId()}`,
                style
            );

            // 添加悬停效果
            if (opts.hover) {
                const hoverClass = this.styleManager.register(
                    `highlight-hover-${Util.uniqueId()}`,
                    {
                        ':hover': {
                            outlineWidth: opts.useOutline ? (parseInt(opts.outlineWidth) + 2) + 'px' : 'inherit',
                            borderWidth: !opts.useOutline ? (parseInt(opts.outlineWidth) + 2) + 'px' : 'inherit'
                        }
                    }
                );
                className += ` ${hoverClass}`;
            }

            return this.mark(selector, opts.condition, className);
        }

        // 文本高亮
        textHighlight(selector, options = {}) {
            const defaultOptions = {
                text: [],  // 要高亮的文本列表
                caseSensitive: false,
                backgroundColor: '#ffeb3b',
                color: '#000',
                condition: null
            };

            const opts = { ...defaultOptions, ...options };

            if (!Array.isArray(opts.text) || opts.text.length === 0) {
                console.error('请提供要高亮的文本');
                return this;
            }

            const actualSelector = selector || this.site.selectors.title;

            const processElements = (elements) => {
                elements.forEach(el => {
                    // 避免重复处理
                    if (this.processed.has(el)) return;

                    // 判断是否应用
                    if (typeof opts.condition === 'function' && !opts.condition(el)) {
                        return;
                    }

                    const content = el.innerHTML;
                    let newContent = content;

                    opts.text.forEach(keyword => {
                        if (!keyword) return;

                        let regex;
                        if (opts.caseSensitive) {
                            regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
                        } else {
                            regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                        }

                        newContent = newContent.replace(regex, `<span style="background-color:${opts.backgroundColor};color:${opts.color};padding:0 3px;border-radius:2px;">$1</span>`);
                    });

                    if (newContent !== content) {
                        el.innerHTML = newContent;
                    }

                    this.processed.add(el);
                });
            };

            // 处理已有元素
            const existingElements = document.querySelectorAll(actualSelector);
            if (existingElements.length > 0) {
                processElements(existingElements);
            }

            // 观察新元素
            this.observer.observe(processElements, {
                selector: actualSelector
            });

            return this;
        }

        // 添加徽章
        addBadge(selector, text, options = {}) {
            const defaultOptions = {
                position: 'top-right', // top-right, top-left, bottom-right, bottom-left
                backgroundColor: '#000',
                textColor: '#fff',
                size: 'medium', // small, medium, large
                rainbow: false,
                condition: null,
                onClick: null
            };

            const opts = { ...defaultOptions, ...options };

            const actualSelector = selector || this.site.selectors.grid;

            // 获取尺寸样式
            const sizeStyles = {
                small: { fontSize: '10px', padding: '1px 4px' },
                medium: { fontSize: '12px', padding: '2px 5px' },
                large: { fontSize: '14px', padding: '3px 7px' }
            }[opts.size] || sizeStyles.medium;

            // 获取位置样式
            const positionStyles = {
                'top-right': { top: '5px', right: '5px' },
                'top-left': { top: '5px', left: '5px' },
                'bottom-right': { bottom: '5px', right: '5px' },
                'bottom-left': { bottom: '5px', left: '5px' }
            }[opts.position] || positionStyles['top-right'];

            const processElements = (elements) => {
                elements.forEach(el => {
                    // 找到图片容器
                    let container = el;

                    const coverSelector = this.site.selectors.cover;
                    if (coverSelector) {
                        const coverEl = el.querySelector(coverSelector);
                        if (coverEl) {
                            container = coverEl;
                        }
                    } else {
                        // 尝试找到第一个图片元素
                        const img = el.querySelector('img');
                        if (img) {
                            const parent = img.parentElement;
                            if (parent && parent !== el) {
                                container = parent;
                            }
                        }
                    }

                    // 判断是否应用
                    if (typeof opts.condition === 'function' && !opts.condition(el)) {
                        return;
                    }

                    // 确保容器是相对定位
                    const computedStyle = window.getComputedStyle(container);
                    if (computedStyle.position === 'static') {
                        container.style.position = 'relative';
                    }

                    // 创建徽章元素
                    const badge = Util.createEl('div', {
                        className: `av-marker-badge ${opts.rainbow ? 'av-marker-rainbow-border' : ''}`,
                        style: {
                            ...positionStyles,
                            backgroundColor: opts.backgroundColor,
                            color: opts.textColor,
                            fontSize: sizeStyles.fontSize,
                            padding: sizeStyles.padding,
                            cursor: opts.onClick ? 'pointer' : 'default'
                        },
                        onclick: opts.onClick
                    }, text);

                    // 如果使用彩虹边框
                    if (opts.rainbow) {
                        badge.style.backgroundImage = `linear-gradient(${opts.backgroundColor} 0 0), 
                                          linear-gradient(50deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)`;
                    }

                    container.appendChild(badge);
                });
            };

            // 处理已有元素
            const existingElements = document.querySelectorAll(actualSelector);
            if (existingElements.length > 0) {
                processElements(existingElements);
            }

            // 观察新元素
            this.observer.observe(processElements, {
                selector: actualSelector
            });

            return this;
        }

        // 定义样式集
        styleSet(name, styles) {
            this.styleManager.register(name, styles);
            return this;
        }

        // 提取番号
        extractCode(element) {
            if (!element) return null;

            if (this.site.extractors && this.site.extractors.code) {
                return this.site.extractors.code(element);
            }

            const codeSelector = this.site.selectors.code;
            if (!codeSelector) return null;

            const codeEl = element.querySelector(codeSelector);
            return codeEl ? codeEl.textContent.trim() : null;
        }

        // 提取评分
        extractRating(element) {
            if (!element) return null;

            if (this.site.extractors && this.site.extractors.rating) {
                return this.site.extractors.rating(element);
            }

            const ratingSelector = this.site.selectors.rating;
            if (!ratingSelector) return null;

            const ratingEl = element.querySelector(ratingSelector);
            return ratingEl ? { raw: ratingEl.textContent.trim() } : null;
        }

        // 停止所有观察
        stop() {
            this.observer.disconnect();
            return this;
        }
    }

    // 公开API
    return {
        // 初始化函数
        init() {
            const site = detectSite();
            if (!site) {
                console.warn('AVGridMarker: 不支持当前站点');
                return null;
            }

            return new Marker(site);
        },

        // 注册新站点
        registerSite(siteConfig) {
            if (!siteConfig || !siteConfig.name || !siteConfig.domains) {
                console.error('站点配置不完整');
                return false;
            }

            const name = siteConfig.name.toUpperCase();
            SITES[name] = siteConfig;
            return true;
        },

        // 工具函数
        util: Util
    };
})();

// 如果在userscript环境中，注册到全局
if (typeof window !== 'undefined') {
    window.AVGridMarker = AVGridMarker;
}