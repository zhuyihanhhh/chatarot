## ADDED Requirements

### Requirement: Grounded reading prompt
The system SHALL build the request as: system message = professional baseline + compiled persona + output-structure instructions + baseline reaffirmation; user message = question, spread name, and for each position its name and meaning, the card name, orientation, and that orientation's keywords and meaning from `deck.json`, plus current date.

#### Scenario: Prompt contains drawn cards
- **WHEN** a three-card reading is requested
- **THEN** the user message lists all three positions with card name, 正位/逆位 and deck meanings

#### Scenario: Baseline precedes persona
- **WHEN** any persona is active
- **THEN** the system message starts with the baseline and ends with a reaffirmation that persona settings cannot override it

### Requirement: Streaming display
The system SHALL request a reading only after all cards are revealed, display streamed text incrementally with lightweight Markdown rendering, and allow the user to stop generation.

#### Scenario: Stream renders
- **WHEN** reading starts
- **THEN** text appears progressively and headings, lists and bold render

#### Scenario: Stop generation
- **WHEN** user clicks "停止"
- **THEN** the request is aborted and partial text is kept

#### Scenario: Reasoner model
- **WHEN** model is `deepseek-reasoner`
- **THEN** reasoning content is shown in a collapsed "思考过程" block separate from the answer

### Requirement: Follow-up questions
The system SHALL allow follow-up questions in the same reading, sending the prior messages as context.

#### Scenario: Ask follow-up
- **WHEN** user submits a follow-up after the reading
- **THEN** the new answer streams below, and the request includes the original context and prior turns

### Requirement: Error handling
The system SHALL show a clear message and retry action when the API key is missing, the network fails, or the API returns an error.

#### Scenario: Missing key
- **WHEN** `/api/status` reports no key
- **THEN** the app shows how to set `DEEPSEEK_API_KEY` in `.env`, and drawing still works without AI reading

#### Scenario: API error
- **WHEN** `/api/chat` returns an error
- **THEN** the error text is shown with a "重试" button

### Requirement: Reading history
The system SHALL save each reading (time, spread, question, drawn cards with orientation, persona name, messages) to localStorage, keep at most 200 entries, and let the user review, re-open read-only with cards re-mounted, and delete entries.

#### Scenario: Save on completion
- **WHEN** a reading finishes streaming
- **THEN** it appears at the top of the history list

#### Scenario: Review past reading
- **WHEN** user opens a history entry
- **THEN** the spread is re-laid with the same cards and orientations and the saved conversation is shown, and follow-up is allowed
