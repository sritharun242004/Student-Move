import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cities, townsByCity, universities } from "@/constants/locations";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterMenuProps {
  onFilterApply: (filters: FilterState) => void;
}

export interface FilterState {
  city: number | null;
  area: number | null;
  university: number | null;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number;
  maxBedrooms: number;
  billsIncluded: boolean;
}

export function FilterMenu({ onFilterApply }: FilterMenuProps) {
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    city: null,
    area: null,
    university: null,
    minPrice: 50,
    maxPrice: 500,
    minBedrooms: 1,
    maxBedrooms: 10,
    billsIncluded: false,
  });

  const handleCityChange = (value: string) => {
    const cityIndex = parseInt(value);
    setSelectedCity(cityIndex);
    setFilters({
      ...filters,
      city: cityIndex,
      area: null, // Reset area when city changes
    });
  };

  const handleAreaChange = (value: string) => {
    const areaIndex = parseInt(value);
    if (selectedCity !== null) {
      setFilters({
        ...filters,
        area: areaIndex,
      });
    }
  };

  const handleUniversityChange = (value: string) => {
    // Convert to number for proper comparison
    // universities in filter have string IDs but they're compared with numbers in the data
    const universityId = parseInt(value);

    setFilters({
      ...filters,
      university: universityId,
    });
  };

  const handlePriceChange = (value: number[]) => {
    setFilters({
      ...filters,
      minPrice: value[0],
      maxPrice: value[1],
    });
  };

  const handleBedroomsChange = (value: number[]) => {
    setFilters({
      ...filters,
      minBedrooms: value[0],
      maxBedrooms: value[1],
    });
  };

  const handleBillsIncludedChange = (checked: boolean) => {
    setFilters({
      ...filters,
      billsIncluded: checked,
    });
  };

  const handleFilterApply = () => {
    onFilterApply(filters);
  };

  const handleReset = () => {
    setSelectedCity(null);
    setFilters({
      city: null,
      area: null,
      university: null,
      minPrice: 50,
      maxPrice: 500,
      minBedrooms: 1,
      maxBedrooms: 10,
      billsIncluded: false,
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Filter</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="mt-2 text-xl">
            Find your property in seconds!
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Use the filters below to narrow down your property search.
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 md:gap-y-10 p-5 pt-0 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* City Filter */}
          <div
            className={`grid gap-2 ${
              selectedCity === null ? "col-span-2" : ""
            }`}
          >
            <Label htmlFor="city">City</Label>
            <Select onValueChange={handleCityChange}>
              <SelectTrigger id="city">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city, index) => (
                  <SelectItem key={city} value={index.toString()}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area Filter - Only show if city is selected */}
          {selectedCity !== null &&
            selectedCity >= 0 &&
            selectedCity < townsByCity.length && (
              <div className="grid gap-2">
                <Label htmlFor="area">Area</Label>
                <Select onValueChange={handleAreaChange}>
                  <SelectTrigger id="area">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {townsByCity[selectedCity].map((town, index) => (
                      <SelectItem key={town} value={index.toString()}>
                        {town}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          {/* University Filter */}
          <div className="grid gap-2">
            <Label htmlFor="university">University</Label>
            <Select onValueChange={handleUniversityChange}>
              <SelectTrigger id="university">
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id.toString()}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="grid gap-2 col-span-2 ">
            <Label>Price Range (£ per week)</Label>
            <div className="flex items-center gap-4 px-2 text-muted-foreground">
              <span>£{filters.minPrice}</span>
              <Slider
                defaultValue={[filters.minPrice, filters.maxPrice]}
                max={2000}
                min={50}
                step={10}
                onValueChange={handlePriceChange}
                className="flex-1"
              />
              <span>£{filters.maxPrice}</span>
            </div>
          </div>

          {/* Bedrooms Filter */}
          <div className="grid gap-2 col-span-2 ">
            <Label>Number of Bedrooms</Label>
            <div className="flex items-center gap-4 px-2 text-muted-foreground">
              <span>{filters.minBedrooms}</span>
              <Slider
                defaultValue={[filters.minBedrooms, filters.maxBedrooms]}
                max={10}
                min={1}
                step={1}
                onValueChange={handleBedroomsChange}
                className="flex-1"
              />
              <span>{filters.maxBedrooms}</span>
            </div>
          </div>

          {/* Bills Included Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="billsIncluded"
              checked={filters.billsIncluded}
              onCheckedChange={handleBillsIncludedChange}
            />
            <label
              htmlFor="billsIncluded"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Bills Included
            </label>
          </div>
        </div>
        <SheetFooter className="flex justify-between sm:justify-between">
          {/* <Button variant="outline" onClick={handleReset}>
            Reset
          </Button> */}
          <SheetClose asChild>
            <Button type="submit" onClick={handleFilterApply}>
              Apply Filters
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
