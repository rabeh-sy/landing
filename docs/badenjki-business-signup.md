# Badenjki Business website signup

The Astro site stays static. All visible iOS, Android and Windows download actions use the signup gate. Visitors can browse freely. After Rails confirms signup, the chosen allowlisted destination opens in a new tab and remains available through the Continue button.

## Configuration and deployment

Build with `PUBLIC_BADENJKI_API_ORIGIN` set to the Rails HTTPS origin. The API owns the direct source through `WEBSITE_DIRECT_SOURCE_CODE` and `bin/rails website:provision_direct_source`; no public direct-source value is needed in the website build. Rails `WEBSITE_ALLOWED_ORIGINS` must include this website's exact HTTPS origin. The browser uses `X-Website-Session` with an opaque 256-bit token and `credentials: omit`, so third-party cookie availability does not affect this flow. Keep URLs, analytics and access logs free of phone numbers and credentials. The token is sent only as a header.

Deploy the two Rails attribution migrations and API before this website. Admin generates `<configured-public-website-origin>/badenjki-business?ref=<CODE>` for links and QR payloads; the configured origin includes `https://`. Confirm the deployed host serves `/badenjki-business/index.html` at `/badenjki-business`. The site captures `ref` through the Rails visitor session before removing only that parameter from the address bar. It retains retryable codes in local storage during temporary API failures. The first active valid source in a 30-day visitor window is retained while browsing other pages. Direct browsing does not reserve the source slot. Expired or disabled campaigns fall back to Website — direct if configured. The API's source is authoritative after signup.

## Session and funnel behavior

The browser asks `GET /website/session` before allowing a download. Its local token is a transport credential, never proof of completion on its own. Rails keeps the completed gate for 12 hours. The selected platform is remembered in the tab. A signup attempt ID is shared across tabs and sent with `POST /website/signups`; repeating a committed attempt returns its accepted result without another OTP. If the response is lost, the site recovers through session status. The API stores campaign landing and download intent events and deduplicates retries by event ID. An intent click does not prove an actual download or installation. Analytics failures do not prevent navigation.

Website OTP and app OTP have separate purposes. Syria's temporary OTP disablement remains backend policy. An issued website decision token stays usable until expiry, while app bootstrap checks policy again. Website signup creates no account or license. The app continues its existing bootstrap, and backend conversion means a successful new-customer bootstrap only.

The popup shows country names and a fixed dialing prefix, defaulting to Syria. Visitors enter a local number, or paste a matching international number. It accepts Arabic-Indic and Persian digits, spaces and hyphens. Syrian input accepts nine national digits, an optional leading zero, `+963`, or `00963`; after normalization exactly nine national digits are required. Conflicting international prefixes and extra digits are rejected inline. Other supported countries retain their backend normalization rules; the backend remains authoritative for validation and OTP policy.

The 30-day visitor source window, 14-day pending signup match window, and 12-hour completed website gate serve different purposes. A returning visitor may keep the original eligible source after pending expiry; a new accepted signup then creates a fresh 14-day pending record. Historical legacy submission and source/IP click counters are shown separately in admin.

See the shared API and deployment contract in RabehLiteApp/docs/03-backend/api/website-onboarding-attribution.md for endpoints, metrics, rollout order and acceptance checklist.

## Manual acceptance checklist

- Inspect the popup on narrow mobile and desktop browsers in RTL: country names, fixed LTR prefix, labels, focus, errors, and visible download controls.
- Enter Syrian nine digits, local leading zero, `+963`, `00963`, Arabic-Indic/Persian digits, separators, extra digits and a conflicting country prefix. Try another supported country.
- Exercise backend OTP required and disabled responses, including Syria's temporary policy; change country or phone while a challenge is pending and confirm stale responses do not advance the form.
- Open a canonical `?ref=<CODE>` URL with another query parameter and fragment; confirm capture, cleaned URL, first-valid precedence, browsing persistence, disabled/invalid codes and retry after an API failure.
- Open a copied/printed QR destination on the deployed host. Confirm one landing event per landing and the chosen download destination after signup, including the explicit Continue button when automatic opening is blocked.

TODO verify: configured public origin, deployed static page routing, browser popup behavior, live CORS and OTP flows, and QR print output. No deployment, live OTP or validation command was run for this change.
