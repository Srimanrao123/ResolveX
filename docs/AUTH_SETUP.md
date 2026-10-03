# Email OTP setup — Supabase Auth + Resend

ReturnGuard uses **Resend** to deliver its own email OTPs. The Next.js backend verifies them against short-lived Supabase database records and creates a secure ReturnGuard session cookie. Supabase Auth is not used.

## 1. Create Supabase project settings

Copy the Project URL, publishable key, and **service role key** into `.env` using `.env.example`. Also create a long random `AUTH_SECRET`.

## 2. Configure Resend

1. Add and verify a sending domain in Resend.
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env`. The sender must be a verified Resend domain.
3. Run [`002_custom_resend_auth.sql`](../supabase/migrations/002_custom_resend_auth.sql) in Supabase SQL Editor.

The browser application never reads `RESEND_API_KEY`; Resend is configured only in Supabase’s server-side SMTP settings.

## 3. Test

1. Run `npm run dev`.
2. Visit `/login`, enter a real email, then submit the code from the email.
3. Confirm you are redirected to `/seller` only when signing in as `srimanrao0707@gmail.com`; other email addresses go to `/orders`.

## Security notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, or `RESEND_API_KEY` to the browser.
- Use a verified domain in production; do not ship Resend’s test sender.
- Rate limiting is enforced as one code request per minute; add CAPTCHA before public production use.
- The only seller email is enforced in the verification database function and server routes.
