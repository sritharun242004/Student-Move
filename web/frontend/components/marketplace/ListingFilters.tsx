"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { ListingCategory, ListingFilters } from "@/types/marketplaceTypes";

interface ListingFiltersProps {
  categories: ListingCategory[];
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}

export function ListingFiltersBar({ categories, filters, onChange }: ListingFiltersProps) {
  const [keyword, setKeyword] = useState(filters.keyword ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    filters.categoryId !== undefined ? String(filters.categoryId) : "all"
  );
  const [priceMin, setPriceMin] = useState(
    filters.priceMin !== undefined ? String(filters.priceMin) : ""
  );
  const [priceMax, setPriceMax] = useState(
    filters.priceMax !== undefined ? String(filters.priceMax) : ""
  );

  const handleApply = () => {
    onChange({
      keyword: keyword.trim() || undefined,
      categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      skip: 0,
      take: filters.take,
    });
  };

  const handleReset = () => {
    setKeyword("");
    setCategoryId("all");
    setPriceMin("");
    setPriceMax("");
    onChange({ skip: 0, take: filters.take });
  };

  const hasActiveFilters =
    keyword.trim() ||
    categoryId !== "all" ||
    priceMin ||
    priceMax;

  // Build grouped structure: each parent with its children
  const parentCategories = categories.filter((c) => c.parentId === null);
  const subsByParent = (parentId: number) =>
    categories.filter((c) => c.parentId === parentId);

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Keyword */}
      <div className="flex-1 min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Search Items</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="What are you looking for?"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="pl-8"
          />
        </div>
      </div>

      {/* Category */}
      <div className="min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {parentCategories.map((parent) => {
              const children = subsByParent(parent.id);
              return (
                <React.Fragment key={parent.id}>
                  {/* Selectable parent */}
                  <SelectItem value={String(parent.id)}>
                    {parent.name}
                  </SelectItem>
                  {/* Subcategories indented under parent */}
                  {children.map((sub) => (
                    <SelectItem key={sub.id} value={String(sub.id)} className="pl-6">
                      <span className="text-muted-foreground mr-1">›</span> {sub.name}
                    </SelectItem>
                  ))}
                </React.Fragment>
              );
            })}
            {/* Orphan subcategories (no matching parent in list) */}
            {categories
              .filter((c) => c.parentId !== null && !parentCategories.find((p) => p.id === c.parentId))
              .map((sub) => (
                <SelectItem key={sub.id} value={String(sub.id)}>
                  {sub.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price min */}
      <div className="w-28">
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Min price</label>
        <Input
          type="number"
          placeholder="0"
          min={0}
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
        />
      </div>

      {/* Price max */}
      <div className="w-28">
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Max price</label>
        <Input
          type="number"
          placeholder="Any"
          min={0}
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleReset} disabled={!hasActiveFilters}>
          Clear
        </Button>
        <Button onClick={handleApply}>Apply</Button>
      </div>
    </div>
  );
}
