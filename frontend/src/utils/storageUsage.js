export const CLOUDFLARE_STORAGE_LIMIT_BYTES = 3 * 1024 * 1024 * 1024;

export function vehicleImageUsage(car, measuredSizes = {}) {
  const entries = Array.isArray(car?.imageEntries) ? car.imageEntries : [];
  const imageSize = (image) => Number(image?.sizeBytes ?? image?.size);
  const getKnownSize = (image) => {
    const storedSize = imageSize(image);
    if (Number.isFinite(storedSize) && storedSize >= 0) return storedSize;
    const measuredSize = Number(measuredSizes[image.key]);
    return Number.isFinite(measuredSize) && measuredSize >= 0 ? measuredSize : null;
  };
  const knownBytes = entries.reduce((total, image) => total + (getKnownSize(image) ?? 0), 0);
  const knownUrls = new Set(entries.filter((image) => getKnownSize(image) !== null).map((image) => image.url));
  const unknownImages = (car?.images || []).filter((url) => !knownUrls.has(url)).length;
  return { knownBytes, unknownImages };
}

export function inventoryImageUsage(cars, measuredSizes = {}) {
  return (cars || []).reduce((total, car) => {
    const usage = vehicleImageUsage(car, measuredSizes);
    return { knownBytes: total.knownBytes + usage.knownBytes, unknownImages: total.unknownImages + usage.unknownImages };
  }, { knownBytes: 0, unknownImages: 0 });
}

export function formatBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(value < 10 * 1024 ? 1 : 0)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(value < 10 * 1024 ** 2 ? 1 : 0)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}
