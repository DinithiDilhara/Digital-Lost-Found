# Digital-Lost-Found
Real-time campus Lost &amp; Found system for EC5205 Operating Systems &amp; Network Programming

## Local database configuration

Copy `.env.example` to `.env` in the repository root and replace the
placeholders with your local MySQL credentials. The Java backend reads `DB_URL`,
`DB_USER`, and `DB_PASSWORD` from that file when process environment variables
are not set. Environment variables take precedence.

Never commit `.env` or paste its password into source control.

## Run locally

Run `npm run dev` from the repository root. The frontend waits for the Java
backend health endpoint before starting, so requests are not sent to port 5000
while Maven is still compiling the backend.
