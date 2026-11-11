// ---------- Grab elements from the page ----------
const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const expenseList = document.getElementById("expense-list");
const emptyMessage = document.getElementById("empty-message");

// ---------- Data ----------
const STORAGE_KEY = "expense-tracker-data";

// Each expense is an object: { id, description, amount, category, date }
let expenses = loadExpenses();

// ---------- Storage ----------
function loadExpenses() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    // If nothing is saved yet, saved is null, so we start with an empty array
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not load saved expenses:", error);
    return [];
  }
}

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error("Could not save expenses:", error);
  }
}

// ---------- Helpers ----------
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAmount(amount) {
  return "₹" + amount.toFixed(2);
}

// ---------- Render ----------
function renderExpenses() {
  expenseList.innerHTML = "";

  // Show the "No expenses yet" message only when the array is empty
  emptyMessage.style.display = expenses.length === 0 ? "block" : "none";

  // Newest date first. [...expenses] makes a copy so we don't reorder the original.
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach((expense) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = expense.date;

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = expense.description;

    const categoryCell = document.createElement("td");
    categoryCell.textContent = expense.category;

    const amountCell = document.createElement("td");
    amountCell.className = "num";
    amountCell.textContent = formatAmount(expense.amount);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
      deleteExpense(expense.id);
    });
    actionCell.appendChild(deleteButton);

    row.append(dateCell, descriptionCell, categoryCell, amountCell, actionCell);
    expenseList.appendChild(row);
  });
}

// ---------- Delete an expense ----------
function deleteExpense(id) {
  // Keep every expense EXCEPT the one with this id
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  renderExpenses();
}

// ---------- Add an expense ----------
form.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the page from reloading

  const expense = {
    id: Date.now(),
    description: descriptionInput.value.trim(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
  };

  expenses.push(expense);
  saveExpenses();
  renderExpenses();

  form.reset();
  dateInput.value = getTodayString();
  descriptionInput.focus();
});

// ---------- Start-up ----------
dateInput.value = getTodayString();
renderExpenses();
