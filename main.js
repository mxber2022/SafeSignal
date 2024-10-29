// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const noble = require('@abandonware/noble');

let mainWindow;
let discoveredDevices = {}; // Store discovered devices to avoid duplicates

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Bluetooth handling with @abandonware/noble
noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  const { uuid, advertisement } = peripheral;
  const deviceName = advertisement.localName || uuid;

  // Check if the device is already in the list
  if (!discoveredDevices[uuid]) {
    discoveredDevices[uuid] = deviceName;
    console.log(`Discovered device: ${deviceName} (${uuid})`);
    
    // Send device info to renderer
    mainWindow.webContents.send('device-found', { uuid, deviceName });
  }
});

// Handle device connection and stop scanning after connection
ipcMain.on('connect-to-device', (event, uuid) => {
  const peripheral = noble._peripherals[uuid];
  if (peripheral) {
    noble.stopScanning(); // Stop scanning after a device is selected
    peripheral.connect((error) => {
      if (!error) {
        console.log(`Connected to ${uuid}`);
        mainWindow.webContents.send('connected', uuid);
      } else {
        console.error(`Failed to connect to ${uuid}: ${error.message}`);
      }
    });
  }
});

ipcMain.on('send-message', (event, message) => {
  console.log(`Message to send: ${message}`);
  mainWindow.webContents.send('message-received', `You: ${message}`);
});
