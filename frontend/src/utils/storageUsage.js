export const CLOUDFLARE_STORAGE_LIMIT_BYTES = 3 * 1024 * 1024 * 1024;
export const STORAGE_WARNING_BYTES = 2.5 * 1024 ** 3;

export function vehicleImageUsage(car, measuredSizes = {}) {
  const entries = Array.isArray(car?.imageEntries) ? car.imageEntries : [];
  const imageSize = (image) => image?.sizeBytes != null || image?.size != null
    ? Number(image.sizeBytes ?? image.size) : NaN;
  const getKnownSize = (image) => {
    const storedSize = imageSize(image);
    if (Number.isFinite(storedSize) && storedSize >= 0) return storedSize;
    const measuredSize = image?.key && measuredSizes[image.key] != null ? Number(measuredSizes[image.key]) : NaN;
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

export function formatRemainingBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value >= 1024 ** 3) return `${(Math.floor(value / 1024 ** 3 * 100) / 100).toFixed(2)} GB`;
  return formatBytes(value);
}
