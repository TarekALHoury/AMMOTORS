export function formatMileage(mileage) {
  const kilometers = Number(mileage);
  if (mileage == null || !Number.isFinite(kilometers)) return 'N/A';
  return `${new Intl.NumberFormat('en-US').format(Math.round(kilometersToMiles(kilometers)))} mi`;
}

export const MILES_TO_KILOMETERS = 1.609344;

export function milesToKilometers(miles) {
  return Number(miles) * MILES_TO_KILOMETERS;
}

export function kilometersToMiles(kilometers) {
  return Number(kilometers) / MILES_TO_KILOMETERS;
}
