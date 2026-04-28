import { useMemo, useState } from "react";
import type { Currency } from "@/domain/types";
import { CURRENCY_RANGES } from "@/domain/pricing/pricingRules";
import { getQuote } from "@/domain/pricing/getQuote";

export function useFeeCalculator(initialCurrency: Currency = "BTC") {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [amount, setAmount] = useState(CURRENCY_RANGES[initialCurrency].min * 10);

  const range = CURRENCY_RANGES[currency];
  const quote = useMemo(() => getQuote(currency, amount), [currency, amount]);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    setAmount(CURRENCY_RANGES[c].min * 10);
  };

  const setAmountSafe = (v: number) => {
    if (Number.isNaN(v)) return;
    setAmount(Math.min(Math.max(v, range.min), range.max));
  };

  return { currency, amount, range, quote, setCurrency, setAmount: setAmountSafe };
}
