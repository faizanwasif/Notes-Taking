/**
 * Main application file for NotePal
 * Initializes all components and sets up the application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    App.init();
});

/**
 * Main App object
 */
const App = {
    /**
     * Initialize the application
     */
    init: function() {
        console.log('Initializing NotePal v1.0.0');
        
        // Initialize data manager
        DataManager.init();
        
        // Initialize UI components
        UIManager.init();
        NoteManager.init();
        TaskManager.init();
        CanvasManager.init();
        
        // Apply settings
        UIManager.applySettings();
        
        // Set up reminders
        this.setupReminders();
        
        // Load initial content
        this.loadInitialContent();
        
        // Check URL parameters
        this.handleUrlParameters();
    },

    /**
     * Set up reminders
     */
    setupReminders: function() {
        // Request notification permission
        Utils.requestNotificationPermission();
        
        // Check for pending reminders
        UIManager.checkReminders();
    },

    /**
     * Load initial content
     */
    loadInitialContent: function() {
        // Create a blank note if no notes exist
        if (DataManager.dataStore.notes.length === 0) {
            NoteManager.createNewNote('Welcome to NotePal');
        } else {
            // Load the first note
            NoteManager.loadNote(DataManager.dataStore.notes[0].id);
        }
    },

    /**
     * Handle URL parameters for deep linking
     */
    handleUrlParameters: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action) {
            switch (action) {
                case 'new-note':
                    Utils.openModal('newItemModal');
                    document.getElementById('newItemType').value = 'note';
                    break;
                    
                case 'new-task':
                    Utils.openModal('newItemModal');
                    document.getElementById('newItemType').value = 'task';
                    break;
                    
                case 'view-note':
                    const noteId = urlParams.get('id');
                    if (noteId) {
                        NoteManager.loadNote(noteId);
                    }
                    break;
                    
                case 'view-task':
                    const taskId = urlParams.get('id');
                    if (taskId) {
                        TaskManager.loadTask(taskId);
                    }
                    break;
            }
        }
    }
    
};