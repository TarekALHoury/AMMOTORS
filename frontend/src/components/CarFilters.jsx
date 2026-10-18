import StyledSelect from './StyledSelect.jsx';

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
      <StyledSelect label="Make" name="make" value={filters.make} onChange={update} searchable options={[{ value: '', label: 'All makes' }, ...makes.map((make) => ({ value: make, label: make }))]} />
      <StyledSelect label="Model" name="model" value={filters.model} onChange={update} searchable options={[{ value: '', label: 'All models' }, ...models.map((model) => ({ value: model, label: model }))]} />
    </div>
  );
}

export default CarFilters;

