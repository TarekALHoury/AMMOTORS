import amMark from '../assets/am-mark-metallic.png';

function About() {
  return (
    <section className="section about-section" id="about">
      <div className="page-width about-layout">
        <div className="about-visual" data-tilt="5"><img className="about-brand-mark" src={amMark} alt="AM Motors metallic logo" /><small>Driven by quality</small></div>
        <div className="about-copy">
          <p className="eyebrow">Our dealership</p>
          <h2>About AM MOTORS</h2>
          <p>AM MOTORS, owned by Ali Moussawi, is a Lebanon-based automotive dealership focused on carefully selected quality vehicles. Explore our latest inventory, review each car’s specifications, and contact us directly for clear, personal guidance before your next purchase.</p>
          <div className="about-points"><span>Quality-first selection</span><span>Transparent, personal service</span></div>
        </div>
      </div>
    </section>
  );
}

export default About;
