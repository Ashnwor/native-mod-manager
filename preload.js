// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const isDebugON = true;
const appName = 'arcus';
const uname = require('username');
const fs = require('fs');
const con = require('electron').remote.getGlobal('console');
const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
let customTitlebar;
let custTitlebar;
let username;

const globalDebug = debugThis => {
	if (isDebugON === true) {
		if (typeof debugThis === 'object') {
			window.con.log('\x1b[31m' + 'DEBUG:' + '\x1b[0m');
			window.con.log(debugThis);
		} else {
			window.con.log('\x1b[31m' + 'DEBUG:' + '\x1b[0m', debugThis);
		}
	}
};

window.addEventListener('load', () => {
	window.$ = window.jquery = require('jquery');
	window.popper = require('popper.js');
	require('bootstrap');
});

window.globalDebug = debugThis => globalDebug(debugThis);
window.platform = process.platform;
window.dialog = dialog;
window.ipcRenderer = ipcRenderer;
window.appName = appName;
window.fs = fs;
window.con = con;

username = uname.sync();
window.getUsername = username;

window.titlebarFrame = () => {
	customTitlebar = require('custom-electron-titlebar');

	custTitlebar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex('#444')
	});
	custTitlebar;
};
