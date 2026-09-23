import { dealership } from '../config/dealership.js';
import Icon from './Icon.jsx';
import WhatsAppButton from './WhatsAppButton.jsx';

function Contact() {
  return (
    <section className="section contact-section" id="contact">
      <div className="page-width contact-panel">
        <div><p className="eyebrow">Let’s talk</p><h2>Contact AM MOTORS</h2><p>Interested in one of our vehicles? Reach us directly and we’ll be happy to help.</p></div>
        <div className="contact-actions">
          <WhatsAppButton>Chat on WhatsApp</WhatsAppButton>
          <a className="contact-link" href={dealership.instagram} target="_blank" rel="noreferrer"><Icon name="instagram" />Instagram</a>
          <a className="contact-link tiktok-link" href={dealership.tiktok} target="_blank" rel="noreferrer"><Icon name="tiktok" className="tiktok-icon" />TikTok</a>
          <a className="contact-link phone-link" href={`tel:${dealership.phone.replace(/\s/g, '')}`}><Icon name="phone" />{dealership.phone}</a>
          <a className="contact-link location-link" href={dealership.location} target="_blank" rel="noreferrer"><Icon name="location" />View Our Location</a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
