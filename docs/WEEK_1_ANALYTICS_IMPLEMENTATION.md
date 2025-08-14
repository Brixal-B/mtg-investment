# Week 1B: Enhanced Portfolio Analytics Implementation

## Phase 1: Real-Time Analytics Infrastructure (Day 4)

### 1.1 Historical Data Tracking
```sql
-- Portfolio snapshots for historical analysis
CREATE TABLE portfolio_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  total_investment DECIMAL(12,2) NOT NULL,
  card_count INTEGER NOT NULL,
  unique_cards INTEGER NOT NULL,
  unrealized_gains DECIMAL(12,2) NOT NULL,
  metadata TEXT, -- JSON with detailed breakdown
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Performance tracking
CREATE TABLE portfolio_performance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  period TEXT NOT NULL, -- '1d', '1w', '1m', '3m', '6m', '1y'
  value_change DECIMAL(12,2) NOT NULL,
  percentage_change DECIMAL(5,2) NOT NULL,
  benchmark_comparison DECIMAL(5,2),
  volatility DECIMAL(5,2),
  sharpe_ratio DECIMAL(5,4),
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Card performance tracking
CREATE TABLE card_performance (
  id TEXT PRIMARY KEY,
  card_uuid TEXT NOT NULL,
  user_id TEXT NOT NULL,
  period TEXT NOT NULL,
  price_change DECIMAL(10,2) NOT NULL,
  percentage_change DECIMAL(5,2) NOT NULL,
  volume_impact DECIMAL(5,2), -- impact based on quantity owned
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_uuid) REFERENCES cards(uuid),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 1.2 Analytics Service Layer
Create `/src/lib/portfolio-analytics.ts` with:
- Historical data aggregation
- Performance calculations (ROI, volatility, Sharpe ratio)
- Benchmark comparisons (vs MTG market index)
- Trend analysis algorithms

## Phase 2: Interactive Charts & Visualizations (Day 4-5)

### 2.1 Chart Library Integration
Install charting libraries:
```bash
npm install recharts @tremor/react react-chartjs-2 chart.js
```

### 2.2 Chart Components
Create chart components in `/src/components/charts/`:

#### **PortfolioValueChart.tsx**
- Line chart showing portfolio value over time
- Multiple time periods (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
- Interactive hover with exact values
- Zoom and pan capabilities

#### **ProfitLossChart.tsx**
- Waterfall chart showing gains/losses by card
- Color-coded performance (green gains, red losses)
- Interactive click to drill down to card details

#### **PerformanceComparisonChart.tsx**
- Multi-line chart comparing portfolio vs benchmarks
- MTG market index comparison
- S&P 500 comparison (for context)
- Custom benchmark creation

#### **DiversificationHeatmap.tsx**
- Enhanced heat map visualization
- Multiple views: Set, Color, Rarity, Type, Format
- Interactive hover showing exact values
- Drill-down capability

### 2.3 Advanced Analytics Widgets

#### **MarketTrendAnalysis.tsx**
```tsx
interface MarketTrendData {
  trending_up: MTGCard[];
  trending_down: MTGCard[];
  highest_volume: MTGCard[];
  biggest_gainers: MTGCard[];
  biggest_losers: MTGCard[];
  market_sentiment: 'bullish' | 'bearish' | 'neutral';
}
```

#### **RiskAssessment.tsx**
```tsx
interface RiskMetrics {
  portfolio_volatility: number;
  concentration_risk: number; // based on top holdings %
  liquidity_risk: number; // based on card rarity/demand
  format_risk: number; // exposure to format legality changes
  overall_risk_score: 'low' | 'medium' | 'high';
}
```

## Phase 3: Real-Time Data Processing (Day 5-6)

### 3.1 Background Analytics Jobs
Create scheduled jobs in `/src/lib/jobs/`:

#### **daily-portfolio-snapshot.ts**
- Runs every night at 2 AM
- Calculates portfolio values for all users
- Stores historical snapshots
- Triggers performance calculations

#### **price-change-analyzer.ts**
- Runs every 4 hours
- Analyzes price movements for user's cards
- Identifies significant changes (>5% moves)
- Generates alerts/notifications

#### **market-trend-scanner.ts**
- Runs every hour during market hours
- Scans for trending cards
- Analyzes volume patterns
- Updates market sentiment indicators

### 3.2 Real-Time API Endpoints

#### `/api/analytics/portfolio-timeline`
```typescript
interface PortfolioTimelineResponse {
  data: {
    date: string;
    total_value: number;
    daily_change: number;
    daily_change_percent: number;
  }[];
  period: string;
  total_return: number;
  annualized_return: number;
  max_drawdown: number;
}
```

#### `/api/analytics/performance-breakdown`
```typescript
interface PerformanceBreakdown {
  best_performers: {
    card: MTGCard;
    gain_amount: number;
    gain_percent: number;
    contribution_to_return: number;
  }[];
  worst_performers: {
    card: MTGCard;
    loss_amount: number;
    loss_percent: number;
    impact_on_return: number;
  }[];
  sector_performance: {
    category: string; // set, color, rarity, etc.
    return_percent: number;
    contribution: number;
  }[];
}
```

## Phase 4: Advanced Portfolio Features (Day 6-7)

### 4.1 Goal Tracking System
```sql
CREATE TABLE portfolio_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_type TEXT NOT NULL, -- 'value_target', 'card_acquisition', 'profit_target'
  target_value DECIMAL(12,2),
  target_date DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### **GoalTracker.tsx** Component
