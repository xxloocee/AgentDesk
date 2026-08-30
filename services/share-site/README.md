# AgentDesk Share

Cloudflare Pages + Workers KV reference deployment for encrypted session sharing. AgentDesk does not publish this service by default.

The AgentDesk session-share entry remains disabled until a self-owned deployment is configured.

## Cloudflare bindings

- Pages project: `agentdesk-share`
- KV binding: `SHARES`
- Custom domain: not configured

The browser encrypts content with AES-256-GCM. The encryption key stays in the
URL fragment and is not sent to the server. KV records expire after 1, 7, or 30
days and can be revoked with a separate delete token stored in the creator's
browser.

When explicitly enabled, the API allows cross-origin requests from the Codex desktop
renderer so clients can create links without sending plaintext.

## Limits

- Maximum plaintext length: 900,000 characters
- Maximum encrypted payload: approximately 1 MiB
- Allowed expiration: 1, 7, or 30 days
