# Tournament Bracket Tree Visualization

## Overview

The bracket page (`/matches/bracket`) now displays a **professional tournament tree** with connecting lines showing the progression from quarter finals → semi finals → final, similar to traditional sports tournament brackets.

## Visual Improvements

### 1. **Tree Structure Layout**

The knockout stage is displayed as a horizontal tree flowing from left to right:

```
Quarter Finals  →  Semi Finals  →  Final
    QF1         →                 
    QF2         →     SF1    →    
                             →  FINAL
    QF3         →     SF2    →
    QF4         →                 
```

### 2. **Connecting Lines**

- **Horizontal connectors**: Lines extending from each match to the right
- **Vertical connectors**: Lines connecting match pairs to show which teams advance together
- **Visual flow**: Clear path showing tournament progression

### 3. **Enhanced Match Cards**

Each match card now includes:
- ✅ **Match date and time** (formatted as DD.MM HH:mm)
- ✅ **Field number** (Saha 1, Saha 2, etc.)
- ✅ **Status badge** (Tamamlandı / Yaklaşan)
- ✅ **Team names** with crossover format (A 1. vs B 2.)
- ✅ **Scores** with winner highlighting (green background)
- ✅ **Hover effects** with shadow transitions

### 4. **Stage Columns**

Three distinct columns with colored headers:
- **Çeyrek Final** (Quarter Finals) - Purple background
- **Yarı Final** (Semi Finals) - Blue background  
- **Final** - Yellow background with trophy icon 🏆

### 5. **Responsive Design**

- Horizontal scroll for smaller screens (min-width: 1400px)
- Proper spacing between stages
- Card width: 280px for optimal readability
- Vertical spacing adjusted to align connector lines

## Code Structure

### Match Card Component

```typescript
const MatchCard = ({ match, className }: { match: ExtendedMatch; className?: string }) => {
  // Displays:
  // - Match header with date, time, field
  // - Status badge
  // - Team names (with crossoverInfo support)
  // - Scores with winner highlighting
}
```

### Bracket Tree Layout

```typescript
<div className="relative flex items-start justify-center gap-12 px-8">
  {/* Quarter Finals Column */}
  <div className="flex flex-col items-center">
    <h3>Çeyrek Final</h3>
    {quarterFinals.map((match, idx) => (
      <div className="relative">
        <MatchCard match={match} className="w-[280px]" />
        {/* Horizontal connector line */}
        <div className="absolute left-full top-1/2 w-12 h-0.5 bg-slate-300" />
        {/* Vertical connector for pairs */}
        {idx % 2 === 0 && /* vertical line */}
      </div>
    ))}
  </div>
  
  {/* Semi Finals Column - with margin-top offset */}
  {/* Final Column - with larger margin-top offset */}
</div>
```

## Features

### Quarter Finals Display

Shows **crossover format** when `crossoverInfo` exists:
- "A 1. vs B 2." instead of actual team names
- Clean group letter (removes "Grup" prefix)
- Shows qualification rank clearly

Example:
```
┌─────────────────────┐
│ A 1.            -   │
│ B 2.            -   │
└─────────────────────┘
```

### Winner Highlighting

When a match has scores:
- Winning team gets **green background** (bg-green-50 / dark:bg-green-950)
- Score appears in **bold green text**
- Visual emphasis on match outcome

### Connector Lines

The connecting lines are pure CSS divs:
```typescript
{/* Horizontal line to next stage */}
<div className="absolute left-full top-1/2 w-12 h-0.5 bg-slate-300" />

{/* Vertical line connecting pairs */}
<div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+2rem)] bg-slate-300" />
```

## Crossover Finals Section

Separate section for crossover finals with:
- **4-column grid layout**
- **Gold, Silver, Bronze, Prestige** finals
- **Medal emojis** (🥇 🥈 🥉 ⭐)
- **Colored backgrounds** matching medal type
- **Border decoration** (yellow border for emphasis)

## Styling

### Colors

