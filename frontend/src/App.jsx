
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_spending: 0,
    average_expense: 0,
    category_wise: {},
  });

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [expenseRes, analyticsRes] = await Promise.all([
        fetch(`${API}/expenses`),
        fetch(`${API}/analytics`),
      ]);

      if (!expenseRes.ok || !analyticsRes.ok) {
        throw new Error("Unable to load expense data.");
      }

      setExpenses(await expenseRes.json());
      setAnalytics(await analyticsRes.json());
      setError("");
    } catch {
      setError("Backend connect nahi ho raha. Python server check karo.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function addExpense(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : JSON.stringify(result.detail || "Unable to add expense.")
        );
      }

      setForm({
        title: "",
        amount: "",
        category: "Food",
        date: new Date().toISOString().slice(0, 10),
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteExpense(id) {
    try {
      const response = await fetch(`${API}/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete expense.");
      }

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const categories = Object.entries(analytics.category_wise || {});

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Expense Tracker</h1>
          <p className="subtitle">
            Track your spending, one day at a time.
          </p>
        </div>

        <a
          className="export-button"
          href={`${API}/export/csv`}
          target="_blank"
          rel="noreferrer"
        >
          Export CSV ↓
        </a>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="stats">
        <article className="stat-card">
          <p>Total spending</p>
          <h2>₹{Number(analytics.total_spending).toFixed(2)}</h2>
        </article>

        <article className="stat-card">
          <p>Average expense</p>
          <h2>₹{Number(analytics.average_expense).toFixed(2)}</h2>
        </article>

        <article className="stat-card">
          <p>Total transactions</p>
          <h2>{expenses.length}</h2>
        </article>
      </section>

      <section className="content">
        <article className="panel">
          <h2>Add an expense</h2>

          <form onSubmit={addExpense}>
            <label htmlFor="title">Expense name</label>
            <input
              id="title"
              name="title"
              placeholder="e.g. Lunch"
              value={form.title}
              onChange={handleChange}
              required
            />

            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 150"
              value={form.amount}
              onChange={handleChange}
              required
            />

            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option>Food</option>
              <option>Travel</option>
              <option>Shopping</option>
              <option>Education</option>
              <option>Bills</option>
              <option>Other</option>
            </select>

            <label htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "+ Add Expense"}
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Recent expenses</h2>

          {expenses.length === 0 ? (
            <p className="empty">
              No expenses yet. Add your first expense!
            </p>
          ) : (
            <div className="expense-list">
              {expenses.map((expense) => (
                <div className="expense-item" key={expense.id}>
                  <div className="expense-info">
                    <strong>{expense.title}</strong>
                    <span>
                      {expense.category} · {expense.date}
                    </span>
                  </div>

                  <div className="expense-actions">
                    <strong>
                      ₹{Number(expense.amount).toFixed(2)}
                    </strong>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deleteExpense(expense.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel analytics">
        <h2>Category-wise spending</h2>

        {categories.length === 0 ? (
          <p className="empty">Add expenses to see your analytics.</p>
        ) : (
          categories.map(([category, amount]) => (
            <div className="category-row" key={category}>
              <span>{category}</span>
              <strong>₹{Number(amount).toFixed(2)}</strong>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

export default App;
