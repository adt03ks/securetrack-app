/* Place <div id="securetrack-footer" data-variant="login|hub|manager"></div> on each page. */
(function(){
  'use strict';
  const mount=document.getElementById('securetrack-footer');
  if(!mount)return;
  const variant=['login','hub','manager'].includes(mount.dataset.variant)?mount.dataset.variant:'login';
  // Set to your deployment root. "" works for https://securetrackop.com/. 
  // For GitHub project pages, use "/YOUR_REPOSITORY_NAME".
  const base=(window.SECURETRACK_SITE_BASE||'').replace(/\/$/,'');
  const path=(slug)=>base+'/'+slug;
  const links={
    login:[['Contact Us','contact.html'],['Help & Support','support.html'],['Privacy Policy','privacy.html'],['Terms of Service','terms.html'],['Security','security.html'],['Accessibility','accessibility.html']],
    hub:[['Help & Support','support.html'],['Privacy','privacy.html'],['Terms','terms.html'],['Security','security.html']],
    manager:[['Technical Support','support.html'],['Report a Security Concern','security.html'],['Privacy','privacy.html'],['Terms','terms.html']]
  };
  const linkHtml=links[variant].map(([label,slug])=>`<a href="${path(slug)}">${label}</a>`).join('');
  const compact=variant!=='login';
  mount.innerHTML=`<footer class="st-footer ${compact?'st-footer--compact':''}" aria-label="SecureTrack site footer">
    <div class="st-footer__inner">
      <div class="st-footer__top">
        <div class="st-footer__brand">
          <img src="${path('assets/favicon.png')}" alt="SecureTrack logo">
          <div><div class="st-footer__name">SECURETRACK OP</div><div class="st-footer__tag">Track · Protect · Stay Secure</div></div>
        </div>
        <nav class="st-footer__links" aria-label="Footer navigation">${linkHtml}</nav>
      </div>
      <hr class="st-footer__divider">
      <div class="st-footer__bottom">
        <div class="st-footer__legal">© <span class="st-footer__year"></span> OmniPresence Branding, LLC. SecureTrack is an assumed business name (DBA) of OmniPresence Branding, LLC. All rights reserved.</div>
        ${variant==='manager'?'<div class="st-footer__manager-note">Authorized personnel only · Activity may be logged.</div>':variant==='login'?'<div class="st-footer__operator">Operated by OmniPresence Branding, LLC.</div>':''}
      </div>
    </div>
  </footer>`;
  mount.querySelector('.st-footer__year').textContent=String(new Date().getFullYear());
})();
