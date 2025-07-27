// ==UserScript==
// @name         逛色花(适配新UI版）
// @description  最好用的98堂(原色花堂)脚本 高级搜索 自动签到 快速复制 快速评分 划词搜索 图片预览 快速收藏
// @author       kitawa
// @version      6.4
// @match        *://*.sehuatang.net/*
// @match        *://*.sehuatang.org/*
// @match        *://*.sehuatang.*/*
// @match        http://127.0.0.1/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function () {
	"use strict";

	// #region 全局变量
	if (window.self !== window.top) {
		return;
	}

	/**
	 * activeTooltips: 用于记录当前页面中活动的工具提示数量。这可以用于管理和控制页面上显示的提示。
	 */
	let activeTooltips = 0;

	/**
	 * DEFAULT_TID_OPTIONS: 存储默认的板块列表。
	 * 每个板块都有一个唯一的value和一个对应的label。
	 * 这个常量可以被用于下拉列表、搜索过滤等。
	 */
	const DEFAULT_TID_OPTIONS = [
		{ value: 95, label: "综合讨论区" },
		{ value: 166, label: "AI专区" },
		{ value: 141, label: "网友原创区" },
		{ value: 142, label: "转帖交流区" },
		{ value: 97, label: "资源出售区" },
		{ value: 143, label: "求片问答悬赏区" },
		{ value: 36, label: "亚洲无码原创" },
		{ value: 37, label: "亚洲有码原创" },
		{ value: 103, label: "高清中文字幕" },
		{ value: 151, label: "4K原版区" },
		{ value: 159, label: "原档新作区" },
		{ value: 145, label: "原档自提字幕区" },
		{ value: 146, label: "原档自译字幕区" },
		{ value: 121, label: "原档字幕分享区" },

	];

	/**
	 * baseURL: 获取当前页面的主机URL，用于构建其他URL。
	 * 动态检测协议，支持HTTP和HTTPS环境（包括本地代理）
	 */
	const baseURL = `${window.location.protocol}//${window.location.host}`;

	// #endregion

	// #region 获取用户设置

	/**
	 * 获取用户设置。
	 * 从用户脚本的存储中检索各种设置，并为每个设置返回其值或默认值。
	 * 这些设置可以用于改变脚本的行为、外观和功能。
	 *
	 * @returns {Object} 返回一个对象，该对象包含了所有的用户设置。
	 */
	function getSettings() {
		/**
		 * 从脚本存储中获取JSON值。
		 * 如果检索到的值不是有效的JSON，则返回默认值。
		 *
		 * @param {string} key - 存储的键名。
		 * @param {string} defaultValue - 如果无法检索到或解析值，则返回的默认JSON值。
		 * @returns {any} 返回解析的JSON值或默认值。
		 */
		const getJSONValue = (key, defaultValue) => {
			const value = GM_getValue(key, defaultValue);
			try {
				return JSON.parse(value);
			} catch {
				return JSON.parse(defaultValue);
			}
		};

		return {
			logoText: GM_getValue("logoText", ""), // 评分文字和特效文字
			imageSize: GM_getValue("imageSize", "50px"), // 图片的大小
			imageUrl: GM_getValue("imageUrl", "/uc_server/data/avatar/000/46/26/94_avatar_big.jpg"), // 图片的URL
			blockMedals: GM_getValue("blockMedals", 1), // 隐藏勋章设置，默认为0（不隐藏）
			excludeGroup: getJSONValue("excludeGroup", "[]"), // 要排除的组
			TIDGroup: getJSONValue("TIDGroup", "[]"), // TID分组
			displayBlockedTips: GM_getValue("displayBlockedTips", false), // 是否显示屏蔽黑名单提示
			autoPagination: GM_getValue("autoPagination", false), // 是否开启自动翻页
			showImageButton: GM_getValue("showImageButton", "show"), // 是否显示图片
			excludeOptions: GM_getValue("excludeOptions", []), // 要排除的选项
			excludePostOptions: GM_getValue("excludePostOptions", []), // 要排除的选项
			blockedUsers: GM_getValue("blockedUsers", []), // 被屏蔽的用户
			orderFids: getJSONValue("orderFids", "[]"), // FID的顺序
			showAvatar: GM_getValue("showAvatar", false), // 是否显示用户头像
			autoHideButtons: GM_getValue("autoHideButtons", false), // 是否自动隐藏右侧按钮
			maxGradeThread: GM_getValue("maxGradeThread", 10),
			listFontSize: GM_getValue("listFontSize", "14px"), // 列表字体大小
			listFontWeight: GM_getValue("listFontWeight", "500"), // 列表字体粗细
			previewImageCount: GM_getValue("previewImageCount", 4), // 预览图片数量（3-20张）
			imagesPerRow: GM_getValue("imagesPerRow", 4), // 每行图片数（1-6张）
			displayThreadImages: GM_getValue("displayThreadImages", false), // 是否显示图片预览
			defaultSwipeToSearch: GM_getValue("defaultSwipeToSearch", true), // 是否开启划词搜索
			showDown: GM_getValue("showDown", true), // 是否显示下载附件
			showCopyCode: GM_getValue("showCopyCode", true), // 是否显示复制代码
			showFastPost: GM_getValue("showFastPost", true), // 是否显示快速发帖
			showFastReply: GM_getValue("showFastReply", true), // 是否显示快速回复
			showQuickGrade: GM_getValue("showQuickGrade", true), // 是否显示快速评分
			showQuickStar: GM_getValue("showQuickStar", true), // 是否显示快速收藏
			showClickDouble: GM_getValue("showClickDouble", true), // 是否显示一键功能二连
			showViewRatings: GM_getValue("showViewRatings", false), // 是否显示查看评分
			showPayLog: GM_getValue("showPayLog", true), // 是否显示购买记录
			showFastCopy: GM_getValue("showFastCopy", false), // 是否显示复制帖子
			blockingResolved: GM_getValue("blockingResolved", true),
			blockingIndex: GM_getValue("blockingIndex", false), // 是否屏蔽首页热门
			showSignTip: GM_getValue("showSignTip", false), // 是否开启静默签到
			showToggleImageButton: GM_getValue("showToggleImageButton", true), // 是否显示隐藏/显示图片按钮
			clickImagePreview: GM_getValue("clickImagePreview", false), // 是否启用单击打开图片预览
		};
	}

	// #endregion

	// #region 共用样式定义
	const COMMON_STYLES = `
* {
   text-decoration: none !important;
   font-weight: 500;
}

/* 功能设置面板 */
#organizeModal {
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%) scale(1);
	padding: 20px;
	z-index: 1000;
	position: fixed;
	display: none;
	cursor: move;
	user-select: none;
	line-height: 2.5;
	font-size: 13px;
	width: 650px;
	backdrop-filter: var(--backdrop-filter-3) !important;
	background-color: var(--panel-background-1);
	box-shadow: var(--panel-shadow);
	border: 1px solid var(--panel-border-1);
	border-radius: var(--radius16) !important;
}

/* 按钮样式 */
#shareBtn, #organizeBtn {
	color: #fff;
	border: none;
	height: 25px;
	width: 50px;
	margin-left: 20px;
	border-radius: 8px;
	background: var(--button-background-1) !important;
}

/* 输入框样式 */
#resourceName, #resourceSize, #videoCount, #imageCount, #quota, #resourceLink {
	border: 0.5px solid var(--input-border-3);
	margin-left: 4px;
	background: var(--input-background-3) !important;
	border-radius: var(--radius8) !important;
	padding: 1px 6px;
	color: var(--font-color);
}

#resourceName,
#resourceLink {
	width: 300px;
}

input[type="radio"] {
	accent-color: red;
	transition: all 0.2s ease;
	vertical-align: baseline;
}

#insetBtn {
	border: none;
	cursor: pointer;
	margin: 10px 0 0 7px;
	background-color: rgba(114, 194, 64, 1.00);
	color: #fff;
	box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
	height: 25px;
	width: 55px;
	font-size: 13px;
	border-radius: var(--radius8) !important;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  cursor: pointer;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background-color: var(--button-background-1);
  transition: 0.15s;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
}

.close-btn:hover {
  background-color: red;
}

.close-btn-line:first-child {
  transform: translate(-50%, -50%) rotate(45deg);
}

.close-btn-line:last-child {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.close-btn span {
    width: 11px;
    height: 2px;
    background: white;
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 999;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

`;
	// #endregion


	// #region 主样式

	function addStyles() {
		const style = document.createElement("style");
		style.innerHTML = `
/* 共用样式 */
${COMMON_STYLES}

/* --- 屏蔽卡片的强制隐藏样式 --- */
.thread-card.blocked-card {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    opacity: 0 !important;
    position: absolute !important;
    left: -9999px !important;
}

.bgsh-customBtn, .bgsh-searchBtn, .bgsh-quickReplyToPostBtn, .bgsh-QuickMiscReportBtn, .bgsh-quickReportadToPostBtn, .bgsh-quickTopicadminToPostBtn, .bgsh-quickGradeToPostBtn, .bgsh-openAllUrlBtn, .bgsh-fastPMButtonBtn, .bgsh-quickReplyEditToPostBtn {
	padding: 8px 15px;
	margin-bottom: 8px;
	margin-right: 8px;
	width: 100%;
	outline: none;
	white-space: pre-line;
	font-size: 14px;
  font-weight: bold;
	color: #fff;
	border-radius: 12px;
	background: rgba(0, 0, 0, 0.4) !important;
	border: none;
	backdrop-filter: var(--backdrop-filter-1) !important;
	cursor: pointer;
}

.bgsh-quickReplyToPostBtn, .bgsh-quickTopicadminToPostBtn, .bgsh-quickReplyEditToPostBtn {
	width: auto;
	float: right;
	box-shadow: none  !important;
	font-size: 13px;
	margin-top: 5px;
	color: #999;
	background-color: transparent !important;
}

.bgsh-quickGradeToPostBtn, .bgsh-QuickMiscReportBtn, .bgsh-quickReportadToPostBtn {
    width: auto;
    float: left;
    box-shadow: none;
    font-size: 13px;
    margin-top: 5px;
    color: #999;
    background-color: transparent !important;
}

.bgsh-fastPMButtonBtn {
  width: auto;
  float: left;
}

.bgsh-openAllUrlBtn {
  width: 100px;
  font-size: 16px;
  padding: 0;
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.1);
}

#quickTopicadminToPost,
 #quickReplyToPost,
 #quickMiscReport,
 #quickReportadToPost {
    box-shadow: none !important;
}

.bgsh-searchBtn {
  max-width: 400px;
  background-color: #E45E6B;
}

.bgsh-customBtn:hover,
.bgsh-searchBtn:hover,
.bgsh-quickGradeToPostBtn:hover,
.bgsh-quickReplyToPostBtn:hover,
.bgsh-QuickMiscReportBtn:hover,
.bgsh-quickReportadToPostBtn:hover,
.bgsh-fastPMButtonBtn:hover,
.bgsh-quickReplyEditToPostBtn:hover {
  text-shadow: 0 0px 5px rgba(255, 255, 255, 0.4) ;
  transition: all 0.2s ease;
}

.advanced-search {
	position: fixed;
	right: calc(0px + 1vh);
	top: 20px;
	border-radius: var(--radius16);
	z-index: 1000;
	color: var(--font-color-1);
	box-shadow: 0 1px 20px rgba(0, 0, 0, 0.08);
	background: var(--card-background-1);
	padding: 20px;
	display: grid;
	grid-template-columns: auto auto;
	column-gap: 20px;
	backdrop-filter: var(--backdrop-filter-3) !important;
	border: 1px solid var(--panel-border-1) !important;
}

.advanced-search .bgsh-forget {
  max-height: 500px;
  overflow: visible;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  font-size: 13px;
}

.bgsh-forget .bgsh-checkbox-label {
  display: block;
  position: relative;
  cursor: pointer;
  font-size: 22px;
  line-height: 22px;
  margin-right: 10px;
}

.bgsh-label-text {
  display: inline-block;
  left: 12%;
  font-size: 13px;
}

.bgsh-forget .bgsh-checkbox-label input {
  opacity: 0;
  cursor: pointer;
}

.bgsh-checkbox-label .bgsh-checkbox-custom {
  position: absolute;
  top: 8px;
  left: 0;
  height: 12px;
  width: 12px;
  background-color: var(--input-background-2);
  border-radius: 40px;
  border: none;
  box-shadow: none;
}

.bgsh-checkbox-label input:checked ~ .bgsh-checkbox-custom {
  box-shadow: none;
  background-color: #53C41B;
}

.bgsh-checkbox-label .bgsh-checkbox-custom::after {
  position: absolute;
  content: "";
  left: 10px;
  top: 10px;
  height: 0;
  width: 0;
  border-radius: 5px;
  border: solid #635f5f;
  border-width: 0 3px 3px 0;
  transform: rotate(0deg) scale(0);
  opacity: 1;
  transition: all 0.3s ease-out;
}

.bgsh-checkbox-label input:checked ~ .bgsh-checkbox-custom::after {
  position: absolute;
  top: 0;
  left: 0;
  height: 12px;
  width: 12px;
  background-color: #53C41B;
  border-radius: 40px;
  border: none;
  box-shadow: none;
  transition: none;
}

.bgsh-checkbox-label .bgsh-checkbox-custom::before {
  position: absolute;
  content: "";
  left: 1px;
  top: 5px;
  width: 10px;
  height: 2px;
  background-color: #848484;
  opacity: 0;
  transition: none;
}

.bgsh-checkbox-label input:indeterminate ~ .bgsh-checkbox-custom::before {
  opacity: 1;
}

.bgsh-dateInput {
  border: 1px solid #d4d4d4;
  background-color: #fff;
  transition: border 0.3s;
  margin: 0 5px;
  width: 150px;
}

.bgsh-dateInput:focus {
  border-color: #007BFF;
  outline: none;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.2);
}

.bgsh-dateInput:hover {
  border-color: #b3b3b3;
}

.bgsh-watermark-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.bgsh-watermark-text {
  position: absolute;
  text-align: center;
  font-size: 30px;
  color: #000;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
}

.bgsh-watermark-text .icon {
  width: 30px;
  height: 30px;
  fill: red;
  margin: 0 5px;
}

#customModal {
	position: fixed;
	left: 55%;
	top: 50%;
	transform: translate(-50%, -50%) scale(1);
	padding: 30px 10px;
	border-radius: 12px;
	width: 560px;
	z-index: 100;
	backdrop-filter: var(--backdrop-filter-3) !important;
	background: var(--panel-background-1);
	box-shadow: var(--panel-shadow);
	border: 1px solid var(--panel-border-1) !important;
}

#customModal > div {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

#customModal > div > dl {
	display: flex;
	padding: 10px;
	width: 500px;
	height: auto;
	overflow: visible;
	align-items: center;
	margin: 10px;
	flex-direction: row;
	border-radius: 8px;
	background-color: var(--panel-background-2);
}

#customModal > div > span {
    padding: 15px;
    display: block;
    margin: 10px 20px;
    background: #e0e0e070;
    border-radius: 8px;
}

#customModal > div > span a {
    color: #f44646 !important;
    font-size: 13px;
}

.tattl strong,
.tattl a {
    color: #f44646;
}

#customModal .xg1 {
    color: #333 !important;
}

.tattl dt {
    padding: 0!important;
    margin-right: 5px;
    width: 48px;
    height: 48px;
    line-height: 48px;
}

#closeModal {
    float: right;
    width: 18px;
    height: 18px;
    overflow: hidden;
    text-indent: -9999px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    background-color: rgba(0,0,0,1);
    border: none;
    color: #fff;
    position: absolute;
    top: 15px;
    cursor: pointer;
    right: 15px;
    transition: background 0.15s ease;
}

#closeModal:hover {
    background: red;
}

#closeModal::before,
#closeModal::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px; /* X线条长度 */
    height: 2px; /* X线条粗细 */
    background: white; /* X线条颜色 */
    transform: translate(-50%, -50%) rotate(45deg); /* 旋转45度 */
    transition: background 0.15s ease; /* 过渡效果 */
}

#closeModal::after {
    transform: translate(-50%, -50%) rotate(-45deg); /* 旋转-45度 */
}

#fwin_attachpay {
  position: fixed;
  z-index: 300;
  box-shadow: 0 2px 40px rgba(0, 0, 0, 0.20);
  left: 50%;
  top: 50%;
  border: 0px solid #ddd;
  transform: translate(-50%, -50%);
  backdrop-filter: var(--backdrop-filter-3) !important;
  background-color: #ffffffed;
}

#customModal > div > dl > dd > p.attnm > a {
   font-size: 13px;
}

.tattl dt {
    padding: 10px 20px 10px 10px;
}

.tattl dt img {
    width: 48px;
    height: 48px;
}

.attnm {
  height: auto;
  margin-bottom: 0;
  overflow: hidden;
  white-space: normal;
 }

.attm dt {
    display: none;
 }

#imagePreviewTbody {
	display: flex;
	width: 100%;
	overflow: visible;
}

#imagePreviewTbody td {
	width: 100%;
	padding: 0;
}

#imagePreviewTbody div {
    gap: 10px;
    padding: 0;
    display: flex;
    width: 100%;
    overflow: visible;
}

.thread-image-preview {
    display: grid !important;
    grid-template-columns: repeat(var(--grid-columns, 4), 1fr) !important;
    gap: 20px !important;
    margin: 15px 0 0 6px !important;
    max-height: none !important;
    width: 100% !important;
    box-sizing: border-box !important;
    align-items: start !important;
    padding: 0 20px 0 0;
}

.thread-image-preview img {
	object-fit: cover !important;
	width: 100% !important;
	aspect-ratio: 16/10 !important;
	cursor: pointer !important;
	border: 4px solid var(--img-border-1) !important;
	transition: transform 0.2s ease, box-shadow 0.2s ease !important;
	border-radius: var(--radius12) !important;
}

.thread-image-preview[style*="--grid-columns: 1"] img {
	max-height: 400px !important;
	height: auto !important;
	width: auto !important;
	max-width: 100% !important;
	object-fit: contain !important;
	aspect-ratio: unset !important;
}

.thread-image-preview img:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
	border-color: orangered !important;
}

.image-preview-popup {
	position: absolute !important;
	width: auto !important;
  max-width: 600px !important;
	height: auto !important;
	z-index: 9999 !important;
	pointer-events: none !important;
	border-radius: 14px !important;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1) !important;
	outline: 6px solid rgba(255, 255, 255) !important;
	background: rgba(255, 255, 255, 0.1) !important;
	opacity: 0 !important;
	transform: translateY(-20px) !important;
	transition: opacity 0.3s ease, transform 0.3s ease !important;
}

.image-preview-popup.show {
	opacity: 1 !important;
	transform: translateY(0) !important;
}

.title-preview-popup {
    position: fixed !important;
    width: 400px;
    height: 95vh;
    max-height: 99vh;
    z-index: 1 !important;
    background: var(--panel-background-1) !important;
    box-shadow: var(--panel-shadow) !important;
    border-radius: 16px !important;
    padding: 0 !important;
    opacity: 0 !important;
    transform: translateX(-100%) !important;
    transition: opacity 0.3s ease, transform 0.3s ease !important;
    overflow: hidden !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
    pointer-events: auto !important;
    cursor: default !important;
    display: flex !important;
    flex-direction: column !important;
}

.title-preview-popup::before {
    content: '' !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    backdrop-filter: var(--backdrop-filter-3) !important;
    border-radius: 16px !important;
    z-index: -1 !important;
    pointer-events: none !important;
}

.title-preview-close-btn {
	position: absolute !important;
	top: 15px !important;
	right: 15px !important;
	width: 18px !important;
	height: 18px !important;
	background: #000 !important;
	border-radius: 50% !important;
	cursor: pointer !important;
	z-index: 11 !important;
	transition: background 0.2s ease !important;
	border: none !important;
	box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15) !important;
}

.title-preview-close-btn:hover {
    background: red !important;
}

.title-preview-close-btn::before, .title-preview-close-btn::after {
	content: '' !important;
	position: absolute !important;
	top: 50% !important;
	left: 50% !important;
	width: 10px !important;
	height: 2px !important;
	background: white !important;
	transform: translate(-50%, -50%) rotate(45deg) !important;
}

.title-preview-close-btn::after {
    transform: translate(-50%, -50%) rotate(-45deg) !important;
}

.resize-handle {
    position: absolute !important;
    z-index: 12 !important;
    background: transparent !important;
}

.resize-handle.top { top: 0; left: 5px; right: 5px; height: 5px; cursor: ns-resize !important; }
.resize-handle.bottom { bottom: 0; left: 5px; right: 5px; height: 5px; cursor: ns-resize !important; }
.resize-handle.left { top: 5px; bottom: 5px; left: 0; width: 5px; cursor: ew-resize !important; }
.resize-handle.right { top: 5px; bottom: 5px; right: 0; width: 5px; cursor: ew-resize !important; }
.resize-handle.top-left { top: 0; left: 0; width: 10px; height: 10px; cursor: nwse-resize !important; }
.resize-handle.top-right { top: 0; right: 0; width: 10px; height: 10px; cursor: nesw-resize !important; }
.resize-handle.bottom-left { bottom: 0; left: 0; width: 10px; height: 10px; cursor: nesw-resize !important; }
.resize-handle.bottom-right { bottom: 0; right: 0; width: 10px; height: 10px; cursor: nwse-resize !important; }


.title-preview-popup.show {
	opacity: 1 !important;
	transform: translateX(0) !important;
}

.title-preview-content font {
  color: var(--font-color-1) !important;
	font-size: 13px !important;
  line-height: 1.8 !important;
  text-decoration: none !important;
  background: transparent !important;
}

.title-preview-header {
	position: absolute !important;
	top: 0 !important;
	left: 0 !important;
	right: 0 !important;
	z-index: 10 !important;
	display: flex !important;
	flex-direction: column !important;
	align-items: flex-start !important;
	justify-content: flex-start !important;
	padding: 12px 15px !important;
	cursor: move !important;
	user-select: none !important;
	backdrop-filter: blur(25px) !important;
	min-height: 0 !important;
	overflow: hidden !important;
}

.title-preview-title {
	color: var(--font-color-1) !important;
	font-size: 14px !important;
	flex: 1 !important;
	margin: 0 20px 0 0 !important;
	overflow: hidden !important;
	max-height: calc(1.4em * 2) !important;
}

.title-preview-popup .blockcode {
	overflow: hidden;
	margin: 10px 0;
  font-size: 12px;
	padding: 10px 30px;
	background: var(--panel-background-2);
	color: color: var(--font-color-1);
	border-radius: 12px !important;
}

.blockcode em {
	cursor: pointer;
	background: var(--img-border-1);
	border-radius: 5px !important;
	padding: 3px 6px;
}

.title-preview-popup .blockcode div {
	margin-bottom: 10px;
}

.title-preview-content {
	flex: 1 !important;
	padding: 100px 10px 10px !important;
	overflow-y: auto !important;
	overflow-x: hidden !important;
	word-wrap: break-word !important;
	margin: 5px;
}

.title-preview-popup .title-preview-content {
	/* Firefox 滚动条样式 */
	scrollbar-width: auto !important;
	scrollbar-color: rgba(0, 0, 0, 0.2) transparent !important;
}

.title-preview-popup .title-preview-content::-webkit-scrollbar {
	width: 4px !important;
}

.title-preview-popup .title-preview-content::-webkit-scrollbar-track {
	background: transparent !important;
}

.title-preview-popup .title-preview-content::-webkit-scrollbar-thumb {
	background: rgba(0, 0, 0, 0.2) !important;
	border-radius: 2px !important;
}

.title-preview-popup .title-preview-content::-webkit-scrollbar-thumb:hover {
	background: rgba(0, 0, 0, 0.3) !important;
}


.title-preview-content font div {
	text-align: left !important;
	line-height: 1.8 !important;
}

.title-preview-actions-container {
	display: flex;
	flex-wrap: wrap;
	gap: 10px !important;
	padding: 10px 0 0 5px !important;
	width: 100%;
	min-width: 0 !important;
}

.title-preview-action-btn {
	padding: 3px 7px !important;
	background: var(--img-border-1) !important;
	border-radius: 8px !important;
	cursor: pointer !important;
	transition: all 0.2s ease !important;
	white-space: nowrap !important;
	border: none;
	color: var(--font-color-1) !important;
	font-size: 12px !important;
}

.title-preview-action-btn.has-content {
    background: #52C52C !important;
    color: #fff !important;
}
.title-preview-action-btn[data-action="grade"]  {
    background: red !important;
    color: #fff !important;
}

.title-preview-post-content {
    padding: 10px;
}

/*-----强制左对齐------ */
/* 1. 对帖子内容容器本身设置 overflow-wrap，作为基础换行保障 */
.title-preview-post-content {
    padding: 10px;
    overflow-wrap: break-word; /* 替代 word-wrap，更标准 */
    word-wrap: break-word; /* 兼容旧浏览器 */
    word-break: break-word; /* 允许在单词内换行，但比 break-all 更柔和 */
}

/* 2. 基础重置与文本对齐 (层级 1) */
.title-preview-post-content * {
    max-width: 100% !important;
    box-sizing: border-box !important;
    height: auto !important;
    text-align: left !important;
}

/* 3. 块级元素与废弃属性重置 (层级 2) */
.title-preview-popup .title-preview-post-content center,
.title-preview-popup .title-preview-post-content [align="center"],
.title-preview-popup .title-preview-post-content [style*="margin: auto"],
.title-preview-popup .title-preview-post-content [style*="margin-left: auto"],
.title-preview-popup .title-preview-post-content [style*="margin-right: auto"] {
    text-align: left !important;
    margin-left: 0 !important;
    margin-right: auto !important; /* 强制左侧对齐 */
}

/* 4. Flexbox 布局重置 (层级 3) */
.title-preview-popup .title-preview-post-content [style*="display: flex"] {
    justify-content: flex-start !important;
}

/* 5. Grid 布局重置 (层级 4) */
.title-preview-popup .title-preview-post-content [style*="display: grid"] {
    justify-items: start !important;
    place-items: start !important;
}

/* 7. 针对性修复 <table> 溢出问题 (保留) */
.title-preview-post-content table {
    table-layout: fixed !important;
    width: 100% !important;
}

.title-preview-post-content .tattl {
	display: flex !important;
	flex-direction: row;
	font-size: 12px;
	align-items: center;
}

.title-preview-content .zoom {
	margin: 10px auto !important;
}

.title-preview-loading {
	text-align: center !important;
	color: var(--font-color-2) !important;
	padding: 40px 20px !important;
}

.title-preview-error {
	text-align: center !important;
	color: #ff6b6b !important;
	padding: 40px 20px !important;
}

ignore_js_op .vm {
    height: 48px;
    width: 48px;
}

.title-preview-content ignore_js_op .vm, .title-preview-content .tattl dt img {
	width: 42px !important;
}

.title-preview-content .tattl dt {
	width: auto !important;
}

.image-preview-popup img {
	width: 100% !important;
	height: auto !important;
	border-radius: 14px !important;
	display: block !important;
	max-height: 600px !important;
	border: none !important;
	object-fit: contain !important;
}


#imagePreviewTbody .thread-image-preview {
	width: calc(100% - 26px) !important;
}

.thread-card.sticky .thread-image-preview {
	display: none !important;
}

#postModal {
	position: fixed;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%) scale(1);
	padding: 0;
	width: 100%;
	height: 100%;
	z-index: 1000;
	overflow: hidden;
}

#postModal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #fff;
    backdrop-filter: var(--backdrop-filter-4) !important;
    z-index: -2;
}

#postModal::after {
    content: '';
    position: absolute;
    width: 120%;
    height: 120%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) var(--bg-transform, none);
    transform-origin: center center;
    background-image: var(--custom-background-image, none);
    background-size: var(--bg-background-size, var(--bg-size, cover));
    background-position: var(--bg-position-x, 50%) var(--bg-position-y, 50%);
    background-repeat: var(--bg-repeat, no-repeat);
    background-attachment: fixed;
    filter: var(--bg-filter, none);
    opacity: var(--bg-opacity, 1);
    isolation: isolate;
    will-change: filter, transform;
    z-index: -1;
}

.theme-dark #postModal::before {
    background: var(--bg-color, #1a1a1a);
    backdrop-filter: var(--backdrop-filter-4) !important;
}

.theme-dark #postModal::after {
    box-shadow: inset 0 0 0 1000px rgba(0, 0, 0, var(--dark-overlay-opacity, 0.5));
}

#postModal .close-btn {
	position: absolute;
	top: 15px;
	right: 15px;
	cursor: pointer;
	width: 25px;
	height: 25px;
	border-radius: 50%;
	border: none;
	background-color: #000;
	transition: 0.15s;
	box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
	z-index: 1001;
}

#postModal .close-btn:hover {
	background-color: red;
}

#postModal .close-btn::before,
#postModal .close-btn::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 12px;
	height: 2px;
	background: white;
	transform: translate(-50%, -50%) rotate(45deg);
	transition: background 0.15s ease;
}

#postModal .close-btn::after {
	transform: translate(-50%, -50%) rotate(-45deg);
}

.avatar.use-default-avatar .avtm {
  content: "" !important;
	background-image: url('/uc_server/images/noavatar_middle.gif') !important;
	background-size: contain !important;
	background-repeat: no-repeat !important;
	background-position: center !important;
	width: 100% !important;
	height: 100px !important;
	display: block !important;
	border-radius: 14px;
	outline: 4px solid var(--primary-color) !important;
}
.avatar.use-default-avatar img {
    display: none !important;
    visibility: hidden !important;
}

.thread-avatar, .avatar {
 position: relative !important;
 overflow: visible !important;
}

/* 右侧按钮自动隐藏功能 */
.bgsh-button-container.auto-hide {
    transform: translateY(-50%) translateX(120px) !important;
    transition: transform 0.3s ease !important;
}

/* 创建一个独立的触发区域 */
.bgsh-trigger-area {
	position: fixed !important;
	top: 30vh !important;
	right: 0 !important;
	width: 70px !important;
	height: 40vh !important;
	background: transparent !important;
	pointer-events: auto !important;
}

/* 当按钮容器显示时的状态 */
.bgsh-button-container.auto-hide.show {
    transform: translateY(-50%) translateX(0) !important;
}

.bgsh-setting-second label {
	padding: 10px 0 2px 0 !important;
	display: inline-block;
    font-weight: bold !important;
}
.bgsh-setting-first > label:nth-of-type(1), .bgsh-setting-first > label:nth-of-type(2), .bgsh-setting-first > label:nth-of-type(3) {
    padding: 10px 0 2px 0 !important;
    display: inline-block;
    font-weight: bold !important;
}

.image-preview-popup.show {
	opacity: 1 !important;
	transform: translateY(0) scale(1) !important;
	filter: blur(0px) !important;
	box-shadow: 0 1px 50px rgba(0, 0, 0, 0.5) !important;
}

.thread-preview-btn {
    margin-right: 20px !important;
    display: inline-flex !important;
    align-items: center !important;
    font-size: 11px !important;
    color: var(--font-color-1) !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    padding: 2px 4px !important;
    border-radius: var(--radius8) !important;
    background: transparent !important;
    border: none !important;
    text-decoration: none !important;
    pointer-events: auto !important;
    user-select: none !important;
}

.thread-preview-btn:hover {
    opacity: 1 !important;
    background: var(--img-border-1) !important;
    color: var(--font-color-1) !important;
}

.thread-preview-btn::before {
    content: "" !important;
    margin-right: 4px !important;
    width: 14px !important;
    height: 14px !important;
    display: inline-block !important;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333'%3E%3Cpath d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'/%3E%3C/svg%3E") !important;
    background-size: contain !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
    vertical-align: middle !important;
    filter: var(--filter1) !important;
}

/* 导航菜单样式 */
.bgsh-navigation-menu {
	position: fixed !important;
	z-index: 9999 !important;
	border-radius: var(--radius16) !important;
	opacity: 0 !important;
  margin-top: 6px !important;
	transition: opacity 0.25s ease, transform 0.25s ease !important;
	background: var(--card-background-1) !important;
	backdrop-filter: var(--backdrop-filter-1) !important;
	box-shadow: var(--panel-shadow-s) !important;
	border: 1px solid var(--card-border-1) !important;
}

.bgsh-navigation-menu.bgsh-show {
    opacity: 1 !important;
    transform: translateY(0) scale(1) !important;
}

/* 导航头部样式 */
.bgsh-navigation-header {
	padding: 10px 0 0 0 !important;
	border-bottom: 1px solid var(--border-color) !important;
	background: var(--bg-color-light) !important;
	border-radius: var(--radius16) var(--radius16) 0 0 !important;
	text-align: center !important;
}

.bgsh-add-board-btn {
	font-size: 13px !important;
	color: var(--tag-font-color) !important;
	cursor: pointer !important;
	padding: 4px 0 !important;
	background: #52C52C;
	border-radius: 8px !important;
	width: 70px;
	margin: 0 auto;
}

/* 导航列表样式 */
.bgsh-navigation-list {
	display: flex !important;
	flex-direction: row !important;
	flex-wrap: wrap !important;
	padding: 10px;
	gap: 10px !important;
	align-content: flex-start !important;
}

.bgsh-navigation-column {
    display: flex !important;
    flex-direction: column !important;
    min-width: 120px !important;
    max-width: 150px !important;
    flex: 0 0 auto !important;
    gap: 5px !important;
}

.bgsh-navigation-item {
	display: flex !important;
	align-items: center !important;
	justify-content: space-between !important;
	padding: 5px 10px !important;
	cursor: pointer !important;
	transition: background-color 0.2s ease !important;
	font-size: 13px !important;
	color: var(--font-color) !important;
	border-radius: var(--radius10) !important;
	white-space: nowrap !important;
}

.bgsh-navigation-item:hover {
	background: var(--panel-background-2) !important;
	color: red !important;
}

.bgsh-navigation-item span {
    flex: 1 !important;
}

.bgsh-delete-board-btn {
    width: 20px !important;
    height: 20px !important;
    border: none !important;
    background: transparent !important;
    color: var(--danger-color) !important;
    font-size: 16px !important;
    font-weight: bold !important;
    cursor: pointer !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
    opacity: 0 !important;
}

.bgsh-navigation-item:hover .bgsh-delete-board-btn {
    opacity: 1 !important;
}

.bgsh-navigation-empty {
    padding: 20px 16px !important;
    text-align: center !important;
    color: var(--font-color-light) !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
}

.bgsh-navigation-empty div:first-child {
    margin-bottom: 8px !important;
    color: var(--font-color) !important;
}

.bgsh-navigation-empty div:last-child {
    font-size: 12px !important;
}

/* 划词搜索弹窗样式 */
.bgsh-sav-menu {
    z-index: 9999 !important;
    box-shadow: 0 1px 20px rgba(0, 0, 0, 0.2) !important;
    border-radius: 12px !important;
    backdrop-filter: var(--backdrop-filter-1) !important;
    font-size: 15px !important;
    padding: 2px 10px;
    width: auto;
    background: rgba(255,0, 0, 0.65) !important;
    color: #fff;
    transition: none !important;
    animation: none !important;
    opacity: 0 !important;
    transform: translateY(8px) scale(0.95) !important;
}

/* 显示状态的样式类 */
.bgsh-sav-menu.bgsh-show {
    opacity: 1 !important;
    transform: translateY(0) scale(1) !important;
    transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.savlink {
    padding: 8px 12px !important;
    cursor: pointer !important;
    user-select: none !important;
    text-align: left !important;
    display: block !important;
}

.savlink.savsehuatang:hover {
	text-shadow: none;
}

`;

		document.head.appendChild(style);
	}

	// #endregion

	// #region 附件类型判断

	/**
	 * 判断文件是否为支持的附件类型
	 * @param {string} fileName - 文件名
	 * @returns {boolean} - 是否为支持的附件类型
	 */
	function isSupportedAttachment(fileName) {
		if (!fileName) return false;

		// 支持的附件格式列表 - 集中管理，方便修改
		const supportedExtensions = ['txt', 'doc', 'docx', 'pdf', 'zip', 'rar', '7z', 'tar', 'gz', 'exe', 'apk'];

		// 创建正则表达式
		const extensionPattern = new RegExp(`\\.(${supportedExtensions.join('|')})$`, 'i');

		return extensionPattern.test(fileName);
	}

	/**
	 * 判断文件是否为图片类型（用于排除图片文件）
	 * @param {string} fileName - 文件名
	 * @returns {boolean} - 是否为图片文件
	 */
	function isImageFile(fileName) {
		if (!fileName) return false;
		return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
	}

	// #endregion

	// #region 动态图片尺寸计算

	/**
	 * 根据容器宽度和图片数量动态计算 CSS Grid 布局参数
	 * @param {HTMLElement} container - 图片预览容器
	 * @param {number} imageCount - 图片数量
	 * @param {number} userMaxImages - 用户设置的最大显示数量
	 * @param {number} userImagesPerRow - 用户设置的每行图片数
	 * @returns {Object} - 包含 columns 的对象
	 */
	function calculateGridLayout(container, imageCount, userMaxImages = 4, userImagesPerRow = 4) {
		// 计算实际显示的图片数量（预览图片数量优先级最高）
		const actualImageCount = Math.min(imageCount, userMaxImages);

		// 计算列数：根据实际图片数量和用户设置的每行数确定
		// 如果实际图片数量少于每行设置数，则使用实际图片数量
		const columns = Math.min(actualImageCount, userImagesPerRow);

		return {
			columns: columns
		};
	}



	/**
	 * 为图片预览容器设置动态 Grid 布局
	 * @param {HTMLElement} container - 图片预览容器
	 * @param {number} imageCount - 图片数量
	 */
	function setDynamicImageSize(container, imageCount) {
		// 获取用户设置
		const settings = getSettings();
		const userMaxImages = Math.max(1, Math.min(20, settings.previewImageCount || 4));
		const userImagesPerRow = Math.max(1, settings.imagesPerRow || 4);

		const layout = calculateGridLayout(container, imageCount, userMaxImages, userImagesPerRow);
		container.style.setProperty('--grid-columns', layout.columns);


	}

	// #endregion

	// #region 图片预览功能

	// 全局变量用于跟踪当前显示的预览
	let currentPreviewPopup = null;
	let currentCloseHandler = null;
	let isShowingPreview = false; // 标记是否正在显示预览过程中

	/**
	 * 为图片添加预览功能（根据设置决定使用hover还是click）
	 * @param {HTMLImageElement} img - 图片元素
	 */
	function addImageHoverPreview(img) {
		const settings = getSettings();

		if (settings.clickImagePreview) {
			addImageClickPreview(img);
		} else {
			addImageHoverPreviewOriginal(img);
		}
	}

	/**
	 * 为图片添加点击预览功能
	 * @param {HTMLImageElement} img - 图片元素
	 */
	function addImageClickPreview(img) {
		// 添加点击事件
		img.addEventListener('click', function (e) {
			// 阻止浏览器默认的图片打开行为
			e.preventDefault();
			e.stopPropagation();

			// 设置标记，表示正在显示预览
			isShowingPreview = true;

			// 如果当前有预览显示，先隐藏它
			if (currentPreviewPopup) {
				hideCurrentPreview();
			}

			// 延迟显示新的预览，确保当前事件处理完成
			setTimeout(() => {
				showImagePreview(img);
				// 重置标记
				setTimeout(() => {
					isShowingPreview = false;
				}, 50);
			}, 10);
		});

		// 添加样式指示这是可点击的
		img.style.cursor = 'pointer';
	}

	/**
	 * 显示图片预览
	 * @param {HTMLImageElement} img - 图片元素
	 */
	function showImagePreview(img) {
		// 创建预览弹窗
		currentPreviewPopup = document.createElement('div');
		currentPreviewPopup.className = 'image-preview-popup';

		// 创建预览图片
		const previewImg = document.createElement('img');
		previewImg.src = img.src;
		previewImg.alt = img.alt || '';

		// 先设置预览图为不可见，等待图片加载完成后再定位
		currentPreviewPopup.style.opacity = '0';
		currentPreviewPopup.style.visibility = 'hidden';

		currentPreviewPopup.appendChild(previewImg);
		document.body.appendChild(currentPreviewPopup);

		// 清理之前的事件监听器
		if (currentCloseHandler) {
			document.removeEventListener('click', currentCloseHandler);
		}

		// 添加点击外部关闭功能
		currentCloseHandler = (e) => {
			// 如果正在显示预览过程中，忽略这次点击
			if (isShowingPreview) {
				return;
			}

			// 检查点击的目标是否是预览窗口或其子元素
			if (!currentPreviewPopup || !currentPreviewPopup.contains(e.target)) {
				hideCurrentPreview();
			}
		};

		// 使用requestAnimationFrame确保在下一个事件循环中添加监听器
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (currentPreviewPopup) { // 确保预览仍然存在
					document.addEventListener('click', currentCloseHandler);
				}
			});
		});

		// 等待图片加载完成后再进行精确定位
		const positionPreview = () => {
			if (!currentPreviewPopup) return; // 防止在加载过程中被清除

			// 计算位置 - 在原图片正上方且不覆盖
			const imgRect = img.getBoundingClientRect();
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

			// 获取预览弹窗的实际宽度（动态宽度）
			const actualPopupWidth = currentPreviewPopup.offsetWidth;

			// 计算水平位置（居中对齐，考虑页面滚动）
			let left = imgRect.left + scrollLeft + (imgRect.width / 2) - (actualPopupWidth / 2);

			// 确保不超出屏幕边界
			const margin = 20;
			if (left < scrollLeft + margin) {
				left = scrollLeft + margin;
			} else if (left + actualPopupWidth > scrollLeft + window.innerWidth - margin) {
				left = scrollLeft + window.innerWidth - actualPopupWidth - margin;
			}

			// 计算垂直位置（在图片上方，确保不覆盖原图）
			const gap = 15; // 固定间距
			const originalImageTop = imgRect.top + scrollTop; // 原图顶部位置

			// 获取预览图的真实高度
			const actualPopupHeight = currentPreviewPopup.offsetHeight;
			// 放宽判断条件：只需要75%的预览图高度+间距即可显示在上方
			const requiredSpaceAbove = actualPopupHeight * 0.75 + gap;

			let top;

			// 检查上方是否有足够空间
			if (imgRect.top >= requiredSpaceAbove) {
				// 上方空间足够，显示在原图上方
				// 使用真实高度计算位置：原图顶部 - 预览图真实高度 - 固定间距
				top = originalImageTop - actualPopupHeight - gap;
			} else {
				// 上方空间不足，显示在原图下方
				// 预览图显示在原图底部下方
				top = originalImageTop + imgRect.height + gap;
			}

			// 设置最终位置
			currentPreviewPopup.style.left = left + 'px';
			currentPreviewPopup.style.top = top + 'px';
			currentPreviewPopup.style.transform = 'none';

			// 恢复可见性并显示动画
			currentPreviewPopup.style.visibility = 'visible';
			currentPreviewPopup.style.opacity = '0'; // 重置opacity为动画准备

			requestAnimationFrame(() => {
				if (currentPreviewPopup) {
					currentPreviewPopup.classList.add('show');
				}
			});
		};

		// 如果图片已经加载完成，直接定位
		if (previewImg.complete) {
			positionPreview();
		} else {
			// 否则等待图片加载完成
			previewImg.addEventListener('load', positionPreview);
			// 添加错误处理
			previewImg.addEventListener('error', positionPreview);
		}
	}

	/**
	 * 隐藏当前预览
	 */
	function hideCurrentPreview() {
		if (currentPreviewPopup) {
			currentPreviewPopup.classList.remove('show');

			// 立即从DOM中移除，不等待动画
			if (currentPreviewPopup.parentNode) {
				currentPreviewPopup.parentNode.removeChild(currentPreviewPopup);
			}
			currentPreviewPopup = null;
		}

		// 清理事件监听器
		if (currentCloseHandler) {
			document.removeEventListener('click', currentCloseHandler);
			currentCloseHandler = null;
		}
	}

	/**
	 * 原始的hover预览功能
	 * @param {HTMLImageElement} img - 图片元素
	 */
	function addImageHoverPreviewOriginal(img) {
		let previewPopup = null;
		let showTimeout = null;
		let hideTimeout = null;

		// 鼠标进入图片时显示预览
		img.addEventListener('mouseenter', function (e) {
			// 清除隐藏定时器
			if (hideTimeout) {
				clearTimeout(hideTimeout);
				hideTimeout = null;
			}

			// 设置显示延迟
			showTimeout = setTimeout(() => {
				// 创建预览弹窗
				previewPopup = document.createElement('div');
				previewPopup.className = 'image-preview-popup';

				// 创建预览图片
				const previewImg = document.createElement('img');
				previewImg.src = img.src;
				previewImg.alt = img.alt || '';

				// 先设置预览图为不可见，等待图片加载完成后再定位
				previewPopup.style.opacity = '0';
				previewPopup.style.visibility = 'hidden';

				previewPopup.appendChild(previewImg);
				document.body.appendChild(previewPopup);

				// 等待图片加载完成后再进行精确定位
				const positionPreview = () => {
					// 计算位置 - 在原图片正上方且不覆盖
					const imgRect = img.getBoundingClientRect();
					const scrollTop = window.scrollY || document.documentElement.scrollTop;
					const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

					// 获取预览弹窗的实际宽度（动态宽度）
					const actualPopupWidth = previewPopup.offsetWidth;

					// 计算水平位置（居中对齐，考虑页面滚动）
					let left = imgRect.left + scrollLeft + (imgRect.width / 2) - (actualPopupWidth / 2);

					// 确保不超出屏幕边界
					const margin = 20;
					if (left < scrollLeft + margin) {
						left = scrollLeft + margin;
					} else if (left + actualPopupWidth > scrollLeft + window.innerWidth - margin) {
						left = scrollLeft + window.innerWidth - actualPopupWidth - margin;
					}

					// 计算垂直位置（在图片上方，确保不覆盖原图）
					const gap = 15; // 固定间距
					const originalImageTop = imgRect.top + scrollTop; // 原图顶部位置

					// 获取预览图的真实高度
					const actualPopupHeight = previewPopup.offsetHeight;
					// 放宽判断条件：只需要75%的预览图高度+间距即可显示在上方
					const requiredSpaceAbove = actualPopupHeight * 0.75 + gap;

					let top;

					// 检查上方是否有足够空间
					if (imgRect.top >= requiredSpaceAbove) {
						// 上方空间足够，显示在原图上方
						// 使用真实高度计算位置：原图顶部 - 预览图真实高度 - 固定间距
						top = originalImageTop - actualPopupHeight - gap;
					} else {
						// 上方空间不足，显示在原图下方
						// 预览图显示在原图底部下方
						top = originalImageTop + imgRect.height + gap;
					}

					// 设置最终位置
					previewPopup.style.left = left + 'px';
					previewPopup.style.top = top + 'px';
					previewPopup.style.transform = 'none';

					// 恢复可见性并显示动画
					previewPopup.style.visibility = 'visible';
					previewPopup.style.opacity = '0'; // 重置opacity为动画准备

					requestAnimationFrame(() => {
						previewPopup.classList.add('show');
					});
				};

				// 如果图片已经加载完成，直接定位
				if (previewImg.complete) {
					positionPreview();
				} else {
					// 否则等待图片加载完成
					previewImg.addEventListener('load', positionPreview);
					// 添加错误处理
					previewImg.addEventListener('error', positionPreview);
				}
			}, 300); // 300ms延迟显示
		});

		// 鼠标离开图片时隐藏预览
		img.addEventListener('mouseleave', function () {
			// 清除显示定时器
			if (showTimeout) {
				clearTimeout(showTimeout);
				showTimeout = null;
			}

			// 设置隐藏延迟
			hideTimeout = setTimeout(() => {
				if (previewPopup) {
					previewPopup.classList.remove('show');
					setTimeout(() => {
						if (previewPopup && previewPopup.parentNode) {
							previewPopup.parentNode.removeChild(previewPopup);
						}
						previewPopup = null;
					}, 150); // 缩短等待动画完成的时间
				}
			}, 100); // 100ms延迟隐藏
		});
	}

	// #endregion

	// #region 标题悬停预览功能

	// 全局变量用于跟踪当前显示的标题预览
	let currentTitlePreview = null;
	let titlePreviewTimeout = null;
	let titleContentCache = new Map(); // 缓存已获取的帖子内容
	let titlePidCache = new Map(); // 缓存帖子的主帖PID
	let currentTitleElement = null; // 当前触发预览的标题元素
	let lastPopupPosition = null; // 记忆弹窗最后的位置
	let lastPopupSize = null; // 记忆弹窗最后的大小

	/**
	 * 检查链接是否为帖子详情页链接
	 * @param {string} url - 要检查的URL
	 * @returns {boolean} - 是否为帖子详情页链接
	 */
	function isThreadDetailUrl(url) {
		if (!url) return false;

		// 检查是否包含thread参数，这表示是帖子详情页
		return url.includes('thread-') || url.includes('mod=viewthread');
	}

	/**
	 * 为帖子列表添加预览按钮
	 * @param {HTMLElement} threadCard - 帖子卡片元素
	 */
	function addTitlePreviewButton(threadCard) {
		if (!threadCard || threadCard.dataset.previewButtonAdded) {
			return;
		}
		threadCard.dataset.previewButtonAdded = "true";

		const threadInfo = threadCard.querySelector('.thread-info');

		// 查找真正的帖子标题链接 - 跳过标签链接
		const titleContainer = threadCard.querySelector('.thread-title');
		if (!titleContainer || !threadInfo) {
			return;
		}

		// 获取所有链接，找到帖子详情页链接
		const allLinks = titleContainer.querySelectorAll('a');
		let titleLink = null;

		for (const link of allLinks) {
			if (isThreadDetailUrl(link.href)) {
				titleLink = link;
				break;
			}
		}

		if (!titleLink) {
			return;
		}


		// 创建预览按钮
		const previewButton = document.createElement('span');
		previewButton.className = 'thread-preview-btn';
		previewButton.textContent = '快速预览';

		// 点击事件
		previewButton.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			const fid = getQueryParams(window.location.href).fid;

			// 核心逻辑：检查是否已有窗口
			if (currentTitlePreview && document.body.contains(currentTitlePreview)) {
				// 如果有，更新它
				updateTitlePreview(titleLink, fid);
			} else {
				// 如果没有，创建新的
				showTitlePreview(titleLink, fid);
			}
		});

		// 查找查看次数元素，在其后插入预览按钮
		let viewsElement = threadInfo.querySelector('.thread-views');

		// 如果没找到.thread-views类，查找包含"查看"文本的span
		if (!viewsElement) {
			const spans = threadInfo.querySelectorAll('span');
			for (const span of spans) {
				if (span.textContent && span.textContent.includes('查看')) {
					viewsElement = span;
					break;
				}
			}
		}

		if (viewsElement) {
			// 在查看次数后插入
			viewsElement.parentNode.insertBefore(previewButton, viewsElement.nextSibling);
		} else {
			// 如果都没找到，插入到thread-info的开头（保持原有逻辑作为后备）
			threadInfo.insertBefore(previewButton, threadInfo.firstChild);
		}

	}

	/**
	 * 清除标题预览隐藏定时器
	 */
	function clearTitlePreviewTimeout() {
		if (titlePreviewTimeout) {
			clearTimeout(titlePreviewTimeout);
			titlePreviewTimeout = null;
		}
	}

	/**
	 * 安排标题预览隐藏
	 * @param {number} delay - 延迟时间（毫秒）
	 */
	function scheduleTitlePreviewHide(delay = 300) {
		clearTitlePreviewTimeout();
		titlePreviewTimeout = setTimeout(() => {
			hideTitlePreview();
		}, delay);
	}

	/**
	 * 显示预览错误提示
	 * @param {string} title - 标题
	 * @param {string} message - 错误消息
	 */
	function showPreviewError(title, message) {
		// 创建错误提示弹窗
		const errorPopup = document.createElement('div');
		errorPopup.className = 'title-preview-popup';
		errorPopup.innerHTML = `
			<div class="title-preview-header">
				<div class="title-preview-title">${title}</div>
			</div>
			<div class="title-preview-content">
				<div class="title-preview-error">${message}</div>
			</div>
		`;

		document.body.appendChild(errorPopup);
		currentTitlePreview = errorPopup;

		// 定位弹窗
		positionTitlePreview(errorPopup);

		// 显示弹窗动画
		requestAnimationFrame(() => {
			if (errorPopup) {
				errorPopup.classList.add('show');
			}
		});

		// 添加事件监听
		setupTitlePreviewEvents(errorPopup);

		// 3秒后自动关闭
		setTimeout(() => {
			if (currentTitlePreview === errorPopup) {
				hideTitlePreview();
			}
		}, 3000);
	}

	/**
	 * 从预览弹窗收藏帖子
	 * @param {string} tid - 帖子ID
	 */
	async function starFromPreview(tid) {
		const formHash = getFormHash();
		if (!tid || !formHash) {
			showTooltip("无法收藏：缺少帖子ID或验证信息");
			return;
		}
		const starUrl = `/home.php?mod=spacecp&ac=favorite&type=thread&id=${tid}&formhash=${formHash}&infloat=yes&handlekey=k_favorite&inajax=1&ajaxtarget=fwin_content_k_favorite`;
		const text = await fetch(starUrl).then((r) => r.text());
		if (text.includes("抱歉，您已收藏，请勿重复收藏")) {
			return showTooltip("抱歉，您已收藏，请勿重复收藏");
		}
		if (text.includes("信息收藏成功")) {
			return showTooltip("信息收藏成功");
		}
		showTooltip("信息收藏出现问题！！！");
	}

	/**
	 * 解码Cloudflare邮箱保护的编码字符串
	 * @param {string} encodedString - 编码的字符串
	 * @returns {string} - 解码后的字符串
	 */
	function decodeCloudflareEmail(encodedString) {
		try {
			// Cloudflare邮箱保护解码算法
			let decoded = '';
			const key = parseInt(encodedString.substring(0, 2), 16);
			for (let i = 2; i < encodedString.length; i += 2) {
				const charCode = parseInt(encodedString.substring(i, i + 2), 16) ^ key;
				decoded += String.fromCharCode(charCode);
			}

			return decoded;
		} catch (error) {
			console.error('[DEBUG] Cloudflare邮箱解码失败:', error, '原始字符串:', encodedString);
			return encodedString; // 解码失败时返回原始字符串
		}
	}

	/**
	 * 处理[email protected]文本，将其替换为实际内容
	 * @param {HTMLElement} container - 要处理的容器元素
	 * @returns {number} 处理的文本节点数量
	 */
	function fixEmailProtectedText(container) {
		// 查找所有包含[email protected]的文本节点
		const walker = document.createTreeWalker(
			container,
			NodeFilter.SHOW_TEXT,
			null,
			false
		);

		const textNodes = [];
		let node;
		while (node = walker.nextNode()) {
			if (node.textContent && node.textContent.includes('[email protected]')) {
				textNodes.push(node);
			}
		}

		textNodes.forEach((textNode, index) => {
			const originalText = textNode.textContent;
			console.log(`[DEBUG] 处理文本节点 #${index + 1}:`, originalText.substring(0, 100));

			// 检查父元素上下文，判断是否可能是附件名
			const parentElement = textNode.parentNode;
			const isInAttachmentContext = parentElement && (
				parentElement.classList.contains('attnm') ||
				parentElement.closest('.tattl') ||
				parentElement.closest('.pattl') ||
				parentElement.closest('[id*="attach_"]') ||
				parentElement.closest('span[id*="attach_"]') ||
				(parentElement.textContent && (
					parentElement.textContent.includes('KB') ||
					parentElement.textContent.includes('MB') ||
					parentElement.textContent.includes('下载次数')
				))
			);

			// 决策理由：不仅在附件上下文中处理，也处理所有可能的附件名模式
			const containsFileExtension = /\.(mp4|txt|zip|rar|7z|pdf|doc|docx|exe|apk|tar|gz|xls|xlsx|ppt|pptx|jpg|png|gif)/i.test(originalText);
			const shouldRestore = isInAttachmentContext || containsFileExtension;

			if (shouldRestore) {
				// 处理多种可能的编码形式
				let restoredText = originalText
					.replace(/\[email&#160;protected\]/g, '@')
					.replace(/\[email&nbsp;protected\]/g, '@')
					.replace(/\[email protected\]/g, '@')
					.replace(/\[email\s*protected\]/g, '@');

				textNode.textContent = restoredText;
			}
		});

		return textNodes.length;
	}

	/**
	 * 修复容器内被误识别为邮箱的@符号链接
	 * @param {HTMLElement} container - 要处理的容器元素
	 */
	function fixEmailLinksInContainer(container) {
		// 决策理由：添加处理状态标记，避免重复处理同一容器
		if (container.dataset.emailLinksFixed === 'true') {
			return; // 已经处理过，跳过
		}

		// 决策理由：查找所有可能被误识别为邮箱的链接
		// Cloudflare解码已在extractMainPostContent中完成，这里只处理非Cloudflare的误识别情况

		// 首先处理[email protected]文本
		const protectedTextCount = fixEmailProtectedText(container);

		// 查找所有可能的Cloudflare保护邮箱元素（可能在extractMainPostContent中未处理完）
		const cfEmailLinks = container.querySelectorAll('a.__cf_email__, span.__cf_email__, [data-cfemail], .__cf_email__');
		let processedCfEmails = 0;

		if (cfEmailLinks.length > 0) {
			cfEmailLinks.forEach((emailLink, index) => {
				const encodedString = emailLink.dataset.cfemail;
				if (encodedString) {
					const decodedEmail = decodeCloudflareEmail(encodedString);
					const textNode = document.createTextNode(decodedEmail);
					emailLink.parentNode.replaceChild(textNode, emailLink);
					processedCfEmails++;
				}
			});
		}

		// 查找所有mailto链接
		const emailLinks = container.querySelectorAll('a[href*="mailto:"]');
		let processedMailtoLinks = 0;

		emailLinks.forEach((link, index) => {
			const originalText = link.textContent;
			const href = link.getAttribute('href');

			// 检查是否是被误识别的文件名（包含@符号但不是真正的邮箱）
			// 决策理由：扩展附件名检测模式，支持更多常见的附件命名格式
			const isAttachmentName = originalText.includes('@') && (
				// 常见文件扩展名
				originalText.includes('.mp4') || originalText.includes('.txt') ||
				originalText.includes('.zip') || originalText.includes('.rar') ||
				originalText.includes('.7z') || originalText.includes('.pdf') ||
				originalText.includes('.doc') || originalText.includes('.docx') ||
				originalText.includes('.exe') || originalText.includes('.apk') ||
				originalText.includes('.tar') || originalText.includes('.gz') ||
				// 常见域名模式
				originalText.match(/www\.\w+\.la@/i) ||
				originalText.match(/\w+\.net@/i) ||
				originalText.match(/\w+\.com@/i) ||
				originalText.match(/\w+\.org@/i) ||
				// 常见附件命名模式（数字@、字母@等）
				originalText.match(/\d+@/i) ||
				originalText.match(/[a-zA-Z]+\d*@/i) ||
				// 包含中文字符的附件名
				originalText.match(/[\u4e00-\u9fa5].*@/i) ||
				// 特殊字符组合（如下划线、连字符等）
				originalText.match(/[_\-\.].*@/i)
			);

			// 扩展检测条件，查找更多可能的附件名模式
			const hasFileExtension = /\.(mp4|txt|zip|rar|7z|pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|png|gif|exe|apk|tar|gz)$/i.test(originalText);
			const containsAtSymbol = originalText.includes('@');

			// 决策理由：增加更精确的附件名检测，避免误判真正的邮箱地址
			const isLikelyEmail = originalText.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
			const isInAttachmentContext = link.closest('.tattl, .pattl, .attnm, [id*="attach_"]') !== null;

			// 决策理由：如果是附件名、或者包含文件扩展名且有@符号、或者在附件上下文中且不是标准邮箱格式，则替换为普通文本
			if (isAttachmentName ||
				(hasFileExtension && containsAtSymbol) ||
				(isInAttachmentContext && containsAtSymbol && !isLikelyEmail)) {
				const textNode = document.createTextNode(originalText);
				link.parentNode.replaceChild(textNode, link);
				processedMailtoLinks++;
			}
		});

		// 标记容器已处理完成
		container.dataset.emailLinksFixed = 'true';

		// 决策理由：只在有实际处理内容时输出日志，减少冗余信息
		const totalProcessed = protectedTextCount + processedCfEmails + processedMailtoLinks;
		if (totalProcessed > 0) {
			console.log(`[DEBUG] fixEmailLinksInContainer 处理完成 - 保护文本:${protectedTextCount}, CF邮箱:${processedCfEmails}, mailto链接:${processedMailtoLinks}`);
		}
	}

	/**
	 * 获取附件图标，优先使用美化脚本的图标映射
	 * @param {string} attachmentUrl - 附件URL
	 * @param {string} originalIconSrc - 原始图标路径
	 * @param {string} fileName - 附件文件名（可选）
	 * @returns {string} - 最终的图标URL
	 */
	function getAttachmentIcon(attachmentUrl, originalIconSrc = null, fileName = null) {
		let iconSrc = originalIconSrc || "/static/image/common/attach.gif";

		// 决策理由：优先从文件名提取扩展名，因为URL可能被编码
		let extension = null;

		// 首先尝试从文件名提取扩展名
		if (fileName) {
			const fileMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
			if (fileMatch) {
				extension = fileMatch[1].toLowerCase();
			}
		}

		// 如果文件名没有扩展名，再尝试从URL提取
		if (!extension && attachmentUrl) {
			const urlMatch = attachmentUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
			if (urlMatch) {
				extension = urlMatch[1].toLowerCase();
			}
		}

		// 根据扩展名确定图标路径
		if (extension) {
			// 决策理由：特殊处理某些扩展名，匹配美化脚本的图标映射
			let iconName = extension;
			if (extension === 'txt') {
				iconName = 'text'; // 美化脚本中txt文件使用text.gif
			}
			iconSrc = `static/image/filetype/${iconName}.gif`;
		}



		// 应用美化脚本的图标替换映射
		if (typeof window.replaceIcons === 'function') {
			const tempContainer = document.createElement('div');
			const tempImg = document.createElement('img');
			tempImg.src = iconSrc;
			tempContainer.appendChild(tempImg);
			window.replaceIcons(tempContainer);
			const finalIconSrc = tempImg.src;



			return finalIconSrc;
		} else {
			// 如果美化脚本的replaceIcons函数不可用，尝试直接查找全局的replaceIcons
			if (typeof replaceIcons === 'function') {
				const tempContainer = document.createElement('div');
				const tempImg = document.createElement('img');
				tempImg.src = iconSrc;
				tempContainer.appendChild(tempImg);
				replaceIcons(tempContainer);
				const finalIconSrc = tempImg.src;



				return finalIconSrc;
			}
		}

		return iconSrc;
	}

	/**
	 * 为预览弹窗创建附件下载模态框
	 * @param {HTMLElement} previewContentElement - 预览内容容器
	 */
	function createDownButtonForPreview(previewContentElement) {
		if (document.getElementById("customModal")) {
			return;
		}

		// 决策理由：扩展附件检测范围，支持更多附件格式
		const spans = previewContentElement.querySelectorAll('span[id*="attach_"]');
		const lockedDivs = Array.from(
			previewContentElement.querySelectorAll("div.locked")
		).filter((div) => div.textContent.includes("购买"));

		// 同时查找 .tattl 和 .pattl 元素，确保兼容性
		const tattlDls = Array.from(previewContentElement.querySelectorAll("dl.tattl")).filter(
			(dl) => dl.querySelector("p.attnm")
		);
		const pattlDls = Array.from(previewContentElement.querySelectorAll("dl.pattl")).filter(
			(dl) => dl.querySelector("p.attnm")
		);

		// 合并所有dl类型的附件元素
		const dls = [...tattlDls, ...pattlDls];

		// 决策理由：特别处理ignore_js_op内的附件，解决图标不显示问题
		const ignoreJsOpElements = previewContentElement.querySelectorAll('ignore_js_op');
		const ignoreJsOpAttachments = [];

		ignoreJsOpElements.forEach((ignoreEl) => {
			// 查找ignore_js_op内的附件span元素
			const attachSpans = ignoreEl.querySelectorAll('span[id*="attach_"]');
			attachSpans.forEach((span) => {
				// 检查是否有直接的附件链接
				let attachLink = span.querySelector('a[href*="attachment"]');
				let fileName = '';
				let isVirtual = false;

				if (attachLink) {
					// 有直接链接的情况
					fileName = attachLink.textContent.trim();
				} else {
					// 决策理由：处理没有直接链接的附件（如你提供的TXT附件结构）
					// 从span的id提取附件ID
					const attachIdMatch = span.id.match(/attach_(\d+)/);
					if (attachIdMatch) {
						const attachId = attachIdMatch[1];

						// 查找对应的菜单元素
						const menuEl = document.querySelector(`#attach_${attachId}_menu`) ||
							ignoreEl.querySelector(`[id*="${attachId}"]`);

						// 从周围的文本内容中提取文件名
						const parentText = span.parentElement ? span.parentElement.textContent : '';
						const siblingText = Array.from(span.parentElement?.children || [])
							.map(el => el.textContent).join(' ');

						// 尝试从各种文本中提取文件名
						const textToSearch = [parentText, siblingText, span.textContent].join(' ');
						const fileNameMatch = textToSearch.match(/([^\/\\]+\.(txt|doc|docx|pdf|zip|rar|7z|tar|gz|exe|apk))/i);

						if (fileNameMatch) {
							fileName = fileNameMatch[1];
							// 检查是否为支持的附件类型
							if (isSupportedAttachment(fileName)) {
								// 创建虚拟链接
								attachLink = {
									href: `forum.php?mod=attachment&aid=${attachId}`,
									textContent: fileName,
									trim: () => fileName
								};
								isVirtual = true;
							}
						}
					}
				}

				if (attachLink && fileName) {
					// 决策理由：排除图片文件，只处理真正的附件
					if (!isImageFile(fileName) && isSupportedAttachment(fileName)) {
						ignoreJsOpAttachments.push({
							span: span,
							link: attachLink,
							ignoreContainer: ignoreEl,
							fileName: fileName,
							isVirtual: isVirtual
						});


					}
				}
			});

		});



		const attachmentElements = [];

		// 决策理由：优先处理ignore_js_op内的附件，确保图标正确显示
		if (ignoreJsOpAttachments.length > 0) {
			ignoreJsOpAttachments.forEach((attachment) => {
				const { span, link, fileName } = attachment;

				// 创建标准的dl.tattl结构
				const dl = document.createElement("dl");
				dl.className = "tattl";

				// 创建dt元素（图标容器）
				const dt = document.createElement("dt");
				const img = document.createElement("img");

				// 决策理由：为ignore_js_op内的附件添加图标，优先使用美化脚本的图标映射
				// 使用从attachment对象中提取的文件名
				const finalFileName = fileName || (typeof link.textContent === 'string' ? link.textContent.trim() : link.textContent);
				img.src = getAttachmentIcon(link.href, null, finalFileName);
				img.setAttribute("border", "0");
				img.className = "vm";
				img.alt = "";
				dt.appendChild(img);

				// 创建dd元素（附件信息容器）
				const dd = document.createElement("dd");
				const pName = document.createElement("p");
				pName.className = "attnm";

				// 克隆附件链接并处理
				let clonedLink;
				if (attachment.isVirtual) {
					// 对于虚拟链接，创建新的a元素
					clonedLink = document.createElement('a');
					clonedLink.href = link.href;
					clonedLink.textContent = finalFileName;
					clonedLink.target = '_blank';
				} else {
					clonedLink = link.cloneNode(true);
					if (clonedLink.href && clonedLink.href.includes('mod=attachment') && !clonedLink.href.includes('action=attachpay')) {
						clonedLink.removeAttribute('onclick');
					}
				}
				pName.appendChild(clonedLink);
				dd.appendChild(pName);

				// 尝试从span或其他元素中提取附件大小信息
				const sizeInfo = span.textContent.match(/\d+\.?\d*\s*(KB|MB|GB)/i);
				if (sizeInfo) {
					const pInfo = document.createElement("p");
					pInfo.textContent = sizeInfo[0];
					dd.appendChild(pInfo);
				}

				dl.appendChild(dt);
				dl.appendChild(dd);
				attachmentElements.push(dl);


			});
		}

		// 处理标准的dl.tattl和dl.pattl附件
		if (dls.length > 0) {
			dls.forEach((dl) => {
				const clonedDl = dl.cloneNode(true);
				const links = clonedDl.querySelectorAll('a');
				links.forEach(link => {
					if (link.href && link.href.includes('mod=attachment') && !link.href.includes('action=attachpay')) {
						// For purchased download links, remove onclick to prevent issues.
						link.removeAttribute('onclick');
					}
				});
				attachmentElements.push(clonedDl);
			});
		}

		// 决策理由：添加对其他可能的附件格式的支持，但排除已处理的ignore_js_op附件
		// 查找可能遗漏的附件元素
		const additionalAttachments = previewContentElement.querySelectorAll('p.attnm, .attnm');
		additionalAttachments.forEach((element) => {
			// 检查是否已经被包含在dl.tattl或dl.pattl中
			const parentDl = element.closest('dl.tattl, dl.pattl');
			// 检查是否在ignore_js_op中（已经处理过）
			const parentIgnoreJsOp = element.closest('ignore_js_op');

			if (!parentDl && !parentIgnoreJsOp) {
				// 如果不在dl容器中且不在ignore_js_op中，创建一个新的dl容器
				const dl = document.createElement("dl");
				dl.className = "tattl";

				const dt = document.createElement("dt");
				const img = document.createElement("img");
				// 尝试从元素中获取附件链接来确定图标
				const attachLink = element.querySelector('a[href*="attachment"]');
				const fileName = attachLink ? attachLink.textContent.trim() : null;
				img.src = getAttachmentIcon(attachLink ? attachLink.href : null, null, fileName);
				img.setAttribute("border", "0");
				img.className = "vm";
				img.alt = "";
				dt.appendChild(img);

				const dd = document.createElement("dd");
				dd.appendChild(element.cloneNode(true));

				dl.appendChild(dt);
				dl.appendChild(dd);
				attachmentElements.push(dl);


			}
		});
		spans.forEach((span) => {
			// 检查是否在ignore_js_op中（已经处理过）
			const parentIgnoreJsOp = span.closest('ignore_js_op');
			if (parentIgnoreJsOp) {
				// 跳过已在ignore_js_op中处理的附件
				return;
			}

			let originalIconSrc = "";
			const prevElement = span.previousElementSibling;
			if (prevElement && prevElement.tagName.toLowerCase() === "img") {
				originalIconSrc = prevElement.src || prevElement.getAttribute("src") || "";
			}
			const linkElement = span.querySelector("a");
			if (linkElement) {
				// 检查文件扩展名是否为支持的附件类型
				const fileName = linkElement.textContent.trim();
				if (!isSupportedAttachment(fileName)) {
					return; // 跳过不支持的文件类型
				}

				const dl = document.createElement("dl");
				dl.className = "tattl";
				const dt = document.createElement("dt");
				const img = document.createElement("img");
				// 使用新的图标获取函数，优先使用美化脚本的图标映射
				img.src = getAttachmentIcon(linkElement.href, originalIconSrc);
				img.setAttribute("border", "0");
				img.className = "vm";
				img.alt = "";
				dt.appendChild(img);
				const dd = document.createElement("dd");
				const pName = document.createElement("p");
				pName.className = "attnm";
				const clonedLink = linkElement.cloneNode(true);
				if (clonedLink.href && clonedLink.href.includes('mod=attachment') && !clonedLink.href.includes('action=attachpay')) {
					clonedLink.removeAttribute('onclick');
				}
				pName.appendChild(clonedLink);
				dd.appendChild(pName);
				const spanText = span.textContent.trim();
				if (spanText) {
					const pInfo = document.createElement("p");
					pInfo.textContent = spanText
						.replace(linkElement.textContent, "")
						.trim();
					dd.appendChild(pInfo);
				}
				dl.appendChild(dt);
				dl.appendChild(dd);
				attachmentElements.push(dl);
			}
		});
		lockedDivs.forEach((div) => {
			const dl = document.createElement("dl");
			dl.className = "tattl";
			const dt = document.createElement("dt");
			const img = document.createElement("img");
			img.src = "/static/image/common/locked.gif";
			img.setAttribute("border", "0");
			img.className = "vm";
			img.alt = "";
			dt.appendChild(img);
			const dd = document.createElement("dd");
			dd.innerHTML = div.innerHTML;
			dl.appendChild(dt);
			dl.appendChild(dd);
			attachmentElements.push(dl);
		});
		// 决策理由：如果仍然没有找到附件，尝试更广泛的搜索
		if (attachmentElements.length === 0) {
			// 最后尝试：查找所有可能的附件相关元素
			const allPossibleAttachments = previewContentElement.querySelectorAll(
				'a[href*="attachment"], a[href*="attach"], ' +
				'span[id*="attach"], div[id*="attach"], ' +
				'*[class*="attach"], *[class*="tattl"], *[class*="pattl"]'
			);

			if (allPossibleAttachments.length > 0) {
				// 为每个可能的附件创建标准格式
				allPossibleAttachments.forEach((element, index) => {
					// 检查是否已经被包含在dl容器中
					const parentDl = element.closest('dl.tattl, dl.pattl');
					if (parentDl) {

						return;
					}

					const dl = document.createElement("dl");
					dl.className = "tattl";

					const dt = document.createElement("dt");
					const img = document.createElement("img");
					img.src = "/static/image/common/attach.gif";
					img.setAttribute("border", "0");
					img.className = "vm";
					img.alt = "";
					dt.appendChild(img);

					const dd = document.createElement("dd");
					const pName = document.createElement("p");
					pName.className = "attnm";

					// 如果是链接，直接使用；否则查找内部链接
					if (element.tagName.toLowerCase() === 'a' && element.href.includes('attachment')) {
						const clonedLink = element.cloneNode(true);
						if (clonedLink.href && clonedLink.href.includes('mod=attachment') && !clonedLink.href.includes('action=attachpay')) {
							clonedLink.removeAttribute('onclick');
						}
						pName.appendChild(clonedLink);

					} else {
						const linkInside = element.querySelector('a[href*="attachment"]');
						if (linkInside) {
							const clonedLink = linkInside.cloneNode(true);
							if (clonedLink.href && clonedLink.href.includes('mod=attachment') && !clonedLink.href.includes('action=attachpay')) {
								clonedLink.removeAttribute('onclick');
							}
							pName.appendChild(clonedLink);

						} else {
							// 如果没有附件链接，跳过这个元素

							return;
						}
					}

					dd.appendChild(pName);

					// 尝试获取附件大小信息
					const sizeInfo = element.textContent.match(/\d+\.?\d*\s*(KB|MB|GB)/i);
					if (sizeInfo) {
						const pInfo = document.createElement("p");
						pInfo.textContent = sizeInfo[0];
						dd.appendChild(pInfo);
					}

					dl.appendChild(dt);
					dl.appendChild(dd);
					attachmentElements.push(dl);
				});


			}
		}

		if (attachmentElements.length === 0) {
			showTooltip("没有找到任何附件");
			return;
		}
		// 解码逻辑已前移到 extractMainPostContent
		const modal = document.createElement("div");
		modal.id = "customModal";
		const contentDiv = document.createElement("div");
		attachmentElements.forEach((element, index) => {
			contentDiv.appendChild(element);
			if (index < attachmentElements.length - 1) {
				contentDiv.appendChild(document.createElement("br"));
			}
		});
		const closeBtn = document.createElement("button");
		closeBtn.id = "closeModal";
		closeBtn.textContent = "关闭";
		modal.appendChild(contentDiv);
		modal.appendChild(closeBtn);
		document.body.appendChild(modal);
		enableDrag(modal);
		// 添加自动下载观察器
		document.getElementById("closeModal").addEventListener("click", () => {
			modal.remove();
		});
	}

	/**
	 * 显示标题预览弹窗
	 * @param {HTMLElement} titleElement - 标题链接元素
	 */
	async function showTitlePreview(titleElement, fid) {
		// 记录当前标题元素
		currentTitleElement = titleElement;

		const threadUrl = titleElement.href;
		const threadTitle = titleElement.textContent.trim();

		// 检查URL是否为帖子详情页
		if (!isThreadDetailUrl(threadUrl)) {


			// 显示错误提示
			showPreviewError(threadTitle, '此链接不支持预览功能');
			return;
		}

		// 创建预览弹窗
		currentTitlePreview = document.createElement('div');
		currentTitlePreview.className = 'title-preview-popup';

		// 应用记忆的窗口大小
		if (lastPopupSize) {
			currentTitlePreview.style.width = lastPopupSize.width;
			currentTitlePreview.style.height = lastPopupSize.height;
		}

		// 提取帖子ID用于快速评分
		const tid = extractTid(threadUrl);

		// 检查用户是否登录
		const userId = getUserId();

		// 创建弹窗结构
		currentTitlePreview.innerHTML = `
		          <button class="title-preview-close-btn"></button>
			<div class="title-preview-header">
				<div class="title-preview-title">${threadTitle}</div>
				<div class="title-preview-actions-container">
					<button class="title-preview-action-btn" data-action="grade" data-tid="${tid}">快速评分</button>
					<button class="title-preview-action-btn" data-action="reply" data-tid="${tid}">快速回复</button>
					<button class="title-preview-action-btn" data-action="star" data-tid="${tid}">快速收藏</button>
					<button class="title-preview-action-btn" data-action="copy-code">复制代码</button>
					<button class="title-preview-action-btn" data-action="download">下载附件</button>
				</div>
			</div>
			<div class="title-preview-content">
				<div class="title-preview-post-content">
					<div class="title-preview-loading">正在加载内容...</div>
				</div>
			</div>
					       <div class="resize-handle top"></div>
					       <div class="resize-handle bottom"></div>
					       <div class="resize-handle left"></div>
					       <div class="resize-handle right"></div>
					       <div class="resize-handle top-left"></div>
					       <div class="resize-handle top-right"></div>
					       <div class="resize-handle bottom-left"></div>
					       <div class="resize-handle bottom-right"></div>
		`;

		currentTitlePreview.dataset.threadUrl = threadUrl; // 存储threadUrl用于后续操作
		if (fid) {
			currentTitlePreview.dataset.fid = fid;
		}
		document.body.appendChild(currentTitlePreview);

		// 定位弹窗（内部会处理时机）
		positionTitlePreview(currentTitlePreview);

		// 显示弹窗动画
		requestAnimationFrame(() => {
			if (currentTitlePreview) {
				currentTitlePreview.classList.add('show');
			}
		});

		// 添加事件监听
		setupTitlePreviewEvents(currentTitlePreview);

		// 应用响应式样式
		applyResponsiveTitleStyles(currentTitlePreview);

		// 获取并显示内容
		try {
			const content = await fetchThreadContent(threadUrl);

			if (currentTitlePreview && content) {
				// Extract fid before inserting into DOM
				const tempDoc = new DOMParser().parseFromString(content, 'text/html');
				const fidLink = tempDoc.querySelector('a[href*="mod=forumdisplay&fid="]');
				if (fidLink) {
					const match = fidLink.href.match(/fid=(\d+)/);
					if (match) {
						const fid = match[1];
						currentTitlePreview.dataset.fid = fid;
					}
				}

				const contentContainer = currentTitlePreview.querySelector('.title-preview-post-content');
				if (contentContainer) {
					// 决策理由：在设置内容前再次确保@符号被正确编码，防止邮箱自动识别
					const processedContent = content.replace(/@/g, '&#64;');
					contentContainer.innerHTML = processedContent;

					// 决策理由：立即处理可能已经存在的[email protected]文本，支持多种编码形式
					if (contentContainer.innerHTML.includes('[email') && contentContainer.innerHTML.includes('protected]')) {
						console.log('[DEBUG] 发现[email protected]文本，立即处理');
						contentContainer.innerHTML = contentContainer.innerHTML
							.replace(/\[email&#160;protected\]/g, '@')
							.replace(/\[email&nbsp;protected\]/g, '@')
							.replace(/\[email\s*protected\]/g, '@')
							.replace(/\[email&#32;protected\]/g, '@');
					}

					// 决策理由：设置内容后立即再次处理@符号，防止其他脚本的干扰
					setTimeout(() => {
						fixEmailLinksInContainer(contentContainer);

						// 决策理由：Cloudflare可能需要更多时间处理，多次尝试修复
						setTimeout(() => {
							fixEmailLinksInContainer(contentContainer);
						}, 100);

						setTimeout(() => {
							fixEmailLinksInContainer(contentContainer);
						}, 500);

						// 决策理由：增加更长延迟的处理，确保所有Cloudflare脚本都已执行完毕
						setTimeout(() => {
							fixEmailLinksInContainer(contentContainer);
						}, 1000);

						setTimeout(() => {
							fixEmailLinksInContainer(contentContainer);
						}, 2000);

						// 决策理由：添加MutationObserver监听DOM变化，实时处理Cloudflare邮箱保护
						const observer = new MutationObserver((mutations) => {
							let shouldProcess = false;
							mutations.forEach((mutation) => {
								if (mutation.type === 'childList' || mutation.type === 'characterData') {
									// 检查是否有新的文本节点包含[email protected]
									const target = mutation.target;
									if (target.textContent && target.textContent.includes('[email protected]')) {
										shouldProcess = true;
									}
									// 检查新增的节点
									mutation.addedNodes.forEach((node) => {
										if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('[email protected]')) {
											shouldProcess = true;
										} else if (node.nodeType === Node.ELEMENT_NODE) {
											const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
											let textNode;
											while (textNode = walker.nextNode()) {
												if (textNode.textContent.includes('[email protected]')) {
													shouldProcess = true;
													break;
												}
											}
										}
									});
								}
							});

							if (shouldProcess) {
								console.log('[DEBUG] MutationObserver检测到[email protected]变化，重新处理');
								fixEmailLinksInContainer(contentContainer);
							}
						});

						// 开始观察
						observer.observe(contentContainer, {
							childList: true,
							subtree: true,
							characterData: true
						});

						// 5秒后停止观察（避免长期占用资源）
						setTimeout(() => {
							observer.disconnect();
						}, 5000);
					}, 0);

					// 禁用预览窗口内所有图片的点击行为
					disableImagesInPreviewWindow(contentContainer);

					// 应用统一的间距样式
					applyPreviewSpacingStyles(contentContainer);

					// 根据内容更新按钮颜色
					updateButtonColorsBasedOnContent(currentTitlePreview);

					// 平滑重新定位弹窗
					smoothRepositionPopup(currentTitlePreview);
				}
			}
		} catch (error) {
			if (currentTitlePreview) {
				const contentContainer = currentTitlePreview.querySelector('.title-preview-content');
				if (contentContainer) {
					contentContainer.innerHTML = '<div class="title-preview-error">加载失败，请稍后重试</div>';
				}
			}
		}
	}

	/**
	 * 在现有预览弹窗中更新内容，实现无缝切换
	 * @param {HTMLElement} titleElement - 新的标题链接元素
	 * @param {string} fid - 新的板块ID
	 */
	async function updateTitlePreview(titleElement, fid) {
		if (!currentTitlePreview) {
			// 如果没有当前窗口，则直接调用创建函数
			showTitlePreview(titleElement, fid);
			return;
		}


		// 更新当前标题元素
		currentTitleElement = titleElement;
		const threadUrl = titleElement.href;
		const threadTitle = titleElement.textContent.trim();
		const tid = extractTid(threadUrl);

		// 1. 更新标题
		const titleDiv = currentTitlePreview.querySelector('.title-preview-title');
		if (titleDiv) {
			titleDiv.textContent = threadTitle;
		}

		// 2. 更新按钮的 data-tid
		const actionButtons = currentTitlePreview.querySelectorAll('.title-preview-action-btn');
		actionButtons.forEach(btn => {
			if (btn.dataset.tid) {
				btn.dataset.tid = tid;
			}
		});

		// 更新窗口的 dataset
		currentTitlePreview.dataset.threadUrl = threadUrl;
		if (fid) {
			currentTitlePreview.dataset.fid = fid;
		}

		// 3. 显示加载状态
		const contentContainer = currentTitlePreview.querySelector('.title-preview-post-content');
		if (contentContainer) {
			contentContainer.innerHTML = '<div class="title-preview-loading">正在加载内容...</div>';
		}

		// 4. 获取并显示新内容
		try {
			const content = await fetchThreadContent(threadUrl);

			if (currentTitlePreview && content) {
				// 在插入DOM之前提取新的fid
				const tempDoc = new DOMParser().parseFromString(content, 'text/html');
				const fidLink = tempDoc.querySelector('a[href*="mod=forumdisplay&fid="]');
				if (fidLink) {
					const match = fidLink.href.match(/fid=(\d+)/);
					if (match) {
						const newFid = match[1];
						currentTitlePreview.dataset.fid = newFid;
					}
				}

				if (contentContainer) {
					// 决策理由：在设置内容前再次确保@符号被正确编码，防止邮箱自动识别
					const processedContent = content.replace(/@/g, '&#64;');
					contentContainer.innerHTML = processedContent;

					// 决策理由：立即处理可能已经存在的[email protected]文本，支持多种编码形式
					if (contentContainer.innerHTML.includes('[email') && contentContainer.innerHTML.includes('protected]')) {
						console.log('[DEBUG] 发现[email protected]文本，立即处理');
						contentContainer.innerHTML = contentContainer.innerHTML
							.replace(/\[email&#160;protected\]/g, '@')
							.replace(/\[email&nbsp;protected\]/g, '@')
							.replace(/\[email\s*protected\]/g, '@')
							.replace(/\[email&#32;protected\]/g, '@');
					}

					// 决策理由：设置内容后立即再次处理@符号，防止其他脚本的干扰
					setTimeout(() => {
						fixEmailLinksInContainer(contentContainer);

						// 决策理由：Cloudflare可能需要更多时间处理，多次尝试修复
						setTimeout(() => {
							fixEmailLinksInContainer(contentContainer);
						}, 100);

						setTimeout(() => {
							fixEmailLinksInContainer(contentContainer);
						}, 500);

						// 决策理由：增加更长延迟的处理，确保所有Cloudflare脚本都已执行完毕
						setTimeout(() => {
							fixEmailLinksInContainer(contentContainer);
						}, 1000);

						setTimeout(() => {
							fixEmailLinksInContainer(contentContainer);
						}, 2000);

						// 决策理由：添加MutationObserver监听DOM变化，实时处理Cloudflare邮箱保护
						const observer = new MutationObserver((mutations) => {
							let shouldProcess = false;
							mutations.forEach((mutation) => {
								if (mutation.type === 'childList' || mutation.type === 'characterData') {
									// 检查是否有新的文本节点包含[email protected]
									const target = mutation.target;
									if (target.textContent && target.textContent.includes('[email protected]')) {
										shouldProcess = true;
									}
									// 检查新增的节点
									mutation.addedNodes.forEach((node) => {
										if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('[email protected]')) {
											shouldProcess = true;
										} else if (node.nodeType === Node.ELEMENT_NODE) {
											const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
											let textNode;
											while (textNode = walker.nextNode()) {
												if (textNode.textContent.includes('[email protected]')) {
													shouldProcess = true;
													break;
												}
											}
										}
									});
								}
							});

							if (shouldProcess) {
								console.log('[DEBUG] MutationObserver检测到[email protected]变化，重新处理');
								fixEmailLinksInContainer(contentContainer);
							}
						});

						// 开始观察
						observer.observe(contentContainer, {
							childList: true,
							subtree: true,
							characterData: true
						});

						// 5秒后停止观察（避免长期占用资源）
						setTimeout(() => {
							observer.disconnect();
						}, 5000);
					}, 0);

					// 对新内容应用必要的处理
					disableImagesInPreviewWindow(contentContainer);
					applyPreviewSpacingStyles(contentContainer);

					// 根据内容更新按钮颜色
					updateButtonColorsBasedOnContent(currentTitlePreview);

					// 重新应用响应式样式
					applyResponsiveTitleStyles(currentTitlePreview);
				}
			}
		} catch (error) {
			if (contentContainer) {
				contentContainer.innerHTML = '<div class="title-preview-error">加载失败，请稍后重试</div>';
			}
		}
	}

	/**
	 * 隐藏标题预览弹窗
	 */
	function hideTitlePreview() {

		if (currentTitlePreview) {
			// 保存最后的位置
			lastPopupPosition = {
				left: currentTitlePreview.offsetLeft,
				top: currentTitlePreview.offsetTop
			};

			currentTitlePreview.classList.remove('show');

			// 延迟移除DOM元素，等待动画完成
			setTimeout(() => {
				if (currentTitlePreview && currentTitlePreview.parentNode) {
					currentTitlePreview.parentNode.removeChild(currentTitlePreview);
				}
				currentTitlePreview = null;
			}, 300); // 等待动画完成
		}

		// 清理状态
		clearTitlePreviewTimeout();
		currentTitleElement = null;
	}

	/**
	 * 平滑重新定位弹窗
	 * @param {HTMLElement} popup - 弹窗元素
	 */
	function smoothRepositionPopup(popup) {
		if (!popup || popup.dataset.hasBeenDragged) {
			// 如果弹窗不存在，或者用户已经拖动过，则不进行重定位
			return;
		}

		// 临时禁用过渡动画以避免重定位时的闪烁
		const originalTransition = popup.style.transition;
		popup.style.transition = 'none';

		// 等待内容渲染完成后重新定位
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (popup) {

					// 计算新位置 - 保持左边滑出的定位逻辑
					const popupHeight = popup.offsetHeight;
					const estimatedHeight = popupHeight > 0 ? popupHeight : Math.min(window.innerHeight * 0.8, 400);

					const finalLeft = 20; // 固定在左边距20px
					const finalTop = Math.max(20, (window.innerHeight - estimatedHeight) / 2);

					// 设置新位置
					popup.style.left = finalLeft + 'px';
					popup.style.top = finalTop + 'px';

					// 恢复过渡动画
					requestAnimationFrame(() => {
						if (popup) {
							popup.style.transition = originalTransition;
						}
					});

				}
			});
		});
	}

	/**
	 * 定位标题预览弹窗（从视窗左边滑出）
	 * @param {HTMLElement} popup - 弹窗元素
	 */
	function positionTitlePreview(popup) {
		const popupWidth = 600;

		// 临时移除transform以获取准确的尺寸
		const originalTransform = popup.style.transform;
		popup.style.transform = 'none';
		popup.style.visibility = 'hidden';
		popup.style.display = 'flex';

		// 等待一帧确保布局完成
		requestAnimationFrame(() => {
			const popupHeight = popup.offsetHeight;
			popup.style.visibility = '';

			let finalLeft, finalTop;

			if (lastPopupPosition) {
				// 如果有记忆位置，使用记忆位置并进行边界检查
				const estimatedHeight = popupHeight > 0 ? popupHeight : Math.min(window.innerHeight * 0.8, 400);
				finalLeft = Math.max(20, Math.min(lastPopupPosition.left, window.innerWidth - popupWidth - 20));
				finalTop = Math.max(20, Math.min(lastPopupPosition.top, window.innerHeight - estimatedHeight - 20));
				popup.dataset.hasBeenDragged = "true"; // 标记为已拖动，以防止被重定位
			} else {
				// 默认从左边滑出：左边距20px，垂直居中
				const estimatedHeight = popupHeight > 0 ? popupHeight : Math.min(window.innerHeight * 0.8, 400);
				finalLeft = 20; // 固定在左边距20px
				finalTop = Math.max(20, (window.innerHeight - estimatedHeight) / 2);
			}

			popup.style.left = finalLeft + 'px';
			popup.style.top = finalTop + 'px';
			popup.style.transform = originalTransform;
		});
	}

	/**
	 * 禁用预览窗口内所有图片的点击行为
	 * @param {HTMLElement} container - 内容容器元素
	 */
	function disableImagesInPreviewWindow(container) {
		if (!container) return;

		// 查找容器内的所有图片
		const images = container.querySelectorAll('img');

		images.forEach(img => {
			// 移除可能存在的点击事件监听器（通过克隆节点的方式）
			const newImg = img.cloneNode(true);
			img.parentNode.replaceChild(newImg, img);

			// 禁用点击事件
			newImg.style.pointerEvents = 'none';
			newImg.style.cursor = 'default';

			// 移除可能的链接包装
			const parentLink = newImg.closest('a');
			if (parentLink) {
				// 如果图片被链接包装，移除链接的点击行为
				parentLink.style.pointerEvents = 'none';
				parentLink.style.cursor = 'default';

				// 阻止链接的默认行为
				parentLink.addEventListener('click', function (e) {
					e.preventDefault();
					e.stopPropagation();
					return false;
				});
			}

			// 为图片添加点击事件阻止
			newImg.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			});

		});
	}

	/**
	 * 应用预览窗口的统一间距样式
	 * @param {HTMLElement} container - 内容容器元素
	 */
	function applyPreviewSpacingStyles(container) {
		if (!container) return;

		// 为容器添加统一的间距控制样式
		const style = document.createElement('style');
		style.textContent = `
			.title-preview-content {
				line-height: 1.2 !important;
			}
			.title-preview-content div[align="center"] {
				margin: 1px 0 !important;
				padding: 0 !important;
			}
.title-preview-content ignore_js_op {
    margin: 10px 0 !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: row;
    align-items: center;
    gap: 10px;
}
			.title-preview-content img {
				margin: 1px 0 !important;
				padding: 0 !important;
				display: block !important;
			}
			.title-preview-content p {
				margin: 2px 0 !important;
				padding: 0 !important;
			}
			.title-preview-content font {
				margin: 0 !important;
				padding: 0 !important;
			}
      .title-preview-content .pattl {
	margin: 10px 0;
}
		`;

		// 检查是否已经添加过样式
		if (!document.querySelector('#preview-spacing-styles')) {
			style.id = 'preview-spacing-styles';
			document.head.appendChild(style);
		}

	}

	/**
	 * 应用响应式标题样式
	 * @param {HTMLElement} popup - 弹窗元素
	 */
	function applyResponsiveTitleStyles(popup) {
		if (!popup) return;

		const titleElement = popup.querySelector('.title-preview-title');
		const headerElement = popup.querySelector('.title-preview-header');
		const actionsContainer = popup.querySelector('.title-preview-actions-container');
		const actionButtons = popup.querySelectorAll('.title-preview-action-btn');

		if (!titleElement) return;

		// 获取当前窗口宽度和弹窗宽度
		const windowWidth = window.innerWidth;
		const popupWidth = popup.offsetWidth;

		// 决策理由：根据窗口宽度和弹窗宽度动态调整字体大小和间距
		if (windowWidth <= 480 || popupWidth <= 400) {
			// 小屏幕或窄弹窗
			titleElement.style.fontSize = '12px';
			titleElement.style.margin = '0 10px 0 0';
			if (headerElement) headerElement.style.padding = '10px 12px';
			if (actionsContainer) {
				actionsContainer.style.gap = '6px';
				actionsContainer.style.padding = '8px 0 0 3px';
			}
			actionButtons.forEach(btn => {
				btn.style.padding = '2px 5px';
				btn.style.fontSize = '11px';
			});
		} else if (windowWidth <= 768 || popupWidth <= 500) {
			// 中等屏幕
			titleElement.style.fontSize = '13px';
			titleElement.style.margin = '0 15px 0 0';
			if (headerElement) headerElement.style.padding = '12px 15px';
			if (actionsContainer) {
				actionsContainer.style.gap = '8px';
				actionsContainer.style.padding = '9px 0 0 4px';
			}
			actionButtons.forEach(btn => {
				btn.style.padding = '2.5px 6px';
				btn.style.fontSize = '11.5px';
			});
		} else {
			// 大屏幕 - 恢复默认样式
			titleElement.style.fontSize = '14px';
			titleElement.style.margin = '0 20px 0 0';
			if (headerElement) headerElement.style.padding = '12px 15px';
			if (actionsContainer) {
				actionsContainer.style.gap = '10px';
				actionsContainer.style.padding = '10px 0 0 5px';
			}
			actionButtons.forEach(btn => {
				btn.style.padding = '3px 7px';
				btn.style.fontSize = '12px';
			});
		}
	}

	/**
	 * 根据帖子内容更新按钮颜色（异步优化版本）
	 * @param {HTMLElement} popup - 预览弹窗元素
	 */
	function updateButtonColorsBasedOnContent(popup) {
		if (!popup) return;

		// 决策理由：使用异步执行避免阻塞主线程，提升加载性能
		setTimeout(() => {
			const contentContainer = popup.querySelector('.title-preview-post-content');
			if (!contentContainer) return;

			// 一次性获取所有需要的按钮，减少DOM查询
			const copyCodeBtn = popup.querySelector('[data-action="copy-code"]');
			const downloadBtn = popup.querySelector('[data-action="download"]');

			if (!copyCodeBtn && !downloadBtn) return; // 早期退出

			// 检测代码块 - 简化检测逻辑
			if (copyCodeBtn) {
				const hasCode = contentContainer.querySelector('.blockcode') !== null;
				copyCodeBtn.classList.toggle('has-content', hasCode);
			}

			// 检测附件 - 进一步优化，使用更精确的选择器
			if (downloadBtn) {
				const hasAttachments =
					contentContainer.querySelector('span[id*="attach_"]') !== null ||
					contentContainer.querySelector('dl.tattl p.attnm, dl.pattl p.attnm') !== null;

				downloadBtn.classList.toggle('has-content', hasAttachments);
			}
		}, 0);
	}

	/**
	 * 设置标题预览弹窗的事件监听
	 * @param {HTMLElement} popup - 弹窗元素
	 */
	function setupTitlePreviewEvents(popup) {
		const closeBtn = popup.querySelector('.title-preview-close-btn');
		if (closeBtn) {
			closeBtn.addEventListener('click', function (e) {
				e.stopPropagation();
				hideTitlePreview();
			});
		}

		// 决策理由：监听窗口大小变化，动态调整响应式样式
		const resizeHandler = () => {
			if (popup && document.body.contains(popup)) {
				applyResponsiveTitleStyles(popup);
			}
		};

		window.addEventListener('resize', resizeHandler);

		// 当弹窗被移除时，清理事件监听器
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.removedNodes.forEach((node) => {
					if (node === popup) {
						window.removeEventListener('resize', resizeHandler);
						observer.disconnect();
					}
				});
			});
		});

		observer.observe(document.body, { childList: true });

		const actionsContainer = popup.querySelector('.title-preview-actions-container');
		if (actionsContainer) {
			actionsContainer.addEventListener('click', async function (e) {
				if (e.target.tagName !== 'BUTTON') return;
				e.stopPropagation();

				const button = e.target;
				const action = button.dataset.action;
				const tid = button.dataset.tid;

				switch (action) {
					case 'grade':
						if (!tid) {
							showTooltip('无法获取帖子ID');
							return;
						}
						button.disabled = true;
						button.textContent = '评分中...';
						try {
							await gradeFromPreview(tid);
							button.textContent = '评分成功';
							setTimeout(() => {
								button.disabled = false;
								button.textContent = '快速评分';
							}, 500);
						} catch (error) {
							button.textContent = '评分失败';
							setTimeout(() => {
								button.disabled = false;
								button.textContent = '快速评分';
							}, 500);
						}
						break;
					case 'reply':
						let fid = popup.dataset.fid;
						const threadUrl = popup.dataset.threadUrl;
						const pid = titlePidCache.get(threadUrl); // 从缓存获取主帖PID

						if (!fid) {
							const fidLink = popup.querySelector('a[href*="mod=forumdisplay&fid="]');
							if (fidLink) {
								const match = fidLink.href.match(/fid=(\d+)/);
								if (match) {
									fid = match[1];
								}
							}
						}

						if (tid && fid) {
							// 确保即使pid未获取到，也能打开基本的回复窗口
							const replyUrl = `forum.php?mod=post&action=reply&fid=${fid}&tid=${tid}`;
							showWindow('reply', replyUrl);
						} else {
							showTooltip("无法回复：缺少帖子或板块ID");
						}
						break;
					case 'star':
						if (!tid) {
							showTooltip('无法获取帖子ID');
							return;
						}
						button.disabled = true;
						button.textContent = '收藏中...';
						try {
							await starFromPreview(tid);
							button.textContent = '操作完成'; // starFromPreview shows its own tooltips
							setTimeout(() => {
								button.disabled = false;
								button.textContent = '快速收藏';
							}, 2000);
						} catch (error) {
							button.textContent = '收藏失败';
							setTimeout(() => {
								button.disabled = false;
								button.textContent = '快速收藏';
							}, 2000);
						}
						break;
					case 'copy-code':
						// 修正选择器，确保只在当前预览弹窗的内容区搜索
						const allBlockCodes = popup.querySelectorAll(".title-preview-content .blockcode");
						if (!allBlockCodes.length) {
							showTooltip("预览中未找到代码块");
							return;
						}
						const allTexts = Array.from(allBlockCodes).map(bq => {
							const blockquote = bq.querySelector('blockquote');
							if (blockquote) {
								return blockquote.innerText.trim();
							}
							// Fallback for plain text in blockcode, and clean up unwanted text
							let text = bq.innerText.trim();
							const unwantedText1 = "/复制代码";
							const unwantedText2 = "复制代码";
							if (text.endsWith(unwantedText1)) {
								text = text.slice(0, -unwantedText1.length).trim();
							} else if (text.endsWith(unwantedText2)) {
								text = text.slice(0, -unwantedText2.length).trim();
							}
							return text;
						});
						const combinedText = allTexts.join("\n\n");
						copyToClipboard(
							combinedText,
							() => showTooltip("代码已复制!"),
							(err) => showTooltip("复制失败: " + err)
						);
						break;
					case 'download':
						const contentArea = popup.querySelector('.title-preview-post-content');
						if (contentArea) {
							createDownButtonForPreview(contentArea);
						} else {
							showTooltip("内容尚未加载，无法查找附件");
						}
						break;
				}
			});
		}
		// 标题栏拖动功能
		const header = popup.querySelector('.title-preview-header');
		if (header) {
			let isDragging = false;
			let startX, startY, startLeft, startTop;

			header.addEventListener('mousedown', function (e) {

				isDragging = true;
				startX = e.clientX;
				startY = e.clientY;
				startLeft = parseInt(popup.style.left) || 0;
				startTop = parseInt(popup.style.top) || 0;

				document.addEventListener('mousemove', onMouseMove);
				document.addEventListener('mouseup', onMouseUp);

				e.preventDefault();
			});

			function onMouseMove(e) {
				if (!isDragging) return;

				const deltaX = e.clientX - startX;
				const deltaY = e.clientY - startY;

				let newLeft = startLeft + deltaX;
				let newTop = startTop + deltaY;

				// 边界检查
				const maxLeft = window.innerWidth - popup.offsetWidth;
				const maxTop = window.innerHeight - popup.offsetHeight;

				newLeft = Math.max(0, Math.min(newLeft, maxLeft));
				newTop = Math.max(0, Math.min(newTop, maxTop));

				popup.style.left = newLeft + 'px';
				popup.style.top = newTop + 'px';
			}

			function onMouseUp() {
				isDragging = false;
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
			}
		}

		// 内容区域滚动支持和滚动穿透防护
		const contentArea = popup.querySelector('.title-preview-content');
		if (contentArea) {
			contentArea.style.overflowY = 'auto';
			contentArea.style.overflowX = 'hidden';

			// 防止滚动穿透到背景页面
			contentArea.addEventListener('wheel', function (e) {
				const { scrollTop, scrollHeight, clientHeight } = this;
				const isAtTop = scrollTop === 0;
				const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

				// 如果在顶部向上滚动，或在底部向下滚动，阻止默认行为
				if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
					e.preventDefault();
					e.stopPropagation();
				}
			}, { passive: false });
		}

		// 弹窗整体的滚动事件处理
		popup.addEventListener('wheel', function (e) {
			// 如果事件来自内容区域，让内容区域处理
			if (e.target.closest('.title-preview-content')) {
				return;
			}

			// 其他区域（如标题栏）的滚动事件直接阻止
			e.preventDefault();
			e.stopPropagation();
		}, { passive: false });
		// 全方位拖动调整大小功能
		const resizeHandles = popup.querySelectorAll('.resize-handle');
		if (resizeHandles.length > 0) {
			let isResizing = false;
			let currentHandle = null;
			let startX, startY, startWidth, startHeight, startLeft, startTop;

			const onResizeMouseDown = function (e) {
				currentHandle = e.target;
				isResizing = true;

				startX = e.clientX;
				startY = e.clientY;

				const rect = popup.getBoundingClientRect();
				startWidth = rect.width;
				startHeight = rect.height;
				startLeft = rect.left;
				startTop = rect.top;


				document.addEventListener('mousemove', onResizeMouseMove);
				document.addEventListener('mouseup', onResizeMouseUp);

				e.preventDefault();
				e.stopPropagation();
			};

			const onResizeMouseMove = function (e) {
				if (!isResizing || !currentHandle) return;

				const deltaX = e.clientX - startX;
				const deltaY = e.clientY - startY;

				let newWidth = startWidth;
				let newHeight = startHeight;
				let newLeft = startLeft;
				let newTop = startTop;

				const minWidth = 400;
				const minHeight = 300;

				if (currentHandle.classList.contains('right') || currentHandle.classList.contains('top-right') || currentHandle.classList.contains('bottom-right')) {
					newWidth = Math.max(minWidth, startWidth + deltaX);
				}
				if (currentHandle.classList.contains('bottom') || currentHandle.classList.contains('bottom-left') || currentHandle.classList.contains('bottom-right')) {
					newHeight = Math.max(minHeight, startHeight + deltaY);
				}
				if (currentHandle.classList.contains('left') || currentHandle.classList.contains('top-left') || currentHandle.classList.contains('bottom-left')) {
					const calculatedWidth = startWidth - deltaX;
					if (calculatedWidth >= minWidth) {
						newWidth = calculatedWidth;
						newLeft = startLeft + deltaX;
					}
				}
				if (currentHandle.classList.contains('top') || currentHandle.classList.contains('top-left') || currentHandle.classList.contains('top-right')) {
					const calculatedHeight = startHeight - deltaY;
					if (calculatedHeight >= minHeight) {
						newHeight = calculatedHeight;
						newTop = startTop + deltaY;
					}
				}

				popup.style.width = newWidth + 'px';
				popup.style.height = newHeight + 'px';
				popup.style.left = newLeft + 'px';
				popup.style.top = newTop + 'px';
			};

			const onResizeMouseUp = function () {
				isResizing = false;
				currentHandle = null;
				document.removeEventListener('mousemove', onResizeMouseMove);
				document.removeEventListener('mouseup', onResizeMouseUp);

				// 记忆调整后的窗口大小和位置
				if (popup.style.width && popup.style.height) {
					lastPopupSize = {
						width: popup.style.width,
						height: popup.style.height
					};
				}
				if (popup.style.left && popup.style.top) {
					lastPopupPosition = {
						left: parseInt(popup.style.left, 10),
						top: parseInt(popup.style.top, 10)
					};
				}
			};

			resizeHandles.forEach(handle => {
				handle.addEventListener('mousedown', onResizeMouseDown);
			});
		}
	}

	/**
	 * 获取帖子内容
	 * @param {string} threadUrl - 帖子URL
	 * @returns {Promise<string>} - 帖子内容
	 */
	async function fetchThreadContent(threadUrl) {
		// 检查缓存
		if (titleContentCache.has(threadUrl)) {
			return titleContentCache.get(threadUrl);
		}


		try {
			const response = await fetch(threadUrl, {
				method: 'GET',
				headers: {
					'User-Agent': navigator.userAgent,
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
				},
				credentials: 'include' // 包含cookies，确保登录状态
			});

			if (!response.ok) {
				throw new Error(`网络请求失败: ${response.status} ${response.statusText}`);
			}

			const html = await response.text();

			if (html.length < 100) {
				throw new Error('获取的内容过短，可能是错误页面');
			}

			const content = extractMainPostContent(html, threadUrl);

			// 缓存内容（限制缓存大小）
			if (titleContentCache.size > 50) {
				const firstKey = titleContentCache.keys().next().value;
				titleContentCache.delete(firstKey);
			}
			titleContentCache.set(threadUrl, content);

			return content;
		} catch (error) {

			// 返回更详细的错误信息
			return `<div style="color: #ff6b6b; padding: 20px; text-align: center;">
				<h4>内容获取失败</h4>
				<p><strong>错误原因：</strong>${error.message}</p>
				<p><strong>请求URL：</strong>${threadUrl}</p>
				<p>可能的原因：网络连接问题、需要登录、页面不存在等</p>
			</div>`;
		}
	}

	/**
	 * 从HTML中提取楼主发帖内容
	 * @param {string} html - 帖子页面HTML
	 * @param {string} threadUrl - 帖子URL，用于缓存PID
	 * @returns {string} - 提取的HTML内容
	 */
	function extractMainPostContent(html, threadUrl = null) {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

			// 检查是否为帖子详情页
			const isThreadPage = doc.querySelector('#pid1') ||
				doc.querySelector('.pcb') ||
				doc.querySelector('.t_f') ||
				html.includes('mod=viewthread') ||
				html.includes('thread-');

			if (!isThreadPage) {
				return '<p style="color: #ff6b6b;">此页面不是帖子详情页，无法预览内容</p>';
			}

			// 提取并缓存主帖PID
			if (threadUrl) {
				let mainPid = null;

				// 新的PID提取逻辑
				const postlistContainer = doc.querySelector('#postlist');
				if (postlistContainer) {
					const mainPostElement = postlistContainer.querySelector('div[id^="post_"]');
					if (mainPostElement) {
						const id = mainPostElement.id;
						const match = id.match(/post_(\d+)/);
						if (match) {
							mainPid = match[1];
						}
					}
				}


				// 如果新逻辑失败，可以保留旧逻辑作为后备
				if (!mainPid) {
					// 优先从主楼的回复链接中提取PID，这是最可靠的方式
					const replyLink = doc.querySelector('a[href*="action=reply"][href*="repquote="]');
					if (replyLink) {
						const match = replyLink.href.match(/repquote=(\d+)/);
						if (match) {
							mainPid = match[1];
						}
					}
				}

				if (!mainPid) {
					// 方法2: 查找第一个带PID的table元素
					const mainPost = doc.querySelector('table[id^="pid"]');
					if (mainPost && mainPost.id.startsWith('pid')) {
						mainPid = mainPost.id.replace('pid', '');
					}
				}

				// 缓存PID
				if (mainPid) {
					titlePidCache.set(threadUrl, mainPid);
				} else {
				}
			}

			// 修改选择器逻辑，获取包含附件的完整帖子内容区域
			// 决策理由：附件可能位于.t_f之外的.pattl容器中，需要获取更大范围的内容
			const selectors = [
				'#pid1 .pcb', // 优先选择主楼完整内容体，包含.t_fsz和.pattl等所有内容
				'div[id^="post_"]:first-of-type .pcb', // 新版布局的完整内容体
				'table[id^="pid"]:first-of-type .pcb', // 旧版布局的完整内容体
				'#pid1 .pct', // 备选：主楼内容容器
				'div[id^="post_"]:first-of-type .pct', // 备选：新版布局内容容器
				'table[id^="pid"]:first-of-type .pct', // 备选：旧版布局内容容器
				'#pid1', // 最后备选：整个主楼容器
			];

			let firstPost = null;
			let usedSelector = '';

			// 尝试每个选择器
			for (const selector of selectors) {
				firstPost = doc.querySelector(selector);
				if (firstPost) {
					usedSelector = selector;

					break;
				}
			}

			if (firstPost) {
				// 克隆内容以避免修改原始DOM
				const clonedPost = firstPost.cloneNode(true);

				// --- 激进策略：全局预解码Cloudflare邮件 ---
				// 查找所有受保护的邮箱元素 - 使用多种选择器
				const protectedEmails = clonedPost.querySelectorAll('a.__cf_email__, span.__cf_email__, [data-cfemail], .__cf_email__');

				// 处理每个保护邮箱
				protectedEmails.forEach((emailLink) => {
					const encodedString = emailLink.dataset.cfemail;
					if (encodedString) {
						const decodedEmail = decodeCloudflareEmail(encodedString);
						const textNode = document.createTextNode(decodedEmail);
						emailLink.parentNode.replaceChild(textNode, emailLink);
					}
				});

				// --- 解码结束 ---


				// 精确移除不需要的元素，保留所有附件相关内容
				// 决策理由：现在获取的是.pcb完整内容，需要移除不必要的元素但保留附件，同时移除评分内容
				const elementsToRemove = clonedPost.querySelectorAll('.pstatus, .sign, .po.hin, .rate, .ratl, dl[id*="ratelog"], .psth, .cm, h3.psth');

				elementsToRemove.forEach(el => el.remove());

				// 特别保护附件容器，确保不被误删
				const attachmentContainers = clonedPost.querySelectorAll('.pattl, .modact');
				attachmentContainers.forEach(container => {
					const hasAttachments = container.querySelector('dl.tattl, dl.pattl, span[id*="attach_"], .attnm, p.attnm');
					if (hasAttachments) {

					}
				});

				// 特别处理附件元素，确保它们被保留
				const attachmentElements = clonedPost.querySelectorAll('dl.tattl, dl.pattl, span[id*="attach_"], .attnm, p.attnm');


				// 确保附件链接的完整性
				attachmentElements.forEach((element, index) => {
					const links = element.querySelectorAll('a[href*="attachment"]');
					links.forEach(link => {
						// 处理相对路径的附件链接
						if (link.href && link.href.startsWith('/')) {
							const baseUrl = new URL(html.includes('sehuatang.net') ? 'https://www.sehuatang.net' : window.location.origin);
							link.href = baseUrl.origin + link.href;
						}

					});
				});

				// 处理图片 - 确保图片能正确显示
				const images = clonedPost.querySelectorAll('img');
				images.forEach(img => {
					// 处理相对路径的图片
					if (img.src && img.src.startsWith('/')) {
						const baseUrl = new URL(html.includes('sehuatang.net') ? 'https://www.sehuatang.net' : window.location.origin);
						img.src = baseUrl.origin + img.src;
					}

					// 处理file属性的图片（论坛特有）
					if (img.getAttribute('file')) {
						img.src = img.getAttribute('file');
					}

				});

				// 处理链接 - 确保链接能正确跳转，特别关注附件链接
				const links = clonedPost.querySelectorAll('a');
				links.forEach(link => {
					// 提前解码Cloudflare Email的逻辑已被新的全局解码策略取代

					if (link.href && link.href.startsWith('/')) {
						const baseUrl = new URL(html.includes('sehuatang.net') ? 'https://www.sehuatang.net' : window.location.origin);
						link.href = baseUrl.origin + link.href;
					}

					// 对于附件链接，特殊处理
					if (link.href && link.href.includes('mod=attachment')) {
						// 移除可能有问题的onclick属性
						link.removeAttribute('onclick');
						link.target = '_blank'; // 在新窗口打开附件

					} else {
						link.target = '_blank'; // 在新窗口打开普通链接
					}
				});

				// 获取HTML内容
				let content = clonedPost.innerHTML;

				// 获取HTML内容并进行基本处理

				// 决策理由：防止@符号被误识别为邮箱地址，特别是Cloudflare的邮箱保护功能
				// 临时替换@符号，避免邮箱自动识别
				content = content.replace(/@/g, '&#64;');

				// 将<br>标签替换为可控制高度的div
				content = content.replace(/<br\s*\/?>/gi, '<div style="height: 5px;"></div>');

				// 统一处理可能影响间距的HTML元素
				// 移除div align="center"的默认间距
				content = content.replace(/<div\s+align="center">/gi, '<div align="center" style="margin: 0; padding: 0;">');

				// 处理ignore_js_op标签的间距
				content = content.replace(/<ignore_js_op>/gi, '<ignore_js_op style="margin: 0; padding: 0; display: block;">');

				// 为所有图片容器添加统一的间距控制
				content = content.replace(/(<img[^>]*>)/gi, '<div style="margin: 0; padding: 0;">$1</div>');

				// 清理多余的空白和换行
				content = content.replace(/\s+/g, ' ').trim();

				// 不再限制内容长度，显示完整内容

				// 简单验证：检查最终内容中是否包含附件
				const hasAttachments = content.includes('class="tattl"') ||
					content.includes('class="pattl"') ||
					content.includes('attach_') ||
					content.includes('mod=attachment');



				return content || '<p style="color: #999;">暂无内容预览</p>';
			}

			// 如果没有找到内容，尝试获取页面的主要文本内容作为备用

			// 尝试获取页面标题作为基本信息
			const pageTitle = doc.querySelector('title');
			const h1Title = doc.querySelector('h1');
			const anyContent = doc.querySelector('body');

			if (pageTitle || h1Title || anyContent) {
				let fallbackContent = '';

				if (pageTitle) {
					fallbackContent += `<h3>页面标题：${pageTitle.textContent}</h3>`;
				}

				if (h1Title) {
					fallbackContent += `<p><strong>主标题：</strong>${h1Title.textContent}</p>`;
				}

				// 尝试获取一些基本的文本内容
				if (anyContent) {
					const textContent = anyContent.textContent || anyContent.innerText || '';
					if (textContent.length > 100) {
						const preview = textContent.substring(0, 500).trim();
						fallbackContent += `<p><strong>页面内容预览：</strong></p><p>${preview}...</p>`;
					}
				}

				if (fallbackContent) {
					return fallbackContent;
				}
			}

			return '<p style="color: #999;">无法获取内容预览</p>';
		} catch (error) {
			return '<p style="color: #ff6b6b;">内容解析失败: ' + error.message + '</p>';
		}
	}

	// #endregion

	// #region 用户头像屏蔽按钮功能

	/**
	 * 为指定的用户头像图片元素添加“屏蔽用户”按钮及其功能。
	 * 当鼠标悬停在头像上时，按钮出现；点击按钮可将该用户添加到黑名单。
	 * @param {HTMLImageElement} avatarImgElement - 用户头像的img元素。
	 */
	function addBlockUserButtonToAvatar(avatarImgElement) {
		if (!avatarImgElement || avatarImgElement.dataset.blockButtonAdded) {
			return;
		}
		avatarImgElement.dataset.blockButtonAdded = "true";

		const username = avatarImgElement.alt;
		if (!username) {
			// 如果头像没有alt文本（用户名），则不添加按钮
			return;
		}

		const parentElement = avatarImgElement.parentElement; // 通常是 .thread-avatar 或 .avatar
		if (!parentElement) return;

		// 确保父元素是相对定位，以便按钮可以相对于它定位
		if (getComputedStyle(parentElement).position === 'static') {
			parentElement.style.position = 'relative';
		}

		const blockButton = document.createElement('button');
		blockButton.textContent = '屏蔽用户';
		blockButton.className = 'bgsh-block-user-btn'; // 使用新的class以便样式控制
		blockButton.style.cssText = `
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 6px;
    font-size: 11px;
    background-color: orangered;
    color: white;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    z-index: 9999;
    display: none;
    white-space: nowrap;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 0px 10px;
		`;


		blockButton.addEventListener('click', (event) => {
			event.stopPropagation(); // 防止事件冒泡

			let blockedUsers = GM_getValue("blockedUsers", []);
			if (!Array.isArray(blockedUsers)) {
				// 安全处理，如果存储的不是数组（理论上不应该发生）
				if (typeof blockedUsers === 'string') {
					try {
						const parsed = JSON.parse(blockedUsers);
						blockedUsers = Array.isArray(parsed) ? parsed : [];
					} catch (e) {
						blockedUsers = [];
					}
				} else {
					blockedUsers = [];
				}
			}

			if (!blockedUsers.includes(username)) {
				blockedUsers.unshift(username); // 使用unshift将新用户添加到数组开头
				GM_setValue("blockedUsers", blockedUsers); // 直接存储数组

				// 触发内容屏蔽更新
				const currentSettings = getSettings();
				if (typeof blockContentByUsers === "function") {
					blockContentByUsers(currentSettings);
				}
				if (typeof blockContentInRedesignedLayout === "function") {
					blockContentInRedesignedLayout(currentSettings);
				}

				// 检查是否为帖子内页，如果是则立即执行帖子内页的屏蔽逻辑
				const isPostPage = /forum\.php\?mod=viewthread|\/thread-\d+-\d+-\d+\.html/.test(window.location.href);
				if (isPostPage && typeof blockContentInPostPage === "function") {
					blockContentInPostPage(currentSettings, true); // 传入true强制重新检查所有元素
				}
			}
			blockButton.style.display = 'none'; // 点击后隐藏按钮
		});

		parentElement.appendChild(blockButton);

		let hoverTimeout;
		const showButton = () => {
			clearTimeout(hoverTimeout);
			blockButton.style.display = 'block';
		};
		const hideButton = () => {
			hoverTimeout = setTimeout(() => {
				// 检查鼠标是否仍在按钮或父元素上
				if (!parentElement.matches(':hover') && !blockButton.matches(':hover')) {
					blockButton.style.display = 'none';
				}
			}, 200); // 缩短延迟，使其更灵敏
		};

		parentElement.addEventListener('mouseenter', showButton);
		parentElement.addEventListener('mouseleave', hideButton);

		// 按钮本身的悬停也应保持显示
		blockButton.addEventListener('mouseenter', showButton);
		blockButton.addEventListener('mouseleave', hideButton);
	}
	// #endregion

	// #region 消息提示

	/**
	 * 在页面中显示一个淡出的提示消息。
	 * 使用该函数可以在页面中临时显示一个提示消息，该消息在一段时间后会自动淡出并消失。
	 *
	 * @param {string} message - 需要显示的提示消息内容。
	 */
	function showTooltip(message) {
		const tooltip = document.createElement("span");

		// 设定提示消息的初始样式
		const tooltipStyles = {
			position: "fixed",
			top: `calc(33.33% + ${activeTooltips * 80}px)`,
			left: "50%",
			transform: "translate(-50%, -50%)",
			backgroundColor: "rgba(0, 0, 0, 0.7)",
			backdropFilter: "blur(10px) saturate(180%)",
			boxShadow: "0 1px 50px rgba(0, 0, 0, 0.3)",
			color: "#fff",
			padding: "20px 40px",
			borderRadius: "12px",
			zIndex: "1000",
			transition: "opacity 0.5s",
			fontSize: "20px",
		};
		Object.assign(tooltip.style, tooltipStyles); // 使用Object.assign将样式批量应用到元素上
		tooltip.innerText = message;
		document.body.appendChild(tooltip);

		activeTooltips++;

		// 淡出效果函数
		const fadeOut = (element, duration = 500) => {
			let opacity = 1;
			const timer = setInterval(function () {
				opacity -= 50 / duration;
				if (opacity <= 0) {
					clearInterval(timer);
					element.style.display = "none"; // or "hidden", depending on the desired final state
				} else {
					element.style.opacity = opacity;
				}
			}, 50);
		};

		setTimeout(() => {
			fadeOut(tooltip);
			setTimeout(() => {
				document.body.removeChild(tooltip);
				activeTooltips--;
			}, 500);
		}, 2000);
	}
	// #endregion

	// #region Tampermonkey 菜单命令注册
	/**
	 * 注册一个命令到Tampermonkey的上下文菜单，允许用户访问"逛色花"的设置界面。
	 */
	GM_registerMenuCommand("逛色花设置", () => {
		createSettingsUI(getSettings());
	});
	// #endregion

	// #region 设置界面HTML构造

	/**
	 * 生成"逛色花"设置界面的HTML内容
	 * @param {Object} settings - 当前的设置数据
	 * @returns {string} - 设置界面的HTML字符串
	 */
	function generateSettingsHTML(settings) {
		return `
    <div class='bgsh-setting-box'>
        <div class='bgsh-setting-box-container '>
            <div class="bgsh-setting-first">
                <label for="logoText">评分文字</label>
                <br>
                <input type="text" id="logoTextInput" value="${settings.logoText
			}">
                <br>
                 <label for="listFontSize">列表字体大小:</label>
                <input type="text" id="listFontSizeInput" value="${settings.listFontSize}">
                <br>
                <label for="listFontWeight">列表字体粗细:</label>
                <input type="text" id="listFontWeightInput" value="${settings.listFontWeight}" placeholder="常见字重：400,500,600…等">
                <br>
                <fieldset>
                    <label>隐藏勋章</label>
                    <br>
                    <label>
                        <input type="radio" name="blockMedals" value="0" ${settings.blockMedals === 0 ? "checked" : ""
			}>
                        不隐藏
                    </label>
                    <label>
                        <input type="radio" name="blockMedals" value="1" ${settings.blockMedals === 1 ? "checked" : ""
			}>
                        隐藏所有
                    </label>
                    <label>
                        <input type="radio" name="blockMedals" value="2" ${settings.blockMedals === 2 ? "checked" : ""
			}>
                        隐藏女优勋章
                    </label>
                </fieldset>
                <label class='bgsh-setting-checkbox-label' for="displayBlockedTipsCheckbox">
                    <input type='checkbox' id="displayBlockedTipsCheckbox" ${settings.displayBlockedTips ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示黑名单屏蔽提示</span>
					<br>
                </label>
                <label class='bgsh-setting-checkbox-label' for="showAvatarCheckbox">
                    <input type='checkbox' id="showAvatarCheckbox" ${settings.showAvatar ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>替换为默认头像</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="autoHideButtonsCheckbox">
                    <input type='checkbox' id="autoHideButtonsCheckbox" ${settings.autoHideButtons ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>自动隐藏右侧按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="autoPaginationCheckbox">
                    <input type='checkbox' id="autoPaginationCheckbox" ${settings.autoPagination ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>启用自动翻页</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="defaultSwipeToSearchCheckbox">
                <input type='checkbox' id="defaultSwipeToSearchCheckbox" ${settings.defaultSwipeToSearch ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>启用划词搜索</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="displayThreadImagesCheckbox" >
                <input type='checkbox' id="displayThreadImagesCheckbox" ${settings.displayThreadImages ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“图片预览”按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="clickImagePreviewCheckbox">
                <input type='checkbox' id="clickImagePreviewCheckbox" ${settings.clickImagePreview ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>单击打开图片预览</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showDownCheckbox">
                <input type='checkbox' id="showDownCheckbox" ${settings.showDown ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“下载附件”按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showCopyCodeCheckbox">
                <input type='checkbox' id="showCopyCodeCheckbox" ${settings.showCopyCode ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“复制代码”按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showFastPostCheckbox">
                <input type='checkbox' id="showFastPostCheckbox" ${settings.showFastPost ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“快速发帖”按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showFastReplyCheckbox">
                <input type='checkbox' id="showFastReplyCheckbox" ${settings.showFastReply ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“快速回复”按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showQuickGradeCheckbox">
                <input type='checkbox' id="showQuickGradeCheckbox" ${settings.showQuickGrade ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“快速评分”按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showQuickStarCheckbox">
                <input type='checkbox' id="showQuickStarCheckbox" ${settings.showQuickStar ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“快速收藏”按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showClickDoubleCheckbox">
                <input type='checkbox' id="showClickDoubleCheckbox" ${settings.showClickDouble ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“一键二连”按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showViewRatingsCheckbox" style="display: none;">
                <input type='checkbox' id="showViewRatingsCheckbox" ${settings.showViewRatings ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“查看评分”按钮</span>
                </label>
                <label class='bgsh-setting-checkbox-label' for="showToggleImageButtonCheckbox">
                <input type='checkbox' id="showToggleImageButtonCheckbox" ${settings.showToggleImageButton ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“隐藏/显示图片”按钮</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showFastCopyCheckbox" style="display: none;">
                <input type='checkbox' id="showFastCopyCheckbox" ${settings.showFastCopy ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>显示“复制帖子'按钮</span>
                </label>
                <label class='bgsh-setting-checkbox-label' for="blockingIndexCheckbox">
                <input type='checkbox' id="blockingIndexCheckbox" ${settings.blockingIndex ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>屏蔽首页热门</span>
                </label>
                <br>
                <label class='bgsh-setting-checkbox-label' for="showSignTipCheckbox">
                <input type='checkbox' id="showSignTipCheckbox" ${settings.showSignTip ? "checked" : ""
			}>
                    <span class='bgsh-setting-checkbox-custom'></span>
                    <span>自动静默签到</span>
                </label>
                <br>
            </div>
            <div class="bgsh-setting-second">
                <label for="maxGradeThread">主贴评分最大值:</label>
                <input id="maxGradeThread" value="${settings.maxGradeThread}">
                <br>
                <label for="previewImageCount">预览图片数量（1-20张）:</label>
                <input type="text" id="previewImageCountInput" value="${settings.previewImageCount}" placeholder="1-20">
                <br>
                <label for="imagesPerRow">每行图片数:</label>
                <input type="text" id="imagesPerRowInput" value="${settings.imagesPerRow || 4}" placeholder="输入数字">
                <br>
                <label for="excludeOptionsTextarea">高级搜索排除关键字（每行一个）:</label>
                <br>
                <textarea id="excludeOptionsTextarea">${settings.excludeOptions.join(
				"\n"
			)}</textarea>
                <br>
                <label for="blockedUsersList">黑名单屏蔽的用户名（每行一个）：</label>
                <br>
                <textarea id="blockedUsersList">${settings.blockedUsers.join(
				"\n"
			)}</textarea>
                <br>
                <label for="excludePostOptionsTextarea">帖子列表页黑名单关键字（每行一个）:</label>
                <br>
                <textarea id="excludePostOptionsTextarea">${settings.excludePostOptions.join(
				"\n"
			)}</textarea>
                <br>
            </div>
        </div>
        <div class="bgsh-setting-button">
            <button id="saveButton">保存</button>
            <button id="closeButton">关闭</button>
        </div>
    </div>
    `;
	}

	// #endregion

	// #region 头像悬停弹窗屏蔽按钮功能

	/**
	 * 为头像悬停弹窗添加屏蔽用户按钮
	 * 监听弹窗出现，在用户操作按钮区域添加屏蔽按钮
	 */
	function addBlockButtonToAvatarPopup() {
		// 监听DOM变化，检测新出现的头像悬停弹窗
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === 1) { // 元素节点
						// 检查是否是头像悬停弹窗
						if (node.classList && node.classList.contains('p_pop') && node.classList.contains('bui')) {
							setTimeout(() => {
								addBlockButtonToPopup(node);
							}, 100); // 延迟确保弹窗内容完全加载
						}

						// 也检查子元素中是否有弹窗
						const popups = node.querySelectorAll && node.querySelectorAll('.p_pop.bui');
						if (popups) {
							popups.forEach(popup => {
								setTimeout(() => {
									addBlockButtonToPopup(popup);
								}, 100);
							});
						}
					}
				});
			});
		});

		// 开始观察整个文档的变化
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		// 处理页面加载时已存在的弹窗
		document.querySelectorAll('.p_pop.bui').forEach(popup => {
			addBlockButtonToPopup(popup);
		});
	}

	/**
	 * 在指定的头像悬停弹窗中添加屏蔽按钮
	 * @param {HTMLElement} popup - 头像悬停弹窗元素
	 */
	function addBlockButtonToPopup(popup) {
		// 检查是否已经添加过屏蔽按钮
		if (popup.querySelector('.block-user-popup-btn') || popup.dataset.blockButtonAdded) {
			return;
		}

		// 标记已处理
		popup.dataset.blockButtonAdded = 'true';

		// 查找用户操作按钮容器
		const buttonContainer = popup.querySelector('.user-action-buttons');
		if (!buttonContainer) {
			return;
		}

		// 提取用户名
		const username = extractUsernameFromPopup(popup);
		if (!username) {
			return;
		}

		// 检查用户是否已在黑名单中
		const blockedUsers = GM_getValue("blockedUsers", []);
		const isBlocked = blockedUsers.includes(username);

		// 创建屏蔽按钮
		const blockBtn = document.createElement('a');
		blockBtn.className = `user-action-btn block-user-popup-btn xi2${isBlocked ? ' blocked' : ''}`;
		blockBtn.textContent = isBlocked ? '已屏蔽' : '屏蔽用户';
		blockBtn.title = isBlocked ? `用户 "${username}" 已在黑名单中` : `屏蔽用户 "${username}"`;
		blockBtn.href = '#';

		// 添加点击事件
		blockBtn.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();

			if (isBlocked) {
				return;
			}

			// 执行屏蔽操作
			let currentBlockedUsers = GM_getValue("blockedUsers", []);
			if (!Array.isArray(currentBlockedUsers)) {
				currentBlockedUsers = [];
			}

			if (!currentBlockedUsers.includes(username)) {
				currentBlockedUsers.unshift(username); // 使用unshift将新用户添加到数组开头
				GM_setValue("blockedUsers", currentBlockedUsers);

				// 更新按钮状态
				blockBtn.textContent = '已屏蔽';
				blockBtn.title = `用户 "${username}" 已在黑名单中`;
				blockBtn.classList.add('blocked');

				// 触发内容屏蔽更新
				const currentSettings = getSettings();
				if (typeof blockContentByUsers === "function") {
					blockContentByUsers(currentSettings);
				}
				if (typeof blockContentInRedesignedLayout === "function") {
					blockContentInRedesignedLayout(currentSettings);
				}

				// 检查是否为帖子内页，如果是则立即执行帖子内页的屏蔽逻辑
				const isPostPage = /forum\.php\?mod=viewthread|\/thread-\d+-\d+-\d+\.html/.test(window.location.href);
				if (isPostPage && typeof blockContentInPostPage === "function") {
					blockContentInPostPage(currentSettings, true); // 传入true强制重新检查所有元素
				}
			}
		});

		// 将屏蔽按钮添加到按钮容器
		buttonContainer.appendChild(blockBtn);
	}

	/**
	 * 从头像悬停弹窗中提取用户名
	 * @param {HTMLElement} popup - 头像悬停弹窗元素
	 * @returns {string|null} 用户名或null
	 */
	function extractUsernameFromPopup(popup) {
		// 方法1：从用户基本信息区域提取（优先从span子元素获取纯用户名）
		const usernameSpan = popup.querySelector('.user-basic-info .username span');
		if (usernameSpan) {
			let username = usernameSpan.textContent.trim();
			// 移除各种可能的在线状态信息
			username = username.replace(/当前在线$/, '')
				.replace(/在线$/, '')
				.replace(/离线$/, '')
				.replace(/\s+$/, '');
			if (username) {
				return username;
			}
		}

		// 方法1.1：如果span方法失败，尝试从整个username容器提取
		const usernameElement = popup.querySelector('.user-basic-info .username');
		if (usernameElement) {
			// 尝试只获取第一个文本节点（通常是用户名）
			const textNodes = Array.from(usernameElement.childNodes).filter(node => node.nodeType === 3);
			if (textNodes.length > 0) {
				let username = textNodes[0].textContent.trim();
				if (username) {
					return username;
				}
			}

			// 备用方法：获取全部文本并清理
			let username = usernameElement.textContent.trim();
			username = username.replace(/当前在线$/, '')
				.replace(/在线$/, '')
				.replace(/离线$/, '')
				.replace(/\s+$/, '');
			if (username) {
				return username;
			}
		}

		// 方法2：从发消息按钮的链接中提取
		const sendMessageBtn = popup.querySelector('a[href*="mod=spacecp"][href*="ac=pm"]');
		if (sendMessageBtn && sendMessageBtn.href) {
			const urlParams = new URLSearchParams(sendMessageBtn.href.split('?')[1]);
			const touid = urlParams.get('touid');
			if (touid) {
				// 如果有用户ID，尝试从页面中找到对应的用户名
				const userLinks = document.querySelectorAll(`a[href*="uid-${touid}"], a[href*="uid=${touid}"]`);
				for (const link of userLinks) {
					const username = link.textContent.trim();
					if (username && username !== touid) {
						return username;
					}
				}
			}
		}

		// 方法3：从弹窗ID中提取用户ID，然后查找用户名
		if (popup.id && popup.id.startsWith('userinfo')) {
			const userId = popup.id.replace('userinfo', '');
			const userLinks = document.querySelectorAll(`a[href*="uid-${userId}"], a[href*="uid=${userId}"]`);
			for (const link of userLinks) {
				const username = link.textContent.trim();
				if (username && username !== userId) {
					return username;
				}
			}
		}

		return null;
	}

	/**
	 * 添加头像悬停弹窗屏蔽按钮的样式
	 */
	function addPopupBlockButtonStyles() {
		const styleId = 'popup-block-button-styles';
		if (document.getElementById(styleId)) {
			return; // 样式已存在
		}

		const style = document.createElement('style');
		style.id = styleId;
		document.head.appendChild(style);
	}

	// #endregion

	// #region 设置界面生成与事件绑定

	/**
	 * 创建并显示设置界面
	 * @param {Object} settings - 当前的设置数据
	 */
	function createSettingsUI(settings) {
		// 若之前的设置界面存在，先进行移除
		const existingContainer = document.getElementById("settingsUIContainer");
		if (existingContainer) {
			existingContainer.remove();
		}

		// 添加设置界面的样式
		generateSettingsStyles();

		// 根据当前设置生成界面内容
		const containerHTML = generateSettingsHTML(settings);

		// 创建界面容器，并添加到页面
		const container = document.createElement("div");
		container.id = "settingsUIContainer";
		container.innerHTML = containerHTML;
		document.body.appendChild(container);

		// 添加拖动功能
		enableDrag(container);

		// 为"保存"和"关闭"按钮绑定事件
		const saveButton = document.getElementById("saveButton");
		const closeButton = document.getElementById("closeButton");

		// 保存按钮点击后，保存设置并隐藏界面
		saveButton.addEventListener("click", function () {
			saveSettings(settings);
			container.style.display = "none"; // 只隐藏容器，不从DOM移除
		});

		// 关闭按钮点击后，直接隐藏界面
		closeButton.addEventListener(
			"click",
			() => (container.style.display = "none") // 只隐藏容器，不从DOM移除
		);
	}

	// #endregion

	// #region 设置界面样式

	/**
	 * 生成并应用设置界面的样式
	 */
	function generateSettingsStyles() {
		const style = `
/* 通用样式，应用于所有元素 */
#settingsUIContainer * {
  font-size: 13px;
  font-weight: 500;
  color: var(--font-color-1);
  box-sizing: border-box;
  margin: 1px 0;
  padding: 0px;
  border-radius: 14px;
}

#settingsUIContainer {
	position: fixed;
	top: 50% ;
	left: 55% ;
	border-radius: 16px;
	width: 580px;
	z-index: 9999;
	transform: translate(-50%, -50%) ;
	cursor: move ;
	box-shadow: var(--panel-shadow);
	isolation: isolate;
}

/* 使用伪元素为设置面板创建backdrop-filter背景层 */
#settingsUIContainer::before {
	content: '' !important;
	position: absolute !important;
	top: 0 !important;
	left: 0 !important;
	right: 0 !important;
	bottom: 0 !important;
	backdrop-filter: var(--backdrop-filter-5) !important;
	background-color: var(--panel-background-1) !important;
	border-radius: 16px !important;
	z-index: -1 !important;
	pointer-events: none !important;
  border: 1px solid var(--panel-border-1) !important;
}


/* 确保交互元素鼠标样式正常 */
#settingsUIContainer input,
#settingsUIContainer textarea,
#settingsUIContainer button,
#settingsUIContainer label,
#settingsUIContainer .bgsh-setting-checkbox-label,
#settingsUIContainer .bgsh-checkbox-custom {
  cursor: auto;
}

#settingsUIContainer button {
  cursor: pointer;
}

/* 文本选择时的背景色 */
#settingsUIContainer *::selection {
  background-color: #c7c9ca;
}

/* 盒子 */
#settingsUIContainer .bgsh-setting-box {
	margin: auto;
	box-sizing: border-box;
	padding: 10px 20px 20px;
	background-color: transparent;
	height: auto;
	display: flex;
	flex-direction: column;
}

/* 复选框标签样式 */
#settingsUIContainer .bgsh-setting-checkbox-label {
  display: block;
  position: relative;
  cursor: pointer;
  margin: 7px 0;
}

/* 复选框标签中的文本样式 */
#settingsUIContainer span {
  display: inline-block;
  position: absolute;
  line-height: 2.3;
  left: 7%;
}

/* 输入框样式 */
#settingsUIContainer input {
	padding-left: 10px;
	border: none;
	color: #858686;
	margin-top: 2px;
	background-color: var(--input-background-2);
	box-shadow: none;
    border-radius: 8px;
}

#settingsUIContainer textarea {
	width: 100%;
	height: 50px;
	padding-left: 10px;
	padding-top: 2px;
	border: none;
	color: var(--font-color-2);
	background-color: var(--input-background-2);
	margin: 5px 0;
	font-size: 12px;
}

/* 复选框输入框样式 */
#settingsUIContainer input[type="checkbox"] {
  position: absolute;
  opacity: 0;
}

/* 自定义复选框样式 */
#settingsUIContainer .bgsh-setting-checkbox-label .bgsh-setting-checkbox-custom {
  top: 8px;
  left: 0;
  height: 13px;
  width: 13px;
  border-radius: 50%;
  border: 1px solid #848484;
}

/* 复选框选中状态样式 */
#settingsUIContainer .bgsh-setting-checkbox-label input:checked ~ .bgsh-setting-checkbox-custom {
  background-color: #53C41B;
  border: none;
  transition: all 0.2s ease;
}

/* 按钮样式 */
#settingsUIContainer button {
  width: 50px;
  margin-top: 12px !important;
  height: 30px;
  border: none;
  outline: none;
  background-color: #52C52C;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

#closeButton {
  background: #fc5b22 !important;
}

#settingsUIContainer fieldset {
  line-height: 2.0;
  margin: 4px 0 -10px 0;
  border: none;
}

.bgsh-setting-first,
.bgsh-setting-second {
  width: 50%;
}

.bgsh-setting-box-container {
  display: flex;
  gap: 20px;
}

.bgsh-setting-button {
  width: 100%;
  text-align: center;
  display: flex;
  gap: 20px;
  flex-direction: row;
  justify-content: center;
}

#blockedUsersList {
  height: 258px  !important;
}

#excludePostOptionsTextarea {
  height: 90px !important;
}
#imagesPerRowInput,#maxGradeThread, #logoTextInput, #listFontSizeInput, #listFontWeightInput, #previewImageCountInput {
	width: 100%;
	margin: 5px 0;
	height: 24px;
}
#settingsUIContainer > div > div.bgsh-setting-box-container > div.bgsh-setting-first > fieldset > label:nth-child(5) > input[type=radio] {
  background-color: transparent;
}

    `;

		const styleElement = document.createElement("style");
		styleElement.innerHTML = style;
		document.head.appendChild(styleElement);
	}

	// #endregion

	// #region 剪贴板操作

	/**
	 * 将指定文本复制到剪贴板。
	 * @param {string} text - 需要复制的文本。
	 * @param {function} onSuccess - 复制成功时的回调函数。
	 * @param {function} onError - 复制失败时的回调函数。
	 */
	async function copyToClipboard(text, onSuccess, onError) {
		try {
			await navigator.clipboard.writeText(text);
			if (onSuccess) {
				onSuccess();
			}
		} catch (err) {
			if (onError) {
				onError(err);
			}
		}
	}

	// #endregion

	// #region URL处理

	/**
	 * 从给定的URL中解析查询参数。
	 * @param {string} url - 需要解析的URL。
	 * @returns {object} 返回一个包含查询参数的对象。
	 */
	function getQueryParams(url) {
		const queryParams = {};

		// 检查 URL 是否包含传统的查询字符串
		if (url.includes("?")) {
			// 处理标准查询字符串
			const queryPattern = /[?&]([^=&]+)=([^&]*)/g;
			let match;
			while ((match = queryPattern.exec(url)) !== null) {
				queryParams[match[1]] = decodeURIComponent(match[2]);
			}
		} else {
			// 处理特殊的 URL 路径模式，如 forum-154-1.html
			const pathPattern = /forum-(\d+)-(\d+)\.html$/;
			const pathMatch = pathPattern.exec(url);
			if (pathMatch && pathMatch.length === 3) {
				// 假设第一个数字是 fid，第二个数字是 page
				queryParams.fid = pathMatch[1];
				queryParams.page = pathMatch[2];
			}
		}

		return queryParams;
	}

	/**
	 * 从给定的URL中解析tid。
	 * @param {string} url - 需要解析的URL。
	 * @returns {object} 返回一个包含查询参数的对象。
	 */
	function extractTid(url) {
		let tid = null;

		// 检查是否是类似 /thread-XXXX-1-1.html 的格式
		const threadMatch = url.match(/thread-(\d+)-\d+-\d+\.html/);
		if (threadMatch && threadMatch.length > 1) {
			tid = threadMatch[1];
		} else {
			// 检查是否是类似 /forum.php?mod=viewthread&tid=XXXX&extra=... 的格式
			const queryMatch = url.match(/tid=(\d+)/);
			if (queryMatch && queryMatch.length > 1) {
				tid = queryMatch[1];
			}
		}

		return tid;
	}

	// #endregion

	// #region DOM操作

	/**
	 * 获取指定名称的单选按钮的选中值。
	 * @param {string} name - 单选按钮的名称。
	 * @returns {number|null} 返回选中单选按钮的值，如果没有选中，则返回null。
	 */
	function getCheckedRadioValue(name) {
		const selectedRadio = document.querySelector(
			`input[name="${name}"]:checked`
		);
		return selectedRadio ? parseInt(selectedRadio.value) : 0;
	}

	/**
	 * 解析给定内容为DOM。
	 *
	 * @param {string} content - 要解析的内容。
	 * @param {string} type - 解析内容的类型，默认为"text/html"。
	 * @returns {Document} - 返回解析后的文档。
	 */
	function parseContent(content, type = "text/html") {
		return new DOMParser().parseFromString(content, type);
	}

	/**
	 * 从给定的DOM文档中提取值。
	 *
	 * @param {Document} doc - 要从中提取值的DOM文档。
	 * @param {string} selector - 用于定位元素的CSS选择器。
	 * @param {string} attr - 要提取的属性，默认为"value"。
	 * @returns {string|null} - 返回提取的值或null。
	 */
	function extractValueFromDOM(doc, selector, attr = "value") {
		const elem = doc.querySelector(selector);
		if (!elem) return null;
		return elem.getAttribute(attr);
	}

	/**
	 * 水印功能（已禁用）
	 */
	function showWatermarkMessage() {
		return; // 此功能已禁用
	}

	// #endregion

	// #region 列表字体样式控制

	/**
	 * 应用列表字体样式设置到.xst元素
	 * @param {string} fontSize - 字体大小值，如"14px"
	 * @param {string} fontWeight - 字体粗细值，如"400"
	 */
	function applyListFontStyle(fontSize, fontWeight) {
		// 移除之前的字体样式
		const existingStyle = document.getElementById('bgsh-list-font-style');
		if (existingStyle) {
			existingStyle.remove();
		}

		// 创建新的样式元素
		const style = document.createElement('style');
		style.id = 'bgsh-list-font-style';
		style.textContent = `
			.xst {
				font-size: ${fontSize} !important;
				font-weight: ${fontWeight} !important;
			}
		`;
		document.head.appendChild(style);
	}

	/**
	 * 应用列表字体大小设置到.xst元素（保持向后兼容）
	 * @param {string} fontSize - 字体大小值，如"14px"
	 */
	function applyListFontSize(fontSize) {
		// 获取当前的字体粗细设置
		const settings = getSettings();
		applyListFontStyle(fontSize, settings.listFontWeight);
	}

	// #endregion

	// #region 用户信息获取

	/**
	 * 从页面中获取当前登录用户的 userid。
	 * @returns {string|null} 返回用户ID，如果未找到则返回null。
	 */
	function getUserId() {
		const userLink = document.querySelector(".vwmy a");
		if (userLink) {
			const match = userLink.href.match(/uid=(\d+)/);
			if (match) {
				return match[1];
			}
		}
		return null;
	}

	// #endregion

	// #region 帖子信息获取

	/**
	 * 从给定的元素中获取其父级table的帖子楼层Pid。
	 * @param {HTMLElement} element - 要查询的HTML元素。
	 * @returns {string|null} 返回楼层的Pid，如果未找到则返回null。
	 */
	function getTableIdFromElement(element) {
		if (element) {
			let parentTable = element.closest("table");
			if (parentTable && parentTable.id.startsWith("pid")) {
				return parentTable.id.replace("pid", "");
			}
		}
		return null;
	}

	/**
	 * 检测帖子是否为置顶贴
	 * @param {HTMLElement} element - 帖子元素
	 * @returns {boolean} 如果是置顶贴返回true，否则返回false
	 */
	function isStickyThread(element) {
		// 检查新布局中的置顶贴
		// 1. 检查元素本身是否为置顶卡片
		if (element.classList && element.classList.contains('thread-card') && element.classList.contains('sticky')) {
			return true;
		}

		// 2. 检查祖先元素中是否包含sticky class
		const threadCard = element.closest(".thread-card.sticky");
		if (threadCard) {
			return true;
		}

		// 3. 检查原始布局中的置顶贴 - tbody id包含stickthread_
		const tbody = element.closest('tbody');
		if (tbody && tbody.id && tbody.id.includes('stickthread_')) {
			return true;
		}

		return false;
	}

	// #endregion

	// #region 会话验证

	/**
	 * 从页面中获取formhash值。
	 * @returns {string|null} 返回formhash值，如果未找到则返回null。
	 */
	function getFormHash() {
		const element = document.querySelector('input[name="formhash"]');
		if (element) {
			return element.value;
		} else {
			return null;
		}
	}

	// #endregion

	// #region 页码操作

	/**
	 * 从页面的一个位置复制页码到另一个位置。
	 */
	function addPageNumbers() {
		const sourceElement = document.querySelector(".pgs.cl.mbm");
		const targetElement = document.querySelector(".slst.mtw");

		if (!sourceElement) {
			return;
		}

		if (!targetElement) {
			return;
		}

		const parentElement = targetElement.parentElement;

		if (!parentElement) {
			return;
		}

		const clonedElement = sourceElement.cloneNode(true);
		parentElement.insertBefore(clonedElement, targetElement);
	}

	// #endregion

	// #region UI组件创建

	/**
	 * 创建一个按钮并添加到指定的容器中。
	 *
	 * @param {string} id 按钮的ID
	 * @param {string} text 按钮上显示的文本
	 * @param {Function} clickHandler 按钮被点击时触发的函数
	 * @returns {HTMLButtonElement} 创建的按钮元素
	 */
	const createButton = (
		id,
		text,
		clickFunction,
		className = "bgsh-customBtn",
		bgColor = "#0396FF"
	) => {
		const button = document.createElement("button");
		button.id = id;
		button.innerText = text;
		button.className = className;
		button.style.backgroundColor = bgColor; // 设置背景颜色
		button.addEventListener("click", clickFunction);
		return button;
	};

	/**
	 * 创建一个固定位置的按钮容器。
	 * @param {Object} settings - 用户设置对象
	 * @returns {HTMLElement} 返回创建的按钮容器元素。
	 */
	function createButtonContainer(settings = {}) {
		const container = document.createElement("div");
		container.className = "bgsh-button-container";

		// 根据设置决定是否添加自动隐藏类
		if (settings.autoHideButtons) {
			container.classList.add("auto-hide");

			// 创建触发区域
			const triggerArea = document.createElement("div");
			triggerArea.className = "bgsh-trigger-area";

			// 添加延时隐藏机制
			let hideTimeout;

			const showButtons = () => {
				clearTimeout(hideTimeout);
				container.classList.add('show');
			};

			const hideButtons = () => {
				clearTimeout(hideTimeout);
				hideTimeout = setTimeout(() => {
					container.classList.remove('show');
				}, 2000); // 延时2000ms
			};

			// 添加事件监听器
			triggerArea.addEventListener('mouseenter', showButtons);
			triggerArea.addEventListener('mouseleave', hideButtons);

			// 按钮容器本身的hover事件
			container.addEventListener('mouseenter', showButtons);
			container.addEventListener('mouseleave', hideButtons);

			document.body.appendChild(triggerArea);
		}

		Object.assign(container.style, {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			position: "fixed",
			top: "50%",
			right: "1vh",
			zIndex: "1000",
			// 根据是否自动隐藏设置不同的初始transform
			transform: settings.autoHideButtons
				? "translateY(-50%) translateX(120px)"
				: "translateY(-50%)",
		});

		return container;
	}

	/**
	 * 更新按钮容器的自动隐藏状态
	 * @param {boolean} autoHide - 是否自动隐藏
	 */
	function updateButtonContainerAutoHide(autoHide) {
		const container = document.querySelector('.bgsh-button-container');
		if (container) {
			if (autoHide) {
				container.classList.add('auto-hide');
				// 设置隐藏状态的transform
				container.style.transform = "translateY(-50%) translateX(120px)";

				// 创建触发区域（如果不存在）
				let triggerArea = document.querySelector('.bgsh-trigger-area');
				if (!triggerArea) {
					triggerArea = document.createElement("div");
					triggerArea.className = "bgsh-trigger-area";

					// 添加延时隐藏机制
					let hideTimeout;

					const showButtons = () => {
						clearTimeout(hideTimeout);
						container.classList.add('show');
					};

					const hideButtons = () => {
						clearTimeout(hideTimeout);
						hideTimeout = setTimeout(() => {
							container.classList.remove('show');
						}, 600); // 延长到600ms
					};

					// 添加事件监听器
					triggerArea.addEventListener('mouseenter', showButtons);
					triggerArea.addEventListener('mouseleave', hideButtons);

					// 为按钮容器添加事件监听器
					container.addEventListener('mouseenter', showButtons);
					container.addEventListener('mouseleave', hideButtons);

					document.body.appendChild(triggerArea);
				}

			} else {
				container.classList.remove('auto-hide', 'show');
				// 恢复正常状态的transform
				container.style.transform = "translateY(-50%)";

				// 移除触发区域
				const triggerArea = document.querySelector('.bgsh-trigger-area');
				if (triggerArea) {
					triggerArea.remove();
				}
			}
		}
	}

	// #endregion

	// #region 用户签到功能

	/**
	 * 为给定的用户执行签到操作。
	 *
	 * @param {string} userid 用户ID
	 * @returns {boolean} 签到成功返回 true，否则返回 false
	 */
	async function sign(userid) {
		const signURL = `${baseURL}/plugin.php?id=dd_sign&ac=sign&infloat=yes&handlekey=pc_click_ddsign&inajax=1&ajaxtarget=fwin_content_pc_click_ddsign`;
		const params = await getSignParameters(signURL);

		if (!params || !params.formhash || !params.signhash) {
			return false;
		}

		const { formhash, signtoken, signhash } = params;
		const secanswer = await getValidationResult();

		let responseText = await postSignData({
			baseURL,
			formhash,
			signtoken,
			secanswer,
			signhash,
		});
		return updateSignButton(responseText, userid);
	}

	/**
	 * 从指定的 URL 获取签到所需的参数。
	 *
	 * @param {string} url 目标URL
	 * @returns {Object|null} 包含签到参数的对象或null
	 */
	async function getSignParameters(url) {
		const { responseText, contentType } = await fetchWithContentType(url);
		return handleResponseContent(responseText, contentType);
	}

	async function getValidationResult() {
		const secqaaURL = `/misc.php?mod=secqaa&action=update&idhash=qSAxcb0`;
		const { responseText, contentType } = await fetchWithContentType(secqaaURL);
		return extractValidationText(responseText, contentType);
	}

	async function postSignData({
		baseURL,
		formhash,
		signtoken,
		secanswer,
		signhash,
	}) {
		const postURL = `${baseURL}/plugin.php?id=dd_sign&ac=sign&signsubmit=yes&handlekey=pc_click_ddsign&signhash=${signhash}&inajax=1`;
		const data = new URLSearchParams({
			formhash,
			signtoken,
			secanswer,
			secqaahash: "qSAxcb0",
		});
		const response = await fetch(postURL, {
			method: "post",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: data,
		});
		return response.text();
	}

	async function fetchWithContentType(url) {
		const response = await fetch(url);
		const contentType = response.headers.get("Content-Type");
		const responseText = await response.text();
		return { responseText, contentType };
	}

	function handleResponseContent(responseText, contentType) {
		if (contentType.includes("text/xml")) {
			return handleXMLContent(responseText);
		} else if (contentType.includes("text/html")) {
			return extractSignParametersFromHTML(responseText);
		} else {
			throw new Error("Unsupported content type");
		}
	}

	/**
	 * 处理XML内容并提取所需的签到参数。
	 *
	 * @param {string} responseText - 从请求中返回的XML内容。
	 * @returns {object|null} - 返回提取的签到参数或null。
	 */
	function handleXMLContent(responseText) {
		const settings = getSettings();
		let xml = parseContent(responseText, "text/xml");
		let content = xml.getElementsByTagName("root")[0].textContent;
		let doc = parseContent(content);
		const alertErrorElement = doc.querySelector(".alert_error");
		if (alertErrorElement) {
			let scripts = alertErrorElement.querySelectorAll("script");
			scripts.forEach((script) => {
				script.remove();
			});
			if (!settings.showSignTip) {
				showTooltip(alertErrorElement.textContent.trim());
			}
			return;
		} else {
			return extractSignParametersFromHTML(content);
		}
	}

	/**
	 * 从HTML内容中提取签到参数。
	 *
	 * @param {string} responseText - 从请求中返回的HTML内容。
	 * @returns {object} - 返回提取的签到参数。
	 */
	function extractSignParametersFromHTML(responseText) {
		const doc = parseContent(responseText);
		const formhash = extractValueFromDOM(doc, 'input[name="formhash"]');
		const signtoken = extractValueFromDOM(doc, 'input[name="signtoken"]');
		const signhash = extractValueFromDOM(
			doc,
			'form[name="login"]',
			"id"
		).replace("signform_", "");
		return { formhash, signtoken, signhash };
	}

	/**
	 * 从验证结果文本中提取计算表达式并计算结果。
	 *
	 * @param {string} resultText 验证结果文本
	 * @param {string} contentType 内容类型
	 * @returns {number} 计算的结果
	 */
	function extractValidationText(resultText, contentType) {
		const text = resultText
			.replace("sectplcode[2] + '", "前")
			.replace("' + sectplcode[3]", "后");
		const matchedText = text.match(/前([\w\W]+)后/)[1];
		return computeExpression(matchedText.replace("= ?", ""));
	}

	/**
	 * 计算给定的数学表达式。
	 *
	 * @param {string} expr 数学表达式
	 * @returns {number} 计算的结果
	 */
	const computeExpression = (expr) => {
		const [left, operator, right] = expr.split(/([+\-*/])/);
		const a = parseFloat(left.trim());
		const b = parseFloat(right.trim());
		switch (operator) {
			case "+":
				return a + b;
			case "-":
				return a - b;
			case "*":
				return a * b;
			case "/":
				return a / b;
			default:
				throw new Error("Unsupported operator");
		}
	};

	/**
	 * 根据签到响应内容更新签到按钮的状态，并设置最后签到日期。
	 *
	 * @param {string} responseText 签到响应内容
	 * @param {string} userid 用户ID
	 * @returns {boolean} 签到成功返回 true，否则返回 false
	 */
	function updateSignButton(responseText, userid) {
		const settings = getSettings();
		const today = new Date().toLocaleDateString();
		if (
			responseText.includes("已经签到过") ||
			responseText.includes("重复签到")
		) {
			if (!settings.showSignTip) {
				showTooltip("已经签到过啦，请明天再来！");
			}
			GM_setValue(`lastSignDate_${userid}`, today);
			return true;
		} else if (responseText.includes("签到成功")) {
			if (!settings.showSignTip) {
				showTooltip("签到成功，金钱+2，明天记得来哦。");
			}
			GM_setValue(`lastSignDate_${userid}`, today);
			return true;
		} else if (responseText.includes("请至少发表或回复一个帖子后再来签到")) {
			if (!settings.showSignTip) {
				showTooltip("请至少发表或回复一个帖子后再来签到!");
			}
			return false;
		} else {
			if (!settings.showSignTip) {
				showTooltip("抱歉，签到出现了未知错误！");
			}
			return false;
		}
	}

	// #endregion

	// #region 收藏帖子操作

	/**
	 * 收藏当前查看的帖子。
	 * 通过构造特定URL实现收藏功能，同时给用户提供收藏成功或失败的提示。
	 * @async
	 * @function
	 */
	async function star() {
		// 移除水印效果调用
		// showWatermarkMessage();
		// 从当前页面URL中获取帖子的tid
		const tid = extractTid(window.location.href);
		// 获取formhash，用于验证请求
		const formHash = document.querySelector('input[name="formhash"]').value;

		// 构造收藏URL
		const starUrl = `/home.php?mod=spacecp&ac=favorite&type=thread&id=${tid}&formhash=${formHash}&infloat=yes&handlekey=k_favorite&inajax=1&ajaxtarget=fwin_content_k_favorite`;

		// 发送收藏请求
		const text = await fetch(starUrl).then((r) => r.text());

		// 根据响应内容提供相应的提示
		if (text.includes("抱歉，您已收藏，请勿重复收藏")) {
			return showTooltip("抱歉，您已收藏，请勿重复收藏");
		}

		if (text.includes("信息收藏成功")) {
			return showTooltip("信息收藏成功");
		}

		// 如果既没有成功消息也没有重复收藏消息，视为出错
		showTooltip("信息收藏出现问题！！！");
	}

	// #endregion

	// #region 帖子评分

	/**
	 * 获取指定帖子的评分信息。
	 * @param {number} pid - 帖子ID。
	 * @param {number} tid - 主题ID。
	 * @param {number} timestamp - 当前时间戳。
	 * @returns {Object} 评分信息。
	 * @async
	 */
	async function getRateInfo(pid, tid, timestamp) {
		const infoDefaults = {
			state: false,
			max: 0,
			left: 0,
			formHash: "",
			referer: "",
			handleKey: "",
			error: "",
		};

		try {
			// 构建评分信息请求的URL
			const url = `/forum.php?mod=misc&action=rate&tid=${tid}&pid=${pid}&infloat=yes&handlekey=rate&t=${timestamp}&inajax=1&ajaxtarget=fwin_content_rate`;
			const response = await fetch(url);
			if (!response.ok) throw new Error("Failed to fetch rate info");

			// 解析服务器返回的XML数据
			const text = await response.text();
			const xml = new DOMParser().parseFromString(text, "text/xml");
			const htmlContent = xml.querySelector("root").textContent;
			const doc = new DOMParser().parseFromString(htmlContent, "text/html");

			// 检查是否存在错误
			if (htmlContent.includes("alert_error")) {
				const alertErrorElement = doc.querySelector(".alert_error");
				const scriptElements = alertErrorElement.querySelectorAll("script");
				scriptElements.forEach((script) => script.remove());

				const errorMessage = alertErrorElement.textContent.trim();
				return { ...infoDefaults, error: errorMessage };
			}

			// 提取评分信息
			const maxElement = doc.querySelector("#scoreoption8 li");
			if (!maxElement) {
				return { ...infoDefaults, error: "评分不足啦!" };
			}

			const max = parseInt(maxElement.textContent.replace("+", ""), 10);
			const left = parseInt(
				doc.querySelector(".dt.mbm td:last-child").textContent,
				10
			);
			const formHash = doc.querySelector('input[name="formhash"]').value;
			const referer = doc.querySelector('input[name="referer"]').value;
			const handleKey = doc.querySelector('input[name="handlekey"]').value;

			return {
				state: true,
				max: Math.min(max, left),
				left,
				formHash,
				referer,
				handleKey,
				error: "",
			};
		} catch (error) {
			showTooltip(error);
			return infoDefaults;
		}
	}

	/**
	 * 从帖子URL中获取主帖PID用于评分
	 * @param {string} threadUrl - 帖子URL
	 * @returns {string|null} - 主帖PID
	 */
	async function getMainPostPid(threadUrl) {
		try {

			const response = await fetch(threadUrl);
			if (!response.ok) throw new Error('Failed to fetch thread');

			const html = await response.text();
			const doc = new DOMParser().parseFromString(html, 'text/html');


			// 方法1: 直接查找主帖 #pid1
			let mainPost = doc.querySelector('#pid1');
			if (mainPost) {
				return '1'; // 主帖的PID通常是1
			}

			// 方法2: 查找第一个带PID的table元素
			mainPost = doc.querySelector('table[id^="pid"]');
			if (mainPost && mainPost.id.startsWith('pid')) {
				const pid = mainPost.id.replace('pid', '');
				return pid;
			}

			// 方法3: 查找.po.hin容器内的table
			const poHin = doc.querySelector('.po.hin');
			if (poHin) {
				const tableInPoHin = poHin.querySelector('table[id^="pid"]');
				if (tableInPoHin && tableInPoHin.id.startsWith('pid')) {
					const pid = tableInPoHin.id.replace('pid', '');
					return pid;
				}
			}

			// 方法4: 查找所有可能的PID容器
			const allPidElements = doc.querySelectorAll('[id^="pid"]');

			if (allPidElements.length > 0) {
				const firstPidElement = allPidElements[0];
				const pid = firstPidElement.id.replace('pid', '');
				return pid;
			}

			return null;
		} catch (error) {
			return null;
		}
	}

	/**
	 * 预览弹窗中的快速评分功能
	 * @param {string} tid - 帖子ID
	 * @async
	 */
	async function gradeFromPreview(tid) {
		try {

			// 构造帖子URL，用于缓存键
			const threadUrl = `${window.location.origin}/forum.php?mod=viewthread&tid=${tid}`;

			// 尝试从缓存获取PID
			let pid = titlePidCache.get(threadUrl);

			// 如果缓存中没有PID，则主动获取内容以填充缓存
			if (!pid) {
				await fetchThreadContent(threadUrl); // 这个函数会解析内容并填充PID缓存

				// 再次尝试从缓存获取PID
				pid = titlePidCache.get(threadUrl);

				if (!pid) {
					// 如果再次获取失败，则抛出错误
					throw new Error('无法获取主帖ID，请稍后重试');
				}
			}


			// 调用通用的评分函数
			await gradeWithTidPid(tid, pid);

		} catch (error) {
			showTooltip(error.message || '评分失败，请重试'); // 向用户显示错误
			// 将错误向上抛出，以便UI可以处理它（例如，恢复按钮状态）
			throw error;
		}
	}

	/**
	 * 使用指定的tid和pid进行评分
	 * @param {string} tid - 帖子ID
	 * @param {string} pid - 楼层ID
	 * @async
	 */
	async function gradeWithTidPid(tid, pid) {
		const timestamp = new Date().getTime();
		const rateInfo = await getRateInfo(pid, tid, timestamp);
		if (!rateInfo.state) {
			showTooltip(rateInfo.error);
			return;
		}
		var settings = getSettings();
		var maxGradeThread = settings.maxGradeThread;
		rateInfo.max =
			parseInt(rateInfo.max) < parseInt(maxGradeThread)
				? rateInfo.max
				: maxGradeThread;
		// 构建评分请求的URL和数据
		const rateUrl =
			"/forum.php?mod=misc&action=rate&ratesubmit=yes&infloat=yes&inajax=1";
		const data = new URLSearchParams();
		data.append("formhash", rateInfo.formHash);
		data.append("tid", tid);
		data.append("pid", pid);
		data.append("referer", rateInfo.referer);
		data.append("handlekey", rateInfo.handleKey);
		data.append("score8", `+${rateInfo.max}`);
		data.append("reason", settings.logoText);
		data.append("sendreasonpm", "on");

		// 发送评分请求
		const request = new Request(rateUrl, {
			method: "post",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: data,
		});

		try {
			const responseText = await fetch(request).then((r) => r.text());

			// 根据响应内容提供评分成功或失败的提示
			if (responseText.includes("感谢您的参与，现在将转入评分前页面")) {
				showTooltip(`+${rateInfo.max} 评分成功，并通知了楼主!`);
			} else {
				showTooltip("抱歉，评分失败！");
			}
		} catch (error) {
			showTooltip("评分请求失败！");
			throw error;
		}
	}

	/**
	 * 对指定的帖子进行评分。
	 * @param {number} pid - 帖子ID。
	 * @async
	 */
	async function grade(pid) {
		// 移除水印效果调用
		// showWatermarkMessage();
		const tid = extractTid(window.location.href);
		const timestamp = new Date().getTime();
		const rateInfo = await getRateInfo(pid, tid, timestamp);
		if (!rateInfo.state) {
			showTooltip(rateInfo.error);
			return;
		}
		var settings = getSettings();
		var maxGradeThread = settings.maxGradeThread;
		rateInfo.max =
			parseInt(rateInfo.max) < parseInt(maxGradeThread)
				? rateInfo.max
				: maxGradeThread;
		// 构建评分请求的URL和数据
		const rateUrl =
			"/forum.php?mod=misc&action=rate&ratesubmit=yes&infloat=yes&inajax=1";
		const data = new URLSearchParams();
		data.append("formhash", rateInfo.formHash);
		data.append("tid", tid);
		data.append("pid", pid);
		data.append("referer", rateInfo.referer);
		data.append("handlekey", rateInfo.handleKey);
		data.append("score8", `+${rateInfo.max}`);
		data.append("reason", settings.logoText);
		data.append("sendreasonpm", "on");

		// 发送评分请求
		const request = new Request(rateUrl, {
			method: "post",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: data,
		});

		try {
			const responseText = await fetch(request).then((r) => r.text());

			// 根据响应内容提供评分成功或失败的提示
			if (responseText.includes("感谢您的参与，现在将转入评分前页面")) {
				showTooltip(`+${rateInfo.max} 评分成功，并通知了楼主!`);
			} else {
				showTooltip("抱歉，评分失败！");
			}
		} catch (error) {
			showTooltip("评分请求失败！");
		}
	}

	// #endregion

	// #region 帖子置顶

	/**
	 * 获取指定帖子的置顶信息。
	 * @param {number} fid - 板块ID。
	 * @param {number} tid - 主题ID。
	 * @param {number} pid - 楼层ID。
	 * @returns {Object} 置顶信息。
	 * @async
	 */
	async function getTopicadmin(fid, tid, pid) {
		const infoDefaults = {
			state: false,
			action: "",
			formhash: "",
			page: "",
			handlekey: "",
			error: "",
		};
		try {
			const formhash = getFormHash();

			// 构建评分信息请求的URL
			const url = `/forum.php?mod=topicadmin&action=stickreply&fid=${fid}&tid=${tid}&handlekey=mods&infloat=yes&nopost=yes&inajax=1`;
			const data = new URLSearchParams();
			data.append("formhash", formhash);
			data.append("optgroup", "");
			data.append("operation", "");
			data.append("listextra", "");
			data.append("page", 1);
			data.append("topiclist[]", pid);

			const request = new Request(url, {
				method: "post",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: data,
			});

			const text = await fetch(request).then((r) => r.text());

			const xml = new DOMParser().parseFromString(text, "text/xml");
			const htmlContent = xml.querySelector("root").textContent;
			const doc = new DOMParser().parseFromString(htmlContent, "text/html");

			// 检查是否存在错误
			if (htmlContent.includes("alert_error")) {
				const alertErrorElement = doc.querySelector(".alert_error");
				const scriptElements = alertErrorElement.querySelectorAll("script");
				scriptElements.forEach((script) => script.remove());

				const errorMessage = alertErrorElement.textContent.trim();
				return { ...infoDefaults, error: errorMessage };
			}

			// 提取评分信息
			const element = doc.querySelector("#topicadminform");
			if (!element) {
				return { ...infoDefaults, error: "提取置顶信息失败拉!" };
			}
			// 获取元素的action属性值
			const action =
				element.getAttribute("action").replace(/amp;/g, "") + "&inajax=1";
			const newformhash = element.querySelector('input[name="formhash"]').value;
			const page = element.querySelector('input[name="page"]').value;
			const handlekey = element.querySelector('input[name="handlekey"]').value;

			return {
				state: true,
				action,
				formhash: newformhash,
				page,
				handlekey,
				error: "",
			};
		} catch (error) {
			showTooltip(error);
			return infoDefaults;
		}
	}

	/**
	 * 对指定的帖子进行置顶。
	 * @param {number} pid - 帖子ID。
	 * @async
	 */
	async function topicadmin(pid, stickreply) {
		// 移除水印效果调用
		// showWatermarkMessage();
		const tid = extractTid(window.location.href);
		let fid = getFidFromElement();

		if (!fid) {
			showTooltip("获取板块ID失败！");
			return;
		}
		const topicadminInfo = await getTopicadmin(fid, tid, pid);
		if (!topicadminInfo.state) {
			showTooltip(topicadminInfo.error);
			return;
		}
		const settings = getSettings();
		// 构建置顶请求的URL和数据
		const topicadminUrl = `/${topicadminInfo.action}`;
		const data = new URLSearchParams();
		data.append("formhash", topicadminInfo.formhash);
		data.append("fid", fid);
		data.append("tid", tid);
		data.append("topiclist[]", pid);
		data.append("page", topicadminInfo.page);
		data.append("handlekey", topicadminInfo.handlekey);
		data.append("stickreply", stickreply);
		data.append("reason", settings.logoText);
		data.append("sendreasonpm", "on");

		// 发送置顶请求
		const request = new Request(topicadminUrl, {
			method: "post",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: data,
		});

		try {
			const responseText = await fetch(request).then((r) => r.text());

			// 根据响应内容提供置顶成功或失败的提示
			if (responseText.includes("操作成功 ")) {
				showTooltip(
					stickreply == "1"
						? ` 置顶成功，并通知了楼主!`
						: ` 取消置顶成功，并通知了楼主!`
				);
			} else {
				showTooltip("抱歉，置顶失败！");
			}
		} catch (error) {
			showTooltip("置顶请求失败！");
		}
	}

	/**
	 * 从指定的元素中提取fid值
	 *
	 * @param {string} elementId - 要查找的元素的ID。
	 * @returns {string|null} 返回fid值，如果找不到则返回null。
	 */
	function getFidFromElement() {
		// 通过ID查找页面上的元素
		let element = document.querySelector("#newspecial");
		// 如果元素不存在，返回null
		if (!element) return null;

		// 获取元素的onclick属性值
		let hrefValue = element.getAttribute("onclick");

		// 如果onclick属性不存在，返回null
		if (!hrefValue) return null;

		// 使用正则表达式匹配fid的值
		let match = /fid=(\d+)/.exec(hrefValue);

		// 如果匹配成功，返回fid的值，否则返回null
		return match ? match[1] : null;
	}

	// #endregion

	// #region 一键评分与收藏

	/**
	 * 对首帖进行评分并收藏该帖子。
	 * 1. 从页面中选择首帖元素。
	 * 2. 从该元素获取帖子ID。
	 * 3. 对帖子进行评分。
	 * 4. 收藏该帖子。
	 */
	function gradeAndStar() {
		// 获取首帖元素
		let firstPobClElement = document.querySelector(".po.hin");
		// 从首帖元素中提取帖子ID
		let pid = getTableIdFromElement(firstPobClElement);

		// 对首帖进行评分
		grade(pid);
		// 收藏首帖
		star();
	}

	// #endregion

	// #region 勋章操作

	/**
	 * 判断是否应用设置
	 * @param {number} setting - 设置值
	 * @param {boolean} targetMatch - 目标匹配标志
	 * @return {boolean} - 是否应用设置
	 */
	function shouldApplySetting(setting, targetMatch) {
		return setting === 1 || (setting === 2 && targetMatch);
	}

	/**
	 * 隐藏勋章
	 * @param {HTMLImageElement} img - 勋章图片
	 * @param {boolean} targetMatch - 目标匹配标志
	 * @param {number} setting - 设置值
	 */
	function hideMedal(img, targetMatch, setting) {
		if (shouldApplySetting(setting, targetMatch)) {
			img.style.display = "none";
		} else {
			img.style.display = "";
		}
	}

	/**
	 * 调整勋章大小
	 * @param {HTMLImageElement} img - 勋章图片
	 * @param {boolean} targetMatch - 目标匹配标志
	 * @param {number} setting - 设置值
	 * @param {string} size - 新的图片大小
	 */
	function resizeMedal(img, targetMatch, setting, size) {
		if (shouldApplySetting(setting, targetMatch)) {
			img.style.width = size;
		} else {
			img.style.width = "auto";
		}
	}

	/**
	 * 替换勋章
	 * @param {HTMLImageElement} img - 勋章图片
	 * @param {boolean} targetMatch - 目标匹配标志
	 * @param {number} setting - 设置值
	 * @param {string} newUrl - 新的图片URL
	 */
	function replaceMedal(img, targetMatch, setting, newUrl) {
		if (shouldApplySetting(setting, targetMatch)) {
			img.src = newUrl;
			img.style.width = "50px";
		}
	}

	/**
	 * 主要的勋章操作函数
	 * @param {object} settings - 设置对象
	 */
	function manipulateMedals(settings) {
		const excludeNumbers = [
			17, 29, 31, 32, 33, 34, 35, 36, 37, 38, 110, 111, 112, 113, 114, 116, 117,
		];
		const targetMedalNumbers = Array.from({ length: 122 }, (_, i) => i + 14)
			.filter((num) => !excludeNumbers.includes(num))
			.map((num) => `medal${num}`);

		document.querySelectorAll(".md_ctrl img").forEach((img) => {
			const imgSrc = img.src;
			const targetMatch = targetMedalNumbers.some((target) =>
				imgSrc.includes(target)
			);

			hideMedal(img, targetMatch, settings.blockMedals);
		});
	}

	// #endregion

	// #region 用户内容屏蔽

	/**
	 * 检测是否存在discuz_redesign脚本的新布局
	 */
	function isRedesignedLayout() {
		const redesignedList = document.querySelector('.redesigned-thread-list');
		return redesignedList !== null;
	}

	/**
	 * 强制隐藏卡片元素，确保与discuz_redesign.js的CSS兼容
	 * @param {HTMLElement} card - 要隐藏的卡片元素
	 */
	function forceHideCard(card) {
		// 添加一个特殊的class来标记被屏蔽的卡片
		card.classList.add('blocked-card');

		// 使用多种方式确保隐藏效果
		card.style.setProperty('display', 'none', 'important');
		card.style.setProperty('visibility', 'hidden', 'important');
		card.style.setProperty('height', '0', 'important');
		card.style.setProperty('overflow', 'hidden', 'important');
		card.style.setProperty('margin', '0', 'important');
		card.style.setProperty('padding', '0', 'important');
		card.style.setProperty('border', 'none', 'important');
		card.style.setProperty('opacity', '0', 'important');

		// 从DOM流中移除
		card.setAttribute('aria-hidden', 'true');
	}

	/**
	 * 在新的卡片布局中屏蔽用户内容
	 * @param {object} settings - 设置对象，包含被屏蔽的用户列表和显示消息选项
	 */
	function blockContentInRedesignedLayout(settings) {
		const { blockedUsers, displayBlockedTips } = settings;
		const threadCards = document.querySelectorAll('.thread-card');

		threadCards.forEach((card, index) => {
			const authorElement = card.querySelector('.thread-author');
			if (authorElement) {
				const authorName = authorElement.textContent.trim();

				if (blockedUsers.includes(authorName)) {
					if (displayBlockedTips) {
						// 替换卡片内容为屏蔽提示
						card.innerHTML = `
							<div class="thread-content" style="padding: 20px; text-align: center; color: #666;">
								<div class="thread-title">
									<b>已屏蔽主题</b>
								</div>
								<div style="margin-top: 8px; font-size: 12px;">
									用户: <span style="color: #999;">${authorName}</span>
								</div>
							</div>
						`;
						card.style.background = 'rgba(200, 200, 200, 0.3)';
					} else {
						// 使用强制隐藏函数
						forceHideCard(card);
					}
				}
			}
		});
	}

	/**
	 * 根据设置屏蔽指定用户的内容
	 * 注意：原始布局的用户屏蔽逻辑已移除，现在只支持新的卡片布局
	 * @param {object} settings - 设置对象，包含被屏蔽的用户列表和显示消息选项
	 */
	function blockContentByUsers(settings) {
		// 检测是否使用了新的布局
		const isNewLayout = isRedesignedLayout();

		if (isNewLayout) {
			blockContentInRedesignedLayout(settings);
			return;
		}

		// 原始布局的用户屏蔽功能已移除，因为discuz_redesign.js已经改变了页面结构
	}

	// 性能优化：缓存用户名选择器和黑名单Set
	let cachedBlockedUsersSet = null;
	let lastBlockedUsersArray = null;
	let postPageBlockingTimer = null;

	/**
	 * 获取优化的黑名单用户Set（带缓存）
	 * @param {Array} blockedUsers - 黑名单用户数组
	 * @returns {Set} 黑名单用户Set
	 */
	function getBlockedUsersSet(blockedUsers) {
		// 如果黑名单没有变化，返回缓存的Set
		if (cachedBlockedUsersSet && lastBlockedUsersArray === blockedUsers) {
			return cachedBlockedUsersSet;
		}

		// 更新缓存
		lastBlockedUsersArray = blockedUsers;
		cachedBlockedUsersSet = new Set(blockedUsers);
		return cachedBlockedUsersSet;
	}

	/**
	 * 高性能提取用户名（优化版）
	 * @param {HTMLElement} postElement - 帖子元素
	 * @returns {string|null} 用户名或null
	 */
	function extractUsernameOptimized(postElement) {
		// 决策理由：按使用频率排序选择器，最常见的放在前面
		const prioritizedSelectors = [
			'.authi a', // 最常见的用户名链接
			'.pls .authi a', // 左侧用户信息区域
			'.authi cite a', // cite 包装的用户名
			'cite a', // 简化的 cite 链接
			'.favatar .authi a', // 头像区域的用户名
			'.authi .xi1', // 某些情况下的用户名
			'a[href*="space-uid-"]', // 包含用户ID的链接
			'a[href*="home.php?mod=space&uid="]' // 另一种用户链接格式
		];

		// 使用单次查询获取所有可能的用户名元素
		for (const selector of prioritizedSelectors) {
			const element = postElement.querySelector(selector);
			if (element) {
				const username = element.textContent.trim();
				if (username) {
					return username;
				}
			}
		}
		return null;
	}

	/**
	 * 在帖子内页屏蔽黑名单用户的回复和内容（性能优化版）
	 * @param {object} settings - 设置对象，包含被屏蔽的用户列表和显示消息选项
	 * @param {boolean} forceRecheck - 是否强制重新检查所有元素（用于新屏蔽用户后立即生效）
	 */
	function blockContentInPostPage(settings, forceRecheck = false) {
		const { blockedUsers, displayBlockedTips } = settings;

		if (!blockedUsers || blockedUsers.length === 0) {
			return;
		}

		// 性能优化：使用Set进行O(1)查找，而不是数组的O(n)查找
		const blockedUsersSet = getBlockedUsersSet(blockedUsers);

		// 根据是否强制重新检查来选择查询选择器
		let postElements;
		if (forceRecheck) {
			// 强制重新检查：查询所有帖子元素，包括已处理的
			postElements = document.querySelectorAll('div[id^="post_"], table[id^="pid"], .plhin, .pct');
		} else {
			// 正常模式：只查询未处理的帖子元素
			postElements = document.querySelectorAll('div[id^="post_"]:not([data-user-blocked]), table[id^="pid"]:not([data-user-blocked]), .plhin:not([data-user-blocked]), .pct:not([data-user-blocked])');
		}

		// 性能优化：使用DocumentFragment批量处理DOM操作
		let blockedCount = 0;

		postElements.forEach(postElement => {
			// 快速提取用户名
			const username = extractUsernameOptimized(postElement);

			// 标记已处理，避免重复检查
			if (!username) {
				postElement.dataset.userBlocked = 'no-username';
				return;
			}

			// 性能优化：使用Set.has()进行O(1)查找
			if (blockedUsersSet.has(username)) {
				// 决策理由：使用CSS类而不是内联样式，性能更好
				postElement.style.display = 'none';
				postElement.classList.add('blocked-post');
				postElement.dataset.userBlocked = 'blocked';
				postElement.dataset.blockedUser = username;
				blockedCount++;
			} else {
				// 显示未被屏蔽的帖子（可能之前被隐藏了）
				if (postElement.style.display === 'none' && postElement.classList.contains('blocked-post')) {
					postElement.style.display = '';
					postElement.classList.remove('blocked-post');
				}
				postElement.dataset.userBlocked = 'checked';
			}
		});

		// 性能优化：批量显示提示，避免频繁的DOM操作
		if (displayBlockedTips && blockedCount > 0) {
			showTooltip(`已屏蔽 ${blockedCount} 个用户的回复`);
		}
	}

	/**
	 * 带节流的帖子内页屏蔽函数（防止频繁调用）
	 * @param {object} settings - 设置对象
	 */
	function blockContentInPostPageThrottled(settings) {
		// 清除之前的定时器
		if (postPageBlockingTimer) {
			clearTimeout(postPageBlockingTimer);
		}

		// 设置新的定时器，300ms内只执行一次
		postPageBlockingTimer = setTimeout(() => {
			blockContentInPostPage(settings);
			postPageBlockingTimer = null;
		}, 300);
	}

	/**
	 * 在新的卡片布局中根据关键词屏蔽内容
	 * @param {object} settings - 设置对象，包含被屏蔽的关键词列表和显示消息选项
	 */
	function blockContentByTitleInRedesignedLayout(settings) {
		const { excludePostOptions, displayBlockedTips } = settings;

		// 如果没有关键字，直接返回
		if (!excludePostOptions || excludePostOptions.length === 0) {
			return;
		}

		const threadCards = document.querySelectorAll('.thread-card:not([data-keyword-checked])');

		threadCards.forEach((card, index) => {
			// 标记为已检查，避免重复处理
			card.setAttribute('data-keyword-checked', 'true');

			const titleElement = card.querySelector('.thread-title a');
			if (titleElement) {
				// 尝试多种方式获取完整标题
				let title = titleElement.textContent.trim();

				// 如果标题太短，尝试获取innerHTML并清理HTML标签
				if (title.length < 10) {
					const innerHTML = titleElement.innerHTML;
					title = innerHTML.replace(/<[^>]*>/g, '').trim();
				}

				// 如果还是太短，尝试从父元素获取
				if (title.length < 10) {
					const parentTitle = card.querySelector('.thread-title');
					if (parentTitle) {
						title = parentTitle.textContent.trim();
					}
				}

				// 详细检查每个关键字
				let matchedKeyword = null;

				for (let i = 0; i < excludePostOptions.length; i++) {
					const keyword = excludePostOptions[i];

					if (title.includes(keyword)) {
						matchedKeyword = keyword;
						break;
					}
				}

				if (matchedKeyword) {
					if (displayBlockedTips) {
						// 替换卡片内容为屏蔽提示
						card.innerHTML = `
							<div class="thread-content" style="padding: 20px; text-align: center; color: #666;">
								<div class="thread-title">
									<b>已屏蔽主题关键词: ${matchedKeyword}</b>
								</div>
								<div style="margin-top: 8px; font-size: 12px; color: #999;">
									原标题包含屏蔽关键词
								</div>
							</div>
						`;
						card.style.background = 'rgba(200, 200, 200, 0.3)';
					} else {
						// 使用强制隐藏函数
						forceHideCard(card);
					}
				}
			}
		});
	}

	/**
	 * 改进的关键字匹配函数
	 * @param {string} text - 要检查的文本
	 * @param {Array} keywords - 关键字列表
	 * @returns {string|null} - 匹配的关键字，如果没有匹配则返回null
	 */
	function findMatchingKeyword(text, keywords) {
		if (!text || !keywords || keywords.length === 0) {
			return null;
		}

		const lowerText = text.toLowerCase();

		for (const keyword of keywords) {
			if (!keyword || keyword.trim() === '') continue;

			const lowerKeyword = keyword.toLowerCase().trim();

			// 检查关键词是否包含中文字符
			const containsChinese = /[\u4e00-\u9fa5]/.test(lowerKeyword);

			if (containsChinese) {
				// 对于中文：直接包含匹配
				if (lowerText.includes(lowerKeyword)) {
					return keyword;
				}
			} else {
				// 对于英文：使用词边界匹配，避免部分匹配
				const regex = new RegExp('\\b' + escapeRegExp(lowerKeyword) + '\\b', 'i');
				if (regex.test(lowerText)) {
					return keyword;
				}

				// 如果词边界匹配失败，也尝试直接包含匹配（兼容性）
				if (lowerText.includes(lowerKeyword)) {
					return keyword;
				}
			}
		}

		return null;
	}

	/**
	 * 转义正则表达式特殊字符
	 * @param {string} string - 要转义的字符串
	 * @returns {string} - 转义后的字符串
	 */
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/**
	 * 根据设置的关键词屏蔽帖子标题
	 * 注意：原始布局的关键字屏蔽逻辑已移除，现在只支持新的卡片布局
	 * @param {object} settings - 设置对象，包含被屏蔽的用户列表和显示消息选项
	 */
	function blockContentByTitle(settings) {
		// 检测是否使用了新的布局
		const isNewLayout = isRedesignedLayout();

		if (isNewLayout) {
			blockContentByTitleInRedesignedLayout(settings);
			return;
		}

		// 原始布局的关键字屏蔽功能已移除，因为discuz_redesign.js已经改变了页面结构
	}

	// 注意：createBlockAction 和 applyBlockAction 函数已移除
	// 这些函数只用于原始布局的XPath屏蔽逻辑，现在已不再需要

	// #endregion

	// #region 个人主页美化脚本集成
	function integrateWithBeautificationScript() {
		// 监听美化脚本的完成事件
		document.addEventListener('authorPageRedesignComplete', function(event) {
			// 只有在有新内容且需要重新初始化图片预览时才处理
			if (event.detail && event.detail.needsImagePreviewReinit && event.detail.newCardsAdded > 0) {
				const settings = getSettings();
				if (settings.displayThreadImages) {
					// 延迟执行图片预览初始化，确保DOM已更新
					// 只为新增的卡片初始化图片预览，不影响已有的图片
					setTimeout(() => {
						displayThreadImagesInRedesignedLayout(settings);
					}, 200);
				}
			}
		});

		// 触发美化脚本重新处理新内容的函数
		window.triggerAuthorPageRedesign = function() {
			// 等待一下确保美化脚本的函数已经暴露
			setTimeout(() => {
				if (typeof window.transformAuthorThreadList === 'function') {
					window.transformAuthorThreadList();
				} else {
					const event = new CustomEvent('retriggerAuthorPageRedesign', {
						detail: { source: 'autopagination' }
					});
					document.dispatchEvent(event);
				}
			}, 50);
		};

		// 暴露图片预览函数给美化脚本使用
		window.displayThreadImagesInRedesignedLayout = displayThreadImagesInRedesignedLayout;
		window.getSettings = getSettings;
	}
	// #endregion

	// #region 无缝翻页

	/**
	 * 初始化无限滚动功能
	 * 根据用户的滚动行为来加载下一页的内容。
	 *
	 * @param {string} pageName 页面名称，用于确定要加载哪种内容
	 */
	function initInfiniteScroll(pageName) {
		// 检查是否已经初始化过，避免重复初始化
		if (window.infiniteScrollInitialized) {
			return;
		}

		let isLoading = false;
		let noMoreData = false;
		const settings = getSettings();

		// 根据传入的页面名称决定内容选择器
		let contentSelector;
		let alternativeSelectors = [];

		switch (pageName) {
			case "isSearchPage":
				contentSelector = "#threadlist";
				// 搜索页面的备选选择器
				alternativeSelectors = [
					"#searchlist",
					".pbw",
					".tl",
					"#ct .bm_c",
					".ct2 .bm_c",
					"#main .bm_c",
					"#ct",
					".ct2",
					"#main",
					".bm_c",
					"tbody",
					"table",
					".t",
					".forum",
					"#content",
					".content",
					"#wrapper",
					".wrapper"
				];
				break;
			case "isForumDisplayPage":
				contentSelector = "#threadlist";
				// 为导读页面添加备选选择器
				alternativeSelectors = [
					"#threadlisttableid",
					".tl",
					"#ct .bm_c",
					".ct2 .bm_c",
					"#main .bm_c",
					"#ct",
					".ct2",
					"#main",
					".bm_c",
					"tbody",
					"table",
					".t",
					".forum",
					"#content",
					".content"
				];
				break;
			case "isPostPage":
				contentSelector = "#postlist";
				break;
			case "isSpacePage":
				contentSelector = "#delform";
				break;
			default:
				contentSelector = "#threadlist"; // 默认选择器
		}

		if (!settings.autoPagination) {
			return;
		}

		// 检查目标元素是否存在
		const targetElement = document.querySelector(contentSelector);
		if (!targetElement) {
			return;
		}

		// 集成美化脚本
		if (pageName === "isSpacePage") {
			integrateWithBeautificationScript();
		}

		// 标记已初始化
		window.infiniteScrollInitialized = true;

		/**
		 * 加载下一个页面的内容。
		 * 获取当前页面中的"下一页"链接，然后抓取该链接的内容，
		 * 并将新内容添加到当前页面。
		 */
		async function loadNextPage() {
			const nextPageLink = document.querySelector(".nxt");
			if (!nextPageLink || noMoreData) {
				if (!noMoreData) {
					noMoreData = true;
				}
				return;
			}

			// 只在搜索页检查请求间隔，避免触发网站频率限制
			if (pageName === "isSearchPage") {
				const now = Date.now();
				const timeSinceLastRequest = now - (window.lastRequestTime || 0);
				const minInterval = 3000; // 最小间隔3秒

				if (timeSinceLastRequest < minInterval) {
					const waitTime = minInterval - timeSinceLastRequest;
					setTimeout(() => {
						loadNextPage();
					}, waitTime);
					return;
				}
				window.lastRequestTime = now;
			}

			isLoading = true;
			const url = nextPageLink.getAttribute("href");

			try {
				const response = await fetch(url);

				// 检查响应状态
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const text = await response.text();

				// 只在搜索页检查是否包含频率限制提示
				if (pageName === "isSearchPage" && (text.includes('刷新过于频繁') || text.includes('请3秒后再试') || text.includes('访问过于频繁'))) {
					isLoading = false;
					setTimeout(() => {
						loadNextPage();
					}, 5000);
					return;
				}

				const div = document.createElement("div");
				div.innerHTML = text;

				const newNextPageLink = div.querySelector(".nxt");
				newNextPageLink
					? nextPageLink.setAttribute(
						"href",
						newNextPageLink.getAttribute("href")
					)
					: (noMoreData = true);

				// 尝试找到新内容容器
				let newContent = div.querySelector(contentSelector);

				// 如果主选择器找不到，尝试备选选择器
				if (!newContent && alternativeSelectors.length > 0) {
					for (const altSelector of alternativeSelectors) {
						newContent = div.querySelector(altSelector);
						if (newContent) {
							// 更新当前使用的选择器
							contentSelector = altSelector;
							break;
						}
					}
				}

				// 如果还是找不到，对于搜索页面尝试智能检测
				if (!newContent && pageName === "isSearchPage") {
					// 尝试找到包含搜索结果的任何容器
					const possibleContainers = div.querySelectorAll('div, table, tbody, ul, ol');
					for (const container of possibleContainers) {
						// 检查容器是否包含搜索结果相关的内容
						if (container.innerHTML && (
							container.innerHTML.includes('thread-') ||
							container.innerHTML.includes('normalthread') ||
							container.innerHTML.includes('stickthread') ||
							container.innerHTML.includes('.htm') ||
							container.innerHTML.includes('forum.php') ||
							container.querySelector('a[href*="thread-"]') ||
							container.querySelector('a[href*="forum.php"]')
						)) {
							newContent = container;
							break;
						}
					}
				}

				if (!newContent) {
					isLoading = false;
					return;
				}

				appendNewContent(newContent);

				const newPagination = div.querySelector(".pg");
				if (newPagination) {
					updatePagination(newPagination);
				}

				const newSettings = getSettings();
				await processPageContentBasedOnSettings(pageName, newSettings);
				blockContentByUsers(settings);

				// 对新加载的内容也执行关键字屏蔽
				setTimeout(() => {
					blockContentByTitleInRedesignedLayout(settings);
				}, 200);

				isLoading = false;
				checkAndLoadIfContentNotEnough();
			} catch (error) {
				showTooltip('加载失败，请稍后重试');
				isLoading = false;

				// 如果是网络错误，等待一段时间后重试
				if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
					setTimeout(() => {
						loadNextPage();
					}, 5000);
				}
			}
		}

		/**
		 * 将新页面中的内容添加到当前页面。
		 * @param {Element} newContent 新的内容元素
		 */
		function appendNewContent(newContent) {
			// 检查新内容是否存在
			if (!newContent) {
				return;
			}

			// 尝试找到当前页面的内容容器
			let currentContent = document.querySelector(contentSelector);

			// 如果找不到，尝试备选选择器
			if (!currentContent && alternativeSelectors.length > 0) {
				for (const altSelector of alternativeSelectors) {
					currentContent = document.querySelector(altSelector);
					if (currentContent) {
						break;
					}
				}
			}

			if (!currentContent) {
				return;
			}

			// 检查是否存在新的卡片布局
			const redesignedContainer = document.querySelector('.redesigned-thread-list');

			if (redesignedContainer && (contentSelector === "#threadlist" || contentSelector.includes("threadlist"))) {
				// 如果存在新布局且当前是帖子列表页，需要同时更新两个容器

				// 1. 更新原始的threadlist（隐藏的，但自动翻页需要）
				if (newContent.childNodes && newContent.childNodes.length > 0) {
					newContent.childNodes.forEach((child) =>
						currentContent.appendChild(child.cloneNode(true))
					);
				}

				// 2. 处理新布局的卡片
				setTimeout(() => {
					processNewContentForRedesignedLayout(newContent, redesignedContainer);
				}, 50);
			} else {
				// 原有逻辑：直接添加到当前容器
				console.log('[逛色花调试] 使用原有逻辑追加内容，页面类型:', pageName);
				console.log('[逛色花调试] 新内容子节点数量:', newContent.childNodes ? newContent.childNodes.length : 0);

				// 特殊处理个人主页：只追加帖子行，不追加表头
				if (pageName === "isSpacePage") {
					// 查找新内容中的表格和帖子行
					const newTable = newContent.querySelector('table');
					if (newTable) {
						const newRows = newTable.querySelectorAll('tr:not(.th)'); // 排除表头行

						// 查找当前页面的表格
						const currentTable = currentContent.querySelector('table tbody');
						if (currentTable && newRows.length > 0) {
							newRows.forEach(row => {
								const clonedRow = row.cloneNode(true);
								currentTable.appendChild(clonedRow);
							});

							// 触发美化脚本重新处理新内容
							setTimeout(() => {
								if (typeof window.triggerAuthorPageRedesign === 'function') {
									window.triggerAuthorPageRedesign();
								} else {
									// 尝试直接调用美化脚本的转换函数
									const event = new CustomEvent('retriggerAuthorPageRedesign', {
										detail: {
											source: 'autopagination',
											newRowsCount: newRows.length
										}
									});
									document.dispatchEvent(event);
								}
							}, 100);
						}
					}
				} else {
					// 其他页面的原有逻辑
					if (newContent.childNodes && newContent.childNodes.length > 0) {
						newContent.childNodes.forEach((child) =>
							currentContent.appendChild(child.cloneNode(true))
						);
					} else if (newContent.innerHTML) {
						// 如果没有子节点，尝试直接添加HTML内容
						const tempDiv = document.createElement('div');
						tempDiv.innerHTML = newContent.innerHTML;
						while (tempDiv.firstChild) {
							currentContent.appendChild(tempDiv.firstChild);
						}
					}
				}
			}
		}

		/**
		 * 为新布局处理新加载的内容
		 * @param {Element} newContent 新的内容元素
		 * @param {Element} redesignedContainer 新布局容器
		 */
		function processNewContentForRedesignedLayout(newContent, redesignedContainer) {
			// 获取新内容中的置顶帖子行
			const newStickyThreadRows = newContent.querySelectorAll('tbody[id^="stickthread_"]');

			// 获取新内容中的普通帖子行
			const newNormalThreadRows = newContent.querySelectorAll('tbody[id^="normalthread_"]');

			// 处理置顶帖（如果有的话）
			newStickyThreadRows.forEach(row => {
				const card = processThreadRowForAutoPagination(row, true);
				if (card) {
					redesignedContainer.appendChild(card);
					// 使用 setTimeout 确保元素已附加到 DOM 并渲染
					setTimeout(() => {
						const avatarImg = card.querySelector('.thread-avatar img');
						if (avatarImg) {
							addBlockUserButtonToAvatar(avatarImg);
						}
					}, 0);
				}
			});

			// 处理普通帖
			newNormalThreadRows.forEach(row => {
				const card = processThreadRowForAutoPagination(row, false);
				if (card) {
					redesignedContainer.appendChild(card);
					// 使用 setTimeout 确保元素已附加到 DOM 并渲染
					setTimeout(() => {
						const avatarImg = card.querySelector('.thread-avatar img');
						if (avatarImg) {
							addBlockUserButtonToAvatar(avatarImg);
						}
					}, 0);
				}
			});
		}

		/**
		 * 为自动翻页处理帖子行，生成卡片（复用discuz_redesign.js的逻辑）
		 * @param {Element} row 帖子行元素
		 * @param {boolean} isSticky 是否为置顶帖
		 * @returns {Element|null} 生成的卡片元素
		 */
		function processThreadRowForAutoPagination(row, isSticky = false) {
			// 提取帖子信息 - 兼容不同页面的标题选择器
			const titleElement = row.querySelector('a.s.xst') ||
				row.querySelector('a.xst') ||
				row.querySelector('th.common a') ||
				row.querySelector('th a') ||
				row.querySelector('a[href*="thread"]') ||
				row.querySelector('a[href*="viewthread"]');
			if (!titleElement) return null;

			const title = titleElement.textContent;
			const link = titleElement.href;

			// 提取帖子ID用于重复检查
			const threadId = extractThreadId(link);
			if (!threadId) return null;

			// 检查是否已经存在相同的帖子卡片
			const existingCard = document.querySelector(`.thread-card[data-thread-id="${threadId}"]`);
			if (existingCard) {
				return null;
			}

			// 提取作者信息
			const authorElement = row.querySelector('td.by cite a');
			const author = authorElement ? authorElement.textContent : '未知作者';

			// 提取space-uid并生成头像地址
			const spaceUid = extractSpaceUidForAutoPagination(row);
			const avatarUrl = generateAvatarUrlForAutoPagination(spaceUid);

			// 提取时间 - 兼容不同页面结构，同时提取发表时间和最后回复时间
			const byElements = row.querySelectorAll('td.by');
			let postTime = '';
			let replyTime = '';



			if (byElements.length >= 3) {
				// 有3个td.by：第2个是发表时间，第3个是最后回复时间
				// 发表时间
				let postTimeElement = byElements[1].querySelector('em span') ||
					byElements[1].querySelector('em');
				if (postTimeElement) {
					postTime = postTimeElement.textContent || postTimeElement.getAttribute('title') || '';
					if (!postTime) {
						const innerSpan = postTimeElement.querySelector('span[title]');
						if (innerSpan) {
							postTime = innerSpan.getAttribute('title') || innerSpan.textContent || '';
						}
					}
				}

				// 最后回复时间
				let replyTimeElement = byElements[2].querySelector('em a') ||
					byElements[2].querySelector('em span span') ||
					byElements[2].querySelector('em span') ||
					byElements[2].querySelector('em');
				if (replyTimeElement) {
					replyTime = replyTimeElement.textContent || replyTimeElement.getAttribute('title') || '';
					if (!replyTime) {
						const innerSpan = replyTimeElement.querySelector('span[title]');
						if (innerSpan) {
							replyTime = innerSpan.getAttribute('title') || innerSpan.textContent || '';
						}
					}
				}


			} else if (byElements.length >= 2) {
				// 有2个td.by：第1个是发表时间，第2个是最后回复时间
				// 发表时间
				let postTimeElement = byElements[0].querySelector('em a') ||
					byElements[0].querySelector('em span') ||
					byElements[0].querySelector('em');
				if (postTimeElement) {
					postTime = postTimeElement.textContent || postTimeElement.getAttribute('title') || '';
					if (!postTime) {
						const innerSpan = postTimeElement.querySelector('span[title]');
						if (innerSpan) {
							postTime = innerSpan.getAttribute('title') || innerSpan.textContent || '';
						}
					}
				}

				// 最后回复时间
				let replyTimeElement = byElements[1].querySelector('em a') ||
					byElements[1].querySelector('em span span') ||
					byElements[1].querySelector('em span') ||
					byElements[1].querySelector('em');
				if (replyTimeElement) {
					replyTime = replyTimeElement.textContent || replyTimeElement.getAttribute('title') || '';
					if (!replyTime) {
						const innerSpan = replyTimeElement.querySelector('span[title]');
						if (innerSpan) {
							replyTime = innerSpan.getAttribute('title') || innerSpan.textContent || '';
						}
					}
				}


			} else if (byElements.length >= 1) {
				// 只有1个td.by：使用作为发表时间
				let timeElement = byElements[0].querySelector('em a') ||
					byElements[0].querySelector('em span') ||
					byElements[0].querySelector('em');

				if (timeElement) {
					postTime = timeElement.textContent || timeElement.getAttribute('title') || '';
					if (!postTime) {
						const innerSpan = timeElement.querySelector('span[title]');
						if (innerSpan) {
							postTime = innerSpan.getAttribute('title') || innerSpan.textContent || '';
						}
					}
				}


			}

			// 提取回复数和查看数
			const replyElement = row.querySelector('td.num a');
			const viewElement = row.querySelector('td.num em');
			const replies = replyElement ? replyElement.textContent : '0';
			const views = viewElement ? viewElement.textContent : '0';

			// 创建卡片元素
			const card = document.createElement('div');
			card.className = 'thread-card' + (isSticky ? ' sticky' : '');
			card.setAttribute('data-thread-id', threadId); // 添加唯一标识

			// 构建卡片HTML
			if (isSticky) {
				// 置顶帖：只显示标题，不显示其他信息
				card.innerHTML = `
					<div class="thread-avatar">
						<img src="${avatarUrl}" alt="${author}" onerror="this.src='/uc_server/images/noavatar_small.gif'">
					</div>
					<div class="thread-content">
						<div class="thread-title">
							<span class="sticky-tag">置顶</span>
							<a href="${link}">${title}</a>
						</div>
					</div>
				`;
			} else {
				// 普通帖：根据是否有最后回复时间决定显示内容
				let timeDisplay = '';
				if (replyTime && postTime) {
					// 有双时间，显示发表时间和最后回复时间
					timeDisplay = `
						<span class="thread-time">
							<i class="fa fa-clock-o" style="margin-right: 3px;"></i>${postTime}
						</span>
						<span class="thread-reply-time">
							<i class="fa fa-reply" style="margin-right: 3px;"></i>${replyTime}
						</span>`;
				} else if (postTime) {
					// 只有发表时间
					timeDisplay = `<span class="thread-time">${postTime}</span>`;
				}

				card.innerHTML = `
					<div class="thread-avatar">
						<img src="${avatarUrl}" alt="${author}" onerror="this.src='/uc_server/images/noavatar_small.gif'">
					</div>
					<div class="thread-content">
						<div class="thread-title">
							<a href="${link}">${title}</a>
						</div>
						<div class="thread-info">
							<span class="thread-author">${author}</span>
							${timeDisplay}
							<span class="thread-replies">回复: ${replies}</span>
							<span class="thread-views">查看: ${views}</span>
						</div>
					</div>
				`;
			}

			// 这部分已移至 processNewContentForRedesignedLayout 中，在卡片添加到DOM后执行
			// const newCardAvatarImg = card.querySelector('.thread-avatar img');
			// if (newCardAvatarImg) {
			// 	addBlockUserButtonToAvatar(newCardAvatarImg);
			// }

			return card;
		}

		/**
		 * 从帖子链接中提取帖子ID
		 * @param {string} link 帖子链接
		 * @returns {string|null} 帖子ID
		 */
		function extractThreadId(link) {
			// 匹配 thread-123456-1-1.html 格式
			const threadMatch = link.match(/thread-(\d+)-/);
			if (threadMatch) {
				return threadMatch[1];
			}

			// 匹配 tid=123456 格式
			const tidMatch = link.match(/tid=(\d+)/);
			if (tidMatch) {
				return tidMatch[1];
			}

			return null;
		}

		/**
		 * 为自动翻页提取space-uid
		 * @param {Element} row 帖子行元素
		 * @returns {number|null} space-uid
		 */
		function extractSpaceUidForAutoPagination(row) {
			// 查找作者链接中的space-uid
			const authorLink = row.querySelector('td.by cite a');
			if (authorLink && authorLink.href) {
				const match = authorLink.href.match(/space-uid-(\d+)/);
				if (match) {
					return parseInt(match[1]);
				}
			}
			return null;
		}

		/**
		 * 为自动翻页根据space-uid生成头像地址
		 * @param {number|null} spaceUid space-uid
		 * @returns {string} 头像URL
		 */
		function generateAvatarUrlForAutoPagination(spaceUid) {
			// 如果没有spaceUid，返回默认头像
			if (!spaceUid) {
				return '/uc_server/images/noavatar_small.gif';
			}

			// 将uid转换为9位数字字符串，前面补0
			const uidStr = spaceUid.toString().padStart(9, '0');

			// 按每两位分组：000/42/81/19
			// 对于428119，补0后变成000428119，分组为：000/42/81/19
			const part1 = uidStr.slice(0, 3);   // 000
			const part2 = uidStr.slice(3, 5);   // 42
			const part3 = uidStr.slice(5, 7);   // 81
			const part4 = uidStr.slice(7, 9);   // 19

			// 构建头像URL
			const baseUrl = window.location.origin;
			return `${baseUrl}/uc_server/data/avatar/${part1}/${part2}/${part3}/${part4}_avatar_middle.jpg`;
		}

		/**
		 * 更新页面上的分页元素（页码）为新页面中的分页元素。
		 * @param {Element} newPgElement 新的分页元素
		 */
		function updatePagination(newPgElement) {
			const currentPageElements = document.querySelectorAll(".pg");
			currentPageElements.forEach(
				(pg) => (pg.innerHTML = newPgElement.innerHTML)
			);
		}

		/**
		 * 根据页面名称和设置处理页面内容。
		 * @param {string} pageName 页面名称
		 * @param {Object} settings 用户设置
		 */
		async function processPageContentBasedOnSettings(pageName, settings) {
			if (pageName == "isSearchPage") {
				filterElementsBasedOnSettings(settings);
				displayAdvanThreadImages(settings);
			} else if (pageName == "isForumDisplayPage") {

				removeAD2();
				blockingResolvedAction(settings);
				blockContentByTitle(settings);

				// 检查是否存在新布局
				const redesignedContainer = document.querySelector('.redesigned-thread-list');
				if (redesignedContainer) {
					// 如果存在新布局，只应用新布局的功能
					setTimeout(() => {
						blockContentInRedesignedLayout(settings);
						blockContentByTitleInRedesignedLayout(settings);
						blockingResolvedActionInRedesignedLayout(settings);
						if (settings.displayThreadImages) {
							displayThreadImagesInRedesignedLayout(settings);
						}
					}, 100);
				}
			} else if (pageName == "isPostPage") {
				replacePMonPost();
				showAvatarEvent();
				// 在帖子内页执行用户屏蔽（使用节流版本）
				blockContentInPostPageThrottled(settings);
				const userid = getUserId();
				if (userid) {
					// addQuickGradeToPostButton();//已失效和谐
					addQuickActionToPostButton();
				}
				removeAD3();
				manipulateMedals(settings); // 修改用户勋章显示
			}
		}

		/**
		 * 检查页面内容是否已经填满视窗，如果没有，则加载下一页内容。
		 */
		function checkAndLoadIfContentNotEnough() {
			if (document.body.offsetHeight <= window.innerHeight && !isLoading) {
				loadNextPage();
			}
		}

		// 创建滚动事件处理函数，添加节流控制
		let scrollTimeout;
		const scrollHandler = () => {
			// 清除之前的定时器
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}

			// 设置新的定时器，延迟执行以避免过于频繁的触发
			scrollTimeout = setTimeout(() => {
				const scrollCondition = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;

				if (scrollCondition && !isLoading) {
					loadNextPage();
				}
			}, 100); // 100ms的延迟
		};

		// 添加滚动事件监听器
		window.addEventListener("scroll", scrollHandler);

		// 保存清理函数到全局，以便在需要时清理
		window.infiniteScrollCleanup = () => {
			window.removeEventListener("scroll", scrollHandler);
			window.infiniteScrollInitialized = false;
			window.infiniteScrollCleanup = null;
		};

		checkAndLoadIfContentNotEnough();
	}

	/**
	 * 根据提供的设置过滤页面上的元素
	 * @param {Object} settings 用户设置
	 */
	function filterElementsBasedOnSettings(settings) {
		const pbwElements = document.querySelectorAll(".pbw");

		pbwElements.forEach((pbw) => {
			let shouldDisplay = shouldElementBeDisplayed(pbw, settings);
			pbw.style.display = shouldDisplay ? "block" : "none";
		});
	}

	/**
	 * 确定给定的元素是否应该根据提供的设置显示在页面上
	 * @param {Element} element 待检查的元素
	 * @param {Object} settings 用户设置
	 * @returns {boolean} 根据设置是否应显示元素
	 */
	function shouldElementBeDisplayed(element, settings) {
		if (settings.TIDGroup && settings.TIDGroup.length) {
			const aElement = element.querySelector(".xi1");
			if (!aElement || !doesTIDGroupMatch(aElement, settings.TIDGroup)) {
				return false;
			}
		}

		if (settings.excludeGroup && settings.excludeGroup.length) {
			const pElement = element.querySelector("p:nth-of-type(2)");
			const xs3Element = element.querySelector(".xs3");

			if (
				isExcludedByKeyword(pElement, settings.excludeGroup) ||
				isExcludedByKeyword(xs3Element, settings.excludeGroup)
			) {
				return false;
			}
		}

		return true;
	}

	/**
	 * 检查给定的元素链接是否与提供的TIDGroup中的任何ID匹配
	 * @param {Element} aElement 待检查的链接元素
	 * @param {Array} TIDGroup TID组
	 * @returns {boolean} 是否与TID组匹配
	 */
	function doesTIDGroupMatch(aElement, TIDGroup) {
		const href = aElement.getAttribute("href");

		// 判断是否匹配 fid=${tid} 或 forum=${tid} 的格式
		return TIDGroup.some(
			(tid) => href.includes(`fid=${tid}`) || href.includes(`forum-${tid}`)
		);
	}

	/**
	 * 检查给定的元素内容是否包含提供的排除关键字列表中的任何关键字
	 * @param {Element} element 待检查的元素
	 * @param {Array} excludeGroup 排除关键字组
	 * @returns {boolean} 是否包含关键字
	 */
	function isExcludedByKeyword(element, excludeGroup) {
		if (!element) return false;
		const text = element.textContent.toLowerCase();
		return excludeGroup.some((keyword) => text.includes(keyword.toLowerCase()));
	}

	// #endregion

	// #region 帖子列表页执行的方法

	/**
	 * 显示发帖模态框
	 * @param {number} fid - 板块ID
	 */
	function showPostModal(fid) {
		// 检查是否已存在模态框
		const existingModal = document.getElementById('postModal');
		if (existingModal) {
			existingModal.remove();
		}

		// 创建模态框
		const modal = document.createElement('div');
		modal.id = 'postModal';

		// 创建关闭按钮
		const closeBtn = document.createElement('button');
		closeBtn.className = 'close-btn';
		closeBtn.onclick = function () {
			modal.remove();
		};

		// 创建iframe来加载发帖页面
		const iframe = document.createElement('iframe');
		iframe.src = `forum.php?mod=post&action=newthread&fid=${fid}`;
		iframe.style.cssText = `
			width: 100%;
			height: 100%;
      border: none;
		`;

		// 组装模态框
		modal.appendChild(closeBtn);
		modal.appendChild(iframe);
		document.body.appendChild(modal);

		// 添加拖动功能
		enableDrag(modal);

		// iframe加载完成后的处理
		iframe.onload = function () {
			try {
				// 尝试隐藏iframe中不需要的元素（如果同域的话）
				const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
				if (iframeDoc) {
					// 隐藏导航栏等不需要的元素
					const elementsToHide = [
						'#hd', // 头部
						'#ft', // 底部
						'#pt', // 面包屑导航
						'.wp .cl', // 某些容器
					];

					elementsToHide.forEach(selector => {
						const element = iframeDoc.querySelector(selector);
						if (element) {
							element.style.display = 'none';
						}
					});

					// 调整iframe内容的样式
					const style = iframeDoc.createElement('style');
					style.textContent = `
/* 设置body为flex容器来居中内容 */
body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: transparent;
}

.bm { margin: 10px 0; }

#nv_forum #ct {
    width: 1100px !important;
  }

#e_iframe {
  min-height: 500px !important;
}

/* 使用共用样式 */
${COMMON_STYLES}


					`;
					iframeDoc.head.appendChild(style);

					// 在iframe中初始化发帖页功能
					const initIframeFeatures = () => {
						// 检查是否是发帖页面
						const isPostPageInIframe = iframeDoc.location.href.includes("forum.php?mod=post&action=newthread");

						if (isPostPageInIframe) {

							// 在iframe的window对象上下文中执行PostContent函数
							const iframeWindow = iframe.contentWindow;

							// 直接在iframe的document上下文中执行原有的PostContent逻辑
							try {
								// 直接执行PostContent的核心逻辑，不修改全局document

								// 检查URL条件
								if (iframeDoc.location.href.includes("forum.php?mod=post&action=newthread")) {

									// 创建发帖须知链接
									const link = iframeDoc.createElement("a");
									link.href = "/forum.php?mod=redirect&goto=findpost&ptid=1708826&pid=16039784";
									link.textContent = "发帖须知";
									link.target = "_blank";

									// 创建整理按钮
									const organizeButton = iframeDoc.createElement("li");
									organizeButton.className = "a";
									organizeButton.innerHTML = '<button id="organizeBtn" type="button">整理</button>';

									// 创建自转按钮
									const shareButton = iframeDoc.createElement("li");
									shareButton.className = "a";
									shareButton.innerHTML = '<button id="shareBtn" type="button">自转</button>';

									// 查找插入位置（使用原始PostContent的选择器）
									const ulElement = iframeDoc.querySelector(".tb.cl.mbw");

									if (ulElement) {
										ulElement.appendChild(link);
										ulElement.appendChild(organizeButton);
										ulElement.appendChild(shareButton);
									} else {
										// 尝试备用选择器
										const backupElement = iframeDoc.querySelector("#postbox .area");
										if (backupElement && backupElement.parentNode) {
											backupElement.parentNode.insertBefore(link, backupElement);
											backupElement.parentNode.insertBefore(organizeButton, backupElement);
											backupElement.parentNode.insertBefore(shareButton, backupElement);
										}
									}

									// 创建模态框HTML（使用原有的完整HTML结构）
									const modalContent = `
									<div id="organizeModal">
										<!-- 关闭按钮 -->
										<button class="close-btn">
											<span class="close-btn-line"></span>
											<span class="close-btn-line"></span>
										</button>

										<div>
											<strong>【资源名称】：</strong>
											<input type="text" id="resourceName"/>
										</div>
										<div>
											<strong>【资源类型】：</strong>
											<label><input type="radio" name="resourceType" value="影片" checked />影片</label>
											<label><input type="radio" name="resourceType" value="视频" />视频</label>
											<label><input type="radio" name="resourceType" value="动漫" />动漫</label>
											<label><input type="radio" name="resourceType" value="套图" />套图</label>
											<label><input type="radio" name="resourceType" value="游戏" />游戏</label>
										</div>
										<div>
											<strong>【是否有码】：</strong>
											<label><input type="radio" name="censorship" value="有码" checked />有码</label>
											<label><input type="radio" name="censorship" value="无码" />无码</label>
										</div>
										<div>
											<strong>【是否水印】：</strong>
											<label><input type="radio" name="watermark" value="有水印" />有水印</label>
											<label><input type="radio" name="watermark" value="无水印" checked />无水印</label>
										</div>
										<div>
											<strong>【字幕选项】：</strong>
											<label><input type="radio" name="subtitle" value="中文字幕" />中文字幕</label>
											<label><input type="radio" name="subtitle" value="日文字幕" />日文字幕</label>
											<label><input type="radio" name="subtitle" value="英文字幕" />英文字幕</label>
											<label><input type="radio" name="subtitle" value="无字幕" checked />无字幕</label>
										</div>
										<div>
											<strong>【资源大小】：</strong>
											<input type="text" id="resourceSize" placeholder=""/>
											<label><input type="radio" name="sizeUnit" value="M" />M</label>
											<label><input type="radio" name="sizeUnit" value="G" checked />G</label>
											<label><input type="radio" name="sizeUnit" value="T" />T</label>
										</div>
										<div>
											<strong>【下载类型】：</strong>
											<label><input type="radio" name="downType" value="115ED2K" checked />115ED2K</label>
											<label><input type="radio" name="downType" value="BT/磁链" />BT/磁链</label>
											<label><input type="radio" name="downType" value="ED2K" />ED2K</label>
											<label><input type="radio" name="downType" value="夸克网盘" />夸克网盘</label>
											<label><input type="radio" name="downType" value="百度网盘" />百度网盘</label>
											<label><input type="radio" name="downType" value="PikPak网盘" />PikPak网盘</label>
											<label><input type="radio" name="downType" value="其它网盘" />其它网盘</label>
										</div>
										【视频数量】：<input type="text" id="videoCount" placeholder=""/><br>
										【图片数量】：<input type="text" id="imageCount" placeholder=""/><br>
										【配额数量】：<input type="text" id="quota" placeholder=""/>
										<div><strong>【资源预览】：</strong></div>
										<div><strong>【资源链接】：</strong><input type="text" id="resourceLink"/></div>
										<button id="insetBtn" type="button">插入</button>
									</div>`;


									iframeDoc.body.insertAdjacentHTML("beforeend", modalContent);

									// 添加拖动功能
									const organizeModalElement = iframeDoc.getElementById("organizeModal");
									if (organizeModalElement) {
										organizeModalElement.style.position = "fixed";
										organizeModalElement.style.cursor = "move";
										// 注入enableDrag函数到iframe
										iframeWindow.enableDrag = enableDrag;
										iframeWindow.enableDrag(organizeModalElement);
									}

									// 添加事件监听器
									let ttttype = '';

									const organizeBtn = iframeDoc.getElementById("organizeBtn");
									const shareBtn = iframeDoc.getElementById("shareBtn");
									const insertBtn = iframeDoc.getElementById("insetBtn");
									const closeBtn = iframeDoc.querySelector("#organizeModal .close-btn");

									if (organizeBtn) {
										organizeBtn.addEventListener("click", function () {
											ttttype = "整理";
											const modal = iframeDoc.getElementById("organizeModal");
											modal.style.display = "block";
											if (!modal.dataset.hasBeenDragged) {
												modal.style.left = "50%";
												modal.style.top = "50%";
												modal.style.transform = "translate(-50%, -50%)";
											}
										});
									}

									if (shareBtn) {
										shareBtn.addEventListener("click", function () {
											ttttype = "自转";
											const modal = iframeDoc.getElementById("organizeModal");
											modal.style.display = "block";
											if (!modal.dataset.hasBeenDragged) {
												modal.style.left = "50%";
												modal.style.top = "50%";
												modal.style.transform = "translate(-50%, -50%)";
											}
										});
									}

									if (closeBtn) {
										closeBtn.addEventListener("click", function () {
											iframeDoc.getElementById("organizeModal").style.display = "none";
										});
									}

									if (insertBtn) {
										insertBtn.addEventListener("click", function () {
											// 这里使用原有的插入逻辑
											const resourceName = iframeDoc.getElementById("resourceName").value;
											const resourceType = iframeDoc.querySelector('input[name="resourceType"]:checked')?.value;
											const censorship = iframeDoc.querySelector('input[name="censorship"]:checked')?.value;
											const watermark = iframeDoc.querySelector('input[name="watermark"]:checked')?.value;
											const subtitle = iframeDoc.querySelector('input[name="subtitle"]:checked')?.value;
											const resourceLink = iframeDoc.getElementById("resourceLink").value;
											const downType = iframeDoc.querySelector('input[name="downType"]:checked')?.value;
											const resourceSize = iframeDoc.getElementById("resourceSize").value;
											const sizeUnit = iframeDoc.querySelector('input[name="sizeUnit"]:checked').value;
											const videoCount = iframeDoc.getElementById("videoCount").value;
											const imageCount = iframeDoc.getElementById("imageCount").value;
											const quota = iframeDoc.getElementById("quota").value;

											let resourceSizeStr = resourceSize ? `${resourceSize}${sizeUnit}` : "";
											let videoCountStr = videoCount ? `${videoCount}V` : "";
											let imageCountStr = imageCount ? `${imageCount}P` : "";
											let quotaStr = quota ? `${quota}配额` : "";

											const content = `
											【资源名称】：${resourceName}<br>
											【资源类型】：${resourceType}<br>
											【是否有码】：${censorship} @ ${watermark} @ ${subtitle}<br>
											【资源大小】：${resourceSizeStr}/${videoCountStr}/${imageCountStr}/${quotaStr}<br>
											【资源预览】：<br>
											【资源链接】：<div class="blockcode"><blockquote>${resourceLink}</blockquote></div><br>
											`;

											// 插入到编辑器
											const iframe_editor = iframeDoc.querySelector(".area iframe");
											if (iframe_editor && iframe_editor.contentDocument) {
												const body = iframe_editor.contentDocument.body;
												if (body && body.isContentEditable) {
													body.innerHTML = content;
												}
											}

											// 设置标题
											const title = `【${ttttype}】【${downType}】${resourceName}【${resourceSizeStr}/${videoCountStr}/${imageCountStr}/${quotaStr}】`;
											const subjectInput = iframeDoc.getElementById("subject");
											if (subjectInput) {
												subjectInput.value = title;
											}

											// 设置分类
											const selectElement = iframeDoc.getElementById("typeid");
											if (selectElement) {
												selectElement.setAttribute("selecti", "8");
											}
											const aElement = iframeDoc.querySelector(".ftid a#typeid_ctrl");
											if (aElement) {
												aElement.textContent = "情色分享";
												aElement.setAttribute("initialized", "true");
											}

											iframeDoc.getElementById("organizeModal").style.display = "none";
										});
									}


								}

							} catch (e) {
								// 静默处理错误
							}

							// 添加右侧快捷按钮
							addIframeQuickButtons(iframeDoc, iframeWindow);
						}
					};

					// 页面加载完成后初始化功能
					if (iframeDoc.readyState === 'complete') {
						initIframeFeatures();
					} else {
						iframeDoc.addEventListener('DOMContentLoaded', initIframeFeatures);
						iframe.addEventListener('load', initIframeFeatures);
					}

					// 修复弹出窗口定位问题
					const fixPopupPositioning = () => {
						// 监听DOM变化，当有新的弹出窗口出现时进行修正
						const observer = new MutationObserver((mutations) => {
							mutations.forEach((mutation) => {
								mutation.addedNodes.forEach((node) => {
									if (node.nodeType === 1) { // 元素节点
										// 查找所有可能的弹出窗口
										const popups = node.querySelectorAll ?
											node.querySelectorAll('.popupmenu_popup, .popupmenu, .tip, .tooltip, [id*="menu"], [class*="popup"], [class*="dropdown"]') :
											[];

										// 如果节点本身就是弹出窗口
										if (node.classList && (
											node.classList.contains('popupmenu_popup') ||
											node.classList.contains('popupmenu') ||
											node.classList.contains('tip') ||
											node.classList.contains('tooltip') ||
											node.id.includes('menu') ||
											node.className.includes('popup') ||
											node.className.includes('dropdown')
										)) {
											popups.push(node);
										}

										// 修正弹出窗口的定位
										popups.forEach((popup) => {
											if (popup.style.position === 'absolute') {
												// 获取当前位置
												const rect = popup.getBoundingClientRect();

												// 计算相对于视口的位置
												popup.style.position = 'fixed';
												popup.style.left = rect.left + 'px';
												popup.style.top = rect.top + 'px';
												popup.style.zIndex = '9999';
											}
										});
									}
								});
							});
						});

						observer.observe(iframeDoc.body, {
							childList: true,
							subtree: true
						});
					};

					// 页面加载完成后启动修复
					if (iframeDoc.readyState === 'complete') {
						fixPopupPositioning();
					} else {
						iframeDoc.addEventListener('DOMContentLoaded', fixPopupPositioning);
					}
				}
			} catch (e) {
				// 如果跨域，无法访问iframe内容，这是正常的
			}
		};
	}

	/**
	 * 创建"快速发帖"按钮，用于快速本板块发帖
	 * @return {HTMLElement} 按钮元素
	 */
	function createFastPostButton() {
		return createButton(
			"fastPostButtonInternalId", // 内部使用的ID，不作为HTML id
			"快速发帖",
			function () {
				let fid = getFidFromElement();
				showPostModal(fid);
			},
			undefined, // className
			undefined, // style
			{ id: "fastPostButton" } // attributes - 这将设置HTML id
		);
	}

	/**
	 * 创建时间排序按钮
	 * @param {Object} settings - 用户的设置
	 * @param {Element} buttonContainer - 按钮容器元素
	 */
	function createTimeSortButton(settings, buttonContainer) {
		const currentURL = window.location.href;
		const queryParams = getQueryParams(currentURL);
		const fid = queryParams.fid;
		const isFidInOrder = settings.orderFids.includes(fid);

		const setText = (isOrder) => {
			return isOrder ? "时间排序" : "默认排序";
		};

		const initialButtonText = setText(isFidInOrder);

		const timeSortButton = createButton(
			"timeSortButton",
			initialButtonText,
			function () {
				// 决策理由：当用户通过脚本按钮排序时，清除可能存在的网页排序参数
				if (isFidInOrder) {
					timeSortButton.innerText = setText(false);
					// 切换到默认排序，清除所有排序参数
					const newURL = `${baseURL}/forum.php?mod=forumdisplay&fid=${fid}`;
					window.location.href = newURL;
					settings.orderFids = settings.orderFids.filter(
						(existingFid) => existingFid !== fid
					);
				} else {
					timeSortButton.innerText = setText(true);
					// 切换到时间排序，使用脚本的排序参数
					const newURL = `${baseURL}/forum.php?mod=forumdisplay&fid=${fid}&filter=author&orderby=dateline`;
					window.location.href = newURL;
					settings.orderFids.push(fid);
				}
				GM_setValue("orderFids", JSON.stringify(settings.orderFids));
			}
		);

		buttonContainer.appendChild(timeSortButton);
	}

	/**
	 * 检测用户是否通过网页排序功能进行了排序
	 * @param {Object} queryParams - URL查询参数
	 * @param {Object} settings - 用户设置
	 * @returns {boolean} - 如果检测到网页排序则返回true
	 */
	function isWebSorting(queryParams, settings) {
		const fid = queryParams.fid;
		const isFidInOrder = settings.orderFids.includes(fid);

		// 决策理由：检测各种网页排序参数，排除脚本自己的排序逻辑
		const webSortingParams = [
			// 回复/查看排序
			(queryParams.filter === 'reply' && queryParams.orderby === 'replies'),
			// 最后发表排序
			(queryParams.filter === 'lastpost' && queryParams.orderby === 'lastpost'),
			// 热门排序（包含时间参数的热门排序）
			(queryParams.filter === 'hot'),
			// 精华排序
			(queryParams.filter === 'digest'),
			// 发帖时间排序，但当前fid不在脚本的排序列表中（说明是网页排序）
			(queryParams.filter === 'author' && queryParams.orderby === 'dateline' && !isFidInOrder),
			// 其他orderby参数（除了dateline）
			(queryParams.orderby && queryParams.orderby !== 'dateline'),
			// 有其他filter参数（除了author）
			(queryParams.filter && queryParams.filter !== 'author')
		];

		return webSortingParams.some(condition => condition);
	}

	/**
	 * 处理帖子列表页面的初始状态，可能会重定向
	 * @param {Object} settings - 用户的设置
	 */
	function handleInitialPageState(settings) {
		const currentURL = window.location.href;
		const queryParams = getQueryParams(currentURL);
		const fid = queryParams.fid;
		const hasOrderBy = queryParams.orderby === "dateline";

		// 决策理由：检测用户是否通过网页排序功能进行了排序
		if (isWebSorting(queryParams, settings)) {
			// 如果检测到网页排序，不进行脚本的排序干预

			return;
		}

		// 检查当前fid是否存在于orderFids中
		const isFidInOrder = settings.orderFids.includes(fid);

		if (isFidInOrder && !hasOrderBy) {
			// 如果上次是时间排序，但现在URL没有orderby=dateline，则需要重定向
			const newURL = `${baseURL}/forum.php?mod=forumdisplay&fid=${fid}&filter=author&orderby=dateline`;
			window.location.href = newURL;
		} else if (!isFidInOrder && hasOrderBy) {
			// 如果上次是默认排序，但现在URL有orderby=dateline，则需要重定向
			const newURL = `${baseURL}/forum.php?mod=forumdisplay&fid=${fid}`;
			window.location.href = newURL;
		}
	}

	// 决策理由：创建图片预览任务队列，避免阻塞thread-card渲染
	const imagePreviewQueue = new Map(); // 存储待处理的图片预览任务
	let isProcessingImages = false;

	// 决策理由：添加DOM查询缓存，避免重复查询
	const domCache = new Map();
	const CACHE_EXPIRY = 5000; // 5秒缓存过期时间

	// 决策理由：添加脚本状态管理，避免重复处理和冲突
	const scriptState = {
		initialized: false,
		redesignCompleted: false,
		observersActive: false,
		lastProcessTime: 0
	};

	function getCachedElements(selector) {
		const now = Date.now();
		const cached = domCache.get(selector);

		if (cached && (now - cached.timestamp) < CACHE_EXPIRY) {
			return cached.elements;
		}

		const elements = document.querySelectorAll(selector);
		domCache.set(selector, {
			elements: elements,
			timestamp: now
		});

		return elements;
	}

	/**
	 * 在新的卡片布局中显示图片预览（优化版本）
	 * @param {object} settings - 设置对象
	 */
	function displayThreadImagesInRedesignedLayout(settings) {
		if (!settings.displayThreadImages) {
			return;
		}

		// 支持普通卡片和个人主页卡片，只处理未标记的卡片
		const threadCards = getCachedElements('.thread-card:not([data-image-queued]):not([data-image-processed]), .author-thread-card:not([data-image-queued]):not([data-image-processed])');

		if (threadCards.length === 0) {
			return;
		}

		// 决策理由：将图片预览任务加入队列，不阻塞卡片渲染
		threadCards.forEach(card => {
			// 跳过被屏蔽的帖子
			if (card.style.display === 'none' || card.innerHTML.includes('已屏蔽主题')) {
				return;
			}

			// 跳过置顶贴
			if (isStickyThread(card)) {
				return;
			}

			// 获取链接元素
			const linkElements = card.querySelectorAll('.thread-title a');
			const linkElement = linkElements[linkElements.length - 1];
			if (!linkElement) {
				return;
			}

			// 检查是否已经添加了图片预览
			if (card.querySelector('.thread-image-preview')) {
				return;
			}

			// 标记为已加入队列
			card.dataset.imageQueued = 'true';

			let threadURL = linkElement.href;

			// 处理重定向链接
			if (threadURL.includes('mod=redirect')) {
				const tidMatch = threadURL.match(/tid=(\d+)/);
				if (tidMatch) {
					const tid = tidMatch[1];
					threadURL = `${window.location.origin}/forum.php?mod=viewthread&tid=${tid}`;
				}
			}

			// 验证URL
			if (!threadURL || (!threadURL.includes('thread-') && !threadURL.includes('tid='))) {
				return;
			}

			// 加入处理队列
			imagePreviewQueue.set(card, { url: threadURL, settings });
		});

		// 决策理由：使用requestIdleCallback进行后台处理，不阻塞主线程
		if (!isProcessingImages && imagePreviewQueue.size > 0) {
			processImageQueue();
		}
	}

	/**
	 * 处理图片预览队列（后台异步处理）
	 */
	async function processImageQueue() {
		if (isProcessingImages) return;
		isProcessingImages = true;

		const processNextBatch = async () => {
			const batchSize = 4; // 每批处理4个，平衡性能和资源占用
			const batch = [];

			for (const [card, data] of imagePreviewQueue) {
				if (batch.length >= batchSize) break;
				batch.push([card, data]);
				imagePreviewQueue.delete(card);
			}

			if (batch.length === 0) {
				isProcessingImages = false;
				return;
			}

			// 并行处理批次中的任务
			await Promise.allSettled(batch.map(([card, data]) => processCardImages(card, data)));

			// 继续处理下一批
			if (imagePreviewQueue.size > 0) {
				// 决策理由：使用requestIdleCallback确保不阻塞用户交互
				if (window.requestIdleCallback) {
					requestIdleCallback(() => processNextBatch(), { timeout: 1000 });
				} else {
					setTimeout(processNextBatch, 16); // 约60fps的间隔
				}
			} else {
				isProcessingImages = false;
			}
		};

		await processNextBatch();
	}

	/**
	 * 处理单个卡片的图片预览
	 */
	async function processCardImages(card, { url, settings }) {
		try {
			// 检查卡片是否仍在DOM中
			if (!document.contains(card)) {
				return;
			}

			const response = await fetch(url, {
				signal: AbortSignal.timeout(8000) // 8秒超时
			});

			if (!response.ok) {
				return;
			}

			const pageContent = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(pageContent, "text/html");
			let imgElements = doc.querySelectorAll("img.zoom");

			// 过滤图片，使用用户设置的数量
			const imageCount = Math.max(1, Math.min(20, settings.previewImageCount || 4));
			imgElements = Array.from(imgElements)
				.filter((img) => {
					let fileValue = img.getAttribute("file");
					return (
						fileValue &&
						!fileValue.includes("static") &&
						!fileValue.includes("hrline")
					);
				})
				.slice(0, imageCount);

			if (imgElements.length === 0) {
				return;
			}

			// 再次检查卡片是否仍在DOM中且未被处理
			if (!document.contains(card) || card.querySelector('.thread-image-preview')) {
				return;
			}

			// 创建图片预览容器
			const imgContainer = document.createElement("div");
			imgContainer.className = "thread-image-preview";

			let validImageCount = 0;

			imgElements.forEach((imgEl) => {
				let imgSrc = imgEl.getAttribute("file");
				if (!imgSrc) return;

				let img = document.createElement("img");
				img.src = imgSrc;

				// 添加图片加载错误处理
				img.onerror = function () {
					this.style.display = 'none';
				};

				// 添加预览功能
				addImageHoverPreview(img);

				// 添加点击放大功能
				if (!settings.clickImagePreview) {
					img.addEventListener('click', function () {
						window.open(this.src, '_blank');
					});
				}

				imgContainer.appendChild(img);
				validImageCount++;
			});

			if (validImageCount > 0) {
				// 将图片容器添加到卡片内容区域
				const threadContent = card.querySelector('.thread-content');
				if (threadContent) {
					threadContent.appendChild(imgContainer);
				} else {
					card.appendChild(imgContainer);
				}

				// 设置动态图片尺寸
				requestAnimationFrame(() => {
					setDynamicImageSize(imgContainer, validImageCount);
				});
			}

			// 标记卡片已处理图片预览，避免重复处理
			card.setAttribute('data-image-processed', 'true');
		} catch (error) {
			// 静默处理错误，避免影响其他卡片
		}
	}

	/**
	 * 插入帖子内的前三张图片到帖子标题下方
	 * 注意：此函数已被重构，原始布局的图片预览逻辑已移除
	 * 现在只支持新的卡片布局
	 */
	function displayThreadImages(settings) {
		if (!settings.displayThreadImages) {
			return;
		}

		// 检测是否使用了新的布局
		if (isRedesignedLayout()) {
			displayThreadImagesInRedesignedLayout(settings);
			return;
		}
	}

	/**
	 * 处理帖子列表页面，设置页面状态、样式、内容屏蔽、时间排序和无限滚动
	 * @param {Object} settings - 用户的设置
	 * @param {Element} buttonContainer - 按钮容器元素
	 */
	function handleForumDisplayPage(settings, buttonContainer) {
		handleInitialPageState(settings);
		removeAD2();
		blockingResolvedAction(settings);
		removeFastPost();
		createTimeSortButton(settings, buttonContainer);
		blockContentByTitle(settings);

		// 图片预览功能已移至baseFunction的重试机制中，确保在新布局完全生成后执行
		const currentURL = window.location.href;
		const queryParams = getQueryParams(currentURL);
		const fid = queryParams.fid;
		if (fid == 143 || fid == "143") {
			const blockingResolvedText =
				settings.blockingResolved == true ? "显示解决" : "屏蔽解决";
			const blockingResolvedButton = createButton(
				"blockingResolvedBtn",
				blockingResolvedText,
				function () {
					if (blockingResolvedButton.innerText === "显示解决") {
						blockingResolvedButton.innerText = "屏蔽解决";
						GM_setValue("blockingResolved", false);
						location.reload();
					} else {
						blockingResolvedButton.innerText = "显示解决";
						GM_setValue("blockingResolved", true);
						location.reload();
					}
				}
			);

			buttonContainer.appendChild(blockingResolvedButton);
		}

		const userid = getUserId();
		if (userid && settings.showFastPost) {
			buttonContainer.appendChild(createFastPostButton());
		}
		initInfiniteScroll("isForumDisplayPage");
	}

	/**
	 * 移除帖子列表页广告
	 */
	async function removeAD2() {
		document.querySelectorAll(".show-text2").forEach((element) => {
			element.remove();
		});
	}

	/**
	 * 移除列表底部的快速发帖
	 */
	function removeFastPost() {
		document.querySelectorAll("#f_pst").forEach((element) => {
			element.remove();
		});
	}

	/**
	 * 在新布局中移除已解决的帖子
	 * @param {object} settings - 设置对象
	 */
	function blockingResolvedActionInRedesignedLayout(settings) {
		if (!settings.blockingResolved) {
			return;
		}

		const threadCards = document.querySelectorAll('.thread-card');
		threadCards.forEach((card) => {
			const titleElement = card.querySelector('.thread-title a');
			if (titleElement && titleElement.textContent.includes("[已解决]")) {
				card.remove();
			}
		});
	}

	/**
	 * 移除帖子列表页已解决的帖子
	 * 注意：原始布局的"已解决"帖子屏蔽逻辑已移除，现在只支持新的卡片布局
	 */
	async function blockingResolvedAction(settings) {
		if (!settings.blockingResolved) {
			return;
		}

		// 检测是否使用了新的布局
		if (isRedesignedLayout()) {
			blockingResolvedActionInRedesignedLayout(settings);
			return;
		}


	}

	// #endregion

	// #region 搜索页执行的方法

	/**
	 * 处理搜索页面，包括增加高级搜索、添加页码、基于设置过滤元素和初始化无限滚动
	 * @param {Object} settings - 用户的设置
	 */
	function handleSearchPage(settings) {
		replaceImageSrc();
		addAdvancedSearch(settings);
		addPageNumbers();
		filterElementsBasedOnSettings(settings);
		initInfiniteScroll("isSearchPage");
		displayAdvanThreadImages(settings);
	}

	/**
	 * 替换搜索页面的logo。
	 */
	function replaceImageSrc() {
		// 等待页面完全加载
		window.addEventListener("load", function () {
			// 查找所有包含旧图片路径的img元素
			document
				.querySelectorAll(
					'img[src="static/image/common/logo_sc_s.png"]'
				)
				.forEach(function (img) {
					// 替换为新的图片路径
					img.src = "static/image/common/logo.png";
				});
		});
	}

	/**
	 * 插入帖子内的前三张图片到帖子标题下方（搜索页面专用）
	 */
	async function displayAdvanThreadImages(settings) {
		if (!settings.displayThreadImages) {
			return;
		}
		const h3Elements = document.querySelectorAll("h3.xs3");

		for (let h3Element of h3Elements) {
			const aElement = h3Element.querySelector("a");
			if (aElement) {
				let url = aElement.href;
				try {
					let response = await fetch(url);
					let pageContent = await response.text();
					let parser = new DOMParser();
					let doc = parser.parseFromString(pageContent, "text/html");
					let imgElements = doc.querySelectorAll("img.zoom");

					// 过滤图片，使用用户设置的数量，限制在1-20之间
					const imageCount = Math.max(1, Math.min(20, settings.previewImageCount || 4));
					imgElements = Array.from(imgElements)
						.filter((img) => {
							let fileValue = img.getAttribute("file");
							return (
								fileValue &&
								!fileValue.includes("static") &&
								!fileValue.includes("hrline")
							);
						})
						.slice(0, imageCount);

					if (!imgElements.length) continue;
					const closestLi = h3Element.closest("li");
					if (closestLi.querySelector("tbody, #imagePreviewTbody")) {
						continue;
					}

					// 创建新的图片容器
					const newTbody = document.createElement("tbody");
					newTbody.id = "imagePreviewTbody"; // Assigning the unique ID to the tbody
					const newTr = document.createElement("tr");
					const newTd = document.createElement("td");
					const imgContainer = document.createElement("div");
					imgContainer.className = "thread-image-preview"; // 使用统一的CSS类

					let validImageCount = 0;
					imgElements.forEach((imgEl) => {
						let imgSrc = imgEl.getAttribute("file");
						if (!imgSrc) {
							return;
						}

						let img = document.createElement("img");
						img.src = imgSrc;

						// 添加图片加载错误处理
						img.onerror = function () {
							this.style.display = 'none';
						};

						// 添加预览功能（根据设置决定是hover还是click）
						addImageHoverPreview(img);

						// 如果不是点击预览模式，则添加原来的点击放大功能
						const settings = getSettings();
						if (!settings.clickImagePreview) {
							img.addEventListener('click', function () {
								window.open(this.src, '_blank');
							});
						}

						imgContainer.appendChild(img);
						validImageCount++;
					});

					newTd.appendChild(imgContainer);
					newTr.appendChild(newTd);
					newTbody.appendChild(newTr);

					// h3Element.closest("li").after(newTbody);
					if (closestLi) {
						closestLi.appendChild(newTbody);
					}

					// 在容器添加到DOM后，应用动态图片尺寸
					if (validImageCount > 0) {
						requestAnimationFrame(() => {
							setDynamicImageSize(imgContainer, validImageCount);
						});
					}
				} catch (e) {
					// 静默处理错误
				}
			}
		}
	}

	// #endregion

	// #region 帖子内容页执行方法

	/**
	 * 创建"复制内容"按钮，用于快速复制本帖内容
	 * @return {HTMLElement} 按钮元素
	 */
	function createFastCopyButton() {
		return createButton("fastCopyButton", "复制帖子", function () {
			var content = document.querySelector(".t_f");
			var secondContent = document.querySelectorAll(".t_f")[1];
			var resultHtml = "";
			if (content) {
				resultHtml += processContent(content);
			}
			if (secondContent && secondContent.querySelectorAll("img").length > 3) {
				resultHtml += processContent(secondContent);
			}
			if (resultHtml !== "") {
				copyToClipboard(resultHtml);
				copyToClipboard(
					resultHtml,
					() => showTooltip("内容已复制!"),
					(err) => showTooltip("复制失败: ", err)
				);
			} else {
				showTooltip("复制失败: 没有找到相应内容");
			}
		});
	}

	/**
	 * 处理指定的内容
	 * @param {string} content html文本
	 * @return {cleanedHtml} 处理好的内容
	 */

	function processContent(content) {
		var html = content.innerHTML;
		var cleanedHtml = removeElementsByClass(
			html,
			["pstatus", "tip_4"],
			[
				"font",
				"div",
				"ignore_js_op",
				"br",
				"ol",
				"li",
				"strong",
				"a",
				"i",
				"table",
				"tbody",
				"tr",
				"td",
				"blockquote",
			],
			["em"]
		);
		cleanedHtml = removeNbspAndNewlines(cleanedHtml);
		cleanedHtml = removeElementsByIdPrefix(cleanedHtml, "attach_");

		return cleanedHtml;
	}

	/**
	 * 移除不需要的内容
	 * @param {string} htmlString html文本
	 * @return {stringWithoutNbsp} 链接
	 */

	function removeNbspAndNewlines(htmlString) {
		var stringWithoutNbsp = htmlString.replace(/&nbsp;/g, "");
		stringWithoutNbsp = stringWithoutNbsp.replace(/&amp;/g, "");
		stringWithoutNbsp = stringWithoutNbsp.replace(/\n+/g, "\n");
		stringWithoutNbsp = stringWithoutNbsp.replace(/\\baoguo/g, "\n");
		return stringWithoutNbsp;
	}

	/**
	 * 处理指定的内容
	 * @param {string} htmlString html文本
	 * @param {string} classList class列表
	 * @param {string} tagsToRemove tags
	 * @param {string} tagsToAllRemove tags
	 * @return {doc.body.innerHTML} 处理好的内容
	 */

	function removeElementsByClass(
		htmlString,
		classList,
		tagsToRemove,
		tagsToAllRemove
	) {
		var parser = new DOMParser();
		var doc = parser.parseFromString(htmlString, "text/html");
		classList.forEach(function (className) {
			var elements = doc.querySelectorAll("." + className);
			elements.forEach(function (element) {
				element.parentNode.removeChild(element);
			});
		});
		tagsToRemove.forEach(function (tagName) {
			var elements = doc.querySelectorAll(tagName);
			elements.forEach(function (element) {
				while (element.firstChild) {
					element.parentNode.insertBefore(element.firstChild, element);
				}
				element.parentNode.removeChild(element);
			});
		});
		tagsToAllRemove.forEach(function (tagName) {
			var elements = doc.querySelectorAll(tagName);

			elements.forEach(function (element) {
				element.parentNode.removeChild(element);
			});
		});
		var imgElements = doc.querySelectorAll("img");
		imgElements.forEach(function (img) {
			var fileAttr = img.getAttribute("file");
			if (fileAttr) {
				var fileText =
					(fileAttr.includes("static/image") ? "" : fileAttr) + "\\baoguo";
				var textNode = document.createTextNode(fileText);
				img.parentNode.replaceChild(textNode, img);
			} else {
				var srcAttr = img.getAttribute("src");
				if (srcAttr) {
					var srcText =
						(srcAttr.includes("static/image") ? "" : srcAttr) + "\\baoguo";
					var textNode1 = document.createTextNode(srcText);
					img.parentNode.replaceChild(textNode1, img);
				}
			}
		});
		return doc.body.innerHTML;
	}

	/**
	 * 移除包含指定的内容的元素
	 * @param {string} htmlString html文本
	 * @param {string} idPrefix 指定内容
	 * @return {doc.body.innerHTML} 处理好的内容
	 */
	function removeElementsByIdPrefix(html, idPrefix) {
		// 使用 DOMParser 解析 HTML 字符串
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");

		// 选择所有 id 属性包含特定前缀的元素
		const elements = doc.querySelectorAll(`[id^="${idPrefix}"]`);

		// 移除这些元素
		elements.forEach((element) => {
			element.remove();
		});

		// 将处理后的 DOM 转回为 HTML 字符串
		return doc.body.innerHTML;
	}

	/**
	 * 创建"快速回复"按钮，用于快速回复本帖内容
	 * @return {HTMLElement} 按钮元素
	 */
	function createFastReplyButton() {
		return createButton("fastReplyButton", "快速回复", function () {
			let fid = getFidFromElement();
			const tid = extractTid(window.location.href);
			showWindow(
				"reply",
				`forum.php?mod=post&action=reply&fid=${fid}&tid=${tid}`
			);
		});
	}

	/**
	 * 创建"查看评分"按钮，用于快速查看本帖评分
	 * @return {HTMLElement} 按钮元素
	 */
	function createViewRatingsButton(pid) {
		return createButton("viewRatingsButton", "查看评分", function () {
			const tid = extractTid(window.location.href);
			showWindow(
				"viewratings",
				`forum.php?mod=misc&action=viewratings&tid=${tid}&pid=${pid}`
			);
		});
	}

	/**
	 * 创建"下载附件"按钮，用于快速下载附件
	 * @return {HTMLElement} 按钮元素
	 */
	function createDownButton() {
		return createButton("downButton", "下载附件", function () {
			// 检查是否已存在模态框
			if (document.getElementById("customModal")) {
				return;
			}

			// 查找所有附件相关元素
			const spans = document.querySelectorAll('span[id*="attach_"]');
			const lockedDivs = Array.from(
				document.querySelectorAll("div.locked")
			).filter((div) => div.textContent.includes("购买"));

			// 同时查找 .tattl 和 .pattl 元素，确保兼容性
			const tattlDls = Array.from(document.querySelectorAll("dl.tattl")).filter(
				(dl) => dl.querySelector("p.attnm")
			);
			const pattlDls = Array.from(document.querySelectorAll("dl.pattl")).filter(
				(dl) => dl.querySelector("p.attnm")
			);

			// 合并所有dl类型的附件元素
			const dls = [...tattlDls, ...pattlDls];



			// 收集所有附件元素
			const attachmentElements = [];

			// 处理dl.tattl类型的附件 - 这些是已经符合所需格式的附件
			if (dls.length > 0) {
				dls.forEach((dl) => {
					// 克隆元素以避免修改原始DOM
					const clonedDl = dl.cloneNode(true);
					const links = clonedDl.querySelectorAll('a');
					links.forEach(link => {
						if (link.href && link.href.includes('mod=attachment') && !link.href.includes('action=attachpay')) {
							// For purchased download links, remove onclick to prevent issues.
							link.removeAttribute('onclick');
						}
					});
					attachmentElements.push(clonedDl);
				});
			}

			// 处理span类型的附件 - 需要转换为dl.tattl格式
			spans.forEach((span) => {
				// 查找附件图标
				let originalIconSrc = "";
				const prevElement = span.previousElementSibling;
				if (prevElement && prevElement.tagName.toLowerCase() === "img") {
					originalIconSrc = prevElement.src || prevElement.getAttribute("src") || "";
				}

				// 查找附件链接
				const linkElement = span.querySelector("a");
				if (linkElement) {
					// 检查文件扩展名是否为支持的附件类型
					const fileName = linkElement.textContent.trim();
					if (!isSupportedAttachment(fileName)) {
						return; // 跳过不支持的文件类型
					}

					// 创建与示例结构匹配的dl元素
					const dl = document.createElement("dl");
					dl.className = "tattl";

					// 创建dt元素（包含图标）
					const dt = document.createElement("dt");
					const img = document.createElement("img");
					// 使用新的图标获取函数，优先使用美化脚本的图标映射
					img.src = getAttachmentIcon(linkElement.href, originalIconSrc, fileName);
					img.setAttribute("border", "0");
					img.className = "vm";
					img.alt = "";
					dt.appendChild(img);

					// 创建dd元素（包含附件信息）
					const dd = document.createElement("dd");

					// 创建附件名称段落
					const pName = document.createElement("p");
					pName.className = "attnm";
					const clonedLink = linkElement.cloneNode(true);
					if (clonedLink.href && clonedLink.href.includes('mod=attachment') && !clonedLink.href.includes('action=attachpay')) {
						clonedLink.removeAttribute('onclick');
					}
					pName.appendChild(clonedLink);
					dd.appendChild(pName);

					// 创建附件信息段落（如大小、下载次数等）
					const spanText = span.textContent.trim();
					if (spanText) {
						const pInfo = document.createElement("p");
						pInfo.textContent = spanText
							.replace(linkElement.textContent, "")
							.trim();
						dd.appendChild(pInfo);
					}

					// 组合所有元素
					dl.appendChild(dt);
					dl.appendChild(dd);
					attachmentElements.push(dl);
				}
			});

			// 处理locked类型的附件
			lockedDivs.forEach((div) => {
				// 创建与示例结构匹配的dl元素
				const dl = document.createElement("dl");
				dl.className = "tattl";

				// 创建dt元素（包含图标）
				const dt = document.createElement("dt");
				const img = document.createElement("img");
				// 使用图标获取函数，应用美化脚本的图标映射
				img.src = getAttachmentIcon(null, "/static/image/common/locked.gif", null);
				img.setAttribute("border", "0");
				img.className = "vm";
				img.alt = "";
				dt.appendChild(img);

				// 创建dd元素（包含附件信息）
				const dd = document.createElement("dd");
				dd.innerHTML = div.innerHTML;

				// 组合所有元素
				dl.appendChild(dt);
				dl.appendChild(dd);
				attachmentElements.push(dl);
			});

			// 决策理由：如果仍然没有找到附件，尝试更广泛的搜索
			if (attachmentElements.length === 0) {
				// 最后尝试：查找所有可能的附件相关元素
				const allPossibleAttachments = document.querySelectorAll(
					'a[href*="attachment"], a[href*="attach"], ' +
					'span[id*="attach"], div[id*="attach"], ' +
					'*[class*="attach"], *[class*="tattl"], *[class*="pattl"], ' +
					'p.attnm, .attnm'
				);

				if (allPossibleAttachments.length > 0) {
					// 为每个可能的附件创建标准格式
					allPossibleAttachments.forEach((element, index) => {
						// 检查是否已经被包含在dl容器中
						const parentDl = element.closest('dl.tattl, dl.pattl');
						if (parentDl) {

							return;
						}

						const dl = document.createElement("dl");
						dl.className = "tattl";

						const dt = document.createElement("dt");
						const img = document.createElement("img");
						img.src = "/static/image/common/attach.gif";
						img.setAttribute("border", "0");
						img.className = "vm";
						img.alt = "";
						dt.appendChild(img);

						const dd = document.createElement("dd");
						const pName = document.createElement("p");
						pName.className = "attnm";

						// 如果是链接，直接使用；否则查找内部链接
						if (element.tagName.toLowerCase() === 'a' && element.href.includes('attachment')) {
							// 检查文件扩展名是否为支持的附件类型
							const fileName = element.textContent.trim();
							if (!isSupportedAttachment(fileName)) {
								return; // 跳过不支持的文件类型
							}

							const clonedLink = element.cloneNode(true);
							if (clonedLink.href && clonedLink.href.includes('mod=attachment') && !clonedLink.href.includes('action=attachpay')) {
								clonedLink.removeAttribute('onclick');
							}
							pName.appendChild(clonedLink);

						} else {
							const linkInside = element.querySelector('a[href*="attachment"]');
							if (linkInside) {
								// 检查文件扩展名是否为支持的附件类型
								const fileName = linkInside.textContent.trim();
								if (!isSupportedAttachment(fileName)) {
									return; // 跳过不支持的文件类型
								}

								const clonedLink = linkInside.cloneNode(true);
								if (clonedLink.href && clonedLink.href.includes('mod=attachment') && !clonedLink.href.includes('action=attachpay')) {
									clonedLink.removeAttribute('onclick');
								}
								pName.appendChild(clonedLink);

							} else {
								// 如果没有附件链接，跳过这个元素

								return;
							}
						}

						dd.appendChild(pName);

						// 尝试获取附件大小信息
						const sizeInfo = element.textContent.match(/\d+\.?\d*\s*(KB|MB|GB)/i);
						if (sizeInfo) {
							const pInfo = document.createElement("p");
							pInfo.textContent = sizeInfo[0];
							dd.appendChild(pInfo);
						}

						dl.appendChild(dt);
						dl.appendChild(dd);
						attachmentElements.push(dl);
					});


				}
			}

			if (attachmentElements.length === 0) {
				showTooltip("没有找到任何附件。请检查页面是否包含附件内容。");
				return;
			}

			// 解码逻辑已前移到 extractMainPostContent

			// 创建模态框，严格按照指定的HTML结构
			const modal = document.createElement("div");
			modal.id = "customModal";

			// 创建内容容器
			const contentDiv = document.createElement("div");

			// 按照请求的格式添加附件元素
			attachmentElements.forEach((element, index) => {
				contentDiv.appendChild(element);

				// 在每个附件后添加<br>，除了最后一个附件
				if (index < attachmentElements.length - 1) {
					contentDiv.appendChild(document.createElement("br"));
				}
			});

			// 创建关闭按钮
			const closeBtn = document.createElement("button");
			closeBtn.id = "closeModal";
			closeBtn.textContent = "关闭";

			// 按照指定的结构组装模态框
			modal.appendChild(contentDiv);
			modal.appendChild(closeBtn);

			document.body.appendChild(modal);

			// 添加拖动功能到 modal
			enableDrag(modal);
			// 添加自动下载观察器

			// 添加关闭按钮事件
			document.getElementById("closeModal").addEventListener("click", () => {
				modal.remove();
			});
		});
	}

	/**
	 * 创建"复制代码"按钮，用于复制页面内所有代码块的内容
	 * @return {HTMLElement} 按钮元素
	 */
	function createCopyCodeButton() {
		return createButton("copyCodeButton", "复制代码", function () {
			let allBlockCodes = document.querySelectorAll(".blockcode");
			let allTexts = [];
			allBlockCodes.forEach((blockCode) => {
				let liElements = blockCode.querySelectorAll("li");
				liElements.forEach((li) => {
					allTexts.push(li.textContent);
				});
			});
			let combinedText = allTexts.join("\n");
			copyToClipboard(
				combinedText,
				() => showTooltip("代码已复制!"),
				(err) => showTooltip("复制失败: ", err)
			);
		});
	}

	/**
	 * 创建"快速评分"按钮，用于页面内对主帖的内容快速评分
	 * @return {HTMLElement} 按钮元素
	 */
	function createQuickGradeButton(pid) {
		return createButton("quickGradeButton", "快速评分", () => grade(pid));
	}

	/**
	 * 创建"快速收藏"按钮，用于页面内对回复的内容快速收藏
	 * @return {HTMLElement} 按钮元素
	 */
	function createQuickStarButton() {
		return createButton("quickStarButton", "快速收藏", star);
	}

	/**
	 * 创建"一键二连"按钮，用于页面内对回复的内容快速评分和收藏
	 * @return {HTMLElement} 按钮元素
	 */
	function createOneClickDoubleButton() {
		return createButton("oneClickDoubleButton", "一键二连", gradeAndStar);
	}

	/**
	 * 创建"快速置顶"按钮，用于页面内对回复的内容快速置顶
	 * @return {HTMLElement} 按钮元素
	 */
	function createQuickTopicadminToPostButton(post, stickreply) {
		var text = stickreply === "1" ? "快速置顶" : "取消置顶";
		return createButton(
			"quickTopicadminToPost",
			text,
			() => {
				let pid = getTableIdFromElement(post);
				if (pid) {
					topicadmin(pid, stickreply);
				} else {
					showTooltip("未找到置顶元素");
				}
			},
			"bgsh-quickTopicadminToPostBtn"
		);
	}
	/**
	 * 创建"快速编辑回复"按钮，用于页面内对回复的内容快速编辑
	 * @return {HTMLElement} 按钮元素
	 */
	function createQuickReplyEditToPostButton(post) {
		var text = "编辑回复";
		return createButton(
			"quickReplyEditToPost",
			text,
			() => {
				let pid = getTableIdFromElement(post);
				if (pid) {
					let fid = getFidFromElement();
					const tid = extractTid(window.location.href);
					window.location.href = `forum.php?mod=post&action=edit&fid=${fid}&tid=${tid}&pid=${pid}`;
				} else {
					showTooltip("未找到回复元素");
				}
			},
			"bgsh-quickReplyEditToPostBtn"
		);
	}

	/**
	 * 创建"快速回复"按钮，用于页面内对回复的内容快速置顶
	 * @return {HTMLElement} 按钮元素
	 */
	function createQuickReplyToPostButton(post) {
		var text = "快速回复";
		return createButton(
			"quickReplyToPost",
			text,
			() => {
				let pid = getTableIdFromElement(post);
				if (pid) {
					const fid = getQueryParams(window.location.href).fid || getFidFromElement();
					const tid = extractTid(window.location.href);
					showWindow(
						"reply",
						`forum.php?mod=post&action=reply&fid=${fid}&tid=${tid}&repquote=${pid}`
					);
				} else {
					showTooltip("未找到回复元素");
				}
			},
			"bgsh-quickReplyToPostBtn"
		);
	}



	/**
	 * 创建"广告举报"按钮，用于页面内对回复的内容广告举报
	 * @return {HTMLElement} 按钮元素
	 */
	function createQuickReportadToPostButton(post) {
		var text = "广告举报";
		return createButton(
			"quickReportadToPost",
			text,
			() => {
				let pid = getTableIdFromElement(post);
				if (pid) {
					const tid = extractTid(window.location.href);
					showWindow(
						"reportad",
						`plugin.php?id=pc_reportad&tid=${tid}&pid=${pid}`
					);
				} else {
					showTooltip("未找到举报元素");
				}
			},
			"bgsh-quickReportadToPostBtn"
		);
	}

	/**
	 * 创建"快速举报"按钮，用于页面内对回复的内容快速举报
	 * @return {HTMLElement} 按钮元素
	 */
	function createQuickMiscReportToPostButton(post) {
		var text = "快速举报";
		return createButton(
			"quickMiscReport",
			text,
			() => {
				let pid = getTableIdFromElement(post);
				if (pid) {
					let fid = getFidFromElement();
					const tid = extractTid(window.location.href);
					showWindow(
						`miscreport${pid}`,
						`misc.php?mod=report&rtype=post&rid=${pid}&tid=${tid}&fid=${fid}`
					);
				} else {
					showTooltip("未找到回复元素");
				}
			},
			"bgsh-QuickMiscReportBtn"
		);
	}

	/**
	 * 添加对回复进行操作的按钮，用于页面内对回复的内容快速置顶/回复等等
	 * @return {HTMLElement} 按钮元素
	 */
	function addQuickActionToPostButton() {
		const postContainers = document.querySelectorAll(".po.hin");

		postContainers.forEach((postContainer) => {
			// 检查该元素之后是否已经有一个quickTopicadminToPost
			const existingButton = postContainer.parentNode.querySelector(
				"#quickTopicadminToPost"
			);
			if (existingButton) {
				// 如果已存在按钮，则直接返回
				return;
			}

			// 寻找 element 的父级 tbody
			let parentTbody = postContainer.closest("tbody");
			var stickreply =
				parentTbody &&
					parentTbody.querySelector('img[src="static/image/common/settop.png"]')
					? "0"
					: "1";
			const quickTopicadminToPostButton = createQuickTopicadminToPostButton(
				postContainer,
				stickreply
			);
			const replyToPostButton = createQuickReplyToPostButton(postContainer);
			const quickMiscReportToPostButton =
				createQuickMiscReportToPostButton(postContainer);
			const quickReportadToPostButton =
				createQuickReportadToPostButton(postContainer);
			const setAnswerToPostButton = createSetAnswerToPostButton(postContainer);

			postContainer.appendChild(replyToPostButton);
			postContainer.appendChild(quickTopicadminToPostButton);
			postContainer.appendChild(quickMiscReportToPostButton);
			postContainer.appendChild(quickReportadToPostButton);
			const found = postContainer.querySelector(`.editp`);
			// 如果找到了具有指定类的元素，弹出窗口
			if (found) {
				const quickReplyEditToPostButton =
					createQuickReplyEditToPostButton(postContainer);
				postContainer.appendChild(quickReplyEditToPostButton);
			}
			if (postContainer && postContainer.innerHTML.includes("setanswer(")) {
				postContainer.appendChild(setAnswerToPostButton);
			}
		});
	}

	/**
	 * 用于页面内对头像的屏蔽与显示
	 * @return {HTMLElement} 按钮元素
	 */
	function showAvatarEvent() {
		const avatars = document.querySelectorAll(".avatar");
		const isPostPage = () =>
			/forum\.php\?mod=viewthread|\/thread-\d+-\d+-\d+\.html/.test(
				window.location.href
			);
		if (!isPostPage()) {
			return;
		}
		var settings = getSettings();
		// 遍历所有头像元素
		avatars.forEach((avatar) => {
			// 如果复选框被选中，应用默认头像样式；否则，隐藏头像
			if (settings.showAvatar) {
				avatar.style.display = "block"; // 确保元素可见
				avatar.classList.add("use-default-avatar");
				// 可选：如果之前有其他明确的隐藏类，在这里移除
				// avatar.classList.remove("some-other-hide-class");
			} else {
				avatar.style.removeProperty('display'); // 恢复默认显示状态
				avatar.classList.remove("use-default-avatar");
			}

			// 为头像添加屏蔽按钮 (avatar 是 .avatar div)
			const imgElement = avatar.querySelector('img');
			if (imgElement) {
				addBlockUserButtonToAvatar(imgElement);
			}
		});
	}

	// Function to create the toggle button for "displayThreadImages" setting
	function createToggleDisplayThreadImagesButton() {
		let displayThreadImagesEnabled = GM_getValue("displayThreadImages", false); // Default to false as per getSettings

		const button = createButton(
			"toggleDisplayThreadImagesButton", // New ID for clarity
			displayThreadImagesEnabled ? "关闭预览" : "开启预览",
			() => {
				displayThreadImagesEnabled = !displayThreadImagesEnabled;
				GM_setValue("displayThreadImages", displayThreadImagesEnabled);
				button.textContent = displayThreadImagesEnabled ? "关闭预览" : "开启预览";

				// 清理无限滚动状态
				if (window.infiniteScrollCleanup) {
					window.infiniteScrollCleanup();
				}

				// Reload the page to apply the change based on 'displayThreadImages'
				setTimeout(() => { // Timeout to allow tooltip to show before reload
					window.location.reload();
				}, 100); // seconds delay
			},
			"bgsh-customBtn", // Standard button class
			{ style: "background-color: rgb(3, 150, 255);" } // Consistent styling
		);
		return button;
	}

	/**
	 * 在帖子内容页中添加和执行各种功能
	 * @param {Object} settings - 用户的设置
	 * @param {HTMLElement} buttonContainer - 按钮容器
	 */
	function handlePostPage(settings, buttonContainer) {
		// Removed call to applyImagePreviewState as it's being refactored

		const toggleImages = (action) => {
			const images = document.querySelectorAll("img.zoom");
			images.forEach(
				(img) => (img.style.display = action === "hide" ? "none" : "")
			);
		};

		toggleImages(settings.showImageButton);

		// 只有当showToggleImageButton为true时才添加隐藏/显示图片按钮
		if (settings.showToggleImageButton) {
			const initialButtonText =
				settings.showImageButton === "show" ? "隐藏图片" : "显示图片";

			const toggleButton = createButton(
				"toggleImageDisplay",
				initialButtonText,
				function () {
					if (toggleButton.innerText === "显示图片") {
						toggleImages("show");
						toggleButton.innerText = "隐藏图片";
						GM_setValue("showImageButton", "show");
					} else {
						toggleImages("hide");
						toggleButton.innerText = "显示图片";
						GM_setValue("showImageButton", "hide");
					}
				}
			);
			buttonContainer.appendChild(toggleButton);
		}

		if (settings.showDown) {
			buttonContainer.appendChild(createDownButton());
		}

		let codeBlocks = document.querySelectorAll(".blockcode");
		if (codeBlocks.length > 0 && settings.showCopyCode) {
			buttonContainer.appendChild(createCopyCodeButton());
		}
		let firstPobClElement = document.querySelector(".po.hin");
		let pid = getTableIdFromElement(firstPobClElement);

		const userid = getUserId();
		if (userid) {
			if (settings.showFastPost) {
				buttonContainer.appendChild(createFastPostButton());
			}
			if (settings.showFastReply) {
				buttonContainer.appendChild(createFastReplyButton());
			}
			if (settings.showQuickGrade) {
				buttonContainer.appendChild(createQuickGradeButton(pid));
			}
			if (settings.showQuickStar) {
				buttonContainer.appendChild(createQuickStarButton());
			}
			if (settings.showClickDouble) {
				buttonContainer.appendChild(createOneClickDoubleButton());
			}

			// addQuickGradeToPostButton();//已失效和谐
			addQuickActionToPostButton();
		}
		if (settings.showViewRatings) {
			buttonContainer.appendChild(createViewRatingsButton(pid));
		}
		if (settings.showFastCopy) {
			buttonContainer.appendChild(createFastCopyButton());
		}

		// 决策理由：添加划词搜索功能的事件监听器
		if (settings.defaultSwipeToSearch) {
			document.addEventListener("mouseup", selectSearch);
		}

		initInfiniteScroll("isPostPage");
		showAvatarEvent();
		removeAD3();
		replacePMonPost();
		removeFastReply();
	}

	/**
	 * 移除帖子内容页广告
	 */
	async function removeAD3() {
		document.querySelectorAll('[class*="show-text"]').forEach((element) => {
			element.remove();
		});
		document.querySelectorAll('[id*="mgc_post"]').forEach((element) => {
			element.remove();
		});
		document.querySelectorAll("#p_btn").forEach((element) => {
			element.remove();
		});
		document.querySelectorAll(".pob.cl").forEach((element) => {
			element.remove();
		});
	}

	/**
	 * 移除帖子底部的快速回帖
	 */
	function removeFastReply() {
		document.querySelectorAll("#f_pst").forEach((element) => {
			element.remove();
		});
	}
	/**
	 * 替换帖子内容页私信
	 */
	async function replacePMonPost() {
		// 保留原有私信功能，不做任何修改
		return;
	}

	// #endregion

	// #region iframe模态框功能

	/**
	 * 在iframe中添加右侧快捷按钮
	 * @param {Document} iframeDoc - iframe的document对象
	 * @param {Window} iframeWindow - iframe的window对象
	 */
	function addIframeQuickButtons(iframeDoc, iframeWindow) {
		// 在iframe模态框中不显示任何右侧按钮，提供更简洁的发帖体验
		return;
	}



	// #endregion

	// #region 网站全局功能

	/**
	 * 综合区快速发帖
	 */
	function PostContent() {
		if (!window.location.href.includes("forum.php?mod=post&action=newthread")) {
			return;
		}
		const link = document.createElement("a");
		link.href =
			"/forum.php?mod=redirect&goto=findpost&ptid=1708826&pid=16039784";
		link.textContent = "发帖须知";
		link.target = "_blank";
		const organizeButton = document.createElement("li");
		organizeButton.className = "a";
		organizeButton.innerHTML =
			'<button id="organizeBtn" type="button">整理</button>';

		const shareButton = document.createElement("li");
		shareButton.className = "a";
		shareButton.innerHTML = '<button id="shareBtn" type="button">自转</button>';
		const ulElement = document.querySelector(".tb.cl.mbw");
		if (ulElement) {
			ulElement.appendChild(link);
			ulElement.appendChild(organizeButton);
			ulElement.appendChild(shareButton);
		} else {
			return;
		}
		var ttttype = "";
		const modalContent = `
  <div id="organizeModal">
    <!-- 关闭按钮 -->
<button class="close-btn">
  <span class="close-btn-line"></span>
  <span class="close-btn-line"></span>
</button>

    <div>
      <strong>【资源名称】：</strong>
      <input type="text" id="resourceName"/>
    </div>
    <div>
      <strong>【资源类型】：</strong>
      <label><input type="radio" name="resourceType" value="影片" checked />影片</label>
      <label><input type="radio" name="resourceType" value="视频" />视频</label>
      <label><input type="radio" name="resourceType" value="动漫" />动漫</label>
      <label><input type="radio" name="resourceType" value="套图" />套图</label>
      <label><input type="radio" name="resourceType" value="游戏" />游戏</label>
    </div>
    <div>
      <strong>【是否有码】：</strong>
      <label><input type="radio" name="censorship" value="有码" checked />有码</label>
      <label><input type="radio" name="censorship" value="无码" />无码</label>
    </div>
    <div>
      <strong>【是否水印】：</strong>
      <label><input type="radio" name="watermark" value="有水印" />有水印</label>
      <label><input type="radio" name="watermark" value="无水印" checked />无水印</label>
    </div>
    <div>
      <strong>【字幕选项】：</strong>
      <label><input type="radio" name="subtitle" value="中文字幕" />中文字幕</label>
      <label><input type="radio" name="subtitle" value="日文字幕" />日文字幕</label>
      <label><input type="radio" name="subtitle" value="英文字幕" />英文字幕</label>
      <label><input type="radio" name="subtitle" value="无字幕" checked />无字幕</label>
    </div>
    <div>
      <strong>【资源大小】：</strong>
      <input type="text" id="resourceSize" placeholder="""/>
      <label><input type="radio" name="sizeUnit" value="M" />M</label>
      <label><input type="radio" name="sizeUnit" value="G" checked />G</label>
      <label><input type="radio" name="sizeUnit" value="T" />T</label>
    </div>
    <div>
      <strong>【下载类型】：</strong>
      <label><input type="radio" name="downType" value="115ED2K" checked />115ED2K</label>
      <label><input type="radio" name="downType" value="BT/磁链" />BT/磁链</label>
      <label><input type="radio" name="downType" value="ED2K" />ED2K</label>
      <label><input type="radio" name="downType" value="夸克网盘" />夸克网盘</label>
      <label><input type="radio" name="downType" value="百度网盘" />百度网盘</label>
      <label><input type="radio" name="downType" value="PikPak网盘" />PikPak网盘</label>
      <label><input type="radio" name="downType" value="其它网盘" />其它网盘</label>
    </div>
    【视频数量】：<input type="text" id="videoCount" placeholder="""/><br>
    【图片数量】：<input type="text" id="imageCount" placeholder="""/><br>
    【配额数量】：<input type="text" id="quota" placeholder="""/>
    <div><strong>【资源预览】：</strong></div>
    <div><strong>【资源链接】：</strong><input type="text" id="resourceLink""/></div>
    <button id="insetBtn" type="button">插入</button>
  </div>`;
		document.body.insertAdjacentHTML("beforeend", modalContent);

		// 为organizeModal添加拖动功能
		const organizeModalElement = document.getElementById("organizeModal");
		if (organizeModalElement) {
			// 修改样式以使拖动生效
			organizeModalElement.style.position = "fixed";
			organizeModalElement.style.cursor = "move";
			enableDrag(organizeModalElement);
		}

		document
			.getElementById("organizeBtn")
			.addEventListener("click", function () {
				showModal("整理");
			});
		document.getElementById("shareBtn").addEventListener("click", function () {
			showModal("自转");
		});
		function showModal(param) {
			ttttype = param;
			const modal = document.getElementById("organizeModal");
			// 显示模态框
			modal.style.display = "block";
			// 重置位置，避免之前的拖动影响
			if (!modal.dataset.hasBeenDragged) {
				modal.style.left = "50%";
				modal.style.top = "50%";
				modal.style.transform = "translate(-50%, -50%)";
			} else {
				// 如果已经被拖动过，保持当前位置
				modal.style.transform = "none";
			}
		}

		// 为关闭按钮添加点击事件
		document
			.querySelector("#organizeModal .close-btn")
			.addEventListener("click", function () {
				document.getElementById("organizeModal").style.display = "none";
			});

		document.getElementById("insetBtn").addEventListener("click", function () {
			const resourceName = document.getElementById("resourceName").value;
			const resourceType = document.querySelector(
				'input[name="resourceType"]:checked'
			)?.value;
			const censorship = document.querySelector(
				'input[name="censorship"]:checked'
			)?.value;
			const watermark = document.querySelector(
				'input[name="watermark"]:checked'
			)?.value;
			const subtitle = document.querySelector(
				'input[name="subtitle"]:checked'
			)?.value;
			const resourceLink = document.getElementById("resourceLink").value;
			const downType = document.querySelector(
				'input[name="downType"]:checked'
			)?.value;
			const resourceSize = document.getElementById("resourceSize").value;
			const sizeUnit = document.querySelector(
				'input[name="sizeUnit"]:checked'
			).value;
			const videoCount = document.getElementById("videoCount").value;
			const imageCount = document.getElementById("imageCount").value;
			const quota = document.getElementById("quota").value;
			let resourceSizeStr = resourceSize ? `${resourceSize}${sizeUnit}` : "";
			let videoCountStr = videoCount ? `${videoCount}V` : "";
			let imageCountStr = imageCount ? `${imageCount}P` : "";
			let quotaStr = quota ? `${quota}配额` : "";
			const content = `
              【资源名称】：${resourceName}<br>
              【资源类型】：${resourceType}<br>
              【是否有码】：${censorship} @ ${watermark} @ ${subtitle}<br>
              【资源大小】：${resourceSizeStr}/${videoCountStr}/${imageCountStr}/${quotaStr}<br>
              【资源预览】：<br>
              【资源链接】：<div class="blockcode"><blockquote>${resourceLink}</blockquote></div><br>
          `;
			const iframe = document.querySelector(".area iframe");
			if (iframe && iframe.contentDocument) {
				const body = iframe.contentDocument.body;
				if (body && body.isContentEditable) {
					body.innerHTML = content;
				}
			}
			const title = `【${ttttype}】【${downType}】${resourceName}【${resourceSizeStr}/${videoCountStr}/${imageCountStr}/${quotaStr}】
          `;
			const subjectInput = document.getElementById("subject");
			if (subjectInput) {
				subjectInput.value = title;
			}
			var selectElement = document.getElementById("typeid");
			if (selectElement) {
				selectElement.setAttribute("selecti", "8");
			}
			var aElement = document.querySelector(".ftid a#typeid_ctrl");
			if (aElement) {
				aElement.textContent = "情色分享";
				aElement.setAttribute("initialized", "true");
			}
			document.getElementById("organizeModal").style.display = "none";
		});
	}

	/**
	 * 监听新布局的变化并应用屏蔽功能
	 * @param {Object} settings - 用户的设置
	 */
	function observeRedesignedLayout(settings) {
		// 如果不是新布局，直接返回
		if (!isRedesignedLayout()) {
			return;
		}

		// 决策理由：统一防抖延迟时间，与美化脚本协调
		let debounceTimer = null;
		const debounceDelay = 10; // 与美化脚本保持一致，减少同步延迟

		// 创建一个观察器来监听新卡片的添加
		const observer = new MutationObserver((mutations) => {
			let hasNewCards = false;
			let hasNewContent = false;

			mutations.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							// 检查是否添加了新的卡片
							if (node.classList && node.classList.contains('thread-card')) {
								hasNewCards = true;
							} else if (node.querySelector && node.querySelector('.thread-card')) {
								hasNewCards = true;
							}
							// 检查是否有其他新内容
							hasNewContent = true;
						}
					});
				}
			});

			// 如果有新卡片或新内容，应用屏蔽功能
			if (hasNewCards || hasNewContent) {
				// 决策理由：添加处理频率限制，避免过度处理
				const now = Date.now();
				if (now - scriptState.lastProcessTime < 50) {
					return; // 50ms内不重复处理
				}

				// 清除之前的定时器
				if (debounceTimer) {
					clearTimeout(debounceTimer);
				}

				// 设置新的定时器
				debounceTimer = setTimeout(() => {
					scriptState.lastProcessTime = Date.now();
					// 重新执行所有屏蔽功能，确保新内容被处理
					blockContentInRedesignedLayout(settings);
					blockContentByTitleInRedesignedLayout(settings);
					blockingResolvedActionInRedesignedLayout(settings);

					// 决策理由：图片预览处理移到后台，不阻塞卡片显示
					if (settings.displayThreadImages) {
						// 使用requestIdleCallback延迟处理图片预览
						if (window.requestIdleCallback) {
							requestIdleCallback(() => {
								displayThreadImagesInRedesignedLayout(settings);
							}, { timeout: 2000 });
						} else {
							setTimeout(() => {
								displayThreadImagesInRedesignedLayout(settings);
							}, 100);
						}
					}

					// 为新添加的卡片中的头像添加屏蔽按钮
					const newCards = document.querySelectorAll('.thread-card:not([data-block-button-checked])'); // 确保只处理未检查的
					newCards.forEach(card => {
						const avatarImg = card.querySelector('.thread-avatar img');
						if (avatarImg && !avatarImg.dataset.blockButtonAdded) { // 再次检查是否已添加
							addBlockUserButtonToAvatar(avatarImg);
						}

						// 为帖子卡片添加预览按钮（立即执行，不使用requestAnimationFrame）
						if (!card.dataset.previewButtonAdded) {
							addTitlePreviewButton(card);
						}

						card.setAttribute('data-block-button-checked', 'true'); // 标记已检查过添加按钮的逻辑
					});

					debounceTimer = null;
				}, debounceDelay);
			}
		});

		// 开始观察新布局容器
		const redesignedList = document.querySelector('.redesigned-thread-list');
		if (redesignedList) {
			observer.observe(redesignedList, {
				childList: true,
				subtree: true
			});
		}

		// 决策理由：避免与美化脚本的观察器冲突，使用更精确的观察范围
		let documentObserver = null;
		const redesignedListForDoc = document.querySelector('.redesigned-thread-list');

		// 如果存在新布局容器，优先观察该容器而不是整个文档
		if (redesignedListForDoc) {
			// 已经在上面创建了针对redesigned-thread-list的观察器，这里不再重复
		} else {
			// 只有在没有新布局容器时才观察整个文档
			documentObserver = new MutationObserver((mutations) => {
				let needsRecheck = false;

				mutations.forEach((mutation) => {
					if (mutation.type === 'childList') {
						mutation.addedNodes.forEach((node) => {
							if (node.nodeType === Node.ELEMENT_NODE) {
								// 检查是否添加了包含thread-card的内容
								if (node.querySelector && node.querySelector('.thread-card')) {
									needsRecheck = true;
								}
							}
						});
					}
				});

				if (needsRecheck) {
					// 清除之前的定时器
					if (debounceTimer) {
						clearTimeout(debounceTimer);
					}

					// 设置新的定时器
					debounceTimer = setTimeout(() => {
						blockContentByTitleInRedesignedLayout(settings);
						debounceTimer = null;
					}, debounceDelay);
				}
			});

			// 观察整个文档
			documentObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
		}

		// 定期检查功能，确保不遗漏任何内容
		setInterval(() => {
			const uncheckedCards = document.querySelectorAll('.thread-card:not([data-keyword-checked])');
			if (uncheckedCards.length > 0) {
				blockContentByTitleInRedesignedLayout(settings);
			}
		}, 3000); // 每3秒检查一次

		// 强制重新检查所有卡片（忽略标记）
		setInterval(() => {
			forceRecheckAllCards(settings);
		}, 10000); // 每10秒强制检查一次
	}

	/**
	 * 强制重新检查所有卡片，忽略已检查标记
	 * @param {Object} settings - 用户设置
	 */
	function forceRecheckAllCards(settings) {
		const { excludePostOptions, displayBlockedTips } = settings;

		if (!excludePostOptions || excludePostOptions.length === 0) {
			return;
		}

		const allCards = document.querySelectorAll('.thread-card');

		allCards.forEach((card) => {
			// 跳过已经被屏蔽的卡片
			if (card.style.display === 'none' || card.innerHTML.includes('已屏蔽主题关键词')) {
				return;
			}

			const titleElement = card.querySelector('.thread-title a');
			if (titleElement) {
				// 尝试多种方式获取完整标题
				let title = titleElement.textContent.trim();

				// 如果标题太短，尝试获取innerHTML并清理HTML标签
				if (title.length < 10) {
					const innerHTML = titleElement.innerHTML;
					title = innerHTML.replace(/<[^>]*>/g, '').trim();
				}

				// 如果还是太短，尝试从父元素获取
				if (title.length < 10) {
					const parentTitle = card.querySelector('.thread-title');
					if (parentTitle) {
						title = parentTitle.textContent.trim();
					}
				}

				// 详细检查每个关键字
				let matchedKeyword = null;
				for (let i = 0; i < excludePostOptions.length; i++) {
					const keyword = excludePostOptions[i];
					if (title.includes(keyword)) {
						matchedKeyword = keyword;
						break;
					}
				}

				if (matchedKeyword) {
					if (displayBlockedTips) {
						card.innerHTML = `
							<div class="thread-content" style="padding: 20px; text-align: center; color: #666;">
								<div class="thread-title">
									<b>已屏蔽主题关键词: ${matchedKeyword}</b>
								</div>
								<div style="margin-top: 8px; font-size: 12px; color: #999;">
									原标题包含屏蔽关键词（强制检查发现）
								</div>
							</div>
						`;
						card.style.background = 'rgba(200, 200, 200, 0.3)';
					} else {
						forceHideCard(card);
					}

					// 标记为已检查
					card.setAttribute('data-keyword-checked', 'true');
				}
			}
		});
	}

	/**
	 * 全站通用的入口方法。为整个站点执行基本操作和应用用户设置。
	 *
	 * 1. 修改用户勋章显示
	 * 2. 添加自定义样式
	 * 3. 根据当前页面的URL，选择并执行相应的页面处理逻辑
	 * 4. 如果用户登录，尝试执行自动签到操作
	 * 5. 将按钮容器附加到页面主体
	 *
	 * @param {Object} settings - 用户的设置
	 */
	function baseFunction(settings) {
		// 决策理由：防止重复初始化
		if (scriptState.initialized) {
			return;
		}
		scriptState.initialized = true;

		removeAD();
		if (settings.blockingIndex) {
			removeIndex();
		}
		manipulateMedals(settings); // 修改用户勋章显示
		addStyles(); // 添加自定义样式

		// 应用列表字体样式设置
		if (typeof applyListFontStyle === "function") {
			applyListFontStyle(settings.listFontSize, settings.listFontWeight);
		}

		const buttonContainer = createButtonContainer(settings);
		delegatePageHandlers(settings, buttonContainer); // 根据URL选择页面处理逻辑

		// 添加"开启预览"按钮（在签到按钮之前）
		addToggleImagePreviewButton(buttonContainer);

		// 添加导航按钮到导航栏
		addNavigationButton();

		// 添加DOM变化监听器，以防导航栏是动态加载的
		const navigationObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === 1 && (
							node.id === 'nv' ||
							node.querySelector?.('#nv') ||
							(node.tagName === 'UL' && node.closest('#nv'))
						)) {
							// 导航栏被添加到DOM中，尝试添加导航按钮
							setTimeout(() => {
								addNavigationButton();
							}, 100);
						}
					});
				}
			});
		});

		// 开始观察DOM变化
		navigationObserver.observe(document.body, {
			childList: true,
			subtree: true
		});

		// 立即为现有的帖子卡片添加预览按钮（不等待其他事件）
		document.querySelectorAll('.thread-card').forEach(card => {
			addTitlePreviewButton(card);
		});

		handleUserSign(buttonContainer); // 执行用户签到逻辑

		// 决策理由：优化脚本间同步，减少闪烁和重复加载
		let redesignProcessed = false;

		// 监听discuz_redesign.js的完成事件
		document.addEventListener('discuzRedesignComplete', function (event) {
			// 防止重复处理
			if (redesignProcessed) return;
			redesignProcessed = true;

			// 标记重构已完成
			scriptState.redesignCompleted = true;

			// 决策理由：等待美化脚本的DOM操作完全稳定后再处理
			setTimeout(() => {
				const redesignedList = document.querySelector('.redesigned-thread-list');
				if (redesignedList) {
					// 确保样式已应用
					const checkAndExecute = () => {
						const computedStyle = getComputedStyle(redesignedList);
						if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
							executeRedesignFeatures();
						} else {
							// 样式未完全应用，短暂延迟后重试
							setTimeout(checkAndExecute, 16);
						}
					};

					checkAndExecute();
				}
			}, 50); // 等待美化脚本的50ms延迟 + 额外50ms缓冲
		});

		// 决策理由：将重构后的功能执行逻辑提取为独立函数，避免重复代码
		function executeRedesignFeatures() {
			if (settings.displayThreadImages) {
				displayThreadImages(settings);
			}

			// 在新布局完成后，尝试为所有相关头像添加按钮
			document.querySelectorAll('.thread-avatar img, .avatar img').forEach(img => {
				addBlockUserButtonToAvatar(img);
			});

			// 为新出现的帖子卡片添加预览按钮（避免重复添加）
			document.querySelectorAll('.thread-card:not([data-preview-button-added])').forEach(card => {
				addTitlePreviewButton(card);
			});

			// 确保帖子详情页的头像也处理
			if (typeof showAvatarEvent === "function") {
				showAvatarEvent(); //内部已有addBlockUserButtonToAvatar调用
			}
		}

		// 等待一段时间后再执行屏蔽和观察器，确保discuz_redesign.js已经执行完毕
		// 使用多次检查确保新布局完全加载
		const executeBlockingWithRetry = (retryCount = 0, maxRetries = 10) => {
			// 检查是否是论坛列表页面（包括导读页面）
			const isForumDisplayPage = /forum\.php\?mod=(forumdisplay|guide)|\/forum-\d+-\d+\.html/.test(window.location.href);

			if (isForumDisplayPage) {
				const redesignedContainer = document.querySelector('.redesigned-thread-list');
				const threadCards = document.querySelectorAll('.thread-card');

				// 如果存在新布局且有卡片，或者重试次数已达上限，则执行屏蔽
				if ((redesignedContainer && threadCards.length > 0) || retryCount >= maxRetries) {
					blockContentByUsers(settings); //屏蔽用户
					blockContentByTitle(settings); //屏蔽关键字
					observeRedesignedLayout(settings);

					// 快速执行图片预览功能
					setTimeout(() => {
						displayThreadImages(settings);
						// 再次尝试为列表页头像添加按钮
						document.querySelectorAll('.thread-card .thread-avatar img').forEach(img => {
							addBlockUserButtonToAvatar(img);
						});

						// 为列表页帖子卡片添加预览按钮（避免重复添加）
						document.querySelectorAll('.thread-card:not([data-preview-button-added])').forEach(card => {
							addTitlePreviewButton(card);
						});
					}, 50); // 大幅减少延迟时间
				} else if (retryCount < maxRetries) {
					// 如果新布局还没准备好，继续重试
					setTimeout(() => executeBlockingWithRetry(retryCount + 1, maxRetries), 300 * (retryCount + 1)); // 逐渐增加重试间隔
				}
			} else {
				// 非论坛列表页面，直接执行
				blockContentByUsers(settings); //屏蔽用户
				blockContentByTitle(settings); //屏蔽关键字

				// 检查是否为帖子内页，如果是则执行帖子内页的屏蔽逻辑
				const isPostPage = /forum\.php\?mod=viewthread|\/thread-\d+-\d+-\d+\.html/.test(window.location.href);
				if (isPostPage) {
					blockContentInPostPageThrottled(settings);
				}

				observeRedesignedLayout(settings);

				// 非论坛列表页面也执行图片预览（如果适用）
				displayThreadImages(settings);

				// 为非论坛列表页面的帖子卡片添加预览按钮（立即执行）
				document.querySelectorAll('.thread-card:not([data-preview-button-added])').forEach(card => {
					addTitlePreviewButton(card);
				});

				// 确保帖子详情页的头像也处理
				if (typeof showAvatarEvent === "function") {
					showAvatarEvent(); // 内部已有 addBlockUserButtonToAvatar
				}
			}
		};

		setTimeout(() => executeBlockingWithRetry(), 700); // 增加初始延迟

		createBaoguoButton(buttonContainer);
		document.body.appendChild(buttonContainer); // 将按钮容器附加到页面主体
		PostContent();

		// 添加头像悬停弹窗屏蔽按钮样式
		addPopupBlockButtonStyles();

		// 初始化头像悬停弹窗屏蔽按钮功能
		addBlockButtonToAvatarPopup();
	}

	/**
	 * 检查当前页面的URL是否匹配SpacePage的模式。
	 * @returns {boolean} 如果匹配则返回true，否则返回false。
	 */
	function delegatePageHandlers(settings, buttonContainer) {
		const isPostPage = () =>
			/forum\.php\?mod=viewthread|\/thread-\d+-\d+-\d+\.html/.test(
				window.location.href
			);
		const isSearchPage = () =>
			/search\.php\?mod=forum/.test(window.location.href);
		const isForumDisplayPage = () =>
			/forum\.php\?mod=(forumdisplay|guide)|\/forum-\d+-\d+\.html/.test(
				window.location.href
			);
		const isSpacePage = () => {
			const url = window.location.href;
			const patterns = [
				/home\.php\?mod=space&uid=\d+&do=thread&view=me&from=space(.*type=reply)?/,
				/home\.php\?mod=space.*do=thread/,
				/space-uid-\d+-do-thread/
			];

			const matches = patterns.map(pattern => pattern.test(url));
			return matches.some(m => m);
		};



		if (isPostPage()) {
			handlePostPage(settings, buttonContainer);
		} else if (isSearchPage()) {
			handleSearchPage(settings);
		} else if (isForumDisplayPage()) {
			handleForumDisplayPage(settings, buttonContainer);
		} else if (isSpacePage()) {
			initInfiniteScroll("isSpacePage");
		}
	}

	/**
	 * 添加"开启预览"按钮
	 * @param {Element} buttonContainer - 按钮容器元素
	 */
	function addToggleImagePreviewButton(buttonContainer) {
		// 检查是否为发帖页面
		const isNewThreadPage = window.location.href.includes("forum.php?mod=post&action=newthread");

		// 只有在非发帖页面才添加"开启预览"按钮
		if (!isNewThreadPage) {
			const toggleImagePreviewBtn = createToggleDisplayThreadImagesButton(); // Use the new function name
			buttonContainer.appendChild(toggleImagePreviewBtn);
		}
	}

	/**
	 * 添加导航按钮到导航栏
	 * @param {number} retryCount - 重试次数，默认为0
	 */
	function addNavigationButton(retryCount = 0) {
		// 检查是否已经添加过导航按钮
		if (document.getElementById('navigationButton')) {
			return; // 已存在，避免重复创建
		}

		// 查找导航栏的ul元素
		const navUl = document.querySelector('#nv ul');
		if (!navUl) {
			// 如果导航栏不存在且重试次数小于3，则延迟重试
			if (retryCount < 3) {
				setTimeout(() => {
					addNavigationButton(retryCount + 1);
				}, 500 * (retryCount + 1));
				return;
			} else {
				return;
			}
		}

		// 创建导航按钮
		const navigationBtn = createNavigationButton();

		// 将按钮插入到mn_Neaf3后面，参考色花堂美化.js的逻辑
		const mnNeaf3 = document.getElementById('mn_Neaf3');
		let insertTarget = null;

		if (mnNeaf3) {
			// 插入到mn_Neaf3后面
			insertTarget = mnNeaf3.nextSibling;
		} else {
			// 如果mn_Neaf3不存在，插入到ul的末尾
			insertTarget = null;
		}

		// 创建li容器元素
		const buttonLi = document.createElement('li');
		buttonLi.className = 'navigation-button-container';
		buttonLi.id = 'mn_navigation_button';
		buttonLi.appendChild(navigationBtn);

		// 插入到导航栏
		if (insertTarget) {
			navUl.insertBefore(buttonLi, insertTarget);
		} else {
			navUl.appendChild(buttonLi);
		}
	}

	/**
	 * 创建设置按钮
	 * @param {Object} settings - 用户的设置
	 * @param {Element} buttonContainer - 按钮容器元素
	 */
	function createBaoguoButton(buttonContainer) {
		var baoguoButton = createButton("baoguoButton", "功能设置", () =>
			createSettingsUI(getSettings())
		);
		buttonContainer.appendChild(baoguoButton);
	}

	/**
	 * 用户签到处理逻辑。检查用户是否已签到并执行相应操作。
	 *
	 * 1. 获取用户ID。如果用户未登录，则不执行任何操作。
	 * 2. 检查用户今天是否已签到。
	 * 3. 根据签到状态，更新签到按钮的文本。
	 * 4. 如果用户今天还未签到，尝试自动签到。
	 * 5. 将签到按钮添加到指定的按钮容器。
	 *
	 * @param {HTMLElement} buttonContainer - 存放按钮的容器元素
	 */
	async function handleUserSign(buttonContainer) {
		const userid = getUserId(); // 获取用户ID
		if (!userid) return; // 如果用户未登录，结束函数

		// 检查今天是否已经签到
		const lastSignDate = GM_getValue(`lastSignDate_${userid}`, null);
		const today = new Date().toLocaleDateString();
		const hasSignedToday = lastSignDate === today;

		// 更新签到按钮文本
		const signButtonText = hasSignedToday ? "已经签到" : "快去签到";
		const signButton = createButton(
			"signButton",
			signButtonText,
			() => (window.location.href = `${baseURL}/plugin.php?id=dd_sign:index`)
		);

		// 尝试自动签到
		if (!hasSignedToday) {
			const signed = await sign(userid);
			signButton.innerText = signed ? "已经签到" : "快去签到";
		}

		// 添加签到按钮到容器
		buttonContainer.appendChild(signButton);
	}

	/**
	 * 移除广告
	 */
	async function removeAD() {
		document.querySelectorAll(".show-text.cl").forEach((element) => {
			element.remove();
		});
		const qmenuelement = document.querySelector("#qmenu");
		if (qmenuelement) {
			qmenuelement.remove();
		}
	}

	/**
	 * 移除首页热门
	 */
	async function removeIndex() {
		const diy_chart = document.querySelector("#diy_chart");
		if (diy_chart) {
			diy_chart.remove();
		}
	}

	// #endregion


	// #region 持久性设置

	/**
	 * 保存用户的设置并执行相应的操作。
	 *
	 * 1. 获取当前保存的设置。
	 * 2. 从页面的UI元素中读取新的设置值。
	 * 3. 对某些设置值进行额外处理。
	 * 4. 创建一个需要保存的设置对象。
	 * 5. 使用GM_setValue存储设置。
	 * 6. 根据新的设置值应用更改。
	 * 7. 如果某些核心设置已更改，重新加载页面。
	 *
	 * @param {Object} settings - 用户的设置对象
	 */
	function saveSettings(settings) {
		const oldSettings = getSettings();

		try {
			// 定义一个辅助函数来安全地获取DOM元素值
			const getElementValue = (id, defaultValue, type = "value") => {
				const element = document.getElementById(id);
				if (!element) {
					return defaultValue;
				}
				return type === "value" ? element.value : element.checked;
			};

			// 使用辅助函数读取所有设置值
			settings.logoText = getElementValue("logoTextInput", settings.logoText);
			settings.showDown = getElementValue(
				"showDownCheckbox",
				settings.showDown,
				"checked"
			);
			settings.showCopyCode = getElementValue(
				"showCopyCodeCheckbox",
				settings.showCopyCode,
				"checked"
			);
			settings.showFastPost = getElementValue(
				"showFastPostCheckbox",
				settings.showFastPost,
				"checked"
			);
			settings.showFastReply = getElementValue(
				"showFastReplyCheckbox",
				settings.showFastReply,
				"checked"
			);
			settings.showQuickGrade = getElementValue(
				"showQuickGradeCheckbox",
				settings.showQuickGrade,
				"checked"
			);
			settings.showQuickStar = getElementValue(
				"showQuickStarCheckbox",
				settings.showQuickStar,
				"checked"
			);
			settings.showClickDouble = getElementValue(
				"showClickDoubleCheckbox",
				settings.showClickDouble,
				"checked"
			);
			settings.showViewRatings = getElementValue(
				"showViewRatingsCheckbox",
				settings.showViewRatings,
				"checked"
			);
			settings.showFastCopy = getElementValue(
				"showFastCopyCheckbox",
				settings.showFastCopy,
				"checked"
			);
			settings.blockingIndex = getElementValue(
				"blockingIndexCheckbox",
				settings.blockingIndex,
				"checked"
			);
			settings.showSignTip = getElementValue(
				"showSignTipCheckbox",
				settings.showSignTip,
				"checked"
			);
			settings.defaultSwipeToSearch = getElementValue(
				"defaultSwipeToSearchCheckbox",
				settings.defaultSwipeToSearch,
				"checked"
			);
			settings.displayBlockedTips = getElementValue(
				"displayBlockedTipsCheckbox",
				settings.displayBlockedTips,
				"checked"
			);
			settings.maxGradeThread = getElementValue(
				"maxGradeThread",
				settings.maxGradeThread
			);
			settings.listFontSize = getElementValue(
				"listFontSizeInput",
				settings.listFontSize
			);
			settings.listFontWeight = getElementValue(
				"listFontWeightInput",
				settings.listFontWeight
			);

			// 处理预览图片数量设置，确保在1-20范围内
			const previewImageCountValue = parseInt(getElementValue(
				"previewImageCountInput",
				settings.previewImageCount
			));
			settings.previewImageCount = Math.max(1, Math.min(20, previewImageCountValue || 4));

			// 处理每行图片数设置，确保为正整数
			const imagesPerRowValue = parseInt(getElementValue(
				"imagesPerRowInput",
				settings.imagesPerRow
			));
			settings.imagesPerRow = Math.max(1, imagesPerRowValue || 4);
			settings.showAvatar = getElementValue(
				"showAvatarCheckbox",
				settings.showAvatar,
				"checked"
			);
			settings.autoHideButtons = getElementValue(
				"autoHideButtonsCheckbox",
				settings.autoHideButtons,
				"checked"
			);
			settings.showToggleImageButton = getElementValue(
				"showToggleImageButtonCheckbox",
				settings.showToggleImageButton,
				"checked"
			);
			settings.clickImagePreview = getElementValue(
				"clickImagePreviewCheckbox",
				settings.clickImagePreview,
				"checked"
			);

			// 处理blockedUsers列表
			const blockedUsersList = document.getElementById("blockedUsersList");
			if (blockedUsersList) {
				settings.blockedUsers = blockedUsersList.value
					.split("\n")
					.map((name) => name.trim())
					.filter((user) => user.trim() !== "");
			}

			// 处理其他需要特殊处理的元素
			const enableTitleStyleCheckbox = document.getElementById(
				"enableTitleStyleCheckbox"
			);
			if (enableTitleStyleCheckbox) {
				settings.enableTitleStyle = enableTitleStyleCheckbox.checked;
			}

			const autoPaginationCheckbox = document.getElementById(
				"autoPaginationCheckbox"
			);
			if (autoPaginationCheckbox) {
				settings.autoPagination = autoPaginationCheckbox.checked;
			}

			const displayThreadImagesCheckbox = document.getElementById(
				"displayThreadImagesCheckbox"
			);
			if (displayThreadImagesCheckbox) {
				settings.displayThreadImages = displayThreadImagesCheckbox.checked;
			}

			// 处理blockMedals单选框
			settings.blockMedals = getCheckedRadioValue("blockMedals");

			// 处理excludeOptions和excludePostOptions文本区域
			const excludeOptionsTextarea = document.getElementById(
				"excludeOptionsTextarea"
			);
			if (excludeOptionsTextarea) {
				settings.excludeOptions = [
					...new Set(
						excludeOptionsTextarea.value
							.split("\n")
							.map((line) => line.trim())
							.filter((line) => line !== "")
					),
				];
			}

			const excludePostOptionsTextarea = document.getElementById(
				"excludePostOptionsTextarea"
			);
			if (excludePostOptionsTextarea) {
				settings.excludePostOptions = [
					...new Set(
						excludePostOptionsTextarea.value
							.split("\n")
							.map((line) => line.trim())
							.filter((line) => line !== "")
					),
				];
			}

			// 过滤excludeGroup
			settings.excludeGroup = settings.excludeGroup.filter((group) =>
				settings.excludeOptions.includes(group)
			);

			// 创建要保存的设置对象
			const settingsToSave = {
				logoText: settings.logoText,
				blockMedals: settings.blockMedals,
				displayBlockedTips: settings.displayBlockedTips,
				blockedUsers: settings.blockedUsers,
				enableTitleStyle: settings.enableTitleStyle,
				excludeOptions: settings.excludeOptions,
				excludeGroup: settings.excludeGroup,
				autoPagination: settings.autoPagination,
				showAvatar: settings.showAvatar,
				autoHideButtons: settings.autoHideButtons,
				excludePostOptions: settings.excludePostOptions,
				displayThreadImages: settings.displayThreadImages,
				maxGradeThread: settings.maxGradeThread,
				listFontSize: settings.listFontSize,
				listFontWeight: settings.listFontWeight,
				previewImageCount: settings.previewImageCount,
				imagesPerRow: settings.imagesPerRow,
				showDown: settings.showDown,
				showCopyCode: settings.showCopyCode,
				showFastPost: settings.showFastPost,
				showFastReply: settings.showFastReply,
				showQuickGrade: settings.showQuickGrade,
				showQuickStar: settings.showQuickStar,
				showClickDouble: settings.showClickDouble,
				showViewRatings: settings.showViewRatings,
				showToggleImageButton: settings.showToggleImageButton,
				showFastCopy: settings.showFastCopy,
				blockingIndex: settings.blockingIndex,
				showSignTip: settings.showSignTip,
				defaultSwipeToSearch: settings.defaultSwipeToSearch,
				clickImagePreview: settings.clickImagePreview,
			};

			// 存储设置
			for (let key in settingsToSave) {
				GM_setValue(key, settingsToSave[key]);
			}

			// 应用更改
			try {
				if (typeof manipulateMedals === "function") {
					manipulateMedals(settings);
				}



				if (typeof showAvatarEvent === "function") {
					showAvatarEvent();
				}

				// 立即应用按钮自动隐藏设置
				updateButtonContainerAutoHide(settings.autoHideButtons);

				// 立即应用列表字体样式设置
				if (typeof applyListFontStyle === "function") {
					applyListFontStyle(settings.listFontSize, settings.listFontWeight);
				}
			} catch (e) {
				// 静默处理错误
			}

			// 检查是否需要重新加载页面
			if (
				oldSettings.blockingIndex !== settings.blockingIndex ||
				oldSettings.showFastCopy !== settings.showFastCopy ||
				oldSettings.showViewRatings !== settings.showViewRatings ||
				oldSettings.showToggleImageButton !== settings.showToggleImageButton ||
				oldSettings.showClickDouble !== settings.showClickDouble ||
				oldSettings.showQuickStar !== settings.showQuickStar ||
				oldSettings.showQuickGrade !== settings.showQuickGrade ||
				oldSettings.showFastReply !== settings.showFastReply ||
				oldSettings.showFastPost !== settings.showFastPost ||
				oldSettings.showCopyCode !== settings.showCopyCode ||
				oldSettings.showDown !== settings.showDown ||
				oldSettings.displayBlockedTips !== settings.displayBlockedTips ||
				oldSettings.displayThreadImages !== settings.displayThreadImages ||
				oldSettings.previewImageCount !== settings.previewImageCount ||
				oldSettings.imagesPerRow !== settings.imagesPerRow ||
				oldSettings.autoPagination !== settings.autoPagination ||
				oldSettings.listFontWeight !== settings.listFontWeight ||
				oldSettings.autoHideButtons !== settings.autoHideButtons ||
				oldSettings.blockMedals !== settings.blockMedals ||
				oldSettings.clickImagePreview !== settings.clickImagePreview ||
				oldSettings.defaultSwipeToSearch !== settings.defaultSwipeToSearch ||
				oldSettings.blockedUsers.toString() !==
				settings.blockedUsers.toString() ||
				oldSettings.excludeOptions.toString() !==
				settings.excludeOptions.toString() ||
				oldSettings.excludePostOptions.toString() !==
				settings.excludePostOptions.toString()
			) {
				location.reload();
			}
		} catch (error) {

		}
	}
	// #endregion

	// #region 高级搜索

	/**
	 * 在页面上添加高级搜索功能。
	 *
	 * 1. 检查页面中是否存在目标元素。
	 * 2. 创建一个高级搜索区域并将其附加到页面。
	 * 3. 根据传入的设置初始化复选框的状态。
	 * 4. 为高级搜索区域的复选框组添加事件监听器。
	 *
	 * @param {Object} settings - 用户的设置对象
	 */
	function addAdvancedSearch(settings) {
		const tlElement = document.querySelector(".tl");
		if (!tlElement) {
			return;
		}

		const advancedSearchDiv = createAdvancedSearchDiv(settings);
		document.body.appendChild(advancedSearchDiv);

		initCheckboxGroupWithSettings(advancedSearchDiv, settings);
		addEventListenerForAdvancedSearch(advancedSearchDiv);
	}

	/**
	 * 创建一个高级搜索区域（div）。
	 * 区域中包含复选框组，允许用户选择不同的搜索选项。
	 *
	 * @param {Object} settings - 用户的设置对象
	 * @param {Array} TIDOptions - 板块选项，默认值为DEFAULT_TID_OPTIONS
	 * @returns {HTMLElement} - 创建的div元素
	 */
	function createAdvancedSearchDiv(settings, TIDOptions = DEFAULT_TID_OPTIONS) {
		const advancedSearchDiv = document.createElement("div");
		const excludeOptions = settings.excludeOptions || [];
		const excludeOptionsFormatted = excludeOptions.map((option) => ({
			label: option,
			value: option,
		}));

		advancedSearchDiv.appendChild(
			createCheckboxGroup("excludeGroup", "排除关键字", excludeOptionsFormatted)
		);
		advancedSearchDiv.appendChild(
			createCheckboxGroup("TIDGroup", "只看板块", TIDOptions)
		);

		// 添加样式类
		advancedSearchDiv.classList.add("advanced-search");

		return advancedSearchDiv;
	}

	/**
	 * 根据传入的设置初始化复选框的状态。
	 *
	 * @param {HTMLElement} div - 包含复选框组的div元素
	 * @param {Object} settings - 用户的设置对象
	 */
	function initCheckboxGroupWithSettings(div, settings) {
		const setCheckboxes = (group, values) => {
			values.forEach((value) => {
				const checkbox = div.querySelector(`#${group} input[value="${value}"]`);
				if (checkbox) checkbox.checked = true;
			});
		};

		setCheckboxes("excludeGroup", settings.excludeGroup);
		setCheckboxes("TIDGroup", settings.TIDGroup);
	}

	/**
	 * 为高级搜索区域的复选框组添加事件监听器。
	 * 当用户更改复选框的状态时，会更新和保存设置。
	 *
	 * @param {HTMLElement} div - 包含复选框组的div元素
	 */
	function addEventListenerForAdvancedSearch(div) {
		div.addEventListener("change", function (e) {
			const handleCheckboxChange = (group) => {
				if (e.target.closest(`#${group}`)) {
					const selectedValues = [
						...document.querySelectorAll(`#${group} input:checked`),
					].map((input) => input.value);
					GM_setValue(group, JSON.stringify(selectedValues));
				}
			};

			handleCheckboxChange("excludeGroup");
			handleCheckboxChange("TIDGroup");
			filterElementsBasedOnSettings(getSettings());
		});
	}

	// #endregion


	// 添加消息监听器处理iframe中的事件
	window.addEventListener('message', (event) => {
		if (event.data && event.data.type === 'openSettings') {
			// 打开设置面板
			const settingsButton = document.querySelector('#baoguoButton');
			if (settingsButton) {
				settingsButton.click();
			}
		}
	});

	// 全局点击事件监听器已被移除，以防止点击空白处关闭弹窗

	// 添加ESC键监听器隐藏标题预览
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && currentTitlePreview) {
			hideTitlePreview();
		}
	});

	/**
	 * 主程序执行函数。
	 *
	 * 1. 获取用户的设置。
	 * 2. 检查是否需要进行更新。
	 * 3. 执行基础功能函数。
	 */
	function main() {
		// 清理可能存在的旧状态
		if (window.infiniteScrollCleanup) {
			window.infiniteScrollCleanup();
		}

		const settings = getSettings();

		baseFunction(settings);
		// bgsh_initializeImagePreviewFeature(); // This line is removed as the function is not defined
		// Removed call to applyImagePreviewState as it's being refactored
	}

	// 启动主程序
	main();

	/**
	 * 启用拖动 - 参考色花堂美化.js的优秀实现
	 * @param {HTMLElement} elmnt - 要拖动的元素
	 */
	function enableDrag(elmnt) {
		// 防止重复绑定
		if (elmnt.dataset.dragEnabled) {
			return;
		}
		elmnt.dataset.dragEnabled = "true";

		let isDragging = false;
		let startX, startY;
		let initialLeft, initialTop;
		let hasBeenDragged = false;

		// 检测当前环境是否在iframe中
		const isInIframe = window.self !== window.top;
		// 获取正确的document和window对象
		const targetDoc = elmnt.ownerDocument || document;
		const targetWindow = targetDoc.defaultView || window;

		// 获取拖拽句柄 - 优先使用header，否则使用整个元素
		const dragHandle = targetDoc.getElementById(elmnt.id + "Header") || elmnt;

		// 添加拖拽光标样式
		dragHandle.style.cursor = 'move';

		// 使用addEventListener而不是onmousedown，避免覆盖其他事件
		dragHandle.addEventListener('mousedown', startDragging, false);

		function startDragging(e) {
			const target = e.target;

			// 检查是否点击在交互元素上 - 扩展检查范围
			const isInteractive = target.tagName.match(/^(INPUT|TEXTAREA|BUTTON|SELECT|OPTION|LABEL|A|SVG|PATH)$/) ||
				target.closest('button, a, input, textarea, select, svg') !== null ||
				target.closest('.tattl') !== null ||
				target.closest('#customModal input') !== null ||
				target.closest('#customModal a') !== null ||
				target.closest('#customModal button') !== null ||
				target.classList.contains("bgsh-checkbox-custom") ||
				target.classList.contains("bgsh-setting-checkbox-custom") ||
				target.classList.contains("bgsh-label-text") ||
				target.closest(".bgsh-setting-checkbox-label") !== null ||
				target.classList.contains('close-btn') ||
				target.closest('.close-btn') !== null;

			if (isInteractive) {
				return;
			}

			isDragging = true;
			startX = e.clientX;
			startY = e.clientY;

			// 获取当前位置
			const rect = elmnt.getBoundingClientRect();

			// 如果是第一次拖动，需要从居中定位转换为绝对定位
			if (!hasBeenDragged) {
				// 设置元素为绝对定位
				elmnt.style.position = 'fixed';
				elmnt.style.left = `${rect.left}px`;
				elmnt.style.top = `${rect.top}px`;
				elmnt.style.transform = 'none';
				elmnt.style.margin = '0';
				elmnt.style.zIndex = '9999';

				hasBeenDragged = true;
			}

			// 重新获取位置（因为可能刚刚改变了定位方式）
			const newRect = elmnt.getBoundingClientRect();
			initialLeft = newRect.left;
			initialTop = newRect.top;

			e.preventDefault();
			e.stopPropagation();

			// 防止文本选择
			targetDoc.body.style.userSelect = 'none';
			targetDoc.body.style.webkitUserSelect = 'none';
			targetDoc.body.style.mozUserSelect = 'none';
			targetDoc.body.style.msUserSelect = 'none';

			// 添加事件监听器
			if (isInIframe) {
				// iframe环境
				targetDoc.addEventListener('mousemove', doDrag, true);
				targetDoc.addEventListener('mouseup', stopDragging, true);

				// 尝试添加父文档监听器
				try {
					window.top.document.addEventListener('mousemove', doDrag, true);
					window.top.document.addEventListener('mouseup', stopDragging, true);
				} catch (e) {
					console.warn('Cross-origin iframe detected');
				}
			} else {
				// 普通环境
				targetDoc.addEventListener('mousemove', doDrag, true);
				targetDoc.addEventListener('mouseup', stopDragging, true);
			}
		}

		function doDrag(e) {
			if (!isDragging) return;

			e.preventDefault();
			e.stopPropagation();

			const deltaX = e.clientX - startX;
			const deltaY = e.clientY - startY;

			const newLeft = initialLeft + deltaX;
			const newTop = initialTop + deltaY;

			// 防止拖出屏幕边界
			const maxX = targetWindow.innerWidth - elmnt.offsetWidth;
			const maxY = targetWindow.innerHeight - elmnt.offsetHeight;

			const finalLeft = Math.max(0, Math.min(newLeft, maxX));
			const finalTop = Math.max(0, Math.min(newTop, maxY));

			elmnt.style.left = `${finalLeft}px`;
			elmnt.style.top = `${finalTop}px`;
		}

		function stopDragging(e) {
			if (!isDragging) return;

			isDragging = false;

			// 恢复样式
			targetDoc.body.style.userSelect = '';
			targetDoc.body.style.webkitUserSelect = '';
			targetDoc.body.style.mozUserSelect = '';
			targetDoc.body.style.msUserSelect = '';

			// 移除事件监听器
			if (isInIframe) {
				// iframe环境
				targetDoc.removeEventListener('mousemove', doDrag, true);
				targetDoc.removeEventListener('mouseup', stopDragging, true);

				// 尝试移除父文档监听器
				try {
					window.top.document.removeEventListener('mousemove', doDrag, true);
					window.top.document.removeEventListener('mouseup', stopDragging, true);
				} catch (e) {
					// 忽略跨域错误
				}
			} else {
				// 普通环境
				targetDoc.removeEventListener('mousemove', doDrag, true);
				targetDoc.removeEventListener('mouseup', stopDragging, true);
			}

			// 标记已被拖拽
			elmnt.dataset.hasBeenDragged = "true";
		}

	}

	/**
	 * 创建一个多选框组。
	 * @param {string} id - 组件的ID。
	 * @param {string} title - 多选框组的标题。
	 * @param {Array} options - 多选框选项数组，每个选项包含"value"和"label"属性。
	 * @returns {HTMLElement} 返回多选框组的HTML元素。
	 */
	function createCheckboxGroup(id, title, options) {
		const groupDiv = document.createElement("div");
		groupDiv.className = "bgsh-forget";
		groupDiv.id = id;

		let innerHTML = `<strong>${title}</strong><br>`;

		// 添加一个'全选'复选框
		const selectAllId = `bgsh-${id}-select-all`;
		innerHTML += `
      <label class="bgsh-checkbox-label">
          <input type="checkbox" id="${selectAllId}" class="select-all">
          <span class="bgsh-checkbox-custom"></span>
          <span class="bgsh-label-text">全选</span>
      </label>
  `;

		options.forEach((option) => {
			const checkboxId = `bgsh-${id}-${option.value}`;
			innerHTML += `
          <label class="bgsh-checkbox-label">
              <input type="checkbox" id="${checkboxId}" value="${option.value}">
              <span class="bgsh-checkbox-custom"></span>
              <span class="bgsh-label-text">${option.label}</span>
          </label>
  `;
		});

		groupDiv.innerHTML = innerHTML;

		// 添加事件监听
		const selectAllCheckbox = groupDiv.querySelector(".select-all");
		const otherCheckboxes = Array.from(
			groupDiv.querySelectorAll('input[type="checkbox"]')
		).filter((cb) => cb !== selectAllCheckbox);

		function checkIndeterminateStatus() {
			const checkedCheckboxes = otherCheckboxes.filter(
				(cb) => cb.checked
			).length;

			selectAllCheckbox.checked = checkedCheckboxes === otherCheckboxes.length;
			selectAllCheckbox.indeterminate =
				checkedCheckboxes > 0 && checkedCheckboxes < otherCheckboxes.length;
		}

		// 初始化全选框状态
		setTimeout(() => {
			checkIndeterminateStatus();
		}, 500);
		// 为 '全选' 复选框添加事件监听器
		selectAllCheckbox.addEventListener("change", () => {
			otherCheckboxes.forEach((checkbox) => {
				checkbox.checked = selectAllCheckbox.checked;
			});

			// 在全选/取消全选后更新状态
			checkIndeterminateStatus();
		});

		// 为其他复选框添加事件监听器
		otherCheckboxes.forEach((checkbox) => {
			checkbox.addEventListener("change", checkIndeterminateStatus);
		});

		return groupDiv;
	}

	function createSetAnswerToPostButton() {
		// 你可以根据需要实现功能，这里先返回一个占位按钮
		return createButton(
			"setAnswerToPost",
			"设为答案",
			() => {
				showTooltip("设为答案功能a nan j暂未实现");
			},
			"bgsh-setAnswerToPostBtn"
		);
	}

	// #region 导航功能

	/**
	 * 板块与fid映射表 - 从网站主页HTML源码提取
	 */
	const BOARD_FID_MAP = {
		// 原创BT电影
		'国产原创': 2,
		'亚洲无码原创': 36,
    '亚洲有码原创': 37,
		'高清中文字幕': 103,
		'三级写真': 107,
		'VR视频区': 160,
		'素人有码系列': 104,
		'欧美无码': 38,
		'4K原版': 151,
		'韩国主播': 152,
		'动漫原创': 39,

		// 在线视频区
		'国产自拍': 41,
		'中文字幕': 109,
		'日韩无码': 42,
		'日韩有码': 43,
		'欧美风情': 44,
		'卡通动漫': 45,
		'剧情三级': 46,

		// 原档收藏
		'自提字幕区': 145,
		'自译字幕区': 146,
		'字幕分享区': 121,
		'新作区': 159,

		// 色花图片
		'原创自拍区': 155,
		'转贴自拍': 125,
		'华人街拍区': 50,
		'亚洲性爱': 48,
		'欧美性爱': 49,
		'卡通动漫': 117,
		'套图下载': 165,

		// 色花文学
		'原创小说': 154,
		'乱伦人妻': 135,
		'青春校园': 137,
		'武侠虚幻': 138,
		'激情都市': 136,
		'TXT小说下载': 139,

		// 综合讨论区分类
		'综合讨论区': 95,
    'AI专区': 166,
		'网友原创区': 141,
		'转帖交流区': 142,
    '求片问答悬赏区': 143,
		'投诉建议区': 96,
		'禁言申诉区': 150,
		'资源出售区': 97,
		'投稿送邀请码': 157
	};

	/**
	 * 根据fid获取板块名称
	 * @param {number} fid - 板块ID
	 * @return {string|null} 板块名称，未找到返回null
	 */
	function getBoardNameByFid(fid) {
		for (const [boardName, boardFid] of Object.entries(BOARD_FID_MAP)) {
			if (boardFid === parseInt(fid)) {
				return boardName;
			}
		}
		return null;
	}

	/**
	 * 根据板块名称获取fid
	 * @param {string} boardName - 板块名称
	 * @return {number|null} fid，未找到返回null
	 */
	function getFidByBoardName(boardName) {
		return BOARD_FID_MAP[boardName] || null;
	}

	/**
	 * 从当前URL解析fid
	 * @return {number|null} 当前页面的fid，未找到返回null
	 */
	function getCurrentFidFromUrl() {
		const url = window.location.href;
		const fidMatch = url.match(/[?&]fid=(\d+)/);
		return fidMatch ? parseInt(fidMatch[1]) : null;
	}

	/**
	 * 获取当前页面的板块信息
	 * @return {Object|null} 包含fid和boardName的对象，未找到返回null
	 */
	function getCurrentBoardInfo() {
		const fid = getCurrentFidFromUrl();
		if (!fid) return null;

		const boardName = getBoardNameByFid(fid);
		return boardName ? { fid, boardName } : null;
	}

	/**
	 * 创建导航按钮，用于显示自定义板块列表
	 * @return {HTMLElement} 导航按钮元素
	 */
	function createNavigationButton() {
		// 创建导航按钮，使用链接样式以匹配导航栏其他元素
		const button = document.createElement('a');
		button.id = 'navigationButton';
		button.href = 'javascript:void(0)';
		button.textContent = '导航';
		// 悬停显示菜单
		button.addEventListener('mouseenter', function(e) {
			e.preventDefault();
			// 清除可能的隐藏定时器
			if (window.navigationHideTimer) {
				clearTimeout(window.navigationHideTimer);
				window.navigationHideTimer = null;
			}
			showNavigationMenu();
		});

		// 鼠标离开时延迟隐藏菜单（给用户时间移动到菜单上）
		button.addEventListener('mouseleave', function() {
			window.navigationHideTimer = setTimeout(() => {
				const menu = document.querySelector(".bgsh-navigation-menu");
				const isHoveringMenu = menu && menu.matches(':hover');
				const isHoveringButton = button.matches(':hover');

				if (!isHoveringMenu && !isHoveringButton) {
					hideNavigationMenu();
				}
			}, 100);
		});

		return button;
	}

	/**
	 * 切换导航菜单的显示/隐藏状态
	 */
	function toggleNavigationMenu() {
		const existingMenu = document.querySelector(".bgsh-navigation-menu");

		if (existingMenu) {
			hideNavigationMenu();
		} else {
			showNavigationMenu();
		}
	}

	/**
	 * 显示导航菜单
	 */
	async function showNavigationMenu() {
		// 如果菜单已存在，直接返回
		const existingMenu = document.querySelector(".bgsh-navigation-menu");
		if (existingMenu) {
			return;
		}

		try {
			const customBoards = getCustomNavigationBoards();
			const menu = createNavigationMenu(customBoards);

			// 为菜单添加鼠标事件处理
			menu.addEventListener('mouseenter', function() {
				// 鼠标进入菜单时，清除可能的隐藏定时器
				if (window.navigationHideTimer) {
					clearTimeout(window.navigationHideTimer);
					window.navigationHideTimer = null;
				}
			});

			menu.addEventListener('mouseleave', function() {
				// 鼠标离开菜单时，延迟隐藏
				window.navigationHideTimer = setTimeout(() => {
					const button = document.querySelector("#navigationButton");
					const isHoveringButton = button && button.matches(':hover');

					if (!isHoveringButton) {
						hideNavigationMenu();
					}
				}, 100);
			});

			document.body.appendChild(menu);

			// 定位菜单到导航按钮附近
			positionNavigationMenu(menu);

		} catch (error) {
			// 静默处理错误，不显示提示
		}
	}

	/**
	 * 获取用户自定义的导航板块列表
	 * @return {Array} 自定义板块数组
	 */
	function getCustomNavigationBoards() {
		try {
			const stored = GM_getValue('custom_navigation_boards', '[]');
			const boards = JSON.parse(stored);
			return Array.isArray(boards) ? boards : [];
		} catch (error) {
			return [];
		}
	}

	/**
	 * 保存用户自定义的导航板块列表
	 * @param {Array} boards - 板块数组
	 */
	function saveCustomNavigationBoards(boards) {
		try {
			const validBoards = Array.isArray(boards) ? boards : [];
			GM_setValue('custom_navigation_boards', JSON.stringify(validBoards));
		} catch (error) {
			// 静默处理错误
		}
	}

	/**
	 * 添加板块到自定义导航列表
	 * @param {number} fid - 板块ID
	 * @param {string} boardName - 板块名称
	 * @return {boolean} 是否添加成功
	 */
	function addBoardToCustomNavigation(fid, boardName) {
		try {
			const boards = getCustomNavigationBoards();

			// 检查是否已存在
			const exists = boards.some(board => board.fid === fid);
			if (exists) {
				return false;
			}

			// 添加新板块
			const newBoard = {
				fid: fid,
				name: boardName,
				url: `forum.php?mod=forumdisplay&fid=${fid}`,
				addTime: Date.now()
			};

			boards.push(newBoard);
			saveCustomNavigationBoards(boards);

			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * 从自定义导航列表中删除板块
	 * @param {number} fid - 板块ID
	 * @return {boolean} 是否删除成功
	 */
	function removeBoardFromCustomNavigation(fid) {
		try {
			const boards = getCustomNavigationBoards();
			const originalLength = boards.length;

			const filteredBoards = boards.filter(board => board.fid !== fid);

			if (filteredBoards.length < originalLength) {
				saveCustomNavigationBoards(filteredBoards);
				return true;
			} else {
				return false;
			}
		} catch (error) {
			return false;
		}
	}

	/**
	 * 隐藏导航菜单
	 */
	function hideNavigationMenu() {
		// 清除隐藏定时器
		if (window.navigationHideTimer) {
			clearTimeout(window.navigationHideTimer);
			window.navigationHideTimer = null;
		}

		const menu = document.querySelector(".bgsh-navigation-menu");
		if (menu) {
			menu.classList.remove('bgsh-show');
			setTimeout(() => {
				if (menu.parentNode) {
					menu.remove();
				}
			}, 250);
		}
	}





	/**
	 * 创建导航菜单元素
	 * @param {Array} boards - 自定义板块列表
	 * @return {HTMLElement} 菜单元素
	 */
	function createNavigationMenu(boards) {
		const menu = document.createElement("div");
		menu.className = "bgsh-navigation-menu";

		// 创建顶部操作区域
		const header = createNavigationMenuHeader();

		// 只有当头部有内容时才添加
		if (header.children.length > 0) {
			menu.appendChild(header);
		}

		// 创建板块列表区域
		if (boards.length > 0) {
			const list = createNavigationBoardList(boards);
			menu.appendChild(list);
		} else {
			const emptyMessage = createEmptyNavigationMessage();
			menu.appendChild(emptyMessage);
		}

		// 添加显示动画
		setTimeout(() => {
			menu.classList.add('bgsh-show');
		}, 10);

		return menu;
	}

	/**
	 * 创建导航菜单顶部操作区域
	 * @return {HTMLElement} 顶部操作区域元素
	 */
	function createNavigationMenuHeader() {
		const header = document.createElement("div");
		header.className = "bgsh-navigation-header";

		// 获取当前板块信息
		const currentBoard = getCurrentBoardInfo();

		if (currentBoard) {
			// 检查是否已添加
			const customBoards = getCustomNavigationBoards();
			const isAdded = customBoards.some(board => board.fid === currentBoard.fid);

			// 如果未添加，显示添加按钮
			if (!isAdded) {
				const addButton = document.createElement("div");
				addButton.className = "bgsh-add-board-btn";
				addButton.textContent = "添加本版";

				addButton.addEventListener('click', (e) => {
					e.stopPropagation();
					const success = addBoardToCustomNavigation(currentBoard.fid, currentBoard.boardName);
					if (success) {
						// 立即更新菜单内容，显示新添加的板块
						updateNavigationMenuContent();
					}
				});

				header.appendChild(addButton);
			}
			// 如果已添加，不显示任何内容（整个头部区域会被隐藏）
		}

		return header;
	}

	/**
	 * 更新导航菜单内容（不关闭菜单的情况下刷新内容）
	 */
	function updateNavigationMenuContent() {
		const existingMenu = document.querySelector(".bgsh-navigation-menu");
		if (!existingMenu) return;

		// 获取最新的板块列表
		const customBoards = getCustomNavigationBoards();

		// 更新头部区域
		let headerContainer = existingMenu.querySelector('.bgsh-navigation-header');
		const newHeader = createNavigationMenuHeader();

		if (newHeader.children.length > 0) {
			// 需要显示头部
			if (headerContainer) {
				headerContainer.replaceWith(newHeader);
			} else {
				// 在菜单开头插入头部
				existingMenu.insertBefore(newHeader, existingMenu.firstChild);
			}
		} else {
			// 不需要显示头部，移除现有头部
			if (headerContainer) {
				headerContainer.remove();
			}
		}

		// 查找现有的板块列表容器
		let listContainer = existingMenu.querySelector('.bgsh-navigation-list');
		let emptyContainer = existingMenu.querySelector('.bgsh-navigation-empty');

		if (customBoards.length > 0) {
			// 有板块数据，创建或更新板块列表
			if (emptyContainer) {
				// 移除空状态提示
				emptyContainer.remove();
			}

			if (listContainer) {
				// 更新现有列表
				const newList = createNavigationBoardList(customBoards);
				listContainer.replaceWith(newList);
			} else {
				// 创建新的列表
				const newList = createNavigationBoardList(customBoards);
				existingMenu.appendChild(newList);
			}
		} else {
			// 没有板块数据，显示空状态
			if (listContainer) {
				listContainer.remove();
			}

			if (!emptyContainer) {
				const emptyMessage = createEmptyNavigationMessage();
				existingMenu.appendChild(emptyMessage);
			}
		}
	}



	/**
	 * 创建导航板块列表
	 * @param {Array} boards - 板块列表
	 * @return {HTMLElement} 板块列表元素
	 */
	function createNavigationBoardList(boards) {
		const list = document.createElement("div");
		list.className = "bgsh-navigation-list";

		// 每列最大显示10个项目
		const maxItemsPerColumn = 10;
		const totalColumns = Math.ceil(boards.length / maxItemsPerColumn);

		// 创建列
		for (let col = 0; col < totalColumns; col++) {
			const column = document.createElement("div");
			column.className = "bgsh-navigation-column";

			// 计算当前列的板块范围
			const startIndex = col * maxItemsPerColumn;
			const endIndex = Math.min(startIndex + maxItemsPerColumn, boards.length);
			const columnBoards = boards.slice(startIndex, endIndex);

			columnBoards.forEach((board) => {
				const item = document.createElement("div");
				item.className = "bgsh-navigation-item";

				const boardName = document.createElement("span");
				boardName.textContent = board.name;

				const deleteButton = document.createElement("button");
				deleteButton.className = "bgsh-delete-board-btn";
				deleteButton.innerHTML = "×";
				deleteButton.title = "删除此板块";

				// 删除按钮事件
				deleteButton.addEventListener('click', (e) => {
					e.stopPropagation();
					e.preventDefault();

					const success = removeBoardFromCustomNavigation(board.fid);
					if (success) {
						// 立即更新菜单内容
						updateNavigationMenuContent();
					}
				});

				// 板块项点击事件
				item.addEventListener('click', (e) => {
					if (e.target === deleteButton) return;

					e.preventDefault();
					e.stopPropagation();

					// 添加点击反馈
					setTimeout(() => {
						window.location.href = board.url;
					}, 50);
				});

				// 悬停效果通过CSS处理，无需JavaScript

				// 键盘导航支持
				item.setAttribute('tabindex', '0');
				item.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						item.click();
					}
				});

				item.appendChild(boardName);
				item.appendChild(deleteButton);
				column.appendChild(item);
			});

			list.appendChild(column);
		}

		return list;
	}

	/**
	 * 创建空导航消息
	 * @return {HTMLElement} 空消息元素
	 */
	function createEmptyNavigationMessage() {
		const emptyMessage = document.createElement("div");
		emptyMessage.className = "bgsh-navigation-empty";

		emptyMessage.innerHTML = `
			<div>暂无收藏板块</div>
			<div>进入板块页面点击"添加本版"</div>
		`;

		return emptyMessage;
	}





	/**
	 * 定位导航菜单 - 向下弹出，相对按钮居中
	 * @param {HTMLElement} menu - 菜单元素
	 */
	function positionNavigationMenu(menu) {
		const navigationButton = document.querySelector("#navigationButton");
		if (navigationButton) {
			const buttonRect = navigationButton.getBoundingClientRect();
			const menuHeight = menu.offsetHeight || 300; // 预估菜单高度
			const menuWidth = menu.offsetWidth || 250; // 预估菜单宽度
			const windowHeight = window.innerHeight;
			const windowWidth = window.innerWidth;

			menu.style.position = 'fixed';

			// 水平定位
			const buttonCenterX = buttonRect.left + buttonRect.width / 1;
			let menuLeft = buttonCenterX - menuWidth / 2;

			// 确保菜单不会超出屏幕边界
			if (menuLeft < 10) {
				// 超出左边界，贴左边
				menuLeft = 10;
			} else if (menuLeft + menuWidth > windowWidth - 10) {
				// 超出右边界，贴右边
				menuLeft = windowWidth - menuWidth - 10;
			}

			menu.style.left = menuLeft + 'px';
			menu.style.right = 'auto';

			// 垂直定位：优先向下弹出，如果空间不够则向上弹出
			const spaceBelow = windowHeight - buttonRect.bottom;
			const spaceAbove = buttonRect.top;

			if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
				// 向下弹出
				menu.style.top = (buttonRect.bottom + 5) + 'px';
				menu.style.bottom = 'auto';
			} else {
				// 向上弹出
				menu.style.bottom = (windowHeight - buttonRect.top + 5) + 'px';
				menu.style.top = 'auto';
			}
		}
	}



	// #endregion

	// #region 划词搜索功能

	/**
	 * 响应用户的文本选择，用于显示搜索选项。
	 * @param {Event} e - 事件对象
	 */
	function selectSearch(e) {
		const LEFT_MOUSE_BUTTON = 0;
		const MIN_TEXT_LENGTH = 2;
		const forbiddenTags = ["INPUT", "TEXTAREA"];

		// 确保是左键点击
		if (e.button !== LEFT_MOUSE_BUTTON) return;

		// 如果活动元素是输入框或文本区域，则不处理
		const activeElementTag = document.activeElement.tagName.toUpperCase();
		if (forbiddenTags.includes(activeElementTag)) return;

		const selectedText = window.getSelection().toString().trim();

		// 移除已存在的搜索菜单，如果选中的文本过短
		if (selectedText.length < MIN_TEXT_LENGTH) {
			removeSearchMenu();
			return;
		}

		// 如果没有现有的搜索菜单，创建并显示一个
		if (!document.querySelector(".bgsh-sav-menu")) {
			const searchPopup = createSearchPopup(selectedText);
			displaySearchPopup(e.pageX, e.pageY, searchPopup);
		}
	}

	/**
	 * 移除已存在的搜索菜单
	 */
	function removeSearchMenu() {
		const searchMenu = document.querySelector(".bgsh-sav-menu");
		if (searchMenu) {
			// 先移除显示类，触发淡出动画
			searchMenu.classList.remove('bgsh-show');
			// 等待动画完成后再移除元素
			setTimeout(() => {
				if (searchMenu.parentNode) {
					searchMenu.remove();
				}
			}, 250); // 与CSS动画时长一致
		}
	}

	/**
	 * 在页面上的指定位置显示搜索菜单
	 * @param {number} x - 菜单的x坐标
	 * @param {number} y - 菜单的y坐标
	 * @param {Element} element - 要显示的元素
	 */
	function displaySearchPopup(x, y, element) {
		const rect = element.getBoundingClientRect();
		Object.assign(element.style, {
			left: `${x - rect.width / 2}px`,
			top: `${y}px`,
			position: "absolute",
		});
		document.body.appendChild(element);

		// 使用requestAnimationFrame确保DOM更新后再添加显示类
		requestAnimationFrame(() => {
			element.classList.add('bgsh-show');
		});
	}

	/**
	 * 根据所选文本创建搜索菜单元素
	 * @param {string} selectedText - 所选的文本内容
	 * @return {Element} - 创建的按钮元素
	 */
	function createSearchPopup(selectedText) {
		const button = document.createElement("button");
		button.classList.add("bgsh-sav-menu", "bgsh-searchBtn");
		button.setAttribute("type", "button");

		const innerDiv = document.createElement("div");
		innerDiv.classList.add("savlink", "savsehuatang");
		innerDiv.setAttribute("data-avid", selectedText);
		innerDiv.textContent = `搜索: ${selectedText}`;
		button.appendChild(innerDiv);

		button.addEventListener("click", handleSearchPopupClick);
		return button;
	}

	/**
	 * 处理搜索弹窗点击事件
	 * @param {Event} e - 事件对象
	 */
	function handleSearchPopupClick(e) {
		const target = e.target;
		if (target.classList.contains("savsehuatang")) {
			target.classList.remove("savsehuatang");
			searchSehuatang(target.dataset.avid);
		}
		removeSearchMenu();
	}

	/**
	 * 在Sehuatang中执行搜索
	 * @param {string} query - 搜索查询词
	 */
	function searchSehuatang(query) {
		const formhash = getFormHash();
		const openSearch = () => window.open(`${baseURL}/search.php`, "_blank");

		if (!formhash) {
			copyToClipboard(query).then(openSearch);
			return;
		}

		const formDataString = `formhash=${encodeURIComponent(
			formhash
		)}&srchtxt=${encodeURIComponent(query)}&searchsubmit=yes`;

		// 决策理由：使用GM_xmlhttpRequest进行跨域搜索请求
		if (typeof GM_xmlhttpRequest !== 'undefined') {
			GM_xmlhttpRequest({
				method: "POST",
				url: `${baseURL}/search.php?mod=forum`,
				data: formDataString,
				redirect: "manual",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Origin: baseURL,
					Referer: baseURL,
				},
				onload: function (response) {
					console.log(response);
					if (response.status === 301 || response.status === 302) {
						var headers = response.responseHeaders.split("\n");
						var locationHeader = headers.find((header) =>
							header.toLowerCase().startsWith("location:")
						);
						if (locationHeader) {
							var location = locationHeader.split(":")[1].trim();
							window.open(`${baseURL}/${location}`, "_blank");
						}
					} else {
						if (response.finalUrl && response.finalUrl.includes("searchmd5")) {
							showTooltip(
								"目前因论坛限制划词搜索只支持Tampermonkey,请下载Tampermonkey后再进行使用本功能"
							);
							return;
						}
						var htmlString = response.responseText;
						// 将 HTML 字符串解析为一个 DOM 节点
						var parser = new DOMParser();
						var doc = parser.parseFromString(htmlString, "text/html");

						// 获取 id="messagetext"
						var messagetextElement = doc.getElementById("messagetext");
						if (messagetextElement) {
							var firstPElement =
								messagetextElement.querySelector("p"); // 使用 querySelector 来获取第一个 <p> 标签
							if (firstPElement) {
								showTooltip(firstPElement.textContent);
								return;
							}
						}
					}
				},
				onerror: function (error) {
					console.error("GM_xmlhttpRequest error:", error);
					showTooltip("搜索请求失败，请稍后重试");
				},
			});
		} else {
			// 如果GM_xmlhttpRequest不可用，回退到复制搜索词并打开搜索页面
			copyToClipboard(query).then(openSearch);
		}
	}

	// #endregion

})();
