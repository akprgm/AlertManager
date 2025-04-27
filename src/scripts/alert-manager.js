const schedule = require('node-schedule');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class AlertManager {
    constructor() {
        this.store = null;
        this.alerts = new Map();
        this.jobs = new Map();
        this.activeAlerts = new Set();
        
        // Initialize store and load data
        this.init();
    }

    async init() {
        const Store = (await import('electron-store')).default;
        this.store = new Store();
        
        // Load saved data
        const savedAlerts = this.store.get('alerts') || {};
        this.alerts = new Map(Object.entries(savedAlerts));
        this.activeAlerts = new Set(this.store.get('activeAlerts') || []);

        // Restart active alerts
        this.activeAlerts.forEach(id => {
            if (this.alerts.has(id)) {
                this.startAlert(id);
            }
        });
    }

    createAlert(id, data) {
        this.alerts.set(id, data);
        this._saveAlerts();
        return true;
    }

    startAlert(id) {
        const alert = this.alerts.get(id);
        if (!alert) return false;

        // Cancel existing job if any
        this.stopAlert(id);

        // Schedule new job
        const [hours, minutes] = alert.time.split(':');
        const job = schedule.scheduleJob(`${minutes} ${hours} * * *`, () => {
            this.speak(alert.message, alert.language);
        });

        this.jobs.set(id, job);
        this.activeAlerts.add(id);
        this._saveActiveAlerts();
        return true;
    }

    stopAlert(id) {
        const job = this.jobs.get(id);
        if (job) {
            job.cancel();
            this.jobs.delete(id);
            this.activeAlerts.delete(id);
            this._saveActiveAlerts();
            return true;
        }
        return false;
    }

    getAllAlerts() {
        return Array.from(this.alerts.entries()).map(([id, data]) => ({
            ...data,
            active: this.activeAlerts.has(id)
        }));
    }

    deleteAlert(id) {
        // Stop alert if running
        this.stopAlert(id);

        // Remove from alerts
        this.alerts.delete(id);
        this.activeAlerts.delete(id);

        // Save changes
        this._saveAlerts();
        this._saveActiveAlerts();

        return true;
    }

    updateAlert(id, data) {
        // Stop alert if running
        const wasActive = this.activeAlerts.has(id);
        this.stopAlert(id);

        // Update alert data
        this.alerts.set(id, { ...data, id });
        this._saveAlerts();

        // Restart if it was active
        if (wasActive) {
            this.startAlert(id);
        }

        return true;
    }

    deleteAlert(id) {
        // Stop alert if running
        this.stopAlert(id);

        // Remove from alerts
        this.alerts.delete(id);
        this.activeAlerts.delete(id);

        // Save changes
        this._saveAlerts();
        this._saveActiveAlerts();

        return true;
    }

    updateAlert(id, data) {
        // Stop alert if running
        const wasActive = this.activeAlerts.has(id);
        this.stopAlert(id);

        // Update alert data
        this.alerts.set(id, { ...data, id });
        this._saveAlerts();

        // Restart if it was active
        if (wasActive) {
            this.startAlert(id);
        }

        return true;
    }

    async speak(text) {
        return new Promise(async (resolve, reject) => {
            try {
                if (process.platform === 'darwin') {
                    try {
                        // Use Alex voice for English
                        await execPromise(`say -v "Alex" "${text}"`);
                        console.log('Using Alex voice');
                        resolve();
                    } catch (err) {
                        console.error('Speech error:', err);
                        // Fallback to default system voice
                        await execPromise(`say "${text}"`);
                        resolve();
                    }
                } else if (process.platform === 'win32') {
                    // For Windows, use simple PowerShell speech
                    const script = `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${text.replace(/'/g, "''")}');`;
                    try {
                        await execPromise(`powershell -Command "${script}"`);
                        console.log('Windows speech completed successfully');
                        resolve();
                    } catch (err) {
                        console.error('Windows speech error:', err);
                        reject(err);
                    }
                } else {
                    // For Linux, use simple espeak command
                    try {
                        await execPromise(`espeak "${text}"`);
                        console.log('Linux speech completed successfully');
                        resolve();
                    } catch (err) {
                        console.error('Linux speech error:', err);
                        reject(err);
                    }
                }
            } catch (err) {
                console.error('Error in speak function:', err);
                reject(err);
            }
        });
    }

    async _saveAlerts() {
        if (this.store) {
            this.store.set('alerts', Object.fromEntries(this.alerts));
        }
    }

    async _saveActiveAlerts() {
        if (this.store) {
            this.store.set('activeAlerts', Array.from(this.activeAlerts));
        }
    }
}

module.exports = AlertManager;
