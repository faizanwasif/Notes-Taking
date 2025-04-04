/**
 * OCR Manager - Handles Optical Character Recognition functionality
 * Requires Tesseract.js: npm install tesseract.js
 */
const OCRManager = {
    // Reference to Tesseract worker
    worker: null,
    
    // Status of OCR engine
    isInitialized: false,
    isProcessing: false,
    
    // DOM References
    elements: {
        ocrButton: null,
        ocrFileInput: null,
        ocrCameraButton: null,
        ocrLoadingIndicator: null,
        cameraPreview: null,
        cameraCaptureButton: null,
        cameraContainer: null
    },

    /**
     * Initialize the OCR manager
     */
    init: async function() {
        // Import Tesseract.js dynamically to avoid loading it unless needed
        const { createWorker } = await import('tesseract.js');
        
        // Create OCR button in toolbar
        this.createOCRInterface();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Create a worker instance that will be initialized when needed
        this.worker = createWorker({
            logger: m => {
                console.log(m);
                this.updateProgressIndicator(m);
            },
            // Cache the language data in IndexedDB for offline use
            cacheMethod: 'indexeddb'
        });
    },

    /**
     * Create OCR interface components
     */
    createOCRInterface: function() {
        // Add OCR button to the editor toolbar
        const editorToolbar = document.getElementById('editorToolbar');
        
        const ocrButton = document.createElement('button');
        ocrButton.title = "Extract Text from Image";
        ocrButton.innerHTML = "🔍 OCR";
        ocrButton.className = "ocr-button";
        editorToolbar.appendChild(ocrButton);
        
        // Create hidden file input for image upload
        const ocrFileInput = document.createElement('input');
        ocrFileInput.type = 'file';
        ocrFileInput.accept = 'image/*';
        ocrFileInput.style.display = 'none';
        document.body.appendChild(ocrFileInput);
        
        // Create OCR loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'ocr-loading';
        loadingIndicator.innerHTML = `
            <div class="ocr-loading-overlay">
                <div class="ocr-loading-content">
                    <div class="spinner"></div>
                    <div class="ocr-status">Initializing OCR engine...</div>
                    <div class="ocr-progress">0%</div>
                </div>
            </div>
        `;
        loadingIndicator.style.display = 'none';
        document.body.appendChild(loadingIndicator);
        
        // Create camera UI elements (hidden initially)
        const cameraContainer = document.createElement('div');
        cameraContainer.className = 'camera-container';
        cameraContainer.innerHTML = `
            <div class="camera-overlay">
                <div class="camera-content">
                    <video id="camera-preview" autoplay playsinline></video>
                    <div class="camera-controls">
                        <button id="capture-button">📸 Capture</button>
                        <button id="camera-close-button">❌ Close</button>
                    </div>
                </div>
            </div>
        `;
        cameraContainer.style.display = 'none';
        document.body.appendChild(cameraContainer);
        
        // Store references to created elements
        this.elements.ocrButton = ocrButton;
        this.elements.ocrFileInput = ocrFileInput;
        this.elements.ocrLoadingIndicator = loadingIndicator;
        this.elements.cameraPreview = document.getElementById('camera-preview');
        this.elements.cameraCaptureButton = document.getElementById('capture-button');
        this.elements.cameraCloseButton = document.getElementById('camera-close-button');
        this.elements.cameraContainer = cameraContainer;
    },

    /**
     * Set up event listeners for OCR components
     */
    setupEventListeners: function() {
        // OCR button click - show options menu
        this.elements.ocrButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.showOCROptions();
        });
        
        // File input change - process selected image
        this.elements.ocrFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.processImageFromFile(e.target.files[0]);
            }
        });
        
        // Camera capture button
        this.elements.cameraCaptureButton.addEventListener('click', () => {
            this.captureImage();
        });
        
        // Camera close button
        this.elements.cameraCloseButton.addEventListener('click', () => {
            this.closeCamera();
        });
    },

    /**
     * Show OCR options menu (upload image or use camera)
     */
    showOCROptions: function() {
        // Create a simple dropdown menu
        const rect = this.elements.ocrButton.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'ocr-menu';
        menu.innerHTML = `
            <div class="ocr-menu-item" id="ocr-upload">📁 Upload Image</div>
            <div class="ocr-menu-item" id="ocr-camera">📷 Take Photo</div>
        `;
        
        // Position the menu below the button
        menu.style.position = 'absolute';
        menu.style.top = `${rect.bottom}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '1000';
        
        // Add click handlers
        document.body.appendChild(menu);
        
        document.getElementById('ocr-upload').addEventListener('click', () => {
            this.elements.ocrFileInput.click();
            document.body.removeChild(menu);
        });
        
        document.getElementById('ocr-camera').addEventListener('click', () => {
            this.openCamera();
            document.body.removeChild(menu);
        });
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== this.elements.ocrButton) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Use setTimeout to avoid immediate triggering
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    },

    /**
     * Open camera for capturing images
     */
    openCamera: async function() {
        try {
            // Check if camera is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                Utils.showNotification('Camera Error', 'Camera access is not supported in your browser.');
                return;
            }
            
            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } // Use back camera if available
            });
            
            // Show camera container
            this.elements.cameraContainer.style.display = 'block';
            
            // Set video source
            this.elements.cameraPreview.srcObject = stream;
            
            // Store stream for later cleanup
            this.cameraStream = stream;
        } catch (error) {
            console.error('Camera access error:', error);
            Utils.showNotification('Camera Error', 'Failed to access camera. Please check permissions.');
        }
    },

    /**
     * Close camera and release resources
     */
    closeCamera: function() {
        // Hide camera container
        this.elements.cameraContainer.style.display = 'none';
        
        // Stop camera stream if active
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        // Clear video source
        if (this.elements.cameraPreview.srcObject) {
            this.elements.cameraPreview.srcObject = null;
        }
    },

    /**
     * Capture image from camera
     */
    captureImage: function() {
        if (!this.cameraStream) return;
        
        // Create a canvas to capture the image
        const canvas = document.createElement('canvas');
        const video = this.elements.cameraPreview;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        canvas.toBlob(blob => {
            // Close camera
            this.closeCamera();
            
            // Process the image
            this.processImageFromFile(blob);
        }, 'image/jpeg', 0.95);
    },

    /**
     * Process an image file with OCR
     * @param {File|Blob} file - Image file to process
     */
    processImageFromFile: async function(file) {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            this.showLoading('Preparing image...');
            
            // Read the file
            const imageUrl = URL.createObjectURL(file);
            
            // Initialize OCR worker if needed
            if (!this.isInitialized) {
                this.updateLoadingStatus('Initializing OCR engine...');
                await this.worker.load();
                await this.worker.loadLanguage('eng');
                await this.worker.initialize('eng');
                this.isInitialized = true;
            }
            
            // Process the image
            this.updateLoadingStatus('Recognizing text...');
            const { data } = await this.worker.recognize(imageUrl);
            
            // Insert the recognized text into the current editor
            this.insertRecognizedText(data.text);
            
            // Clean up
            URL.revokeObjectURL(imageUrl);
            this.hideLoading();
            this.isProcessing = false;
            
            // Show success notification
            Utils.showNotification('OCR Complete', 'Text has been extracted from the image.');
        } catch (error) {
            console.error('OCR Error:', error);
            this.hideLoading();
            this.isProcessing = false;
            Utils.showNotification('OCR Error', 'Failed to process the image. Please try again.');
        }
    },

    /**
     * Insert recognized text into the current editor
     * @param {string} text - Recognized text to insert
     */
    insertRecognizedText: function(text) {
        if (!text.trim()) {
            Utils.showNotification('OCR Result', 'No text was detected in the image.');
            return;
        }
        
        // Determine which editor is currently active
        if (UIManager.currentItemType === 'note' && NoteManager.currentNote) {
            // Insert into note editor
            const noteContent = document.getElementById('noteContent');
            
            // Create a text node with the recognized text
            const textNode = document.createTextNode('\n' + text + '\n');
            
            // Insert at cursor position or append to end
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && selection.getRangeAt(0).intersectsNode(noteContent)) {
                const range = selection.getRangeAt(0);
                range.insertNode(textNode);
            } else {
                // Append to end if no selection in the editor
                noteContent.appendChild(textNode);
            }
        } else if (UIManager.currentItemType === 'task' && TaskManager.currentTask) {
            // Insert into task description
            const taskDescription = document.getElementById('taskDescription');
            
            // Append the recognized text
            taskDescription.innerHTML += '\n' + text + '\n';
        }
    },

    /**
     * Show loading indicator
     * @param {string} status - Status message to display
     */
    showLoading: function(status) {
        this.elements.ocrLoadingIndicator.style.display = 'block';
        this.updateLoadingStatus(status);
    },

    /**
     * Hide loading indicator
     */
    hideLoading: function() {
        this.elements.ocrLoadingIndicator.style.display = 'none';
    },

    /**
     * Update loading status message
     * @param {string} status - Status message to display
     */
    updateLoadingStatus: function(status) {
        const statusElement = this.elements.ocrLoadingIndicator.querySelector('.ocr-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    },

    /**
     * Update progress indicator based on Tesseract.js logger output
     * @param {Object} message - Logger message from Tesseract.js
     */
    updateProgressIndicator: function(message) {
        const progressElement = this.elements.ocrLoadingIndicator.querySelector('.ocr-progress');
        if (!progressElement) return;
        
        // Update progress percentage if available
        if (message.progress !== undefined && message.progress < 1) {
            const percent = Math.round(message.progress * 100);
            progressElement.textContent = `${percent}%`;
        }
        
        // Update status message based on Tesseract job
        if (message.status === 'recognizing text') {
            this.updateLoadingStatus('Recognizing text...');
        }
    },

    /**
     * Clean up OCR resources
     */
    cleanup: async function() {
        if (this.worker) {
            try {
                await this.worker.terminate();
            } catch (e) {
                console.error('Error terminating OCR worker:', e);
            }
        }
        
        // Close camera if open
        this.closeCamera();
    }
};