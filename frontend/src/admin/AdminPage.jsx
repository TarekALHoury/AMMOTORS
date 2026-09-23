import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { getCars } from '../services/carsApi.js';
import { observeAdminAuth, signInAdmin, signOutAdmin } from '../services/adminAuth.js';
import VehicleImage from '../components/VehicleImage.jsx';
import logo from '../assets/am-motors-logo.png';
import { drivetrainOptions, fuelOptions, getEngineOptions, transmissionOptions, vehicleMakes, vehicleModels, vehicleOptionLabels, yearOptions } from './vehicleCatalog.js';
import './admin.css';

const emptyCar = {
  make: '', model: '', year: '', price: '', description: '', status: 'available',
  mileage: '', engine: '', horsepower: '', transmission: '', drivetrain: '', fuel: '',
  exteriorColor: '', interiorColor: '', images: [],
};

const demoCars = [
  { id: 'demo-001', make: 'BMW', model: 'M4 Competition', year: 2024, price: 80000, mileage: 12000, engine: '3.0L Twin-Turbo', horsepower: 503, transmission: 'Automatic', drivetrain: 'RWD', fuel: 'Petrol', exteriorColor: 'Black', interiorColor: 'Black', description: 'Clean, low-mileage performance coupe.', status: 'available', images: [] },
  { id: 'demo-002', make: 'Mercedes-Benz', model: 'C300', year: 2023, price: 54000, mileage: 18500, engine: '2.0L Turbo', horsepower: 255, transmission: 'Automatic', drivetrain: 'RWD', fuel: 'Petrol', exteriorColor: 'White', interiorColor: 'Beige', description: 'Comfortable and well maintained.', status: 'reserved', images: [] },
  { id: 'demo-003', make: 'Audi', model: 'Q5 Premium Plus', year: 2024, price: 63000, mileage: 7200, engine: '2.0L Turbo', horsepower: 261, transmission: 'Automatic', drivetrain: 'AWD', fuel: 'Petrol', exteriorColor: 'Gray', interiorColor: 'Black', description: 'A refined, practical luxury SUV.', status: 'sold', images: [] },
];

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

function AdminIcon({ name }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    cars: <><path d="m5 17-2-1v-4l2-1 2-4h10l2 4 2 1v4l-2 1" /><path d="M5 11h14M7 17v2M17 17v2" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 4h6v16h-6" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    upload: <><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M4 15v5h16v-5" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
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
        <a className="admin-back-link" href="/">← Return to website</a>
      </section>
    </main>
  );
}

