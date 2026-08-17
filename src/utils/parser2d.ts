import { BetItem } from "../types";

// Convert Burmese numeral characters to English digits
export function normalizeBurmeseNumerals(text: string): string {
  const burmeseDigits: Record<string, string> = {
    "၀": "0",
    "၁": "1",
    "၂": "2",
    "၃": "3",
    "၄": "4",
    "၅": "5",
    "၆": "6",
    "၇": "7",
    "၈": "8",
    "၉": "9",
  };
  return text.replace(/[၀-၉]/g, (ch) => burmeseDigits[ch] || ch);
}

// Special 2D predefined sets
export const FORMULA_PRESETS = {
  // အပူး (10 numbers)
  TWINS: ["00", "11", "22", "33", "44", "55", "66", "77", "88", "99"],
  // နက္ခတ် (10 numbers)
  NATKHAT: ["07", "70", "18", "81", "24", "42", "35", "53", "46", "64"],
  // ပါဝါ (10 numbers)
  POWER: ["05", "50", "16", "61", "27", "72", "38", "83", "49", "94"],
  // ညီကို (20 numbers)
  BROTHERS: [
    "01", "10", "12", "21", "23", "32", "34", "43", "45", "54",
    "56", "65", "67", "76", "78", "87", "89", "98", "90", "09",
  ],
  // ဆယ်ပြည့် (10 numbers)
  TENS: ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"],
  // စုံစုံ (25 numbers)
  EVEN_EVEN: [
    "00", "02", "04", "06", "08",
    "20", "22", "24", "26", "28",
    "40", "42", "44", "46", "48",
    "60", "62", "64", "66", "68",
    "80", "82", "84", "86", "88",
  ],
  // မမ (25 numbers)
  ODD_ODD: [
    "11", "13", "15", "17", "19",
    "31", "33", "35", "37", "39",
    "51", "53", "55", "57", "59",
    "71", "73", "75", "77", "79",
    "91", "93", "95", "97", "99",
  ],
  // စုံမ (25 numbers)
  EVEN_ODD: [
    "01", "03", "05", "07", "09",
    "21", "23", "25", "27", "29",
    "41", "43", "45", "47", "49",
    "61", "63", "65", "67", "69",
    "81", "83", "85", "87", "89",
  ],
  // မစုံ (25 numbers)
  ODD_EVEN: [
    "10", "12", "14", "16", "18",
    "30", "32", "34", "36", "38",
    "50", "52", "54", "56", "58",
    "70", "72", "74", "76", "78",
    "90", "92", "94", "96", "98",
  ],
};

// Generate round (အပတ် / ပတ်) for a given digit e.g. '7' -> 19 numbers
export function generateRound(digit: string): string[] {
  const d = parseInt(digit, 10);
  if (isNaN(d) || d < 0 || d > 9) return [];
  const set = new Set<string>();
  for (let i = 0; i <= 9; i++) {
    set.add(`${d}${i}`);
    set.add(`${i}${d}`);
  }
  return Array.from(set).sort();
}

// Generate head (ထိပ်) for a digit e.g. '5' -> 50 to 59
export function generateHead(digit: string): string[] {
  const d = parseInt(digit, 10);
  if (isNaN(d) || d < 0 || d > 9) return [];
  const res: string[] = [];
  for (let i = 0; i <= 9; i++) {
    res.push(`${d}${i}`);
  }
  return res;
}

// Generate tail (နောက် / ပိတ်) for a digit e.g. '3' -> 03, 13 ... 93
export function generateTail(digit: string): string[] {
  const d = parseInt(digit, 10);
  if (isNaN(d) || d < 0 || d > 9) return [];
  const res: string[] = [];
  for (let i = 0; i <= 9; i++) {
    res.push(`${i}${d}`);
  }
  return res;
}

