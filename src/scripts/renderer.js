const { ipcRenderer } = require('electron');

function createAlertElement(alertData) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-item';
    alertDiv.id = alertData.id;

    // Create alert elements
    const viewContent = document.createElement('div');
    viewContent.className = 'alert-view';
    viewContent.innerHTML = `
        <div class="alert-header">
            <span class="alert-title">${alertData.name}</span>
            <span class="alert-time">${alertData.time}</span>
        </div>
        <div class="alert-message">${alertData.message}</div>
        <div class="alert-controls">
            <div class="main-controls">
                <button class="start-btn" data-alert-id="${alertData.id}">Start</button>
                <button class="stop-btn" data-alert-id="${alertData.id}" disabled>Stop</button>
            </div>
            <div class="edit-controls">
                <button class="edit-btn" data-alert-id="${alertData.id}">Edit</button>
                <button class="delete-btn" data-alert-id="${alertData.id}">Delete</button>
            </div>
        </div>
    `;

    // Create edit mode content
    const editContent = document.createElement('div');
    editContent.className = 'alert-edit';
    editContent.style.display = 'none';
    editContent.innerHTML = `
        <form class="edit-form" data-alert-id="${alertData.id}">
            <div class="form-group">
                <label for="edit-name-${alertData.id}">Alert Name:</label>
                <input type="text" id="edit-name-${alertData.id}" value="${alertData.name}" required>
            </div>
            <div class="form-group">
                <label for="edit-message-${alertData.id}">Message:</label>
                <textarea id="edit-message-${alertData.id}" required>${alertData.message}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-time-${alertData.id}">Time:</label>
                <input type="time" id="edit-time-${alertData.id}" value="${alertData.time}" required>
            </div>
            <div class="edit-form-controls">
                <button type="submit" class="save-btn">Save Changes</button>
                <button type="button" class="cancel-btn">Cancel</button>
            </div>
        </form>
    `;

    // Add both view and edit content to the alert div
    alertDiv.appendChild(viewContent);
    alertDiv.appendChild(editContent);

    // Handle edit form submission
    const editForm = editContent.querySelector('.edit-form');
    
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = alertData.id;
        const updatedData = {
            id: id,
            name: document.getElementById(`edit-name-${id}`).value,
            message: document.getElementById(`edit-message-${id}`).value,
            time: document.getElementById(`edit-time-${id}`).value,
            language: 'en'  // Keep English as default
        };

        // Update view content immediately
        const titleEl = viewContent.querySelector('.alert-title');
        const timeEl = viewContent.querySelector('.alert-time');
        const messageEl = viewContent.querySelector('.alert-message');

        if (titleEl) titleEl.textContent = updatedData.name;
        if (timeEl) timeEl.textContent = updatedData.time;
        if (messageEl) messageEl.textContent = updatedData.message;

        // Hide edit form and show view content
        editContent.style.display = 'none';
        viewContent.style.display = 'block';

        // Send update to main process
        ipcRenderer.send('update-alert', updatedData);

        // Clear form
        editForm.reset();
    });

    // Handle save button click
    const saveBtn = editContent.querySelector('.save-btn');
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        editForm.dispatchEvent(new Event('submit'));
    });

    // Handle cancel button
    const cancelBtn = editContent.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
        viewContent.style.display = 'block';
        editContent.style.display = 'none';
    });

    return alertDiv;
}

