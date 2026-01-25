import joblib
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import numpy as np
import os

model = joblib.load("models/simple_repair_cost_model.pkl")
feature_cols = joblib.load("models/simple_repair_cost_features.pkl")

initial_type = [
    ('float_input', FloatTensorType([None, len(feature_cols)]))
]

onnx_model = convert_sklearn(
    model,
    initial_types=initial_type,
    target_opset=12
)

os.makedirs('ONNXmodels', exist_ok=True)

with open("ONNXmodels/repair_cost_model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())

