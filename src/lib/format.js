// Currency & date formatting helpers (Arabic)

export function formatCurrency(amount, symbol = "ر.ي") {
  const n = Number(amount) || 0;
  return `${n.toLocaleString("en-US")} ${symbol}`;
}

export function formatNumber(n) {
  return (Number(n) || 0).toLocaleString("en-US");
}

export function formatDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

export function formatDateTime(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return d;
  }
}

export const EXPENSE_CATEGORIES = {
  internet: "إنترنت",
  electricity: "كهرباء",
  maintenance: "صيانة",
  transport: "مواصلات",
  salaries: "رواتب",
  rent: "إيجار",
  tools: "أدوات",
  other: "أخرى"
};

export const CASH_SOURCES = {
  sale: "مبيعات",
  collection: "تحصيلات",
  expense: "مصروفات",
  line_payment: "دفعات خطوط",
  owner_withdrawal: "سحب مالك",
  opening: "رصيد افتتاحي"
};

export const MOVEMENT_TYPES = {
  add: "إضافة",
  sell: "بيع",
  return: "إرجاع",
  adjust: "تسوية"
};