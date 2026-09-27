import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Share2, X, MessageCircle, Wifi, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";

const sanitizePhone = (phone) => {
  if (!phone) return "";
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  else if (p.startsWith("0")) p = "967" + p.slice(1);
  return p;
};

export default function InvoiceModal({ sale, settings, distributorPhone, onClose }) {
  const printRef = useRef(null);
  if (!sale) return null;

  const sym = settings?.currency_symbol || "ر.ي";
  const networkName = settings?.network_name || "شبكة البرنس";
  const adminEmail = settings?.admin_email || "";

  const paid = Number(sale.paid_amount) || 0;
  const total = Number(sale.total_amount) || 0;
  const remaining = Number(sale.remaining_amount) || (total - paid);
  const status = remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  const statusMap = {
    paid: { label: "مدفوعة بالكامل", icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-600" },
    partial: { label: "مدفوعة جزئياً", icon: Clock, cls: "bg-amber-500/10 text-amber-600" },
    unpaid: { label: "غير مدفوعة", icon: AlertCircle, cls: "bg-rose-500/10 text-rose-600" },
  };
  const StatusIcon = statusMap[status].icon;

  const handlePrint = () => window.print();

  const buildText = () => {
    const lines = [
      `*${networkName}*`,
      `━━━━━━━━━━━━━━━`,
      `فاتورة بيع`,
      `رقم الفاتورة: ${sale.invoice_number || "-"}`,
      `التاريخ: ${formatDateTime(sale.sale_date)}`,
      `الموزع: ${sale.distributor_name || "-"}`,
      ``,
      `*تفاصيل الباقات:*`,
      ...(sale.items || []).map((it, i) =>
        `${i + 1}. ${it.package_name} — ${it.quantity} × ${formatCurrency(it.unit_price, sym)} = ${formatCurrency(it.total_price || it.quantity * it.unit_price, sym)}`
      ),
      ``,
      `الإجمالي: ${formatCurrency(total, sym)}`,
      `المدفوع: ${formatCurrency(paid, sym)}`,
      `المتبقي: ${formatCurrency(remaining, sym)}`,
    ];
    if (sale.notes) lines.push(``, `ملاحظات: ${sale.notes}`);
    lines.push(``, `شكراً لتعاملكم مع ${networkName}`);
    return lines.join("\n");
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildText());
    const phone = sanitizePhone(distributorPhone);
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  const handleShare = async () => {
    const text = buildText();
    if (navigator.share) {
      try { await navigator.share({ title: `فاتورة ${sale.invoice_number || ""}`, text }); }
      catch (e) { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(text); alert("تم نسخ تفاصيل الفاتورة"); }
      catch (e) { alert(text); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 no-print" onClick={onClose}>
      <div
        ref={printRef}
        className="print-area w-full max-w-md bg-white text-black rounded-2xl shadow-xl max-h-[94vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent band */}
        <div className="h-2 bg-gradient-to-l from-blue-600 via-blue-500 to-emerald-500 rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">{networkName}</h2>
              <p className="text-xs text-gray-500">فاتورة بيع</p>
            </div>
          </div>
          <button onClick={onClose} className="no-print text-gray-400 hover:text-gray-600 -mt-1 -me-2 p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Invoice meta + status */}
          <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-xl p-3">
            <div>
              <p className="text-gray-500 text-[11px]">رقم الفاتورة</p>
              <p className="font-bold text-sm">{sale.invoice_number || "-"}</p>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${statusMap[status].cls}`}>
              <StatusIcon className="w-3.5 h-3.5" /> {statusMap[status].label}
            </span>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-[11px]">التاريخ</p>
              <p className="font-medium text-xs">{formatDateTime(sale.sale_date)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[11px]">الموزع</p>
              <p className="font-medium text-xs truncate">{sale.distributor_name || "-"}</p>
            </div>
          </div>

          {/* Items table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-[11px]">
                <tr>
                  <th className="text-right p-2.5 font-semibold">#</th>
                  <th className="text-right p-2.5 font-semibold">الباقة</th>
                  <th className="text-center p-2.5 font-semibold">الكمية</th>
                  <th className="text-center p-2.5 font-semibold">السعر</th>
                  <th className="text-left p-2.5 font-semibold">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(sale.items || []).map((it, i) => (
                  <tr key={i} className={i % 2 ? "bg-gray-50/40" : ""}>
                    <td className="p-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="p-2.5 font-medium text-xs">{it.package_name}</td>
                    <td className="p-2.5 text-center text-xs">{it.quantity}</td>
                    <td className="p-2.5 text-center text-xs">{formatCurrency(it.unit_price, sym)}</td>
                    <td className="p-2.5 text-left font-medium text-xs">{formatCurrency(it.total_price || it.quantity * it.unit_price, sym)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-gray-200 p-3 space-y-2 text-sm bg-gray-50/50">
            <div className="flex justify-between">
              <span className="text-gray-600">الإجمالي</span>
              <span className="font-bold">{formatCurrency(total, sym)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">المدفوع</span>
              <span className="font-medium text-emerald-600">{formatCurrency(paid, sym)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-600 font-medium">المتبقي</span>
              <span className="font-bold text-rose-600">{formatCurrency(remaining, sym)}</span>
            </div>
          </div>

          {sale.notes && (
            <div className="text-sm rounded-xl bg-amber-50 border border-amber-100 p-3">
              <p className="text-amber-700 text-[11px] font-medium">ملاحظات</p>
              <p className="mt-0.5 text-xs">{sale.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700">شكراً لتعاملكم مع {networkName}</p>
            {adminEmail && <p className="text-[11px] text-gray-400 mt-0.5">{adminEmail}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="no-print grid grid-cols-3 gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <Button onClick={handlePrint} variant="outline" className="gap-1.5 text-xs"><Printer className="w-4 h-4" /> طباعة</Button>
          <Button onClick={handleWhatsApp} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"><MessageCircle className="w-4 h-4" /> واتساب</Button>
          <Button onClick={handleShare} variant="outline" className="gap-1.5 text-xs"><Share2 className="w-4 h-4" /> مشاركة</Button>
        </div>
      </div>
    </div>
  );
}