function Summary({ cars, onNavigate }) {
  const available = cars.filter((car) => car.status === 'available').length;
  const reserved = cars.filter((car) => car.status === 'reserved').length;
  const sold = cars.filter((car) => car.status === 'sold').length;
  const totalValue = cars.filter((car) => car.status !== 'sold').reduce((sum, car) => sum + Number(car.price || 0), 0);
  const cards = [
    ['Total inventory', cars.length, 'cars'], ['Available', available, 'ready to sell'],
    ['Reserved', reserved, 'awaiting completion'], ['Active value', money(totalValue), 'available + reserved'],
  ];
  return (
    <div className="admin-view">
      <div className="admin-page-heading"><div><p className="admin-kicker">Overview</p><h1>Dashboard</h1><p>Monitor inventory status and keep listings current.</p></div><button className="button button-primary" onClick={() => onNavigate('add')}><AdminIcon name="plus" /> Add vehicle</button></div>
      <section className="admin-summary-grid" aria-label="Inventory summary">
        {cards.map(([label, value, note]) => <article className="admin-summary-card" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-kicker">Recent inventory</p><h2>Latest vehicles</h2></div><button className="admin-text-button" onClick={() => onNavigate('inventory')}>View all <AdminIcon name="arrow" /></button></div>
        <div className="admin-recent-list">
          {cars.slice(0, 4).map((car) => <button key={car.id} className="admin-recent-row" onClick={() => onNavigate('details', car)}><VehicleImage src={car.images?.[0]} alt="" /><span><strong>{car.make} {car.model}</strong><small>{car.year} · {money(car.price)}</small></span><span className={`admin-status status-${car.status}`}>{car.status}</span><AdminIcon name="arrow" /></button>)}
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
  status: 'all', make: 'all', model: 'all', year: 'all', drivetrain: 'all',
  transmission: 'all', fuel: 'all', engine: 'all', exteriorColor: 'all', interiorColor: 'all',
  minPrice: '', maxPrice: '', maxMileage: '', minHorsepower: '', maxHorsepower: '',
};

function uniqueCarValues(cars, field, numeric = false) {
  const values = [...new Set(cars.map((car) => car[field]).filter((value) => value !== '' && value != null))];
  return values.sort(numeric ? (left, right) => right - left : (left, right) => String(left).localeCompare(String(right)));
}

function Inventory({ cars, onNavigate, onDelete }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(defaultInventoryFilters);
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('table');
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
    const searchable = [car.make, car.model, car.year, car.price, car.mileage, car.engine, car.horsepower, car.transmission, car.drivetrain, car.fuel, car.exteriorColor, car.interiorColor, car.description, car.status].join(' ').toLowerCase();
    const queryWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matchesText = queryWords.every((word) => searchable.includes(word));
    const withinMinimumPrice = filters.minPrice === '' || Number(car.price) >= Number(filters.minPrice);
    const withinMaximumPrice = filters.maxPrice === '' || Number(car.price) <= Number(filters.maxPrice);
    const withinMileage = filters.maxMileage === '' || Number(car.mileage) <= Number(filters.maxMileage);
    const withinMinimumHorsepower = filters.minHorsepower === '' || Number(car.horsepower) >= Number(filters.minHorsepower);
    const withinMaximumHorsepower = filters.maxHorsepower === '' || Number(car.horsepower) <= Number(filters.maxHorsepower);
    return matchesText
      && (filters.status === 'all' || car.status === filters.status)
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
      <div className="admin-page-heading"><div><p className="admin-kicker">Vehicle management</p><h1>Inventory</h1><p>{filtered.length} of {cars.length} vehicles shown.</p></div><button className="button button-primary" onClick={() => onNavigate('add')}><AdminIcon name="plus" /> Add vehicle</button></div>
      <section className="admin-toolbar" aria-label="Inventory controls">
        <label className="admin-search"><span className="sr-only">Search inventory</span><AdminIcon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search all vehicle details" /></label>
        <SelectField label="Filter by status" name="status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} options={['all', 'available', 'reserved', 'sold']} optionLabels={{ all: 'All statuses', available: 'Available', reserved: 'Reserved', sold: 'Sold' }} hideLabel searchable={false} />
        <SelectField label="Sort inventory" name="sort" value={sort} onChange={(event) => setSort(event.target.value)} options={['newest', 'oldest', 'price-high', 'price-low', 'mileage-low', 'mileage-high', 'make']} optionLabels={{ newest: 'Newest year', oldest: 'Oldest year', 'price-high': 'Price: high to low', 'price-low': 'Price: low to high', 'mileage-low': 'Mileage: low to high', 'mileage-high': 'Mileage: high to low', make: 'Make and model' }} hideLabel searchable={false} />
        <div className="admin-view-toggle" aria-label="View style"><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} aria-pressed={view === 'table'}>Table</button><button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-pressed={view === 'grid'}>Grid</button></div>
      </section>
      <details className="admin-filter-panel">
        <summary><span>Advanced filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</span><small>Make, model, year, specifications, price, and mileage</small></summary>
        <div className="admin-filter-grid">
          <label><span>Make</span><select aria-label="Filter by make" value={filters.make} onChange={(event) => updateFilter('make', event.target.value)}><option value="all">All makes</option>{options.makes.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Model</span><select aria-label="Filter by model" value={filters.model} onChange={(event) => updateFilter('model', event.target.value)}><option value="all">All models</option>{options.models.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Year</span><select aria-label="Filter by year" value={filters.year} onChange={(event) => updateFilter('year', event.target.value)}><option value="all">All years</option>{options.years.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Drivetrain</span><select aria-label="Filter by drivetrain" value={filters.drivetrain} onChange={(event) => updateFilter('drivetrain', event.target.value)}><option value="all">All drivetrains</option>{options.drivetrains.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Transmission</span><select aria-label="Filter by transmission" value={filters.transmission} onChange={(event) => updateFilter('transmission', event.target.value)}><option value="all">All transmissions</option>{options.transmissions.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Fuel type</span><select aria-label="Filter by fuel type" value={filters.fuel} onChange={(event) => updateFilter('fuel', event.target.value)}><option value="all">All fuel types</option>{options.fuels.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Engine</span><select aria-label="Filter by engine" value={filters.engine} onChange={(event) => updateFilter('engine', event.target.value)}><option value="all">All engines</option>{options.engines.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Exterior color</span><select aria-label="Filter by exterior color" value={filters.exteriorColor} onChange={(event) => updateFilter('exteriorColor', event.target.value)}><option value="all">All exterior colors</option>{options.exteriorColors.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Interior color</span><select aria-label="Filter by interior color" value={filters.interiorColor} onChange={(event) => updateFilter('interiorColor', event.target.value)}><option value="all">All interior colors</option>{options.interiorColors.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Minimum price</span><input aria-label="Minimum price" type="number" min="0" inputMode="numeric" value={filters.minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} placeholder="$0" /></label>
          <label><span>Maximum price</span><input aria-label="Maximum price" type="number" min="0" inputMode="numeric" value={filters.maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value)} placeholder="No maximum" /></label>
          <label><span>Maximum mileage</span><input aria-label="Maximum mileage" type="number" min="0" inputMode="numeric" value={filters.maxMileage} onChange={(event) => updateFilter('maxMileage', event.target.value)} placeholder="No maximum" /></label>
          <label><span>Minimum horsepower</span><input aria-label="Minimum horsepower" type="number" min="0" inputMode="numeric" value={filters.minHorsepower} onChange={(event) => updateFilter('minHorsepower', event.target.value)} placeholder="No minimum" /></label>
          <label><span>Maximum horsepower</span><input aria-label="Maximum horsepower" type="number" min="0" inputMode="numeric" value={filters.maxHorsepower} onChange={(event) => updateFilter('maxHorsepower', event.target.value)} placeholder="No maximum" /></label>
        </div>
        <div className="admin-filter-footer"><span>{filtered.length} matching vehicle{filtered.length === 1 ? '' : 's'}</span><button type="button" onClick={resetFilters} disabled={!search && !activeFilterCount}>Clear all filters</button></div>
      </details>
      {!filtered.length ? <EmptyState onAction={cars.length ? resetFilters : () => onNavigate('add')} actionLabel={cars.length ? 'Clear all filters' : 'Add first vehicle'} /> : view === 'table' ? (
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Vehicle</th><th>Status</th><th>Year</th><th>Mileage</th><th>Price</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((car) => <tr key={car.id}><td><div className="admin-vehicle-cell"><VehicleImage src={car.images?.[0]} alt="" /><span><strong>{car.make} {car.model}</strong><small>{car.engine}</small></span></div></td><td><span className={`admin-status status-${car.status}`}>{car.status}</span></td><td>{car.year}</td><td>{Number(car.mileage || 0).toLocaleString()} km</td><td><strong>{money(car.price)}</strong></td><td><div className="admin-row-actions"><button aria-label={`View ${car.make} ${car.model}`} onClick={() => onNavigate('details', car)}><AdminIcon name="eye" /></button><button aria-label={`Edit ${car.make} ${car.model}`} onClick={() => onNavigate('edit', car)}><AdminIcon name="edit" /></button><button className="danger" aria-label={`Delete ${car.make} ${car.model}`} onClick={() => onDelete(car)}><AdminIcon name="trash" /></button></div></td></tr>)}</tbody></table></div>
      ) : <div className="admin-inventory-grid">{filtered.map((car) => <article className="admin-inventory-card" key={car.id}><VehicleImage src={car.images?.[0]} alt={`${car.make} ${car.model}`} /><div><span className={`admin-status status-${car.status}`}>{car.status}</span><h2>{car.make} {car.model}</h2><p>{car.year} · {Number(car.mileage || 0).toLocaleString()} km</p><strong>{money(car.price)}</strong><div className="admin-card-actions"><button onClick={() => onNavigate('details', car)}>View</button><button onClick={() => onNavigate('edit', car)}>Edit</button><button className="danger" onClick={() => onDelete(car)}>Delete</button></div></div></article>)}</div>}
    </div>
  );
}

function validateCar(car) {
  const errors = {};
  ['make', 'model', 'engine', 'transmission', 'drivetrain', 'fuel', 'exteriorColor', 'interiorColor'].forEach((field) => { if (!String(car[field] ?? '').trim()) errors[field] = 'Required.'; });
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(Number(car.year)) || Number(car.year) < 1886 || Number(car.year) > currentYear + 1) errors.year = `Enter a year from 1886 to ${currentYear + 1}.`;
  ['price', 'mileage', 'horsepower'].forEach((field) => { if (car[field] === '' || Number(car[field]) < 0 || !Number.isFinite(Number(car[field]))) errors[field] = 'Enter a valid non-negative number.'; });
  if (car.mileage !== '' && !Number.isInteger(Number(car.mileage))) errors.mileage = 'Mileage must be a whole number.';
  if (String(car.description).length > 5000) errors.description = 'Description must be 5,000 characters or fewer.';
  return errors;
}

function Field({ label, name, value, error, onChange, type = 'text', ...props }) {
  const errorId = `${name}-error`;
  return <label className={`admin-field ${error ? 'has-error' : ''}`}><span>{label}</span><input name={name} type={type} value={value} onChange={onChange} aria-label={label} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...props} />{error && <small id={errorId} className="admin-field-error">{error}</small>}</label>;
}

function SelectField({ label, ariaLabel = label, name, value, error, onChange, options, optionLabels = {}, placeholder = 'Select an option', disabled = false, searchable = name === 'make', hideLabel = false }) {
  const id = useId().replace(/:/g, '');
  const errorId = `${name}-error`;
  const hasUnsupportedValue = Boolean(value) && !options.includes(value);
  const resolvedOptions = hasUnsupportedValue ? [...options, value] : options;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(Math.max(0, resolvedOptions.indexOf(value)));
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const visibleOptions = searchable && query
    ? resolvedOptions.filter((option) => (optionLabels[option] || option).toLowerCase().includes(query.trim().toLowerCase()))
    : resolvedOptions;

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => {
    if (open && searchable) window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, searchable]);
  useEffect(() => { setActiveIndex(0); }, [query]);

  function choose(nextValue) {
    onChange({ target: { name, value: nextValue } });
    setOpen(false);
    setQuery('');
  }
  function handleKeyDown(event) {
    if (disabled) return;
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

  return <div className={`admin-field admin-select-field ${open ? 'is-open' : ''} ${error ? 'has-error' : ''}`} ref={rootRef}>
    <span id={`${id}-label`} className={hideLabel ? 'sr-only' : undefined}>{label}</span>
    <button ref={triggerRef} id={`${id}-trigger`} className="admin-select-trigger" type="button" role="combobox" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-listbox`} aria-activedescendant={open && visibleOptions[activeIndex] ? `${id}-option-${activeIndex}` : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} disabled={disabled} onClick={() => { setQuery(''); setOpen((current) => !current); }} onKeyDown={handleKeyDown}>
      <span className={value ? '' : 'placeholder'}>{value ? optionLabels[value] || value : placeholder}</span><span className="admin-select-chevron" aria-hidden="true" />
    </button>
    {open && <div className="admin-select-menu">{searchable && <label className="admin-select-search"><span className="sr-only">Search {label.replace(' *', '')}</span><AdminIcon name="search" /><input ref={searchRef} type="search" aria-label={`Search ${label.replace(' *', '')}`} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleSearchKeyDown} placeholder={`Search ${label.replace(' *', '').toLowerCase()}s`} /></label>}<div className="admin-select-options" id={`${id}-listbox`} role="listbox" aria-label={`${label} options`}>{visibleOptions.map((option, index) => <button id={`${id}-option-${index}`} type="button" role="option" aria-selected={option === value} className={index === activeIndex ? 'is-active' : ''} key={option} onPointerMove={() => setActiveIndex(index)} onClick={() => choose(option)}>{optionLabels[option] || option}{hasUnsupportedValue && option === value ? ' (Other)' : ''}{option === value && <span aria-hidden="true">✓</span>}</button>)}{!visibleOptions.length && <p className="admin-select-empty">No matching makes found.</p>}</div></div>}
    {error && <small id={errorId} className="admin-field-error">{error}</small>}
  </div>;
}

function CarForm({ mode, initialCar, onCancel, onSave }) {
  const [car, setCar] = useState(() => ({ ...emptyCar, ...initialCar, images: [...(initialCar?.images || [])] }));
  const [errors, setErrors] = useState({});
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const firstErrorRef = useRef(null);

  const modelOptions = vehicleModels[car.make] || [];
  const engineOptions = getEngineOptions(car.make, car.model);
  function change(event) { setCar({ ...car, [event.target.name]: event.target.value }); }
  function changeMake(event) { setCar({ ...car, make: event.target.value, model: '', engine: '' }); }
  function changeModel(event) { setCar({ ...car, model: event.target.value, engine: '' }); }
  function changeMileage(event) {
    const nextValue = event.target.value;
    if (nextValue === '' || /^\d+$/.test(nextValue)) setCar({ ...car, mileage: nextValue });
  }
  function preventInvalidMileageKey(event) {
    if (['-', '+', '.', ',', 'e', 'E'].includes(event.key)) event.preventDefault();
  }
  function preventInvalidMileagePaste(event) {
    if (!/^\d+$/.test(event.clipboardData.getData('text'))) event.preventDefault();
  }
  function addImageUrl() {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== 'https:') throw new Error();
      setCar({ ...car, images: [...car.images, url.toString()].slice(0, 20) });
      setImageUrl('');
      setErrors({ ...errors, images: undefined });
    } catch { setErrors({ ...errors, images: 'Enter a valid HTTPS image URL.' }); }
  }
  function selectFiles(event) {
    const previews = [...event.target.files].filter((file) => /^image\/(jpeg|png|webp)$/.test(file.type) && file.size < 10 * 1024 * 1024).map((file) => URL.createObjectURL(file));
    setCar({ ...car, images: [...car.images, ...previews].slice(0, 20) });
    if (previews.length !== event.target.files.length) setErrors({ ...errors, images: 'Only JPEG, PNG, or WebP files under 10 MB are previewed.' });
  }
  function submit(event) {
    event.preventDefault();
    const nextErrors = validateCar(car);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      window.requestAnimationFrame(() => document.querySelector('.admin-field [aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    window.setTimeout(() => onSave({ ...car, year: Number(car.year), price: Number(car.price), mileage: Number(car.mileage), horsepower: Number(car.horsepower) }), 300);
  }

  return <div className="admin-view"><div className="admin-page-heading"><div><button className="admin-back-button" onClick={onCancel}>← Back to inventory</button><p className="admin-kicker">{mode === 'add' ? 'New listing' : 'Update listing'}</p><h1>{mode === 'add' ? 'Add vehicle' : `Edit ${initialCar.make} ${initialCar.model}`}</h1><p>Fields marked required are needed before this listing can be saved.</p></div></div><form className="admin-car-form" onSubmit={submit} noValidate ref={firstErrorRef}>
    <section className="admin-form-section"><div className="admin-form-section-heading"><span>01</span><div><h2>Vehicle details</h2><p>Core listing and availability information.</p></div></div><div className="admin-form-grid"><SelectField label="Make *" name="make" value={car.make} error={errors.make} onChange={changeMake} options={vehicleMakes} placeholder="Select a make" /><SelectField label="Model *" name="model" value={car.model} error={errors.model} onChange={changeModel} options={modelOptions} placeholder={car.make ? 'Select a model' : 'Select a make first'} disabled={!car.make} /><SelectField label="Year *" name="year" value={String(car.year)} error={errors.year} onChange={change} options={yearOptions} placeholder="Select a year" /><Field label="Price (USD) *" name="price" type="number" value={car.price} error={errors.price} onChange={change} /><SelectField label="Status *" name="status" value={car.status} onChange={change} options={['available', 'reserved', 'sold']} /><label className="admin-field admin-field-wide"><span>Description</span><textarea name="description" rows="5" value={car.description} onChange={change} aria-invalid={Boolean(errors.description)} /><small>{car.description.length}/5000</small>{errors.description && <small className="admin-field-error">{errors.description}</small>}</label></div></section>
    <section className="admin-form-section"><div className="admin-form-section-heading"><span>02</span><div><h2>Specifications</h2><p>Technical and appearance information.</p></div></div><div className="admin-form-grid"><Field label="Mileage (km) *" name="mileage" type="number" inputMode="numeric" min="0" step="1" value={car.mileage} error={errors.mileage} onChange={changeMileage} onKeyDown={preventInvalidMileageKey} onPaste={preventInvalidMileagePaste} /><SelectField label="Engine *" name="engine" value={car.engine} error={errors.engine} onChange={change} options={engineOptions} placeholder={car.model ? 'Select an engine' : 'Select a model first'} disabled={!car.model} /><Field label="Horsepower *" name="horsepower" type="number" value={car.horsepower} error={errors.horsepower} onChange={change} /><SelectField label="Transmission *" name="transmission" value={car.transmission} error={errors.transmission} onChange={change} options={transmissionOptions} optionLabels={vehicleOptionLabels} /><SelectField label="Drivetrain *" name="drivetrain" value={car.drivetrain} error={errors.drivetrain} onChange={change} options={drivetrainOptions} /><SelectField label="Fuel type *" name="fuel" value={car.fuel} error={errors.fuel} onChange={change} options={fuelOptions} optionLabels={vehicleOptionLabels} /><Field label="Exterior color *" name="exteriorColor" value={car.exteriorColor} error={errors.exteriorColor} onChange={change} /><Field label="Interior color *" name="interiorColor" value={car.interiorColor} error={errors.interiorColor} onChange={change} /></div></section>
    <section className="admin-form-section"><div className="admin-form-section-heading"><span>03</span><div><h2>Vehicle images</h2><p>Select local images for preview or add hosted URLs. Uploading will be connected later.</p></div></div><div className="admin-image-controls"><label className="admin-upload-zone"><AdminIcon name="upload" /><strong>Select images</strong><span>JPEG, PNG, or WebP · max 10 MB each</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} /></label><div className="admin-url-input"><label htmlFor="image-url">Hosted image URL</label><div><input id="image-url" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://…" /><button type="button" onClick={addImageUrl}>Add URL</button></div>{errors.images && <small className="admin-field-error">{errors.images}</small>}</div></div>{car.images.length > 0 && <div className="admin-image-previews" aria-label="Selected image previews">{car.images.map((image, index) => <div key={`${image}-${index}`}><VehicleImage src={image} alt={`Vehicle preview ${index + 1}`} /><button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => setCar({ ...car, images: car.images.filter((_, imageIndex) => imageIndex !== index) })}>×</button>{index === 0 && <span>Cover</span>}</div>)}</div>}</section>
    <div className="admin-form-actions"><button className="button button-outline" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : mode === 'add' ? 'Add vehicle' : 'Save changes'}</button></div>
  </form></div>;
}

function Details({ car, onBack, onEdit, onDelete }) {
  const specs = [['Mileage', `${Number(car.mileage || 0).toLocaleString()} km`], ['Engine', car.engine], ['Horsepower', `${car.horsepower} hp`], ['Transmission', car.transmission], ['Drivetrain', car.drivetrain], ['Fuel', car.fuel], ['Exterior', car.exteriorColor], ['Interior', car.interiorColor]];
  return <div className="admin-view"><button className="admin-back-button" onClick={onBack}>← Back to inventory</button><div className="admin-details-heading"><div><span className={`admin-status status-${car.status}`}>{car.status}</span><p>{car.year}</p><h1>{car.make} {car.model}</h1><strong>{money(car.price)}</strong></div><div><button className="button button-outline" onClick={onEdit}><AdminIcon name="edit" /> Edit</button><button className="button admin-danger-button" onClick={onDelete}><AdminIcon name="trash" /> Delete</button></div></div><div className="admin-details-layout"><section className="admin-detail-gallery"><VehicleImage src={car.images?.[0]} alt={`${car.make} ${car.model}`} />{car.images?.length > 1 && <div>{car.images.slice(1, 5).map((image, index) => <VehicleImage key={image} src={image} alt={`${car.make} ${car.model} view ${index + 2}`} />)}</div>}</section><aside className="admin-preview-card"><p className="admin-kicker">Customer preview</p><span className={`admin-status status-${car.status}`}>{car.status}</span><h2>{car.make} {car.model}</h2><p>{car.year} · {Number(car.mileage || 0).toLocaleString()} km</p><strong>{money(car.price)}</strong><span>This mirrors the information customers receive through the public API.</span></aside></div><section className="admin-panel admin-detail-section"><div className="admin-panel-heading"><div><p className="admin-kicker">Vehicle overview</p><h2>Specifications</h2></div></div><dl className="admin-spec-grid">{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl></section><section className="admin-panel admin-detail-section"><p className="admin-kicker">Listing copy</p><h2>Description</h2><p>{car.description || 'No description provided.'}</p></section></div>;
}

function DeleteDialog({ car, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const supportsModal = typeof HTMLDialogElement !== 'undefined' && Boolean(HTMLDialogElement.prototype.showModal);
  useEffect(() => { dialogRef.current?.showModal?.(); }, []);
  return <dialog className="admin-dialog" ref={dialogRef} open={!supportsModal} onCancel={onCancel} aria-labelledby="delete-title"><div className="admin-dialog-icon"><AdminIcon name="trash" /></div><h2 id="delete-title">Delete this vehicle?</h2><p><strong>{car.make} {car.model}</strong> will be removed from the inventory. This action cannot be undone after backend integration.</p><div><button className="button button-outline" onClick={onCancel}>Cancel</button><button className="button admin-danger-button" onClick={onConfirm}>Delete vehicle</button></div></dialog>;
}

function LoadingState() { return <div className="admin-loading" role="status"><span /><h2>Loading inventory</h2><p>Preparing the management workspace…</p></div>; }

function AdminWorkspace({ email, onSignOut }) {
  const [cars, setCars] = useState([]);
  const [view, setView] = useState('dashboard');
  const [selectedCar, setSelectedCar] = useState(null);
  const [deleteCar, setDeleteCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');

  function loadInventory() {
    setLoading(true); setLoadError(false);
    getCars().then(setCars).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }
  useEffect(loadInventory, []);
  function navigate(nextView, car = null) { setView(nextView); setSelectedCar(car); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'auto' }); }
  function saveCar(car) {
    if (view === 'add') {
      setCars([{ ...car, id: `local-${Date.now()}` }, ...cars]); setNotice('Vehicle added to this UI preview.');
    } else {
      setCars(cars.map((item) => item.id === selectedCar.id ? { ...car, id: item.id } : item)); setNotice('Vehicle changes saved in this UI preview.');
    }
    navigate('inventory'); window.setTimeout(() => setNotice(''), 3500);
  }
  function confirmDelete() { setCars(cars.filter((car) => car.id !== deleteCar.id)); setDeleteCar(null); setNotice('Vehicle removed from this UI preview.'); navigate('inventory'); window.setTimeout(() => setNotice(''), 3500); }

  return <div className="admin-app"><aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}><a className="admin-sidebar-logo" href="/"><img src={logo} alt="AM MOTORS" /></a><nav aria-label="Admin navigation"><button className={view === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><AdminIcon name="dashboard" /> Dashboard</button><button className={['inventory', 'details', 'edit'].includes(view) ? 'active' : ''} onClick={() => navigate('inventory')}><AdminIcon name="cars" /> Inventory <span>{cars.length}</span></button><button className={view === 'add' ? 'active' : ''} onClick={() => navigate('add')}><AdminIcon name="plus" /> Add vehicle</button></nav><div className="admin-sidebar-user"><span>{email.charAt(0).toUpperCase()}</span><div><strong>Administrator</strong><small>{email}</small></div><button aria-label="Sign out" onClick={onSignOut}><AdminIcon name="logout" /></button></div></aside><div className="admin-main"><header className="admin-mobile-header"><button aria-label="Toggle admin navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><AdminIcon name={menuOpen ? 'close' : 'menu'} /></button><img src={logo} alt="AM MOTORS" /><span>Admin</span></header>{menuOpen && <button className="admin-menu-scrim" aria-label="Close admin navigation" onClick={() => setMenuOpen(false)} />}{notice && <div className="admin-toast" role="status"><span>✓</span>{notice}</div>}{loading ? <LoadingState /> : loadError ? <div className="admin-error-state" role="alert"><h1>Unable to load inventory</h1><p>Start the existing backend and try again, or continue with demo data to review the interface.</p><div><button className="button button-outline" onClick={loadInventory}>Try again</button><button className="button button-primary" onClick={() => { setCars(demoCars); setLoadError(false); }}>Use demo inventory</button></div></div> : <>{view === 'dashboard' && <Summary cars={cars} onNavigate={navigate} />}{view === 'inventory' && <Inventory cars={cars} onNavigate={navigate} onDelete={setDeleteCar} />}{view === 'add' && <CarForm mode="add" onCancel={() => navigate('inventory')} onSave={saveCar} />}{view === 'edit' && selectedCar && <CarForm mode="edit" initialCar={selectedCar} onCancel={() => navigate('inventory')} onSave={saveCar} />}{view === 'details' && selectedCar && <Details car={cars.find((car) => car.id === selectedCar.id) || selectedCar} onBack={() => navigate('inventory')} onEdit={() => navigate('edit', selectedCar)} onDelete={() => setDeleteCar(selectedCar)} />}</>}</div>{deleteCar && <DeleteDialog car={deleteCar} onCancel={() => setDeleteCar(null)} onConfirm={confirmDelete} />}</div>;
}

function AdminPage() {
  const [authState, setAuthState] = useState({ loading: true, user: null });

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
