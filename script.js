// ---------- Grab elements from the page ----------
const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const expenseList = document.getElementById("expense-list");
const emptyMessage = document.getElementById("empty-message");

// ---------- Data ----------
// Each expense is an object: { id, description, amount, category, date }
let expenses = [];

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

    const actionCell = document.createElement("td"); // delete button comes in Step 4

    row.append(dateCell, descriptionCell, categoryCell, amountCell, actionCell);
    expenseList.appendChild(row);
  });
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
  renderExpenses();

  form.reset();
  dateInput.value = getTodayString();
  descriptionInput.focus();
});

// ---------- Start-up ----------
dateInput.value = getTodayString();
renderExpenses();
