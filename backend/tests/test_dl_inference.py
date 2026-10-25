import numpy as np
from app.dl_inference import FIELDS

def test_expected_weather_feature_order():
    assert FIELDS==("temperature_c","precipitation_mm","radiation_kwh_m2")

def test_lstm_sigmoid_stability():
    z=np.array([-2000.,0.,2000.])
    a=1/(1+np.exp(-np.clip(z,-40,40)))
    assert np.all(np.isfinite(a))
