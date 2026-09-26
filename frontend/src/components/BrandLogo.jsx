import whiteLogo from '../assets/am-motors-logo.png';

// Replace the light entry with the supplied black-logo asset when it is available.
const logoVariants = {
  dark: whiteLogo,
  light: whiteLogo,
};

function BrandLogo({ theme = 'dark' }) {
  const variant = theme === 'light' ? 'light' : 'dark';
  return <img className={`brand-logo brand-logo-${variant}`} src={logoVariants[variant]} alt="AM MOTORS" />;
}

export default BrandLogo;
