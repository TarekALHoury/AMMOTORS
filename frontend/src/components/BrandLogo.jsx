import whiteLogo from '../assets/am-motors-logo.png';
import blackLogo from '../assets/am-motors-logo-black.png';

const logoVariants = {
  dark: whiteLogo,
  light: blackLogo,
};

function BrandLogo({ theme = 'dark' }) {
  const variant = theme === 'light' ? 'light' : 'dark';
  return <img className={`brand-logo brand-logo-${variant}`} src={logoVariants[variant]} alt="AM MOTORS" />;
}

export default BrandLogo;
