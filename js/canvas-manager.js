/**
 * Canvas Manager - Handles drawing functionality
 */
const CanvasManager = {
    // Canvas context
    drawingContext: null,
    
    // Drawing state
    isDrawing: false,
    currentTool: 'pen',
    currentColor: '#000000',
    currentSize: 5,
    
    // DOM References
    elements: {
        drawingCanvas: document.getElementById('drawingCanvas'),
        canvasContainer: document.querySelector('.canvas-wrapper'),
        penTool: document.getElementById('penTool'),
        highlighterTool: document.getElementById('highlighterTool'),
        eraserTool: document.getElementById('eraserTool'),
        colorPicker: document.getElementById('colorPicker'),
        sizeSlider: document.getElementById('sizeSlider'),
        clearCanvas: document.getElementById('clearCanvas'),
        saveCanvas: document.getElementById('saveCanvas')
    },

    /**
     * Initialize the canvas manager
     */
    init: function() {
        this.initializeCanvas();
        this.setupEventListeners();
    },

    /**
     * Initialize the drawing canvas
     */
    initializeCanvas: function() {
        // Set canvas size
        this.resizeCanvas();
        
        // Get canvas context
        this.drawingContext = this.elements.drawingCanvas.getContext('2d');
    },

    /**
     * Resize canvas to fit container
     */
    resizeCanvas: function() {
        const canvas = this.elements.drawingCanvas;
        const container = this.elements.canvasContainer;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    },

    /**
     * Set up event listeners for canvas-related elements
     */
    setupEventListeners: function() {
        // Resize canvas when window is resized
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Canvas event listeners
        const canvas = this.elements.drawingCanvas;
        canvas.addEventListener('mousedown', e => this.startDrawing(e));
        canvas.addEventListener('mousemove', e => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());
        canvas.addEventListener('touchstart', e => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', e => this.handleTouchMove(e));
        canvas.addEventListener('touchend', e => this.handleTouchEnd(e));
        
        // Drawing tool buttons
        this.elements.penTool.addEventListener('click', () => this.setActiveTool('pen'));
        this.elements.highlighterTool.addEventListener('click', () => this.setActiveTool('highlighter'));
        this.elements.eraserTool.addEventListener('click', () => this.setActiveTool('eraser'));
        
        // Color picker
        this.elements.colorPicker.addEventListener('change', e => {
            this.currentColor = e.target.value;
        });
        
        // Size slider
        this.elements.sizeSlider.addEventListener('input', e => {
            this.currentSize = e.target.value;
        });
        
        // Clear canvas button
        this.elements.clearCanvas.addEventListener('click', () => this.clearCanvas());
        
        // Save canvas button
        this.elements.saveCanvas.addEventListener('click', () => this.saveDrawing());
    },

    /**
     * Create a new drawing
     * @param {string} title - Title for the new drawing
     */
    createNewDrawing: function(title) {
        // Switch to canvas tab
        document.querySelector('.content .tab[data-tab="canvas"]').click();
        
        // Clear the canvas
        this.clearCanvas();
        
        // Create a blank drawing
        const drawing = {
            id: Utils.generateId(),
            title: title,
            content: '',
            type: 'drawing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        NoteManager.currentNote = drawing;
        
        Utils.showNotification('New Drawing', 'Create your drawing and click Save when done.');
    },

    /**
     * Load a drawing
     * @param {Object} drawing - Drawing object to load
     */
    loadDrawing: function(drawing) {
        if (!drawing || drawing.type !== 'drawing') return;
        
        // Clear the canvas
        this.clearCanvas();
        
        // Load the drawing if content exists
        if (drawing.content) {
            const img = new Image();
            img.onload = () => {
                this.drawingContext.drawImage(img, 0, 0);
            };
            img.src = drawing.content;
        }
    },

    /**
     * Save the current drawing
     */
    saveDrawing: function() {
        // Check if this is a new drawing or editing an existing one
        if (NoteManager.currentNote && NoteManager.currentNote.type === 'drawing') {
            // Update existing drawing
            NoteManager.currentNote.content = this.elements.drawingCanvas.toDataURL();
            NoteManager.currentNote.updatedAt = new Date().toISOString();
            
            // Update in data manager
            DataManager.updateDrawing(NoteManager.currentNote);
            
            // Show notification
            Utils.showNotification('Drawing Updated', 'Your drawing has been updated successfully.');
        } else {
            // Create a new drawing
            const title = prompt('Enter a title for your drawing', 'Untitled Drawing');
            if (title) {
                const drawing = {
                    id: Utils.generateId(),
                    title: title,
                    content: this.elements.drawingCanvas.toDataURL(),
                    type: 'drawing',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Add to data manager
                DataManager.addDrawing(drawing);
                
                // Update current note
                NoteManager.currentNote = drawing;
                
                // Show notification
                Utils.showNotification('Drawing Saved', 'Your drawing has been saved successfully.');
                
                // Refresh the notes list
                NoteManager.renderNotes();
            }
        }
    },

    /**
     * Set active drawing tool
     * @param {string} tool - Tool name ('pen', 'highlighter', or 'eraser')
     */
    setActiveTool: function(tool) {
        this.currentTool = tool;
        
        // Remove active class from all tool buttons
        document.querySelectorAll('.canvas-toolbar .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to the selected tool button
        document.getElementById(`${tool}Tool`).classList.add('active');
        
        // Set cursor style based on tool
        switch(tool) {
            case 'pen':
                this.elements.drawingCanvas.style.cursor = 'crosshair';
                break;
            case 'highlighter':
                this.elements.drawingCanvas.style.cursor = 'crosshair';
                break;
            case 'eraser':
                this.elements.drawingCanvas.style.cursor = 'cell';
                break;
        }
    },

    /**
     * Start drawing on canvas
     * @param {MouseEvent} e - Mouse event
     */
    startDrawing: function(e) {
        this.isDrawing = true;
        this.draw(e);
    },

    /**
     * Draw on canvas
     * @param {MouseEvent} e - Mouse event
     */
    draw: function(e) {
        if (!this.isDrawing) return;
        
        const rect = this.elements.drawingCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.drawingContext.lineCap = 'round';
        this.drawingContext.lineJoin = 'round';
        
        if (this.currentTool === 'highlighter') {
            this.drawingContext.globalAlpha = 0.3;
            this.drawingContext.lineWidth = this.currentSize * 2;
        } else {
            this.drawingContext.globalAlpha = 1;
            this.drawingContext.lineWidth = this.currentSize;
        }
        
        if (this.currentTool === 'eraser') {
            this.drawingContext.strokeStyle = '#ffffff';
        } else {
            this.drawingContext.strokeStyle = this.currentColor;
        }
        
        this.drawingContext.lineTo(x, y);
        this.drawingContext.stroke();
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(x, y);
    },

    /**
     * Handle touch events for drawing
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart: function(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.elements.drawingCanvas.dispatchEvent(mouseEvent);
        }
    },

    /**
     * Handle touch move events for drawing
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove: function(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.elements.drawingCanvas.dispatchEvent(mouseEvent);
        }
    },

    /**
     * Handle touch end events for drawing
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd: function(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        this.elements.drawingCanvas.dispatchEvent(mouseEvent);
    },

    /**
     * Stop drawing on canvas
     */
    stopDrawing: function() {
        this.isDrawing = false;
        this.drawingContext.beginPath();
    },

    /**
     * Clear the canvas
     */
    clearCanvas: function() {
        this.drawingContext.clearRect(
            0, 0, 
            this.elements.drawingCanvas.width, 
            this.elements.drawingCanvas.height
        );
    }
};