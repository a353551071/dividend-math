import { describe, it, expect } from 'vitest';
import {
  annualizeDividend,
  dividendYield,
  dividendPerShareFromYield,
  futureDividend,
  cumulativeDividends,
  monthlyDividendIncome,
  payoutRatio,
  dripCalculator,
} from '../src/dividend';

describe('dividendYield', () => {
  it('$2 annual dividend on $100 price → 2%', () => {
    expect(dividendYield({ annualDividendPerShare: 2, price: 100 })).toBeCloseTo(2, 6);
  });

  it('$0.5 monthly dividend → $6 annual; on $100 price → 6%', () => {
    const annual = annualizeDividend(0.5, true);
    expect(annual).toBeCloseTo(6, 6);
    expect(dividendYield({ annualDividendPerShare: annual, price: 100 })).toBeCloseTo(6, 6);
  });

  it('price of 0 → NaN', () => {
    expect(Number.isNaN(dividendYield({ annualDividendPerShare: 2, price: 0 }))).toBe(true);
  });
});

describe('dividendPerShareFromYield', () => {
  it('$100 price, 3% yield → $3 annual dividend', () => {
    expect(dividendPerShareFromYield(100, 3)).toBeCloseTo(3, 6);
  });
});

describe('futureDividend', () => {
  it('D0=2, 5% growth, 10 years → 2×1.05^10 ≈ 3.2578', () => {
    expect(futureDividend({ currentDividend: 2, growthRatePct: 5, years: 10 })).toBeCloseTo(3.2578, 3);
  });

  it('0 years → equals D0', () => {
    expect(futureDividend({ currentDividend: 2, growthRatePct: 5, years: 0 })).toBeCloseTo(2, 6);
  });

  it('0% growth → D0 unchanged', () => {
    expect(futureDividend({ currentDividend: 2, growthRatePct: 0, years: 10 })).toBeCloseTo(2, 6);
  });
});

describe('cumulativeDividends', () => {
  it('D0=2, 5% growth, 10 years → geometric series 2·(1.05^10−1)/0.05 ≈ 25.156', () => {
    expect(cumulativeDividends({ currentDividend: 2, growthRatePct: 5, years: 10 })).toBeCloseTo(25.156, 3);
  });

  it('0% growth → D0 × years', () => {
    expect(cumulativeDividends({ currentDividend: 2, growthRatePct: 0, years: 5 })).toBeCloseTo(10, 6);
  });
});

describe('monthlyDividendIncome', () => {
  it('$10000 at 6% annual yield → $50/month', () => {
    expect(monthlyDividendIncome({ investment: 10000, dividendYieldPct: 6 })).toBeCloseTo(50, 6);
  });
});

describe('payoutRatio', () => {
  it('DPS=2, EPS=5 → 40%', () => {
    expect(payoutRatio({ dividendPerShare: 2, earningsPerShare: 5 })).toBeCloseTo(40, 6);
  });

  it('EPS=0 → NaN', () => {
    expect(Number.isNaN(payoutRatio({ dividendPerShare: 2, earningsPerShare: 0 }))).toBe(true);
  });
});

describe('dripCalculator', () => {
  it('no growth → shares grow only from dividend reinvestment', () => {
    const r = dripCalculator({
      initialInvestment: 10000, price: 100, dividendYieldPct: 4,
      dividendGrowthPct: 0, priceGrowthPct: 0, monthlyContribution: 0, years: 5,
    });
    expect(r.totalInvested).toBeCloseTo(10000, 6);
    expect(r.shares).toBeGreaterThan(100); // reinvestment grows share count
    expect(r.finalValue).toBeGreaterThan(10000); // positive total return
    expect(r.totalDividends).toBeGreaterThan(0);
  });

  it('10 years + $100/month → total invested = 10000 + 100×12×10 = 22000', () => {
    const r = dripCalculator({
      initialInvestment: 10000, price: 100, dividendYieldPct: 3,
      dividendGrowthPct: 4, priceGrowthPct: 5, monthlyContribution: 100, years: 10,
    });
    expect(r.totalInvested).toBeCloseTo(22000, 3);
  });

  it('final value exceeds total invested in a reasonable growth scenario', () => {
    const r = dripCalculator({
      initialInvestment: 10000, price: 100, dividendYieldPct: 4,
      dividendGrowthPct: 6, priceGrowthPct: 7, monthlyContribution: 200, years: 20,
    });
    expect(r.finalValue).toBeGreaterThan(r.totalInvested);
  });

  it('invalid input (price ≤ 0) → NaN', () => {
    const r = dripCalculator({
      initialInvestment: 10000, price: 0, dividendYieldPct: 4,
      dividendGrowthPct: 0, priceGrowthPct: 0, monthlyContribution: 0, years: 5,
    });
    expect(Number.isNaN(r.shares)).toBe(true);
  });
});
