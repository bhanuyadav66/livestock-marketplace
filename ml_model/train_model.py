"""
Livestock Price Prediction Model
=================================
Features:
  - animalType      : encoded integer (buffalo=0, cow=1, goat=2, sheep=3, poultry=4)
  - age             : float (years)
  - weight          : float (kg)
  - milking_capacity: float (L/day) [0 for sheep, poultry, or non-milking]
  - location_tier   : 0=rural, 1=small city, 2=metro
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score
import pickle, os

np.random.seed(42)
N = 1000  # training samples

rows = []

# ── BUFFALO ──────────────────────────────────────────────────
for _ in range(N // 5):
    age  = np.random.uniform(0.5, 12)
    weight = np.random.uniform(250, 700) + (age * 10)
    # Prime milking age is around 4-7
    is_milking = age > 2.5 and age < 11
    milking_capacity = np.random.uniform(5, 18) if is_milking else 0
    tier = np.random.choice([0, 1, 2], p=[0.4, 0.35, 0.25])
    
    age_factor = max(0, 1 - abs(age - 5) * 0.08)
    weight_factor = weight / 500.0
    milk_factor = milking_capacity / 10.0
    
    base = 50000 + tier * 20000
    price = int(base * (0.3 + age_factor * 0.3 + weight_factor * 0.2 + milk_factor * 0.4) + np.random.normal(0, 5000))
    price = max(30000, min(150000, price))
    rows.append([0, round(age, 1), round(weight, 1), round(milking_capacity, 1), tier, price])

# ── COW ──────────────────────────────────────────────────────
for _ in range(N // 5):
    age  = np.random.uniform(0.5, 12)
    weight = np.random.uniform(200, 500) + (age * 8)
    is_milking = age > 2 and age < 10
    milking_capacity = np.random.uniform(3, 25) if is_milking else 0
    tier = np.random.choice([0, 1, 2], p=[0.4, 0.35, 0.25])
    
    age_factor = max(0, 1 - abs(age - 4) * 0.09)
    weight_factor = weight / 350.0 
    milk_factor = milking_capacity / 12.0
    
    base = 35000 + tier * 15000
    price = int(base * (0.3 + age_factor * 0.3 + weight_factor * 0.2 + milk_factor * 0.4) + np.random.normal(0, 4000))
    price = max(20000, min(100000, price))
    rows.append([1, round(age, 1), round(weight, 1), round(milking_capacity, 1), tier, price])

# ── GOAT ─────────────────────────────────────────────────────
for _ in range(N // 5):
    age  = np.random.uniform(0.5, 8)
    weight = np.random.uniform(10, 60) + (age * 2)
    is_milking = age > 1.5 and age < 6
    milking_capacity = np.random.uniform(0.5, 3) if is_milking else 0
    tier = np.random.choice([0, 1, 2], p=[0.45, 0.35, 0.20])
    
    age_factor = max(0, 1 - abs(age - 3) * 0.1)
    weight_factor = weight / 35.0
    milk_factor = milking_capacity / 1.5
    
    base = 15000 + tier * 7000
    price = int(base * (0.2 + age_factor * 0.3 + weight_factor * 0.3 + milk_factor * 0.2) + np.random.normal(0, 2000))
    price = max(5000, min(50000, price))
    rows.append([2, round(age, 1), round(weight, 1), round(milking_capacity, 1), tier, price])

# ── SHEEP ────────────────────────────────────────────────────
for _ in range(N // 5):
    age  = np.random.uniform(0.5, 7)
    weight = np.random.uniform(15, 70) + (age * 2)
    milking_capacity = 0  # not relevant for our dairy price context
    tier = np.random.choice([0, 1, 2], p=[0.50, 0.30, 0.20])
    
    age_factor = max(0, 1 - abs(age - 2) * 0.12)
    weight_factor = weight / 40.0
    
    base = 14000 + tier * 5000
    price = int(base * (0.3 + age_factor * 0.4 + weight_factor * 0.5) + np.random.normal(0, 1500))
    price = max(5000, min(40000, price))
    rows.append([3, round(age, 1), round(weight, 1), milking_capacity, tier, price])

# ── POULTRY ──────────────────────────────────────────────────
for _ in range(N // 5):
    age  = np.random.uniform(0.1, 3)
    weight = np.random.uniform(0.5, 4) + (age * 0.2)
    milking_capacity = 0
    tier = np.random.choice([0, 1, 2], p=[0.40, 0.35, 0.25])
    
    base = 500 + tier * 300
    weight_factor = weight / 2.0
    
    price = int(base * (0.4 + weight_factor * 0.6) + np.random.normal(0, 100))
    price = max(200, min(2000, price))
    rows.append([4, round(age, 1), round(weight, 1), milking_capacity, tier, price])

df = pd.DataFrame(rows, columns=["animalType", "age", "weight", "milking_capacity", "location_tier", "price"])

X = df[["animalType", "age", "weight", "milking_capacity", "location_tier"]]
y = df["price"]

# ── Train model ───────────────────────────────────────────────
model = GradientBoostingRegressor(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.1,
    subsample=0.8,
    random_state=42,
)
model.fit(X, y)

# ── Cross-validation score ────────────────────────────────────
cv_scores = cross_val_score(model, X, y, cv=5, scoring="r2")
print(f"✅ Model trained — R² score: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# ── Save ──────────────────────────────────────────────────────
out_dir = os.path.dirname(os.path.abspath(__file__))
pkl_path = os.path.join(out_dir, "model.pkl")
with open(pkl_path, "wb") as f:
    pickle.dump(model, f)

print(f"✅ Saved to {pkl_path}")
