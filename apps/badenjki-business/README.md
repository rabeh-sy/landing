# Badenjki Business

The standalone Astro site for [badenjki.business](https://badenjki.business). Run these commands from this directory with Node 24.

```sh
npm ci
cp .env.example .env
npm run dev
```

Run `npm run check` for Astro diagnostics and `npm run build` to inspect the generated pages locally. Deploy with the Dockerfile below and set `PUBLIC_BADENJKI_API_ORIGIN` to the Rails HTTPS origin at build time. The Docker build moves the pricing files out of the public document root so Nginx can enforce access.

Add `https://badenjki.business` to Rails `WEBSITE_ALLOWED_ORIGINS` before launch. Verify signup on the new domain before deploying the main site's link changes and permanent redirects. See the [signup and referral documentation](../../docs/badenjki-business-signup.md) for the API and campaign behavior.

The homepage, privacy policy and account deletion page are published in Arabic and English. Unprefixed URLs use the saved language choice, then the browser's preferred languages, with Arabic as the fallback. The header switch remembers a choice on this browser and preserves the current page, query and fragment. Explicit `/ar` and `/en` links open in their specified language.

Edit [privacy-policy.json](src/content/privacy-policy.json) and [terms.json](src/content/terms.json) for both languages. Update the ISO revision and localized dates for the document you change. Astro renders the public pages and serves the same documents at `/legal.json`. The legacy `/privacy-policy.json` endpoint still serves the privacy policy.

The account deletion form at `/account-deletion` calls Rails `POST /website/account-deletion` over HTTPS. Deploy it with the matching Rails API and confirm the configured origin permits the website before updating Play Console. The production nginx config sends no-store, no-referrer and anti-framing headers for the form.

In Dokploy, select the `rabeh-sy/landing` GitHub repository and set the build path to `/apps/badenjki-business`. Use the Dockerfile build type with `./Dockerfile` and the repository-relative context `./apps/badenjki-business`. Production tracks `main` with Autodeploy set to On Push. Dokploy routes `badenjki.business` to container port 80 and provisions TLS with Let's Encrypt.

## Syria-only pricing preview

`/pricing`, `/ar/pricing`, and `/en/pricing` use the same access check. The header displays the localized Pricing link after a successful `HEAD` request to the localized page. Without the Cloudflare configuration below, production pricing requests return `404`.

1. Generate an origin token with `openssl rand -hex 32`. Set it as the runtime environment variable `BADENJKI_PRICING_ORIGIN_TOKEN` in Dokploy.
2. In Cloudflare, add two [Request Header Transform Rules](https://developers.cloudflare.com/rules/transform/request-header-modification/) in this order. First, remove `X-Badenjki-Pricing-Access` from all requests to `badenjki.business`. Then set that header to the same token using **Set static** for requests matching this expression.

   ```text
   (http.host eq "badenjki.business" and ip.src.country eq "SY" and (
     http.request.uri.path in {"/pricing" "/ar/pricing" "/en/pricing"}
     or starts_with(http.request.uri.path, "/pricing/")
     or starts_with(http.request.uri.path, "/ar/pricing/")
     or starts_with(http.request.uri.path, "/en/pricing/")
   ))
   ```

3. Add a Cloudflare Cache Rule with **Bypass cache** using the same expression with `ip.src.country eq "SY" and` removed. Keep the token in the Dokploy and Cloudflare settings.
4. Check from a Syrian connection that Pricing appears in the header and opens the blank page. Check from another country that the link is hidden and direct requests return `404`, including `/en/pricing/index.html`. Allowed responses include `X-Robots-Tag: noindex` and `Cache-Control: private, no-store`.
