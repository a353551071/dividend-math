# dividend-math

[![CI](https://github.com/a353551071/dividend-math/actions/workflows/test.yml/badge.svg)](https://github.com/a353551071/dividend-math/actions/workflows/test.yml) [![npm](https://img.shields.io/npm/v/dividend-math)](https://www.npmjs.com/package/dividend-math) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A tiny, zero-dependency TypeScript library for dividend math: yield, growth, DRIP reinvestment, monthly income and payout ratio. Pure functions, fully tested.

No frameworks. No runtime dependencies. Just one file of pure functions you can drop into any project — browser, Node, or edge.

## ✨ Features

- **8 pure functions** — no side effects, no I/O, easy to test and tree-shake
- **Zero runtime deps** — only TypeScript as a dev dependency
- **DRIP compounding simulator** — year-by-year dividend reinvestment model
- **Fully tested** — vitest unit tests covering edge cases (zero price, zero growth, invalid input)
- **Typed** — full TypeScript types and interfaces exported

## 📦 Install

```bash
npm install dividend-math
```

…or just copy [`src/dividend.ts`](src/dividend.ts) into your project. It’s a single file with no imports.

## 🚀 Quick example

```ts
import {
  dripCalculator,
  dividendYield,
  monthlyDividendIncome,
  payoutRatio,
} from 'dividend-math';

// 1. Dividend yield: $2.80 annual dividend on an $80 share
dividendYield({ annualDividendPerShare: 2.8, price: 80 }); // → 3.5 (%)

// 2. Project a 15-year DRIP for a quality dividend ETF (SCHD-style)
const result = dripCalculator({
  initialInvestment: 10000,
  price: 80,
  dividendYieldPct: 3.5,
  dividendGrowthPct: 10,
  priceGrowthPct: 7,
  monthlyContribution: 100,
  years: 15,
});
// → { shares, finalPrice, finalValue, totalInvested, totalDividends, finalAnnualDividendIncome }

// 3. Monthly income from a high-yield position
monthlyDividendIncome({ investment: 50000, dividendYieldPct: 13 }); // → ~541.67/month

// 4. Payout-ratio sustainability check
payoutRatio({ dividendPerShare: 2, earningsPerShare: 5 }); // → 40 (%)
```

## 🖥️ Live demo

Want to see these formulas in action without wiring up code? I built a free
**[dividend calculator](https://www.dividendpayoutcalculator.com)** using these
exact functions — DRIP, yield, growth, monthly income, plus dedicated
[SCHD](https://www.dividendpayoutcalculator.com/calculators/schd-dividend-calculator)
and
[QQQI](https://www.dividendpayoutcalculator.com/calculators/qqqi-dividend-calculator)
calculators.

## 📖 API

All percentage inputs are numeric: pass `5` for 5% (the function converts internally). Money is in dollars.

### `annualizeDividend(dividend, isMonthly)` → `number`
Convert a monthly dividend to annual (`×12`). `isMonthly=false` returns the input unchanged.

### `dividendYield({ annualDividendPerShare, price })` → `number`
Dividend yield as a percentage. Returns `NaN` if price ≤ 0.

### `dividendPerShareFromYield(price, yieldPct)` → `number`
Reverse: given a target yield, compute the annual dividend per share.

### `futureDividend({ currentDividend, growthRatePct, years })` → `number`
Per-share dividend `n` years out: `D0 × (1 + g)^n`.

### `cumulativeDividends({ currentDividend, growthRatePct, years })` → `number`
Sum of dividends over `n` years (geometric series). Handles `g = 0`.

### `monthlyDividendIncome({ investment, dividendYieldPct })` → `number`
Monthly cash flow: `investment × yield ÷ 12`.

### `payoutRatio({ dividendPerShare, earningsPerShare })` → `number`
Payout ratio as a percentage. `>100%` signals an unsustainable dividend. Returns `NaN` if EPS ≤ 0.

### `dripCalculator(input)` → `DripResult`
Year-by-year DRIP (dividend reinvestment) simulation. Each year: dividends are computed at the current yield, reinvested into more shares at the current price, then price grows by `priceGrowthPct` and yield grows by `dividendGrowthPct`. Monthly contributions buy shares at the current price.

```ts
interface DripInput {
  initialInvestment: number;
  price: number;
  dividendYieldPct: number;
  dividendGrowthPct: number;
  priceGrowthPct: number;
  monthlyContribution: number;
  years: number;
}

interface DripResult {
  shares: number;                       // shares owned at end
  finalPrice: number;                   // share price at end
  finalValue: number;                   // portfolio market value at end
  totalInvested: number;                // sum of all contributions
  totalDividends: number;               // cumulative dividends received
  finalAnnualDividendIncome: number;    // projected annual income at end
}
```

## 🧪 Testing

```bash
npm install
npm test    # 16 vitest unit tests
```

## 📄 License

MIT — use it anywhere. Issues and PRs welcome.
