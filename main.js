const shortMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const taskContainer = document.getElementById("task-container");
const newTaskDate = document.getElementById("new-task-date");
const newTaskName = document.getElementById("new-task-name");
const dateModal = document.getElementById("date-modal");
const taskSeperator = document.getElementById("task-seperator");

const dateModalOptions = {
    year: document.getElementById("date-modal-year"),
    month: document.getElementById("date-modal-month"),
    day: document.getElementById("date-modal-day"),

    hour: document.getElementById("date-modal-hour"),
    minute: document.getElementById("date-modal-minute"),
    period: document.getElementById("date-modal-period"),

    str: function () {
        return `${this.year.value}-${this.month.value}-${this.day.value} ${this.hour.value}:${this.minute.value}:00 ${this.period.value}`
    }
}

class Task {
    static tasks = [];

    constructor(date, label) {
        this.id = uuid();
        this.date = date;
        this.label = label;

        if (new Date(this.date)) { // Check if date is valid
            Task.tasks.push(this);

            // Add 
            taskContainer.innerHTML += `
                <div class="task-card card" id="${this.id}">
                    <span class="task-due-date">${Task.convertDate(this.date)}</span>
                    <span class="task-label">${this.label}</span>
                    <span class="task-remove custom-button" onclick="Task.remove('${this.id}')">&#8211;</span>
                </div>
            `;

            // Update local storage and seperator
            evaluateTasks();
        }
    }

    static remove(id) {
        // Return an array that contains all but the task with the specified ID
        Task.tasks = Task.tasks.filter(function (task) {
            return task.id !== id;
        });

        // Remove existing task in DOM (including evaluation)
        removeFadeOut(document.getElementById(id), 500);
    }

    static convertDate(dateStr) {
        var date = new Date(dateStr); // Convert due date string to Date class
        var day = date.getDate(); // Get day number of due date
        var todayString = new Date().toLocaleString(); // Convert today's date to locale string

        // Difference between due date and today
        const diff = date - new Date(todayString);
        const diffMins = diff / (1000 * 60);
        const diffHours = diffMins / 60;
        const diffDays = diffHours / 24;

        if (diffMins <= -15) { // Check if due date is more than 15 minutes in the past
            return "Overdue!";
        } else if (diffHours < 0) {
            return "Due Now!";
        } else if (diffHours <= 1) { // Check if due date is under 1 hour
            return `${Math.ceil(diffMins)} Minutes`; // Rounded up (ceiling)
        } else if (diffDays < 1) { // Check if due date is under 24 hours
            return `${Math.round(diffHours)} Hours`; // Rounded to nearest
        } else if (day == new Date().getDate() + 1) { // Check if due date is tomorrow
            return "Tomorrow";
        } else { // Check if date is after tomorrow
            return `${day} ${shortMonth[date.getMonth()]}`; // Clean day/month string
        }
    }
}

// Initial read of the local storage task array
function init() {
    Task.tasks = JSON.parse(localStorage.getItem("tasks"));

    Task.tasks.forEach(task => {
        taskContainer.innerHTML += `
            <div class="task-card card" id="${task.id}">
                <span class="task-due-date">${Task.convertDate(task.date)}</span>
                <span class="task-label">${task.label}</span>
                <span class="task-remove custom-button" onclick="Task.remove('${task.id}')">&#8211;</span>
            </div>
        `;
    });

    // Update local storage and seperator
    evaluateTasks();
}

function evaluateTasks() {
    taskSeperator.style.display = Task.tasks.length > 0 ? "block" : "none";

    localStorage.setItem("tasks", JSON.stringify(Task.tasks));
}

function newTask() {
    new Task(dateModalOptions.str(), newTaskName.value); // Create task based off of user-provided values
    newTaskName.focus();

    newTaskName.value = null; // Reset label input
    resetDateModalOptions(); // Reset date modal drop downs to default (current date and time offset by 30 minutes)
    updateDateText(); // Update date modal button text to represent new values
}

function updateDateText() {
    var date = new Date(dateModalOptions.str()); // Create new Date object based off of modal input

    document.getElementById("new-task-date-text").textContent = `${date.getDate()} ${shortMonth[date.getMonth()]}`; // Set text content of the new task date button to represent modal input
}

function resetDateModalOptions() {
    var date = new Date(); // Reference the current Date object (now)

    dateModalOptions.year.value = date.getFullYear(); // Get current year
    dateModalOptions.month.value = date.getMonth() + 1; // Get current month
    dateModalOptions.day.value = date.getDate(); // Get current day

    dateModalOptions.hour.value = date.getHours(); // Get current hour based on local time
    dateModalOptions.minute.value = date.getMinutes(); // Get current minute based on local time
    dateModalOptions.period.value = date.getHours() >= 12 ? "PM" : "AM"; // Check if time is in the first half or second half of the day (AM/PM)
}

document.addEventListener("click", (e) => {
    // Check if user clicked on the 'new task date' button and NOT the 'hide date modal' button
    if (newTaskDate.contains(e.target) && !document.getElementById("hide-new-task-modal-btn").contains(e.target)) {
        showNewTaskModal(); // Show date modal
    } else {
        hideNewTaskModal(); // Hide date modal
    }
});

function showNewTaskModal() {
    dateModal.style.display = "block"; // Set date modal to 'block'
}

function hideNewTaskModal() {
    dateModal.style.display = "none"; // Set date modal to 'none'
}

function updateDayOptions() {
    var year = document.getElementById("date-modal-year").value; // Reference year value
    var month = document.getElementById("date-modal-month").value; // Reference month value
    var monthLength = new Date(year, month, 0).getDate(); // Get length of month (By omitting month in Date class)

    var dayRef = document.getElementById("date-modal-day"); // Reference day dropdown
    var day = dayRef.value; // Save initial day value
    dayRef.innerHTML = null; // Wipe all day dropdown options

    // Re-populate day dropwdown options to represent the current month and year
    for (var i = 0; i < monthLength; i++) {
        var option = document.createElement("option");
        option.value = i + 1;
        option.text = i + 1;
        document.getElementById("date-modal-day").appendChild(option);
    }

    // Set day dropdown value to last known selection, unless its too great (so default to the month's length)
    dayRef.value = day <= monthLength ? day : monthLength;
}

// alvarodms - https://stackoverflow.com/questions/33424138/how-to-remove-a-div-with-fade-out-effect-in-javascript
function removeFadeOut(el, speed) {
    el.style.transition = `opacity ${speed / 1000}s ease`;

    el.style.opacity = 0;
    setTimeout(() => { // Wait for opacity ease-out
        console.log(`Removing ${el.id}...`);
        // Remove element
        el.parentNode.removeChild(el);

        // Update local storage and seperator
        evaluateTasks();
    }, speed);
}

function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