document.addEventListener('DOMContentLoaded', () => {
    const alertForm = document.getElementById('alertForm');
    const alertsList = document.getElementById('alertsList');
    const alerts = new Map();

    // Load saved alerts
    ipcRenderer.on('load-alerts', (event, savedAlerts) => {
        savedAlerts.forEach(alertData => {
            alerts.set(alertData.id, alertData);
            const alertElement = createAlertElement(alertData);
            
            if (alertData.active) {
                const startBtn = alertElement.querySelector('.start-btn');
                const stopBtn = alertElement.querySelector('.stop-btn');
                startBtn.disabled = true;
                stopBtn.disabled = false;
            }

            alertsList.appendChild(alertElement);
        });
    });

    // Handle form submission
    alertForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const alertName = document.getElementById('alertName').value;
        const message = document.getElementById('message').value;
        const time = document.getElementById('time').value;

        const alertData = {
            id: Date.now().toString(),
            name: alertName,
            message,
            language: 'en',  // Always English
            time
        };

        // Store alert data
        alerts.set(alertData.id, alertData);

        // Create and add alert element
        const alertElement = createAlertElement(alertData);
        alertsList.appendChild(alertElement);

        // Send alert to main process
        ipcRenderer.send('create-alert', alertData);

        // Clear form
        alertForm.reset();
    });

    // Handle start button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('start-btn')) {
            const alertId = e.target.dataset.alertId;
            ipcRenderer.send('start-alert', { id: alertId });
        }
    });

    // Handle stop button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('stop-btn')) {
            const alertId = e.target.dataset.alertId;
            ipcRenderer.send('stop-alert', { id: alertId });
        }
    });

    // Handle alert start response
    ipcRenderer.on('alert-started', (event, { id, success }) => {
        if (success) {
            const alertElement = document.getElementById(id);
            if (alertElement) {
                const startBtn = alertElement.querySelector('.start-btn');
                const stopBtn = alertElement.querySelector('.stop-btn');
                startBtn.disabled = true;
                stopBtn.disabled = false;
            }
        }
    });

    // Handle alert stop response
    ipcRenderer.on('alert-stopped', (event, { id, success }) => {
        if (success) {
            const alertElement = document.getElementById(id);
            if (alertElement) {
                const startBtn = alertElement.querySelector('.start-btn');
                const stopBtn = alertElement.querySelector('.stop-btn');
                startBtn.disabled = false;
                stopBtn.disabled = true;
            }
        }
    });

    // Handle alert delete response
    ipcRenderer.on('alert-deleted', (event, { id, success }) => {
        if (success) {
            const tab = document.querySelector(`.tab[data-tab="${id}"]`);
            const tabPane = document.getElementById(id);
            
            if (tab && tabPane) {
                // If this was the active tab, activate the first remaining tab
                if (tab.classList.contains('active')) {
                    const nextTab = tab.nextElementSibling || tab.previousElementSibling;
                    if (nextTab) {
                        nextTab.classList.add('active');
                        const nextPane = document.getElementById(nextTab.dataset.tab);
                        if (nextPane) nextPane.classList.add('active');
                    }
                }
                
                // Remove the tab and its content
                tab.remove();
                tabPane.remove();
            }
        }
    });

    // Handle alert update response
    ipcRenderer.on('alert-updated', (event, { id, success }) => {
        if (success) {
            const alertPane = document.getElementById(id);
            if (alertPane) {
                const content = alertPane.querySelector('.alert-content');
                const editForm = alertPane.querySelector('.edit-form');
                const editBtn = alertPane.querySelector('.edit-btn');
                const tab = document.querySelector(`.tab[data-tab="${id}"]`);

                // Update the tab name
                const newName = document.getElementById(`edit-name-${id}`).value;
                if (tab) tab.textContent = newName;

                // Update the content display
                content.innerHTML = `
                    <h3>${newName}</h3>
                    <p><strong>Message:</strong> ${document.getElementById(`edit-message-${id}`).value}</p>
                    <p><strong>Language:</strong> ${document.getElementById(`edit-language-${id}`).value}</p>
                    <p><strong>Time:</strong> ${document.getElementById(`edit-time-${id}`).value}</p>
                `;

                // Hide edit form and show content
                content.style.display = 'block';
                editForm.style.display = 'none';
                editBtn.textContent = 'Edit';
            }
        }
    });

    // Handle button clicks (start, stop, edit, delete)
    alertsList.addEventListener('click', (e) => {
        const alertId = e.target.dataset.alertId;
        if (!alertId) return;

        const alertElement = document.getElementById(alertId);
        if (!alertElement) return;

        if (e.target.classList.contains('start-btn')) {
            ipcRenderer.send('start-alert', { id: alertId });
        } else if (e.target.classList.contains('stop-btn')) {
            ipcRenderer.send('stop-alert', { id: alertId });
        } else if (e.target.classList.contains('edit-btn')) {
            // Show edit form
            alertElement.querySelector('.alert-view').style.display = 'none';
            alertElement.querySelector('.alert-edit').style.display = 'block';
        } else if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this alert?')) {
                ipcRenderer.send('delete-alert', { id: alertId });
            }
        }
    });

    // Handle alert update response
    ipcRenderer.on('alert-updated', (event, { id, success }) => {
        const alertElement = document.getElementById(id);
        if (!alertElement) return;

        if (!success) {
            // Show error and revert changes
            console.error('Failed to update alert');
            alert('Failed to update alert. Please try again.');

            // Reload original data
            const alert = alerts.get(id);
            if (alert) {
                const viewContent = alertElement.querySelector('.alert-view');
                viewContent.querySelector('.alert-title').textContent = alert.name;
                viewContent.querySelector('.alert-time').textContent = alert.time;
                viewContent.querySelector('.alert-message').textContent = alert.message;
            }
        }
    });

    // Handle alert delete response
    ipcRenderer.on('alert-deleted', (event, { id, success }) => {
        if (success) {
            const alertElement = document.getElementById(id);
            if (alertElement) {
                alertElement.remove();
            }
        }
    });
});

function createTab(alertData) {
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.textContent = alertData.name;
    tab.dataset.tab = alertData.id;
    return tab;
}

