const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let selectWindow;

let createSelectWindow = () => {
	selectWindow = new BrowserWindow({
		width: 640,
		height: 480,
		frame: false,
		webPreferences: {
			preload: path.join(`${__dirname}/preload.js`)
		}
	});
	selectWindow.loadFile('./app/pages/select.html');
	selectWindow.on('closed', () => {
		selectWindow = null;
	});
};

let createMainWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		frame: false,
		icon: `${__dirname}/app/images/icons/png/48x48.png`,
		webPreferences: {
			preload: path.join(`${__dirname}/preload.js`)
		}
	});
	mainWindow.loadFile('./app/pages/main.html');
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
};

app.on('ready', createMainWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
	if (mainWindow === null) createMainWindow();
});

ipcMain.on('hide-main', () => {
	mainWindow.hide();
});

ipcMain.on('show-main', () => {
	mainWindow.show();
});

ipcMain.on('open-game-select', () => {
	createSelectWindow();
});

ipcMain.on('close-select', () => {
	selectWindow.close();
});
