/**
 * AI Engine for FarmChain X
 * Analyzes IoT sensor data to provide health scores and recommendations.
 */

const analyzeCropHealth = (sensorData) => {
  if (!sensorData) return { score: 0, status: 'No Data', color: 'slate-400' };

  const { temperature, moisture, nutrients } = sensorData;
  let score = 0;
  let alerts = [];

  // Moisture Scoring (Ideal: 35-55%)
  if (moisture >= 35 && moisture <= 55) {
    score += 40;
  } else if (moisture > 20 && moisture < 70) {
    score += 20;
    alerts.push(moisture < 35 ? 'Low Moisture' : 'High Moisture');
  } else {
    alerts.push('Critical Water Level');
  }

  // Nutrients Scoring (Ideal: >75%)
  if (nutrients >= 75) {
    score += 40;
  } else if (nutrients >= 50) {
    score += 20;
    alerts.push('Suboptimal Nutrients');
  } else {
    alerts.push('Nutrient Depletion');
  }

  // Temperature Scoring (Ideal: 24-30 C)
  if (temperature >= 24 && temperature <= 30) {
    score += 20;
  } else {
    alerts.push(temperature < 24 ? 'Cold Stress' : 'Heat Stress');
  }

  // Determine Overall Status
  let status = 'Optimal';
  let color = 'emerald-500';

  if (score < 40) {
    status = 'Critical';
    color = 'red-500';
  } else if (score < 80) {
    status = 'Stable';
    color = 'amber-500';
  }

  return {
    score,
    status,
    color,
    alerts: alerts.length > 0 ? alerts : ['All Systems Nominal'],
    recommendation: getRecommendation(status, alerts)
  };
};

const getRecommendation = (status, alerts) => {
  if (status === 'Optimal') return 'Maintain current irrigation and nutrient scheduling.';
  if (alerts.includes('Critical Water Level')) return 'Immediate irrigation required to prevent crop wilting.';
  if (alerts.includes('Low Moisture')) return 'Slightly increase irrigation duration for the next cycle.';
  if (alerts.includes('Heat Stress')) return 'Apply cooling misting or increase hydration to offset heat.';
  if (alerts.includes('Nutrient Depletion')) return 'Immediate N-P-K fertilization supplement recommended.';
  return 'Monitor environmental variables closely for the next 24 hours.';
};

module.exports = { analyzeCropHealth };