// Generate permutations for Khway (အခွေ) from unique digits e.g. "1234" -> 12 pairs
export function generateKhway(digitsStr: string, includeDoubles = false): string[] {
  const uniqueDigits = Array.from(new Set(digitsStr.split("").filter((c) => /\d/.test(c))));
  if (uniqueDigits.length < 2) return [];
  const result: string[] = [];
  for (let i = 0; i < uniqueDigits.length; i++) {
    for (let j = 0; j < uniqueDigits.length; j++) {
      if (i !== j || includeDoubles) {
        result.push(`${uniqueDigits[i]}${uniqueDigits[j]}`);
      }
    }
  }
  return result.sort();
}

// Reverse pairs for numbers (R / r / အာ / အပြန်)
export function reverseNumber(num: string): string {
  if (num.length !== 2) return num;
  return `${num[1]}${num[0]}`;
}

export interface ParseOutput {
  items: BetItem[];
  totalAmount: number;
  unparsedLines: string[];
  recognizedFormulas: { formula: string; count: number; subtotal: number }[];
}

/**
 * Main parser that parses any 2D slip text format (Viber, Messenger, handwritten transcription)
 */
export function parseSlipText(rawInput: string): ParseOutput {
  const normalized = normalizeBurmeseNumerals(rawInput);
  const lines = normalized.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  const itemsMap: Map<string, number> = new Map();
  const unparsedLines: string[] = [];
  const formulaCounts: Map<string, { count: number; subtotal: number }> = new Map();

  function recordFormula(formulaName: string, count: number, subtotal: number) {
    const existing = formulaCounts.get(formulaName) || { count: 0, subtotal: 0 };
    formulaCounts.set(formulaName, {
      count: existing.count + count,
      subtotal: existing.subtotal + subtotal,
    });
  }

  for (const originalLine of lines) {
    let line = originalLine.trim();

    // Skip comment lines or greetings like 'မင်္ဂလာပါ', 'slip', 'ထိုးမည်'
    if (/^(မင်္ဂလာပါ|မင်္ဂလာ|hi|hello|ok|date|customer|name)/i.test(line)) {
      continue;
    }

    // Try parsing line
    let matched = false;

    // 1. Twins: အပူး / ပူး / twins e.g. "အပူး 500", "ပူး = 500", "twins 1000", "ပူး-500"
    const twinsMatch = line.match(/(?:အပူး|ပူး|twin|twins|ပူ)[\s:=_-]*(\d+)/i);
    if (twinsMatch) {
      const amount = parseInt(twinsMatch[1], 10);
      if (amount > 0) {
        FORMULA_PRESETS.TWINS.forEach((num) => {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        });
        recordFormula("အပူး (Twins)", 10, amount * 10);
        matched = true;
        continue;
      }
    }

    // 2. Natkhat: နက္ခတ် / natkhat e.g. "နက္ခတ် 500", "နက္ခတ် = 1000"
    const natkhatMatch = line.match(/(?:နက္ခတ်|နခတ်|နက်ခတ်|natkhat)[\s:=_-]*(\d+)/i);
    if (natkhatMatch) {
      const amount = parseInt(natkhatMatch[1], 10);
      if (amount > 0) {
        FORMULA_PRESETS.NATKHAT.forEach((num) => {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        });
        recordFormula("နက္ခတ် (Natkhat)", 10, amount * 10);
        matched = true;
        continue;
      }
    }

    // 3. Power: ပါဝါ / power e.g. "ပါဝါ 500", "ပါဝါ = 1000"
    const powerMatch = line.match(/(?:ပါဝါ|power)[\s:=_-]*(\d+)/i);
    if (powerMatch) {
      const amount = parseInt(powerMatch[1], 10);
      if (amount > 0) {
        FORMULA_PRESETS.POWER.forEach((num) => {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        });
        recordFormula("ပါဝါ (Power)", 10, amount * 10);
        matched = true;
        continue;
      }
    }

    // 4. Brothers: ညီကို / brothers e.g. "ညီကို 500"
    const brotherMatch = line.match(/(?:ညီကို|ညီအစ်ကို|brother|brothers)[\s:=_-]*(\d+)/i);
    if (brotherMatch) {
      const amount = parseInt(brotherMatch[1], 10);
      if (amount > 0) {
        FORMULA_PRESETS.BROTHERS.forEach((num) => {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        });
        recordFormula("ညီကို (Brothers)", 20, amount * 20);
        matched = true;
        continue;
      }
    }

    // 5. Tens: ဆယ်ပြည့် e.g. "ဆယ်ပြည့် 500"
    const tensMatch = line.match(/(?:ဆယ်ပြည့်|ဆယ်ပြည့်|tens)[\s:=_-]*(\d+)/i);
    if (tensMatch) {
      const amount = parseInt(tensMatch[1], 10);
      if (amount > 0) {
        FORMULA_PRESETS.TENS.forEach((num) => {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        });
        recordFormula("ဆယ်ပြည့် (Tens)", 10, amount * 10);
        matched = true;
        continue;
      }
    }

    // 6. Even/Odd combinations: စုံစုံ, မမ, စုံမ, မစုံ
    const evenEvenMatch = line.match(/(?:စုံစုံ|စုံ\s*စုံ)[\s:=_-]*(\d+)/i);
    if (evenEvenMatch) {
      const amount = parseInt(evenEvenMatch[1], 10);
      if (amount > 0) {
        FORMULA_PRESETS.EVEN_EVEN.forEach((num) => {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        });
        recordFormula("စုံစုံ", 25, amount * 25);
        matched = true;
        continue;
      }
    }

    const oddOddMatch = line.match(/(?:မမ|မ\s*မ)[\s:=_-]*(\d+)/i);
    if (oddOddMatch) {
      const amount = parseInt(oddOddMatch[1], 10);
      if (amount > 0) {
        FORMULA_PRESETS.ODD_ODD.forEach((num) => {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        });
        recordFormula("မမ", 25, amount * 25);
        matched = true;
        continue;
      }
    }

    const evenOddMatch = line.match(/(?:စုံမ|စုံ\s*မ)[\s:=_-]*(\d+)/i);
    if (evenOddMatch) {
      const amount = parseInt(evenOddMatch[1], 10);
      if (amount > 0) {
        FORMULA_PRESETS.EVEN_ODD.forEach((num) => {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        });
        recordFormula("စုံမ", 25, amount * 25);
        matched = true;
        continue;
      }
    }

    const oddEvenMatch = line.match(/(?:မစုံ|မ\s*စုံ)[\s:=_-]*(\d+)/i);
    if (oddEvenMatch) {
      const amount = parseInt(oddEvenMatch[1], 10);
      if (amount > 0) {
        FORMULA_PRESETS.ODD_EVEN.forEach((num) => {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        });
        recordFormula("မစုံ", 25, amount * 25);
        matched = true;
        continue;
      }
    }

    // 7. Khway (အခွေ / ခွေ): e.g. "ခွေ 1234 500", "အခွေ 1234 = 500", "1234 ခွေ 500", "1234 khway 500"
    const khwayMatch1 = line.match(/(?:အခွေ|ခွေ|khway)[\s:]*(\d{2,6})[\s:=_-]+(\d+)/i);
    const khwayMatch2 = line.match(/(\d{2,6})[\s:]*(?:အခွေ|ခွေ|khway)[\s:=_-]+(\d+)/i);
    const khwayMatch = khwayMatch1 || khwayMatch2;
    if (khwayMatch) {
      const digits = khwayMatch[1];
      const amount = parseInt(khwayMatch[2], 10);
      if (amount > 0 && digits.length >= 2) {
        const nums = generateKhway(digits);
        nums.forEach((n) => {
          itemsMap.set(n, (itemsMap.get(n) || 0) + amount);
        });
        recordFormula(`ခွေ ${digits}`, nums.length, amount * nums.length);
        matched = true;
        continue;
      }
    }

    // 8. Round / Cycle (အပတ် / ပတ် / round): e.g. "7 အပတ် 500", "7 ပတ် 500", "ပတ် 7 500", "7 round 500"
    const roundMatch1 = line.match(/(\d)[\s:]*(?:အပတ်|ပတ်|round|ပတ်သီး)[\s:=_-]+(\d+)/i);
    const roundMatch2 = line.match(/(?:အပတ်|ပတ်|round|ပတ်သီး)[\s:]*(\d)[\s:=_-]+(\d+)/i);
    const roundMatch = roundMatch1 || roundMatch2;
    if (roundMatch) {
      const digit = roundMatch[1];
      const amount = parseInt(roundMatch[2], 10);
      if (amount > 0) {
        const nums = generateRound(digit);
        nums.forEach((n) => {
          itemsMap.set(n, (itemsMap.get(n) || 0) + amount);
        });
        recordFormula(`${digit} အပတ်`, nums.length, amount * nums.length);
        matched = true;
        continue;
      }
    }

    // 9. Head (ထိပ်): e.g. "3 ထိပ် 500", "ထိပ် 3 500", "3 head 500"
    const headMatch1 = line.match(/(\d)[\s:]*(?:ထိပ်|ထိတ်|head)[\s:=_-]+(\d+)/i);
    const headMatch2 = line.match(/(?:ထိပ်|ထိတ်|head)[\s:]*(\d)[\s:=_-]+(\d+)/i);
    const headMatch = headMatch1 || headMatch2;
    if (headMatch) {
      const digit = headMatch[1];
      const amount = parseInt(headMatch[2], 10);
      if (amount > 0) {
        const nums = generateHead(digit);
        nums.forEach((n) => {
          itemsMap.set(n, (itemsMap.get(n) || 0) + amount);
        });
        recordFormula(`${digit} ထိပ်`, nums.length, amount * nums.length);
        matched = true;
        continue;
      }
    }

    // 10. Tail (နောက် / ပိတ်): e.g. "8 နောက် 500", "8 ပိတ် 500", "နောက် 8 500"
    const tailMatch1 = line.match(/(\d)[\s:]*(?:နောက်|ပိတ်|tail|end)[\s:=_-]+(\d+)/i);
    const tailMatch2 = line.match(/(?:နောက်|ပိတ်|tail|end)[\s:]*(\d)[\s:=_-]+(\d+)/i);
    const tailMatch = tailMatch1 || tailMatch2;
    if (tailMatch) {
      const digit = tailMatch[1];
      const amount = parseInt(tailMatch[2], 10);
      if (amount > 0) {
        const nums = generateTail(digit);
        nums.forEach((n) => {
          itemsMap.set(n, (itemsMap.get(n) || 0) + amount);
        });
        recordFormula(`${digit} နောက်`, nums.length, amount * nums.length);
        matched = true;
        continue;
      }
    }

    // 11. Range: e.g. "01 to 09 500", "10 to 20 = 500"
    const rangeMatch = line.match(/(\d{1,2})\s*(?:to|-)\s*(\d{1,2})[\s:=_-]+(\d+)/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const amount = parseInt(rangeMatch[3], 10);
      if (!isNaN(start) && !isNaN(end) && start <= end && amount > 0 && end <= 99) {
        const rangeNums: string[] = [];
        for (let i = start; i <= end; i++) {
          const numStr = i < 10 ? `0${i}` : `${i}`;
          itemsMap.set(numStr, (itemsMap.get(numStr) || 0) + amount);
          rangeNums.push(numStr);
        }
        recordFormula(`${rangeMatch[1]}-${rangeMatch[2]} Range`, rangeNums.length, amount * rangeNums.length);
        matched = true;
        continue;
      }
    }

    // 12. Reverses: R / r / အာ / အပြန် e.g. "12,34,56 R 500", "12 R 500", "12r500", "12 အာ 500", "12 အပြန် 500"
    // Also "12=500 R", "12-500r"
    const reverseRegex1 = /([\d\s,.\/+=]+?)(?:\s*(?:[rR]|အာ|အပြန်|ပြန်))\s*[:=_-]?\s*(\d+)/i;
    const reverseRegex2 = /([\d\s,.\/+=]+?)[:=_-]\s*(\d+)\s*(?:[rR]|အာ|အပြန်|ပြန်)/i;
    const revMatch = line.match(reverseRegex1) || line.match(reverseRegex2);
    if (revMatch) {
      const numPart = revMatch[1];
      const amount = parseInt(revMatch[2], 10);
      if (amount > 0) {
        const extracted = numPart.match(/\b\d{2}\b/g);
        if (extracted && extracted.length > 0) {
          const uniqueRevNums = new Set<string>();
          for (const num of extracted) {
            uniqueRevNums.add(num);
            uniqueRevNums.add(reverseNumber(num));
          }
          uniqueRevNums.forEach((n) => {
            itemsMap.set(n, (itemsMap.get(n) || 0) + amount);
          });
          recordFormula(`${extracted.join(",")} R`, uniqueRevNums.size, amount * uniqueRevNums.size);
          matched = true;
          continue;
        }
      }
    }

    // 13. Direct list of numbers with amount: e.g. "12,34,56-500", "12.34.56=500", "12 34 56 500", "12-500", "12 500"
    // Extract last number as amount if multiple numbers present
    // Format A: numbers list followed by separator and amount: "12,34,56 = 500", "12 34 56 - 500"
    const directListMatch = line.match(/^([\d\s,.\/+=]+?)[\s:=_-]+(\d+)$/);
    if (directListMatch) {
      const numListPart = directListMatch[1];
      const amount = parseInt(directListMatch[2], 10);
      const extractedNums = numListPart.match(/\b\d{2}\b/g);
      if (extractedNums && extractedNums.length > 0 && amount > 0) {
        for (const num of extractedNums) {
          itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        }
        recordFormula(`${extractedNums.length} ဂဏန်း`, extractedNums.length, amount * extractedNums.length);
        matched = true;
        continue;
      }
    }

    // Format B: Space-separated pairs: "12 500", "34 1000", "56 200"
    const singlePairMatch = line.match(/^(\d{2})\s+(\d+)$/);
    if (singlePairMatch) {
      const num = singlePairMatch[1];
      const amount = parseInt(singlePairMatch[2], 10);
      if (amount > 0) {
        itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        recordFormula(num, 1, amount);
        matched = true;
        continue;
      }
    }

    // Format C: Compact "12/500", "12-500", "12=500"
    const compactMatch = line.match(/^(\d{2})[\/=\-:](\d+)$/);
    if (compactMatch) {
      const num = compactMatch[1];
      const amount = parseInt(compactMatch[2], 10);
      if (amount > 0) {
        itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
        recordFormula(num, 1, amount);
        matched = true;
        continue;
      }
    }

    // Format D: Multi-entries on same line separated by comma or semicolon e.g. "12-500, 34-300, 56-200"
    const subParts = line.split(/[,;\n]/).map((p) => p.trim()).filter((p) => p.length > 0);
    if (subParts.length > 1) {
      let subMatchedCount = 0;
      for (const sub of subParts) {
        const subM = sub.match(/(\d{2})[\s:=_\-]+(\d+)/);
        if (subM) {
          const num = subM[1];
          const amount = parseInt(subM[2], 10);
          if (amount > 0) {
            itemsMap.set(num, (itemsMap.get(num) || 0) + amount);
            subMatchedCount++;
          }
        }
      }
      if (subMatchedCount > 0) {
        recordFormula(`စာကြောင်းခွဲ (${subMatchedCount})`, subMatchedCount, 0);
        matched = true;
        continue;
      }
    }

    if (!matched) {
      unparsedLines.push(originalLine);
    }
  }

  // Compile final items list sorted by 2-digit number (00 to 99)
  const items: BetItem[] = [];
  let totalAmount = 0;

  const sortedNumbers = Array.from(itemsMap.keys()).sort();
  for (const num of sortedNumbers) {
    const amount = itemsMap.get(num) || 0;
    if (amount > 0) {
      items.push({
        number: num,
        amount,
      });
      totalAmount += amount;
    }
  }

  const recognizedFormulas = Array.from(formulaCounts.entries()).map(([formula, val]) => ({
    formula,
    count: val.count,
    subtotal: val.subtotal,
  }));

  return {
    items,
    totalAmount,
    unparsedLines,
    recognizedFormulas,
  };
}

