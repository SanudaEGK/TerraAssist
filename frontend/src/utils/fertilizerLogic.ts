export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Returns how many more days until the fertilizer can be activated again (30-day lock)
export const calculateFertilizerDaysRemaining = (lastActivatedDate: string): number => {
  if (!lastActivatedDate) return 0;

  const lastDate = new Date(lastActivatedDate);
  const today = new Date();

  const diffInTime = today.getTime() - lastDate.getTime();
  const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

  const remaining = 30 - diffInDays;
  return remaining > 0 ? remaining : 0;
};
