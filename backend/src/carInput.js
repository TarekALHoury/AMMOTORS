class CarValidationError extends Error {
  constructor(errors) {
    super('Invalid car data.');
    this.name = 'CarValidationError';
    this.errors = errors;
  }
}

const statuses = new Set(['available', 'reserved', 'sold']);
const specificationFields = new Set([
  'mileage',
  'engine',
  'horsepower',
  'transmission',
  'drivetrain',
  'fuel',
  'exteriorColor',
  'interiorColor',
]);
const carFields = new Set([
  'make',
  'model',
  'year',
  'price',
  'description',
  'status',
  'specifications',
  'images',
]);

function cleanText(value) {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function textValue(value, field, errors, { max = 120, required = true } = {}) {
  if (value == null && !required) return undefined;
  if (typeof value !== 'string') {
    errors[field] = 'Must be a string.';
    return undefined;
  }
  const cleaned = cleanText(value);
  if ((required && !cleaned) || cleaned.length > max) {
    errors[field] = `Must contain between ${required ? 1 : 0} and ${max} characters.`;
  }
  return cleaned;
}

function numberValue(value, field, errors, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isFinite(value) || value < min || value > max) {
    errors[field] = `Must be a number between ${min} and ${max}.`;
    return undefined;
  }
  return value;
}

function normalizeSpecifications(value, errors, partial) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.specifications = 'Must be an object.';
    return undefined;
  }

  const unknown = Object.keys(value).filter((field) => !specificationFields.has(field));
  if (unknown.length) errors.specifications = `Unknown fields: ${unknown.join(', ')}.`;

  const result = {};
  const stringFields = [
    'engine', 'transmission', 'drivetrain', 'fuel', 'exteriorColor', 'interiorColor',
  ];
  for (const field of stringFields) {
    if (!partial || Object.hasOwn(value, field)) {
      result[field] = textValue(value[field], `specifications.${field}`, errors);
    }
  }
  if (!partial || Object.hasOwn(value, 'mileage')) {
    result.mileage = numberValue(value.mileage, 'specifications.mileage', errors);
  }
  if (!partial || Object.hasOwn(value, 'horsepower')) {
    result.horsepower = numberValue(value.horsepower, 'specifications.horsepower', errors);
  }

  return result;
}

function normalizeImages(value, errors) {
  if (!Array.isArray(value) || value.length > 20) {
    errors.images = 'Must be an array containing at most 20 image URLs.';
    return undefined;
  }

  const images = value.map((image) => {
    if (typeof image !== 'string' || image.length > 2048) return null;
    try {
      const url = new URL(image);
      return url.protocol === 'https:' && !url.username && !url.password && url.hostname
        ? url.toString()
        : null;
    } catch {
      return null;
    }
  });
  if (images.some((image) => image === null)) {
    errors.images = 'Every image must be a valid HTTPS URL.';
  }
  return images.filter(Boolean);
}

function normalizeCarInput(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CarValidationError({ body: 'Must be a JSON object.' });
  }

  const errors = {};
  const unknown = Object.keys(input).filter((field) => !carFields.has(field));
  if (unknown.length) errors.body = `Unknown fields: ${unknown.join(', ')}.`;
  if (partial && Object.keys(input).length === 0) errors.body = 'At least one field is required.';

  const result = {};
  for (const field of ['make', 'model']) {
    if (!partial || Object.hasOwn(input, field)) {
      result[field] = textValue(input[field], field, errors);
    }
  }
  if (!partial || Object.hasOwn(input, 'description')) {
    result.description = textValue(input.description, 'description', errors, {
      max: 5000,
      required: false,
    }) || '';
  }
  if (!partial || Object.hasOwn(input, 'year')) {
    result.year = numberValue(input.year, 'year', errors, {
      min: 1886,
      max: new Date().getUTCFullYear() + 1,
    });
    if (result.year != null && !Number.isInteger(result.year)) errors.year = 'Must be an integer.';
  }
  if (!partial || Object.hasOwn(input, 'price')) {
    result.price = numberValue(input.price, 'price', errors);
  }
  if (!partial || Object.hasOwn(input, 'status')) {
    if (typeof input.status !== 'string' || !statuses.has(input.status)) {
      errors.status = 'Must be available, reserved, or sold.';
    } else {
      result.status = input.status;
    }
  }
  if (!partial || Object.hasOwn(input, 'specifications')) {
    result.specifications = normalizeSpecifications(input.specifications, errors, partial);
  }
  if (!partial || Object.hasOwn(input, 'images')) {
    result.images = normalizeImages(input.images || [], errors);
  }

  if (Object.keys(errors).length) throw new CarValidationError(errors);
  return result;
}

module.exports = { CarValidationError, normalizeCarInput };
