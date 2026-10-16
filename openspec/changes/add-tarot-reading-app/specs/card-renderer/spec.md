## ADDED Requirements

### Requirement: Multi-instance mounting
The engine SHALL provide `Live2DCard.mount(container, opts)` that renders a card inside the given container without relying on global DOM ids or `window.CARD_IMG`, and SHALL support at least 10 simultaneous instances.

#### Scenario: Mount one card
- **WHEN** app calls `mount(el, { stem: "RWSa-T-00", rig })`
- **THEN** a Live2D Fool renders inside `el` and `onReady` fires

#### Scenario: Celtic Cross on screen
- **WHEN** 10 cards are mounted at once
- **THEN** all render and animate, with frame rate ≥ 45 fps on the reference machine

#### Scenario: Destroy releases resources
- **WHEN** `instance.destroy()` is called
- **THEN** its canvases are removed, its WebGL context is released, and it no longer receives animation frames

### Requirement: Reversed display
The engine SHALL display a card upside-down when `reversed: true` and keep pointer-driven look and tilt directionally consistent with the cursor.

#### Scenario: Reversed card
- **WHEN** a card is mounted with `reversed: true`
- **THEN** it renders rotated 180° and the head-look follows the cursor in screen space

#### Scenario: Toggle orientation
- **WHEN** `instance.setReversed(false)` is called
- **THEN** the card returns to upright without remounting

### Requirement: Pause and resume
Each instance SHALL support `pause()` and `resume()`; all instances SHALL share a single animation loop.

#### Scenario: Paused card
- **WHEN** an instance is paused
- **THEN** it stops updating its springs and redrawing until resumed

### Requirement: Baked layer loading
The engine SHALL load pre-baked layers from `assets/baked/<stem>/` when present and matching the rig hash, and SHALL fall back to runtime extraction otherwise.

#### Scenario: Baked assets present
- **WHEN** valid baked assets exist
- **THEN** the card skips runtime layer extraction and inpainting

#### Scenario: Baked assets stale or missing
- **WHEN** baked meta hash mismatches or files are missing
- **THEN** the engine extracts layers at runtime and the card still renders

### Requirement: Single-card page compatibility
The existing `cards/RWSa-*.html` pages SHALL keep working, including when opened via `file://`, after rigs move to `engine/rigs/<stem>.js`.

#### Scenario: Regression check
- **WHEN** `tools/check-all.ps1` runs after the refactor
- **THEN** all 78 pages report OK
