// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const noble = require('@abandonware/noble');

let mainWindow;
let discoveredDevices = {}; // Track discovered devices
let connectedPeripheral = null;

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

  if (!discoveredDevices[uuid]) {
    discoveredDevices[uuid] = deviceName;
    console.log(`Discovered device: ${deviceName} (${uuid})`);
    mainWindow.webContents.send('device-found', { uuid, deviceName });
  }
});

ipcMain.on('connect-to-device', (event, uuid) => {
  const peripheral = noble._peripherals[uuid];
  if (peripheral) {
    noble.stopScanning();
    peripheral.connect((error) => {
      if (!error) {
        console.log(`Connected to ${uuid}`);
        connectedPeripheral = peripheral;
        mainWindow.webContents.send('connected', uuid);

        // Discover services and characteristics for receiving data
        discoverServicesAndCharacteristics(peripheral);
      } else {
        console.error(`Failed to connect: ${error.message}`);
      }
    });
  }
});

// Function to discover services and characteristics
function discoverServicesAndCharacteristics(peripheral) {
  peripheral.discoverSomeServicesAndCharacteristics([], [], (error, services, characteristics) => {
    if (error) {
      console.error(`Failed to discover services/characteristics: ${error.message}`);
      return;
    }

    console.log(`Discovered ${characteristics.length} characteristics`);

    // Find the characteristic to receive messages (update UUID as necessary)
    const messageCharacteristic = characteristics.find(
      (characteristic) => characteristic.properties.includes('notify')
    );

    if (messageCharacteristic) {
      messageCharacteristic.subscribe((error) => {
        if (error) {
          console.error(`Failed to subscribe: ${error.message}`);
          return;
        }

        console.log('Subscribed to message characteristic');
        
        // Listen for data
        messageCharacteristic.on('data', (data) => {
          const message = data.toString('utf-8'); // Convert buffer to string
          console.log(`Received message: ${message}`);
          mainWindow.webContents.send('message-received', message);
        });
      });
    } else {
      console.log('No suitable characteristic found for receiving messages');
    }
  });
}
