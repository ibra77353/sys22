import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Drop-in dropdown that renders a vaul bottom drawer on mobile viewports
 * and the standard Radix Select on desktop. Accepts an `options` array of
 * { value, label } plus value/onValueChange/placeholder.
 */
export function DrawerSelect({ value, onValueChange, placeholder, options, className, disabled }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle>{placeholder || "اختر"}</DrawerTitle>
          <DrawerDescription className="sr-only">{placeholder}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-2 pb-4 scrollbar-thin">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onValueChange(o.value); setOpen(false); }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                o.value === value ? "bg-primary/10 text-primary" : "hover:bg-accent"
              )}
            >
              <span className="truncate text-right">{o.label}</span>
              {o.value === value && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
          {options.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">لا توجد خيارات</p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default DrawerSelect;