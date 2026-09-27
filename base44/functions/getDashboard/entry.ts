import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getCashBalance, getDistributorBalance, getPackageStock, getSettings, todayRange, monthRange } from "../../shared/finance.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const settings = await getSettings(base44);
    const cash = await getCashBalance(base44);

    const sales = await base44.asServiceRole.entities.Sale.list("-sale_date", 2000);
    const activeSales = sales.filter(s => s.status === "active");
    const collections = await base44.asServiceRole.entities.Collection.list("-collection_date", 2000);
    const expenses = await base44.asServiceRole.entities.Expense.list("-expense_date", 2000);
    const withdrawals = await base44.asServiceRole.entities.OwnerWithdrawal.list("-withdrawal_date", 2000);
    const packages = await base44.asServiceRole.entities.Package.list();
    const distributors = await base44.asServiceRole.entities.Distributor.list();
    const lines = await base44.asServiceRole.entities.Line.list();

    const { start: tStart, end: tEnd } = todayRange();
    const { start: mStart, end: mEnd } = monthRange();

    const inRange = (d, s, e) => d && new Date(d) >= new Date(s) && new Date(d) < new Date(e);

    const todaySales = activeSales.filter(s => inRange(s.sale_date, tStart, tEnd));
    const monthSales = activeSales.filter(s => inRange(s.sale_date, mStart, mEnd));
    const todayCollections = collections.filter(c => inRange(c.collection_date, tStart, tEnd));

    let totalDistributorDebt = 0;
    for (const d of distributors) {
      const b = await getDistributorBalance(base44, d.id);
      totalDistributorDebt += b.debt;
    }

    let inventoryValue = 0;
    const stockByPackage = [];
    const lowStock = [];
    for (const p of packages) {
      const st = await getPackageStock(base44, p.id);
      const val = st.current * (Number(p.price) || 0);
      inventoryValue += val;
      stockByPackage.push({ package_id: p.id, name: p.name, current: st.current, price: p.price });
      if (st.current <= (Number(settings.low_stock_threshold) || 10)) lowStock.push({ name: p.name, current: st.current });
    }

    const indebtedDistributors = [];
    for (const d of distributors) {
      const b = await getDistributorBalance(base44, d.id);
      if (b.debt > 0) indebtedDistributors.push({ name: d.name, debt: b.debt });
    }

    const totalExpenses = expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
    const totalWithdrawals = withdrawals.reduce((a, w) => a + (Number(w.amount) || 0), 0);

    // recent operations
    const recent = [
      ...activeSales.slice(0, 10).map(s => ({ type: "sale", label: `بيع ${s.invoice_number}`, amount: s.total_amount, date: s.sale_date, distributor: s.distributor_name })),
      ...collections.slice(0, 10).map(c => ({ type: "collection", label: "تحصيل", amount: c.amount, date: c.collection_date, distributor: c.distributor_name })),
      ...expenses.slice(0, 10).map(e => ({ type: "expense", label: `مصروف: ${e.description || e.category}`, amount: e.amount, date: e.expense_date })),
      ...withdrawals.slice(0, 10).map(w => ({ type: "withdrawal", label: "سحب مالك", amount: w.amount, date: w.withdrawal_date }))
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 12);

    return Response.json({
      settings,
      stats: {
        todaySalesTotal: todaySales.reduce((a, s) => a + (Number(s.total_amount) || 0), 0),
        monthSalesTotal: monthSales.reduce((a, s) => a + (Number(s.total_amount) || 0), 0),
        todayCollectionsTotal: todayCollections.reduce((a, c) => a + (Number(c.amount) || 0), 0),
        totalDistributorDebt,
        cashBalance: cash.balance,
        cashIn: cash.totalIn,
        cashOut: cash.totalOut,
        inventoryValue,
        packagesCount: packages.length,
        activePackagesCount: packages.filter(p => p.status === "active").length,
        distributorsCount: distributors.length,
        totalExpenses,
        totalWithdrawals,
        activeLinesCount: lines.filter(l => l.status === "active").length
      },
      alerts: { lowStock, indebtedDistributors },
      recent,
      stockByPackage
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}