function createTabPane(alertData) {
    const tabPane = document.createElement('div');
    tabPane.id = alertData.id;
    tabPane.className = 'tab-pane';

    const content = document.createElement('div');
    content.className = 'alert-content';
    content.innerHTML = `
        <h3>${alertData.name}</h3>
        <p><strong>Message:</strong> ${alertData.message}</p>
        <p><strong>Language:</strong> ${alertData.language}</p>
        <p><strong>Time:</strong> ${alertData.time}</p>
    `;

    const editForm = createEditForm(alertData);
    editForm.style.display = 'none';

    const controls = document.createElement('div');
    controls.className = 'alert-controls';
    controls.innerHTML = `
        <div class="main-controls">
            <button class="start-btn" data-alert-id="${alertData.id}">Start</button>
            <button class="stop-btn" data-alert-id="${alertData.id}" disabled>Stop</button>
        </div>
        <div class="edit-controls">
            <button class="edit-btn" data-alert-id="${alertData.id}">Edit</button>
            <button class="delete-btn" data-alert-id="${alertData.id}">Delete</button>
        </div>
    `;

    // Add event listeners
    const editBtn = controls.querySelector('.edit-btn');
    const deleteBtn = controls.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => {
        if (editForm.style.display === 'none') {
            content.style.display = 'none';
            editForm.style.display = 'block';
            editBtn.textContent = 'Cancel';
        } else {
            content.style.display = 'block';
            editForm.style.display = 'none';
            editBtn.textContent = 'Edit';
        }
    });

    deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this alert?')) {
            ipcRenderer.send('delete-alert', { id: alertData.id });
        }
    });

    tabPane.appendChild(content);
    tabPane.appendChild(editForm);
    tabPane.appendChild(controls);

    return tabPane;
}

function createLanguageOptions(selectedLang) {
    return `
        <option value="en" ${selectedLang === 'en' ? 'selected' : ''}>English (Default)</option>
        <optgroup label="Indian Languages">
            <option value="hi" ${selectedLang === 'hi' ? 'selected' : ''}>हिन्दी (Hindi)</option>
            <option value="ta" ${selectedLang === 'ta' ? 'selected' : ''}>தமிழ் (Tamil)</option>
            <option value="te" ${selectedLang === 'te' ? 'selected' : ''}>తెలుగు (Telugu)</option>
            <option value="kn" ${selectedLang === 'kn' ? 'selected' : ''}>ಕನ್ನಡ (Kannada)</option>
            <option value="ml" ${selectedLang === 'ml' ? 'selected' : ''}>മലയാളം (Malayalam)</option>
            <option value="bn" ${selectedLang === 'bn' ? 'selected' : ''}>বাংলা (Bengali)</option>
            <option value="gu" ${selectedLang === 'gu' ? 'selected' : ''}>ગુજરાતી (Gujarati)</option>
            <option value="mr" ${selectedLang === 'mr' ? 'selected' : ''}>मराठी (Marathi)</option>
        </optgroup>
    `;
}

function createEditForm(alertData) {
    const form = document.createElement('form');
    form.className = 'edit-form';
    form.dataset.alertId = alertData.id;
    form.innerHTML = `
        <div class="form-group">
            <label for="edit-name-${alertData.id}">Alert Name:</label>
            <input type="text" id="edit-name-${alertData.id}" value="${alertData.name}" required>
        </div>
        <div class="form-group">
            <label for="edit-message-${alertData.id}">Message:</label>
            <textarea id="edit-message-${alertData.id}" required>${alertData.message}</textarea>
        </div>
        <div class="form-group">
            <label for="edit-language-${alertData.id}">Language:</label>
            <select id="edit-language-${alertData.id}">
                ${createLanguageOptions(alertData.language)}
            </select>
        </div>
        <div class="form-group">
            <label for="edit-time-${alertData.id}">Time:</label>
            <input type="time" id="edit-time-${alertData.id}" value="${alertData.time}" required>
        </div>
        <button type="submit">Save Changes</button>
    `;

    // Add validation to edit form
    const editMessageInput = document.getElementById(`edit-message-${alertData.id}`);
    const editLanguageSelect = document.getElementById(`edit-language-${alertData.id}`);

    editMessageInput.addEventListener('input', () => {
        const text = editMessageInput.value;
        const language = editLanguageSelect.value;

        if (text && !validateLanguageInput(text, language)) {
            showError(editMessageInput, `Please enter text in ${language === 'en' ? 'English' : editLanguageSelect.options[editLanguageSelect.selectedIndex].text}`);
        } else {
            clearError(editMessageInput);
        }
    });

    editLanguageSelect.addEventListener('change', () => {
        const text = editMessageInput.value;
        const language = editLanguageSelect.value;

        if (text && !validateLanguageInput(text, language)) {
            showError(editMessageInput, `Please enter text in ${language === 'en' ? 'English' : editLanguageSelect.options[editLanguageSelect.selectedIndex].text}`);
        } else {
            clearError(editMessageInput);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = document.getElementById(`edit-message-${alertData.id}`).value;
        const language = document.getElementById(`edit-language-${alertData.id}`).value;

        // Validate language before submitting
        if (!validateLanguageInput(message, language)) {
            showError(editMessageInput, `Please enter text in ${language === 'en' ? 'English' : editLanguageSelect.options[editLanguageSelect.selectedIndex].text}`);
            return;
        }

        const updatedData = {
            id: alertData.id,
            name: document.getElementById(`edit-name-${alertData.id}`).value,
            message: message,
            language: language,
            time: document.getElementById(`edit-time-${alertData.id}`).value
        };
        ipcRenderer.send('update-alert', updatedData);
    });

    return form;
}
