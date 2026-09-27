import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getPackageStock, getSettings } from "../../shared/finance.ts";

// Lightweight low-stock alert check — returns only packages at/below the threshold.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const settings = await getSettings(base44);
    const threshold = Number(settings.low_stock_threshold) || 10;
    const packages = await base44.asServiceRole.entities.Package.list();

    const lowStock = [];
    for (const p of packages) {
      const st = await getPackageStock(base44, p.id);
      if (st.current <= threshold) {
        lowStock.push({ package_id: p.id, name: p.name, current: st.current, threshold, price: p.price });
      }
    }

    return Response.json({ lowStock, threshold, count: lowStock.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}