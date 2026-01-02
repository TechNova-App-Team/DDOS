const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const net = require('net');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');

let mainWindow;

// IPC Handler for TCP connectivity check
ipcMain.handle('ping:host', async (event, host, port = 80) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    let connected = false;

    // Set timeout to 2 seconds for much faster results
    socket.setTimeout(2000);

    // Handle successful connection
    socket.on('connect', () => {
      connected = true;
      const responseTime = Date.now() - startTime;
      socket.destroy();
      
      console.log(`[TCP SUCCESS] Host: ${host}:${port}, Response time: ${responseTime}ms`);
      
      resolve({
        success: true,
        time: responseTime,
        error: null,
        port: port,
      });
    });

    // Handle connection error
    socket.on('error', (err) => {
      socket.destroy();
      
      console.log(`[TCP ERROR] Host: ${host}:${port}, Error: ${err.message}`);
      
      resolve({
        success: false,
        time: null,
        error: err.message || 'Connection refused',
        port: port,
      });
    });

    // Handle timeout
    socket.on('timeout', () => {
      socket.destroy();
      
      console.log(`[TCP TIMEOUT] Host: ${host}:${port}`);
      
      resolve({
        success: false,
        time: null,
        error: 'Connection timeout',
        port: port,
      });
    });

    // Attempt connection with keepalive and noDelay for faster response
    try {
      socket.setKeepAlive(false); // No need for persistent connection
      socket.setNoDelay(true); // Disable Nagle's algorithm for faster response
      socket.connect(port, host);
    } catch (err) {
      resolve({
        success: false,
        time: null,
        error: err.message,
        port: port,
      });
    }
  });
});

// IPC Handler for DNS lookup
ipcMain.handle('dns:resolve', async (event, hostname) => {
  const startTime = Date.now();
  try {
    const addresses = await dns.resolve4(hostname);
    const time = Date.now() - startTime;
    console.log(`[DNS SUCCESS] ${hostname} resolved to ${addresses.join(', ')} in ${time}ms`);
    return {
      success: true,
      addresses: addresses,
      time: time,
      error: null,
    };
  } catch (err) {
    const time = Date.now() - startTime;
    console.log(`[DNS ERROR] ${hostname} - ${err.message}`);
    return {
      success: false,
      addresses: [],
      time: time,
      error: err.message,
    };
  }
});

// IPC Handler for HTTP/HTTPS status check
ipcMain.handle('http:check', async (event, url) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const isHttps = url.startsWith('https');
    const httpModule = isHttps ? https : http;
    
    const req = httpModule.get(url, { timeout: 5000 }, (res) => {
      const time = Date.now() - startTime;
      console.log(`[HTTP ${res.statusCode}] ${url} in ${time}ms`);
      resolve({
        success: res.statusCode >= 200 && res.statusCode < 400,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        time: time,
        error: null,
      });
      res.on('data', () => {}); // Drain response
      res.destroy();
    });
    
    req.on('error', (err) => {
      const time = Date.now() - startTime;
      console.log(`[HTTP ERROR] ${url} - ${err.message}`);
      resolve({
        success: false,
        statusCode: 0,
        statusMessage: err.message,
        time: time,
        error: err.message,
      });
    });
    
    req.on('timeout', () => {
      const time = Date.now() - startTime;
      console.log(`[HTTP TIMEOUT] ${url}`);
      req.destroy();
      resolve({
        success: false,
        statusCode: 0,
        statusMessage: 'Timeout',
        time: time,
        error: 'Connection timeout',
      });
    });
  });
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, 'icon.png'),
  });

  const startUrl = isDev
    ? process.env.VITE_PORT ? `http://localhost:${process.env.VITE_PORT}/` : 'http://localhost:5173/'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          mainWindow.webContents.reload();
        },
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: 'F12',
        click: () => {
          mainWindow.webContents.toggleDevTools();
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
