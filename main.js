/* eslint-disable no-console */
const { join } = require('path');
const { sync } = require('username');
const { existsSync, mkdirSync } = require('fs');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');

const username = sync();
let mainWindow = null;
let selectWindow;
let prefWindow;
let dir;
let firstStart = false;
let deeplinkingUrl = process.argv.slice(1);
deeplinkingUrl = deeplinkingUrl[deeplinkingUrl.length - 1];
if (deeplinkingUrl) console.log(deeplinkingUrl);
let checkUrl;

// get information from nxm protocol
const parseNXM = url => {
	let download;
	try {
		checkUrl = new URL(url);
	} catch (err) {
		console.log(`EITHER NO URL PROVIDED OR INVALID URL`);
		checkUrl = null;
	}
	if (checkUrl !== null) {
		if (checkUrl.protocol === 'nxm:') {
			console.log('Valid');
			const pathArr = checkUrl.pathname.split('/').filter(el => el !== '');
			const game = checkUrl.host;
			const modID = pathArr[1];
			const fileID = pathArr[3];
			let key;
			let expires;
			let userID;
			console.log(`game: ${game}`);
			console.log(`modID: ${modID}`);
			console.log(`fileID: ${fileID}`);
			checkUrl.searchParams.forEach((value, name) => {
				if (name === 'key') key = value;
				if (name === 'expires') expires = value;
				if (name === 'user_id') userID = value;
			});
			console.log(`key: ${key}`);
			console.log(`expires: ${expires}`);
			console.log(`user_id: ${userID}`);
			console.log(pathArr);

			download = {
				game,
				modID,
				fileID,
				key,
				expires,
				userID,
			};
		}
	}
	return download;
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
} else {
	app.on('second-instance', (event, argv) => {
		console.log(argv[argv.length - 1]);
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
			// send data to mainWindow ipcRenderer
			mainWindow.webContents.send('request-download', parseNXM(argv[argv.length - 1]));
		}
	});
}

const createPrefWindow = () => {
	prefWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		frame: false,
		webPreferences: { preload: join(`${__dirname}/preload.js`) },
		parent: mainWindow,
	});
	prefWindow.loadFile('./app/pages/preferences.html');

	prefWindow.on('closed', () => {
		prefWindow = null;
	});
};

const createSelectWindow = () => {
	selectWindow = new BrowserWindow({
		width: 640,
		height: 480,
		frame: false,
		webPreferences: {
			preload: join(`${__dirname}/preload.js`),
		},
		parent: mainWindow,
	});
	selectWindow.loadFile('./app/pages/select.html');

	selectWindow.on('closed', () => {
		selectWindow = null;
	});

	selectWindow.on('close', event => {
		event.preventDefault();
		const appName = 'arcus';
		if (process.platform === 'darwin') {
			dir = `/Users/ashnwor/Library/Application Support`;
		} else if (process.platform === 'linux') {
			dir = `/home/ashnwor/.local/share`;
		}
		if (!existsSync(`${dir}/${appName}/config.json`)) {
			const options = {
				buttons: ['Yes', 'No'],
				message:
					'If you quit now, your preferences will not be saved and application will quit altogether',
			};
			dialog.showMessageBox(selectWindow, options).then(result => {
				if (result.response === 0) {
					selectWindow.destroy();
					mainWindow.destroy();
				}
			});
		}
	});
};

const createMainWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		frame: false,
		webPreferences: {
			preload: join(`${__dirname}/preload.js`),
		},
	});
	mainWindow.loadFile('./app/pages/main.html');
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	try {
		checkUrl = new URL(deeplinkingUrl);
	} catch (err) {
		console.log(`EITHER NO URL PROVIDED OR INVALID URL`);
		checkUrl = null;
	}
	console.log(checkUrl);
	if (checkUrl) {
		console.log('HERE');
		mainWindow.webContents.once('dom-ready', () => {
			mainWindow.webContents.send('request-download', parseNXM(deeplinkingUrl));
		});
	}
};

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
	if (mainWindow === null) createMainWindow();
});

console.log(app.setAsDefaultProtocolClient('nxm'));
ipcMain.on('hide-main', () => {
	mainWindow.hide();
});

ipcMain.on('show-main', () => {
	createMainWindow();
	firstStart = true;
});

ipcMain.on('isFirstStart', event => {
	event.returnValue = firstStart;
});

ipcMain.on('close-select', () => {
	selectWindow.destroy();
});

ipcMain.on('open-prefs', () => {
	createPrefWindow();
});

ipcMain.on('gen-run-script', () => {
	mainWindow.webContents.send('gen-run-script');
});

if (process.platform === 'darwin') {
	dir = `/Users/${username}/Library/Application Support`;
} else if (process.platform === 'linux') {
	dir = `/home/${username}/.local/share`;
}

if (!existsSync(`${dir}/arcus`)) {
	console.log('First time setup');
	mkdirSync(`${dir}/arcus`);
	app.on('ready', createSelectWindow);
} else {
	app.on('ready', createMainWindow);
}
