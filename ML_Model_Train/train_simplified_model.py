
import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

def train_and_convert():
    print("Loading dataset...")
    df = pd.read_csv('sl_ev_repair_cost_dataset.csv')
    
    # Filter only records that need repair
    df_repair = df[df['needs_repair'] == True].copy()
    
    # Initialize encoders
    le_model = LabelEncoder()
    le_repair = LabelEncoder()
    
    # Encode categorical variables
    df_repair['model_encoded'] = le_model.fit_transform(df_repair['model'])
    df_repair['repair_type_encoded'] = le_repair.fit_transform(df_repair['repair_type'])
    
    # Select ONLY the 6 requested features
    feature_cols = [
        'age_years',
        'mileage_km',
        'battery_health_percent',
        'battery_capacity_kwh',
        'model_encoded',
        'repair_type_encoded'
    ]
    
    X = df_repair[feature_cols].copy()
    y = df_repair['out_of_pocket_cost_lkr'] # Target
    
    # Handle missing values
    if X.isnull().sum().sum() > 0:
        X = X.fillna(X.mean())

    print(f"Training with {len(feature_cols)} features: {feature_cols}")
    
    # Train model
    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=10,
        learning_rate=0.1,
        random_state=42
    )
    model.fit(X, y)
    print("Training complete.")
    
    # Save artifacts
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/repair_cost_out_of_pocket_model.pkl')
    joblib.dump(feature_cols, 'models/repair_cost_out_of_pocket_features.pkl')
    
    # Convert to ONNX
    print("Converting to ONNX...")
    initial_type = [('float_input', FloatTensorType([None, len(feature_cols)]))]
    onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=12)
    
    os.makedirs('ONNXmodels', exist_ok=True)
    with open("ONNXmodels/repair_cost_model.onnx", "wb") as f:
        f.write(onnx_model.SerializeToString())
        
    print("ONNX model saved to ONNXmodels/repair_cost_model.onnx")

if __name__ == "__main__":
    train_and_convert()
