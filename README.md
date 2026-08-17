# Manifestor Slicer

Manifestor Slicer is a browser-based 3D printing slicer project.

## V4 foundation

- Vite + Three.js
- STL import
- 3D build plate
- Printer / filament / process profile separation
- Object transform foundation
- Prepare workspace
- No fake printable G-code
- Profiles stored as JSON

## Current limitation

The real slicing engine is intentionally not included yet. The Slice action reports that the engine integration is required. Do not use generated demo G-code for printing.

## Roadmap

1. Multi-object scene and transform gizmos
2. Profile inheritance/validation
3. Real slicing engine worker
4. G-code/toolpath preview
5. Print statistics
6. Cloud projects
7. Printer connectivity

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
