class InventoryQueryError extends Error {
  constructor(errors) {
    super('Invalid inventory query.');
    this.name = 'InventoryQueryError';
    this.errors = errors;
  }
}

const SORTS = {
  newest: (a, b) => b.year - a.year || a.id.localeCompare(b.id),
  oldest: (a, b) => a.year - b.year || a.id.localeCompare(b.id),
  'price-high': (a, b) => b.price - a.price || a.id.localeCompare(b.id),
  'price-low': (a, b) => a.price - b.price || a.id.localeCompare(b.id),
  'mileage-high': (a, b) => b.mileage - a.mileage || a.id.localeCompare(b.id),
  'mileage-low': (a, b) => a.mileage - b.mileage || a.id.localeCompare(b.id),
  make: (a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`) || a.id.localeCompare(b.id),
};
const STATUSES = new Set(['available', 'reserved', 'sold']);
const FILTER_FIELDS = ['make', 'model'];
const NUMBER_FILTERS = ['year', 'minPrice', 'maxPrice', 'minMileage', 'maxMileage'];

function encodeCursor(offset) {
  return Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url');
}

function decodeCursor(value, errors) {
  if (!value) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!Number.isSafeInteger(parsed.offset) || parsed.offset < 0) throw new Error();
    return parsed.offset;
  } catch {
    errors.cursor = 'Must be a valid pagination cursor.';
    return 0;
  }
}

function parseInventoryQuery(query) {
  const errors = {};
  const allowed = new Set(['search', 'status', 'sort', 'limit', 'cursor', ...FILTER_FIELDS, ...NUMBER_FILTERS]);
  const unknown = Object.keys(query).filter((key) => !allowed.has(key));
  if (unknown.length) errors.query = `Unknown parameters: ${unknown.join(', ')}.`;
  const result = {
    search: typeof query.search === 'string' ? query.search.trim().toLowerCase().slice(0, 120) : '',
    status: query.status || '',
    sort: query.sort || 'newest',
    limit: query.limit == null ? 24 : Number(query.limit),
  };
  for (const field of FILTER_FIELDS) {
    result[field] = typeof query[field] === 'string' ? query[field].trim().toLowerCase().slice(0, 120) : '';
  }
  for (const field of NUMBER_FILTERS) {
    if (query[field] == null || query[field] === '') continue;
    result[field] = Number(query[field]);
    if (!Number.isFinite(result[field]) || result[field] < 0) errors[field] = 'Must be a non-negative number.';
  }
  if (result.status && !STATUSES.has(result.status)) errors.status = 'Must be available, reserved, or sold.';
  if (!Object.hasOwn(SORTS, result.sort)) errors.sort = `Must be one of: ${Object.keys(SORTS).join(', ')}.`;
  if (!Number.isSafeInteger(result.limit) || result.limit < 1 || result.limit > 100) errors.limit = 'Must be an integer between 1 and 100.';
  result.offset = decodeCursor(query.cursor, errors);
  if (result.minPrice != null && result.maxPrice != null && result.minPrice > result.maxPrice) errors.price = 'Minimum price cannot exceed maximum price.';
  if (result.minMileage != null && result.maxMileage != null && result.minMileage > result.maxMileage) errors.mileage = 'Minimum mileage cannot exceed maximum mileage.';
  if (Object.keys(errors).length) throw new InventoryQueryError(errors);
  return result;
}

function queryInventory(cars, query) {
  const searchableFields = ['make', 'model', 'year', 'price', 'mileage', 'engine', 'transmission', 'drivetrain', 'fuel', 'description', 'status'];
  const filtered = cars.filter((car) => {
    const searchable = searchableFields.map((field) => car[field] ?? '').join(' ').toLowerCase();
    return (!query.search || query.search.split(/\s+/).every((word) => searchable.includes(word)))
      && (!query.status || car.status === query.status)
      && (!query.make || car.make.toLowerCase() === query.make)
      && (!query.model || car.model.toLowerCase() === query.model)
      && (query.year == null || car.year === query.year)
      && (query.minPrice == null || car.price >= query.minPrice)
      && (query.maxPrice == null || car.price <= query.maxPrice)
      && (query.minMileage == null || car.mileage >= query.minMileage)
      && (query.maxMileage == null || car.mileage <= query.maxMileage);
  }).sort(SORTS[query.sort]);
  const items = filtered.slice(query.offset, query.offset + query.limit);
  const nextOffset = query.offset + items.length;
  return {
    items,
    page: { limit: query.limit, hasMore: nextOffset < filtered.length, nextCursor: nextOffset < filtered.length ? encodeCursor(nextOffset) : null },
  };
}

module.exports = { InventoryQueryError, parseInventoryQuery, queryInventory };
