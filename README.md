# Expense Tracker

A simple, fast expense tracker that runs entirely in the browser. Log income and expenses, see where your money goes, and export your data to CSV. No sign-up, no server, and your data never leaves your device.

**[Live demo](https://YOUR-USERNAME.github.io/expense-tracker/)**

![Expense Tracker screenshot](screenshot.png)
![Expense Tracker in dark mode](screenshot-dark.png)

## Features

- Add income and expenses with a description, amount, category and date
- Edit or delete any transaction
- Summary of total income, total spent and balance
- Spending breakdown by category, with percentages
- Doughnut chart of spending (Chart.js)
- Filter by month and category; the summary, chart and export follow the filters
- Export the visible transactions to CSV
- Dark and light themes, with the choice remembered
- Input validation with clear error messages
- Data saved in the browser with `localStorage`
- Responsive layout that works on phones

## Built with

- HTML, CSS (custom properties for theming, grid and flexbox)
- Vanilla JavaScript (no frameworks)
- [Chart.js](https://www.chartjs.org/) 4.4.1, loaded from a CDN with a pinned version
- GitHub Pages for hosting

## What I learned

- Structuring a small app around one rule: change the data, save it, then re-render
- Array methods: `filter`, `map`, `reduce`, `find`, `sort`
- Grouping and summing data with `reduce`
- Persisting data with `localStorage` and `JSON`, and migrating older saved data when its shape changed
- Validating input in JavaScript rather than trusting HTML attributes
- Theming with CSS variables, and passing theme colours to a canvas chart
- Creating and downloading a file in the browser with `Blob`
- Using `textContent` instead of `innerHTML` to avoid XSS
- Escaping CSV cells and neutralising formula injection (cells starting with `=`, `+`, `-` or `@`)

## Run it locally

```bash
git clone https://github.com/YOUR-USERNAME/expense-tracker.git
cd expense-tracker
```

Then open `index.html` in your browser. There is nothing to install. The chart needs an internet connection to load Chart.js; the rest of the app works offline.

## Project structure

```
expense-tracker/
├── index.html     Page structure
├── style.css      Styles and light/dark themes
├── script.js      App logic
└── screenshot.png
```

## Notes

- Data is stored per browser and device. Clearing your browser data removes it, so use **Export CSV** for a backup.
- There is no import yet.

## Ideas for the future

- Import from CSV
- Monthly budgets with warnings
- Charts over time, such as spending per month
- Custom categories
