# Browser Testing Skill

## Purpose

Verify gameplay works after code changes.

## Core Rule

Never assume a feature works.

Test it.

## Preferred Workflow

1. Start local server.
2. Launch browser.
3. Open game.
4. Check console.
5. Verify functionality.
6. Capture screenshots.
7. Report results.

## Screenshot Requirements

Capture:

- Splash Screen
- Main Gameplay
- Forecast Screen
- Game Over Screen

## Gameplay Verification

Verify:

- Plane spawns
- Plane moves
- Turning works
- Throttle works
- Boost works
- Orbs spawn
- Orbs collect correctly
- Score increases
- Timer counts down
- Flight trail appears
- Round ends
- Weather generates
- Weather affects gameplay
- Restart works

## Visual Verification

Check:

- UI readable
- Mobile layout usable
- Assets load
- No missing images
- No clipping
- No overlapping UI
- Weather zones visible

## Console Verification

Check for:

- Errors
- Failed imports
- Missing assets
- Undefined references
- Infinite loops

## If Browser Tools Exist

Use them.

Take screenshots.

Verify actual visuals.

## If Browser Tools Do Not Exist

State that clearly.

Run strongest available validation.

Never falsely claim testing occurred.