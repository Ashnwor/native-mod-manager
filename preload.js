/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const isDebugON = true;
const appName = 'arcus';
const fs = require('fs');
const con = require('electron').remote.getGlobal('console');
const { ipcRenderer, shell } = require('electron');
const { join, extname } = require('path');
const { dialog } = require('electron').remote;
const { execSync, spawn } = require('child_process');
const wget = require('wget-improved');
const request = require('then-request');
const sevenz = require('node-7z');
const os = require('os');

const layoutPreferences = require('./app/js/layoutPreferences');
const protonSupport = require('./app/js/protonSupport');
const configFunctions = require('./app/js/configFunctions');
const globalVariables = require('./app/js/globalVariables');

let customTitlebar;
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
window.configFunctions = configFunctions;
window.globalVariables = globalVariables;
window.layoutPreferences = layoutPreferences;
window.protonSupport = protonSupport;
window.sevenz = sevenz;
window.join = join;
window.extname = extname;
window.request = request;
window.shell = shell;
window.wget = wget;
window.spawn = spawn;
window.execSync = execSync;
window.platform = process.platform;
window.dialog = dialog;
window.ipcRenderer = ipcRenderer;
window.appName = appName;
window.fs = fs;
window.os = os;
window.con = con;

window.titlebarFrame = () => {
	customTitlebar = require('custom-electron-titlebar');

	// eslint-disable-next-line no-unused-vars
	const custTitlebar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex('#444'),
	});
};
