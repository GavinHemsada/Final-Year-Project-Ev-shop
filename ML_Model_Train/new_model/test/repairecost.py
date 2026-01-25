import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

os.makedirs('models', exist_ok=True)

def prepare_simplified_repair_data(df):
    """
    Prepare data using only essential features
    Minimal inputs needed for repair cost prediction
    """
    # Filter only records that need repair
    df_repair = df[df['needs_repair'] == True].copy()
    
    print(f"Total records with repairs: {len(df_repair)}")
    
    # SIMPLIFIED FEATURE SET - Only essential information
    feature_cols = [
        'age_years',           # Vehicle age
        'mileage_km',          # How much driven
        'battery_health_percent',  # Battery condition
        'battery_capacity_kwh'     # Battery size (affects repair cost)
    ]
    
    # Encode categorical variables
    le_model = LabelEncoder()
    le_repair = LabelEncoder()
    
    df_repair['model_encoded'] = le_model.fit_transform(df_repair['model'])
    df_repair['repair_type_encoded'] = le_repair.fit_transform(df_repair['repair_type'])
    
    feature_cols.extend(['model_encoded', 'repair_type_encoded'])
    
    # Create feature matrix
    X = df_repair[feature_cols].copy()
    y = df_repair['out_of_pocket_cost_lkr']
    
    # Handle missing values
    if X.isnull().sum().sum() > 0:
        X = X.fillna(X.mean())
    
    encoders = {
        'model': le_model,
        'repair_type': le_repair
    }
    
    return X, y, encoders, feature_cols


def train_simplified_repair_model(df, model_dir='models'):
    """
    Train simplified repair cost prediction model
    Uses minimal features for easier prediction
    """
    X, y, encoders, feature_cols = prepare_simplified_repair_data(df)
    
    print("\n" + "="*70)
    print("TRAINING SIMPLIFIED REPAIR COST MODEL")
    print("="*70)
    print(f"\nFeatures used: {len(feature_cols)}")
    print(f"Dataset size: {len(X):,} repairs")
    print(f"Cost range: LKR {y.min():,.2f} - LKR {y.max():,.2f}")
    print(f"Average cost: LKR {y.mean():,.2f}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Train model with optimized parameters
    print("\nTraining model...")
    model = GradientBoostingRegressor(
        n_estimators=250,
        max_depth=8,
        learning_rate=0.08,
        min_samples_split=8,
        min_samples_leaf=4,
        subsample=0.85,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred_test = model.predict(X_test)
    
    print("\n" + "="*70)
    print("MODEL PERFORMANCE")
    print("="*70)
    
    mae = mean_absolute_error(y_test, y_pred_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    r2 = r2_score(y_test, y_pred_test)
    
    print(f"\nTest Set Metrics:")
    print(f"MAE:  LKR {mae:,.2f}")
    print(f"RMSE: LKR {rmse:,.2f}")
    print(f"R²:   {r2:.4f}")
    
    # Feature importance
    print("\n" + "="*70)
    print("FEATURE IMPORTANCE")
    print("="*70)
    
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(importance_df.to_string(index=False))
    
    # Save everything
    joblib.dump(model, f'{model_dir}/simple_repair_cost_model.pkl')
    joblib.dump(encoders, f'{model_dir}/simple_repair_cost_encoders.pkl')
    joblib.dump(feature_cols, f'{model_dir}/simple_repair_cost_features.pkl')
    
    print("\n" + "="*70)
    print("✅ MODEL SAVED")
    print("="*70)
    
    return model, encoders, feature_cols


def predict_repair_cost(model, encoders, feature_cols, 
                        age_years, mileage_km, battery_health, 
                        battery_capacity, model_name, repair_type):
    """
    Predict repair cost with minimal inputs
    
    Parameters:
    -----------
    age_years : float
        Vehicle age in years
    mileage_km : int
        Total mileage in kilometers
    battery_health : float
        Battery health percentage (0-100)
    battery_capacity : int
        Battery capacity in kWh
    model_name : str
        Vehicle model (e.g., 'Nissan Leaf', 'Tesla Model 3')
    repair_type : str
        Type of repair needed (e.g., 'Battery Replacement', 'Motor Repair')
    
    Returns:
    --------
    float : Predicted repair cost in LKR
    """
    # Create input dataframe
    input_data = {
        'age_years': age_years,
        'mileage_km': mileage_km,
        'battery_health_percent': battery_health,
        'battery_capacity_kwh': battery_capacity
    }
    
    df = pd.DataFrame([input_data])
    
    # Encode categorical variables with fallback
    try:
        df['model_encoded'] = encoders['model'].transform([model_name])[0]
    except:
        print(f"⚠️  Unknown model '{model_name}', using default")
        df['model_encoded'] = 0
    
    try:
        df['repair_type_encoded'] = encoders['repair_type'].transform([repair_type])[0]
    except:
        print(f"⚠️  Unknown repair type '{repair_type}', using default")
        df['repair_type_encoded'] = 0
    
    # Ensure correct feature order
    df = df[feature_cols]
    
    # Predict
    prediction = model.predict(df)[0]
    
    return max(0, prediction)  # Ensure non-negative


# ==================== MAIN EXECUTION ====================

# Load data
df = pd.read_csv('sl_ev_repair_cost_dataset.csv')
print(f"Loaded {len(df):,} records\n")

# Train model
model, encoders, features = train_simplified_repair_model(df)

# ==================== EXAMPLE PREDICTIONS ====================

print("\n" + "="*70)
print("EXAMPLE PREDICTIONS")
print("="*70)

# Example 1: Minor repair on newer vehicle
cost_1 = predict_repair_cost(
    model, encoders, features,
    age_years=2,
    mileage_km=25000,
    battery_health=90,
    battery_capacity=64,
    model_name='BYD Atto 3',
    repair_type='Charging Port Repair'
)
print(f"\n📝 Example 1: Minor Repair (2 years old, good condition)")
print(f"   Predicted Cost: LKR {cost_1:,.2f}")

# Example 2: Battery replacement on older vehicle
cost_2 = predict_repair_cost(
    model, encoders, features,
    age_years=7,
    mileage_km=85000,
    battery_health=65,
    battery_capacity=40,
    model_name='Nissan Leaf',
    repair_type='Battery Replacement'
)
print(f"\n📝 Example 2: Battery Replacement (7 years old, degraded)")
print(f"   Predicted Cost: LKR {cost_2:,.2f}")

# Example 3: Motor repair on mid-age vehicle
cost_3 = predict_repair_cost(
    model, encoders, features,
    age_years=4,
    mileage_km=55000,
    battery_health=78,
    battery_capacity=75,
    model_name='Tesla Model 3',
    repair_type='Motor Repair'
)
print(f"\n📝 Example 3: Motor Repair (4 years old, moderate use)")
print(f"   Predicted Cost: LKR {cost_3:,.2f}")

print("\n" + "="*70)

# Show available models and repair types
print("\n📋 AVAILABLE MODELS:")
print(", ".join(sorted(encoders['model'].classes_[:10])) + "...")

print("\n🔧 AVAILABLE REPAIR TYPES:")
print(", ".join(sorted(encoders['repair_type'].classes_)))