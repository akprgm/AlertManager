const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const AlertManager = require('./alert-manager');

let mainWindow;
let alertManager;

async function initializeApp() {
    alertManager = new AlertManager();
    await alertManager.init();
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'IOCL: Alert Manager',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../index.html'));

    // Send saved alerts to renderer once window is ready
    mainWindow.webContents.on('did-finish-load', () => {
        const savedAlerts = alertManager.getAllAlerts();
        mainWindow.webContents.send('load-alerts', savedAlerts);
    });
}

app.whenReady().then(async () => {
    await initializeApp();
    createWindow();

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await initializeApp();
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle alert creation
ipcMain.on('create-alert', (event, data) => {
    const success = alertManager.createAlert(data.id, data);
    event.reply('alert-created', { id: data.id, success });
});

// Handle alert start
ipcMain.on('start-alert', (event, { id }) => {
    const success = alertManager.startAlert(id);
    event.reply('alert-started', { id, success });
});

// Handle alert stop
ipcMain.on('stop-alert', (event, { id }) => {
    const success = alertManager.stopAlert(id);
    event.reply('alert-stopped', { id, success });
});

// Handle alert deletion
ipcMain.on('delete-alert', (event, { id }) => {
    try {
        const success = alertManager.deleteAlert(id);
        event.reply('alert-deleted', { id, success });
    } catch (error) {
        console.error('Error deleting alert:', error);
        event.reply('alert-deleted', { id, success: false });
    }
});

// Handle alert update
ipcMain.on('update-alert', (event, data) => {
    try {
        // Validate data
        if (!data.id || !data.name || !data.message || !data.time) {
            console.error('Invalid update data:', data);
            event.reply('alert-updated', { id: data.id, success: false });
            return;
        }

        // Add language if not present
        const updateData = {
            ...data,
            language: 'en'
        };

        // Update the alert
        const success = alertManager.updateAlert(updateData.id, updateData);
        console.log('Alert update result:', success);
        event.reply('alert-updated', { id: data.id, success });
    } catch (error) {
        console.error('Error updating alert:', error);
        event.reply('alert-updated', { id: data.id, success: false });
    }
});

// Handle get all alerts request
ipcMain.on('get-alerts', (event) => {
    const alerts = alertManager.getAllAlerts();
    event.reply('alerts-loaded', alerts);
});

