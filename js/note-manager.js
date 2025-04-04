/**
 * Note Manager - Handles note operations
 */
const NoteManager = {
    // Current active note
    currentNote: null,

    // DOM References
    elements: {
        noteTitleInput: document.getElementById('noteTitleInput'),
        noteContent: document.getElementById('noteContent'),
        notesList: document.getElementById('notesList'),
        noteEditor: document.getElementById('noteEditor'),
        saveNoteBtn: document.getElementById('saveNoteBtn'),
        deleteNoteBtn: document.getElementById('deleteNoteBtn'),
        editorToolbar: document.getElementById('editorToolbar')
    },

    /**
     * Initialize the note manager
     */
    init: function() {
        this.setupEventListeners();
        this.initializeEditor();
        this.renderNotes();
    },

    /**
     * Set up event listeners for note-related elements
     */
    setupEventListeners: function() {
        // Save note button
        this.elements.saveNoteBtn.addEventListener('click', () => this.saveCurrentNote());
        
        // Delete note button
        this.elements.deleteNoteBtn.addEventListener('click', () => this.deleteCurrentNote());
    },

    /**
     * Initialize the rich text editor
     */
    initializeEditor: function() {
        const toolbar = this.elements.editorToolbar;
        
        // Add event listeners to toolbar buttons
        toolbar.querySelectorAll('button[data-command]').forEach(button => {
            button.addEventListener('click', () => {
                const command = button.getAttribute('data-command');
                
                if (command === 'createLink') {
                    const url = prompt('Enter the link URL');
                    if (url) {
                        document.execCommand(command, false, url);
                    }
                } else {
                    document.execCommand(command, false, null);
                }
                
                // Update active state for formatting buttons
                if (['bold', 'italic', 'underline', 'strikeThrough'].includes(command)) {
                    button.classList.toggle('active');
                }
            });
        });
        
        // Font selector
        document.getElementById('fontSelect').addEventListener('change', (e) => {
            const font = e.target.value;
            if (font === 'default') {
                document.execCommand('fontName', false, 'Segoe UI');
            } else {
                document.execCommand('fontName', false, Utils.getFontFamily(font));
            }
        });
        
        // Font size selector
        document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
            document.execCommand('fontSize', false, e.target.value);
        });
        
        // Set reminder button
        toolbar.querySelector('button[title="Set Reminder"]').addEventListener('click', () => {
            this.openReminderModal();
        });
    },

    /**
     * Create a new note
     * @param {string} title - Title for the new note
     */
    createNewNote: function(title) {
        const note = {
            id: Utils.generateId(),
            title: title,
            content: '',
            type: 'note',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        DataManager.addNote(note);
        this.renderNotes();
        this.loadNote(note.id);
    },

    /**
     * Load a note by ID
     * @param {string} id - Note ID to load
     */
    loadNote: function(id) {
        // Find the note
        const note = DataManager.dataStore.notes.find(note => note.id === id);
        
        if (!note) return;
        
        this.currentNote = note;
        
        // Switch to editor tab if not already active
        document.querySelector('.content .tab[data-tab="editor"]').click();
        
        // If it's a drawing, load it in the canvas
        if (note.type === 'drawing') {
            // Switch to canvas tab
            document.querySelector('.content .tab[data-tab="canvas"]').click();
            
            // Load the drawing in canvas manager
            CanvasManager.loadDrawing(note);
        } else {
            // Show note editor, hide task editor
            this.elements.noteEditor.style.display = 'flex';
            document.getElementById('taskEditor').style.display = 'none';
            
            // Set note values
            this.elements.noteTitleInput.value = note.title;
            this.elements.noteContent.innerHTML = note.content;
        }
        
        // Update active state in the notes list
        const noteItems = document.querySelectorAll('#notesList .item');
        noteItems.forEach(item => {
            if (item.getAttribute('data-id') === id) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    /**
     * Save the current note
     */
    saveCurrentNote: function() {
        if (!this.currentNote) return;
        
        if (this.currentNote.type === 'drawing') {
            CanvasManager.saveDrawing();
            return;
        }
        
        // Update note properties
        this.currentNote.title = this.elements.noteTitleInput.value;
        this.currentNote.content = this.elements.noteContent.innerHTML;
        this.currentNote.updatedAt = new Date().toISOString();
        
        // Update note in data manager
        DataManager.updateNote(this.currentNote);
        
        // Refresh the notes list
        this.renderNotes();
        
        // Show notification
        Utils.showNotification('Note Saved', 'Your note has been saved successfully.');
    },

    /**
     * Delete the current note
     */
    deleteCurrentNote: function() {
        if (!this.currentNote) return;
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete "${this.currentNote.title}"?`)) {
            return;
        }
        
        // Delete note
        DataManager.deleteNote(this.currentNote.id);
        
        // Refresh the notes list
        this.renderNotes();
        
        // Load another note if available
        if (DataManager.dataStore.notes.length > 0) {
            this.loadNote(DataManager.dataStore.notes[0].id);
        } else {
            // Create a blank note if no notes exist
            this.createNewNote('Untitled Note');
        }
        
        // Show notification
        Utils.showNotification('Note Deleted', 'Your note has been deleted successfully.');
    },

    /**
     * Render the notes list
     */
    renderNotes: function() {
        this.elements.notesList.innerHTML = '';
        
        // Get sorted notes
        const sortedNotes = DataManager.getSortedNotes();
        
        sortedNotes.forEach(note => {
            const item = document.createElement('li');
            item.className = 'item';
            item.setAttribute('data-id', note.id);
            
            if (this.currentNote && this.currentNote.id === note.id) {
                item.classList.add('active');
            }
            
            // Create icon based on note type
            let icon = '📝';
            if (note.type === 'drawing') {
                icon = '🎨';
            }
            
            const date = new Date(note.updatedAt).toLocaleString();
            
            item.innerHTML = `
                <div>
                    <div class="item-title">${icon} ${note.title}</div>
                    <div class="item-date">Updated: ${date}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.loadNote(note.id);
            });
            
            this.elements.notesList.appendChild(item);
        });
    },

    /**
     * Render filtered notes based on search term
     * @param {Array} filteredNotes - Array of filtered notes
     */
    renderFilteredNotes: function(filteredNotes) {
        this.elements.notesList.innerHTML = '';
        
        filteredNotes.forEach(note => {
            const item = document.createElement('li');
            item.className = 'item';
            item.setAttribute('data-id', note.id);
            
            if (this.currentNote && this.currentNote.id === note.id) {
                item.classList.add('active');
            }
            
            // Create icon based on note type
            let icon = '📝';
            if (note.type === 'drawing') {
                icon = '🎨';
            }
            
            const date = new Date(note.updatedAt).toLocaleString();
            
            item.innerHTML = `
                <div>
                    <div class="item-title">${icon} ${note.title}</div>
                    <div class="item-date">Updated: ${date}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.loadNote(note.id);
            });
            
            this.elements.notesList.appendChild(item);
        });
    },

    /**
     * Open reminder modal
     */
    openReminderModal: function() {
        if (!this.currentNote) return;

        Utils.openModal('reminderModal');
        
        // Set default values
        document.getElementById('reminderTitle').value = this.currentNote.title;
        
        // Set default date/time to tomorrow at 9 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        const dateTimeString = tomorrow.toISOString().slice(0, 16);
        document.getElementById('reminderDateTime').value = dateTimeString;
        
        document.getElementById('reminderRepeat').value = 'none';
        document.getElementById('customRepeatContainer').style.display = 'none';
    }
};