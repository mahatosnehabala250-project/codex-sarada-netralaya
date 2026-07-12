import { useState } from "react";
import OwnerPortal from "./OwnerPortal";

const API_URL = import.meta.env.VITE_API_URL || "";

const services = [
  ["◉", "Cataract Care", "Advanced, comfortable cataract solutions designed around your eyes."],
  ["◌", "Glaucoma Care", "Early evaluation and long-term management to safeguard sight."],
  ["◈", "Retina Care", "Detailed retina evaluation with modern imaging and treatment."],
  ["⌁", "Children's Eye Care", "Gentle care for growing eyes, squint, and visual development."],
  ["◍", "Oculoplasty", "Specialised care for eyelids, tear ducts, and the eye area."],
  ["⊹", "Optical Studio", "Frames, lenses, and precise testing for every lifestyle."],
];

const facilities = [
  "Optical Biometry", "Premium Cataract Surgery", "Optical Coherence Tomography (OCT)",
  "Humphrey Visual Field (HVF)", "Latest Phaco Technology", "Laser Treatment Facility",
];

const carePromises = [
  ["01", "One trusted centre", "Diagnosis, treatment, surgery, and optical care in one familiar place."],
  ["02", "A calmer visit", "Clear explanations, thoughtful guidance, and care tailored to every age."],
  ["03", "Safety-led decisions", "Ethical recommendations supported by modern diagnostics and proven techniques."],
  ["04", "Care that continues", "We help you understand next steps, follow-up, and everyday eye health."],
];

const faqs = [
  ["How should I prepare for my first appointment?", "Please bring your current spectacles, any previous eye reports, and a list of medicines you use. Our team will guide you once your appointment is confirmed."],
  ["Do you treat children and senior citizens?", "Yes. We offer dedicated eye care for children, adults, and senior citizens, with consultations adapted to each patient's needs."],
  ["Can I visit for eyeglasses or contact lenses?", "Yes. Choose Optical while booking for computerized eye testing, prescription glasses, premium frames, contact lenses, and children's frames."],
  ["What if I have a sudden eye problem?", "For sudden vision loss, eye injury, chemical exposure, or severe pain, call the hospital immediately for urgent guidance."],
];

const initialForm = {
  patientName: "", mobile: "", age: "", department: "Eye Care", date: "", timeSlot: "", reason: "",
};

