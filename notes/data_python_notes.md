# PyForge Reference Notes: Data Analysis with Python

While libraries like Pandas and NumPy are standard in professional data science, understanding how to clean, aggregate, and format datasets using **pure Python** is essential for building core coding skills.

---

## 1. Structuring Datasets with Collections

In pure Python, datasets are typically modeled as a **list of dictionaries** (mimicking rows in a SQL table or CSV records):

```python
sales_data = [
    {"month": "Jan", "region": "North", "revenue": 12000, "units": 450},
    {"month": "Jan", "region": "South", "revenue": 15000, "units": 600},
    {"month": "Feb", "region": "North", "revenue": 14000, "units": 500},
    {"month": "Feb", "region": "South", "revenue": 18000, "units": 720}
]
```

---

## 2. Cleaning Datasets in Python

Here is how you clean data (e.g. dropping records with missing revenue fields or bad formats) using list comprehensions:

```python
raw_records = [
    {"item": "Laptop", "price": 999.00},
    {"item": "Mouse", "price": None},        # Bad row
    {"item": "Keyboard", "price": 45.00},
    {"item": "Monitor", "price": -10.00}     # Outlier / Corrupt data
]

# Clean pipeline: keep price if not None and greater than 0
clean_records = [r for r in raw_records if r["price"] is not None and r["price"] > 0]
print(clean_records)
# Output: [{'item': 'Laptop', 'price': 999.0}, {'item': 'Keyboard', 'price': 45.0}]
```

---

## 3. Data Aggregations & Grouping

To aggregate metrics (like grouping revenue by region or month), use dictionary accumulators:

```python
# Grouping revenue by region
revenue_by_region = {}

for record in sales_data:
    region = record["region"]
    revenue = record["revenue"]
    
    # Accumulate totals
    if region not in revenue_by_region:
        revenue_by_region[region] = 0
    revenue_by_region[region] += revenue

print(revenue_by_region)
# Output: {'North': 26000, 'South': 33000}
```

---

## 4. Formatting Datasets for Charting Engines

When sending calculated data to visualization widgets (like SVG charters or HTML interfaces), format the aggregated results as structured JSON:

```python
import json

# Format grouped dictionary into a list of labeled points
chart_data = []
for label, value in revenue_by_region.items():
    chart_data.append({
        "label": label,
        "value": value
    })

# Convert to JSON string
json_payload = json.dumps(chart_data)

# Print with special brackets so JavaScript can extract and plot it live
print(f"[[ {json_payload} ]]")
```
