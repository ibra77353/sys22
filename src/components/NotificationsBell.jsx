import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, AlertTriangle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationsBell({ dropUp = false }) {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await base44.functions.invoke("getLowStockAlerts", {});
      if (res.data?.lowStock) setAlerts(res.data.lowStock);
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = alerts.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
        aria-label="التنبيهات"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute w-72 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden ${dropUp ? "bottom-full mb-2 right-0" : "left-0 mt-2"}`}>
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="font-bold text-sm">التنبيهات</span>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
            ) : count === 0 ? (
              <div className="px-4 py-8 text-center">
                <Package className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm text-muted-foreground">المخزون بحالة جيدة</p>
                <p className="text-xs text-muted-foreground mt-1">لا توجد باقات منخفضة</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alerts.map((a) => (
                  <div key={a.package_id} className="px-4 py-3 flex items-start gap-2.5 hover:bg-accent/50 cursor-pointer"
                    onClick={() => { setOpen(false); navigate("/inventory"); }}>
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-rose-500">المتبقي: {a.current} (الحد: {a.threshold})</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {count > 0 && (
            <button
              onClick={() => { setOpen(false); navigate("/inventory"); }}
              className="w-full px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent border-t border-border"
            >
              إعادة التعبئة من المخزون
            </button>
          )}
        </div>
      )}
    </div>
  );
}