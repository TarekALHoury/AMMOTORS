export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage) {
  const kilometers = Number(mileage);
  if (mileage == null || !Number.isFinite(kilometers)) return 'N/A';
  return `${new Intl.NumberFormat('en-US').format(kilometers)} km`;
}

export function formatMileageWithMiles(mileage) {
  const kilometers = Number(mileage);
  if (mileage == null || !Number.isFinite(kilometers)) return 'N/A';
  const miles = Math.round(kilometersToMiles(kilometers));
  const number = new Intl.NumberFormat('en-US');
  return `${number.format(kilometers)} km | ${number.format(miles)} mi`;
}

export const MILES_TO_KILOMETERS = 1.609344;

export function milesToKilometers(miles) {
  return Number(miles) * MILES_TO_KILOMETERS;
}

export function kilometersToMiles(kilometers) {
  return Number(kilometers) / MILES_TO_KILOMETERS;
}