/**
 * Limit checker that analyzes new slip items against existing bets and configured limits
 */
export function checkSlipLimits(
  newItems: BetItem[],
  existingSummary: Record<string, number>,
  limitSettings: { defaultLimit: number; customLimits: Record<string, number> }
) {
  const overLimitItems: {
    number: string;
    existingAmount: number;
    addingAmount: number;
    newTotal: number;
    limit: number;
    overAmount: number;
    heldAmount: number;
  }[] = [];

  let totalNewAmount = 0;
  let totalHeldAmount = 0;
  let totalOverAmount = 0;

  for (const item of newItems) {
    const limit = limitSettings.customLimits[item.number] || limitSettings.defaultLimit;
    const existing = existingSummary[item.number] || 0;
    const adding = item.amount;
    const newTotal = existing + adding;

    totalNewAmount += adding;

    if (newTotal > limit) {
      const overAmount = newTotal - limit;
      // How much of the *adding* amount can be accepted
      const remainingCapacity = Math.max(0, limit - existing);
      const heldFromAdding = remainingCapacity;
      const overFromAdding = adding - heldFromAdding;

      totalHeldAmount += heldFromAdding;
      totalOverAmount += overFromAdding;

      overLimitItems.push({
        number: item.number,
        existingAmount: existing,
        addingAmount: adding,
        newTotal,
        limit,
        overAmount,
        heldAmount: heldFromAdding,
      });
    } else {
      totalHeldAmount += adding;
    }
  }

  return {
    isOverLimit: overLimitItems.length > 0,
    overLimitItems,
    totalNewAmount,
    totalHeldAmount,
    totalOverAmount,
  };
}

