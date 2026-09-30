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
  const miles = Math.round(kilometers * 0.621371);
  const number = new Intl.NumberFormat('en-US');
  return `${number.format(kilometers)} km | ${number.format(miles)} mi`;
}
