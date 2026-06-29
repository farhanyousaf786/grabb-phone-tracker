export const getLimitLevelLabel = (limit: number) => {
  if (limit < 100) return 'Light awareness';
  if (limit < 200) return 'Moderate habit';
  if (limit < 300) return 'Strong habit';
  if (limit < 400) return 'Heavy habit';
  return 'Compulsive habit';
};

export const getLimitLevelColor = (limit: number) => {
  if (limit < 100) return '#4ADE80'; // Green
  if (limit < 200) return '#FBBF24'; // Yellow
  if (limit < 300) return '#F97316'; // Orange
  if (limit < 400) return '#EF4444'; // Red
  return '#B91C1C'; // Dark Red
};
