## ADDED Requirements

### Requirement: Fixed professional baseline
The system SHALL always include a non-editable professional baseline in the system prompt, requiring the reader to:
- interpret cards accurately according to the deck data and drawn orientation;
- tie every card to its spread position and analyse relations between cards (elements, numbers, major/minor ratio, suit dominance);
- never invent cards that were not drawn, nor change an orientation;
- present tarot as reflection and guidance, not deterministic fate;
- not give medical, legal, financial-investment or psychological-diagnosis conclusions, and suggest professional help when the question touches these areas or self-harm;
- avoid fear-mongering and dependence-inducing language.

#### Scenario: Baseline not editable
- **WHEN** user edits any persona
- **THEN** the baseline text is visible read-only and not part of editable fields

#### Scenario: Persona conflicts with baseline
- **WHEN** persona free text asks for definite death or illness predictions
- **THEN** the system prompt still contains the baseline reaffirmation, and the reading declines that part while giving guidance

### Requirement: Persona dimensions
A persona SHALL be configurable on these dimensions:
- **school**: Rider-Waite traditional, Golden Dawn esoteric (elements, astrology, Kabbalah), Jungian psychological (archetypes, shadow), or practical coaching;
- **reversalMethod**: opposite meaning, blocked or delayed energy, internalised energy, or contextual mixed;
- **tone**: gentle healing, blunt and sharp, mystical and poetic, or rational and analytical;
- **directness** from 1 to 5;
- **length**: concise, standard, or detailed;
- **address**: how the reader addresses the user;
- **focus**: any of love, career, wealth, growth, relationships, or spiritual;
- **output**: toggles for summary-first, per-position analysis, card relations, action advice, timing hints, and element, number or astrology correspondences;
- **extra**: free text of at most 800 characters for name, catchphrases, background and taboos.

#### Scenario: Compile persona
- **WHEN** a persona with tone "blunt" and directness 5 is active
- **THEN** the compiled prompt includes the predefined professional description for blunt tone and maximum directness

#### Scenario: Extra length limit
- **WHEN** user types more than 800 characters in extra
- **THEN** input is truncated at 800 and a counter shows the limit

### Requirement: Built-in templates
The system SHALL provide read-only templates: 温柔疗愈师, 犀利直言者, 金色黎明神秘学者, 荣格心理分析师, 实用人生教练. Each template SHALL fill every dimension, and the user SHALL be able to duplicate any template into an editable custom persona.

#### Scenario: Use template
- **WHEN** user selects "荣格心理分析师"
- **THEN** subsequent readings use school Jungian with the template's other settings

#### Scenario: Duplicate template
- **WHEN** user clicks "复制为自定义" on a template
- **THEN** an editable copy named "<模板名> (副本)" is created and selected

### Requirement: Custom persona management
The system SHALL let the user create, edit, rename, delete, and select custom personas, persisting them to localStorage, and SHALL support JSON export and import.

#### Scenario: Persist across sessions
- **WHEN** user saves a custom persona and reloads the page
- **THEN** the persona and the active selection are restored

#### Scenario: Import invalid JSON
- **WHEN** user imports a file with invalid fields
- **THEN** invalid fields fall back to defaults, unknown fields are ignored, and a warning is shown

#### Scenario: Delete active persona
- **WHEN** user deletes the active custom persona
- **THEN** active persona falls back to the first built-in template

### Requirement: Persona preview
The system SHALL show the compiled system prompt preview for the selected persona.

#### Scenario: Preview prompt
- **WHEN** user opens "预览提示词"
- **THEN** the full system prompt, including the baseline, is displayed read-only
