function About() {
  return (
    <section className="section about-section" id="about">
      <div className="page-width about-layout">
        <div className="about-visual">
          <iframe
            title="AM MOTORS dealership location"
            src="https://maps.google.com/maps?q=33.8359833,35.5650153&z=16&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
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
