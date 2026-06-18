"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { X, Upload, AlertTriangle } from "lucide-react";
import { useForm, Controller, FieldValues } from "react-hook-form";
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
import { useRouter, useParams } from "next/navigation";
import {
  cities,
  townsByCity,
  getCityName,
  getTownName,
  universities,
  mapBackendCityToIndex,
  mapBackendAreaToIndex,
} from "@/constants/locations";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useLandlordContext } from "@/app/store/useLandlordContext";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PropertyFormData,
  propertyFormSchema,
  University,
} from "@/app/dashboard/property-add/property-add.schema";

export default function PropertyEditPage() {
  const { data: session } = useSession();
  const { selectedLandlord } = useLandlordContext();
  const agentAxios = useAgentAxios();
  const params = useParams();
  const propertyId = params.id;
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<
    { id: number; file: File; preview: string; existingId?: number }[]
  >([]);
  const [imagesModified, setImagesModified] = useState(false);
  const [originalImageIds, setOriginalImageIds] = useState<number[]>([]);
  const [selectedCityIndex, setSelectedCityIndex] = useState<number | null>(
    null
  );
  const router = useRouter();

  const [currentUniversity, setCurrentUniversity] = useState<string>("");
  const [selectedUniversities, setSelectedUniversities] = useState<
    University[]
  >([]);
  const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
  const [customFeatures, setCustomFeatures] = useState<string>("");
  const [originalData, setOriginalData] = useState<PropertyFormData | null>(
    null
  );

  // Commission calculation states
  const [basePrice, setBasePrice] = useState<string>("");
  const [finalPrice, setFinalPrice] = useState<string>("");
  const [propertyData, setPropertyData] = useState<any>(null);
  
  // Check if current property belongs to an agent-created landlord
  const commissionRate = parseFloat(selectedLandlord?.profile?.commissionRate || "0") || 0;

  const hasCommission = session?.role === "agent" && 
    selectedLandlord && 
    commissionRate > 0 &&
    propertyData?.is_agent_property;

  console.log("selectedLandlord:", selectedLandlord);
  console.log("propertyData:", propertyData);
  console.log("hasCommission:", hasCommission);
  console.log("Commission Rate:", commissionRate);


  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      status: "available",
      billsIncluded: true, // Always true
    },
  });

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

  const status = watch("status");
  const billsIncluded = watch("billsIncluded");

  // Fetch property data
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setIsLoading(true);
        const response = await agentAxios.get(`/properties/${propertyId}/`, {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        });

        const propertyData = response.data.data;
        setOriginalData(propertyData);
        setPropertyData(propertyData);

        // Set base price for commission calculations
        if (propertyData.isAgentProperty && propertyData.basePrice) {
          setBasePrice(propertyData.basePrice);
        } else {
          setBasePrice(propertyData.price);
        }

        // Convert city and area data to frontend-compatible indices using helper functions
        const cityIndex = mapBackendCityToIndex(propertyData.city);
        const areaIndex = mapBackendAreaToIndex(propertyData.area, cityIndex);

        // Set form values with converted indices
        reset({
          name: propertyData.name,
          address: propertyData.address,
          city: cityIndex,
          area: areaIndex,
          zipCode: propertyData.zipCode,
          description: propertyData.description,
          price: propertyData.price,
          rooms: propertyData.rooms,
          bathrooms: propertyData.bathrooms,
          epcRating: propertyData.epcRating,
          additionalDetails: propertyData.additionalDetails || {
            parking: "",
            accessibility: "",
            pets_allowed: "",
            furnished: false,
          },
          status: propertyData.status,
          availableAfter: propertyData.availableAfter,
          availableTo: propertyData.availableTo,
          gasFromDate: propertyData.gasFromDate,
          gasToDate: propertyData.gasToDate,
          electricFromDate: propertyData.electricFromDate,
          electricToDate: propertyData.electricToDate,
          securityDeposit: propertyData.securityDeposit,
          holdingDeposit: propertyData.holdingDeposit,
          billsIncluded: true, // Always true
        });

        // Set city index for the component state
        setSelectedCityIndex(cityIndex);

        // Set universities
        if (propertyData.universities && propertyData.universities.length > 0) {
          // Check the format of universities data
          if (
            typeof propertyData.universities[0] === "object" &&
            propertyData.universities[0].hasOwnProperty("id")
          ) {
            // If universities is already an array of objects with id and name
            setSelectedUniversities(propertyData.universities);
          } else {
            // If universities is an array of IDs
            const propertyUniversities = propertyData.universities
              .map((uniId: number) => universities.find((u) => u.id === uniId))
              .filter(Boolean) as University[];
            setSelectedUniversities(propertyUniversities);
          }
        } else {
          // Property has no universities - ensure empty array
          setSelectedUniversities([]);
        }

        // Set key features
        if (propertyData.keyFeatures && propertyData.keyFeatures.length > 0) {
          setKeyFeatures(propertyData.keyFeatures);
        } else {
          // Property has no key features - ensure empty array
          setKeyFeatures([]);
        }

        // Set images
        if (propertyData.images && propertyData.images.length > 0) {
          const propertyImages = propertyData.images.map(
            (img: { id: number; image: string }) => ({
              id: Date.now() + Math.random(),
              preview: img.image,
              existingId: img.id,
              file: new File([], "placeholder"), // Placeholder file object
            })
          );
          setImages(propertyImages);
          // Store original image IDs for comparison
          setOriginalImageIds(
            propertyData.images.map(
              (img: { id: number; image: string }) => img.id
            )
          );
        } else {
          setImages([]);
          setOriginalImageIds([]);
        }
      } catch (error) {
        console.error("Error fetching property data:", error);
        toast("Error", {
          description: "Failed to load property data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId && session?.access) {
      fetchPropertyData();
    }
  }, [propertyId, session?.access, reset]);

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
    try {
      // Start with essential fields to prevent backend validation errors
      const dirtyData: any = {
        name: data.name,
        address: data.address,
        description: data.description,
        price: data.price,
        // Always include city and area
        city_index: data.city,
        area_index: data.area,
        // Ensure bills_included is always true
        billsIncluded: true,
      };

      // Add other fields only if they have been modified or are different from defaults
      if (dirtyFields.zipCode) dirtyData.zipCode = data.zipCode;
      if (dirtyFields.rooms) dirtyData.rooms = data.rooms;
      if (dirtyFields.bathrooms) dirtyData.bathrooms = data.bathrooms;
      if (dirtyFields.epcRating) dirtyData.epcRating = data.epcRating;
      if (dirtyFields.status) dirtyData.status = data.status;
      
      // Handle numeric fields properly - only include if they have values
      if (dirtyFields.securityDeposit && data.securityDeposit !== undefined) {
        dirtyData.securityDeposit = data.securityDeposit;
      }
      if (dirtyFields.holdingDeposit && data.holdingDeposit !== undefined) {
        dirtyData.holdingDeposit = data.holdingDeposit;
      }

      // Handle date fields - convert empty strings to undefined (null in backend)
      const dateFields = ['availableAfter', 'availableTo', 'gasFromDate', 'gasToDate', 'electricFromDate', 'electricToDate'];
      dateFields.forEach(field => {
        if (dirtyFields[field as keyof typeof dirtyFields]) {
          const value = data[field as keyof PropertyFormData] as string;
          dirtyData[field] = value === "" ? undefined : value;
        }
      });

      // Handle additionalDetails if any subfield was modified
      if (dirtyFields.additionalDetails && Object.keys(dirtyFields.additionalDetails).length > 0) {
        dirtyData.additionalDetails = data.additionalDetails;
      }

      // Only include universities if there are any selected to avoid backend "empty list" error
      if (selectedUniversities.length > 0) {
        dirtyData.universities = selectedUniversities.map((u) => u.id);
      }
      // Only include keyFeatures if there are any to avoid sending empty arrays
      if (keyFeatures.length > 0) {
        dirtyData.keyFeatures = keyFeatures;
      }


      // Update property data
      await agentAxios.put(`/properties/${propertyId}/`, dirtyData, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      // Handle image changes only if there are any changes
      const newImages = images.filter((img) => !img.existingId);
      const existingImages = images
        .filter((img) => img.existingId)
        .map((img) => img.existingId);

      // Check if images have actually changed
      const currentImageIds = existingImages.sort();
      const originalImageIdsSorted = [...originalImageIds].sort();
      const imageIdsChanged =
        JSON.stringify(currentImageIds) !==
        JSON.stringify(originalImageIdsSorted);
      const hasNewImages = newImages.length > 0;

      // Only update images if:
      // 1. Images were explicitly modified (flag set)
      // 2. There are new images added
      // 3. Existing image IDs have changed (images removed)
      const shouldUpdateImages =
        imagesModified || hasNewImages || imageIdsChanged;

      if (shouldUpdateImages) {
        const formData = new FormData();

        if (newImages.length > 0) {
          newImages.forEach((image) => {
            formData.append("images", image.file);
          });
        }

        if (existingImages.length > 0) {
          existingImages.forEach((id) => {
            formData.append(`keep`, id?.toString() || "");
          });
        }

        await agentAxios.put(`/properties/images/${propertyId}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${session?.access}`,
          },
        });

        // Reset the images modified flag after successful update
        setImagesModified(false);
      }

      toast("Success", {
        description: "Property has been successfully updated",
      });

      // Redirect to properties list
      router.push("/dashboard/my-properties");
    } catch (error: any) {
      console.error(error.response?.data || error);
      toast("Error", {
        description: "Failed to update property. Please try again.",
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
      setImagesModified(true); // Mark images as modified
    }
  };

  const removeImage = async (id: number) => {
    // Remove from UI
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      return filtered;
    });
    // Mark images as modified since we're removing an image
    setImagesModified(true);
  };

  const handleDeleteProperty = async () => {
    try {
      await agentAxios.delete(`/properties/${propertyId}/`, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      toast("Success", {
        description: "Property has been successfully deleted",
      });

      // Redirect to properties list
      router.push("/dashboard/properties");
    } catch (error) {
      console.error("Error deleting property:", error);
      toast("Error", {
        description: "Failed to delete property. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 max-w-4xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading property data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 max-w-4xl">
      <div className="flex items-center text-sm text-muted-foreground">
        <span
          onClick={() => router.push("/dashboard/properties")}
          className="hover:text-primary cursor-pointer"
        >
          Properties
        </span>
        <span className="mx-2">/</span>
        <span>Edit Property</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Property</h1>

      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log("Form submission failed with errors:", errors);
        })}
        className="grid gap-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>
              Update the basic information about the property
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
                  className={`mt-1.5 ${errors.address ? "border-red-500" : ""}`}
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
                          const index = Number.parseInt(value);
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
                    render={({ field }) => (
                      <Select
                        disabled={selectedCityIndex === null}
                        value={
                          field.value !== undefined &&
                          selectedCityIndex !== null
                            ? field.value.toString()
                            : ""
                        }
                        onValueChange={(value) =>
                          field.onChange(Number.parseInt(value))
                        }
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
                                <SelectItem key={town} value={index.toString()}>
                                  {town}
                                </SelectItem>
                              )
                            )}
                        </SelectContent>
                      </Select>
                    )}
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
                  className={`mt-1.5 ${errors.zipCode ? "border-red-500" : ""}`}
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
                    property will be shown to students from these universities.
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

        {/* Property Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Property Features</CardTitle>
            <CardDescription>
              Update details about the property features and amenities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">
                    {hasCommission ? "Landlord price (£)" : "Weekly Rent (£)"}
                  </Label>
                  {hasCommission ? (
                    <div className="space-y-2">
                      <Input
                        id="price"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className={`mt-1.5 ${errors.price ? "border-red-500" : ""}`}
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
                      className={`mt-1.5 ${errors.price ? "border-red-500" : ""}`}
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
                    className={`mt-1.5 ${errors.rooms ? "border-red-500" : ""}`}
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <div key={amenity} className="flex items-center space-x-2">
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
            </div>
          </CardContent>
        </Card>

        {/* Additional Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>
              Update more specific information about the property
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
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      value={String(field.value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="furnished-yes" />
                        <Label htmlFor="furnished-yes" className="font-normal">
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
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
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

        {/* Deposit & Fees Card */}
        <Card>
          <CardHeader>
            <CardTitle>Deposit & Fees</CardTitle>
            <CardDescription>
              Update information about deposits and fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="security-deposit">Security Deposit (£)</Label>
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
                  <Label htmlFor="holding-fee">Holding Deposit (£)</Label>
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

        {/* Property Gallery Card */}
        <Card>
          <CardHeader>
            <CardTitle>Property Gallery</CardTitle>
            <CardDescription>
              Update images of the property (exterior, interior, floor plans,
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
                        alt="Property Image"
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

        {/* {show root errors} */}
        {errors.root && (
          <div className="text-sm text-red-500 mt-4">{errors.root.message}</div>
        )}

        {/* Availability Management Card */}
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Property Availability
            </CardTitle>
            <CardDescription>
              Manage the availability of the property for potential tenants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-t border-gray-200 pt-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property-status">Property Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => {
                      if (
                        field.value === "available" ||
                        field.value === "rented_out"
                      ) {
                        return (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger
                              id="property-status"
                              className="mt-1.5"
                            >
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">
                                Available
                              </SelectItem>
                              <SelectItem value="rented_out">
                                Rented Out
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        );
                      } else {
                        return (
                          <Input
                            id="property-status"
                            value={
                              field.value === "pending"
                                ? "Pending"
                                : field.value === "flagged"
                                ? "Flagged"
                                : field.value
                            }
                            disabled
                            className="mt-1.5"
                          />
                        );
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {status === "available"
                      ? "Property is available for tenants to inquire about"
                      : status === "rented_out"
                      ? "Property is currently rented and not available"
                      : status === "pending"
                      ? "Property is pending approval by admin"
                      : "Property has been flagged by admin for review"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="available-date">Available From</Label>
                  <Input
                    id="available-date"
                    type="date"
                    {...register("availableAfter")}
                    className={`mt-1.5`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {status === "available"
                      ? "Leave empty if available immediately"
                      : "This date indicates when the property will be available again"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="available-to-date">Available To</Label>
                  <Input
                    id="available-to-date"
                    type="date"
                    {...register("availableTo")}
                    className={`mt-1.5`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty if property is available indefinitely. This date indicates when the property will no longer be available.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Actions in this section cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Deleting this property will permanently remove it from the system.
              All associated data, including images, bookings, and inquiries
              will be deleted.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Property</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this property and all associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteProperty}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push("/dashboard/my-properties")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
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
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
