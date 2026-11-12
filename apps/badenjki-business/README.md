# Badenjki Business

The standalone Astro site for [badenjki.business](https://badenjki.business). Run these commands from this directory with Node 24.

```sh
npm ci
cp .env.example .env
npm run dev
```

Run `npm run check` for Astro diagnostics. For production, set `PUBLIC_BADENJKI_API_ORIGIN` to the Rails HTTPS origin at build time, run `npm run build`, and publish this project's `dist/` to the new domain. Serve the generated directory index for each route, including localized routes under `/ar` and `/en`.

Add `https://badenjki.business` to Rails `WEBSITE_ALLOWED_ORIGINS` before launch. Verify signup on the new domain before deploying the main site's link changes and permanent redirects. See the [signup and referral documentation](../../docs/badenjki-business-signup.md) for the API and campaign behavior.

The homepage, privacy policy and account deletion page are published in Arabic and English. Unprefixed URLs use the saved language choice, then the browser's preferred languages, with Arabic as the fallback. The header switch remembers a choice on this browser and preserves the current page, query and fragment. Explicit `/ar` and `/en` links open in their specified language.

The account deletion form at `/account-deletion` calls Rails `POST /website/account-deletion` over HTTPS. Deploy it with the matching Rails API and confirm the configured origin permits the website before updating Play Console. The production nginx config sends no-store, no-referrer and anti-framing headers for the form.

In Dokploy, select the `rabeh-sy/landing` GitHub repository and set the build path to `/apps/badenjki-business`. Use the Dockerfile build type with `./Dockerfile` and the repository-relative context `./apps/badenjki-business`. Production tracks `main` with Autodeploy set to On Push. Dokploy routes `badenjki.business` to container port 80 and provisions TLS with Let's Encrypt.
