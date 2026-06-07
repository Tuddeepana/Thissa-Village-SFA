"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { categoryService } from "@/api/services/categoryService"

export interface AsyncCategoryComboboxProps {
  value?: string
  onValueChange: (value: string, label: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  defaultOptions?: { label: string; value: string }[] 
  selectedLabel?: string 
}

export function AsyncCategoryCombobox({
  value,
  onValueChange,
  placeholder = "Select category...",
  searchPlaceholder = "Search category...",
  emptyText = "No category found.",
  className,
  disabled = false,
  defaultOptions = [],
  selectedLabel,
}: AsyncCategoryComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-search", debouncedSearch],
    queryFn: async () => {
      const { categories } = await categoryService.list({ search: debouncedSearch, limit: 20 })
      return categories
    },
    enabled: open, 
    staleTime: 10000,
  })

  const options = React.useMemo(() => {
    const list = [...defaultOptions]
    if (categories) {
      categories.forEach(c => {
        if (!list.find(o => o.value === c.id)) {
          list.push({ label: c.name, value: c.id! })
        }
      })
    }
    
    if (value && !list.find(o => o.value === value)) {
      list.push({ label: selectedLabel || "Selected Category", value })
    }
    return list
  }, [categories, defaultOptions, value, selectedLabel])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="h-9" 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            <CommandGroup>
              {!isLoading && options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    const actualValue = option.value
                    onValueChange(actualValue, option.label)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