/**
 * Format items back to clean exportable 2D slip string
 */
export function formatSlipForExport(
  items: BetItem[],
  customerName = "",
  session = "morning",
  date = ""
): string {
  const header = `=== 2D SLIP ===\nCustomer: ${customerName || "General"}\nDate: ${date} (${session === "morning" ? "12:01 PM" : "4:30 PM"})\n----------------`;
  const body = items.map((it) => `${it.number} = ${it.amount.toLocaleString()}`).join("\n");
  const total = items.reduce((sum, it) => sum + it.amount, 0);
  const footer = `----------------\nTotal Items: ${items.length}\nTotal Amount: ${total.toLocaleString()} Baht`;
  return `${header}\n${body}\n${footer}`;
}

/**
 * Format over-limit items for offload / cut export (အပြင်လွှဲစလစ်)
 */
export function formatOverLimitSlipForExport(
  overItems: { number: string; overAmount: number }[],
  note = "အပြင်လွှဲ/ပိုငွေ စာရင်း"
): string {
  const header = `=== 2D ${note} ===\nTime: ${new Date().toLocaleTimeString()}\n----------------`;
  const body = overItems
    .filter((it) => it.overAmount > 0)
    .map((it) => `${it.number} = ${it.overAmount.toLocaleString()}`)
    .join("\n");
  const total = overItems.reduce((sum, it) => sum + (it.overAmount || 0), 0);
  const footer = `----------------\nTotal Numbers: ${overItems.length}\nTotal Over: ${total.toLocaleString()} Baht`;
  return `${header}\n${body}\n${footer}`;
}
