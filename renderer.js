// renderer.js
const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const devicesList = document.getElementById('devices');
  const chatArea = document.getElementById('chat');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  ipcRenderer.on('device-found', (event, device) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${device.deviceName} (${device.uuid})`;
    listItem.dataset.uuid = device.uuid;
    listItem.addEventListener('click', () => {
      ipcRenderer.send('connect-to-device', device.uuid);
    });
    devicesList.appendChild(listItem);
  });

  ipcRenderer.on('connected', (event, uuid) => {
    chatArea.innerHTML += `<p>Connected to device ${uuid}</p>`;
  });

  sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    ipcRenderer.send('send-message', message);
    chatArea.innerHTML += `<p>You: ${message}</p>`;
    messageInput.value = '';
  });

  ipcRenderer.on('message-received', (event, message) => {
    console.log("Received message event in renderer:", message);
    chatArea.innerHTML += `<p>Device: ${message}</p>`;
  });
});
