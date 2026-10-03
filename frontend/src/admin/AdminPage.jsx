import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpDown, CalendarDays, CarFront, Check, ChevronDown, ChevronRight, CircleDollarSign, Eye, FileText, Fuel, Gauge, ImageUp, LayoutDashboard, LoaderCircle, LogOut, Menu, Palette, Plus, Search, SlidersHorizontal, SquarePen, Tags, Trash2, X } from 'lucide-react';
import { getCars } from '../services/carsApi.js';
import { observeAdminAuth, signInAdmin, signOutAdmin } from '../services/adminAuth.js';
import { createAdminCar, deleteAdminCar, updateAdminCar } from '../services/adminCars.js';
import { getCarImageSizes, getStorageUsage } from '../services/adminImages.js';
import { getInternetModelsForMake, mergeModelNames } from '../services/vehicleCatalogApi.js';
import VehicleImage from '../components/VehicleImage.jsx';
import logo from '../assets/am-motors-logo.png';
import drivetrainIcon from '../assets/icons/drivetrain.png';
import engineIcon from '../assets/icons/engine.svg';
import roadIcon from '../assets/icons/road.svg';
import transmissionIcon from '../assets/icons/gearshifter.png';
import { usePageMetadata } from '../utils/usePageMetadata.js';
import { kilometersToMiles, milesToKilometers } from '../utils/formatters.js';
import { CLOUDFLARE_STORAGE_LIMIT_BYTES, STORAGE_WARNING_BYTES, formatBytes, formatRemainingBytes } from '../utils/storageUsage.js';
import { drivetrainOptions, exteriorColorOptions, fuelOptions, getEngineOptions, interiorColorOptions, transmissionOptions, vehicleMakes, vehicleModels, vehicleOptionLabels } from './vehicleCatalog.js';
import './admin.css';

const emptyCar = {
  make: '', model: '', year: '', price: '', description: '', status: 'available',
  mileage: '', engine: '', horsepower: '', transmission: '', drivetrain: '', fuel: '',
  exteriorColor: '', interiorColor: '', images: [],
};

const ADMIN_LOCATION_KEY = 'ammotors.admin-location.v1';
const adminViews = new Set(['dashboard', 'inventory', 'add', 'edit', 'details']);

function readAdminLocation() {
  try {
    const location = JSON.parse(sessionStorage.getItem(ADMIN_LOCATION_KEY));
    return { view: adminViews.has(location?.view) ? location.view : 'dashboard', selectedId: typeof location?.selectedId === 'string' ? location.selectedId : null };
  } catch {
    return { view: 'dashboard', selectedId: null };
  }
}

function storeAdminLocation(view, selectedId = null) {
  try {
    sessionStorage.setItem(ADMIN_LOCATION_KEY, JSON.stringify({ view, selectedId }));
  } catch {
    // Session storage can be unavailable in privacy modes; navigation still works.
  }
}

const demoCars = [
  { id: 'demo-001', make: 'BMW', model: 'M4 Competition', year: 2024, price: 80000, mileage: 12000, engine: '3.0L Twin-Turbo', horsepower: 503, transmission: 'Automatic', drivetrain: 'RWD', fuel: 'Petrol', exteriorColor: 'Black', interiorColor: 'Black', description: 'Clean, low-mileage performance coupe.', status: 'available', images: [] },
  { id: 'demo-002', make: 'Mercedes-Benz', model: 'C300', year: 2023, price: 54000, mileage: 18500, engine: '2.0L Turbo', horsepower: 255, transmission: 'Automatic', drivetrain: 'RWD', fuel: 'Petrol', exteriorColor: 'White', interiorColor: 'Beige', description: 'Comfortable and well maintained.', status: 'reserved', images: [] },
  { id: 'demo-003', make: 'Audi', model: 'Q5 Premium Plus', year: 2024, price: 63000, mileage: 7200, engine: '2.0L Turbo', horsepower: 261, transmission: 'Automatic', drivetrain: 'AWD', fuel: 'Petrol', exteriorColor: 'Gray', interiorColor: 'Black', description: 'A refined, practical luxury SUV.', status: 'sold', images: [] },
];

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

