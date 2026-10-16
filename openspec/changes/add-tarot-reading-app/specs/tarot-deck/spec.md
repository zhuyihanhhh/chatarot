## ADDED Requirements

### Requirement: Complete deck data
The system SHALL provide `data/deck.json` with exactly 78 entries, one per card stem, each containing Chinese and English names, arcana, suit, rank, element, astrological correspondence, and upright and reversed keywords and meanings in Chinese.

#### Scenario: Deck integrity
- **WHEN** deck.json is loaded
- **THEN** it contains 78 unique stems, 22 major and 56 minor, and every stem has a matching `assets/cards/<stem>.jpg`

#### Scenario: Both orientations described
- **WHEN** any card entry is read
- **THEN** both `upright` and `reversed` contain at least 3 keywords and a non-empty meaning

### Requirement: Traditional meaning source
Card meanings SHALL be based on the Rider-Waite tradition (A. E. Waite, *The Pictorial Key to the Tarot*), with the Golden Dawn element and astrology correspondences.

#### Scenario: Major arcana correspondence
- **WHEN** reading The Fool entry
- **THEN** element is Air and astrology is Uranus or Air, consistent with Golden Dawn attribution
