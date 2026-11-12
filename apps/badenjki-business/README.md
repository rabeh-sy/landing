# Badenjki Business

The standalone Astro site for [badenjki.business](https://badenjki.business). Run these commands from this directory with Node 24.

```sh
npm ci
cp .env.example .env
npm run dev
```

Run `npm run check` for Astro diagnostics. For production, set `PUBLIC_BADENJKI_API_ORIGIN` to the Rails HTTPS origin at build time, run `npm run build`, and publish this project's `dist/` to the new domain. Configure the host to serve `privacy/index.html` at `/privacy`.

Add `https://badenjki.business` to Rails `WEBSITE_ALLOWED_ORIGINS` before launch. Verify signup on the new domain before deploying the main site's link changes and permanent redirects. See the [signup and referral documentation](../../docs/badenjki-business-signup.md) for the API and campaign behavior.

In Dokploy, select the GitHub provider and set the build path to `/apps/badenjki-business`. Use the Dockerfile build type with `./Dockerfile` and context `.`. Enable Autodeploy on the selected branch. Dokploy routes `badenjki.business` to container port 80.
