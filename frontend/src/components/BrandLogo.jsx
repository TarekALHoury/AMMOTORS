import whiteLogo from '../assets/am-motors-logo.png';
import blackLogo from '../assets/am-motors-logo-black.png';

const logoVariants = {
  dark: whiteLogo,
  light: blackLogo,
};

function BrandLogo({ theme = 'dark', responsiveNavigation = false }) {
  const variant = theme === 'light' ? 'light' : 'dark';

  if (responsiveNavigation && theme === 'light') {
    return (
      <picture className="brand-logo-picture">
        <source media="(max-width: 850px)" srcSet={blackLogo} />
        <img className="brand-logo brand-logo-dark" src={whiteLogo} alt="AM MOTORS" />
      </picture>
    );
  }

  return <img className={`brand-logo brand-logo-${variant}`} src={logoVariants[variant]} alt="AM MOTORS" />;
}

export default BrandLogo;
