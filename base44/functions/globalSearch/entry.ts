import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const body = await req.json();
    const q = (body.query || "").trim();
    if (!q || q.length < 2) return Response.json({ results: [] });

    const lower = q.toLowerCase();
    const matches = (val) => val != null && String(val).toLowerCase().includes(lower);

    const results = [];

    const distributors = await base44.asServiceRole.entities.Distributor.list("-created_date", 500);
    for (const d of distributors) {
      if (matches(d.name) || matches(d.phone) || matches(d.address)) {
        results.push({ type: "distributor", id: d.id, title: d.name, subtitle: d.phone || "", path: "/distributors" });
      }
    }

    const packages = await base44.asServiceRole.entities.Package.list("-created_date", 500);
    for (const p of packages) {
      if (matches(p.name) || matches(p.description)) {
        results.push({ type: "package", id: p.id, title: p.name, subtitle: `${p.price} ريال`, path: "/packages" });
      }
    }

    const sales = await base44.asServiceRole.entities.Sale.list("-sale_date", 1000);
    for (const s of sales) {
      if (matches(s.invoice_number) || matches(s.distributor_name) || matches(s.notes)) {
        results.push({ type: "sale", id: s.id, title: s.invoice_number, subtitle: `${s.distributor_name} - ${s.total_amount}`, path: "/sales" });
      }
    }

    const collections = await base44.asServiceRole.entities.Collection.list("-collection_date", 1000);
    for (const c of collections) {
      if (matches(c.distributor_name) || matches(c.notes) || matches(c.invoice_number)) {
        results.push({ type: "collection", id: c.id, title: `تحصيل ${c.distributor_name}`, subtitle: c.amount, path: "/collections" });
      }
    }

    const expenses = await base44.asServiceRole.entities.Expense.list("-expense_date", 1000);
    for (const e of expenses) {
      if (matches(e.description) || matches(e.notes) || matches(e.category)) {
        results.push({ type: "expense", id: e.id, title: e.description || e.category, subtitle: e.amount, path: "/expenses" });
      }
    }

    const lines = await base44.asServiceRole.entities.Line.list("-created_date", 500);
    for (const l of lines) {
      if (matches(l.name) || matches(l.provider) || matches(l.identifier)) {
        results.push({ type: "line", id: l.id, title: l.name, subtitle: l.provider, path: "/lines" });
      }
    }

    const txns = await base44.asServiceRole.entities.CashTransaction.list("-transaction_date", 1000);
    for (const t of txns) {
      if (matches(t.description)) {
        results.push({ type: "cash", id: t.id, title: t.description, subtitle: `${t.type === "in" ? "+" : "-"}${t.amount}`, path: "/cash" });
      }
    }

    return Response.json({ results: results.slice(0, 50) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}