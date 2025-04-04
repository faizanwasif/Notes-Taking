/**
 * UI Manager - Handles UI interactions and events
 */
const UIManager = {
    // Auto-save timer
    autoSaveTimer: null,
    
    // Current item type
    currentItemType: 'note',
    
    // DOM References
    elements: {
        sidebar: document.querySelector('.sidebar'),
        sidebarToggle: document.querySelector('.sidebar-toggle'),
        searchInput: document.getElementById('searchInput'),
        newItemBtn: document.getElementById('newItemBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        syncBtn: document.getElementById('syncBtn'),
        installBtn: document.getElementById('installBtn'),
        themeToggle: document.getElementById('themeToggle'),
        createItemBtn: document.getElementById('createItemBtn'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),
        viewShortcutsBtn: document.getElementById('viewShortcutsBtn'),
        saveShortcutsBtn: document.getElementById('saveShortcutsBtn'),
        exportDataBtn: document.getElementById('exportDataBtn'),
        importDataBtn: document.getElementById('importDataBtn'),
        importFileInput: document.getElementById('importFileInput'),
        saveReminderBtn: document.getElementById('saveReminderBtn'),
        reminderRepeat: document.getElementById('reminderRepeat')
    },

    /**
     * Initialize UI manager
     */
    init: function() {
        this.setupEventListeners();
        this.setupTabs();
        this.setupModals();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
        this.initializeInstallPrompt();
    },

    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners: function() {
        // Sidebar toggle
        this.elements.sidebarToggle.addEventListener('click', () => {
            this.elements.sidebar.classList.toggle('collapsed');
        });
        
        // Search functionality
        this.elements.searchInput.addEventListener('input', () => {
            this.handleSearch();
        });
        
        // New item button
        this.elements.newItemBtn.addEventListener('click', () => {
            Utils.openModal('newItemModal');
        });
        
        // Create new item
        this.elements.createItemBtn.addEventListener('click', () => {
            this.createNewItem();
        });
        
        // Settings button
        this.elements.settingsBtn.addEventListener('click', () => {
            this.openSettings();
        });
        
        // Save settings
        this.elements.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
        });
        
        // View shortcuts button
        this.elements.viewShortcutsBtn.addEventListener('click', () => {
            Utils.closeModal('settingsModal');
            Utils.openModal('shortcutsModal');
            
            // Set current shortcut values
            document.getElementById('newNoteShortcutInput').value = DataManager.dataStore.settings.shortcuts.newNote;
            document.getElementById('newTaskShortcutInput').value = DataManager.dataStore.settings.shortcuts.newTask;
        });
        
        // Save shortcuts
        this.elements.saveShortcutsBtn.addEventListener('click', () => {
            this.saveShortcuts();
        });
        
        // Export data
        this.elements.exportDataBtn.addEventListener('click', () => {
            DataManager.exportData();
        });
        
        // Import data
        this.elements.importDataBtn.addEventListener('click', () => {
            this.elements.importFileInput.click();
        });
        
        this.elements.importFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                DataManager.importData(e.target.files[0]);
            }
        });
        
        // Sync button
        this.elements.syncBtn.addEventListener('click', () => {
            Utils.showNotification('Data Synced', 'Your data has been saved locally. Cloud sync will be available in a future update.');
        });
        
        // Save reminder
        this.elements.saveReminderBtn.addEventListener('click', () => {
            this.saveReminder();
        });
        
        // Custom repeat option
        this.elements.reminderRepeat.addEventListener('change', (e) => {
            const customRepeatContainer = document.getElementById('customRepeatContainer');
            customRepeatContainer.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
        
        // Theme toggle
        this.elements.themeToggle.addEventListener('change', () => {
            this.toggleTheme();
        });

        // Install button
        this.elements.installBtn.addEventListener('click', () => {
            this.installPWA();
        });
    },

    /**
     * Initialize tabs
     */
    setupTabs: function() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Get the parent tab container
                const tabContainer = tab.parentElement;
                
                // Remove active class from all tabs in this container
                tabContainer.querySelectorAll('.tab').forEach(t => {
                    t.classList.remove('active');
                });
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Get the tab content id
                const tabId = tab.getAttribute('data-tab');
                
                // If this is in the main tab container
                if (tabContainer.parentElement.classList.contains('sidebar')) {
                    // Handle sidebar tabs (Notes/Tasks)
                    document.querySelectorAll('.sidebar .tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    document.getElementById(`${tabId}Content`).classList.add('active');
                } else {
                    // Handle content tabs (Editor/Canvas)
                    document.querySelectorAll('.content .tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    document.getElementById(`${tabId}Content`).classList.add('active');
                    
                    // If switching to canvas tab, reset the canvas
                    if (tabId === 'canvas') {
                        // Resize canvas to fit container
                        CanvasManager.resizeCanvas();
                    }
                }
            });
        });
    },

    /**
     * Set up modals
     */
    setupModals: function() {
        // Close modals when clicking on the close button or outside the modal
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(element => {
            element.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                Utils.closeModal(modal.id);
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Utils.closeModal(modal.id);
                }
            });
        });
    },

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts: function() {
        // Remove existing event listener
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        
        // Add new event listener
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    },

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts: function(e) {
        // Parse shortcut from the event
        const shortcut = Utils.getShortcutFromEvent(e);
        
        // Don't trigger shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        // Match shortcuts
        if (shortcut === DataManager.dataStore.settings.shortcuts.newNote) {
            e.preventDefault();
            Utils.openModal('newItemModal');
            document.getElementById('newItemType').value = 'note';
        } else if (shortcut === DataManager.dataStore.settings.shortcuts.newTask) {
            e.preventDefault();
            Utils.openModal('newItemModal');
            document.getElementById('newItemType').value = 'task';
        } else if (shortcut === 'Ctrl+S') {
            e.preventDefault();
            if (UIManager.currentItemType === 'note') {
                NoteManager.saveCurrentNote();
            } else if (UIManager.currentItemType === 'task') {
                TaskManager.saveCurrentTask();
            }
        } else if (shortcut === 'Ctrl+B' && !e.target.isContentEditable) {
            e.preventDefault();
            UIManager.elements.sidebar.classList.toggle('collapsed');
        } else if (shortcut === 'Ctrl+F') {
            e.preventDefault();
            UIManager.elements.searchInput.focus();
        }
    },

    /**
     * Set up auto-save
     */
    setupAutoSave: function() {
        // Clear existing timer
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        // Get auto-save interval from settings
        const autoSaveInterval = DataManager.dataStore.settings.autoSaveInterval;
        
        // Set new timer
        this.autoSaveTimer = setInterval(() => {
            if (this.currentItemType === 'note' && NoteManager.currentNote) {
                // Auto-save note if content has changed
                const noteTitleInput = document.getElementById('noteTitleInput');
                const noteContent = document.getElementById('noteContent');
                
                if (noteTitleInput.value !== NoteManager.currentNote.title || 
                    noteContent.innerHTML !== NoteManager.currentNote.content) {
                    NoteManager.saveCurrentNote();
                }
            } else if (this.currentItemType === 'task' && TaskManager.currentTask) {
                // Auto-save task if content has changed
                const taskTitleInput = document.getElementById('taskTitleInput');
                const taskDueDateInput = document.getElementById('taskDueDateInput');
                const taskPrioritySelect = document.getElementById('taskPrioritySelect');
                const taskCategorySelect = document.getElementById('taskCategorySelect');
                const taskDescription = document.getElementById('taskDescription');
                
                if (taskTitleInput.value !== TaskManager.currentTask.title || 
                    taskDueDateInput.value !== TaskManager.currentTask.dueDate ||
                    taskPrioritySelect.value !== TaskManager.currentTask.priority ||
                    taskCategorySelect.value !== TaskManager.currentTask.category ||
                    taskDescription.innerHTML !== TaskManager.currentTask.description) {
                    TaskManager.saveCurrentTask();
                }
            }
        }, autoSaveInterval * 1000);
    },

    /**
     * Initialize install prompt for PWA
     */
    initializeInstallPrompt: function() {
        // Variable to store the deferred prompt event
        let deferredPrompt;

        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            // Show install button
            this.elements.installBtn.style.display = 'block';
            
            // Show notification that app can be installed
            Utils.showNotification(
                'Install NotePal',
                'NotePal can be installed on your device for offline use.',
                {
                    text: 'Install',
                    callback: () => {
                        // Hide the notification
                        Utils.hideNotification();
                        // Show install prompt
                        this.installPWA(deferredPrompt);
                    }
                }
            );
        });

        // When the PWA is successfully installed
        window.addEventListener('appinstalled', (event) => {
            console.log('NotePal was installed.');
            Utils.showNotification('Installation Complete', 'NotePal has been successfully installed!');
            
            // Hide install button as it's no longer needed
            this.elements.installBtn.style.display = 'none';
            // Clear the deferred prompt
            deferredPrompt = null;
        });
    },

    /**
     * Handle PWA installation
     * @param {BeforeInstallPromptEvent} promptEvent - The beforeinstallprompt event
     */
    installPWA: function(promptEvent) {
        // Get the stored prompt event
        const deferredPrompt = promptEvent || window.deferredPrompt;
        
        if (!deferredPrompt) {
            // The deferred prompt isn't available
            alert('Installation is not available. Make sure you\'re using a supported browser and the app is served over HTTPS.');
            return;
        }
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the installation prompt');
                Utils.showNotification('Installation Started', 'NotePal is being installed on your device.');
            } else {
                console.log('User dismissed the installation prompt');
            }
            // Clear the saved prompt since it can't be used again
            window.deferredPrompt = null;
            // Hide install button
            this.elements.installBtn.style.display = 'none';
        });
    },

    /**
     * Create a new item
     */
    createNewItem: function() {
        const type = document.getElementById('newItemType').value;
        const title = document.getElementById('newItemTitle').value || 'Untitled';
        
        Utils.closeModal('newItemModal');
        
        switch (type) {
            case 'note':
                NoteManager.createNewNote(title);
                this.currentItemType = 'note';
                break;
            case 'task':
                TaskManager.createNewTask(title);
                this.currentItemType = 'task';
                break;
            case 'drawing':
                CanvasManager.createNewDrawing(title);
                this.currentItemType = 'drawing';
                break;
        }
        
        // Clear the input field for next time
        document.getElementById('newItemTitle').value = '';
    },

    /**
     * Open settings modal
     */
    openSettings: function() {
        Utils.openModal('settingsModal');
        
        // Set current settings values
        this.elements.themeToggle.checked = DataManager.dataStore.settings.theme === 'dark';
        document.getElementById('defaultFontSetting').value = DataManager.dataStore.settings.defaultFont;
        document.getElementById('autoSaveInterval').value = DataManager.dataStore.settings.autoSaveInterval;
    },

    /**
     * Save settings
     */
    saveSettings: function() {
        // Save settings
        const newSettings = {
            theme: this.elements.themeToggle.checked ? 'dark' : 'light',
            defaultFont: document.getElementById('defaultFontSetting').value,
            autoSaveInterval: parseInt(document.getElementById('autoSaveInterval').value)
        };
        
        // Update settings in data manager
        DataManager.updateSettings(newSettings);
        
        // Apply settings
        this.applySettings();
        
        // Close modal
        Utils.closeModal('settingsModal');
        
        // Show notification
        Utils.showNotification('Settings Saved', 'Your settings have been saved successfully.');
    },

    /**
     * Apply current settings
     */
    applySettings: function() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', DataManager.dataStore.settings.theme);
        
        // Apply auto-save interval
        this.setupAutoSave();
    },

    /**
     * Save keyboard shortcuts
     */
    saveShortcuts: function() {
        // Save shortcuts
        const shortcuts = {
            newNote: document.getElementById('newNoteShortcutInput').value,
            newTask: document.getElementById('newTaskShortcutInput').value
        };
        
        // Update settings in data manager
        DataManager.dataStore.settings.shortcuts = shortcuts;
        DataManager.saveData();
        
        // Update keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Close modal
        Utils.closeModal('shortcutsModal');
        
        // Show notification
        Utils.showNotification('Shortcuts Saved', 'Your keyboard shortcuts have been saved successfully.');
    },

    /**
     * Toggle theme between light and dark
     */
    toggleTheme: function() {
        const theme = this.elements.themeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        DataManager.dataStore.settings.theme = theme;
        DataManager.saveData();
    },

    /**
     * Handle search functionality
     */
    handleSearch: function() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        
        if (searchTerm.length > 0) {
            // Search notes and tasks
            const searchResults = DataManager.search(searchTerm);
            
            // Render filtered results
            NoteManager.renderFilteredNotes(searchResults.notes);
            TaskManager.renderFilteredTasks(searchResults.tasks);
        } else {
            // Render all notes and tasks
            NoteManager.renderNotes();
            TaskManager.renderTasks();
        }
    },

    /**
     * Save a reminder
     */
    saveReminder: function() {
        const title = document.getElementById('reminderTitle').value;
        const dateTime = document.getElementById('reminderDateTime').value;
        const repeat = document.getElementById('reminderRepeat').value;
        const customRepeatDays = parseInt(document.getElementById('customRepeatDays').value);
        
        // Create reminder object
        const reminder = {
            id: Utils.generateId(),
            title: title,
            dateTime: dateTime,
            repeat: repeat,
            customRepeatDays: repeat === 'custom' ? customRepeatDays : null,
            itemId: this.currentItemType === 'note' ? 
                NoteManager.currentNote.id : 
                TaskManager.currentTask.id,
            itemType: this.currentItemType,
            createdAt: new Date().toISOString()
        };
        
        // Add to reminders array
        DataManager.dataStore.reminders.push(reminder);
        
        // Save to local storage
        DataManager.saveData();
        
        // Close modal
        Utils.closeModal('reminderModal');
        
        // Schedule the reminder
        this.scheduleReminder(reminder);
        
        // Show notification
        Utils.showNotification('Reminder Set', `You will be reminded about "${title}" on ${new Date(dateTime).toLocaleString()}.`);
    },

    /**
     * Schedule a reminder
     * @param {Object} reminder - Reminder object
     */
    scheduleReminder: function(reminder) {
        // Calculate time until reminder
        const now = new Date();
        const reminderTime = new Date(reminder.dateTime);
        const timeUntilReminder = reminderTime - now;
        
        // Only schedule if it's in the future
        if (timeUntilReminder > 0) {
            setTimeout(() => {
                // Show notification
                this.showReminderNotification(reminder);
                
                // If it's a repeating reminder, schedule the next one
                if (reminder.repeat !== 'none') {
                    const nextReminder = {...reminder};
                    
                    // Calculate next reminder time based on repeat type
                    const nextReminderTime = new Date(reminderTime);
                    
                    switch (reminder.repeat) {
                        case 'daily':
                            nextReminderTime.setDate(nextReminderTime.getDate() + 1);
                            break;
                        case 'weekly':
                            nextReminderTime.setDate(nextReminderTime.getDate() + 7);
                            break;
                        case 'monthly':
                            nextReminderTime.setMonth(nextReminderTime.getMonth() + 1);
                            break;
                        case 'custom':
                            nextReminderTime.setDate(nextReminderTime.getDate() + reminder.customRepeatDays);
                            break;
                    }
                    
                    nextReminder.dateTime = nextReminderTime.toISOString();
                    nextReminder.id = Utils.generateId();
                    
                    // Add to reminders array
                    DataManager.dataStore.reminders.push(nextReminder);
                    
                    // Save to local storage
                    DataManager.saveData();
                    
                    // Schedule the next reminder
                    this.scheduleReminder(nextReminder);
                }
            }, timeUntilReminder);
        }
    },

    /**
     * Show a reminder notification
     * @param {Object} reminder - Reminder object
     */
    showReminderNotification: function(reminder) {
        // Show in-app notification
        Utils.showNotification(
            reminder.title, 
            `Reminder for your ${reminder.itemType}`,
            {
                text: 'View',
                callback: () => {
                    // Load the associated item
                    if (reminder.itemType === 'note') {
                        NoteManager.loadNote(reminder.itemId);
                    } else if (reminder.itemType === 'task') {
                        TaskManager.loadTask(reminder.itemId);
                    }
                }
            }
        );
        
        // Show browser notification if permission is granted
        Utils.showBrowserNotification(reminder, (itemType, itemId) => {
            // Load the associated item
            if (itemType === 'note') {
                NoteManager.loadNote(itemId);
            } else if (itemType === 'task') {
                TaskManager.loadTask(itemId);
            }
        });
    },

    /**
     * Check for pending reminders on app load
     */
    checkReminders: function() {
        DataManager.dataStore.reminders.forEach(reminder => {
            this.scheduleReminder(reminder);
        });
    }
};