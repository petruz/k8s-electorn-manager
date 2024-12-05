const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = require('./src/utils/store');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  win.loadFile('src/index.html');
  
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Load Kubernetes Config',
          click: async () => {
            const result = await dialog.showOpenDialog(win, {
              properties: ['openFile', 'showHiddenFiles'],
              defaultPath: path.join(app.getPath('home'), '.kube'),
              title: 'Select Kubernetes Configuration File'
            });
            if (!result.canceled) {
              const configPath = result.filePaths[0];
              store.set('kubeconfig', configPath);
              win.webContents.send('load-k8s-config', configPath);
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load saved kubeconfig if it exists
  const savedConfig = store.get('kubeconfig');
  if (savedConfig) {
    win.webContents.on('did-finish-load', () => {
      win.webContents.send('load-k8s-config', savedConfig);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
