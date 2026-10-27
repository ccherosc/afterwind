# Afterwind Development Skill

## Purpose

Build and maintain the Afterwind game.

Afterwind is a browser-based arcade airplane game where player flight paths create weather that affects future rounds.

## Core Rule

Never invoke any 1M context tool.

Never perform repository-wide analysis unless explicitly requested.

Read only files needed for the current task.

Prefer targeted edits.

## Tech Stack

Use:

- HTML
- CSS
- Vanilla JavaScript
- HTML5 Canvas
- localStorage

Avoid:

- React
- TypeScript
- Build systems
- Heavy frameworks
- Unnecessary dependencies

## Game Philosophy

Simple controls.

Deep consequences.

Fast restart.

Easy to learn.

Hard to master.

The weather system is the game.

Aircraft simulation is not the game.

## Core Loop

Start Day

Fly

Collect Orbs

Record Flight Path

Analyze Path

Generate Weather

Start Next Day

Repeat

## Asset Rules

Use Kenney Pixel Shmup assets from assets folder.

Do not assume filenames.

Inspect only when needed.

Prefer reusing existing assets.

Do not generate placeholder art if suitable assets exist.

## Architecture Goals

Keep files focused.

One responsibility per file.

Avoid large classes.

Avoid unnecessary abstraction.

Prefer simple modules.

## Performance Rules

Use requestAnimationFrame.

Avoid expensive allocations inside game loop.

Limit particles.

Limit weather zones.

Limit path history.

Cap memory growth.

## Mobile Requirements

Must support portrait mode.

Must support touch controls.

Buttons must be large.

UI must remain readable.

## Response Style

After changes report:

Done.

Changed:
- item

Tested:
- item

Notes:
- item

Keep responses concise.