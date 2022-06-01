const shortMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const taskContainer = document.getElementById("task-container");
const newTaskDate = document.getElementById("new-task-date");
const newTaskName = document.getElementById("new-task-name");
const dateModal = document.getElementById("date-modal");
const settingsModal = document.getElementById("settings-modal");
const resetDateModalBtn = $("#reset-date-modal-btn");

let dueDatePadding = 5; // Minutes to allow task to be due
let taskFadeDuration = 500; // Milliseconds it takes for task cards to dis/appear

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

$(document).ready(function(){
    $('html').fadeIn(2000);
});

class Task {
    static tasks = [];

    constructor(date, label) {
        this.id = uuid();
        this.date = date;
        this.label = label;

        if (new Date(this.date)) { // Check if date is valid
            Task.tasks.push(this);

            // Add 
            Task.create(this.id);

            // Force evaluate
            evaluateTasks();
        }
    }

    static create(id) {
        var task = Task.tasks.find(obj => obj.id === id);

        taskContainer.insertAdjacentHTML("beforeend", `
            <div class="task-card card" id="${task.id}">
                <span class="task-due-date" title="${new Date(task.date)}">${Task.convertDate(task.date)}</span>
                <span class="task-label">${task.label}</span>
                <span class="task-remove custom-button" onclick="Task.remove('${task.id}')">&#8211;</span>
            </div>
        `);

        var el = document.getElementById(id);
        $(el).hide().fadeIn(taskFadeDuration);

        checkNullTasks();
    }

    static remove(id) {
        var el = document.getElementById(id);

        // Return an array that contains all but the task with the specified ID
        Task.tasks = Task.tasks.filter(function (task) {
            return task.id !== id;
        });

        // Remove existing task in DOM (including evaluation)
        $(el).fadeOut(taskFadeDuration, () => { el.remove(); checkNullTasks(); });
    }

    static convertDate(dateStr) {
        var date = new Date(dateStr); // Convert due date string to Date class
        var day = date.getDate(); // Get day number of due date
        var today = new Date(); // Snapshot curent date and time

        // Difference between due date and today
        const diff = date - today;
        const diffMins = diff / (1000 * 60);
        const diffHours = diffMins / 60;
        const diffDays = diffHours / 24;

        if (diffMins <= -dueDatePadding) { // Check if due date is more than x minutes in the past
            return "Overdue!";
        } else if (diffHours < 0) {
            return "Due Now!";
        } else if (diffMins <= 59) { // Check if due date is under 1 hour
            return plural("Minute", Math.ceil(diffMins)); // Rounded up (ceiling)
        } else if (diffDays < 1) { // Check if due date is under 24 hours
            return plural("Hour", Math.round(diffHours)); // Rounded to nearest (plural support)
        } else if (day == new Date().getDate() + 1) { // Check if due date is tomorrow
            return "Tomorrow";
        } else { // Check if date is after tomorrow
            return `${day} ${shortMonth[date.getMonth()]}`; // Clean day/month string
        }
    }
}

// Initial read of the local storage task array
function init() {
    // Apply jQuery UI tooltip to all title attributes in document
    $( document ).tooltip({
        position: { my: "center bottom-30", at: "top center" },
        show: { duration: 100 },
        hide: { duration: 100 }
    });

    if (localStorage.getItem("tasks") != null) {
        Task.tasks = JSON.parse(localStorage.getItem("tasks"));

        Task.tasks.forEach(task => {
            Task.create(task.id);
        });
    } else {
        initTasks();
    }

    // Force evaluate
    evaluateTasks();

    checkNullTasks();
}

// Check if there are no tasks in the task array
function checkNullTasks() {
    document.getElementById("no-task-card").style.display = Task.tasks.length > 0 ? "none" : "block";
}

// Evaluate the due date of all tasks and re-sync to local storage
function evaluateTasks() {
    if (localStorage.getItem("tasks") != null) {
        // Update due date for all tasks
        Task.tasks.forEach(task => {
            document.getElementById(task.id).getElementsByClassName("task-due-date")[0].textContent = Task.convertDate(task.date);
        });

        localStorage.setItem("tasks", JSON.stringify(Task.tasks));
    }
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

    dateModalOptions.hour.value = date.getHours()%12; // Get current hour based on local time
    dateModalOptions.minute.value = date.getMinutes(); // Get current minute based on local time
    dateModalOptions.period.value = date.getHours() >= 12 ? "PM" : "AM"; // Check if time is in the first half or second half of the day (AM/PM)
}

// Adds rotate animation class on click
resetDateModalBtn.click(() => {
    resetDateModalBtn.addClass("return-rotate-animation");
});

// Removes rotate animation class when animation ends
resetDateModalBtn.on("animationend", () => {
    resetDateModalBtn.removeClass("return-rotate-animation");
});

// Handle document click events
document.addEventListener("click", (e) => {
    // Check if user clicked on the 'new task date' button and NOT the 'hide date modal' button
    if (newTaskDate.contains(e.target) && !document.getElementById("hide-new-task-modal-btn").contains(e.target)) {
        showNewTaskModal(); // Show date modal
    } else {
        hideNewTaskModal(); // Hide date modal
    }

    if (!document.getElementById("settings-btn").contains(e.target) && !settingsModal.contains(e.target)) {
        settingsModal.style.display = "none"; // Set settings modal to 'none'
    }
});

function showSettingsModal() {
    settingsModal.style.display = "block"; // Set settings modal to 'block'
}

function showNewTaskModal() {
    dateModal.style.display = "block"; // Set date modal to 'block'
}

function hideNewTaskModal() {
    dateModal.style.display = "none"; // Set date modal to 'none'
}

function initTasks() {
    localStorage.setItem("tasks", JSON.stringify([]));
}

function clearTasks() {
    initTasks();
    window.location.reload();
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

// Evaluate tasks every 1000ms
setInterval(() => {
    evaluateTasks();
}, 1000);

// Convert a number paired with a string to a plural
function plural(str, mag) {
    return `${mag} ${str}${(mag == 1 ? "" : "s")}`;
}

function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
