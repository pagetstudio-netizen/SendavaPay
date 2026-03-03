import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CountryOption {
  value: string;
  label: string;
  flag?: string;
  subLabel?: string;
}

interface CountrySelectProps {
  options: CountryOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  "data-testid"?: string;
  className?: string;
  disabled?: boolean;
}

export default function CountrySelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionnez un pays",
  "data-testid": testId,
  className,
  disabled,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        data-testid={testId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 h-12 rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors",
          "hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled && "opacity-50 cursor-not-allowed",
          open && "ring-2 ring-ring"
        )}
      >
        <span className="flex items-center gap-3 min-w-0">
          {selected ? (
            <>
              {selected.flag && (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-base flex-shrink-0 overflow-hidden">
                  {selected.flag}
                </span>
              )}
              <span className="truncate">{selected.label}</span>
              {selected.subLabel && (
                <span className="text-muted-foreground text-xs">({selected.subLabel})</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                Aucun pays trouvé
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent/60 font-medium"
                  )}
                  data-testid={`option-country-${option.value}`}
                >
                  {option.flag && (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-base flex-shrink-0 overflow-hidden">
                      {option.flag}
                    </span>
                  )}
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.subLabel && (
                    <span className="text-muted-foreground text-xs">{option.subLabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
