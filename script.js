document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("save-activity-btn").addEventListener("click", saveActivity);
  document.getElementById("export-activity").addEventListener("click", () => exportData("Activities"));
  document.getElementById("export-tasks").addEventListener("click", () => exportData("Tasks"));
  document.getElementById("export-events").addEventListener("click", () => exportData("Events"));
  document.getElementById("export-activity-event").addEventListener("click", () => exportData("Activities", "Events"));
  document.getElementById("export-activity-task").addEventListener("click", () => exportData("Activities", "Tasks"));
  document.getElementById("export-event-task").addEventListener("click", () => exportData("Events", "Tasks"));
  document.getElementById("export-all").addEventListener("click", () => exportData("Activities", "Tasks", "Events"));
  displayEvents();
});

function saveActivity() {
  const date = document.getElementById("activity-date").value;
  const text = document.getElementById("activity-text").value;
  if (!date || !text) {
    alert("Please enter both date and activity.");
    return;
  }
  localStorage.setItem(`activity_${date}`, text);
  document.getElementById("activity-success").textContent = "✅ Saved!";
  setTimeout(() => document.getElementById("activity-success").textContent = '', 3000);
  document.getElementById("activity-text").value = '';
}

function deleteActivity() {
  const date = document.getElementById("delete-date").value;
  const key = `activity_${date}`;
  const value = localStorage.getItem(key);
  if (value && confirm(`Delete activity for ${date}?\n"${value}"`)) {
    localStorage.removeItem(key);
    alert("Activity deleted.");
  }
}

function viewAllActivities() {
  const viewSection = document.getElementById("view-section");
  const tbody = document.getElementById("view-table").querySelector("tbody");
  document.getElementById("view-title").textContent = "All Activities";
  tbody.innerHTML = "";
  Object.keys(localStorage)
    .filter(k => k.startsWith("activity_"))
    .forEach(k => {
      const date = k.replace("activity_", "");
      const text = localStorage.getItem(k);
      const row = tbody.insertRow();
      row.innerHTML = `
        <td><input type="date" value="${date}" disabled /></td>
        <td><input value="${text}" /></td>
        <td><button onclick="updateActivity('${date}', this)">Update</button></td>
      `;
    });
  viewSection.style.display = "block";
}

function updateActivity(date, btn) {
  const newText = btn.parentElement.parentElement.querySelector("td:nth-child(2) input").value;
  localStorage.setItem(`activity_${date}`, newText);
  alert("Activity updated.");
}

function viewAllTasks() {
  const viewSection = document.getElementById("view-section");
  const tbody = document.getElementById("view-table").querySelector("tbody");
  document.getElementById("view-title").textContent = "All Tasks";
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]").filter(t => t.type === "Task");
  tbody.innerHTML = "";
  tasks.forEach((task, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td><input type="date" value="${task.date}" /></td>
      <td><input value="${task.text}" /></td>
      <td><button onclick="updateTask(${index}, this)">Update</button></td>
    `;
  });
  viewSection.style.display = "block";
}

function updateTask(index, btn) {
  const row = btn.parentElement.parentElement;
  const date = row.querySelector("td:nth-child(1) input").value;
  const text = row.querySelector("td:nth-child(2) input").value;
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const taskList = tasks.filter(t => t.type === "Task");
  tasks[tasks.findIndex((t, i) => t.type === "Task" && i === index)] = { type: "Task", date, text };
  localStorage.setItem("tasks", JSON.stringify(tasks));
  alert("Task updated.");
}

function addEntry() {
  const type = document.getElementById("entry-type").value;
  const text = document.getElementById("entry-text").value;
  const date = document.getElementById("entry-date").value;
  if (!text || !date) return alert("Please enter name and date.");
  const all = JSON.parse(localStorage.getItem("tasks") || "[]");
  all.push({ text, date, type });
  localStorage.setItem("tasks", JSON.stringify(all));
  document.getElementById("entry-text").value = '';
  displayEvents();
}

function displayEvents() {
  const list = document.getElementById("event-list");
  list.innerHTML = "";
  const entries = JSON.parse(localStorage.getItem("tasks") || "[]").filter(t => t.type === "Event");
  entries.forEach((entry, i) => {
    const li = document.createElement("li");
    li.textContent = `${entry.date}: ${entry.text}`;
    const btn = document.createElement("button");
    btn.textContent = "Completed";
    btn.onclick = () => {
      const all = JSON.parse(localStorage.getItem("tasks") || "[]");
      const index = all.findIndex(t => t.text === entry.text && t.date === entry.date && t.type === "Event");
      if (index !== -1) {
        all.splice(index, 1);
        localStorage.setItem("tasks", JSON.stringify(all));
        displayEvents();
      }
    };
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function exportData(...types) {
  const doc = new jspdf.jsPDF();
  let y = 10;

  if (types.includes("Activities")) {
    const activities = [];
    Object.keys(localStorage)
      .filter(k => k.startsWith("activity_"))
      .forEach(k => activities.push([k.replace("activity_", ""), localStorage.getItem(k)]));
    doc.text("Activities", 14, y);
    doc.autoTable({ head: [["Date", "Activity"]], body: activities, startY: y + 10 });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (types.includes("Tasks")) {
    const tasks = (JSON.parse(localStorage.getItem("tasks") || "[]")).filter(t => t.type === "Task");
    const data = tasks.map(t => [t.date, t.text]);
    doc.text("Tasks", 14, y);
    doc.autoTable({ head: [["Date", "Task"]], body: data, startY: y + 10 });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (types.includes("Events")) {
    const events = (JSON.parse(localStorage.getItem("tasks") || "[]")).filter(t => t.type === "Event");
    const data = events.map(t => [t.date, t.text]);
    doc.text("Events", 14, y);
    doc.autoTable({ head: [["Date", "Event"]], body: data, startY: y + 10 });
  }

  doc.save("export.pdf");
}
