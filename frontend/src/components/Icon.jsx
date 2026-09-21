import whatsappAsset from '../assets/icons/whatsapp.png';

const paths = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  whatsapp: <><path d="M21 11.7a9 9 0 0 1-13.2 8L3 21l1.3-4.7A9 9 0 1 1 21 11.7Z" /><path d="M8.6 7.4c.2-.4.5-.5.8-.4l1.3.6c.3.1.4.4.3.7l-.5 1.2c.7 1.4 1.8 2.5 3.2 3.2l1.2-.5c.3-.1.6 0 .7.3l.6 1.3c.1.3 0 .6-.3.8-.6.4-1.3.6-2.1.5-3.3-.4-6-3.1-6.4-6.4-.1-.8.1-1.5.5-2.1Z" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  check: <path d="m5 12 4 4L19 6" />,
  tag: <><path d="M20 13 13 20l-9-9V4h7l9 9Z" /><path d="M8.5 8.5h.01" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  car: <><path d="m5 17-2-1v-4l2-1 2-4h10l2 4 2 1v4l-2 1" /><path d="M5 11h14M7 17v2M17 17v2M7.5 14h.01M16.5 14h.01" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  diamond: <><path d="M3 8 7 3h10l4 5-9 13L3 8Z" /><path d="m7 3 5 18 5-18M3 8h18" /></>,
  gauge: <><path d="M4 15a8 8 0 1 1 16 0" /><path d="m12 15 3-5M7 19h10" /></>,
  engine: <><path d="M7 9h10l2 3v6H5v-6l2-3ZM9 9V6h6v3M19 13h2M3 13h2" /></>,
  fuel: <><path d="M6 22V4h9v18M4 22h13M8 8h5" /><path d="M15 7h2l3 3v8a1.5 1.5 0 0 1-3 0v-4" /></>,
  palette: <><circle cx="12" cy="12" r="9" /><path d="M8 9h.01M12 7h.01M16 9h.01M7 13h.01" /><path d="M14 16c0 1.5-1 3-2.5 3S9 18 9 17s1-2 2.5-2H13c.6 0 1 .4 1 1Z" /></>,
};

function Icon({ name, size = 20, className = '' }) {
  if (name === 'whatsapp') {
    return <img className={`icon-image ${className}`} src={whatsappAsset} width={size} height={size} alt="" aria-hidden="true" />;
  }

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default Icon;
