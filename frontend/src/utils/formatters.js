export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage) {
  if (mileage == null || !Number.isFinite(Number(mileage))) return 'N/A';
  return `${new Intl.NumberFormat('en-US').format(mileage)} km`;
}
