/**
 * Task Manager - Handles task operations
 */
const TaskManager = {
    // Current active task
    currentTask: null,

    // DOM References
    elements: {
        taskTitleInput: document.getElementById('taskTitleInput'),
        taskDueDateInput: document.getElementById('taskDueDateInput'),
        taskPrioritySelect: document.getElementById('taskPrioritySelect'),
        taskCategorySelect: document.getElementById('taskCategorySelect'),
        taskDescription: document.getElementById('taskDescription'),
        upcomingTasksList: document.getElementById('upcomingTasksList'),
        todayTasksList: document.getElementById('todayTasksList'),
        completedTasksList: document.getElementById('completedTasksList'),
        taskEditor: document.getElementById('taskEditor'),
        saveTaskBtn: document.getElementById('saveTaskBtn'),
        completeTaskBtn: document.getElementById('completeTaskBtn'),
        deleteTaskBtn: document.getElementById('deleteTaskBtn')
    },

    /**
     * Initialize the task manager
     */
    init: function() {
        this.setupEventListeners();
        this.renderTasks();
    },

    /**
     * Set up event listeners for task-related elements
     */
    setupEventListeners: function() {
        // Save task button
        this.elements.saveTaskBtn.addEventListener('click', () => this.saveCurrentTask());
        
        // Complete task button
        this.elements.completeTaskBtn.addEventListener('click', () => this.toggleTaskComplete());
        
        // Delete task button
        this.elements.deleteTaskBtn.addEventListener('click', () => this.deleteCurrentTask());
        
        // Category headers toggle
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const items = header.nextElementSibling;
                items.style.display = items.style.display === 'none' ? 'block' : 'none';
                const arrow = header.querySelector('span:last-child');
                arrow.textContent = items.style.display === 'none' ? '🔼' : '🔽';
            });
        });
    },

    /**
     * Create a new task
     * @param {string} title - Title for the new task
     */
    createNewTask: function(title) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const task = {
            id: Utils.generateId(),
            title: title,
            description: '',
            completed: false,
            dueDate: tomorrow.toISOString().split('T')[0],
            priority: 'medium',
            category: 'none',
            type: 'task',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        DataManager.addTask(task);
        this.renderTasks();
        this.loadTask(task.id);
    },

    /**
     * Load a task by ID
     * @param {string} id - Task ID to load
     */
    loadTask: function(id) {
        // Find the task
        const task = DataManager.dataStore.tasks.find(task => task.id === id);
        
        if (!task) return;
        
        this.currentTask = task;
        NoteManager.currentNote = null;
        
        // Switch to editor tab if not already active
        document.querySelector('.content .tab[data-tab="editor"]').click();
        
        // Show task editor, hide note editor
        document.getElementById('noteEditor').style.display = 'none';
        this.elements.taskEditor.style.display = 'flex';
        
        // Set task values
        this.elements.taskTitleInput.value = task.title;
        this.elements.taskDueDateInput.value = task.dueDate;
        this.elements.taskPrioritySelect.value = task.priority;
        this.elements.taskCategorySelect.value = task.category;
        this.elements.taskDescription.innerHTML = task.description;
        
        // Update complete button text
        this.elements.completeTaskBtn.textContent = task.completed ? 'Mark Incomplete' : 'Mark Complete';
        
        // Update active state in the tasks lists
        const taskItems = document.querySelectorAll('.item-list .item');
        taskItems.forEach(item => {
            if (item.getAttribute('data-id') === id) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    /**
     * Save the current task
     */
    saveCurrentTask: function() {
        if (!this.currentTask) return;
        
        // Update task properties
        this.currentTask.title = this.elements.taskTitleInput.value;
        this.currentTask.dueDate = this.elements.taskDueDateInput.value;
        this.currentTask.priority = this.elements.taskPrioritySelect.value;
        this.currentTask.category = this.elements.taskCategorySelect.value;
        this.currentTask.description = this.elements.taskDescription.innerHTML;
        this.currentTask.updatedAt = new Date().toISOString();
        
        // Update task in data manager
        DataManager.updateTask(this.currentTask);
        
        // Refresh the tasks list
        this.renderTasks();
        
        // Show notification
        Utils.showNotification('Task Saved', 'Your task has been saved successfully.');
    },

    /**
     * Toggle task complete/incomplete status
     */
    toggleTaskComplete: function() {
        if (!this.currentTask) return;
        
        // Toggle completed status
        this.currentTask.completed = !this.currentTask.completed;
        
        // Update button text
        this.elements.completeTaskBtn.textContent = this.currentTask.completed ? 'Mark Incomplete' : 'Mark Complete';
        
        // Update task in data manager
        DataManager.updateTask(this.currentTask);
        
        // Refresh the tasks list
        this.renderTasks();
        
        // Show notification
        const message = this.currentTask.completed ? 'Task marked as complete!' : 'Task marked as incomplete.';
        Utils.showNotification('Task Updated', message);
    },

    /**
     * Delete the current task
     */
    deleteCurrentTask: function() {
        if (!this.currentTask) return;
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete "${this.currentTask.title}"?`)) {
            return;
        }
        
        // Delete task
        DataManager.deleteTask(this.currentTask.id);
        
        // Refresh the tasks list
        this.renderTasks();
        
        // Load another task if available
        if (DataManager.dataStore.tasks.length > 0) {
            this.loadTask(DataManager.dataStore.tasks[0].id);
        } else {
            // Switch back to note view
            this.currentTask = null;
            
            if (DataManager.dataStore.notes.length > 0) {
                NoteManager.loadNote(DataManager.dataStore.notes[0].id);
            } else {
                // Create a blank note if no notes exist
                NoteManager.createNewNote('Untitled Note');
            }
        }
        
        // Show notification
        Utils.showNotification('Task Deleted', 'Your task has been deleted successfully.');
    },

    /**
     * Render the tasks lists
     */
    renderTasks: function() {
        this.elements.upcomingTasksList.innerHTML = '';
        this.elements.todayTasksList.innerHTML = '';
        this.elements.completedTasksList.innerHTML = '';
        
        // Get today's date (without time)
        const today = new Date().toISOString().split('T')[0];
        
        // Get sorted tasks
        const sortedTasks = DataManager.getSortedTasks();
        
        sortedTasks.forEach(task => {
            // Create task item
            const item = document.createElement('li');
            item.className = 'item';
            item.setAttribute('data-id', task.id);
            
            if (this.currentTask && this.currentTask.id === task.id) {
                item.classList.add('active');
            }
            
            if (task.completed) {
                item.classList.add('task-completed');
            }
            
            // Set priority color
            let priorityColor = '#fbbc05'; // Medium (yellow)
            if (task.priority === 'high') {
                priorityColor = '#ea4335'; // High (red)
            } else if (task.priority === 'low') {
                priorityColor = '#34a853'; // Low (green)
            }
            
            // Set category label
            let categoryLabel = '';
            if (task.category !== 'none') {
                categoryLabel = `<span class="task-tag" style="background-color: ${Utils.getCategoryColor(task.category)}">${task.category}</span>`;
            }
            
            const formattedDate = Utils.formatDate(task.dueDate);
            
            item.innerHTML = `
                <div>
                    <div class="item-title">${task.title}</div>
                    <div class="item-date">
                        ${categoryLabel}
                        <span style="color: ${priorityColor}">⬤</span>
                        Due: ${formattedDate}
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.loadTask(task.id);
            });
            
            // Add to appropriate list
            if (task.completed) {
                this.elements.completedTasksList.appendChild(item);
            } else if (task.dueDate === today) {
                this.elements.todayTasksList.appendChild(item);
            } else {
                this.elements.upcomingTasksList.appendChild(item);
            }
        });
    },

    /**
     * Render filtered tasks based on search term
     * @param {Array} filteredTasks - Array of filtered tasks
     */
    renderFilteredTasks: function(filteredTasks) {
        this.elements.upcomingTasksList.innerHTML = '';
        this.elements.todayTasksList.innerHTML = '';
        this.elements.completedTasksList.innerHTML = '';
        
        filteredTasks.forEach(task => {
            // Create task item
            const item = document.createElement('li');
            item.className = 'item';
            item.setAttribute('data-id', task.id);
            
            if (this.currentTask && this.currentTask.id === task.id) {
                item.classList.add('active');
            }
            
            if (task.completed) {
                item.classList.add('task-completed');
            }
            
            // Set priority color
            let priorityColor = '#fbbc05'; // Medium (yellow)
            if (task.priority === 'high') {
                priorityColor = '#ea4335'; // High (red)
            } else if (task.priority === 'low') {
                priorityColor = '#34a853'; // Low (green)
            }
            
            // Set category label
            let categoryLabel = '';
            if (task.category !== 'none') {
                categoryLabel = `<span class="task-tag" style="background-color: ${Utils.getCategoryColor(task.category)}">${task.category}</span>`;
            }
            
            const formattedDate = Utils.formatDate(task.dueDate);
            
            item.innerHTML = `
                <div>
                    <div class="item-title">${task.title}</div>
                    <div class="item-date">
                        ${categoryLabel}
                        <span style="color: ${priorityColor}">⬤</span>
                        Due: ${formattedDate}
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.loadTask(task.id);
            });
            
            // Add to appropriate list
            if (task.completed) {
                this.elements.completedTasksList.appendChild(item);
            } else {
                // Add all non-completed tasks to upcoming list when searching
                this.elements.upcomingTasksList.appendChild(item);
            }
        });
    },

    /**
     * Open reminder modal
     */
    openReminderModal: function() {
        if (!this.currentTask) return;

        Utils.openModal('reminderModal');
        
        // Set default values
        document.getElementById('reminderTitle').value = this.currentTask.title;
        
        // Set default date/time to the task due date at 9 AM
        const dueDate = new Date(this.currentTask.dueDate);
        dueDate.setHours(9, 0, 0, 0);
        
        const dateTimeString = dueDate.toISOString().slice(0, 16);
        document.getElementById('reminderDateTime').value = dateTimeString;
        
        document.getElementById('reminderRepeat').value = 'none';
        document.getElementById('customRepeatContainer').style.display = 'none';
    }
};