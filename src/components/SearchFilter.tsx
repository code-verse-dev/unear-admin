import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  label: string;
  value: string;
}

interface SearchFilterProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  onReset?: () => void;
  /** Small spinner inside the search field (e.g. list refetch). */
  isSearching?: boolean;
}

const SearchFilter = ({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters = [],
  onReset,
  isSearching = false,
}: SearchFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-busy={isSearching}
          className={`pl-9 bg-card border-border ${isSearching ? "pr-9" : ""}`}
        />
        {isSearching ? (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
            aria-hidden
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin opacity-70" />
          </div>
        ) : null}
      </div>
      {filters.map((filter) => (
        <Select key={filter.label} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-[min(100%,200px)] bg-card border-border">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset} className="border-border">
          <SlidersHorizontal className="w-4 h-4 mr-1" /> Reset
        </Button>
      )}
    </div>
  );
};

export default SearchFilter;
