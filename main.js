const appName = "arcus";
const { app, BrowserWindow } = require("electron");
const path = require("path");
let mainWindow;

function createWindow() {
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
  mainWindow.loadFile("./app/index.html");
  mainWindow.on("closed", function() {
    mainWindow = null;
  });
}
app.on("ready", createWindow);
app.on("window-all-closed", function() {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function() {
  if (mainWindow === null) createWindow();
});
