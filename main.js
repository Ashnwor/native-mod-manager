const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');

let mainWindow;
let selectWindow;

function createSelectWindow() {
	selectWindow = new BrowserWindow({
		width: 640,
		height: 480,
		frame: false,
		webPreferences: {
			nodeIntegration: true
		}
	});
	selectWindow.loadFile('./app/pages/select.html');
	selectWindow.on('closed', () => {
		selectWindow = null;
	});
}
function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		frame: false,
		icon: `${__dirname}/app/images/icons/png/48x48.png`,
		webPreferences: {
			preload: path.join(`${__dirname}/preload.js`),
			nodeIntegration: true
		}
	});
	mainWindow.loadFile('./app/pages/main.html');
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}
app.on('ready', createMainWindow);

ipcMain.on('open-game-select', () => {
	createSelectWindow();
});

ipcMain.on('close-select', () => {
	selectWindow.close();
});
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
	if (mainWindow === null) createMainWindow();
});
