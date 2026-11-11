// ---------- Grab elements from the page ----------
const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const expenseList = document.getElementById("expense-list");
const emptyMessage = document.getElementById("empty-message");
const totalSpent = document.getElementById("total-spent");
const categorySummary = document.getElementById("category-summary");
const emptySummary = document.getElementById("empty-summary");
const filterMonth = document.getElementById("filter-month");
const filterCategory = document.getElementById("filter-category");
const clearFiltersButton = document.getElementById("clear-filters");
const resultCount = document.getElementById("result-count");
const chartCanvas = document.getElementById("category-chart");
const chartWrap = document.getElementById("chart-wrap");
const emptyChart = document.getElementById("empty-chart");

// ---------- Data ----------
const STORAGE_KEY = "expense-tracker-data";

// One fixed colour per category, so a category keeps its colour when filters change
const CATEGORY_COLORS = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Shopping: "#a855f7",
  Bills: "#ef4444",
  Entertainment: "#eab308",
  Health: "#22c55e",
  Other: "#6b7280",
};

// Each expense is an object: { id, description, amount, category, date }
let expenses = loadExpenses();

// Holds the Chart.js chart once it has been created
let categoryChart = null;

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

// ---------- Filtering ----------
// Returns only the expenses that match the current month and category filters
function getFilteredExpenses() {
  const month = filterMonth.value;       // "2026-11", or "" if not chosen
  const category = filterCategory.value; // "all" or a category name

  return expenses.filter((expense) => {
    // Dates look like "2026-11-05", so startsWith("2026-11") matches November 2026
    const matchesMonth = month === "" || expense.date.startsWith(month);
    const matchesCategory = category === "all" || expense.category === category;
    return matchesMonth && matchesCategory;
  });
}

function clearFilters() {
  filterMonth.value = "";
  filterCategory.value = "all";
  render();
}

// ---------- Calculations ----------
// Adds up the amount of every expense in the list
function getTotal(list) {
  return list.reduce((sum, expense) => sum + expense.amount, 0);
}

// Groups expenses by category and adds up each group.
// Returns an object like { Food: 250, Transport: 80 }
function getTotalsByCategory(list) {
  return list.reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    return totals;
  }, {});
}

// ---------- Render ----------
function renderExpenses(list) {
  expenseList.innerHTML = "";

  // Two different "empty" situations need two different messages
  if (list.length === 0) {
    emptyMessage.textContent =
      expenses.length === 0 ? "No expenses yet." : "No expenses match these filters.";
    emptyMessage.style.display = "block";
  } else {
    emptyMessage.style.display = "none";
  }

  // Newest date first. [...list] makes a copy so we don't reorder the original.
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));

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

function renderSummary(list) {
  const total = getTotal(list);
  const totals = getTotalsByCategory(list);

  totalSpent.textContent = formatAmount(total);

  categorySummary.innerHTML = "";

  if (list.length === 0) {
    emptySummary.textContent =
      expenses.length === 0 ? "Nothing to summarise yet." : "No expenses match these filters.";
    emptySummary.style.display = "block";
  } else {
    emptySummary.style.display = "none";
  }

  // Object.entries turns { Food: 250 } into [["Food", 250]].
  // Then we sort so the biggest category comes first.
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  entries.forEach(([category, amount]) => {
    const percent = Math.round((amount / total) * 100);

    const item = document.createElement("li");

    const name = document.createElement("span");
    name.textContent = category;

    const value = document.createElement("span");
    value.textContent = `${formatAmount(amount)} (${percent}%)`;

    item.append(name, value);
    categorySummary.appendChild(item);
  });
}

function renderChart(list) {
  // If the Chart.js file failed to load, show a message instead of crashing
  if (typeof Chart === "undefined") {
    chartWrap.style.display = "none";
    emptyChart.textContent = "Chart could not be loaded. Check your internet connection.";
    emptyChart.style.display = "block";
    return;
  }

  // Nothing to draw: remove any old chart and show a message
  if (list.length === 0) {
    if (categoryChart) {
      categoryChart.destroy();
      categoryChart = null;
    }
    chartWrap.style.display = "none";
    emptyChart.textContent =
      expenses.length === 0 ? "Nothing to chart yet." : "No expenses match these filters.";
    emptyChart.style.display = "block";
    return;
  }

  chartWrap.style.display = "block";
  emptyChart.style.display = "none";

  const entries = Object.entries(getTotalsByCategory(list)).sort((a, b) => b[1] - a[1]);
  const labels = entries.map(([category]) => category);
  const values = entries.map(([, amount]) => amount);
  const colors = labels.map((category) => CATEGORY_COLORS[category] || "#9ca3af");

  if (categoryChart) {
    // Chart already exists: just swap in the new data and redraw
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = values;
    categoryChart.data.datasets[0].backgroundColor = colors;
    categoryChart.update();
  } else {
    categoryChart = new Chart(chartCanvas, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${formatAmount(context.parsed)}`;
              },
            },
          },
        },
      },
    });
  }
}

// One function to refresh everything on screen
function render() {
  const filtered = getFilteredExpenses();

  resultCount.textContent = `Showing ${filtered.length} of ${expenses.length} expenses`;

  renderExpenses(filtered);
  renderSummary(filtered);
  renderChart(filtered);
}

// ---------- Delete an expense ----------
function deleteExpense(id) {
  // Always delete from the FULL list, not the filtered one
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  render();
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
  render();

  form.reset();
  dateInput.value = getTodayString();
  descriptionInput.focus();
});

// ---------- Filter events ----------
filterMonth.addEventListener("change", render);
filterCategory.addEventListener("change", render);
clearFiltersButton.addEventListener("click", clearFilters);

// ---------- Start-up ----------
dateInput.value = getTodayString();
render();
