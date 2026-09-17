# Yara Pay website

A responsive public introduction website based on the September 2026 partner deck and the existing Yara Pay product identity. Uses the existing logo, a navy/green palette, and a clearly labelled illustrative app preview.

## Run locally

Requires Node.js 22 or later. There are no third-party dependencies and no install or build step.

```sh
npm start
```

Open http://localhost:4173. The server uses Railway's PORT variable when supplied and binds to 0.0.0.0. `/health` returns a healthcheck response.

## Deploy on Railway

1. Put the contents of this folder in a GitHub repository, or a dedicated folder of your existing repository.
2. Create a **new website service** in Railway and connect that repository. For a subfolder, set the service's root directory to that folder.
3. Railway can build the supplied Dockerfile. The included railway.json sets the healthcheck. No database is required. Add the Zoho variables below to enable enquiry delivery.
4. Generate a Railway domain and check the site before connecting the public domain.
5. Keep the existing app/API/database services separate from this marketing website.

This package is prepared for deployment but has not been published or connected to your accounts.

## The $5 plan

If your subscription is Railway Hobby, yes: it can host this website. The $5 monthly fee includes $5 of resource usage; usage above that is billed additionally. This is a workspace allowance, not an extra $5 per service. Existing app/API/database usage reduces the allowance available to this site. A small static website should be inexpensive, but $5 cannot be guaranteed without checking the workspace's actual usage and traffic. Taxes and domain renewal are separate.

References checked September 17, 2026:
- https://docs.railway.com/pricing/plans
- https://docs.railway.com/pricing/understanding-your-bill

## Connect the GoDaddy domain

The deck lists www.yarapayments.com. Confirm that this is the intended domain before changing DNS.

Keep your domain registered with GoDaddy. Add `www.yarapayments.com` as a Railway custom domain, then copy Railway's exact CNAME and verification TXT records into GoDaddy DNS. Railway provisions HTTPS after verification.

For the bare domain `yarapayments.com`, GoDaddy does not support the root CNAME flattening Railway requires. Either forward the bare domain to the HTTPS www address using GoDaddy, or move DNS to Cloudflare while retaining GoDaddy as registrar. If moving DNS, preserve all existing mail and verification records. Do not replace mail records or existing app/API subdomains.

Reference: https://docs.railway.com/networking/domains/working-with-domains

## Editing the website

- `public/index.html`: site copy, navigation, services, FAQ and contact details.
- `public/styles.css`: colours, layout and mobile breakpoints.
- `public/app.js`: mobile menu, keyboard-accessible partner tabs and email draft preparation.
- `public/assets/yara-logo.jpeg`: original logo from the existing prototype.
- `server.mjs`: dependency-free production static file server with content security headers.

## Contact form and Zoho Mail

The form posts to `/api/contact`. The server sends to samrat@transfersmooth.com with the exact subject **Website enquiries**. The address is not included in public HTML or JavaScript. The visitor's details and message appear in a plain-text email. The button reads **Let’s talk**. Success is shown only after Zoho accepts the message; errors preserve the visitor's input. Inbox arrival has not been verified.

Railway Hobby blocks SMTP, so this uses Zoho Mail's HTTPS API. It does not require an SMTP upgrade or another email provider. API access must be available on your Zoho account.

### One-time connection

Use Zoho's OAuth setup to authorize `ZohoMail.messages.CREATE`. Obtain a refresh token and the sending mailbox account ID; account discovery uses `ZohoMail.accounts.READ`. Configure the following privately under the Railway service's Variables:

- `SITE_ORIGIN`: the exact public website origin, without a trailing slash.
- `ZOHO_REGION`: your account's region (`com`, `eu`, `in`, `com.au`, `jp`, `ca`, or `sa`). Confirm against your Zoho account.
- `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`: OAuth credentials.
- `ZOHO_ACCOUNT_ID`: the sending mailbox's numeric account ID.
- `ZOHO_FROM_ADDRESS`: the authorized sending address, normally samrat@transfersmooth.com.

The server refreshes access tokens automatically. Never put tokens in `public/` or paste them into chat. `.env.example` contains names only. Local configuration can be loaded using `node --env-file=.env server.mjs`; set `SITE_ORIGIN=http://localhost:4173` for that preview. Without credentials, the form returns an honest unavailable message and sends nothing.

References:
- https://www.zoho.com/mail/help/api/using-oauth-2.html
- https://www.zoho.com/mail/help/api/post-send-an-email.html
- https://docs.railway.com/networking/outbound-networking

### Validation

`node --test tests/contact.test.mjs` checks input rejection, origin checks, burst limiting, unavailable/error states, and mocked Zoho delivery including the fixed subject and recipient. Tests do not send emails.

The form includes a honeypot, a body-size limit, and a per-process ceiling of 30 attempts per ten minutes. This lightweight limiter resets on restart and is not shared between replicas. No enquiry content is stored or logged by the site; emails are retained in Zoho. Hosting request logs may still apply.

## Jaywan artwork

The card mockup uses the official logo asset from Al Etihad Payments: https://aep.ae/media/peyb44um/image-4.png (source page: https://aep.ae/en/services/about-jaywan/). This remains an illustrative card concept.

## Content assumptions to review before launch

- Services are described as planned and subject to approvals and partners. No app store, sign-up or transaction link implies a live financial service.
- The CBUAE application date and status are taken from the supplied September 2026 deck; confirm they remain current before publishing.
- The deck contains conflicting team role titles and biographies. The first version omits team biographies pending clarification.
- Market-size estimates, claimed compliance assessments, investment returns and the confidential deck itself are not published.
- The app preview is illustrative, not a screenshot of the live product. It is labelled accordingly.
- The recipient was confirmed by the user. Confirm the domain before connecting DNS.
- The eight-language description is supplied by the user.
