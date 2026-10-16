## ADDED Requirements

### Requirement: One-command local startup
The system SHALL start with `node server.js` using only Node.js built-in modules, listen on `127.0.0.1` only, and serve the repository as static files.

#### Scenario: Start server
- **WHEN** user runs `node server.js`
- **THEN** server listens on `127.0.0.1:<PORT>` (default 3090) and prints the app URL

#### Scenario: Static file served
- **WHEN** browser requests `/app/index.html`
- **THEN** server returns the file with correct `Content-Type`

#### Scenario: Path traversal blocked
- **WHEN** a request path resolves outside the repository root (e.g. `/../secret`)
- **THEN** server responds 403 and does not read the file

### Requirement: API key configuration
The system SHALL read `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` and `PORT` from `.env` (or process env) and MUST NOT send the API key to the browser.

#### Scenario: Key missing
- **WHEN** no API key is configured and browser calls `GET /api/status`
- **THEN** response contains `{ hasKey: false }` and the app shows setup guidance

#### Scenario: Key present
- **WHEN** API key is configured
- **THEN** `GET /api/status` returns `{ hasKey: true, model }` without the key value

### Requirement: Streaming chat proxy
The system SHALL expose `POST /api/chat` that forwards `{ messages, model }` to DeepSeek chat completions with streaming enabled and relays the SSE stream unchanged.

#### Scenario: Successful stream
- **WHEN** browser posts valid messages
- **THEN** server relays upstream SSE chunks as they arrive with `Content-Type: text/event-stream`

#### Scenario: Upstream error
- **WHEN** DeepSeek returns non-2xx
- **THEN** server responds with the same status and a JSON `{ error }` message

#### Scenario: Client aborts
- **WHEN** browser disconnects mid-stream
- **THEN** server aborts the upstream request

### Requirement: Bake upload endpoint
The system SHALL expose `POST /api/bake/:stem` that writes uploaded baked layer files into `assets/baked/<stem>/`, accepting only stems matching existing card files.

#### Scenario: Valid bake upload
- **WHEN** bake tool posts files for stem `RWSa-T-00`
- **THEN** files are written under `assets/baked/RWSa-T-00/`

#### Scenario: Invalid stem
- **WHEN** stem does not match `^RWSa-[A-Z]-[0-9A-Z]{2}$` or has no card asset
- **THEN** server responds 400 and writes nothing
