"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import {
  PropertyFormData,
  propertyFormSchema,
  University,
} from "./property-add.schema";
import {
  cities,
  townsByCity,
  getCityName,
  getTownName,
  universities,
} from "@/constants/locations";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { LandlordGuard } from "@/components/dashboard/landlord-guard";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useLandlordContext } from "@/app/store/useLandlordContext";

export default function PropertyAddPage() {
  const { data: session } = useSession();
  const { selectedLandlord } = useLandlordContext();
  const axios = useAgentAxios();
  const [images, setImages] = useState<
    { id: number; file: File; preview: string }[]
  >([]);
  const [selectedCityIndex, setSelectedCityIndex] = useState<number | null>(
    null
  );
  const [lastCityForArea, setLastCityForArea] = useState<number | null>(null);
  const router = useRouter();

  const [currentUniversity, setCurrentUniversity] = useState<string>("");
  const [selectedUniversities, setSelectedUniversities] = useState<
    University[]
  >([]);
  const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
  const [customFeatures, setCustomFeatures] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      billsIncluded: true, // Always true
    },
  });

  // Commission calculation states
  const [basePrice, setBasePrice] = useState<string>("");
  const [finalPrice, setFinalPrice] = useState<string>("");
  
  // Check if current landlord has commission enabled
  const hasCommission = session?.role === "agent" && 
    selectedLandlord && 
    selectedLandlord.profile?.commissionRate && 
    parseFloat(selectedLandlord?.profile?.commissionRate) > 0;
  
    const commissionRate = parseFloat(selectedLandlord?.profile?.commissionRate || "0");

  // Calculate final price when base price changes
  useEffect(() => {
    if (hasCommission && basePrice && !isNaN(Number(basePrice))) {
      const base = Number(basePrice);
      const commission = base * (commissionRate / 100);
      const final = base + commission;
      setFinalPrice(final.toFixed(2));
      setValue("price", final.toString());
    } else if (basePrice) {
      setFinalPrice(basePrice);
      setValue("price", basePrice);
    }
  }, [basePrice, hasCommission, commissionRate, setValue]);

  // Reset area when city changes
  useEffect(() => {
    if (selectedCityIndex !== null && selectedCityIndex !== lastCityForArea) {
      setValue("area", undefined as any, {
        shouldValidate: false,
        shouldDirty: false,
      });
      setLastCityForArea(selectedCityIndex);
    }
  }, [selectedCityIndex, setValue, lastCityForArea]);

  const addUniversity = (universityId: string) => {
    const university = universities.find(
      (u) => u.id.toString() === universityId
    );
    if (
      university &&
      !selectedUniversities.some((u) => u.id === university.id)
    ) {
      setSelectedUniversities([...selectedUniversities, university]);
      setCurrentUniversity("");
    }
  };

  const removeUniversity = (universityId: number) => {
    setSelectedUniversities(
      selectedUniversities.filter((u) => u.id !== universityId)
    );
  };

  const onSubmit = async (data: PropertyFormData) => {
    const formData = new FormData();

    // Add all images
    images.forEach((image, index) => {
      formData.append(`images`, image.file);
    });

    // check university list not empty
    if (selectedUniversities.length === 0) {
      toast.warning("No Universities Selected!", {
        description: "Please select at least one university.",
      });
      return;
    }

    try {
      // Prepare property data (no status field - backend will default to "pending")
      const { city, area, ...dataWithoutLocation } = data;

      // Create a modified data object that can handle null values
      const processedData = { ...dataWithoutLocation };

      // Handle empty availableAfter field
      if (processedData.availableAfter === "") {
        processedData.availableAfter = undefined;
      }

      // Handle empty availableTo field
      if (processedData.availableTo === "") {
        processedData.availableTo = undefined;
      }

      // Handle empty gas certificate date fields
      if (processedData.gasFromDate === "") {
        processedData.gasFromDate = undefined;
      }
      if (processedData.gasToDate === "") {
        processedData.gasToDate = undefined;
      }

      // Handle empty electric certificate date fields
      if (processedData.electricFromDate === "") {
        processedData.electricFromDate = undefined;
      }
      if (processedData.electricToDate === "") {
        processedData.electricToDate = undefined;
      }

      // Ensure bills_included is always true
      processedData.billsIncluded = true;

      const propertyData = {
        ...processedData,
        // Backend expects 0-based indices (same as frontend)
        city_index: city,
        // Backend expects city-scoped 0-based area index (same as frontend)
        area_index: area,
        universities: selectedUniversities.map((u) => u.id),
        keyFeatures: keyFeatures,
      };

      // Make API request for property data
      const response = await axios.post("/properties/", propertyData);

      const id = response.data.data.id;

      // Upload images
      if (images.length > 0) {
        await axios.post(`/properties/images/${id}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      toast("Success", {
        description: "Property has been successfully added",
      });

      // Redirect to properties list
      router.push("/dashboard/my-properties");
    } catch (error: any) {
      console.error(error.response?.data?.message || error.message);
      toast("Error Occurred", {
        description: "Failed to add property. Please try again.",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newFiles]);
    }
  };

  const removeImage = (id: number) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      return filtered;
    });
  };

  return (
    <LandlordGuard>
      <div className="container mx-auto py-4 max-w-4xl">
        <div className="flex items-center text-sm text-muted-foreground">
          <span
            onClick={() => router.push("/dashboard/properties")}
            className="hover:text-primary cursor-pointer"
          >
            Properties
          </span>
          <span className="mx-2">/</span>
          <span>Add New Property</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-8">
          Add a new property
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 ">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>
                Enter the basic information about the property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <Label htmlFor="name">Property Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    className={`mt-1.5 ${errors.name ? "border-red-500" : ""}`}
                  />
                  {errors.name && (
                    <span className="text-sm text-red-500 mt-1">
                      {errors.name.message}
                    </span>
                  )}
                </div>
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    {...register("address")}
                    className={`mt-1.5 ${
                      errors.address ? "border-red-500" : ""
                    }`}
                  />
                  {errors.address && (
                    <span className="text-sm text-red-500 mt-1">
                      {errors.address.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Controller
                      name="city"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => {
                            const index = parseInt(value);

                            field.onChange(index);
                            setSelectedCityIndex(index);
                          }}
                        >
                          <SelectTrigger id="city" className="mt-1.5">
                            <SelectValue placeholder="Select a city">
                              {field.value !== undefined &&
                                getCityName(field.value)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {cities.map((city, index) => (
                              <SelectItem key={city} value={index.toString()}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.city && (
                      <span className="text-sm text-red-500 mt-1">
                        {errors.city.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="town">Town/ Area</Label>
                    <Controller
                      name="area"
                      control={control}
                      render={({ field }) => {
                        return (
                          <Select
                            disabled={selectedCityIndex === null}
                            value={
                              field.value !== undefined &&
                              selectedCityIndex === lastCityForArea
                                ? field.value.toString()
                                : ""
                            }
                            onValueChange={(value) => {
                            
                              const areaIndex = parseInt(value);
                              field.onChange(areaIndex);
                              setLastCityForArea(selectedCityIndex);
                            }}
                          >
                            <SelectTrigger id="town" className="mt-1.5">
                              <SelectValue
                                placeholder={
                                  selectedCityIndex !== null
                                    ? "Select a town"
                                    : "Select a city first"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedCityIndex !== null &&
                                selectedCityIndex >= 0 &&
                                selectedCityIndex < townsByCity.length &&
                                townsByCity[selectedCityIndex].map(
                                  (town, index) => (
                                    <SelectItem
                                      key={town}
                                      value={index.toString()}
                                    >
                                      {town}
                                    </SelectItem>
                                  )
                                )}
                            </SelectContent>
                          </Select>
                        );
                      }}
                    />
                    {errors.area && (
                      <span className="text-sm text-red-500 mt-1">
                        {errors.area.message}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="zip">Postal Code</Label>
                  <Input
                    id="zip"
                    {...register("zipCode")}
                    className={`mt-1.5 ${
                      errors.zipCode ? "border-red-500" : ""
                    }`}
                  />
                  {errors.zipCode && (
                    <span className="text-sm text-red-500 mt-1">
                      {errors.zipCode.message}
                    </span>
                  )}
                </div>

                <div>
                  <Label htmlFor="universities" className="mb-1.5 block">
                    Nearby Universities
                  </Label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <Select
                        value={currentUniversity}
                        onValueChange={addUniversity}
                      >
                        <SelectTrigger id="universities" className="flex-1">
                          <SelectValue placeholder="Select universities" />
                        </SelectTrigger>
                        <SelectContent>
                          {universities.map((university) => (
                            <SelectItem
                              key={university.id}
                              value={university.id.toString()}
                              disabled={selectedUniversities.some(
                                (u) => u.id === university.id
                              )}
                            >
                              {university.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedUniversities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedUniversities.map((university) => (
                          <div
                            key={university.id}
                            className="bg-muted px-3 py-1 rounded-full flex items-center gap-1 text-sm"
                          >
                            {university.name}
                            <button
                              type="button"
                              onClick={() => removeUniversity(university.id)}
                              className="text-muted-foreground hover:text-destructive ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-1">
                      Select one or more universities near this property. The
                      property will be shown to students from these
                      universities.
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Property Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    className={`mt-1.5 ${
                      errors.description ? "border-red-500" : ""
                    }`}
                    rows={4}
                  />
                  {errors.description && (
                    <span className="text-sm text-red-500 mt-1">
                      {errors.description.message}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Features</CardTitle>
              <CardDescription>
                Add details about the property features and amenities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">
                      {hasCommission ? "Landlord Price (£)" : "Weekly Rent (£)"}
                    </Label>
                    {hasCommission ? (
                      <div className="space-y-2">
                        <Input
                          id="price"
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                          placeholder="Enter your base price"
                          className={`mt-1.5 ${
                            errors.price ? "border-red-500" : ""
                          }`}
                        />
                        {basePrice && (
                          <div className="text-sm space-y-1">
                            <div className="text-muted-foreground">
                              Landlord price: £{basePrice}
                            </div>
                            <div className="text-muted-foreground">
                              Commission ({commissionRate}%): £{((Number(basePrice) || 0) * (commissionRate / 100)).toFixed(2)}
                            </div>
                            <div className="font-medium text-primary">
                              Final price shown to users: £{finalPrice}
                            </div>
                          </div>
                        )}
                        <input
                          type="hidden"
                          {...register("price")}
                          value={finalPrice}
                        />
                      </div>
                    ) : (
                      <Input
                        id="price"
                        {...register("price")}
                        className={`mt-1.5 ${
                          errors.price ? "border-red-500" : ""
                        }`}
                      />
                    )}
                    {errors.price && (
                      <span className="text-sm text-red-500 mt-1">
                        {errors.price.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      {...register("rooms", { valueAsNumber: true })}
                      className={`mt-1.5 ${
                        errors.rooms ? "border-red-500" : ""
                      }`}
                    />
                    {errors.rooms && (
                      <span className="text-sm text-red-500 mt-1">
                        {errors.rooms.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      {...register("bathrooms", { valueAsNumber: true })}
                      className={`mt-1.5 ${
                        errors.bathrooms ? "border-red-500" : ""
                      }`}
                    />
                    {errors.bathrooms && (
                      <span className="text-sm text-red-500 mt-1">
                        {errors.bathrooms.message}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="epc">EPC Rating</Label>
                  <Controller
                    name="epcRating"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="epc" className="mt-1.5">
                          <SelectValue placeholder="Select EPC rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A - Excellent</SelectItem>
                          <SelectItem value="B">B - Very Good</SelectItem>
                          <SelectItem value="C">C - Good</SelectItem>
                          <SelectItem value="D">D - Average</SelectItem>
                          <SelectItem value="E">E - Below Average</SelectItem>
                          <SelectItem value="F">F - Poor</SelectItem>
                          <SelectItem value="G">G - Very Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.epcRating && (
                    <span className="text-sm text-red-500 mt-1">
                      {errors.epcRating.message}
                    </span>
                  )}
                </div>

                <Separator className="my-2" />

                <div>
                  <Label className="mb-3 block">Key Features</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {[
                      "American fridge freezer",
                      "Prime location",
                      "Double bedroom",
                      "Large Screen tv",
                      "Newly refurbished",
                      "Newly refurbished bathroom",
                      "Newly fitted kitchen",
                      "Walking distance to university",
                      "En-suite bathrooms",
                      "Open-plan living area",
                      "Excellent location",
                      "Dishwasher",
                      "Washing machine",
                      "Dryer",
                      "Garden",
                    ].map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`amenity-${amenity
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                          checked={keyFeatures.includes(amenity)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setKeyFeatures([...keyFeatures, amenity]);
                            } else {
                              setKeyFeatures(
                                keyFeatures.filter((a) => a !== amenity)
                              );
                            }
                          }}
                        />

                        <Label
                          htmlFor={`amenity-${amenity
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                          className="font-normal"
                        >
                          {amenity}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom features"
                        value={customFeatures}
                        onChange={(e) => setCustomFeatures(e.target.value)}
                        className="max-w-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (customFeatures.trim()) {
                            setKeyFeatures([
                              ...keyFeatures,
                              customFeatures.trim(),
                            ]);
                            setCustomFeatures("");
                          }
                        }}
                        disabled={!customFeatures.trim()}
                      >
                        Add
                      </Button>
                    </div>

                    {keyFeatures.filter(
                      (a) =>
                        ![
                          "American fridge freezer",
                          "Prime location",
                          "Double bedroom",
                          "Large Screen tv",
                          "Newly refurbished",
                          "Newly refurbished bathroom",
                          "Newly fitted kitchen",
                          "Walking distance to university",
                          "En-suite bathrooms",
                          "Open-plan living area",
                          "Excellent location",
                          "Dishwasher",
                          "Washing machine",
                          "Dryer",
                          "Garden",
                        ].includes(a)
                    ).length > 0 && (
                      <div className="mt-2">
                        <Label className="mb-2 block text-sm">
                          Custom Amenities:
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {keyFeatures
                            .filter(
                              (a) =>
                                ![
                                  "American fridge freezer",
                                  "Prime location",
                                  "Double bedroom",
                                  "Large Screen tv",
                                  "Newly refurbished",
                                  "Newly refurbished bathroom",
                                  "Newly fitted kitchen",
                                  "Walking distance to university",
                                  "En-suite bathrooms",
                                  "Open-plan living area",
                                  "Excellent location",
                                  "Dishwasher",
                                  "Washing machine",
                                  "Dryer",
                                  "Garden",
                                ].includes(a)
                            )
                            .map((amenity, index) => (
                              <div
                                key={index}
                                className="bg-muted px-3 py-1 rounded-full flex items-center gap-1 text-sm"
                              >
                                {amenity}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setKeyFeatures(
                                      keyFeatures.filter((a) => a !== amenity)
                                    )
                                  }
                                  className="text-muted-foreground hover:text-destructive ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="available-date">Available From</Label>
                  <Input
                    id="available-date"
                    type="date"
                    {...register("availableAfter")}
                    className="mt-1.5 w-1/2"
                  />
                </div>

                <div>
                  <Label htmlFor="available-to-date">Available To</Label>
                  <Input
                    id="available-to-date"
                    type="date"
                    {...register("availableTo")}
                    className="mt-1.5 w-1/2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>
                Provide more specific information about the property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <Label htmlFor="parking">Parking</Label>
                  <Input
                    id="parking"
                    {...register("additionalDetails.parking")}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="accessibility">Accessibility</Label>
                  <Input
                    id="accessibility"
                    {...register("additionalDetails.accessibility")}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Furnished</Label>
                  <Controller
                    name="additionalDetails.furnished"
                    control={control}
                    defaultValue={true}
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={String(field.value)}
                        defaultValue="false"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="furnished-yes" />
                          <Label
                            htmlFor="furnished-yes"
                            className="font-normal"
                          >
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="furnished-no" />
                          <Label htmlFor="furnished-no" className="font-normal">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Pets Allowed</Label>
                  <Controller
                    name="additionalDetails.pets_allowed"
                    control={control}
                    defaultValue="No"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue="No"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id="pets-yes" />
                          <Label htmlFor="pets-yes" className="font-normal">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id="pets-no" />
                          <Label htmlFor="pets-no" className="font-normal">
                            No
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="Negotiable"
                            id="pets-negotiable"
                          />
                          <Label
                            htmlFor="pets-negotiable"
                            className="font-normal"
                          >
                            Negotiable
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gas-from-date">
                      Gas Safety Certificate Start Date
                    </Label>
                    <Input
                      id="gas-from-date"
                      type="date"
                      {...register("gasFromDate")}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gas-to-date">
                      Gas Safety Certificate End Date
                    </Label>
                    <Input
                      id="gas-to-date"
                      type="date"
                      {...register("gasToDate")}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="electric-from-date">
                      Electric Safety Certificate Start Date
                    </Label>
                    <Input
                      id="electric-from-date"
                      type="date"
                      {...register("electricFromDate")}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="electric-to-date">
                      Electric Safety Certificate End Date
                    </Label>
                    <Input
                      id="electric-to-date"
                      type="date"
                      {...register("electricToDate")}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deposit & Fees</CardTitle>
              <CardDescription>
                Add information about deposits and fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="security-deposit">
                      Security Deposit (£) - Per Tenant
                    </Label>
                    <Input
                      type="number"
                      id="security-deposit"
                      {...register("securityDeposit", {
                        setValueAs: (value) =>
                          value === "" ? undefined : Number(value),
                      })}
                      className={`mt-1.5 ${
                        errors.securityDeposit ? "border-red-500" : ""
                      }`}
                    />
                    {errors.securityDeposit && (
                      <span className="text-sm text-red-500 mt-1">
                        {errors.securityDeposit.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="holding-fee">
                      Holding Deposit (£) - Per Tenant
                    </Label>
                    <Input
                      type="number"
                      id="holding-fee"
                      {...register("holdingDeposit", {
                        setValueAs: (value) =>
                          value === "" ? undefined : Number(value),
                      })}
                      className={`mt-1.5 ${
                        errors.holdingDeposit ? "border-red-500" : ""
                      }`}
                    />
                    {errors.holdingDeposit && (
                      <span className="text-sm text-red-500 mt-1">
                        {errors.holdingDeposit.message}
                      </span>
                    )}
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="flex items-center space-x-2 mb-4">
                  <Controller
                    name="billsIncluded"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="bills-included"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={true} // Bills are always included
                      />
                    )}
                  />
                  <Label htmlFor="bills-included" className="font-normal text-muted-foreground">
                    Bills Included in Rent (Always included)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Gallery</CardTitle>
              <CardDescription>
                Upload images of the property (exterior, interior, floor plans,
                etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex flex-wrap gap-4 mt-2 relative">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <div className="w-24 h-24 rounded-md overflow-hidden border border-border">
                        <img
                          src={img.preview || "/placeholder.svg"}
                          alt="Property preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm opacity-90 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <label className="w-24 h-24 flex flex-col items-center justify-center border border-dashed border-muted-foreground/50 rounded-md cursor-pointer hover:bg-muted/50 transition-colors sticky top-4">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">
                      Add Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="px-8 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">
                    <svg
                      className="animate-spin -ml-1 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                  Saving...
                </>
              ) : (
                "Save Property"
              )}
            </Button>
          </div>
        </form>
      </div>
    </LandlordGuard>
  );
}
