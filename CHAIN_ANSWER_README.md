# Chain Answer Game - Implementation Guide

## Overview

The Chain Answer Game is a collaborative word puzzle game built into the EduBuddy platform. Players take turns creating a chain of words where each new word follows a specific rule based on the previous word.

## Project Structure

```
apps/edugames/src/features/games/
├── ChainAnswerTypes.ts              # TypeScript interfaces & types
├── ChainAnswerWordValidator.ts      # Word validation service
├── ChainAnswerScoringService.ts     # Points calculation
├── useChainGameState.ts             # React state management hook
├── ChainGameBoard.tsx               # Main game UI component
├── ChainAnswerGamePage.tsx          # Game setup & layout page
└── GamesPage.tsx                    # Updated to link to Chain Answer Game
```

## Key Features Implemented (Phase 1)

✅ **Game Setup Interface**

- Teacher configures game parameters (chain type, difficulty, starting word)
- Student management (add/remove players)
- Responsive UI with TailwindCSS

✅ **Real-time Game Board**

- Large word display
- Player turn indicator with countdown timer
- Word input with validation feedback
- Running chain display
- Live scoreboard

✅ **Word Validation Service**

- Support for 5 chain variations:
  - **Standard**: Last letter → First letter (Apple → Elephant → Train)
  - **Category**: Category + chain rule (animals, objects, etc.)
  - **Ladder**: Change one letter (Cat → Hat → Bat)
  - **Compound**: Overlapping words (Sunshine → Ball)
  - **Geography**: City/country names only

✅ **Scoring System**

- Base points for valid words
- Difficulty multipliers
- Speed bonuses
- Chain length bonuses
- Penalty tracking

✅ **Game State Management**

- React Hook for centralized state
- Player turns & timers
- Chain history tracking
- Error handling

## How to Use

### For Students:

1. Navigate to **Games Hub** → **Chain Answer Game**
2. Enter game setup page (or join via invite code)
3. Wait for teacher to start
4. When it's your turn:
   - See the current word (large display)
   - See the required starting letter
   - Type a word that starts with that letter
   - Submit and see points awarded
5. View real-time scores on the leaderboard

### For Teachers:

1. Go to **Teacher Dashboard** (in teacherbuddy app)
2. Create new Chain Answer Game session
3. Configure:
   - Game name
   - Chain variation (standard, category, ladder, etc.)
   - Difficulty level
   - Optional category filter
   - Starting word
4. Add students manually or share invite code
5. Click "Start Game" when ready
6. Monitor in real-time
7. View results after game ends

## Technology Stack

**Frontend:**

- React 18+ with TypeScript
- Framer Motion (animations)
- TailwindCSS (styling)
- React Router (navigation)
- Custom hooks for state management

**Services:**

- WordValidator: Validates words against chain rules
- ScoringService: Calculates points and achievements
- Game state hook: Central state management

## File Descriptions

### ChainAnswerTypes.ts

Defines all TypeScript interfaces:

- `GameSession`: Game metadata
- `GamePlayer`: Player info & scores
- `GameWord`: Words in chain
- `WordValidationRequest/Response`: Validation contracts
- `GameConfig`: Configuration options

### ChainAnswerWordValidator.ts

Word validation logic:

- Mock dictionary (5000+ words in production)
- Chain rule validation for all variations
- Category filtering
- Duplicate word checking
- Suggestion generation

### ChainAnswerScoringService.ts

Scoring calculation:

- Base points (10)
- Difficulty bonuses (1x-2x)
- Speed bonuses (<5s = +3 pts)
- Chain length bonuses (every 5 words)
- Penalty system
- Achievements tracking

### useChainGameState.ts

React hook for game state:

- `initializeGame`: Setup session
- `addPlayer`: Register students
- `submitWord`: Validate & add word to chain
- `skipTurn`: Handle skipped turns
- `startGame`/`endGame`: Lifecycle
- Timer countdown effect

### ChainGameBoard.tsx

Main game UI component:

- Current word display
- Player indicator
- Input form (conditional render)
- Error messages
- Chain visualization
- Live scoreboard

### ChainAnswerGamePage.tsx

Setup & layout page:

- Game configuration form
- Player management UI
- Start game button (disabled if <2 players)
- Navigation to game board

## Backend Integration

The frontend is **ready for backend integration**. See `API_SPECIFICATION.md` in session files for complete API details.

### Current Implementation: Mock Backend

- Uses in-memory state for demo
- Local word dictionary (36 sample words)
- No persistence

### Next Steps: Real Backend

1. Implement Node.js/Express server
2. Setup PostgreSQL database
3. Create REST API endpoints (see API spec)
4. Implement WebSocket for real-time updates
5. Seed production dictionary (5000+ words)
6. Add authentication & authorization

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev:interactive

# Navigate to http://localhost:5173/games/chain-answer
```

## Testing

### Manual Testing Checklist:

✅ **Setup Phase**

- [ ] Create game with different chain variations
- [ ] Add/remove players
- [ ] Start game with 2+ players

✅ **Gameplay**

- [ ] Verify word validation (valid words accepted)
- [ ] Verify chain rule enforcement (wrong starting letter rejected)
- [ ] Verify duplicate detection
- [ ] Check turn rotation
- [ ] Timer counts down
- [ ] Scores update correctly

✅ **UI/UX**

- [ ] Responsive on mobile/tablet/desktop
- [ ] Animations smooth
- [ ] Error messages clear
- [ ] Dark mode works

### Unit Tests (Example):

```typescript
// Test word validation
const request: WordValidationRequest = {
  word: "Train",
  previousWord: "Apple",
  chainVariation: "standard",
  usedWords: ["Apple"],
};
const result = WordValidator.validate(request);
expect(result.isValid).toBe(true);

// Test scoring
const mods = ScoringService.calculatePointsForWord("hard", 3, 10, 7);
expect(mods.basePoints).toBe(10);
expect(mods.difficultyBonus).toBe(10); // 100% bonus for hard
expect(mods.speedBonus).toBe(3);
expect(mods.chainLengthBonus).toBe(5); // 10 % 5 = 0, no bonus
```

## Phase 2 Roadmap (Not Yet Implemented)

- [ ] All 5 chain variations fully tested
- [ ] Single-player practice mode
- [ ] Hint system with word suggestions
- [ ] Multi-language support
- [ ] Custom word lists (teacher-created)
- [ ] Achievements & badges UI
- [ ] Game replay feature
- [ ] Statistics dashboard

## Known Limitations

1. **No Backend**: Currently uses mock data only
2. **Limited Dictionary**: 36 sample words (vs. 5000+ production)
3. **No Persistence**: Data lost on page refresh
4. **No Real-time Sync**: WebSocket not implemented
5. **No Authentication**: Demo mode (no user verification)
6. **No Multi-language**: English only

## Troubleshooting

**Issue**: Game doesn't start with <2 players

- **Solution**: Add at least 2 players before clicking Start

**Issue**: Word validation too strict

- **Solution**: Check dictionary in `ChainAnswerWordValidator.ts`, add more words if needed

**Issue**: Animations lag on mobile

- **Solution**: Reduce animation duration in Framer Motion configs

## Contributing

When making changes:

1. Keep types in `ChainAnswerTypes.ts`
2. Add validation logic to `WordValidator`
3. Update scoring rules in `ScoringService`
4. Test with multiple players
5. Follow existing code style

## Resources

- Design Document: `CHAIN_ANSWER_GAME_DESIGN.md`
- API Specification: `API_SPECIFICATION.md`
- Implementation Plan: `plan.md`
