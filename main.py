from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Expense Tracker API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

expenses = []
next_id = 1


class Expense(BaseModel):
    title: str
    amount: float = Field(gt=0)
    category: str
    date: str


@app.get("/")
def home():
    return {"message": "Expense Tracker API is running"}


@app.post("/expenses")
def add_expense(expense: Expense):
    global next_id

    new_expense = expense.model_dump()
    new_expense["id"] = next_id

    expenses.append(new_expense)
    next_id += 1

    return new_expense


@app.get("/expenses")
def get_expenses():
    return expenses


@app.get("/expenses/{expense_id}")
def get_expense(expense_id: int):
    for expense in expenses:
        if expense["id"] == expense_id:
            return expense

    raise HTTPException(
        status_code=404,
        detail="Expense not found"
    )


@app.put("/expenses/{expense_id}")
def update_expense(expense_id: int, updated: Expense):
    for expense in expenses:
        if expense["id"] == expense_id:
            expense.update(updated.model_dump())
            return {
                "message": "Expense updated",
                "expense": expense
            }

    raise HTTPException(
        status_code=404,
        detail="Expense not found"
    )


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):
    for expense in expenses:
        if expense["id"] == expense_id:
            expenses.remove(expense)
            return {"message": "Expense deleted"}

    raise HTTPException(
        status_code=404,
        detail="Expense not found"
    )


import csv
import io
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware


@app.get("/export/csv")
def export_csv():
    output = io.StringIO()

    fields = ["id", "title", "amount", "category", "date"]

    writer = csv.DictWriter(
        output,
        fieldnames=fields
    )

    writer.writeheader()
    writer.writerows(expenses)

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=expenses.csv"
        }
    )


import pandas as pd
import numpy as np


@app.get("/analytics")
def get_analytics():
    if not expenses:
        return {
            "total_spending": 0,
            "average_expense": 0,
            "category_wise": {}
        }

    df = pd.DataFrame(expenses)
    amounts = df["amount"].to_numpy()

    total = float(np.sum(amounts))
    average = float(np.mean(amounts))

    category_wise = (
        df.groupby("category")["amount"]
        .sum()
        .to_dict()
    )

    return {
        "total_spending": total,
        "average_expense": round(average, 2),
        "category_wise": category_wise
    }
