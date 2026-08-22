// Header scroll state
const header = document.getElementById('site-header');
const backToTop = document.getElementById('back-to-top');

const onScroll = () => {
  const scrolled = window.scrollY > 40;
  header.classList.toggle('scrolled', scrolled);
  backToTop.classList.toggle('visible', window.scrollY > 600);
};
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('nav-open');
  navToggle.classList.toggle('active', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('nav-open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Reveal-on-scroll
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);
revealEls.forEach((el) => revealObserver.observe(el));

// Animated stat counters
const statEls = document.querySelectorAll('.hero-stats dt');
const animateStat = (el) => {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimal || '0', 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = value.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateStat(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);
statEls.forEach((el) => statObserver.observe(el));

// Contact form — sends to the contact-form Lambda via API Gateway
const CONTACT_ENDPOINT = 'https://kyl86hznz0.execute-api.us-west-2.amazonaws.com/';

const contactForm = document.getElementById('contact-form');

if (contactForm) {
  const formNote = document.getElementById('form-note');
  const contactSubmitBtn = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const program = document.getElementById('program').value;
    const message = document.getElementById('message').value.trim();

    const originalLabel = contactSubmitBtn.textContent;
    contactSubmitBtn.disabled = true;
    contactSubmitBtn.textContent = 'Sending…';
    formNote.textContent = '';

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, program, message }),
      });

      if (!res.ok) throw new Error('Request failed');

      formNote.textContent = `Thanks${name ? ', ' + name.split(' ')[0] : ''}! We'll get back to you within one business day.`;
      contactForm.reset();
    } catch (err) {
      formNote.textContent = 'Something went wrong sending that — please email us directly at fly@seattlesimcenter.com.';
    } finally {
      contactSubmitBtn.disabled = false;
      contactSubmitBtn.textContent = originalLabel;
    }
  });
}

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();
