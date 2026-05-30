# Debug Session: share-impression-json [OPEN]

## Symptom
- Submitting `Share impression` shows: `Failed to execute 'json' on 'Response': Unexpected end of JSON input`.

## Hypotheses
1. The frontend posts to a relative `/api/reviews` endpoint on the Vite dev server, which returns an empty/non-JSON response instead of proxying to the API server.
2. The API server process is not running on port 8787 when the form submits, causing the frontend request to receive an empty fallback/error response.
3. The `/api/reviews` handler throws before sending JSON, causing an empty response body.
4. The frontend response parser assumes every response body is JSON and crashes when it receives an empty body.

## Evidence Plan
- Add temporary network-reporting instrumentation around the shared JSON request parser and review submission path.
- Reproduce the submission and inspect URL, status, content-type, body length and parse outcome.

## Status
- Created session and hypotheses.
- User-provided Network evidence confirms H1: `POST http://localhost:5173/api/reviews` returned `404 Not Found`, so Vite was not proxying `/api` to the backend.
- Fix applied: added `vite.config.ts` with `/api` proxy to `http://localhost:8787`.
- Verification: `POST http://localhost:5173/api/reviews` returns `201 application/json` through the proxy.
- Follow-up issue: after submit, only the newly submitted review appeared until refresh. Cause: local state prepended the returned review to whatever comments were already loaded; if initial GET failed/was empty, history stayed missing. Fix: after POST, immediately GET `/api/reviews` and replace state with the complete server list.
