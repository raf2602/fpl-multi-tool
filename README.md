# FPL Multi-Tool Webapp

A comprehensive Fantasy Premier League (FPL) analysis platform built with Next.js 14, providing essential tools for FPL managers to analyze performance, track trends, and make informed decisions.

## 🚀 Features

### Analysis Tools
- **Live League Leaderboard** - Real-time league standings and performance tracking
- **Luck vs Median Analysis** - Compare your points against the median score to measure luck
- **Captain ROI Tracker** - Analyze captaincy decisions and their effectiveness
- **Transfer Impact Analysis** - Track transfer activity and costs with real historical data
- **Chip Effectiveness** - Monitor usage and timing of wildcard, free hit, bench boost, and triple captain
- **Fixture Run Planner** - Analyze upcoming fixture difficulty for all teams with difficulty ratings
- **Effective Ownership (EO)** - Calculate effective ownership including captaincy weighting
- **Weekly Review Generator** - Automated performance reviews with insights and suggestions

### Key Features
- **Public API Access** - No authentication required, works with public FPL endpoints
- **Real Data Only** - Displays accurate data from official FPL API, no fake/simulated information
- **Responsive Design** - Optimized for desktop and mobile viewing
- **Professional UI** - Clean, modern interface built with shadcn/ui components
- **Performance Optimized** - Efficient caching and data fetching strategies

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Validation**: Zod
- **Testing**: Vitest
- **Code Quality**: ESLint + Prettier



## 📖 Usage

### Getting Started
1. Visit the homepage for an overview of all available tools
2. Use the navigation tabs to access different analysis features
3. Enter your FPL entry ID or league ID when prompted
4. Explore the insights and analysis provided

### Finding Your IDs
- **Entry ID**: Found in the URL when viewing your FPL team (e.g., `fantasy.premierleague.com/entry/1234567/`)
- **League ID**: Found in the URL of your mini-league page (e.g., `fantasy.premierleague.com/leagues/123456/standings/`)

### Analysis Tools Guide

#### Live League Leaderboard
Monitor real-time standings for your mini-leagues with detailed performance metrics.

#### Luck vs Median
Understand how much luck has influenced your season by comparing your scores against the median performance.

#### Captain ROI Tracker  
Analyze your captaincy decisions to identify patterns and improve future choices.

#### Transfer Impact Analysis
View your transfer history with real data showing:
- Transfer counts per gameweek
- Points cost from hits taken
- Transfer timing and frequency

#### Chip Effectiveness
Track your chip usage and get recommendations for optimal timing of remaining chips.

#### Fixture Run Planner
Plan transfers around fixture difficulty with:
- Color-coded difficulty ratings
- Home/away fixture analysis
- Blank and double gameweek identification

#### Effective Ownership
Calculate weighted ownership including captaincy to identify template vs differential players.

#### Weekly Review Generator
Get automated performance reviews with:
- Gameweek-by-gameweek analysis
- Key decision breakdowns
- Strategic recommendations



## 🔌 API Integration

The application integrates with the official Fantasy Premier League API:

### Public Endpoints Used
- `/api/bootstrap-static/` - Game data, players, teams, events
- `/api/fixtures/` - Fixture information and difficulty ratings
- `/api/leagues-classic/{id}/standings/` - League standings
- `/api/entry/{id}/` - Manager basic information
- `/api/entry/{id}/history/` - Manager historical data

### Caching Strategy
- **Bootstrap data**: 10 minutes (large, changes infrequently)
- **League standings**: 5 minutes (moderate size, updates regularly)
- **Entry data**: 10 minutes (personal data, moderate update frequency)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future Enhancements

- Player performance trends and analytics
- Advanced statistical modeling
- Export functionality for data
- Mobile app companion
- More detailed fixture analysis
- Custom league comparisons
