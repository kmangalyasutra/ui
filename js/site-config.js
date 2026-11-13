/* mangalyasutra.com: client-editable settings. No secrets here (this file is public).
   Leave a value empty to keep that feature hidden / in demo mode. */
window.SITE_CONFIG = {
  // Registration API (BRD FR-17). Empty = demo mode: the form validates and shows
  // the success message, but nothing is sent or stored. Now points at the real API.
  apiEndpoint: "/api/register",
  // Version label stored with each consent record (BRD data requirements).
  policyVersion: "",

  // Links (BRD FR-05, FR-06). "#" = placeholder until real pages exist.
  loginUrl: "/#register",
  termsUrl: "/terms",
  privacyUrl: "/privacy",
  contactUrl: "contact.html",

  // Support block under the form (BRD FR-22). Shown only if a phone or WhatsApp is set.
  supportPhone: "",      // e.g. "+91XXXXXXXXXX"
  supportWhatsApp: "",   // digits with country code, e.g. "91XXXXXXXXXX"
  supportHours: ""       // e.g. "Mon-Sat, 9 am to 6 pm"
};
