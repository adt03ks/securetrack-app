
/*
  SECURETRACK OP
  Unified footer navigation

  Owned and operated by OmniPresence Branding, LLC.
  SecureTrack is an assumed business name (DBA).

  Footer variants:
  login | hub | manager
*/

(function () {
  'use strict';

  const mount = document.getElementById('securetrack-footer');
  if (!mount) return;

  const allowedVariants = ['login', 'hub', 'manager'];

  const variant = allowedVariants.includes(mount.dataset.variant)
    ? mount.dataset.variant
    : 'login';

  const base = (window.SECURETRACK_SITE_BASE || '')
    .replace(/\/$/, '');

  const path = (slug) => base + '/' + slug;

  // Centralized destination paths.
  // Keep existing Privacy and Terms pages unchanged.

  const pages = {
    contact: 'contact.html',
    support: 'support.html',
    security: 'security.html',
    privacy: 'privacy.html',
    terms: 'terms.html'
  };

  // Navigation for each area of SecureTrack.

 
const links = {
  login: [
    ['Technical Support', pages.support],
    ['Security & Compliance', pages.security],
    ['Contact Us', pages.contact],
    ['Privacy Policy', pages.privacy],
    ['Terms of Use', pages.terms]
  ],

  hub: [
    ['Technical Support', pages.support],
    ['Security & Compliance', pages.security],
    ['Contact Us', pages.contact],
    ['Privacy Policy', pages.privacy],
    ['Terms of Use', pages.terms]
  ],

  manager: [
    ['Help & Support', pages.support],
    ['Security & Compliance', pages.security],
    ['Contact Us', pages.contact],
    ['Privacy Policy', pages.privacy],
    ['Terms of Use', pages.terms]
  ]
};


  const linkHtml = links[variant]
    .map(([label, slug]) =>
      `<a href="${path(slug)}">${label}</a>`
    )
    .join('');

  const compact = variant !== 'login';

  mount.innerHTML = `
    <footer
      class="st-footer ${compact ? 'st-footer--compact' : ''}"
      aria-label="SecureTrack site footer"
    >
      <div class="st-footer__inner">

        <div class="st-footer__top">

          <div class="st-footer__brand">
            <img
              src="${path('assets/favicon.png')}"
              alt="SecureTrack OP logo"
            >

            <div>
              <div class="st-footer__name">
                SECURETRACK OP
              </div>

              <div class="st-footer__tag">
                Track · Protect · Stay Secure
              </div>
            </div>
          </div>

          <nav
            class="st-footer__links"
            aria-label="Footer navigation"
          >
            ${linkHtml}
          </nav>

        </div>

        <hr class="st-footer__divider">

        <div class="st-footer__bottom">

          <div class="st-footer__legal">
            © <span class="st-footer__year"></span>
            OmniPresence Branding, LLC.
            SecureTrack is an assumed business name
            (DBA) of OmniPresence Branding, LLC.
            All rights reserved.
          </div>

          ${
            variant === 'manager'
              ? `<div class="st-footer__manager-note">
                   Authorized personnel only ·
                   Activity may be logged.
                 </div>`
              : variant === 'login'
                ? `<div class="st-footer__operator">
                     Operated by OmniPresence Branding, LLC.
                   </div>`
                : ''
          }

        </div>

      </div>
    </footer>
  `;

  const yearElement = mount.querySelector('.st-footer__year');

  if (yearElement) {
    yearElement.textContent =
      String(new Date().getFullYear());
  }

})();
