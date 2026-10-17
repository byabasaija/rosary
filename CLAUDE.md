@AGENTS.md
# Rosary Companion App

Catholic rosary prayer app. Expo (React Native) + TypeScript.

## Architecture
- 3D tappable rosary: @react-three/fiber via expo-gl. Use drei/native imports only.
- State: single Zustand store (currentBeadIndex, mysterySet, language, isPlaying).
- Audio: expo-av, pre-recorded files per prayer per language. NO runtime TTS.
- Prayer texts: static JSON in /assets/prayers/{en,la,sw,lg}.json — official
  canonical texts only, never generated/translated.
- No backend, no auth, no analytics. Donate button = external link.
- English audio bundled; other languages lazy-downloaded via expo-file-system.

## Domain rules
- Rosary structure: opening (Sign of Cross, Creed, 1 Our Father, 3 Hail Marys,
  Gloria) → 5 decades (Our Father + 10 Hail Marys + Gloria + Fatima Prayer)
  → closing (Hail Holy Queen, final prayer).
- Mysteries by weekday: Mon/Sat Joyful, Tue/Fri Sorrowful, Wed/Sun Glorious,
  Thu Luminous. User can override.
- Tapping any bead jumps playback to that prayer.

## Conventions
- Keep the 3D scene minimal: one glTF, basic materials, no postprocessing.
- Business logic (bead sequence) lives in pure TS, fully unit-testable,
  zero React/3D imports.