- **Background**: Gradient from slate-50 to slate-100
- **Headers**: Purple (QF), Blue (SF), Yellow (Final)
- **Connector lines**: Slate-300 (light) / Slate-700 (dark)
- **Winner highlight**: Green-50/Green-950
- **Card borders**: 2px solid with shadow effects

### Spacing

- **Gap between stages**: 3rem (gap-12)
- **Card spacing**: 2rem vertical (space-y-8)
- **Semi finals offset**: 80px margin-top
- **Final offset**: 160px margin-top
- **Connector length**: 3rem (w-12)

## Responsive Behavior

```typescript
<div className="overflow-x-auto">
  <div className="min-w-[1400px] p-8 ...">
    {/* Bracket content */}
  </div>
</div>
```

- Viewport < 1400px: Horizontal scroll enabled
- Viewport >= 1400px: Full bracket visible
- Mobile: Scroll to see complete tournament tree

## Team Display Logic

```typescript
const getTeamDisplay = (match: ExtendedMatch, isHome: boolean) => {
  const crossoverInfo = match.crossoverInfo;
  
  if (crossoverInfo) {
    const info = isHome ? 
      { group: crossoverInfo.homeTeamGroup, rank: crossoverInfo.homeTeamRank } :
      { group: crossoverInfo.awayTeamGroup, rank: crossoverInfo.awayTeamRank };
    
    const groupLetter = info.group.replace('Grup ', ''); // "Grup A" → "A"
    return `${groupLetter} ${info.rank}.`;
  }
  
  return team.name; // Actual team name for completed matches
};
```

## Empty States

Three different empty states:

1. **No matches at all**:
   - Trophy icon
   - "Henüz maç bulunmuyor"
   - Explanation text

2. **No finals yet**:
   - Trophy icon
   - "Henüz final maçı bulunmuyor"
   - Explanation text

3. **Has matches but no knockout stages**:
   - Only shows relevant sections (crossover OR knockout)

## Integration with Auto-Generation

Works seamlessly with automatic knockout generation:
1. User clicks "Fikstür Oluştur"
2. System generates group matches + quarter finals + semi finals
3. User is redirected to bracket page
4. **Instant visualization** of complete tournament tree
5. Shows "A 1. vs B 2." format for clarity

## Date Formatting

Custom date formatter without external dependencies:
```typescript
const formatMatchDate = (date: string | Date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month} ${hours}:${minutes}`;
};
```

Output: `24.10 14:30`

## Benefits

✅ **Professional appearance** - Looks like official tournament brackets
✅ **Clear progression** - Visual flow from QF → SF → F
✅ **Information rich** - Date, time, field, status all visible
✅ **Winner emphasis** - Green highlighting for completed matches
✅ **Mobile friendly** - Horizontal scroll on small screens
✅ **Crossover support** - Shows placeholder format (A 1. vs B 2.)
✅ **Dark mode** - Full support with proper color variants
✅ **Performance** - No external date library needed

## Technical Notes

### Why No date-fns?

Initially used `date-fns` for date formatting, but switched to custom formatter to:
- Reduce bundle size
- Avoid dependency conflicts
- Simple date format doesn't need external library
- Faster load times

### Connector Line Math

The vertical connector height calculation:
```typescript
h-[calc(100%+2rem)]  // Quarter finals pairs
h-[calc(100%+4rem)]  // Semi finals pairs
```

This ensures lines connect properly accounting for:
- Card height (100%)
- Gap between cards (2rem or 4rem)

### Column Offsets

```typescript
marginTop: '80px'   // Semi finals (1 match height + gap)
marginTop: '160px'  // Final (2 match heights + gaps)
```

Aligns stages vertically so connector lines meet properly.

## Future Enhancements

Potential improvements:
- [ ] Animated transitions when matches complete
- [ ] Click to expand match details
- [ ] Print-friendly CSS
- [ ] PDF export of bracket
- [ ] Live score updates with WebSocket
- [ ] Team logos in match cards
- [ ] Bracket zoom controls
- [ ] Mobile-optimized vertical layout

## Summary

The bracket visualization now provides a **professional, clear, and visually appealing** tournament tree that makes it easy to understand the tournament structure and follow match progression from quarter finals to the championship.
