// ---------- Grab elements from the page ----------
const form = document.getElementById("expense-form");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const formError = document.getElementById("form-error");
const expenseList = document.getElementById("expense-list");
const emptyMessage = document.getElementById("empty-message");
const totalIncome = document.getElementById("total-income");
const totalSpent = document.getElementById("total-spent");
const balanceValue = document.getElementById("balance");
const categorySummary = document.getElementById("category-summary");
const emptySummary = document.getElementById("empty-summary");
const filterMonth = document.getElementById("filter-month");
const filterCategory = document.getElementById("filter-category");
const clearFiltersButton = document.getElementById("clear-filters");
const resultCount = document.getElementById("result-count");
const chartCanvas = document.getElementById("category-chart");
const chartWrap = document.getElementById("chart-wrap");
const emptyChart = document.getElementById("empty-chart");
const themeToggle = document.getElementById("theme-toggle");

// ---------- Data ----------
const STORAGE_KEY = "expense-tracker-data";
const THEME_KEY = "expense-tracker-theme";
const MAX_AMOUNT = 10000000;

// The single source of truth for categories. The dropdowns are built from these.
const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Gift", "Other income"];

// One fixed colour per spending category, so a category keeps its colour when filters change
const CATEGORY_COLORS = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Shopping: "#a855f7",
  Bills: "#ef4444",
  Entertainment: "#eab308",
  Health: "#22c55e",
  Other: "#6b7280",
};

// Each item is an object: { id, type, description, amount, category, date }
// type is "expense" or "income"
let expenses = loadExpenses();

// Holds the Chart.js chart once it has been created
let categoryChart = null;

// ---------- Storage ----------
function loadExpenses() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    // Older saved items have no type. Treat them as expenses.
    return parsed.map((item) => ({ ...item, type: item.type || "expense" }));
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

// Handles negative numbers too, so a negative balance shows as -₹50.00
function formatAmount(amount) {
  const sign = amount < 0 ? "-" : "";
  return sign + "₹" + Math.abs(amount).toFixed(2);
}

function getCategories(type) {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

// ---------- Dropdowns ----------
function addOption(select, value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

// Rebuilds the form's category list to match the chosen type
function updateCategoryOptions() {
  categoryInput.innerHTML = "";
  getCategories(typeInput.value).forEach((category) => {
    addOption(categoryInput, category, category);
  });
}

// The filter dropdown lists every category, income and expense
function setupFilterCategories() {
  filterCategory.innerHTML = "";
  addOption(filterCategory, "all", "All categories");
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].forEach((category) => {
    addOption(filterCategory, category, category);
  });
}

// ---------- Theme ----------
// Reads a CSS variable (like --text) from the page, so JavaScript can reuse the theme colours
function getThemeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function updateThemeButton() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (error) {
    console.error("Could not save theme:", error);
  }

  updateThemeButton();
  render(); // redraws the chart with the new colours
}

// ---------- Validation ----------
const formFields = [typeInput, categoryInput, descriptionInput, amountInput, dateInput];

function clearError() {
  formError.textContent = "";
  formFields.forEach((field) => {
    field.classList.remove("invalid");
  });
}

function showError(message, field) {
  clearError();
  formError.textContent = message;
  field.classList.add("invalid");
  field.focus();
}

// Returns { ok: true, expense } or { ok: false, message, field }
function validateForm() {
  const type = typeInput.value;
  const description = descriptionInput.value.trim();
  const rawAmount = amountInput.value;
  const amount = Math.round(Number(rawAmount) * 100) / 100; // keep 2 decimals
  const category = categoryInput.value;
  const date = dateInput.value;

  if (type !== "expense" && type !== "income") {
    return { ok: false, message: "Please choose expense or income.", field: typeInput };
  }
  if (description === "") {
    return { ok: false, message: "Please enter a description.", field: descriptionInput };
  }
  if (description.length > 60) {
    return { ok: false, message: "Description must be 60 characters or fewer.", field: descriptionInput };
  }
  if (rawAmount === "" || !Number.isFinite(amount)) {
    return { ok: false, message: "Please enter a valid amount.", field: amountInput };
  }
  if (amount <= 0) {
    return { ok: false, message: "Amount must be greater than zero.", field: amountInput };
  }
  if (amount > MAX_AMOUNT) {
    return { ok: false, message: "Amount is too large.", field: amountInput };
  }
  if (!getCategories(type).includes(category)) {
    return { ok: false, message: "Please choose a category.", field: categoryInput };
  }
  if (date === "") {
    return { ok: false, message: "Please choose a date.", field: dateInput };
  }

  return {
    ok: true,
    expense: { id: Date.now(), type, description, amount, category, date },
  };
}

