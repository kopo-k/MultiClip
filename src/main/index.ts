const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      contextIsolation: false,
    }
  });
  win.loadFile('public/index.html');
});
