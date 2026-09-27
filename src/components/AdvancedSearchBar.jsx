import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export default function AdvancedSearchBar({
  searchText, setSearchText,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  placeholder = "بحث...",
  showDate = true,
}) {
  const hasFilters = searchText || dateFrom || dateTo;
  const clear = () => { setSearchText(""); setDateFrom(""); setDateTo(""); };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={placeholder}
          className="pr-9"
        />
        {searchText && (
          <button type="button" onClick={() => setSearchText("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDate && (
        <div className="flex gap-2 items-center">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="sm:w-36" aria-label="من تاريخ" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="sm:w-36" aria-label="إلى تاريخ" />
        </div>
      )}
      {hasFilters && (
        <Button type="button" variant="ghost" onClick={clear} className="gap-1.5 shrink-0">
          <X className="w-4 h-4" /> مسح
        </Button>
      )}
    </div>
  );
}