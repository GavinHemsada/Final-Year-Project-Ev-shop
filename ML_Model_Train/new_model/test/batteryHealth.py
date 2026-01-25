import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

os.makedirs('models', exist_ok=True)

def generate_realistic_battery_data(n_samples=5000):
    """
    Generate synthetic battery health data with realistic degradation patterns
    This ensures proper relationships without data leakage
    """
    np.random.seed(42)
    
    data = []
    
    ev_models = [
        'Tesla Model 3', 'Nissan Leaf', 'Chevrolet Bolt', 'BMW i3',
        'Hyundai Kona Electric', 'Volkswagen ID.4', 'Ford Mustang Mach-E',
        'Audi e-tron', 'Rivian R1T', 'BYD Atto 3', 'MG ZS EV'
    ]
    
    for _ in range(n_samples):
        # Base parameters
        age_years = np.random.uniform(0.1, 10)
        age_months = age_years * 12
        
        # Mileage correlates with age
        annual_mileage = np.random.uniform(8000, 25000)
        mileage = age_years * annual_mileage + np.random.normal(0, 2000)
        
        # Battery cycles (roughly 1 cycle per 300 km)
        battery_cycles = int(mileage / 300 + np.random.normal(0, 50))
        
        # Fast charging ratio (newer drivers tend to fast charge more)
        fast_charge_ratio = np.random.beta(2, 5) if age_years < 3 else np.random.beta(1.5, 4)
        
        # Temperature (affects degradation)
        avg_temperature_c = np.random.uniform(15, 40)
        
        # Depth of discharge
        avg_depth_of_discharge = np.random.uniform(0.3, 0.9)
        
        # Voltage decreases slightly with age
        voltage = 400 - (age_years * 1.5) + np.random.normal(0, 5)
        
        # Internal resistance increases with degradation
        base_resistance = 2.0 + (age_years * 0.8)
        internal_resistance_mohm = base_resistance + np.random.uniform(0, 1)
        
        # Charging efficiency decreases over time
        charging_efficiency = 0.95 - (age_years * 0.008) + np.random.uniform(-0.02, 0.01)
        charging_efficiency = max(0.80, min(0.98, charging_efficiency))
        
        # Battery capacity (vehicle-specific)
        model = np.random.choice(ev_models)
        if 'Tesla' in model:
            battery_capacity_kwh = np.random.choice([50, 75, 100])
        elif 'Nissan Leaf' in model:
            battery_capacity_kwh = np.random.choice([40, 62])
        elif 'Rivian' in model:
            battery_capacity_kwh = np.random.choice([135, 180])
        else:
            battery_capacity_kwh = np.random.choice([50, 60, 75, 82])
        
        # ====== CALCULATE BATTERY HEALTH (This is the key!) ======
        # Start at 100% and apply degradation factors
        
        battery_health = 100.0
        
        # 1. Age degradation (calendar aging) - ~2-3% per year
        calendar_degradation = age_years * np.random.uniform(2, 3)
        battery_health -= calendar_degradation
        
        # 2. Cycle degradation - depends on depth of discharge
        cycle_factor = 0.01 if avg_depth_of_discharge < 0.5 else 0.015
        cycle_degradation = battery_cycles * cycle_factor * avg_depth_of_discharge
        battery_health -= cycle_degradation
        
        # 3. Fast charging degradation - accelerates aging
        fast_charge_degradation = fast_charge_ratio * battery_cycles * 0.005
        battery_health -= fast_charge_degradation
        
        # 4. Temperature stress
        if avg_temperature_c > 35:
            temp_degradation = (avg_temperature_c - 35) * age_years * 0.3
            battery_health -= temp_degradation
        elif avg_temperature_c < 10:
            temp_degradation = (10 - avg_temperature_c) * age_years * 0.15
            battery_health -= temp_degradation
        
        # 5. High mileage penalty
        if mileage > 100000:
            battery_health -= (mileage - 100000) / 10000 * 0.5
        
        # Add some random variation
        battery_health += np.random.normal(0, 2)
        
        # Clamp between realistic values
        battery_health = max(40, min(100, battery_health))
        
        data.append({
            'model': model,
            'age_years': round(age_years, 2),
            'mileage': int(mileage),
            'battery_cycles': battery_cycles,
            'fast_charge_ratio': round(fast_charge_ratio, 3),
            'avg_temperature_c': round(avg_temperature_c, 1),
            'avg_depth_of_discharge': round(avg_depth_of_discharge, 3),
            'voltage': round(voltage, 2),
            'internal_resistance_mohm': round(internal_resistance_mohm, 2),
            'charging_efficiency': round(charging_efficiency, 3),
            'battery_capacity_kwh': battery_capacity_kwh,
            'battery_health_percent': round(battery_health, 2)
        })
    
    return pd.DataFrame(data)


def prepare_battery_health_data(df):
    """Prepare features WITHOUT data leakage"""
    feature_cols = [
        'age_years', 
        'mileage', 
        'battery_cycles', 
        'fast_charge_ratio',
        'avg_temperature_c', 
        'avg_depth_of_discharge', 
        'voltage',
        'internal_resistance_mohm',
        'charging_efficiency',
        'battery_capacity_kwh'
    ]
    
    # Encode model
    le_model = LabelEncoder()
    df['model_encoded'] = le_model.fit_transform(df['model'])
    feature_cols.append('model_encoded')
    
    X = df[feature_cols].copy()
    y = df['battery_health_percent']
    
    return X, y, le_model, feature_cols


