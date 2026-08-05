/**
 * dividend calculator 核心纯函数。
 *
 * 全部为纯函数(无副作用、无 I/O),可单测(vitest)。
 * 所有百分比输入为「数值」形式:如 5% 传 5(内部换算),输出金额一律美元。
 * 公式:
 *   - 股息率 = 每股年股息 ÷ 股价 × 100
 *   - 年化股息(按月付)= 每股月股息 × 12
 *   - 未来股息 = D0 × (1 + g)^n(复合增长)
 *   - DRIP:逐年「股息 → 再投资 → 股份累积」复利模拟
 *   - 月股息收入 = 投入 × 年收益率 ÷ 12
 *   - 支付率 = DPS ÷ EPS × 100
 */

export interface DividendYieldInput {
  /** 每股年股息(美元) */
  annualDividendPerShare: number;
  /** 每股股价(美元) */
  price: number;
}

export interface DividendGrowthInput {
  /** 当前每股年股息 D0(美元) */
  currentDividend: number;
  /** 年股息增长率(%数值,如 5) */
  growthRatePct: number;
  /** 年数 */
  years: number;
}

export interface DripInput {
  /** 初始投入(美元) */
  initialInvestment: number;
  /** 初始股价(美元) */
  price: number;
  /** 初始年股息率(%数值) */
  dividendYieldPct: number;
  /** 股息年增长率(%数值) */
  dividendGrowthPct: number;
  /** 股价年增长率(%数值) */
  priceGrowthPct: number;
  /** 每月追加投入(美元,可为 0) */
  monthlyContribution: number;
  /** 年数 */
  years: number;
}

export interface MonthlyIncomeInput {
  /** 投入本金(美元) */
  investment: number;
  /** 年股息率(%数值) */
  dividendYieldPct: number;
}

export interface PayoutRatioInput {
  /** 每股年股息(美元) */
  dividendPerShare: number;
  /** 每股收益(美元) */
  earningsPerShare: number;
}

export interface DripResult {
  /** 期末股份数 */
  shares: number;
  /** 期末股价(美元) */
  finalPrice: number;
  /** 期末组合市值(美元) */
  finalValue: number;
  /** 累计投入(本金,美元) */
  totalInvested: number;
  /** 累计收到的股息(美元) */
  totalDividends: number;
  /** 期末年股息收入(美元) */
  finalAnnualDividendIncome: number;
}

/** 年化每股股息:传入月股息时 ×12。 */
export function annualizeDividend(dividend: number, isMonthly: boolean): number {
  return isMonthly ? dividend * 12 : dividend;
}

/** 股息率(%)。 */
export function dividendYield(input: DividendYieldInput): number {
  if (input.price <= 0 || input.annualDividendPerShare < 0) return NaN;
  return (input.annualDividendPerShare / input.price) * 100;
}

/** 给定股息率反推每股年股息(供 UI 展示用)。 */
export function dividendPerShareFromYield(price: number, yieldPct: number): number {
  return price * (yieldPct / 100);
}

/** 第 n 年后每股年股息(D0 × (1+g)^n)。 */
export function futureDividend(input: DividendGrowthInput): number {
  if (input.years < 0 || input.growthRatePct < -100) return NaN;
  const g = 1 + input.growthRatePct / 100;
  return input.currentDividend * Math.pow(g, input.years);
}

/** 未来 n 年累计收到的股息(几何级数求和: D0·((1+g)^n − 1)/g, g=0 时 = D0·n)。 */
export function cumulativeDividends(input: DividendGrowthInput): number {
  if (input.years < 0) return NaN;
  const g = input.growthRatePct / 100;
  if (Math.abs(g) < 1e-9) return input.currentDividend * input.years;
  return input.currentDividend * (Math.pow(1 + g, input.years) - 1) / g;
}

/** 月股息收入(美元)。 */
export function monthlyDividendIncome(input: MonthlyIncomeInput): number {
  if (input.dividendYieldPct < 0) return NaN;
  return (input.investment * (input.dividendYieldPct / 100)) / 12;
}

/** 股息支付率(%),>100 表示股息超过盈利(可持续性警示)。 */
export function payoutRatio(input: PayoutRatioInput): number {
  if (input.earningsPerShare <= 0) return NaN;
  return (input.dividendPerShare / input.earningsPerShare) * 100;
}

/**
 * DRIP(股息再投资)逐年模拟。
 *
 * 逐年:期初股息率随股息增长率提升 → 年股息 = 股份×股价×当期股息率
 *  → 股息按当期股价再投资(股份 += 股息/股价)→ 股价按 priceGrowthPct 增长
 *  → 每月追加投入按当期股价买入。
 * 输出期末股份/市值/累计投入/累计股息。
 */
export function dripCalculator(input: DripInput): DripResult {
  if (input.initialInvestment < 0 || input.price <= 0 || input.years < 0) {
    return { shares: NaN, finalPrice: NaN, finalValue: NaN,
             totalInvested: NaN, totalDividends: NaN, finalAnnualDividendIncome: NaN };
  }
  let shares = input.initialInvestment / input.price;
  let price = input.price;
  let yieldPct = input.dividendYieldPct;
  let totalDividends = 0;
  let totalInvested = input.initialInvestment;

  for (let y = 1; y <= input.years; y++) {
    // 本年股息(基于本年收益率)
    const dividend = shares * price * (yieldPct / 100);
    totalDividends += dividend;
    // 再投资 + 追加投入
    const annualContribution = input.monthlyContribution * 12;
    totalInvested += annualContribution;
    shares += dividend / price + annualContribution / price;
    // 年末股价增长 + 股息率增长
    price *= 1 + input.priceGrowthPct / 100;
    yieldPct *= 1 + input.dividendGrowthPct / 100;
  }
  return {
    shares,
    finalPrice: price,
    finalValue: shares * price,
    totalInvested,
    totalDividends,
    finalAnnualDividendIncome: shares * price * (yieldPct / 100),
  };
}
