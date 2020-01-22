const appName = "arcus";
const { app, BrowserWindow } = require("electron");
const { dialog } = require('electron')
const path = require("path");
const fs = require("fs");
const uname = require("username");
let mainWindow;
let username;
let firstTime;
// get username
(async () => {
  username = await uname();
  if (process.platform === "linux") {
    const dir = `/home/${username}/.local/share`;
    console.log(fs.readdirSync(dir));
    if (!fs.existsSync(`${dir}/${appName}`)) {
      console.log('First time setup');
      firstTime = true;
      fs.mkdirSync(`${dir}/${appName}`);
      let someObject = {
        skyrim: "test"
      }
      fs.writeFile(`${dir}/${appName}/config.json`, JSON.stringify(someObject), (err) => {
        if (err) throw err
        console.log('The file has been saved!')
        const conf = fs.readFileSync(`${dir}/${appName}/config.json`, 'utf8');
        console.log(JSON.parse(conf));

      })
    }
  }
})();

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    icon: __dirname + "/images/icons/png/48x48.png",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true
    }
  });
  // and load the index.html of the app.
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
// console.log('test');
// if (firstTime === true) {
//   console.log(dialog.showOpenDialogSync({ properties: ['openDirectory', 'multiSelections'] }))
// }