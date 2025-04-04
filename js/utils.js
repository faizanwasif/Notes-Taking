/**
 * Utility functions for the NotePal application
 */
const Utils = {
    /**
     * Generate a unique ID
     * @returns {string} A unique ID
     */
    generateId: function() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Format a date for display
     * @param {string} dateString - Date string in ISO format
     * @returns {string} Formatted date string
     */
    formatDate: function(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        // Reset time part for comparison
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        if (date.getTime() === today.getTime()) {
            return 'Today';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString();
        }
    },

    /**
     * Get color for task category
     * @param {string} category - Category name
     * @returns {string} CSS color value
     */
    getCategoryColor: function(category) {
        const colors = {
            'work': '#4285f4', // Blue
            'personal': '#34a853', // Green
            'shopping': '#fbbc05', // Yellow
            'health': '#ea4335' // Red
        };
        
        return colors[category] || '#9aa0a6'; // Gray for unknown categories
    },

    /**
     * Get font family based on font name
     * @param {string} font - Font name
     * @returns {string} CSS font-family value
     */
    getFontFamily: function(font) {
        const fonts = {
            'arial': 'Arial, sans-serif',
            'times': 'Times New Roman, Times, serif',
            'courier': 'Courier New, Courier, monospace',
            'georgia': 'Georgia, serif',
            'verdana': 'Verdana, Geneva, sans-serif'
        };
        
        return fonts[font] || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    },

    /**
     * Get shortcut string from keyboard event
     * @param {KeyboardEvent} e - Keyboard event
     * @returns {string} Shortcut string (e.g. "Ctrl+Alt+N")
     */
    getShortcutFromEvent: function(e) {
        let shortcut = '';
        
        // Check for modifier keys
        if (e.ctrlKey) shortcut += 'Ctrl+';
        if (e.altKey) shortcut += 'Alt+';
        if (e.shiftKey) shortcut += 'Shift+';
        if (e.metaKey) shortcut += 'Meta+';
        
        // Add the key
        shortcut += e.key.toUpperCase();
        
        return shortcut;
    },

    /**
     * Open a modal
     * @param {string} modalId - ID of the modal to open
     */
    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'flex';
    },

    /**
     * Close a modal
     * @param {string} modalId - ID of the modal to close
     */
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
    },

    /**
     * Show a notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {Object} [action] - Action object (optional)
     * @param {string} action.text - Action button text
     * @param {Function} action.callback - Action button callback
     */
    showNotification: function(title, message, action = null) {
        const notification = document.getElementById('notification');
        const notificationTitle = notification.querySelector('.notification-title');
        const notificationBody = notification.querySelector('.notification-body');
        const notificationActions = notification.querySelector('.notification-actions');
        
        notificationTitle.textContent = title;
        notificationBody.textContent = message;
        
        // Clear previous actions
        notificationActions.innerHTML = '';
        
        // Add action button if provided
        if (action) {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'btn';
            actionBtn.textContent = action.text;
            actionBtn.addEventListener('click', () => {
                action.callback();
                Utils.hideNotification();
            });
            notificationActions.appendChild(actionBtn);
        }
        
        // Add dismiss button
        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'btn btn-secondary';
        dismissBtn.textContent = 'Dismiss';
        dismissBtn.addEventListener('click', Utils.hideNotification);
        notificationActions.appendChild(dismissBtn);
        
        // Show notification
        notification.classList.add('show');
        
        // Auto-hide after 5 seconds if no action is provided
        if (!action) {
            setTimeout(Utils.hideNotification, 5000);
        }
    },

    /**
     * Hide the notification
     */
    hideNotification: function() {
        const notification = document.getElementById('notification');
        notification.classList.remove('show');
    },

    /**
     * Show a browser notification if permission is granted
     * @param {Object} reminder - Reminder object
     * @param {string} reminder.title - Reminder title
     * @param {string} reminder.itemType - Type of item (note or task)
     * @param {string} reminder.itemId - ID of the item
     * @param {Function} onClickCallback - Callback to run when notification is clicked
     */
    showBrowserNotification: function(reminder, onClickCallback) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(reminder.title, {
                body: `Reminder for your ${reminder.itemType}`,
                icon: 'assets/icons/icon-192x192.png'
            });
            
            notification.onclick = function() {
                window.focus();
                onClickCallback(reminder.itemType, reminder.itemId);
            };
        }
    },

    /**
     * Request notification permission
     */
    requestNotificationPermission: function() {
        if ('Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }
};