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
        const message = messageInput.value.trim(); // Get the message from the input field
        if (message) { // Check if the message is not empty
            ipcRenderer.send('send-message', message);
            chatArea.innerHTML += `<p>You: ${message}</p>`;
            messageInput.value = ''; // Clear input after sending
        }
    });

    ipcRenderer.on('message-received', (event, message) => {
        chatArea.innerHTML += `<p>Device: ${message}</p>`;
    });
});
