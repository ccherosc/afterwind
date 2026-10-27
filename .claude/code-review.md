# Code Review Skill

## Purpose

Review changes before completion.

## Core Rule

Protect working code.

Do not rewrite stable systems without reason.

## Review Checklist

### Syntax

Check:

- Missing brackets
- Missing imports
- Missing exports
- Undefined variables
- Duplicate declarations

### Architecture

Check:

- File responsibilities
- Large functions
- Repeated code
- Dead code
- Unused imports

### Performance

Check:

- Memory leaks
- Unbounded arrays
- Excessive allocations
- Duplicate animation loops
- Excessive DOM updates

### Gameplay

Check:

- Player movement
- Orb collection
- Weather generation
- Scoring
- Game state transitions

### Mobile

Check:

- Responsive layout
- Touch controls
- Button size
- Screen fit

### Asset Validation

Check:

- Paths exist
- Images load
- No broken references

### Storage

Check:

- localStorage writes
- localStorage reads
- High score persistence

## Refactoring Rules

Only refactor when:

- Bug exists
- Readability improves
- Performance improves

Avoid cosmetic rewrites.

## Completion Rule

A task is not complete until:

- Code reviewed
- Game still launches
- No obvious console errors
- New feature works