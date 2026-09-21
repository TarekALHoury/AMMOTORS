function CarFilters({ filters, setFilters, cars }) {
  const makes = [...new Set(cars.map((car) => car.make))].sort();
  const models = [...new Set(cars.filter((car) => !filters.make || car.make === filters.make).map((car) => car.model))].sort();

  function update(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value, ...(name === 'make' ? { model: '' } : {}) }));
  }

  return (
    <div className="filters" aria-label="Filter available cars">
      <label className="search-field"><span>Search</span><input name="search" value={filters.search} onChange={update} placeholder="Make, model or year" /></label>
      <label><span>Make</span><select name="make" value={filters.make} onChange={update}><option value="">All makes</option>{makes.map((make) => <option key={make}>{make}</option>)}</select></label>
      <label><span>Model</span><select name="model" value={filters.model} onChange={update}><option value="">All models</option>{models.map((model) => <option key={model}>{model}</option>)}</select></label>
      <label><span>Price range</span><select name="price" value={filters.price} onChange={update}><option value="">Any price</option><option value="0-50000">Under $50,000</option><option value="50000-75000">$50,000 – $75,000</option><option value="75000-Infinity">$75,000+</option></select></label>
    </div>
  );
}

export default CarFilters;