- Visual progress bars toward goals
- Projected timeline based on current performance
- Milestone celebrations
- Goal adjustment recommendations

### 4.2 Portfolio Optimization Suggestions
Create `/src/lib/portfolio-optimizer.ts`:

#### **DiversificationAnalyzer**
- Identifies concentration risks
- Suggests rebalancing opportunities
- Recommends diversification by set/color/format

#### **ValueOptimizer**
- Identifies underperforming cards to sell
- Suggests high-potential acquisitions
- Analyzes cost basis optimization

#### **RiskManagement**
- Portfolio stress testing
- "What-if" scenario analysis
- Hedge recommendations

### 4.3 Export & Reporting
#### **PortfolioReport.tsx**
- Comprehensive PDF reports
- Executive summary
- Detailed performance analysis
- Tax reporting helpers (cost basis, gains/losses)

#### **DataExport.tsx**
- CSV/Excel export of all data
- API integration for external tools
- Backup/restore functionality

## Implementation Priority

### 🔥 **Critical Path (Days 4-5)**
1. Historical data infrastructure
2. Basic portfolio value charting
3. Performance calculations
4. Real-time API endpoints

### 🚀 **High Impact (Days 5-6)**
1. Interactive charts and visualizations
2. Market trend analysis
3. Background analytics jobs
4. Performance breakdown views

### ⭐ **Nice-to-Have (Day 7)**
1. Goal tracking system
2. Portfolio optimization suggestions
3. Advanced reporting features
4. Export functionality

## Technical Integration

### Database Migrations
- Add new analytics tables
- Create proper indexes for time-series queries
- Set up data retention policies

### API Architecture
- Background job queue (Bull/Agenda)
- Real-time updates (WebSocket/SSE)
- Caching layer (Redis) for analytics

### Frontend State Management
- Redux Toolkit Query for analytics data
- Real-time subscriptions
- Optimistic updates for better UX

## Testing Strategy

### Unit Tests
- Analytics calculation functions
- Chart component rendering
- Data transformation utilities

### Integration Tests
- Full analytics pipeline
- Background job execution
- API endpoint responses

### Performance Tests
- Time-series query optimization
- Chart rendering with large datasets
- Memory usage with real-time updates

## Demo Data
Populate with realistic scenarios:
- Multiple time periods of data
- Various market conditions (bull/bear)
- Different portfolio sizes and strategies
- Representative card price movements
