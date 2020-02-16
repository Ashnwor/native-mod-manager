/* eslint-disable global-require */
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const isDebugON = true;
const appName = 'arcus';
const uname = require('username');
const fs = require('fs');
const con = require('electron').remote.getGlobal('console');
const { ipcRenderer } = require('electron');
const https = require('https');
const { dialog } = require('electron').remote;
const { execSync, spawn } = require('child_process');

let customTitlebar;
let custTitlebar;
const username = uname.sync();
const globalDebug = debugThis => {
	if (isDebugON === true) {
		if (typeof debugThis === 'object') {
			window.con.log(`\x1b[31mDEBUG:\x1b[0m`);
			window.con.log(debugThis);
		} else {
			window.con.log(`\x1b[31mDEBUG:\x1b[0m ${debugThis}`);
		}
	}
};

window.addEventListener('load', () => {
	// eslint-disable-next-line no-multi-assign
	window.$ = window.jquery = require('jquery');
	window.popper = require('popper.js');
	require('bootstrap');
});

window.globalDebug = debugThis => globalDebug(debugThis);
window.https = https;
window.spawn = spawn;
window.execSync = execSync;
window.platform = process.platform;
window.dialog = dialog;
window.ipcRenderer = ipcRenderer;
window.appName = appName;
window.fs = fs;
window.con = con;

window.getUsername = username;

window.titlebarFrame = () => {
	customTitlebar = require('custom-electron-titlebar');

	custTitlebar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex('#444'),
	});
	custTitlebar();
};
