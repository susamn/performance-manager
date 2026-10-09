---
name: performance-json-generator
description: >
  Interactive skill for generating structured, validated JSON to import cultural event performances
  into Performance Manager. Collects performance items, verifies audio tracks in a local directory,
  extracts durations, analyzes types and modes, and strictly maintains the provided sequence.
version: 1.0.0
kind: guidance
triggers:
  - "generate performance json"
  - "create performance import json"
  - "generate performance list for event"
  - "prepare performances json"
  - "format performance data for import"
intent: data-generation
guardrails:
  - The sequence of performances must be strictly maintained in the exact order provided. Do NOT sort, group, or reorder under any circumstances.
  - Every track filename must be verified against the user-specified local audio directory.
  - Infer sensible defaults for performance type ('Song', 'Dance', 'Recitation', 'Break') and mode, ensuring types are always present and visible in the listing.
created_at: 2026-10-08
updated_at: 2026-10-08
---

# Performance JSON Generator

An agentic workflow for turning raw cultural event schedules, performer lists, and audio files into validated JSON ready for direct import into Performance Manager.

---

## Strict Requirements

1. **Strict Sequence Preservation**:
   - The order of performances in the input is authoritative.
   - Performances MUST be sequenced with `order: 0, 1, 2, ...` matching the exact sequence in which they were supplied.
   - **Never sort alphabetically, by performer, or by type.**

2. **Track Verification**:
   - Every audio file listed must be checked against the provided local directory on disk.
   - If a file is missing or spelled differently, notify the user with closest matches from the directory.

3. **Performance Code Generation**:
   - Every performance must have a 3-character unique code: 2 uppercase letters `[A-Z]` followed by 1 digit `[1-9]` (e.g., `AB3`, `KX7`, `PM1`).

4. **Performance Type Visibility**:
   - Every performance item must include a valid `type` (`'Song'`, `'Dance'`, `'Recitation'`, or `'Break'`).
   - Performance Manager renders this type in the performance listing (badges with distinct color coding) and strictly preserves it in all event export formats (HTML Program and JSON export).

---

## Interactive Workflow

```
  [ Raw Performance List ] ──┐
                             ├─► [ Verify Audio in Folder ] ──► [ Infer Type/Mode/Duration ] ──► [ Generate & Save JSON ]
  [ Local Audio Folder   ] ──┘                                 (Strict sequence kept!)
```

### Step 1: Input Collection
Ask the user for:
1. **Raw Performance List**:
   - Can be raw text, CSV, spreadsheet export, or bullet list.
   - Each item should have:
     - Performance Name
     - Performer / Group Name (optional for Breaks)
     - Performance Type (Song, Dance, Recitation, or Break — inferred if not explicit)
     - Associated track filename(s)
2. **Audio Track Folder Path**:
   - Absolute or relative path to the local directory where the audio files (`.mp3`, `.mp4`, `.m4a`, `.wav`, `.flac`, `.aac`) are stored.

---

### Step 2: Track Verification & Analysis
1. Inspect the specified folder using bash/ls or Python:
   - Match each track name against existing files.
   - If exact match is found, verify its duration using `mutagen` or `ffprobe`:
     ```python
     from mutagen import File
     audio = File(filepath)
     duration_seconds = round(audio.info.length)
     ```
   - If a file is not found, search for case-insensitive or fuzzy matches and confirm with the user.
2. **Sensible Classification**:
   - **Performance Type**:
     - `'Break'`: Lunch, Dinner, Intermission, Announcement, Speeches, Felicitation.
     - `'Dance'`: Mentions of dance, nritya, kathak, bharatanatyam, choreography, group dance.
     - `'Recitation'`: Kobita, poem, recitation, abritti, poetry, drama, audio play.
     - `'Song'`: Default musical items, vocal, chorus, sangeet, solo song.
   - **Performance Mode**:
     - For Breaks: `'Lunch'`, `'Dinner'`, `'Broadcast'`, `'Announcement'`, `'Appearence'`, or `'Special Show'`.
     - For Performances:
       - Single performer -> `'Solo'`
       - Two performers ("Alice & Bob", "Alice and Bob") -> `'Duet'`
       - Multiple performers, "Group", "Choir", "Troupe" -> `'Group'`

---

### Step 3: Schema Conformance

Format each item to match the Performance Manager schema:

```json
[
  {
    "code": "AB1",
    "name": "Opening Song - Agomoni",
    "performer": "Ananya Roy",
    "type": "Song",
    "mode": "Solo",
    "expectedDuration": 5,
    "resolvedDuration": 274,
    "order": 0,
    "isDone": false,
    "tracks": [
      {
        "filename": "agomoni_track.mp3",
        "performer": "Ananya Roy",
        "duration": 274,
        "isCompleted": false
      }
    ]
  },
  {
    "code": "CD2",
    "name": "Lunch Break",
    "performer": "",
    "type": "Break",
    "mode": "Lunch",
    "expectedDuration": 45,
    "order": 1,
    "isDone": false,
    "tracks": []
  }
]
```

### Step 4: Verification & Export
1. Show a summary table to the user displaying:
   - Order (#)
   - Code
   - Performance Name
   - Performer
   - Type / Mode
   - Verified Track Filenames & Durations
2. Confirm that the sequence and classification (especially `type`) exactly match the user's intent.
3. Write the JSON file to the desired output location (e.g., `performances_import.json`).
4. Guide the user to import this JSON directly into Performance Manager using the **Import JSON** button in the event dashboard.
5. Note that the event schedule can also be exported anytime from Performance Manager via **Export** -> **Program (HTML)** or **Performances (JSON)**, with full performance type preservation in the listing.
