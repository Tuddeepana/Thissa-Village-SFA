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
import api from "@/api/client"
import { MyStockResponse, MyStockTableRow } from "@/types/mystock"

export interface AsyncProductComboboxProps {
  value?: string
  onValueChange: (value: string, label: string, product?: MyStockTableRow) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  customerType?: "local" | "foreigner"
}

export function AsyncProductCombobox({
  value,
  onValueChange,
  placeholder = "Select product...",
  searchPlaceholder = "Search product...",
  emptyText = "No product found.",
  className,
  disabled = false,
  customerType = "local",
}: AsyncProductComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-search", debouncedSearch],
    queryFn: async () => {
      const res = await api.get<MyStockResponse>('/mystock', { 
        params: { search: debouncedSearch, page: 1, pageSize: 20 } 
      })
      return res.data.tableResponse?.data ?? []
    },
    enabled: open, 
    staleTime: 10000,
  })

  const [selectedProduct, setSelectedProduct] = React.useState<MyStockTableRow | null>(null)

  React.useEffect(() => {
    if (products) {
      const found = products.find((p) => p.productId === value)
      if (found) setSelectedProduct(found)
    }
  }, [products, value])

  const options = React.useMemo(() => {
    const list: MyStockTableRow[] = []
    if (products) {
      list.push(...products)
    }
    
    if (selectedProduct && !list.find((p) => p.productId === selectedProduct.productId)) {
      list.push(selectedProduct)
    }
    return list
  }, [products, selectedProduct])

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
            {selectedProduct ? `${selectedProduct.productName} - Rs.${customerType === "local" ? (selectedProduct.localPrice ?? 0).toFixed(0) : (selectedProduct.foreignerPrice ?? 0).toFixed(0)}` : placeholder}
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
              {!isLoading && options.map((option) => {
                const priceToShow = customerType === "local" ? (option.localPrice ?? 0) : (option.foreignerPrice ?? 0);
                return (
                  <CommandItem
                    key={option.productId}
                    value={option.productId}
                    onSelect={(currentValue) => {
                      onValueChange(option.productId, option.productName, option)
                      setSelectedProduct(option)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.productId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.productName} - Rs.{priceToShow.toFixed(0)}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
