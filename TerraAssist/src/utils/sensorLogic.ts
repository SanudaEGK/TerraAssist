// Returns soil moisture status based on raw ADC value
// Typical resistive sensor: ~4095 = completely dry, ~1000 = fully wet
export const getSoilMoistureStatus = (value: number): { label: string; color: string } => {
  if (value > 2800) {
    return { label: 'Dry', color: 'red' };
  } else if (value > 1500) {
    return { label: 'Normal', color: 'green' };
  } else {
    return { label: 'Wet', color: 'green' };
  }
};
