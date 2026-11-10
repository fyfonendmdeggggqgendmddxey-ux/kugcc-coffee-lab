# DeepSeek photo extraction

Bean labels, batch labels and recipe images use `deepseek-flash`, following https://api-docs.deepseek.com/guides/vision/ (checked 2026-11-10).

Settings auto-save a per-browser DeepSeek key and provide a connection check against `/models`. This check verifies authentication/model availability, not balance or a paid image generation. An `sk-` key stored by the previous Gemini setting is migrated on first use; Gemini keys are not migrated. Clearing the new setting prevents re-import.

The browser resizes images and calls the same-origin `/api/deepseek` route. The route forwards the user-supplied key to the fixed DeepSeek API host, never logs it, and uses no server account credentials. Keys remain in browser local storage, as in the previous application. Photos and keys transit the application server and are forwarded to DeepSeek only when requested. No image or key storage is added on the server. Requests stop after 45 seconds upstream / 55 seconds client-side, without automatic paid retries.

The route uses JSON output and filters fields before updating existing forms. Authentication, insufficient balance, rate limits, unreadable images and timeouts have distinct messages. Deployment requires Next.js server functions; a static-only export cannot host this route.
