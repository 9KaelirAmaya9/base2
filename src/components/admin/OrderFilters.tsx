import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, X } from "lucide-react";
import { format } from "date-fns";

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderFilters({
  searchTerm,
  onSearchChange,
  selectedStatuses,
  onStatusesChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  activeFiltersCount,
}: OrderFiltersProps) {
  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  const selectAllStatuses = () => {
    onStatusesChange(STATUS_OPTIONS.map((s) => s.value));
  };

  const clearAllStatuses = () => {
    onStatusesChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, name, or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[140px] justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Status
                {selectedStatuses.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {selectedStatuses.length}
                  </Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px]" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filter by Status</h4>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllStatuses}
                    className="h-auto p-1 text-xs"
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllStatuses}
                    className="h-auto p-1 text-xs"
                  >
                    None
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => toggleStatus(status.value)}
                    />
                    <Label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[140px] justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Date Range
                {(dateFrom || dateTo) && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    1
                  </Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px]" align="start">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filter by Date</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="date-from" className="text-xs">
                    From
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    max={dateTo || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to" className="text-xs">
                    To
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    min={dateFrom || undefined}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onDateFromChange("");
                      onDateToChange("");
                    }}
                    className="w-full"
                  >
                    Clear Dates
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(selectedStatuses.length > 0 || dateFrom || dateTo) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedStatuses.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {STATUS_OPTIONS.find((s) => s.value === status)?.label}
              <button
                onClick={() => toggleStatus(status)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {format(new Date(dateFrom), "MMM dd, yyyy")}
              <button
                onClick={() => onDateFromChange("")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {format(new Date(dateTo), "MMM dd, yyyy")}
              <button
                onClick={() => onDateToChange("")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