function Icon({ name }) {
  const paths = {
    phone: <path d="M21 15.5v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.64-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 2.75 2 2 0 0 1 3.1.57h3a2 2 0 0 1 2 1.72c.13.98.37 1.94.72 2.86a2 2 0 0 1-.45 2.11L7.1 8.53a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.92.35 1.88.59 2.86.72a2 2 0 0 1 1.66 2Z" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function SectionHeading({ eyebrow, title, copy, align = "left" }) {
  return <div className={`section-heading ${align === "center" ? "centered" : ""}`}>
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <h2>{title}</h2>
    {copy && <p>{copy}</p>}
  </div>;
}

export default function App() {
  if (window.location.pathname === "/owner") return <OwnerPortal />;
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function submitAppointment(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not complete your booking.");
      setReference(data.reference);
      setForm(initialForm);
    } catch (error) {
      setMessage(error.message || "Please try again or call us directly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="container utility"><span>Jamshedpur's trusted eye care centre</span><a href="tel:+917091090014"><Icon name="phone" /> +91 70910 90014</a></div>
      </header>
      <nav className="nav container" aria-label="Main navigation">
        <a className="brand" href="#home" aria-label="Sarada Netralaya home"><span className="brand-mark">S</span><span><strong>Sarada</strong><em>NETRALAYA</em></span></a>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a onClick={() => setMenuOpen(false)} href="#about">About us</a>
          <a onClick={() => setMenuOpen(false)} href="#services">Services</a>
          <a onClick={() => setMenuOpen(false)} href="#facilities">Facilities</a>
          <a onClick={() => setMenuOpen(false)} href="#faq">Patient guide</a>
          <a onClick={() => setMenuOpen(false)} href="#contact">Contact</a>
          <a onClick={() => setMenuOpen(false)} className="nav-cta" href="#appointment">Book appointment <Icon name="arrow" /></a>
        </div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Icon name={menuOpen ? "close" : "menu"} /></button>
      </nav>

      <main>
        <section id="home" className="hero">
          <img src="/eye-exam-hero.png" alt="An eye specialist carrying out a detailed eye examination" />
          <div className="hero-overlay" />
          <div className="container hero-content">
            <div className="rating"><span>★</span> 4.9 Google rating <i /> 329+ patient reviews</div>
            <p className="hero-kicker">Passion for Excellence <b>•</b> Committed to Care</p>
            <h1>See life <i>clearly.</i></h1>
            <p className="hero-copy">Exceptional eye care, shaped around you. For more than 30 years, Sarada Netralaya has paired leading technology with genuine compassion.</p>
            <div className="hero-actions"><a className="button primary" href="#appointment">Book an appointment <Icon name="arrow" /></a><a className="text-link" href="#services">Explore our care <Icon name="arrow" /></a></div>
          </div>
          <div className="hero-note"><span>30+</span><p>Years of<br />clearer vision</p></div>
        </section>

        <section className="trust-strip container"><p>Trusted eye care. <strong>For every generation.</strong></p><div><span>Accurate diagnosis</span><span>Ethical treatment</span><span>Advanced technology</span></div></section>

        <section className="care-path container" aria-label="Your visit, made simple"><div><span className="eyebrow">A simple, reassuring experience</span><h2>From first question to <i>clear next steps.</i></h2></div><div className="path-steps"><article><b>1</b><span>Book your visit</span><p>Choose a date and time that works for you.</p></article><article><b>2</b><span>Receive confirmation</span><p>Our team will contact you to confirm your appointment.</p></article><article><b>3</b><span>See clearly ahead</span><p>Get a personalised plan from our eye-care team.</p></article></div></section>

        <section id="about" className="intro container">
          <div className="intro-visual"><div className="eye-orbit"><span /></div><div className="orbit-note">Precision in every<br /><em>detail.</em></div></div>
          <div className="intro-copy"><span className="eyebrow">Welcome to Sarada Netralaya</span><h2>Care that sees <i>you</i> first.</h2><p>Every patient deserves clear vision through accurate diagnosis, ethical treatment, and modern eye care. Our experienced specialists bring together advanced ophthalmic technology and a deeply personal approach.</p><p>From a child's first eye check to complex surgical care, our team is here to make every visit feel clear, considered, and reassuring.</p><a href="#appointment" className="text-link teal">Meet our team <Icon name="arrow" /></a></div>
        </section>

        <section id="services" className="services-section"><div className="container"><SectionHeading eyebrow="Our services" title={<>Complete eye care, <i>beautifully considered.</i></>} copy="Thoughtful care for every stage of life, all under one roof." /><div className="service-grid">{services.map(([icon, name, description], index) => <article className="service-card" key={name}><span className="service-number">0{index + 1}</span><div className="service-icon">{icon}</div><h3>{name}</h3><p>{description}</p><a href="#appointment" aria-label={`Book ${name}`}>Learn more <Icon name="arrow" /></a></article>)}</div></div></section>

        <section id="facilities" className="facility container"><div className="facility-content"><span className="eyebrow">Advanced technology</span><h2>Clarity starts with <i>precision.</i></h2><p>Our diagnostic and surgical facilities help us understand your eyes in remarkable detail, and provide the safest, most effective care possible.</p><div className="facility-list">{facilities.map(item => <span key={item}><Icon name="check" />{item}</span>)}</div><a href="#appointment" className="button dark">Talk to our eye specialist <Icon name="arrow" /></a></div><div className="facility-art"><div className="scan-circle"><span /><span /><b>OCT<br /><small>IMAGING</small></b></div><div className="art-label">Advanced<br /><em>ophthalmology</em></div></div></section>

        <section className="promise-section"><div className="container"><SectionHeading eyebrow="The Sarada difference" title={<>The expertise you need.<br /><i>The kindness you remember.</i></>} copy="Quality eye care is about much more than technology. It is about listening carefully, explaining clearly, and doing what is right for every patient." /><div className="promise-grid">{carePromises.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

        <section className="doctor-section"><div className="container doctor-card"><div className="doctor-portrait"><div className="doctor-silhouette">◒</div><span>Consultant<br />Eye Surgeon</span></div><div className="doctor-copy"><span className="eyebrow">Expert care, personal attention</span><h2>Dr. Nitin G. Dhira</h2><p className="doctor-role">Consultant Eye Surgeon</p><p>With extensive training and a patient-first philosophy, Dr. Dhira is committed to making exceptional eye care feel accessible and reassuring.</p><div className="qualifications"><span>DOMS</span><span>DNB</span><span>FICO (U.K.)</span><span>Trained at L.V. Prasad Eye Institute, Hyderabad</span></div><a href="#appointment" className="text-link teal">Book a consultation <Icon name="arrow" /></a></div></div></section>

        <section id="appointment" className="booking-section"><div className="container booking-layout"><div className="booking-copy"><span className="eyebrow">Appointments</span><h2>Your clearer tomorrow starts <i>today.</i></h2><p>Book your visit in a few simple steps. Our team will be ready to welcome you.</p><div className="booking-contact"><span><Icon name="phone" /> Prefer to call? <a href="tel:+917091090014">+91 70910 90014</a></span><span><Icon name="calendar" /> Monday–Saturday, 10:00 AM–7:30 PM</span></div></div><form className="booking-form" onSubmit={submitAppointment}><h3>Book an appointment</h3><div className="form-grid"><label>Patient name<input required value={form.patientName} onChange={e => update("patientName", e.target.value)} placeholder="Your full name" /></label><label>Mobile number<input required type="tel" pattern="[0-9+ ]{10,15}" value={form.mobile} onChange={e => update("mobile", e.target.value)} placeholder="+91" /></label><label>Age<input required min="0" max="120" type="number" value={form.age} onChange={e => update("age", e.target.value)} placeholder="Age" /></label><label>Department<select value={form.department} onChange={e => update("department", e.target.value)}><option>Eye Care</option><option>Optical</option></select></label><label>Preferred date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={e => update("date", e.target.value)} /></label><label>Preferred time<select required value={form.timeSlot} onChange={e => update("timeSlot", e.target.value)}><option value="">Select a time</option><option>10:00 AM – 12:00 PM</option><option>12:00 PM – 2:00 PM</option><option>2:00 PM – 4:00 PM</option><option>4:00 PM – 6:00 PM</option><option>6:00 PM – 7:30 PM</option></select></label></div><label>Reason for visit <small>(optional)</small><textarea rows="2" value={form.reason} onChange={e => update("reason", e.target.value)} placeholder="Tell us how we can help" /></label><button className="button primary form-submit" disabled={busy}>{busy ? "Booking your visit..." : "Confirm appointment"}<Icon name="arrow" /></button>{message && <p className="form-message">{message}</p>}</form></div></section>

        <section id="faq" className="faq-section container"><div className="faq-intro"><span className="eyebrow">Patient guide</span><h2>Small questions.<br /><i>Clear answers.</i></h2><p>Everything you need to feel confident before your visit.</p><div className="urgent-note"><strong>For urgent eye concerns</strong><p>Sudden vision loss, injury, chemical exposure, or severe eye pain? Please call us immediately.</p><a href="tel:+917091090014">+91 70910 90014 <Icon name="arrow" /></a></div></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

        <section id="contact" className="contact-section container"><div><span className="eyebrow">Visit us</span><h2>We are here when<br />you need <i>us.</i></h2><div className="contact-info"><p><Icon name="pin" /><span>Swastik Ambika Tower, H.No. 33<br />Near HDFC Bank, Kashidih New Layout Area<br />New Baradwari, Sakchi, Jamshedpur – 831001</span></p><p><Icon name="phone" /><span><a href="tel:+917091090014">+91 70910 90014</a><br /><a href="tel:+917091090016">+91 70910 90016</a></span></p></div></div><a className="map-card" href="https://www.google.com/maps/search/?api=1&query=Swastik+Ambika+Tower+Near+HDFC+Bank+Kashidih+New+Layout+Area+Jamshedpur+831001" target="_blank" rel="noreferrer"><div className="map-grid"><span className="map-pin"><Icon name="pin" /></span></div><span>Get directions <Icon name="arrow" /></span></a></section>
      </main>
      <footer><div className="container footer-content"><a className="brand footer-brand" href="#home"><span className="brand-mark">S</span><span><strong>Sarada</strong><em>NETRALAYA</em></span></a><p>Passion for Excellence <b>•</b> Committed to Care</p><small><a href="/owner">Owner login</a> · © {new Date().getFullYear()} Sarada Netralaya. All rights reserved.</small></div></footer>
      <div className="quick-book" aria-label="Quick contact">
        <a href="tel:+917091090014">Call now</a>
        <a href="#appointment">Book appointment</a>
        <a href="https://www.google.com/maps/search/?api=1&query=Swastik+Ambika+Tower+Near+HDFC+Bank+Kashidih+New+Layout+Area+Jamshedpur+831001" target="_blank" rel="noreferrer">Directions</a>
      </div>
      {reference && <div className="confirmation" role="dialog" aria-modal="true"><div><button aria-label="Close confirmation" onClick={() => setReference("")}><Icon name="close" /></button><span className="confirmation-mark"><Icon name="check" /></span><h2>Your appointment is requested.</h2><p>Thank you. Our team will contact you shortly to confirm your preferred time.</p><strong>Reference: {reference}</strong><a className="button primary" href="tel:+917091090014">Call us for assistance <Icon name="phone" /></a></div></div>}
    </div>
  );
}
