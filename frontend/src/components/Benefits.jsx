import Icon from './Icon.jsx';

const benefits = [
  { icon: 'diamond', title: 'Quality', text: 'Vehicles' },
  { icon: 'tag', title: 'Transparent', text: 'Pricing' },
  { icon: 'shield', title: 'Trusted', text: 'Dealership' },
  { icon: 'whatsapp', title: 'Direct', text: 'WhatsApp Contact' },
];

function Benefits({ embedded = false }) {
  return (
    <section className={embedded ? 'hero-benefits' : 'benefits'} aria-label="Why choose AM MOTORS">
      <div className={embedded ? 'hero-benefits-grid' : 'page-width benefits-grid'}>
        {benefits.map((benefit) => (
          <div className="benefit" data-tilt="5" key={benefit.title}>
            <span className="benefit-icon"><Icon name={benefit.icon} size={embedded ? 32 : 22} /></span>
            <div><strong>{benefit.title}</strong><small>{benefit.text}</small></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Benefits;
