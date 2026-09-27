import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, EmptyState } from "@/components/ui-shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User, Package, ShoppingCart, HandCoins, Receipt, Wifi, Wallet } from "lucide-react";

const TYPE_META = {
  distributor: { icon: User, label: "موزع", color: "text-blue-500" },
  package: { icon: Package, label: "باقة", color: "text-violet-500" },
  sale: { icon: ShoppingCart, label: "بيع", color: "text-emerald-500" },
  collection: { icon: HandCoins, label: "تحصيل", color: "text-emerald-500" },
  expense: { icon: Receipt, label: "مصروف", color: "text-rose-500" },
  line: { icon: Wifi, label: "خط", color: "text-blue-500" },
  cash: { icon: Wallet, label: "حركة صندوق", color: "text-amber-500" }
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const doSearch = async (val) => {
    setQuery(val);
    if (val.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    try {
      const res = await base44.functions.invoke("globalSearch", { query: val });
      setResults(res.data?.results || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="البحث" description="بحث شامل في كل بيانات النظام" />
      <div className="relative mb-5">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input className="pr-10 h-12 text-base" placeholder="ابحث عن موزع، باقة، فاتورة، ملاحظة..." value={query} onChange={(e) => doSearch(e.target.value)} autoFocus />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">جارٍ البحث...</p>
      ) : !searched ? (
        <EmptyState title="ابدأ البحث" description="اكتب حرفين على الأقل للبحث في كل بيانات النظام" />
      ) : results.length === 0 ? (
        <EmptyState title="لا توجد نتائج" description={`لم يتم العثور على نتائج لـ "${query}"`} />
      ) : (
        <div className="space-y-2">
          {results.map((r, i) => {
            const meta = TYPE_META[r.type] || TYPE_META.cash;
            const Icon = meta.icon;
            return (
              <Card key={i} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate(r.path)}>
                <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 ${meta.color}`}><Icon className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{meta.label}</span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}