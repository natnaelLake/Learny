"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface Filters {
  category: string
  level: string
  priceRange: [number, number]
  sort: string
}

interface CourseFiltersProps {
  filters: Filters
  onApplyFilters: (filters: Partial<Filters>) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "Web Development", label: "Web Development" },
  { value: "Data Science", label: "Data Science" },
  { value: "Design", label: "Design" },
  { value: "Backend Development", label: "Backend Development" },
  { value: "Mobile Development", label: "Mobile Development" },
  { value: "DevOps", label: "DevOps" },
  { value: "Business", label: "Business" },
  { value: "Marketing", label: "Marketing" },
  { value: "Finance", label: "Finance" },
  { value: "Health & Fitness", label: "Health & Fitness" },
  { value: "Music", label: "Music" },
  { value: "Photography", label: "Photography" },
  { value: "Other", label: "Other" },
]

const levels = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

export function CourseFilters({ filters, onApplyFilters, onClearFilters, hasActiveFilters }: CourseFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters)
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleCategoryChange = (category: string) => {
    const newFilters = { ...localFilters, category }
    setLocalFilters(newFilters)
    onApplyFilters({ category })
  }

  const handleLevelChange = (level: string) => {
    const newFilters = { ...localFilters, level }
    setLocalFilters(newFilters)
    onApplyFilters({ level })
  }

  const handlePriceRangeChange = (priceRange: number[]) => {
    const newFilters = { ...localFilters, priceRange: priceRange as [number, number] }
    setLocalFilters(newFilters)
    onApplyFilters({ priceRange: priceRange as [number, number] })
  }

  const handleSortChange = (sort: string) => {
    const newFilters = { ...localFilters, sort }
    setLocalFilters(newFilters)
    onApplyFilters({ sort })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Category</Label>
          <RadioGroup value={localFilters.category} onValueChange={handleCategoryChange}>
            {categories.map((category) => (
              <div key={category.value} className="flex items-center space-x-2">
                <RadioGroupItem value={category.value} id={category.value} />
                <Label htmlFor={category.value} className="text-sm">
                  {category.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Level Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Level</Label>
          <RadioGroup value={localFilters.level} onValueChange={handleLevelChange}>
            {levels.map((level) => (
              <div key={level.value} className="flex items-center space-x-2">
                <RadioGroupItem value={level.value} id={level.value} />
                <Label htmlFor={level.value} className="text-sm">
                  {level.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Price Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Price Range: ${localFilters.priceRange[0]} - ${localFilters.priceRange[1]}
          </Label>
          <Slider 
            value={localFilters.priceRange} 
            onValueChange={handlePriceRangeChange} 
            max={200} 
            min={0} 
            step={10} 
            className="w-full" 
          />
        </div>

        <Separator />

        {/* Sort Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Sort By</Label>
          <RadioGroup value={localFilters.sort} onValueChange={handleSortChange}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="newest" id="newest" />
                <Label htmlFor="newest" className="text-sm">Newest First</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oldest" id="oldest" />
                <Label htmlFor="oldest" className="text-sm">Oldest First</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-low" id="price-low" />
                <Label htmlFor="price-low" className="text-sm">Price: Low to High</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-high" id="price-high" />
                <Label htmlFor="price-high" className="text-sm">Price: High to Low</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rating" id="rating" />
                <Label htmlFor="rating" className="text-sm">Highest Rated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="popular" id="popular" />
                <Label htmlFor="popular" className="text-sm">Most Popular</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {localFilters.category !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {categories.find(c => c.value === localFilters.category)?.label}
                </Badge>
              )}
              {localFilters.level !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {levels.find(l => l.value === localFilters.level)?.label}
                </Badge>
              )}
              {(localFilters.priceRange[0] !== 0 || localFilters.priceRange[1] !== 200) && (
                <Badge variant="secondary" className="text-xs">
                  ${localFilters.priceRange[0]}-${localFilters.priceRange[1]}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