// ---------- Filtering ----------
// Returns only the items that match the current month and category filters
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
// Adds up income and expenses separately. Returns { income: 500, expense: 120 }
function getTotalsByType(list) {
  return list.reduce(
    (totals, item) => {
      totals[item.type] += item.amount;
      return totals;
    },
    { income: 0, expense: 0 }
  );
}

// Groups items by category and adds up each group.
// Returns an object like { Food: 250, Transport: 80 }
function getTotalsByCategory(list) {
  return list.reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + item.amount;
    return totals;
  }, {});
}

// ---------- Render ----------
function renderExpenses(list) {
  expenseList.innerHTML = "";

  // Two different "empty" situations need two different messages
  if (list.length === 0) {
    emptyMessage.textContent =
      expenses.length === 0 ? "No transactions yet." : "No transactions match these filters.";
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

    const isIncome = expense.type === "income";
    const amountCell = document.createElement("td");
    amountCell.className = isIncome ? "num income" : "num expense";
    amountCell.textContent = (isIncome ? "+" : "-") + formatAmount(expense.amount);

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
  const byType = getTotalsByType(list);
  // Round to 2 decimals so tiny floating-point leftovers don't show up
  const balance = Math.round((byType.income - byType.expense) * 100) / 100;

  totalIncome.textContent = formatAmount(byType.income);
  totalSpent.textContent = formatAmount(byType.expense);
  balanceValue.textContent = formatAmount(balance);
  balanceValue.classList.toggle("positive", balance >= 0);
  balanceValue.classList.toggle("negative", balance < 0);

  // The category breakdown is about spending only
  const spending = list.filter((item) => item.type === "expense");
  const totals = getTotalsByCategory(spending);

  categorySummary.innerHTML = "";

  if (spending.length === 0) {
    emptySummary.textContent =
      expenses.length === 0 ? "Nothing to summarise yet." : "No spending to show for these filters.";
    emptySummary.style.display = "block";
  } else {
    emptySummary.style.display = "none";
  }

  // Object.entries turns { Food: 250 } into [["Food", 250]].
  // Then we sort so the biggest category comes first.
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  entries.forEach(([category, amount]) => {
    const percent = Math.round((amount / byType.expense) * 100);

    const item = document.createElement("li");

    const name = document.createElement("span");
    name.textContent = category;

    const value = document.createElement("span");
    value.textContent = `${formatAmount(amount)} (${percent}%)`;

    item.append(name, value);
    categorySummary.appendChild(item);
  });
}

// Receives spending only (no income)
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
      expenses.length === 0 ? "Nothing to chart yet." : "No spending to show for these filters.";
    emptyChart.style.display = "block";
    return;
  }

  chartWrap.style.display = "block";
  emptyChart.style.display = "none";

  const entries = Object.entries(getTotalsByCategory(list)).sort((a, b) => b[1] - a[1]);
  const labels = entries.map(([category]) => category);
  const values = entries.map(([, amount]) => amount);
  const colors = labels.map((category) => CATEGORY_COLORS[category] || "#9ca3af");

  // Theme colours: legend text, and slice borders that blend into the card
  const textColor = getThemeColor("--text");
  const cardColor = getThemeColor("--card");

  if (categoryChart) {
    // Chart already exists: just swap in the new data and colours, then redraw
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = values;
    categoryChart.data.datasets[0].backgroundColor = colors;
    categoryChart.data.datasets[0].borderColor = cardColor;
    categoryChart.options.plugins.legend.labels.color = textColor;
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
            borderColor: cardColor,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: textColor },
          },
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
  const spending = filtered.filter((item) => item.type === "expense");

  resultCount.textContent = `Showing ${filtered.length} of ${expenses.length} transactions`;

  renderExpenses(filtered);
  renderSummary(filtered);
  renderChart(spending);
}

// ---------- Delete a transaction ----------
function deleteExpense(id) {
  // Always delete from the FULL list, not the filtered one
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  render();
}

// ---------- Add a transaction ----------
form.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the page from reloading

  const result = validateForm();

  if (!result.ok) {
    showError(result.message, result.field);
    return; // stop here, nothing is saved
  }

  clearError();
  expenses.push(result.expense);
  saveExpenses();
  render();

  form.reset();
  updateCategoryOptions(); // reset() sets Type back to Expense, so rebuild the categories
  dateInput.value = getTodayString();
  descriptionInput.focus();
});

// Changing the type changes which categories are on offer
typeInput.addEventListener("change", updateCategoryOptions);

// Clear the error as soon as the user starts fixing a field
formFields.forEach((field) => {
  field.addEventListener("input", clearError);
});

// ---------- Filter and theme events ----------
filterMonth.addEventListener("change", render);
filterCategory.addEventListener("change", render);
clearFiltersButton.addEventListener("click", clearFilters);
themeToggle.addEventListener("click", toggleTheme);

// ---------- Start-up ----------
updateCategoryOptions();
setupFilterCategories();
dateInput.value = getTodayString();
updateThemeButton();
render();
