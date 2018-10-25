"use strict";

module.exports = [
	`::-webkit-scrollbar {
	width: 16px;
	height: 16px;
	background: #f8f8f8;
}`,
	`::-webkit-scrollbar:window-inactive {
	background: #f8f8f850;
}`,
	`::-webkit-scrollbar-button {
	width: 0;
	height: 0;
}`,
	`::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 1000px;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-thumb:window-inactive {
	background: #c1c1c150;
	border-radius: 1000px;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-thumb:hover {
	background: #7d7d7d;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-thumb:window-inactive:hover {
	background: #c1c1c150;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-track {
	background: 0 0;
	border-radius: 0;
}`,
	`::-webkit-scrollbar-track:vertical {
	background: 0 0;
	border-radius: 0;
	border-left: 1px solid #eaeaea;
}`,
	`::-webkit-scrollbar-track:horizontal {
	background: 0 0;
	border-radius: 0;
	border-top: 1px solid #eaeaea;
}`,
	`::-webkit-scrollbar-track:vertical:window-inactive {
	border-left: 1px solid #eaeaea50;
}`,
	`::-webkit-scrollbar-track:horizontal:window-inactive {
	border-top: 1px solid #eaeaea50;
}`,
	`::-webkit-scrollbar-corner {
	background: #ffffff;
	border-top: 1px solid #dddddd;
	border-left: 1px solid #dddddd;
}`
];