def train_battery_health_model(df):
    """Train battery health prediction model"""
    X, y, le_model, feature_cols = prepare_battery_health_data(df)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Optimized hyperparameters
    model = GradientBoostingRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        min_samples_split=10,
        min_samples_leaf=4,
        subsample=0.8,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    
    print("=" * 50)
    print("Battery Health Model Performance")
    print("=" * 50)
    print(f"MAE:  {mean_absolute_error(y_test, y_pred):.4f}%")
    print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}%")
    print(f"R²:   {r2_score(y_test, y_pred):.4f}")
    print("=" * 50)
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nTop 5 Most Important Features:")
    print(feature_importance.head())
    
    # Save model and encoders
    joblib.dump(model, 'models/battery_health_model.pkl')
    joblib.dump(le_model, 'models/battery_health_label_encoder.pkl')
    joblib.dump(feature_cols, 'models/battery_health_features.pkl')
    
    print("\n✅ Model saved successfully!")
    
    return model, le_model, feature_cols


def predict_battery_health(model, le_model, feature_cols, input_data):
    """Make prediction with the trained model"""
    input_df = pd.DataFrame([input_data])
    
    # Encode model
    try:
        input_df['model_encoded'] = le_model.transform(input_df['model'])
    except:
        input_df['model_encoded'] = 0  # Default to first model
    
    input_df = input_df.drop(columns=['model'])
    
    # Ensure correct feature order
    input_df = input_df[feature_cols]
    
    # Predict
    prediction = model.predict(input_df)[0]
    
    return max(0, min(100, prediction))  # Clamp between 0-100


# ==================== MAIN EXECUTION ====================

print("Generating realistic synthetic battery degradation data...")
df = generate_realistic_battery_data(n_samples=5000)

print(f"Generated {len(df)} records")
print(f"\nBattery Health Distribution:")
print(f"Min:  {df['battery_health_percent'].min():.2f}%")
print(f"Max:  {df['battery_health_percent'].max():.2f}%")
print(f"Mean: {df['battery_health_percent'].mean():.2f}%")
print(f"Std:  {df['battery_health_percent'].std():.2f}%")

# Train model
model, le_model, feature_cols = train_battery_health_model(df)

# ==================== TEST PREDICTIONS ====================

print("\n" + "=" * 50)
print("TEST PREDICTIONS")
print("=" * 50)

# Test case 1: High usage, older vehicle (should be LOW health)
test_1 = {
    'age_years': 3,
    'mileage': 45000,
    'battery_cycles': 800,
    'fast_charge_ratio': 0.35,
    'avg_temperature_c': 32,
    'avg_depth_of_discharge': 0.7,
    'voltage': 380,
    'internal_resistance_mohm': 4.5,
    'charging_efficiency': 0.92,
    'battery_capacity_kwh': 75,
    'model': 'Tesla Model 3'
}

pred_1 = predict_battery_health(model, le_model, feature_cols, test_1)
print(f"\nTest 1 (High usage, 3 years old):")
print(f"🔋 Predicted Battery Health: {pred_1:.2f}%")
print(f"   Expected: ~75-85% (moderate degradation)")

# Test case 2: New vehicle, low usage (should be HIGH health)
test_2 = {
    'age_years': 0.5,
    'mileage': 5000,
    'battery_cycles': 50,
    'fast_charge_ratio': 0.1,
    'avg_temperature_c': 20,
    'avg_depth_of_discharge': 0.5,
    'voltage': 395,
    'internal_resistance_mohm': 2.0,
    'charging_efficiency': 0.95,
    'battery_capacity_kwh': 75,
    'model': 'Tesla Model 3'
}

pred_2 = predict_battery_health(model, le_model, feature_cols, test_2)
print(f"\nTest 2 (New vehicle, low usage):")
print(f"🔋 Predicted Battery Health: {pred_2:.2f}%")
print(f"   Expected: ~95-99% (minimal degradation)")

# Test case 3: Very old, extreme usage (should be VERY LOW health)
test_3 = {
    'age_years': 5,
    'mileage': 100000,
    'battery_cycles': 1500,
    'fast_charge_ratio': 0.6,
    'avg_temperature_c': 40,
    'avg_depth_of_discharge': 0.9,
    'voltage': 370,
    'internal_resistance_mohm': 8.0,
    'charging_efficiency': 0.85,
    'battery_capacity_kwh': 75,
    'model': 'Tesla Model 3'
}

pred_3 = predict_battery_health(model, le_model, feature_cols, test_3)
print(f"\nTest 3 (Extreme usage, 5 years old):")
print(f"🔋 Predicted Battery Health: {pred_3:.2f}%")
print(f"   Expected: ~55-70% (heavy degradation)")

# Test case 4: Mid-age, good conditions (should be MEDIUM-HIGH health)
test_4 = {
    'age_years': 2,
    'mileage': 25000,
    'battery_cycles': 300,
    'fast_charge_ratio': 0.2,
    'avg_temperature_c': 22,
    'avg_depth_of_discharge': 0.6,
    'voltage': 390,
    'internal_resistance_mohm': 3.0,
    'charging_efficiency': 0.94,
    'battery_capacity_kwh': 75,
    'model': 'Tesla Model 3'
}

pred_4 = predict_battery_health(model, le_model, feature_cols, test_4)
print(f"\nTest 4 (Mid-age, good conditions):")
print(f"🔋 Predicted Battery Health: {pred_4:.2f}%")
print(f"   Expected: ~88-92% (low degradation)")

print("\n" + "=" * 50)
print("✅ Model now shows realistic variation!")
print("=" * 50)