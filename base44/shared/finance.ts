// Shared finance & audit helpers used by backend functions.
// All balances are COMPUTED from real operation records — never user-entered.

export async function getSettings(base44) {
  const list = await base44.asServiceRole.entities.Settings.list();
  if (list && list.length > 0) return list[0];
  // create default settings singleton
  const created = await base44.asServiceRole.entities.Settings.create({
    network_name: "شبكة البرنس",
    currency: "ريال يمني",
    currency_symbol: "ر.ي",
    opening_balance: 0,
    low_stock_threshold: 10
  });
  return created;
}

// Cash balance = opening_balance + sum(in) - sum(out)
export async function getCashBalance(base44) {
  const settings = await getSettings(base44);
  const txns = await base44.asServiceRole.entities.CashTransaction.list("-transaction_date", 1000);
  let totalIn = 0, totalOut = 0;
  for (const t of txns) {
    if (t.type === "in") totalIn += Number(t.amount) || 0;
    else totalOut += Number(t.amount) || 0;
  }
  return {
    opening: Number(settings.opening_balance) || 0,
    totalIn,
    totalOut,
    balance: (Number(settings.opening_balance) || 0) + totalIn - totalOut
  };
}

// Distributor debt = total active sales - total collections
export async function getDistributorBalance(base44, distributorId) {
  const sales = await base44.asServiceRole.entities.Sale.filter({ distributor_id: distributorId, status: "active" });
  const collections = await base44.asServiceRole.entities.Collection.filter({ distributor_id: distributorId });
  let totalSales = 0, totalPaid = 0, totalCollected = 0;
  for (const s of sales) totalSales += Number(s.total_amount) || 0;
  for (const s of sales) totalPaid += Number(s.paid_amount) || 0;
  for (const c of collections) totalCollected += Number(c.amount) || 0;
  const debt = totalSales - totalPaid - totalCollected;
  return { totalSales, totalPaid, totalCollected, debt: Math.max(0, debt) };
}

// Package stock = added - sold + returned
export async function getPackageStock(base44, packageId) {
  const movements = await base44.asServiceRole.entities.InventoryMovement.filter({ package_id: packageId });
  let added = 0, sold = 0, returned = 0;
  for (const m of movements) {
    const q = Number(m.quantity) || 0;
    if (m.type === "add") added += q;
    else if (m.type === "sell") sold += q;
    else if (m.type === "return") returned += q;
  }
  return { added, sold, returned, current: added - sold + returned };
}

export async function logAudit(base44, operationType, affectedItem, operationId, details) {
  let userEmail = "system";
  try {
    const user = await base44.auth.me();
    if (user) userEmail = user.email || "admin";
  } catch (e) { /* ignore */ }
  await base44.asServiceRole.entities.AuditLog.create({
    operation_type: operationType,
    affected_item: affectedItem || "",
    operation_id: operationId || "",
    details: details || "",
    user_email: userEmail,
    log_date: new Date().toISOString()
  });
}

export function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return { start, end };
}

export function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  return { start, end };
}