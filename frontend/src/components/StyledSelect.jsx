import { useEffect, useId, useRef, useState } from 'react';

function StyledSelect({ label, name, value, options, onChange, searchable = false }) {
  const id = useId().replace(/:/g, '');
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((option) => option.value === value) || options[0];
  const visibleOptions = query
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);
  useEffect(() => {
    if (open && searchable) window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, searchable]);
  useEffect(() => { setActiveIndex(0); }, [query]);

  function choose(option) {
    onChange({ target: { name, value: option.value } });
    setOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  }
  function navigate(event) {
    if (event.key === 'Escape') {
      event.preventDefault(); setOpen(false); triggerRef.current?.focus(); return;
    }
    if (event.key === 'Tab') { setOpen(false); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setOpen(true);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      if (visibleOptions.length) setActiveIndex((index) => (index + direction + visibleOptions.length) % visibleOptions.length);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); setOpen(true); setActiveIndex(event.key === 'Home' ? 0 : visibleOptions.length - 1); return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open && visibleOptions[activeIndex]) choose(visibleOptions[activeIndex]);
      else setOpen(true);
    }
  }

  return <div className={`site-select ${open ? 'is-open' : ''}`} ref={rootRef}>
    <span className="site-select-label" id={`${id}-label`}>{label}</span>
    <button ref={triggerRef} className="site-select-trigger" type="button" role="combobox" aria-label={label} aria-expanded={open} aria-haspopup="listbox" aria-controls={`${id}-options`} aria-activedescendant={open && visibleOptions[activeIndex] ? `${id}-option-${activeIndex}` : undefined} onClick={() => { setQuery(''); setOpen((current) => !current); }} onKeyDown={navigate}>
      <span>{selected.label}</span><span className="site-select-chevron" aria-hidden="true" />
    </button>
    {open && <div className="site-select-menu">
      {searchable && <label className="site-select-search"><span className="sr-only">Search {label}</span><input ref={searchRef} type="search" aria-label={`Search ${label}`} value={query} placeholder={`Search ${label.toLowerCase()}`} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === ' ') return; navigate(event); }} /></label>}
      <div className="site-select-options" role="listbox" id={`${id}-options`} aria-label={`${label} options`}>
        {visibleOptions.map((option, index) => <button id={`${id}-option-${index}`} key={option.value || 'all'} type="button" role="option" aria-selected={option.value === value} className={index === activeIndex ? 'is-active' : ''} onPointerMove={() => setActiveIndex(index)} onClick={() => choose(option)}><span>{option.label}</span>{option.value === value && <span aria-hidden="true">✓</span>}</button>)}
        {!visibleOptions.length && <p className="site-select-empty">No matching options.</p>}
      </div>
    </div>}
  </div>;
}

export default StyledSelect;
