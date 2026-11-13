# mangalyasutra.com V2 (visual redesign; rebranded from soulmates.com)

Static HTML/CSS/JS front end for mangalyasutra.com (Hindu / Kerala matrimony), redesigned in a Jeevansathi-style layout. Mobile first, Cabin font only, primary colour `#800020` (a deeper orange so white button text passes 4.5:1; the earlier `#F28C28` gave 2.45:1).

## Run
```bash
node "Soulmates Matrimony V2/dev-server.js"   # http://localhost:5174
```
**Needs `../api/index.js` and `../lib/` from the full project** (registered as `soulmates-v2` in `.claude/launch.json`). Those folders are not in the workspace right now, so a fresh start fails with `Cannot find module '../api/index.js'`. Restore them before running or deploying.

## Pages
- `index.html`: header + menu, photo-carousel hero (3 photos, fades every 6 s, prev/next arrows), "Why families choose" card, "two families" band, sample profiles (4 fictional cards with AI-generated portraits; replace with real, consented members later), steps, browse-by chips, safety band, FAQ, Contact Us (form), closing banner, footer menu columns, Register Free pop-up, back-to-top button.
- `terms.html`, `privacy.html`: same header/footer. `app.html`, `admin.html`: member app / admin, re-skinned by `app-v2.css`; signed-out visitors are sent to `index.html#register`.
- There is no login or register page. Every "Register Free" button opens the pop-up (name, +91 mobile, Male/Female, age 18-60, mother tongue, Kerala district). A number that is already registered gets a login code instead.

## Folder layout
```
*.html            pages (kept at root so URLs and redirects stay unchanged)
css/              tokens, v2 (public), app + app-v2 (member/admin)
js/               site, parallax, hero-carousel, profiles-scroll, contact, register, site-config, app, admin
images/hero/      carousel photos (+ -sm variants)
images/profiles/  sample profile portraits
images/sections/  family-art, contact-photo, closing-banner bg
images/brand/     logo
images/icons/     favicon-32/192, apple-touch-icon (favicon.ico stays at root)
images/source/    original images (not deployed)
dev-server.js     local server
```

## Files
- `css/v2.css`: all public styles, written mobile first (`min-width` queries at 480 / 640 / 860 / 1024). Buttons have no borders. `--on-rose` is white (text on orange).
- JS (in `js/`): `site.js` (menu, sticky phone CTA, back-to-top), `parallax.js` (subtle parallax and reveals; off under `prefers-reduced-motion`), `hero-carousel.js` (photo fade + prev/next arrows), `profiles-scroll.js` (auto-scrolling profile row), `contact.js`, `register.js`, `site-config.js`.
- Images (in `images/`): `hero/01-03.jpg` carousel, `family-art.jpg`, `profile-1..4.jpg` (AI-generated, fictional people), `contact-photo.jpg`, `hero-bg-sm.jpg` (closing banner), `logo-header.png`, favicon set (`favicon.ico`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`, cropped from `Images/favicon.png`). Originals are in `images/source/`.

## Backend changes made for V2 (in `../api`, `../lib`, `../supabase`)
- Registration accepts age instead of date of birth, mother tongue and district optional (`lib/validate.js`; `users.mother_tongue` and `users.district` made nullable).
- `POST /api/contact` plus a `contact_messages` table. Messages are stored only: nothing emails them and the admin page does not list them. Run the new `create table` and the `alter` statements in Supabase before going live.

## Known points
- Primary orange is `#800020` (white text 4.5:1). The brand orange `#F28C28` fails with white text (2.45:1), so it is only used if buttons go back to dark text.
- Registration shows a consent notice ("By registering you agree to...") instead of a checkbox.
- Legal text and FAQ are copied from V1 and are still drafts.
- Reduced-motion and the Supabase code paths were not tested.

- Rebrand (Nov 2026): name, logo and favicons are now mangalyasutra.com. The logo and favicon are placeholder wordmarks generated in Georgia Bold; replace `images/brand/logo-header.png` and `images/icons/*` when the client sends final artwork.
- New `philosophy.html` (Our Philosophy). The coupon box in the register pop-up is front end only: the value is not sent or validated until the backend supports it. The age list shows only legal ages (men 21+, women 18+) with no minimum-age error message. The contact subject list is now General Enquiry / Franchise Partnership Opportunity / Report an Issue (the backend may need to accept these values).