function formatMegabytes(bytes) {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes > 0 && megabytes < 0.01 ? '<0.01' : megabytes.toFixed(2)} MB`;
}

function getImageStorage(car, measuredSizes) {
  const count = car.images?.length || 0;
  if (!count) return { size: '0 MB', count: 'No images' };

  const r2Images = (car.imageEntries || []).filter((image) => image.key);
  if (!r2Images.length) return { size: 'External', count: `${count} image${count === 1 ? '' : 's'}` };

  const sizes = r2Images.map((image) => {
    if (image.sizeBytes != null && Number.isFinite(Number(image.sizeBytes))) return Number(image.sizeBytes);
    return Object.prototype.hasOwnProperty.call(measuredSizes, image.key) ? measuredSizes[image.key] : undefined;
  });
  if (sizes.some((size) => size === undefined)) return { size: 'Checking…', count: `${count} image${count === 1 ? '' : 's'}` };

  const knownSizes = sizes.filter(Number.isFinite);
  if (!knownSizes.length) return { size: 'Unavailable', count: `${count} image${count === 1 ? '' : 's'}` };
  const incomplete = knownSizes.length !== r2Images.length || r2Images.length !== count;
  return {
    size: `${formatMegabytes(knownSizes.reduce((total, size) => total + size, 0))}${incomplete ? '+' : ''}`,
    count: `${count} image${count === 1 ? '' : 's'}`,
  };
}

function AdminIcon({ name }) {
  const icons = {
    dashboard: LayoutDashboard,
    cars: CarFront,
    plus: Plus,
    search: Search,
    edit: SquarePen,
    trash: Trash2,
    eye: Eye,
    logout: LogOut,
    menu: Menu,
    close: X,
    upload: ImageUp,
    arrow: ChevronRight,
  };
  const Icon = icons[name];
  return Icon ? <Icon size={20} strokeWidth={1.8} aria-hidden="true" /> : null;
}

function SignIn({ onSuccess }) {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(values.email)) nextErrors.email = 'Enter a valid email address.';
    if (values.password.length < 6) nextErrors.password = 'Password must contain at least 6 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      const user = await signInAdmin(values.email, values.password);
      onSuccess(user);
    } catch (error) {
      const message = error.code === 'auth/not-admin'
        ? 'This account does not have administrator access.'
        : error.code === 'auth/invalid-credential'
          ? 'Incorrect email or password.'
          : 'Unable to sign in. Please try again.';
      setErrors({ form: message });
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-signin-shell">
      <section className="admin-signin-card" aria-labelledby="signin-title">
        <img className="admin-signin-logo" src={logo} alt="AM MOTORS" />
        <p className="admin-kicker">Management portal</p>
        <h1 id="signin-title">Welcome back</h1>
        <p>Sign in to manage vehicle listings, availability, details, and images.</p>
        <form onSubmit={submit} noValidate>
          {errors.form && <div className="admin-auth-error" role="alert">{errors.form}</div>}
          <label className="admin-field">
            <span>Email address</span>
            <input type="email" aria-label="Email address" autoComplete="username" value={values.email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'signin-email-error' : undefined} onChange={(event) => setValues({ ...values, email: event.target.value })} />
            {errors.email && <small id="signin-email-error" className="admin-field-error">{errors.email}</small>}
          </label>
          <label className="admin-field">
            <span>Password</span>
            <input type="password" aria-label="Password" autoComplete="current-password" value={values.password} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'signin-password-error' : undefined} onChange={(event) => setValues({ ...values, password: event.target.value })} />
            {errors.password && <small id="signin-password-error" className="admin-field-error">{errors.password}</small>}
          </label>
          <button className="button button-primary admin-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <a className="admin-back-link" href="/"><ArrowLeft size={16} aria-hidden="true" /> Return to website</a>
      </section>
    </main>
  );
}

function Summary({ cars, storage, onNavigate, onRefreshStorage }) {
  const totalValue = cars.reduce((sum, car) => sum + Number(car.price || 0), 0);
  const imageCount = cars.reduce((sum, car) => sum + (car.images?.length || 0), 0);
  const usedBytes = storage.usedBytes ?? 0;
  const usagePercent = Math.min(100, (usedBytes / CLOUDFLARE_STORAGE_LIMIT_BYTES) * 100);
  const remainingBytes = Math.max(0, CLOUDFLARE_STORAGE_LIMIT_BYTES - usedBytes);
  const isFull = storage.status === 'ready' && usedBytes >= CLOUDFLARE_STORAGE_LIMIT_BYTES;
  const isWarning = storage.status === 'ready' && usedBytes >= STORAGE_WARNING_BYTES;
  const cards = [
    { label: 'Total inventory', value: cars.length, note: 'vehicles tracked', icon: CarFront, tone: 'neutral' },
    { label: 'Inventory value', value: money(totalValue), note: 'all listed vehicles', icon: CircleDollarSign, tone: 'value' },
    { label: 'Average price', value: money(cars.length ? totalValue / cars.length : 0), note: 'per vehicle', icon: Tags, tone: 'neutral' },
    { label: 'Vehicle images', value: imageCount, note: 'images attached', icon: ImageUp, tone: 'neutral' },
  ];
  return (
    <div className="admin-view admin-dashboard-view">
      <div className="admin-page-heading"><div><p className="admin-kicker">Overview</p><h1>Dashboard</h1><p>Monitor inventory and keep listings current.</p></div><button className="button button-primary" disabled={storage.status !== 'ready' || isFull} onClick={() => onNavigate('add')}><AdminIcon name="plus" /> Add vehicle</button></div>
      <section className="admin-summary-grid" aria-label="Inventory summary">
        {cards.map(({ label, value, note, icon: CardIcon, tone }) => <article className={`admin-summary-card admin-summary-${tone}`} data-tilt="10" key={label}><div className="admin-summary-card-top"><span>{label}</span><span className="admin-summary-icon"><CardIcon size={20} strokeWidth={1.8} aria-hidden="true" /></span></div><strong>{value}</strong><small>{note}</small></article>)}
      </section>
      <section className={`admin-panel admin-data-usage${isWarning ? ' is-warning' : ''}${isFull ? ' is-full' : ''}`} aria-labelledby="data-usage-title">
        <div className="admin-panel-heading"><h2 id="data-usage-title">Available storage</h2><strong>{storage.status === 'ready' ? formatBytes(usedBytes) : '—'} / 3 GB</strong></div>
        <div className="admin-usage-track" role="progressbar" aria-label="Image storage used" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Number(usagePercent.toFixed(2))}><span style={{ width: `${usagePercent}%` }} /></div>
        <div className="admin-usage-meta"><span>{storage.status === 'ready' ? `${formatRemainingBytes(remainingBytes)} remaining` : storage.status === 'error' ? 'Storage usage could not be checked' : 'Checking storage…'}</span><span>{storage.status === 'ready' ? `${storage.objectCount} file${storage.objectCount === 1 ? '' : 's'} in image storage` : ''}<button type="button" onClick={onRefreshStorage}>Refresh storage</button></span></div>
        {isWarning && <p className="admin-usage-alert" role="alert">{isFull ? 'Storage full — new vehicles are disabled. Delete images to free space.' : '⚠ Storage almost full — 0.5 GB or less remains.'}</p>}
      </section>
      <section className="admin-panel admin-recent-panel" data-tilt="2">
          <div className="admin-panel-heading"><div><p className="admin-kicker">Recent inventory</p><h2>Latest vehicles</h2></div><button className="admin-text-button" onClick={() => onNavigate('inventory')}>View all <AdminIcon name="arrow" /></button></div>
          <div className="admin-recent-list">
            {cars.slice(0, 4).map((car) => <button key={car.id} className="admin-recent-row" onClick={() => onNavigate('details', car)}><VehicleImage src={car.images?.[0]} alt="" /><span><strong>{car.make} {car.model}</strong><small>{car.year} · {money(car.price)}</small></span><AdminIcon name="arrow" /></button>)}
            {!cars.length && <EmptyState onAction={() => onNavigate('add')} />}
          </div>
      </section>
    </div>
  );
}

function EmptyState({ onAction, actionLabel = 'Add first vehicle' }) {
  return <div className="admin-empty"><div className="admin-empty-icon"><AdminIcon name="cars" /></div><h3>No vehicles found</h3><p>Add a vehicle or adjust your search and filters.</p>{onAction && <button className="button button-outline" onClick={onAction}>{actionLabel}</button>}</div>;
}

const defaultInventoryFilters = {
  make: 'all', model: 'all', year: 'all', drivetrain: 'all',
  transmission: 'all', fuel: 'all', engine: 'all', exteriorColor: 'all', interiorColor: 'all',
  minPrice: '', maxPrice: '', maxMileage: '', minHorsepower: '', maxHorsepower: '',
};

function uniqueCarValues(cars, field, numeric = false) {
  const values = [...new Set(cars.map((car) => car[field]).filter((value) => value !== '' && value != null))];
  return values.sort(numeric ? (left, right) => right - left : (left, right) => String(left).localeCompare(String(right)));
}

function Inventory({ cars, measuredImageSizes, canAddVehicle, onNavigate, onDelete }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(defaultInventoryFilters);
  const [sort, setSort] = useState('newest');
  const options = useMemo(() => ({
    makes: uniqueCarValues(cars, 'make'),
    models: uniqueCarValues(cars.filter((car) => filters.make === 'all' || car.make === filters.make), 'model'),
    years: uniqueCarValues(cars, 'year', true),
    drivetrains: uniqueCarValues(cars, 'drivetrain'),
    transmissions: uniqueCarValues(cars, 'transmission'),
    fuels: uniqueCarValues(cars, 'fuel'),
    engines: uniqueCarValues(cars, 'engine'),
    exteriorColors: uniqueCarValues(cars, 'exteriorColor'),
    interiorColors: uniqueCarValues(cars, 'interiorColor'),
  }), [cars, filters.make]);
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => value !== defaultInventoryFilters[key]).length;
  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value, ...(name === 'make' ? { model: 'all' } : {}) }));
  }
  function resetFilters() { setSearch(''); setFilters(defaultInventoryFilters); }
  const filtered = useMemo(() => cars.filter((car) => {
    const searchable = [car.make, car.model, car.year, car.price, car.mileage, car.engine, car.horsepower, car.transmission, car.drivetrain, car.fuel, car.exteriorColor, car.interiorColor, car.description].join(' ').toLowerCase();
    const queryWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matchesText = queryWords.every((word) => searchable.includes(word));
    const withinMinimumPrice = filters.minPrice === '' || Number(car.price) >= Number(filters.minPrice);
    const withinMaximumPrice = filters.maxPrice === '' || Number(car.price) <= Number(filters.maxPrice);
    const withinMileage = filters.maxMileage === '' || Number(car.mileage) <= Number(filters.maxMileage);
    const withinMinimumHorsepower = filters.minHorsepower === '' || Number(car.horsepower) >= Number(filters.minHorsepower);
    const withinMaximumHorsepower = filters.maxHorsepower === '' || Number(car.horsepower) <= Number(filters.maxHorsepower);
    return matchesText
      && (filters.make === 'all' || car.make === filters.make)
      && (filters.model === 'all' || car.model === filters.model)
      && (filters.year === 'all' || String(car.year) === filters.year)
      && (filters.drivetrain === 'all' || car.drivetrain === filters.drivetrain)
      && (filters.transmission === 'all' || car.transmission === filters.transmission)
      && (filters.fuel === 'all' || car.fuel === filters.fuel)
      && (filters.engine === 'all' || car.engine === filters.engine)
      && (filters.exteriorColor === 'all' || car.exteriorColor === filters.exteriorColor)
      && (filters.interiorColor === 'all' || car.interiorColor === filters.interiorColor)
      && withinMinimumPrice && withinMaximumPrice && withinMileage
      && withinMinimumHorsepower && withinMaximumHorsepower;
  }).sort((left, right) => {
    if (sort === 'price-high') return right.price - left.price;
    if (sort === 'price-low') return left.price - right.price;
    if (sort === 'mileage-low') return left.mileage - right.mileage;
    if (sort === 'mileage-high') return right.mileage - left.mileage;
    if (sort === 'oldest') return left.year - right.year;
    if (sort === 'make') return `${left.make} ${left.model}`.localeCompare(`${right.make} ${right.model}`);
    return right.year - left.year;
  }), [cars, filters, search, sort]);

  return (
    <div className="admin-view">
      <div className="admin-page-heading"><div><p className="admin-kicker">Vehicle management</p><h1>Inventory</h1><p>{filtered.length} of {cars.length} vehicles shown.</p></div><button className="button button-primary" disabled={!canAddVehicle} onClick={() => onNavigate('add')}><AdminIcon name="plus" /> Add vehicle</button></div>
      <section className="admin-toolbar" aria-label="Inventory controls">
        <div className="admin-search"><label><span className="sr-only">Search inventory</span><AdminIcon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search make, model, year, specs…" /></label>{search && <button className="admin-search-clear" type="button" aria-label="Clear inventory search" onClick={() => setSearch('')}><X size={16} aria-hidden="true" /></button>}</div>
        <SelectField label="Sort inventory" name="sort" value={sort} onChange={(event) => setSort(event.target.value)} options={['newest', 'oldest', 'price-high', 'price-low', 'mileage-low', 'mileage-high', 'make']} optionLabels={{ newest: 'Newest year', oldest: 'Oldest year', 'price-high': 'Price: high to low', 'price-low': 'Price: low to high', 'mileage-low': 'Mileage: low to high', 'mileage-high': 'Mileage: high to low', make: 'Make and model' }} leadingIcon={ArrowUpDown} hideLabel />
      </section>
      <details className="admin-filter-panel">
        <summary><SlidersHorizontal size={18} aria-hidden="true" /><span>Advanced filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</span><small>Make, model, year, specifications, price, and mileage</small><ChevronDown className="admin-filter-chevron" size={18} aria-hidden="true" /></summary>
        <div className="admin-filter-grid">
          <SelectField label="Make" ariaLabel="Filter by make" name="makeFilter" value={filters.make} onChange={(event) => updateFilter('make', event.target.value)} options={['all', ...options.makes]} optionLabels={{ all: 'All makes' }} leadingIcon={CarFront} searchable />
          <SelectField label="Model" ariaLabel="Filter by model" name="modelFilter" value={filters.model} onChange={(event) => updateFilter('model', event.target.value)} options={['all', ...options.models]} optionLabels={{ all: 'All models' }} leadingIcon={Search} searchable />
          <SelectField label="Year" ariaLabel="Filter by year" name="yearFilter" value={filters.year} onChange={(event) => updateFilter('year', event.target.value)} options={['all', ...options.years.map(String)]} optionLabels={{ all: 'All years' }} leadingIcon={CalendarDays} />
          <SelectField label="Drivetrain" ariaLabel="Filter by drivetrain" name="drivetrainFilter" value={filters.drivetrain} onChange={(event) => updateFilter('drivetrain', event.target.value)} options={['all', ...options.drivetrains]} optionLabels={{ all: 'All drivetrains' }} leadingIconSrc={drivetrainIcon} />
          <SelectField label="Transmission" ariaLabel="Filter by transmission" name="transmissionFilter" value={filters.transmission} onChange={(event) => updateFilter('transmission', event.target.value)} options={['all', ...options.transmissions]} optionLabels={{ all: 'All transmissions' }} leadingIconSrc={transmissionIcon} />
          <SelectField label="Fuel type" ariaLabel="Filter by fuel type" name="fuelFilter" value={filters.fuel} onChange={(event) => updateFilter('fuel', event.target.value)} options={['all', ...options.fuels]} optionLabels={{ all: 'All fuel types' }} leadingIcon={Fuel} />
          <SelectField label="Engine" ariaLabel="Filter by engine" name="engineFilter" value={filters.engine} onChange={(event) => updateFilter('engine', event.target.value)} options={['all', ...options.engines]} optionLabels={{ all: 'All engines' }} leadingIconSrc={engineIcon} leadingIconName="engine" />
          <SelectField label="Exterior color" ariaLabel="Filter by exterior color" name="exteriorColorFilter" value={filters.exteriorColor} onChange={(event) => updateFilter('exteriorColor', event.target.value)} options={['all', ...options.exteriorColors]} optionLabels={{ all: 'All exterior colors' }} leadingIcon={Palette} />
          <SelectField label="Interior color" ariaLabel="Filter by interior color" name="interiorColorFilter" value={filters.interiorColor} onChange={(event) => updateFilter('interiorColor', event.target.value)} options={['all', ...options.interiorColors]} optionLabels={{ all: 'All interior colors' }} leadingIcon={Palette} />
          <label><span className="admin-filter-label"><CircleDollarSign size={16} aria-hidden="true" /> Minimum price</span><input aria-label="Minimum price" type="number" min="0" inputMode="numeric" value={filters.minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} placeholder="$0" /></label>
          <label><span className="admin-filter-label"><CircleDollarSign size={16} aria-hidden="true" /> Maximum price</span><input aria-label="Maximum price" type="number" min="0" inputMode="numeric" value={filters.maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value)} placeholder="No maximum" /></label>
          <label><span className="admin-filter-label"><img src={roadIcon} alt="" aria-hidden="true" data-icon="road" /> Maximum mileage</span><input aria-label="Maximum mileage" type="number" min="0" inputMode="numeric" value={filters.maxMileage} onChange={(event) => updateFilter('maxMileage', event.target.value)} placeholder="No maximum" /></label>
          <label><span className="admin-filter-label"><Gauge size={16} aria-hidden="true" /> Minimum horsepower</span><input aria-label="Minimum horsepower" type="number" min="0" inputMode="numeric" value={filters.minHorsepower} onChange={(event) => updateFilter('minHorsepower', event.target.value)} placeholder="No minimum" /></label>
          <label><span className="admin-filter-label"><Gauge size={16} aria-hidden="true" /> Maximum horsepower</span><input aria-label="Maximum horsepower" type="number" min="0" inputMode="numeric" value={filters.maxHorsepower} onChange={(event) => updateFilter('maxHorsepower', event.target.value)} placeholder="No maximum" /></label>
        </div>
        <div className="admin-filter-footer"><span>{filtered.length} matching vehicle{filtered.length === 1 ? '' : 's'}</span><button type="button" onClick={resetFilters} disabled={!search && !activeFilterCount}>Clear all filters</button></div>
      </details>
      {!filtered.length ? <EmptyState onAction={cars.length ? resetFilters : () => onNavigate('add')} actionLabel={cars.length ? 'Clear all filters' : 'Add first vehicle'} /> : (
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Vehicle</th><th>Year</th><th>Mileage</th><th>Price</th><th>Image storage</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((car) => { const storage = getImageStorage(car, measuredImageSizes); return <tr key={car.id}><td data-label="Vehicle"><div className="admin-vehicle-cell"><VehicleImage src={car.images?.[0]} alt="" /><span><strong>{car.make} {car.model}</strong><small>{car.engine}</small></span></div></td><td data-label="Year">{car.year}</td><td data-label="Mileage">{car.mileage == null ? '—' : `${Number(car.mileage).toLocaleString()} km`}</td><td data-label="Price"><strong>{money(car.price)}</strong></td><td data-label="Images"><span className="admin-image-storage"><strong>{storage.size}</strong><small>{storage.count}</small></span></td><td data-label="Actions"><div className="admin-row-actions"><button aria-label={`View ${car.make} ${car.model}`} onClick={() => onNavigate('details', car)}><AdminIcon name="eye" /></button><button aria-label={`Edit ${car.make} ${car.model}`} onClick={() => onNavigate('edit', car)}><AdminIcon name="edit" /></button><button className="danger" aria-label={`Delete ${car.make} ${car.model}`} onClick={() => onDelete(car)}><AdminIcon name="trash" /></button></div></td></tr>; })}</tbody></table></div>
      )}
    </div>
  );
}

function validateCar(car) {
  const errors = {};
  ['make', 'model'].forEach((field) => { if (!String(car[field] ?? '').trim()) errors[field] = 'Required.'; });
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(Number(car.year)) || Number(car.year) < 1886 || Number(car.year) > currentYear + 1) errors.year = `Enter a year from 1886 to ${currentYear + 1}.`;
  if (car.price === '' || Number(car.price) < 0 || !Number.isFinite(Number(car.price))) errors.price = 'Enter a valid non-negative number.';
  ['mileage', 'horsepower'].forEach((field) => { if (car[field] !== '' && (Number(car[field]) < 0 || !Number.isFinite(Number(car[field])))) errors[field] = 'Enter a valid non-negative number.'; });
  if (car.mileage !== '' && !Number.isInteger(Number(car.mileage))) errors.mileage = 'Mileage must be a whole number.';
  if (String(car.description).length > 5000) errors.description = 'Description must be 5,000 characters or fewer.';
  return errors;
}

function Field({ label, name, value, error, onChange, type = 'text', leadingIcon: LeadingIcon, leadingIconSrc, leadingIconName, ...props }) {
  const errorId = `${name}-error`;
  const hasLeadingIcon = LeadingIcon || leadingIconSrc;
  return <label className={`admin-field ${error ? 'has-error' : ''}`}><span>{label}</span><div className={hasLeadingIcon ? 'admin-input-with-icon' : undefined}>{LeadingIcon && <LeadingIcon size={18} aria-hidden="true" />}{leadingIconSrc && <img src={leadingIconSrc} alt="" aria-hidden="true" data-icon={leadingIconName} />}<input name={name} type={type} value={value} onChange={onChange} aria-label={label} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...props} /></div>{error && <small id={errorId} className="admin-field-error">{error}</small>}</label>;
}

function SelectField({ label, ariaLabel = label, name, value, error, onChange, options, optionLabels = {}, placeholder = 'Select an option', disabled = false, searchable = true, inlineSearch = false, autoFocusSearch = name === 'make', allowCustom = false, hideLabel = false, leadingIcon: LeadingIcon, leadingIconSrc, leadingIconName }) {
  const id = useId().replace(/:/g, '');
  const errorId = `${name}-error`;
  const hasUnsupportedValue = Boolean(value) && !options.includes(value);
  const resolvedOptions = hasUnsupportedValue ? [...options, value] : options;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(Math.max(0, resolvedOptions.indexOf(value)));
  const [mobileMenuStyle, setMobileMenuStyle] = useState(undefined);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const visibleOptions = searchable && query
    ? resolvedOptions.filter((option) => (optionLabels[option] || option).toLowerCase().includes(query.trim().toLowerCase()))
    : resolvedOptions;
  const customValue = query.trim().replace(/\s+/g, ' ').slice(0, 80);
  const canUseCustom = allowCustom && customValue && !resolvedOptions.some((option) => option.toLowerCase() === customValue.toLowerCase());

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => {
    if (open && searchable && autoFocusSearch && !inlineSearch) window.requestAnimationFrame(() => searchRef.current?.focus());
    if (!open) setSearchExpanded(false);
  }, [open, searchable, autoFocusSearch, inlineSearch]);
  useEffect(() => { setActiveIndex(0); }, [query]);
  useEffect(() => {
    if (!open) {
      setMobileMenuStyle(undefined);
      return undefined;
    }
    const usesMobileMenu = window.innerWidth <= 600 || window.matchMedia?.('(max-device-width: 600px) and (hover: none) and (pointer: coarse)').matches;
    if (!usesMobileMenu) return undefined;
    const viewport = window.visualViewport;
    function fitMenuToKeyboard() {
      const height = viewport?.height || window.innerHeight;
      if (inlineSearch) {
        const rect = triggerRef.current?.getBoundingClientRect();
        const visibleTop = viewport?.offsetTop || 0;
        const visibleBottom = visibleTop + height;
        const below = visibleBottom - (rect?.bottom || 0) - 8;
        const above = (rect?.top || 0) - visibleTop - 8;
        const placeAbove = below < 160 && above > below;
        setMobileMenuStyle({ top: placeAbove ? 'auto' : 'calc(100% - 1px)', bottom: placeAbove ? 'calc(100% - 1px)' : 'auto', maxHeight: `${Math.max(100, Math.min(300, placeAbove ? above : below))}px` });
        return;
      }
      const availableHeight = Math.max(120, Math.round(height - 16));
      const menuHeight = searchable && searchExpanded
        ? availableHeight
        : Math.min(300, Math.max(160, Math.round(height * 0.48)), availableHeight);
      const top = searchable && searchExpanded
        ? (viewport?.offsetTop || 0) + 8
        : (viewport?.offsetTop || 0) + height - menuHeight - 8;
      setMobileMenuStyle({ top: `${Math.max(8, Math.round(top))}px`, bottom: 'auto', maxHeight: `${menuHeight}px` });
    }
    fitMenuToKeyboard();
    viewport?.addEventListener('resize', fitMenuToKeyboard);
    viewport?.addEventListener('scroll', fitMenuToKeyboard);
    window.addEventListener('orientationchange', fitMenuToKeyboard);
    return () => {
      viewport?.removeEventListener('resize', fitMenuToKeyboard);
      viewport?.removeEventListener('scroll', fitMenuToKeyboard);
      window.removeEventListener('orientationchange', fitMenuToKeyboard);
    };
  }, [open, searchable, searchExpanded, inlineSearch]);

  function choose(nextValue) {
    onChange({ target: { name, value: nextValue } });
    setOpen(false);
    setQuery('');
    setSearchExpanded(false);
  }
  function handleKeyDown(event) {
    if (disabled) return;
    if (inlineSearch && event.key === ' ') return;
    if (event.key === 'Escape') { setOpen(false); return; }
    if (event.key === 'Tab') { setOpen(false); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setOpen(true);
      if (visibleOptions.length) setActiveIndex((current) => (current + direction + visibleOptions.length) % visibleOptions.length);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(event.key === 'Home' ? 0 : visibleOptions.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open && visibleOptions[activeIndex]) choose(visibleOptions[activeIndex]);
      else if (open && canUseCustom) choose(customValue);
      else setOpen(true);
    }
  }
  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(event.key)) {
      handleKeyDown(event);
    }
  }

  return <div className={`admin-field admin-select-field ${open ? 'is-open' : ''} ${error ? 'has-error' : ''} ${inlineSearch ? 'is-inline-search' : ''}`} ref={rootRef}>
    <span id={`${id}-label`} className={hideLabel ? 'sr-only' : undefined}>{label}</span>
    {inlineSearch ? <div className="admin-select-trigger admin-select-inline" onClick={() => triggerRef.current?.focus()}>
      {LeadingIcon && <LeadingIcon className="admin-select-leading-icon" size={18} aria-hidden="true" />}
      {leadingIconSrc && <img className="admin-select-leading-image" src={leadingIconSrc} alt="" aria-hidden="true" data-icon={leadingIconName} />}
      <input ref={triggerRef} id={`${id}-trigger`} role="combobox" aria-label={ariaLabel} aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-listbox`} aria-activedescendant={open && visibleOptions[activeIndex] ? `${id}-option-${activeIndex}` : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} disabled={disabled} autoComplete="off" value={open ? query : value ? optionLabels[value] || value : ''} placeholder={open ? `Search ${label.replace(' *', '').toLowerCase()}` : placeholder} onFocus={() => { setQuery(''); setOpen(true); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={handleKeyDown} />
      <span className="admin-select-chevron" aria-hidden="true" />
    </div> : <button ref={triggerRef} id={`${id}-trigger`} className="admin-select-trigger" type="button" role="combobox" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-listbox`} aria-activedescendant={open && visibleOptions[activeIndex] ? `${id}-option-${activeIndex}` : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} disabled={disabled} onClick={() => { setQuery(''); setOpen((current) => !current); }} onKeyDown={handleKeyDown}>
      {LeadingIcon && <LeadingIcon className="admin-select-leading-icon" size={18} aria-hidden="true" />}{leadingIconSrc && <img className="admin-select-leading-image" src={leadingIconSrc} alt="" aria-hidden="true" data-icon={leadingIconName} />}<span className={`admin-select-value ${value ? '' : 'placeholder'}`}>{value ? optionLabels[value] || value : placeholder}</span><span className="admin-select-chevron" aria-hidden="true" />
    </button>}
    {open && <div className={`admin-select-menu ${searchable && !inlineSearch ? 'is-searchable' : ''}`} style={mobileMenuStyle}>{searchable && !inlineSearch && <label className="admin-select-search"><span className="sr-only">Search {label.replace(' *', '')}</span><AdminIcon name="search" /><input ref={searchRef} type="search" aria-label={`Search ${label.replace(' *', '')}`} value={query} onFocus={() => setSearchExpanded(true)} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleSearchKeyDown} placeholder={`Search ${label.replace(' *', '').toLowerCase()}`} /></label>}<div className="admin-select-options" id={`${id}-listbox`} role="listbox" aria-label={`${label} options`}>{visibleOptions.map((option, index) => <button id={`${id}-option-${index}`} type="button" role="option" aria-selected={option === value} className={index === activeIndex ? 'is-active' : ''} key={option} onPointerMove={() => setActiveIndex(index)} onClick={() => choose(option)}>{optionLabels[option] || option}{hasUnsupportedValue && option === value ? ' (Other)' : ''}{option === value && <Check size={16} aria-hidden="true" />}</button>)}{canUseCustom && <button type="button" role="option" aria-selected="false" className="admin-select-custom" onClick={() => choose(customValue)}>Use “{customValue}”</button>}{!visibleOptions.length && !canUseCustom && <p className="admin-select-empty">No matching options found.</p>}</div></div>}
    {error && <small id={errorId} className="admin-field-error">{error}</small>}
  </div>;
}

function CarForm({ mode, initialCar, onCancel, onSave }) {
  const [car, setCar] = useState(() => ({ ...emptyCar, ...initialCar, images: [...(initialCar?.images || [])] }));
  const [errors, setErrors] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [mileageUnit, setMileageUnit] = useState('km');
  const [mileageInput, setMileageInput] = useState(() => String(initialCar?.mileage ?? ''));
  const [internetModels, setInternetModels] = useState([]);
  const firstErrorRef = useRef(null);
  const selectedFilesRef = useRef([]);

  useEffect(() => { selectedFilesRef.current = selectedFiles; }, [selectedFiles]);
  useEffect(() => () => {
    selectedFilesRef.current.forEach(({ preview }) => URL.revokeObjectURL?.(preview));
  }, []);
  useEffect(() => {
    if (!car.make) return undefined;
    const controller = new AbortController();
    getInternetModelsForMake(car.make, { signal: controller.signal })
      .then(setInternetModels)
      .catch((error) => { if (error?.name !== 'AbortError') setInternetModels([]); });
    return () => controller.abort();
  }, [car.make]);

  const modelOptions = useMemo(() => mergeModelNames(vehicleModels[car.make] || [], internetModels), [car.make, internetModels]);
  const engineOptions = getEngineOptions(car.make, car.model);
  function change(event) { setCar({ ...car, [event.target.name]: event.target.value }); }
  function changeYear(event) {
    if (/^\d{0,4}$/.test(event.target.value)) setCar((current) => ({ ...current, year: event.target.value }));
  }
  function preventInvalidYearPaste(event) {
    if (!/^\d{1,4}$/.test(event.clipboardData.getData('text'))) event.preventDefault();
  }
  function changeMake(event) { setInternetModels([]); setCar({ ...car, make: event.target.value, model: '', engine: '' }); }
  function changeModel(event) { setCar({ ...car, model: event.target.value, engine: '' }); }
  function changeMileage(event) {
    const nextValue = event.target.value;
    if (nextValue === '' || /^\d+$/.test(nextValue)) {
      setMileageInput(nextValue);
      setCar({ ...car, mileage: nextValue === '' ? '' : mileageUnit === 'mi' ? Math.round(milesToKilometers(nextValue)) : nextValue });
    }
  }
  function changeMileageUnit(nextUnit) {
    if (nextUnit === mileageUnit) return;
    setMileageUnit(nextUnit);
    if (car.mileage === '') setMileageInput('');
    else setMileageInput(String(Math.round(nextUnit === 'mi' ? kilometersToMiles(car.mileage) : Number(car.mileage))));
  }
  function preventInvalidMileageKey(event) {
    if (['-', '+', '.', ',', 'e', 'E'].includes(event.key)) event.preventDefault();
  }
  function preventInvalidMileagePaste(event) {
    if (!/^\d+$/.test(event.clipboardData.getData('text'))) event.preventDefault();
  }
  async function selectFiles(event) {
    const remaining = Math.max(0, 20 - car.images.length);
    const candidates = [...event.target.files].slice(0, remaining).filter((file) => /^image\/(jpeg|png|webp)$/.test(file.type) && file.size > 0 && file.size < 10 * 1024 * 1024);
    const accepted = [];
    for (const file of candidates) {
      try {
        const bitmap = await createImageBitmap(file);
        const validDimensions = bitmap.width >= 320 && bitmap.height >= 180 && bitmap.width <= 8000 && bitmap.height <= 8000;
        bitmap.close();
        if (validDimensions) accepted.push({ file, preview: URL.createObjectURL(file) });
      } catch { /* Invalid image data is ignored. */ }
    }
    setSelectedFiles((current) => [...current, ...accepted]);
    setCar((current) => ({ ...current, images: [...current.images, ...accepted.map((item) => item.preview)].slice(0, 20) }));
    setErrors((current) => ({ ...current, images: accepted.length === event.target.files.length ? undefined : 'Images must be JPEG, PNG, or WebP, under 10 MB, and between 320×180 and 8000×8000 pixels.' }));
  }
  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateCar(car);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      window.requestAnimationFrame(() => document.querySelector('.admin-field [aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...car, images: car.images.filter((image) => !image.startsWith('blob:')), year: Number(car.year), price: Number(car.price), mileage: car.mileage === '' ? undefined : Number(car.mileage), horsepower: car.horsepower === '' ? undefined : Number(car.horsepower) }, selectedFiles.map((item) => item.file));
    } catch (error) {
      setErrors({ form: error?.message || 'The vehicle could not be saved. Check your connection and administrator access, then try again.' });
      setSaving(false);
    }
  }

  return <div className="admin-view"><div className="admin-page-heading"><div><button className="admin-back-button" onClick={onCancel}><ArrowLeft size={16} aria-hidden="true" /> Back to inventory</button><p className="admin-kicker">{mode === 'add' ? 'New listing' : 'Update listing'}</p><h1>{mode === 'add' ? 'Add vehicle' : `Edit ${initialCar.make} ${initialCar.model}`}</h1><p>Fields marked required are needed before this listing can be saved.</p></div></div><form className="admin-car-form" onSubmit={submit} noValidate ref={firstErrorRef}>{errors.form && <div className="admin-form-error" role="alert">{errors.form}</div>}
<section className="admin-form-section admin-vehicle-detail-fields"><div className="admin-form-section-heading"><span>01</span><div><h2>Vehicle details</h2><p>Core listing information.</p></div></div><div className="admin-form-grid"><SelectField label="Brand *" name="make" value={car.make} error={errors.make} onChange={changeMake} options={vehicleMakes} placeholder="Select or search for a brand" inlineSearch allowCustom leadingIcon={CarFront} /><SelectField label="Model *" name="model" value={car.model} error={errors.model} onChange={changeModel} options={modelOptions} placeholder={car.make ? 'Select or search for a model' : 'Select a brand first'} disabled={!car.make} inlineSearch allowCustom leadingIcon={Tags} /><Field label="Year *" name="year" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="off" value={car.year} error={errors.year} onChange={changeYear} onPaste={preventInvalidYearPaste} placeholder="Enter year" leadingIcon={CalendarDays} /><Field label="Price (USD) *" name="price" type="number" value={car.price} error={errors.price} onChange={change} leadingIcon={CircleDollarSign} /><label className="admin-field admin-field-wide"><span>Description</span><div className="admin-textarea-with-icon"><FileText size={18} aria-hidden="true" /><textarea name="description" rows="5" value={car.description} onChange={change} aria-label="Description" aria-invalid={Boolean(errors.description)} /></div><small>{car.description.length}/5000</small>{errors.description && <small className="admin-field-error">{errors.description}</small>}</label></div></section>
<section className="admin-form-section admin-specification-fields"><div className="admin-form-section-heading"><span>02</span><div><h2>Specifications</h2><p>Optional technical and appearance information.</p></div></div><div className="admin-form-grid"><Field label="Mileage (km)" name="mileage" type="number" inputMode="numeric" min="0" step="1" value={car.mileage} error={errors.mileage} onChange={changeMileage} onKeyDown={preventInvalidMileageKey} onPaste={preventInvalidMileagePaste} leadingIconSrc={roadIcon} leadingIconName="road" /><SelectField label="Engine" name="engine" value={car.engine} error={errors.engine} onChange={change} options={engineOptions} placeholder={car.model ? 'Select an engine' : 'Select a model first'} disabled={!car.model} inlineSearch leadingIconSrc={engineIcon} leadingIconName="engine" /><Field label="Horsepower" name="horsepower" type="number" value={car.horsepower} error={errors.horsepower} onChange={change} leadingIcon={Gauge} /><SelectField label="Transmission" name="transmission" value={car.transmission} error={errors.transmission} onChange={change} options={transmissionOptions} optionLabels={vehicleOptionLabels} inlineSearch leadingIconSrc={transmissionIcon} leadingIconName="transmission" /><SelectField label="Drivetrain" name="drivetrain" value={car.drivetrain} error={errors.drivetrain} onChange={change} options={drivetrainOptions} inlineSearch leadingIconSrc={drivetrainIcon} leadingIconName="drivetrain" /><SelectField label="Fuel type" name="fuel" value={car.fuel} error={errors.fuel} onChange={change} options={fuelOptions} optionLabels={vehicleOptionLabels} inlineSearch leadingIcon={Fuel} /><SelectField label="Exterior color" name="exteriorColor" value={car.exteriorColor} error={errors.exteriorColor} onChange={change} options={exteriorColorOptions} inlineSearch allowCustom leadingIcon={Palette} /><SelectField label="Interior color" name="interiorColor" value={car.interiorColor} error={errors.interiorColor} onChange={change} options={interiorColorOptions} inlineSearch allowCustom leadingIcon={Palette} /></div></section>
    <section className="admin-form-section"><div className="admin-form-section-heading"><span>03</span><div><h2>Vehicle images</h2><p>Select images to upload securely through the AM MOTORS image service.</p></div></div><label className="admin-upload-zone"><AdminIcon name="upload" /><strong>Select images</strong><span>JPEG, PNG, or WebP · 320×180 to 8000×8000 · max 10 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} /></label>{errors.images && <small className="admin-field-error admin-image-error">{errors.images}</small>}{car.images.length > 0 && <div className="admin-image-previews" aria-label="Selected image previews">{car.images.map((image, index) => <div key={`${image}-${index}`}><VehicleImage src={image} alt={`Vehicle preview ${index + 1}`} /><button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => { const removed = car.images[index]; setCar({ ...car, images: car.images.filter((_, imageIndex) => imageIndex !== index) }); setSelectedFiles((current) => current.filter((item) => item.preview !== removed)); if (removed.startsWith('blob:')) URL.revokeObjectURL(removed); }}><X size={16} aria-hidden="true" /></button>{index === 0 && <span>Cover</span>}</div>)}</div>}</section>
    <div className="admin-form-actions"><button className="button button-outline" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : mode === 'add' ? 'Add vehicle' : 'Save changes'}</button></div>
  </form></div>;
}

function Details({ car, onBack, onEdit, onDelete }) {
  const specs = [['Mileage', car.mileage == null ? null : `${Number(car.mileage).toLocaleString()} km`], ['Engine', car.engine], ['Horsepower', car.horsepower == null ? null : `${car.horsepower} hp`], ['Transmission', car.transmission], ['Drivetrain', car.drivetrain], ['Fuel', car.fuel], ['Exterior', car.exteriorColor], ['Interior', car.interiorColor]];
  return <div className="admin-view"><button className="admin-back-button" onClick={onBack}>← Back to inventory</button><div className="admin-details-heading"><div><p>{car.year}</p><h1>{car.make} {car.model}</h1><strong>{money(car.price)}</strong></div><div><button className="button button-outline" onClick={onEdit}><AdminIcon name="edit" /> Edit</button><button className="button admin-danger-button" onClick={onDelete}><AdminIcon name="trash" /> Delete</button></div></div><div className="admin-details-layout"><section className="admin-detail-gallery"><VehicleImage src={car.images?.[0]} alt={`${car.make} ${car.model}`} />{car.images?.length > 1 && <div>{car.images.slice(1, 5).map((image, index) => <VehicleImage key={image} src={image} alt={`${car.make} ${car.model} view ${index + 2}`} />)}</div>}</section><aside className="admin-preview-card"><p className="admin-kicker">Customer preview</p><h2>{car.make} {car.model}</h2><p>{car.year}{car.mileage == null ? '' : ` · ${Number(car.mileage).toLocaleString()} km`}</p><strong>{money(car.price)}</strong><span>This mirrors the information customers receive through the public API.</span></aside></div><section className="admin-panel admin-detail-section"><div className="admin-panel-heading"><div><p className="admin-kicker">Vehicle overview</p><h2>Specifications</h2></div></div><dl className="admin-spec-grid">{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl></section><section className="admin-panel admin-detail-section"><p className="admin-kicker">Listing copy</p><h2>Description</h2><p>{car.description || 'No description provided.'}</p></section></div>;
}

function DeleteDialog({ car, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const supportsModal = typeof HTMLDialogElement !== 'undefined' && Boolean(HTMLDialogElement.prototype.showModal);
  useEffect(() => { dialogRef.current?.showModal?.(); }, []);
  return <dialog className="admin-dialog" ref={dialogRef} open={!supportsModal} onCancel={onCancel} aria-labelledby="delete-title"><div className="admin-dialog-icon"><AdminIcon name="trash" /></div><h2 id="delete-title">Delete this vehicle?</h2><p><strong>{car.make} {car.model}</strong> will be removed from the inventory. This action cannot be undone.</p><div><button className="button button-outline" onClick={onCancel}>Cancel</button><button className="button admin-danger-button" onClick={onConfirm}>Delete vehicle</button></div></dialog>;
}

function LoadingState() { return <div className="admin-loading" role="status"><LoaderCircle aria-hidden="true" /><h2>Loading inventory</h2><p>Preparing the management workspace…</p></div>; }

function AdminWorkspace({ email, onSignOut }) {
  const initialLocation = useMemo(readAdminLocation, []);
  const [cars, setCars] = useState([]);
  const [view, setView] = useState(initialLocation.view);
  const [selectedCar, setSelectedCar] = useState(null);
  const [deleteCar, setDeleteCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [measuredImageSizes, setMeasuredImageSizes] = useState({});
  const [imageSizeError, setImageSizeError] = useState(false);
  const [storage, setStorage] = useState({ status: 'loading', usedBytes: null, objectCount: 0 });
  const loadRequestRef = useRef(0);

  async function refreshStorage() {
    try {
      const usage = await getStorageUsage();
      if (!Number.isFinite(usage?.usedBytes) || usage.usedBytes < 0 || !Number.isInteger(usage.objectCount)) throw new Error('Invalid storage usage');
      setStorage({ status: 'ready', usedBytes: usage.usedBytes, objectCount: usage.objectCount });
      return usage;
    } catch {
      setStorage({ status: 'error', usedBytes: null, objectCount: 0 });
      return null;
    }
  }

  useEffect(() => {
    const imagesToMeasure = cars.flatMap((car) => (car.imageEntries || [])
      .filter((image) => image.key
        && !(image.sizeBytes != null && Number.isFinite(Number(image.sizeBytes)))
        && !Object.prototype.hasOwnProperty.call(measuredImageSizes, image.key))
      .map((image) => ({ carId: car.id, key: image.key })));
    if (!imagesToMeasure.length) return undefined;

    let cancelled = false;
    setImageSizeError(false);
    getCarImageSizes(imagesToMeasure).then((images) => {
      if (cancelled) return;
      const sizes = Object.fromEntries(images.map((image) => [
        image.key,
        image.sizeBytes != null && Number.isFinite(Number(image.sizeBytes)) ? Number(image.sizeBytes) : null,
      ]));
      imagesToMeasure.forEach(({ key }) => { if (!Object.prototype.hasOwnProperty.call(sizes, key)) sizes[key] = null; });
      setMeasuredImageSizes((current) => ({ ...current, ...sizes }));
    }).catch(() => {
      if (cancelled) return;
      setImageSizeError(true);
      setMeasuredImageSizes((current) => ({
        ...current,
        ...Object.fromEntries(imagesToMeasure.map(({ key }) => [key, null])),
      }));
    });
    return () => { cancelled = true; };
  }, [cars, measuredImageSizes]);

  function loadInventory() {
    const requestId = ++loadRequestRef.current;
    setLoading(true); setLoadError(false);
    getCars()
      .then((nextCars) => { if (requestId === loadRequestRef.current) setCars(nextCars); })
      .catch(() => { if (requestId === loadRequestRef.current) setLoadError(true); })
      .finally(() => { if (requestId === loadRequestRef.current) setLoading(false); });
  }
  useEffect(() => {
    loadInventory();
    refreshStorage();
    window.addEventListener('focus', refreshStorage);
    return () => { loadRequestRef.current += 1; window.removeEventListener('focus', refreshStorage); };
  }, []);
  useEffect(() => {
    if (!cars.length || selectedCar || !['edit', 'details'].includes(view)) return;
    const restoredCar = cars.find((car) => car.id === initialLocation.selectedId);
    if (restoredCar) setSelectedCar(restoredCar);
    else { setView('inventory'); storeAdminLocation('inventory'); }
  }, [cars, initialLocation.selectedId, selectedCar, view]);
  useEffect(() => {
    if (view === 'add' && storage.status !== 'loading' && storage.status !== 'ready') {
      setView('inventory'); storeAdminLocation('inventory');
    } else if (view === 'add' && storage.status === 'ready' && storage.usedBytes >= CLOUDFLARE_STORAGE_LIMIT_BYTES) {
      setView('inventory'); storeAdminLocation('inventory');
    }
  }, [view, storage]);
  const canAddVehicle = storage.status === 'ready' && storage.usedBytes < CLOUDFLARE_STORAGE_LIMIT_BYTES;
  function navigate(nextView, car = null) {
    if (nextView === 'add' && !canAddVehicle) return;
    setView(nextView); setSelectedCar(car); storeAdminLocation(nextView, car?.id); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'auto' });
  }
  async function saveCar(car, files) {
    if (view === 'add') {
      const usage = await refreshStorage();
      if (!usage || usage.usedBytes >= CLOUDFLARE_STORAGE_LIMIT_BYTES) {
        throw new Error('Storage is full or could not be checked. Delete images and try again.');
      }
      const created = await createAdminCar(car, files);
      setCars((current) => [created, ...current]); setNotice('Vehicle published successfully.');
    } else {
      const updated = await updateAdminCar(selectedCar.id, car, files, selectedCar.imageEntries || []);
      setCars((current) => current.map((item) => item.id === selectedCar.id ? updated : item)); setNotice('Vehicle changes published successfully.');
    }
    await refreshStorage();
    navigate('inventory'); window.setTimeout(() => setNotice(''), 3500);
  }
  async function confirmDelete() {
    try {
      await deleteAdminCar(deleteCar.id);
      setCars((current) => current.filter((car) => car.id !== deleteCar.id)); setDeleteCar(null); setNotice('Vehicle deleted successfully.'); navigate('inventory'); window.setTimeout(() => setNotice(''), 3500);
      await refreshStorage();
    } catch {
      setNotice('Vehicle could not be deleted. Please try again.'); window.setTimeout(() => setNotice(''), 3500);
    }
  }

  return <div className="admin-app"><aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}><a className="admin-sidebar-logo" href="/"><img src={logo} alt="AM MOTORS" /></a><nav aria-label="Admin navigation"><button className={view === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><AdminIcon name="dashboard" /> Dashboard</button><button className={['inventory', 'details', 'edit'].includes(view) ? 'active' : ''} onClick={() => navigate('inventory')}><AdminIcon name="cars" /> Inventory <span>{cars.length}</span></button><button className={view === 'add' ? 'active' : ''} disabled={!canAddVehicle} onClick={() => navigate('add')}><AdminIcon name="plus" /> Add vehicle</button></nav><div className="admin-sidebar-user"><span>{email.charAt(0).toUpperCase()}</span><div><strong>Administrator</strong><small>{email}</small></div><button aria-label="Sign out" onClick={onSignOut}><AdminIcon name="logout" /></button></div></aside><div className="admin-main"><header className="admin-mobile-header"><button aria-label="Toggle admin navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><AdminIcon name={menuOpen ? 'close' : 'menu'} /></button><img src={logo} alt="AM MOTORS" /><span>Admin</span></header>{menuOpen && <button className="admin-menu-scrim" aria-label="Close admin navigation" onClick={() => setMenuOpen(false)} />}{notice && <div className="admin-toast" role="status"><span>✓</span>{notice}</div>}{loading ? <LoadingState /> : loadError ? <div className="admin-error-state" role="alert"><h1>Unable to load inventory</h1><p>Start the existing backend and try again, or continue with demo data to review the interface.</p><div><button className="button button-outline" onClick={loadInventory}>Try again</button><button className="button button-primary" onClick={() => { setCars(demoCars); setLoadError(false); }}>Use demo inventory</button></div></div> :   <>{view === 'dashboard' && <Summary cars={cars} storage={storage} onNavigate={navigate} onRefreshStorage={refreshStorage} />}{view === 'inventory' && <Inventory cars={cars} measuredImageSizes={measuredImageSizes} canAddVehicle={canAddVehicle} onNavigate={navigate} onDelete={setDeleteCar} />}{view === 'add' && canAddVehicle && <CarForm key="add" mode="add" onCancel={() => navigate('inventory')} onSave={saveCar} />}{view === 'edit' && selectedCar && <CarForm key={selectedCar.id} mode="edit" initialCar={selectedCar} onCancel={() => navigate('inventory')} onSave={saveCar} />}{view === 'details' && selectedCar && <Details car={cars.find((car) => car.id === selectedCar.id) || selectedCar} onBack={() => navigate('inventory')} onEdit={() => navigate('edit', selectedCar)} onDelete={() => setDeleteCar(selectedCar)} />}</>}</div>{deleteCar && <DeleteDialog car={deleteCar} onCancel={() => setDeleteCar(null)} onConfirm={confirmDelete} />}</div>;
}

function AdminPage() {
  const [authState, setAuthState] = useState({ loading: true, user: null });

  usePageMetadata({
    title: 'Administration | AM MOTORS',
    description: 'AM MOTORS inventory administration.',
    path: '/admin',
    robots: 'noindex, nofollow',
  });

  useEffect(() => observeAdminAuth(
    (user) => setAuthState({ loading: false, user }),
    () => setAuthState({ loading: false, user: null }),
  ), []);

  if (authState.loading) return <LoadingState />;
  if (!authState.user) {
    return <SignIn onSuccess={(user) => setAuthState({ loading: false, user })} />;
  }

  return (
    <AdminWorkspace
      email={authState.user.email || 'Administrator'}
      onSignOut={async () => {
        await signOutAdmin();
        setAuthState({ loading: false, user: null });
      }}
    />
  );
}

export default AdminPage;
export { demoCars, validateCar };
