# Consolidated project prompt

```text
/godmode

Build and maintain the existing Raaha Restaurant & Grill Madurai site. Preserve its React/Vite responsive design, menu, tabletop scenes, cart, table-enquiry flow, moderated reviews, guest profile and clearly labelled delivery-route simulation.

Architecture:
- React frontend -> Express REST API -> Supabase Postgres/Auth. Do not use a separate ORM unless explicitly requested.
- The intended Supabase project reference is jrfmgqccicrpdtqztrpt. The project-scoped, read-only Supabase MCP configuration is optional and requires independent authentication; it does not deploy migrations or make the app live.
- Host frontend, backend and database artifacts separately. Provide source hosting packages, examples, environment templates and complete setup/deployment/operations instructions. Keep provider and database secrets server-side and out of chat and source control.

Requirements:
1. Store real catalog, guest profile, order-request, reservation-request and moderated-review data with validation, row-level security, appropriate rate limits and idempotent retry handling. Price order items from the database, not from a browser-provided total. Retain safe offline/sample-menu behavior when services are not configured.
2. Support email/password signup, sign-in and email confirmation with Supabase Auth. Store account emails securely in Auth; snapshot the confirmed email on an order. Explain that an anonymous guest identity is not automatically transferred to a new email account.
3. At checkout, let the customer choose Razorpay or pay later. Save the request before opening payment, and keep it pending restaurant review regardless of payment. Razorpay charges the item subtotal only; taxes, delivery availability and additional charges require restaurant confirmation.
4. Create Razorpay orders on the server. Verify checkout HMAC against the server-stored gateway order, verify signed raw webhooks, independently fetch and validate captured payment status, amount, currency and order ID, and make capture handling idempotent. Do not mark authorized, failed or unverified payments as paid. Provide safe retry/reconciliation after interruptions. Restrict direct browser access so payment and notification bookkeeping cannot be bypassed.
5. Queue an acknowledgement to the customer's confirmed email and an order notification to sultham456@gmail.com. Attempt payment notices after verified capture. Acknowledge requests without claiming restaurant acceptance; use a separately configured SMTP provider, durable retryable jobs and monitoring. Do not claim that queueing guarantees delivery or that the Arena Gmail connection is a runtime mail provider.
6. If a paid request is rejected, the restaurant must handle the refund. Unless implemented and tested explicitly, describe refunds and refund-status reconciliation as manual; do not claim automatic refunds, refund webhooks or refund emails.
7. Keep table inquiries pending until staff review and do not claim automatic booking confirmation. Keep the courier route/marker visibly a simulation, not a live delivery status. Use restricted staff access and moderate reviews before publication.
8. Provide separate frontend, Express backend and Supabase database hosting files/packages, including their public vs secret configuration, CORS/reverse proxy setup, Auth verification and redirect setup, CAPTCHA, Razorpay test-mode webhook, SMTP, staging checks, monitoring, refund procedure, privacy, backups and safe migration instructions. Do not use localhost as a browser-facing API address in a hosted preview.
9. Verify the real restaurant's menu, prices, business details and deployment configuration before accepting live traffic. Run type checks, build, embedded-database/RLS tests, mocked API/payment/email tests, responsive/browser/accessibility tests, and real staging integration checks. State clearly which checks are mocked and any missing live credentials or connections. Never initiate live charges or send test emails without authorization.
```
