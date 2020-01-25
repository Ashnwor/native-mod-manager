const appName = "arcus";
const { app, BrowserWindow } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
let mainWindow, selectWindow;

function createSelectWindow() {
  selectWindow = new BrowserWindow({
    width: 640,
    height: 480,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  selectWindow.loadFile("./app/main.html");
  selectWindow.on("closed", () => {
    selectWindow = null;
  } );
}
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    icon: __dirname + "/app/images/icons/png/48x48.png",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true
    }
  });
  mainWindow.loadFile("./app/main.html");
  mainWindow.on("closed", function() {
    mainWindow = null;
  });
}
app.on("ready", createMainWindow);

ipcMain.on("open-game-select", () => {
  createSelectWindow();
});

app.on("window-all-closed", function() {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function() {
  if (mainWindow === null) createMainWindow();
});
