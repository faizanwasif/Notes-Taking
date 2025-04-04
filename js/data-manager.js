/**
 * Data Manager - Handles data storage, retrieval, import/export
 */
const DataManager = {
    // Data store object containing all application data
    dataStore: {
        notes: [],
        tasks: [],
        drawings: [],
        reminders: [],
        settings: {
            theme: 'light',
            defaultFont: 'default',
            autoSaveInterval: 30,
            shortcuts: {
                newNote: 'Ctrl+Alt+N',
                newTask: 'Ctrl+Alt+T'
            },
            availableThemes: ['light', 'dark', 'blue', 'sepia', 'high-contrast']
        }
    },

    /**
     * Initialize data manager
     */
    init: function() {
        this.loadData();
    },

    /**
     * Load data from local storage
     */
    loadData: function() {
        try {
            const data = localStorage.getItem('notePalData');
            if (data) {
                this.dataStore = JSON.parse(data);
                
                // Ensure all required arrays and objects exist
                this.dataStore.notes = this.dataStore.notes || [];
                this.dataStore.tasks = this.dataStore.tasks || [];
                this.dataStore.drawings = this.dataStore.drawings || [];
                this.dataStore.reminders = this.dataStore.reminders || [];

                // Ensure settings object is complete
                this.dataStore.settings = this.dataStore.settings || {};
                this.dataStore.settings.theme = this.dataStore.settings.theme || 'light';
                this.dataStore.settings.defaultFont = this.dataStore.settings.defaultFont || 'default';
                this.dataStore.settings.autoSaveInterval = this.dataStore.settings.autoSaveInterval || 30;
                this.dataStore.settings.shortcuts = this.dataStore.settings.shortcuts || {
                    newNote: 'Ctrl+Alt+N',
                    newTask: 'Ctrl+Alt+T'
                };
                this.dataStore.settings.availableThemes = this.dataStore.settings.availableThemes || ['light', 'dark', 'blue', 'sepia', 'high-contrast'];
            }
        } catch (error) {
            console.error('Error loading data from local storage:', error);
            Utils.showNotification('Error', 'Failed to load your data. Please check the console for details.');
        }
    },

    /**
     * Save data to local storage
     */
    saveData: function() {
        try {
            localStorage.setItem('notePalData', JSON.stringify(this.dataStore));
            // Register background sync if available
            this.registerSync();
        } catch (error) {
            console.error('Error saving data to local storage:', error);
            Utils.showNotification('Error', 'Failed to save your data. Please check the console for details.');
        }
    },

    /**
     * Get notes sorted by update date (most recent first)
     * @returns {Array} Sorted notes array
     */
    getSortedNotes: function() {
        return [...this.dataStore.notes].sort((a, b) => {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
    },

    /**
     * Get tasks sorted by due date (closest first)
     * @returns {Array} Sorted tasks array
     */
    getSortedTasks: function() {
        return [...this.dataStore.tasks].sort((a, b) => {
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    },

    /**
     * Add a new note
     * @param {Object} note - Note object to add
     */
    addNote: function(note) {
        this.dataStore.notes.unshift(note);
        this.saveData();
    },

    /**
     * Update an existing note
     * @param {Object} note - Note object to update
     */
    updateNote: function(note) {
        const index = this.dataStore.notes.findIndex(n => n.id === note.id);
        if (index !== -1) {
            this.dataStore.notes[index] = note;
            this.saveData();
        }
    },

    /**
     * Delete a note by ID
     * @param {string} id - Note ID to delete
     * @returns {boolean} Success status
     */
    deleteNote: function(id) {
        const index = this.dataStore.notes.findIndex(note => note.id === id);
        if (index !== -1) {
            this.dataStore.notes.splice(index, 1);
            
            // If it's a drawing, also remove it from drawings array
            const drawingIndex = this.dataStore.drawings.findIndex(drawing => drawing.id === id);
            if (drawingIndex !== -1) {
                this.dataStore.drawings.splice(drawingIndex, 1);
            }
            
            this.saveData();
            return true;
        }
        return false;
    },

    /**
     * Add a new task
     * @param {Object} task - Task object to add
     */
    addTask: function(task) {
        this.dataStore.tasks.unshift(task);
        this.saveData();
    },

    /**
     * Update an existing task
     * @param {Object} task - Task object to update
     */
    updateTask: function(task) {
        const index = this.dataStore.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            this.dataStore.tasks[index] = task;
            this.saveData();
        }
    },

    /**
     * Delete a task by ID
     * @param {string} id - Task ID to delete
     * @returns {boolean} Success status
     */
    deleteTask: function(id) {
        const index = this.dataStore.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
            this.dataStore.tasks.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    },

    /**
     * Add a new drawing
     * @param {Object} drawing - Drawing object to add
     */
    addDrawing: function(drawing) {
        this.dataStore.drawings.unshift(drawing);
        this.dataStore.notes.unshift(drawing); // Also add to notes
        this.saveData();
    },

    /**
     * Update an existing drawing
     * @param {Object} drawing - Drawing object to update
     */
    updateDrawing: function(drawing) {
        // Update in drawings array
        const drawingIndex = this.dataStore.drawings.findIndex(d => d.id === drawing.id);
        if (drawingIndex !== -1) {
            this.dataStore.drawings[drawingIndex] = drawing;
        }
        
        // Also update in notes array
        const noteIndex = this.dataStore.notes.findIndex(n => n.id === drawing.id);
        if (noteIndex !== -1) {
            this.dataStore.notes[noteIndex] = drawing;
        }
        
        this.saveData();
    },

    /**
     * Add a new reminder
     * @param {Object} reminder - Reminder object to add
     */
    addReminder: function(reminder) {
        this.dataStore.reminders.push(reminder);
        this.saveData();
    },

    /**
     * Update settings
     * @param {Object} settings - Settings object to save
     */
    updateSettings: function(settings) {
        this.dataStore.settings = { ...this.dataStore.settings, ...settings };
        this.saveData();
    },

    /**
     * Export all data to a JSON file
     */
    exportData: function() {
        try {
            const dataStr = JSON.stringify(this.dataStore);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'notepal-data.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            Utils.showNotification('Data Exported', 'Your data has been exported successfully.');
        } catch (error) {
            console.error('Error exporting data:', error);
            Utils.showNotification('Error', 'Failed to export your data. Please check the console for details.');
        }
    },

    /**
     * Import data from a JSON file
     * @param {File} file - JSON file to import
     */
    importData: function(file) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (!importedData.notes || !Array.isArray(importedData.notes) ||
                        !importedData.tasks || !Array.isArray(importedData.tasks)) {
                        throw new Error('Invalid data format');
                    }
                    
                    // Ask for confirmation
                    if (confirm('Importing data will replace all your current data. Continue?')) {
                        this.dataStore = importedData;
                        
                        // Ensure all required arrays and objects exist
                        this.dataStore.notes = this.dataStore.notes || [];
                        this.dataStore.tasks = this.dataStore.tasks || [];
                        this.dataStore.drawings = this.dataStore.drawings || [];
                        this.dataStore.reminders = this.dataStore.reminders || [];
                        this.dataStore.settings = this.dataStore.settings || {
                            theme: 'light',
                            defaultFont: 'default',
                            autoSaveInterval: 30,
                            shortcuts: {
                                newNote: 'Ctrl+Alt+N',
                                newTask: 'Ctrl+Alt+T'
                            }
                        };
                        
                        // Save to local storage
                        this.saveData();
                        
                        // Reload the page to apply all changes
                        window.location.reload();
                    }
                } catch (error) {
                    console.error('Error parsing imported data:', error);
                    Utils.showNotification('Error', 'Failed to import data. Invalid file format.');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Error importing data:', error);
            Utils.showNotification('Error', 'Failed to import your data. Please check the console for details.');
        }
    },

    /**
     * Register background sync if available
     */
    registerSync: function() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.sync.register('sync-notes')
                    .catch(err => console.error('Background sync registration failed:', err));
            });
        }
    },

    /**
     * Search notes and tasks
     * @param {string} searchTerm - Term to search for
     * @returns {Object} Object containing filtered notes and tasks
     */
    search: function(searchTerm) {
        const term = searchTerm.toLowerCase();
        
        const filteredNotes = this.dataStore.notes.filter(note => 
            note.title.toLowerCase().includes(term) || 
            (note.content && note.content.toLowerCase().includes(term))
        );
        
        const filteredTasks = this.dataStore.tasks.filter(task => 
            task.title.toLowerCase().includes(term) || 
            (task.description && task.description.toLowerCase().includes(term))
        );
        
        return {
            notes: filteredNotes,
            tasks: filteredTasks
        };
    }
};