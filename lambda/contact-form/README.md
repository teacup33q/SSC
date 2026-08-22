# Contact Form Lambda

Receives the landing page's contact form submission (via API Gateway) and
sends it as an email to `fly@seattlesimcenter.com` through Amazon SES,
with Reply-To set to the visitor's email address.

Uses the AWS SDK v3 (`@aws-sdk/client-sesv2`), which ships built-in with
the Node.js Lambda runtime — no dependency bundling required, just zip
and deploy `index.mjs` as-is.

Requires:
- `fly@seattlesimcenter.com` verified as an SES identity in the same
  AWS region the function is deployed to.
- An execution role with `ses:SendEmail` permission plus the standard
  Lambda basic execution policy (CloudWatch Logs).
- An API Gateway HTTP API route (`POST /contact`) with CORS enabled for
  `https://www.seattlesimcenter.com` (and `https://seattlesimcenter.com`),
  proxying to this function.

Deployment steps live in the project setup notes — this file just
documents what the function does and what it needs to run.
