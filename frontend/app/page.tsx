"use client";
import { useEffect, useState, useRef } from "react";
import Axios from "@/config/axios.config";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Search,
//   MapPin,
//   Star,
//   Shield,
//   Clock,
//   CheckCircle,
//   ArrowRight,
//   Building,
//   Key,
//   CreditCard,
//   MessageSquare,
//   Phone,
//   Mail,
//   Facebook,
//   Twitter,
//   Instagram,
//   Bed,
//   PoundSterling,
//   Bath,
//   FileText,
// } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { testimonials } from "@/constants/testimonials";
import Index from "@/components/ui/main-slider";

// Motion components
const MotionCard = motion(Card);
const MotionButton = motion(Button);
const MotionInput = motion(Input);
const MotionSelect = motion.div;

{
  /* Right side images (1x1 each) */
}
interface PropertyImage {
  image: string;
}

// Bedroom options (1-10)
const bedroomOptions = Array.from({ length: 10 }, (_, i) => i + 1);

// Price range options
const priceOptions = [
  { label: "Up to £50", value: "0-50" },
  { label: "Up to £75", value: "0-75" },
  { label: "Up to £100", value: "0-100" },
  { label: "Up to £125", value: "0-125" },
  { label: "Up to £150", value: "0-150" },
  { label: "Up to £175", value: "0-175" },
  { label: "Up to £200", value: "0-200" },
  { label: "Up to £225", value: "0-225" },
  { label: "Up to £250", value: "0-250" },
];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
};

const heroSlider = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.5 } },
};

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function LandingPage() {
  // Import cities and towns from locations.ts
  const {
    cities,
    townsByCity,
    findCityIndexByName,
  } = require("@/constants/locations");

  const router = useRouter();
  const { data: session } = useSession();

  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [counting, setCounting] = useState(false);

  // Search state
  const [searchParams, setSearchParams] = useState({
    city: "all-cities",
    town: "all-towns",
    bedrooms: "any-bedrooms",
    priceRange: "any-price",
  });

  const heroRef = useRef(null);
  const propertiesRef = useRef(null);
  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true });
  const propertiesInView = useInView(propertiesRef, {
    once: true,
    amount: 0.2,
  });
  const howItWorksInView = useInView(howItWorksRef, {
    once: true,
    amount: 0.2,
  });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const testimonialsInView = useInView(testimonialsRef, {
    once: true,
    amount: 0.2,
  });
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.2 });
  const contactInView = useInView(contactRef, { once: true, amount: 0.2 });

  const [formData, setFormData] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await Axios.get("/properties/all/");
        const data = response.data.data;
        setAllProperties(data);
        // Select random properties for featured section
        const randomFeatured = getRandomFeaturedProperties(data);
        setFeaturedProperties(randomFeatured);
        // Apply initial filtering
        filterProperties(data);
        // setProperties(data);
      } catch (err) {
        toast("Error", {
          description: "Something went wrong!",
        });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filter properties locally based on search filters
  const filterProperties = (propertiesToFilter = allProperties) => {
    let filtered = [...propertiesToFilter];

    // Apply city filter
    if (searchParams.city && searchParams.city !== "all-cities") {
      filtered = filtered.filter(
        (property) =>
          property.city?.name?.toLowerCase() === searchParams.city.toLowerCase()
      );
    }

    // Apply town filter
    if (searchParams.town && searchParams.town !== "all-towns") {
      filtered = filtered.filter(
        (property) =>
          property.area?.name?.toLowerCase() === searchParams.town.toLowerCase()
      );
    }

    // Apply bedrooms filter
    if (searchParams.bedrooms && searchParams.bedrooms !== "any-bedrooms") {
      const bedroomCount = parseInt(searchParams.bedrooms);
      filtered = filtered.filter(
        (property) => parseInt(property.rooms || "0") === bedroomCount
      );
    }

    // Apply price range filter
    if (searchParams.priceRange && searchParams.priceRange !== "any-price") {
      const [minPrice, maxPrice] = searchParams.priceRange
        .split("-")
        .map((p) => parseFloat(p));
      filtered = filtered.filter((property) => {
        const basePrice = parseFloat(property.price || "0");
        const utilityAmount = parseFloat(property.utilityAmount || "0");
        const totalPrice = basePrice + utilityAmount;
        return totalPrice >= minPrice && totalPrice <= maxPrice;
      });
    }

    setFilteredProperties(filtered);
  };

  // Apply filters whenever search filters change
  useEffect(() => {
    if (allProperties.length > 0) {
      filterProperties();
    }
  }, [searchParams]);

  // Slider animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Stats counter animation
  useEffect(() => {
    if (heroInView && !counting) {
      setCounting(true);
    }
  }, [heroInView, counting]);

  // Helper to map API property to UI property
  const mapProperty = (property: any) => ({
    id: property.id,
    title: property.name,
    location: property.address,
    price: property.price,
    bedrooms: property.rooms,
    bathrooms: property.bathrooms,
    sqft: property.additionalDetails?.sqft || 0,
    image: property.images[0]?.image || "/placeholder.svg",
    rating: property.rating || 0,
    amenities: property.keyFeatures || [],
    furnished: property.additionalDetails?.furnished || false,
    billsIncluded: property.billsIncluded || false,
    city: property.city?.name || "",
    area: property.area?.name || "",
    status: property.status || "available",
    university:
      property.universities?.length > 0 ? property.universities[0].name : "",
    zipCode: property.zipCode || "",
    utilityAmount: property.utilityAmount || null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = new URLSearchParams();

    if (searchParams.city !== "all-cities") {
      searchQuery.append("city", searchParams.city);
      if (searchParams.town !== "all-towns") {
        searchQuery.append("town", searchParams.town);
      }
    }
    if (searchParams.bedrooms !== "any-bedrooms") {
      searchQuery.append("bedrooms", searchParams.bedrooms);
    }
    if (searchParams.priceRange !== "any-price") {
      searchQuery.append("priceRange", searchParams.priceRange);
    }

    const queryString = searchQuery.toString();
    router.push(`/public-properties${queryString ? `?${queryString}` : ""}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await Axios.post("/contact/send-email/", {
        to: "yasela2014@gmail.com",
        ...formData,
      });

      toast("Success", {
        description: "Your message has been sent successfully!",
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      toast("Error", {
        description: "Failed to send message. Please try again.",
      });
    }
  };

  // Handle search properties - just filters locally using current search params
  const handleSearchProperties = () => {
    // Filter properties using the current search parameters
    if (allProperties.length > 0) {
      filterProperties();
    }
  };

  // Helper function to get random featured properties (up to 16)
  const getRandomFeaturedProperties = (properties: any[]) => {
    if (!properties || properties.length === 0) return [];

    // remove non available properties
    properties = properties.filter(
      (p) => p.status === "available" && p.isFeatured
    );

    // Create a copy of the properties array to avoid mutation
    const propertiesCopy = [...properties];

    // Return up to 16 properties
    return propertiesCopy.slice(0, Math.min(16, propertiesCopy.length));
  };

  useEffect(() => {
    if (allProperties.length > 0) {
      const randomFeatured = getRandomFeaturedProperties(allProperties);
      setFeaturedProperties(randomFeatured);
    }
  }, [allProperties]);

  return (
    <div className="min-h-screen bg-background">
      <div>
        <Index />
      </div>
      {/* copy code here if need to revert */}

    </div>
  );
}


      // <div className="flex justify-center items-center flex-col text-center pt-16 pb-8 px-4">
      //   <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
      //     Want to find the perfect accommodation?
      //   </h1>
      //   <p className="md:w-1/2 w-3/4">
      //     Explore an exclusive collection of high-quality student accommodations
      //     across England’s leading university cities. Each property is carefully
      //     selected for comfort, style, and convenience, offering modern
      //     interiors, premium amenities, and a hassle-free living experience.
      //     Whether you prefer a contemporary apartment in the city centre or a
      //     spacious house close to campus, Student Moves connects you to
      //     exceptional homes designed for modern student living.
      //   </p>
      // </div>

      // {/* Search Bar */}
      // <div className="mb-16">
      //   {" "}
      //   <motion.div
      //     className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto mb-8"
      //     variants={scaleIn}
      //     transition={{ delay: 0.4 }}
      //   >
      //     <form onSubmit={handleSearch}>
      //       <div className="flex flex-col md:flex-row gap-4">
      //         {/* Location Selects */}
      //         <div className="flex-1 flex gap-4">
      //           {/* City Select */}
      //           <div className="flex-1 relative">
      //             <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
      //             <MotionSelect
      //               whileFocus={{ scale: 1.02 }}
      //               transition={{
      //                 type: "spring",
      //                 stiffness: 400,
      //                 damping: 10,
      //               }}
      //             >
      //               <Select
      //                 value={searchParams.city}
      //                 onValueChange={(value) =>
      //                   setSearchParams((prev) => ({
      //                     ...prev,
      //                     city: value,
      //                     town: "all-towns", // Reset town when city changes
      //                   }))
      //                 }
      //               >
      //                 <SelectTrigger className="pl-10 h-12 w-full">
      //                   <SelectValue placeholder="Select city" />
      //                 </SelectTrigger>
      //                 <SelectContent>
      //                   <SelectItem value="all-cities">All Cities</SelectItem>
      //                   {cities.map((city: string) => (
      //                     <SelectItem key={city} value={city}>
      //                       {city}
      //                     </SelectItem>
      //                   ))}
      //                 </SelectContent>
      //               </Select>
      //             </MotionSelect>
      //           </div>

      //           {/* Town Select */}
      //           <div className="flex-1 relative">
      //             <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
      //             <MotionSelect
      //               whileFocus={{ scale: 1.02 }}
      //               transition={{
      //                 type: "spring",
      //                 stiffness: 400,
      //                 damping: 10,
      //               }}
      //             >
      //               <Select
      //                 value={searchParams.town}
      //                 onValueChange={(value) =>
      //                   setSearchParams((prev) => ({
      //                     ...prev,
      //                     town: value,
      //                   }))
      //                 }
      //                 disabled={searchParams.city === "all-cities"}
      //               >
      //                 <SelectTrigger className="pl-10 h-12 w-full">
      //                   <SelectValue placeholder="Select town" />
      //                 </SelectTrigger>
      //                 <SelectContent>
      //                   <SelectItem value="all-towns">All Towns</SelectItem>
      //                   {searchParams.city !== "all-cities" &&
      //                     townsByCity[
      //                       findCityIndexByName(searchParams.city)
      //                     ]?.map((town: string) => (
      //                       <SelectItem key={town} value={town}>
      //                         {town}
      //                       </SelectItem>
      //                     ))}
      //                 </SelectContent>
      //               </Select>
      //             </MotionSelect>
      //           </div>
      //         </div>

      //         {/* Bedrooms Select */}
      //         <div className="w-48 relative">
      //           <Bed className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
      //           <MotionSelect
      //             whileFocus={{ scale: 1.02 }}
      //             transition={{
      //               type: "spring",
      //               stiffness: 400,
      //               damping: 10,
      //             }}
      //           >
      //             <Select
      //               value={searchParams.bedrooms}
      //               onValueChange={(value) =>
      //                 setSearchParams((prev) => ({
      //                   ...prev,
      //                   bedrooms: value,
      //                 }))
      //               }
      //             >
      //               <SelectTrigger className="pl-10 h-12">
      //                 <SelectValue placeholder="Bedrooms" />
      //               </SelectTrigger>
      //               <SelectContent>
      //                 <SelectItem value="any-bedrooms">Any</SelectItem>
      //                 {bedroomOptions.map((num) => (
      //                   <SelectItem key={num} value={num.toString()}>
      //                     {num} Bedroom{num > 1 ? "s" : ""}
      //                   </SelectItem>
      //                 ))}
      //               </SelectContent>
      //             </Select>
      //           </MotionSelect>
      //         </div>

      //         {/* Price Range Select */}
      //         <div className="w-48 relative">
      //           <PoundSterling className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
      //           <MotionSelect
      //             whileFocus={{ scale: 1.02 }}
      //             transition={{
      //               type: "spring",
      //               stiffness: 400,
      //               damping: 10,
      //             }}
      //           >
      //             <Select
      //               value={searchParams.priceRange}
      //               onValueChange={(value) =>
      //                 setSearchParams((prev) => ({
      //                   ...prev,
      //                   priceRange: value,
      //                 }))
      //               }
      //             >
      //               <SelectTrigger className="pl-10 h-12">
      //                 <SelectValue placeholder="Price Range" />
      //               </SelectTrigger>
      //               <SelectContent>
      //                 <SelectItem value="any-price">Any Price</SelectItem>
      //                 {priceOptions.map((option) => (
      //                   <SelectItem key={option.value} value={option.value}>
      //                     {option.label}
      //                   </SelectItem>
      //                 ))}
      //               </SelectContent>
      //             </Select>
      //           </MotionSelect>
      //         </div>

      //         <MotionButton
      //           type="submit"
      //           size="lg"
      //           className="h-12 px-8 text-white"
      //           whileHover={{ scale: 1.05 }}
      //           whileTap={{ scale: 0.95 }}
      //         >
      //           <Search className="h-5 w-5 mr-2" />
      //           Search
      //         </MotionButton>
      //       </div>
      //     </form>
      //   </motion.div>
      // </div>
      // {/* Featured Properties */}
      // <section id="properties" ref={propertiesRef} className="py-20 bg-gray-50">
      //   <div className="container mx-auto px-4">
      //     <div
      //       className="text-center mb-12"
      //       // initial="hidden"
      //       // animate={propertiesInView ? "visible" : "hidden"}
      //       // variants={staggerContainer}
      //     >
      //       <h2
      //         className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
      //         // variants={fadeIn}
      //       >
      //         Featured Properties
      //       </h2>
      //       <p
      //         className="text-xl text-gray-600 max-w-2xl mx-auto"
      //         // variants={fadeIn}
      //       >
      //         Discover our handpicked selection of the best rental properties
      //       </p>
      //     </div>

      //     {loading ? (
      //       <div
      //         className="text-center py-12"
      //         // initial={{ opacity: 0 }}
      //         // animate={{ opacity: 1 }}
      //         // exit={{ opacity: 0 }}
      //       >
      //         Loading properties...
      //       </div>
      //     ) : featuredProperties.length === 0 ? (
      //       <div
      //         className="text-center py-12 text-gray-500"
      //         // initial={{ opacity: 0 }}
      //         // animate={{ opacity: 1 }}
      //         // exit={{ opacity: 0 }}
      //       >
      //         No featured properties available at the moment.
      //       </div>
      //     ) : (
      //       <div
      //         className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      //         // initial="hidden"
      //         // animate={propertiesInView ? "visible" : "hidden"}
      //         // variants={staggerContainer}
      //       >
      //         {featuredProperties.map((property, index) => {
      //           const p = mapProperty(property);
      //           return (
      //             // <MotionCard
      //             //   key={p.id}
      //             //   className="pt-0 relative h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-lg border border-gray-100 bg-white cursor-pointer flex flex-col" /* Added flex flex-col */
      //             //   onClick={() => {
      //             //     router.push(`public-properties/${property.id}`);
      //             //   }}
      //             //   transition={{ delay: index * 0.05 }}
      //             // >
      //             //   {/* <motion.div className="pb-0">
      //             //     <motion.img
      //             //       src={
      //             //         p.image === "/placeholder.svg"
      //             //           ? "/placeholder.jpg"
      //             //           : p.image
      //             //       }
      //             //       alt={p.title}
      //             //       className="w-full h-48 object-cover"
      //             //       whileHover={{ scale: 1.05 }}
      //             //       transition={{ duration: 0.3 }}
      //             //     />
      //             //     {p.billsIncluded && (
      //             //       <MotionBadge
      //             //         className="absolute top-3 left-3 bg-green-400"
      //             //         initial={{ opacity: 0, scale: 0 }}
      //             //         animate={{ opacity: 1, scale: 1 }}
      //             //         transition={{ delay: 0.2 + index * 0.05 }}
      //             //       >
      //             //         Bills Included
      //             //       </MotionBadge>
      //             //     )}
      //             //   </motion.div> */}
      //             //   <motion.div
      //             //     className={`grid gap-x-1  md:grid-cols-3 grid-cols-1`}
      //             //   >
      //             //     {/* Main image (2x2) */}
      //             //     <motion.div className="col-span-2 row-span-3 relative rounded-lg overflow-hidden">
      //             //       <img
      //             //         src={property?.images[0]?.image || "/placeholder.jpg"}
      //             //         alt="Property main view"
      //             //         className="object-fill h-48 w-full hover:scale-105 transition-transform duration-300"
      //             //       />
      //             //     </motion.div>

      //             //     {property?.images
      //             //       ?.slice(1, 4)
      //             //       .map((image: PropertyImage, index: number) => (
      //             //         <motion.div
      //             //           key={`right-${index}`}
      //             //           className={`relative rounded-lg overflow-hidden h-[64px] md:block hidden`}
      //             //         >
      //             //           <img
      //             //             src={image.image || "/placeholder.jpg"}
      //             //             alt={`Property view ${index + 2}`}
      //             //             className="object-cover rounded-lg w-full hover:scale-105 transition-transform duration-300"
      //             //           />
      //             //         </motion.div>
      //             //       ))}
      //             //   </motion.div>

      //             //   <CardContent className="px-2 pb-2">
      //             //     <div className="flex items-center justify-between mb-2">
      //             //       <h3 className="font-semibold text-md truncate">
      //             //         {p.location}, {p.area}, {p.city}
      //             //       </h3>
      //             //       <Badge
      //             //         variant={p.furnished ? "default" : "outline"}
      //             //         className="text-xs whitespace-nowrap md:block hidden text-white flex-shrink-0"
      //             //       >
      //             //         {p.furnished ? "Furnished" : "Unfurnished"}
      //             //       </Badge>
      //             //     </div>
      //             //     <div className="flex items-center text-gray-600 mb-2">
      //             //       <MapPin className="h-4 w-4 mr-1" />
      //             //       <span className="text-sm">{p.area}</span>
      //             //     </div>
      //             //     <div className="flex items-center md:justify-between justify-start mb-3">
      //             //       <span className="text-2xl font-bold text-primary">
      //             //         £
      //             //         {(
      //             //           parseFloat(p.price) +
      //             //           (p.utilityAmount
      //             //             ? parseFloat(p.utilityAmount.toString())
      //             //             : 0)
      //             //         ).toFixed(2)}
      //             //       </span>
      //             //       <span className="text-gray-500 md:ml-0 ml-2">
      //             //         per person per week
      //             //       </span>
      //             //     </div>
      //             //     <div className="grid grid-cols-3 text-sm mb-3 border-t border-b border-gray-100 py-2 bg-primary text-white">
      //             //       <div className="flex flex-col items-center justify-center border-r border-gray-100">
      //             //         <span className="font-medium">{p.bedrooms}</span>
      //             //         <span className="text-xs text-white">Beds</span>
      //             //       </div>
      //             //       <div className="flex flex-col items-center justify-center border-r border-gray-100">
      //             //         <span className="font-medium">{p.bathrooms}</span>
      //             //         <span className="text-xs text-white">Baths</span>
      //             //       </div>
      //             //       <div className="flex flex-col items-center justify-center">
      //             //         <span className="font-medium">{p.area || "—"}</span>
      //             //         <span className="text-xs text-white">Area</span>
      //             //       </div>
      //             //     </div>
      //             //     {p.university && (
      //             //       <div className="flex items-center mb-3">
      //             //         <Building className="h-4 w-4 mr-1 text-gray-500 flex-shrink-0" />
      //             //         <span className="text-xs text-gray-600 line-clamp-1">
      //             //           Near {p.university}
      //             //         </span>
      //             //       </div>
      //             //     )}
      //             //     <div className="flex flex-col md:flex-row md:flex-wrap items-start gap-2 mb-4">
      //             //       {p.amenities &&
      //             //         p.amenities.slice(0, 3).map((amenity: string) => (
      //             //           <Badge
      //             //             key={amenity}
      //             //             variant="secondary"
      //             //             className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 max-w-max whitespace-nowrap px-2 py-1 rounded"
      //             //           >
      //             //             {amenity}
      //             //           </Badge>
      //             //         ))}
      //             //       {p.amenities && p.amenities.length > 3 && (
      //             //         <Badge
      //             //           variant="secondary"
      //             //           className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 max-w-max whitespace-nowrap px-2 py-1 rounded"
      //             //         >
      //             //           +{p.amenities.length - 3} more
      //             //         </Badge>
      //             //       )}
      //             //     </div>
      //             //   </CardContent>
      //             //   <div className="mt-auto px-2">
      //             //     <MotionButton
      //             //       className="w-full text-white font-semibold rounded-b-lg"
      //             //       whileHover={{ scale: 1.03 }}
      //             //       whileTap={{ scale: 0.97 }}
      //             //     >
      //             //       View Details
      //             //     </MotionButton>
      //             //   </div>
      //             // </MotionCard>
      //             <div
      //               className="max-w-sm rounded-2xl shadow-lg border p-3 bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:cursor-grab"
      //               key={p.id}
      //               onClick={() => {
      //                 router.push(`public-properties/${property.id}`);
      //               }}
      //             >
      //               {/* Top image + badge */}
      //               <div className="relative">
      //                 <img
      //                   src={property.images[0]?.image || "room1.jpeg"}
      //                   className="w-full h-48 object-cover rounded-xl"
      //                 />
      //                 <span className="absolute top-3 left-3 bg-red-500 text-white text-sm px-3 py-1 rounded-full shadow">
      //                   Available{" "}
      //                   {property.availableAfter
      //                     ? new Date(
      //                         property.availableAfter
      //                       ).toLocaleDateString("en-GB", {
      //                         day: "2-digit",
      //                         month: "short",
      //                         year: "numeric",
      //                       })
      //                     : "Available"}
      //                 </span>

      //                 <div className="absolute bottom-4 left-4 flex gap-2">
      //                   <div className="bg-primary text-white px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
      //                     <Bed className="w-5 h-5" />
      //                     <span>{property.rooms}</span>
      //                   </div>
      //                   <div className="bg-white text-gray-800 px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
      //                     <Bath className="w-5 h-5" />
      //                     <span>{property.bathrooms}</span>
      //                   </div>
      //                 </div>
      //               </div>

      //               {/* Side gallery */}
      //               <div className="grid grid-cols-3 gap-2 mt-2">
      //                 <img
      //                   src={property.images[1]?.image || "room1.jpeg"}
      //                   className="h-20 w-full object-cover rounded-md"
      //                 />
      //                 <img
      //                   src={property.images[2]?.image || "room2.jpeg"}
      //                   className="h-20 w-full object-cover rounded-md"
      //                 />
      //                 <img
      //                   src={property.images[3]?.image || "room3.jpeg"}
      //                   className="h-20 w-full object-cover rounded-md"
      //                 />
      //               </div>

      //               {/* Info section */}
      //               <div className="mt-3">
      //                 <p className="text-xl font-semibold mt-2 text-gray-900">
      //                   £
      //                   {(
      //                     parseFloat(property?.price || "0") +
      //                     (property?.utilityAmount
      //                       ? parseFloat(property?.utilityAmount.toString())
      //                       : 0)
      //                   ).toFixed(2)}
      //                   <span className="text-sm font-normal ml-1">
      //                     Per Person Per Week
      //                   </span>
      //                 </p>

      //                 <p className="font-semibold mt-2 mb-1 text-gray-800">
      //                   {p.location}, {p.area}, {p.city}
      //                 </p>

      //                 <div className="flex flex-col gap-2">
      //                   <div className="flex items-center gap-2 text-gray-700">
      //                     <MapPin className="w-4 h-4 text-red-500" />
      //                     <span className="font-medium">{p.city}</span>
      //                   </div>
      //                   <div className="flex items-center gap-2 text-gray-700">
      //                     <FileText className="w-4 h-4 text-red-500" />
      //                     <span className="font-medium">Bills Included</span>
      //                   </div>
      //                 </div>
      //               </div>
      //             </div>
      //           );
      //         })}
      //       </div>
      //     )}

      //     <motion.div
      //       className="text-center mt-12"
      //       initial={{ opacity: 0, y: 20 }}
      //       animate={
      //         propertiesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
      //       }
      //       transition={{ delay: 0.6 }}
      //     >
      //       <MotionButton
      //         size="lg"
      //         variant="outline"
      //         whileHover={{ scale: 1.05, x: 5 }}
      //         whileTap={{ scale: 0.95 }}
      //         onClick={() => router.push("/public-properties")}
      //       >
      //         View All Properties
      //         <motion.div
      //           animate={{ x: [0, 5, 0] }}
      //           transition={{
      //             repeat: Infinity,
      //             duration: 1.5,
      //             repeatType: "reverse",
      //           }}
      //         >
      //           <ArrowRight className="h-5 w-5 ml-2" />
      //         </motion.div>
      //       </MotionButton>
      //     </motion.div>
      //   </div>
      // </section>

      // {/* How It Works */}
      // <section id="how-it-works" ref={howItWorksRef} className="py-20">
      //   <div className="container mx-auto px-4">
      //     <motion.div
      //       className="text-center mb-12"
      //       initial="hidden"
      //       animate={howItWorksInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       <motion.h2
      //         className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
      //         variants={fadeIn}
      //       >
      //         How It Works
      //       </motion.h2>
      //       <motion.p
      //         className="text-xl text-gray-600 max-w-2xl mx-auto"
      //         variants={fadeIn}
      //       >
      //         Simple steps to find your perfect rental or list your property
      //       </motion.p>
      //     </motion.div>

      //     <motion.div
      //       className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto"
      //       initial="hidden"
      //       animate={howItWorksInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       {/* For Tenants */}
      //       <motion.div variants={fadeIn}>
      //         <motion.h3
      //           className="text-2xl font-bold text-gray-900 mb-6 text-center"
      //           variants={fadeIn}
      //         >
      //           For Tenants
      //         </motion.h3>
      //         <motion.div className="space-y-6" variants={staggerContainer}>
      //           {[
      //             {
      //               step: 1,
      //               title: "Search Properties",
      //               desc: "Browse thousands of verified rental properties in your desired location.",
      //             },
      //             {
      //               step: 2,
      //               title: "Schedule Viewing",
      //               desc: "Book virtual or in-person tours at your convenience.",
      //             },
      //             {
      //               step: 3,
      //               title: "Apply Online",
      //               desc: "Submit your application with all required documents digitally.",
      //             },
      //             {
      //               step: 4,
      //               title: "Move In",
      //               desc: "Sign your lease digitally and get your keys to your new home.",
      //             },
      //           ].map((item, index) => (
      //             <motion.div
      //               key={index}
      //               className="flex items-start space-x-4"
      //               variants={fadeIn}
      //               transition={{ delay: index * 0.1 }}
      //             >
      //               <motion.div
      //                 className="bg-primary text-white rounded-full px-3 py-2 flex items-center justify-center font-bold"
      //                 whileHover={{ scale: 1.2, rotate: 10 }}
      //               >
      //                 {item.step}
      //               </motion.div>
      //               <div>
      //                 <h4 className="font-semibold text-lg mb-2">
      //                   {item.title}
      //                 </h4>
      //                 <p className="text-gray-600">{item.desc}</p>
      //               </div>
      //             </motion.div>
      //           ))}
      //         </motion.div>
      //       </motion.div>

      //       {/* For Landlords */}
      //       <motion.div variants={fadeIn}>
      //         <motion.h3
      //           className="text-2xl font-bold text-gray-900 mb-6 text-center"
      //           variants={fadeIn}
      //         >
      //           For Landlords
      //         </motion.h3>
      //         <motion.div className="space-y-6" variants={staggerContainer}>
      //           {[
      //             {
      //               step: 1,
      //               title: "List Property",
      //               desc: "Create detailed listings with photos and property information.",
      //             },
      //             {
      //               step: 2,
      //               title: "Screen Tenants",
      //               desc: "Review applications and run background checks automatically.",
      //             },
      //             {
      //               step: 3,
      //               title: "Manage Leases",
      //               desc: "Handle lease agreements, renewals, and terminations digitally.",
      //             },
      //             {
      //               step: 4,
      //               title: "Collect Rent",
      //               desc: "Receive payments automatically and track all transactions.",
      //             },
      //           ].map((item, index) => (
      //             <motion.div
      //               key={index}
      //               className="flex items-start space-x-4"
      //               variants={fadeIn}
      //               transition={{ delay: index * 0.1 }}
      //             >
      //               <motion.div
      //                 className="bg-secondary text-white rounded-full px-3 py-2 flex items-center justify-center font-bold"
      //                 whileHover={{ scale: 1.2, rotate: -10 }}
      //               >
      //                 {item.step}
      //               </motion.div>
      //               <div>
      //                 <h4 className="font-semibold text-lg mb-2">
      //                   {item.title}
      //                 </h4>
      //                 <p className="text-gray-600">{item.desc}</p>
      //               </div>
      //             </motion.div>
      //           ))}
      //         </motion.div>
      //       </motion.div>
      //     </motion.div>
      //   </div>
      // </section>

      // {/* Features */}
      // <section ref={featuresRef} className="py-20 bg-gray-50">
      //   <div className="container mx-auto px-4">
      //     <motion.div
      //       className="text-center mb-12"
      //       initial="hidden"
      //       animate={featuresInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       <motion.h2
      //         className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
      //         variants={fadeIn}
      //       >
      //         Why Choose Student Moves?
      //       </motion.h2>
      //       <motion.p
      //         className="text-xl text-gray-600 max-w-2xl mx-auto"
      //         variants={fadeIn}
      //       >
      //         Everything you need for a seamless rental experience
      //       </motion.p>
      //     </motion.div>

      //     <motion.div
      //       className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      //       initial="hidden"
      //       animate={featuresInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       {[
      //         {
      //           icon: Shield,
      //           title: "Verified Properties",
      //           desc: "All properties are verified and inspected to ensure quality and safety standards.",
      //         },
      //         {
      //           icon: Clock,
      //           title: "24/7 Support",
      //           desc: "Round-the-clock customer support to help with any questions or issues.",
      //         },
      //         {
      //           icon: CreditCard,
      //           title: "Secure Payments",
      //           desc: "Safe and secure payment processing with multiple payment options available.",
      //         },
      //         {
      //           icon: MessageSquare,
      //           title: "Easy Communication",
      //           desc: "Built-in messaging system for seamless communication between tenants and landlords.",
      //         },
      //         {
      //           icon: Key,
      //           title: "Digital Leasing",
      //           desc: "Complete the entire leasing process online with digital signatures and documents.",
      //         },
      //         {
      //           icon: CheckCircle,
      //           title: "Maintenance Tracking",
      //           desc: "Easy maintenance request system with real-time tracking and updates.",
      //         },
      //       ].map((feature, index) => (
      //         <MotionCard
      //           key={index}
      //           className="text-center p-6"
      //           variants={scaleIn}
      //           whileHover={{
      //             y: -10,
      //             boxShadow:
      //               "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      //           }}
      //           transition={{ delay: index * 0.1 }}
      //         >
      //           <motion.div
      //             initial={{ scale: 0 }}
      //             animate={{ scale: 1 }}
      //             transition={{
      //               type: "spring",
      //               stiffness: 260,
      //               damping: 20,
      //               delay: 0.1 + index * 0.1,
      //             }}
      //           >
      //             <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
      //           </motion.div>
      //           <CardTitle className="mb-3">{feature.title}</CardTitle>
      //           <CardDescription>{feature.desc}</CardDescription>
      //         </MotionCard>
      //       ))}
      //     </motion.div>
      //   </div>
      // </section>

      // {/* Testimonials */}
      // <section ref={testimonialsRef} className="py-20">
      //   <div className="container mx-auto px-4">
      //     <motion.div
      //       className="text-center mb-12"
      //       initial="hidden"
      //       animate={testimonialsInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       <motion.h2
      //         className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
      //         variants={fadeIn}
      //       >
      //         What Our Users Say
      //       </motion.h2>
      //       <motion.p
      //         className="text-xl text-gray-600 max-w-2xl mx-auto"
      //         variants={fadeIn}
      //       >
      //         Don't just take our word for it - hear from our satisfied
      //         customers
      //       </motion.p>
      //     </motion.div>

      //     <motion.div
      //       className="grid grid-cols-1 md:grid-cols-3 gap-8"
      //       initial="hidden"
      //       animate={testimonialsInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       {testimonials.map((testimonial, index) => (
      //         <MotionCard
      //           key={index}
      //           className="p-6"
      //           variants={scaleIn}
      //           whileHover={{
      //             y: -10,
      //             boxShadow:
      //               "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      //           }}
      //           transition={{ delay: index * 0.1 }}
      //         >
      //           <CardContent className="p-0">
      //             <motion.div
      //               className="flex items-center mb-4"
      //               initial="hidden"
      //               animate="visible"
      //               variants={staggerContainer}
      //             >
      //               {[...Array(testimonial.rating)].map((_, i) => (
      //                 <motion.div
      //                   key={i}
      //                   variants={scaleIn}
      //                   transition={{ delay: i * 0.1 }}
      //                 >
      //                   <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      //                 </motion.div>
      //               ))}
      //             </motion.div>
      //             <motion.p
      //               className="text-gray-600 mb-4 italic"
      //               initial={{ opacity: 0 }}
      //               animate={{ opacity: 1 }}
      //               transition={{ delay: 0.3 }}
      //             >
      //               "{testimonial.content}"
      //             </motion.p>
      //             <motion.div
      //               className="flex items-center"
      //               initial={{ x: -20, opacity: 0 }}
      //               animate={{ x: 0, opacity: 1 }}
      //               transition={{ delay: 0.4 }}
      //             >
      //               <Avatar className="h-10 w-10 mr-3">
      //                 <AvatarImage
      //                   src={testimonial.avatar || "/placeholder.svg"}
      //                 />
      //                 <AvatarFallback>
      //                   {testimonial.name
      //                     .split(" ")
      //                     .map((n) => n[0])
      //                     .join("")}
      //                 </AvatarFallback>
      //               </Avatar>
      //               <div>
      //                 <div className="font-semibold">{testimonial.name}</div>
      //                 <div className="text-sm text-gray-600">
      //                   {testimonial.role}
      //                 </div>
      //               </div>
      //             </motion.div>
      //           </CardContent>
      //         </MotionCard>
      //       ))}
      //     </motion.div>
      //   </div>
      // </section>

      // {/* About Us Section */}
      // <section id="about" ref={aboutRef} className="py-20 bg-gray-50">
      //   <div className="container mx-auto px-4">
      //     <motion.div
      //       className="text-center mb-12"
      //       initial="hidden"
      //       animate={aboutInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       <motion.h2
      //         className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
      //         variants={fadeIn}
      //       >
      //         About Student Moves
      //       </motion.h2>
      //       <motion.p
      //         className="text-xl text-gray-600 max-w-3xl mx-auto"
      //         variants={fadeIn}
      //       >
      //         We're revolutionizing the rental industry by connecting property
      //         owners and tenants through innovative technology and exceptional
      //         service.
      //       </motion.p>
      //     </motion.div>

      //     <motion.div
      //       className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16"
      //       initial="hidden"
      //       animate={aboutInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       <motion.div variants={fadeIn}>
      //         <motion.h3
      //           className="text-2xl font-bold text-gray-900 mb-6"
      //           variants={fadeIn}
      //         >
      //           Our Mission
      //         </motion.h3>
      //         <motion.p className="text-gray-600 mb-6" variants={fadeIn}>
      //           At Student Moves, we believe finding and managing student
      //           accommodation should be simple, transparent, and stress-free.
      //           Our platform brings together high-quality, all-inclusive homes
      //           with verified landlords and agents, creating a smooth experience
      //           for students from start to finish.
      //         </motion.p>
      //         <motion.p className="text-gray-600 mb-6" variants={fadeIn}>
      //           We’ve grown into a trusted nationwide platform helping thousands
      //           of students find their ideal homes every year. Our focus on
      //           innovation, reliability, and customer satisfaction drives
      //           everything we do.
      //         </motion.p>
      //         <motion.div
      //           className="grid grid-cols-2 gap-6"
      //           variants={staggerContainer}
      //         >
      //           {/* {[
      //             { title: "Founded", value: "2020" },
      //             { title: "Headquarters", value: "Seattle, WA" },
      //             { title: "Team Size", value: "150+ Employees" },
      //             { title: "Markets", value: "25+ Cities" },
      //           ].map((item, index) => (
      //             <motion.div
      //               key={index}
      //               variants={scaleIn}
      //               transition={{ delay: index * 0.1 }}
      //             >
      //               <h4 className="font-semibold text-lg text-gray-900 mb-2">
      //                 {item.title}
      //               </h4>
      //               <p className="text-gray-600">{item.value}</p>
      //             </motion.div>
      //           ))} */}
      //         </motion.div>
      //       </motion.div>
      //       <motion.div className="relative" variants={fadeIn}>
      //         <motion.img
      //           src="team.jpeg"
      //           alt="Student Moves Team"
      //           className="rounded-lg shadow-lg w-full"
      //           initial={{ opacity: 0, y: 20 }}
      //           animate={{ opacity: 1, y: 0 }}
      //           transition={{ duration: 0.6 }}
      //           whileHover={{ scale: 1.03 }}
      //         />
      //       </motion.div>
      //     </motion.div>

      //     {/* Values */}
      //     <motion.div
      //       className="mb-16"
      //       initial="hidden"
      //       animate={aboutInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       <motion.h3
      //         className="text-2xl font-bold text-gray-900 mb-8 text-center"
      //         variants={fadeIn}
      //       >
      //         Our Values
      //       </motion.h3>
      //       <motion.div
      //         className="grid grid-cols-1 md:grid-cols-3 gap-8"
      //         variants={staggerContainer}
      //       >
      //         {[
      //           {
      //             icon: Shield,
      //             title: "Trust & Transparency",
      //             desc: "We believe in honest communication and transparent processes. Every property is verified, and all fees are clearly disclosed.",
      //           },
      //           {
      //             icon: CheckCircle,
      //             title: "Quality First",
      //             desc: "We maintain high standards for all properties on our platform and continuously improve our services based on user feedback.",
      //           },
      //           {
      //             icon: MessageSquare,
      //             title: "Customer Success",
      //             desc: "Your success is our success. We're committed to providing exceptional support and tools to help you achieve your goals.",
      //           },
      //         ].map((value, index) => (
      //           <MotionCard
      //             key={index}
      //             className="text-center p-6"
      //             variants={scaleIn}
      //             whileHover={{
      //               y: -10,
      //               boxShadow:
      //                 "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      //             }}
      //             transition={{ delay: index * 0.1 }}
      //           >
      //             <motion.div
      //               animate={{
      //                 y: [0, -10, 0],
      //                 transition: {
      //                   repeat: Infinity,
      //                   duration: 3,
      //                   delay: index * 0.5,
      //                 },
      //               }}
      //             >
      //               <value.icon className="h-12 w-12 text-primary mx-auto mb-4" />
      //             </motion.div>
      //             <CardTitle className="mb-3">{value.title}</CardTitle>
      //             <CardDescription>{value.desc}</CardDescription>
      //           </MotionCard>
      //         ))}
      //       </motion.div>
      //     </motion.div>
      //   </div>
      // </section>

      // {/* Contact Section */}
      // <section id="contact" ref={contactRef} className="py-20">
      //   <div className="container mx-auto px-4">
      //     <motion.div
      //       className="text-center mb-12"
      //       initial="hidden"
      //       animate={contactInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       <motion.h2
      //         className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
      //         variants={fadeIn}
      //       >
      //         Contact Us
      //       </motion.h2>
      //       <motion.p
      //         className="text-xl text-gray-600 max-w-2xl mx-auto"
      //         variants={fadeIn}
      //       >
      //         Have questions or need assistance? We're here to help!
      //       </motion.p>
      //     </motion.div>

      //     <motion.div
      //       className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto"
      //       initial="hidden"
      //       animate={contactInView ? "visible" : "hidden"}
      //       variants={staggerContainer}
      //     >
      //       {/* Contact Form */}
      //       <motion.div variants={fadeIn}>
      //         <motion.h3
      //           className="text-2xl font-bold text-gray-900 mb-6"
      //           variants={fadeIn}
      //         >
      //           Send Us a Message
      //         </motion.h3>
      //         <motion.form
      //           onSubmit={handleSubmit}
      //           className="space-y-4"
      //           variants={staggerContainer}
      //         >
      //           <motion.div
      //             className="grid grid-cols-1 md:grid-cols-2 gap-4"
      //             variants={staggerContainer}
      //           >
      //             <motion.div variants={fadeIn}>
      //               <label className="block text-sm font-medium text-gray-700 mb-1">
      //                 First Name
      //               </label>
      //               <MotionInput
      //                 type="text"
      //                 name="firstName"
      //                 value={formData.firstName}
      //                 onChange={handleInputChange}
      //                 required
      //                 whileFocus={{ scale: 1.02 }}
      //                 transition={{
      //                   type: "spring",
      //                   stiffness: 400,
      //                   damping: 10,
      //                 }}
      //               />
      //             </motion.div>
      //             <motion.div variants={fadeIn}>
      //               <label className="block text-sm font-medium text-gray-700 mb-1">
      //                 Last Name
      //               </label>
      //               <MotionInput
      //                 type="text"
      //                 name="lastName"
      //                 value={formData.lastName}
      //                 onChange={handleInputChange}
      //                 required
      //                 whileFocus={{ scale: 1.02 }}
      //                 transition={{
      //                   type: "spring",
      //                   stiffness: 400,
      //                   damping: 10,
      //                 }}
      //               />
      //             </motion.div>
      //           </motion.div>
      //           <motion.div
      //             className="grid grid-cols-1 md:grid-cols-2 gap-4"
      //             variants={staggerContainer}
      //           >
      //             <motion.div variants={fadeIn}>
      //               <label className="block text-sm font-medium text-gray-700 mb-1">
      //                 Email
      //               </label>
      //               <MotionInput
      //                 type="email"
      //                 name="email"
      //                 value={formData.email}
      //                 onChange={handleInputChange}
      //                 required
      //                 whileFocus={{ scale: 1.02 }}
      //                 transition={{
      //                   type: "spring",
      //                   stiffness: 400,
      //                   damping: 10,
      //                 }}
      //               />
      //             </motion.div>
      //             <motion.div variants={fadeIn}>
      //               <label className="block text-sm font-medium text-gray-700 mb-1">
      //                 Phone
      //               </label>
      //               <MotionInput
      //                 type="tel"
      //                 name="phone"
      //                 value={formData.phone}
      //                 onChange={handleInputChange}
      //                 whileFocus={{ scale: 1.02 }}
      //                 transition={{
      //                   type: "spring",
      //                   stiffness: 400,
      //                   damping: 10,
      //                 }}
      //               />
      //             </motion.div>
      //           </motion.div>
      //           <motion.div variants={fadeIn}>
      //             <label className="block text-sm font-medium text-gray-700 mb-1">
      //               Subject
      //             </label>
      //             <MotionInput
      //               type="text"
      //               name="subject"
      //               value={formData.subject}
      //               onChange={handleInputChange}
      //               required
      //               whileFocus={{ scale: 1.02 }}
      //               transition={{ type: "spring", stiffness: 400, damping: 10 }}
      //             />
      //           </motion.div>
      //           <motion.div variants={fadeIn}>
      //             <label className="block text-sm font-medium text-gray-700 mb-1">
      //               Message
      //             </label>
      //             <motion.textarea
      //               name="message"
      //               value={formData.message}
      //               onChange={handleInputChange}
      //               required
      //               rows={4}
      //               className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      //               whileFocus={{ scale: 1.02 }}
      //               transition={{ type: "spring", stiffness: 400, damping: 10 }}
      //             />
      //           </motion.div>
      //           <motion.div variants={fadeIn}>
      //             <MotionButton
      //               type="submit"
      //               className="w-full text-white"
      //               whileHover={{ scale: 1.05 }}
      //               whileTap={{ scale: 0.95 }}
      //             >
      //               Send Message
      //             </MotionButton>
      //           </motion.div>
      //         </motion.form>
      //       </motion.div>

      //       {/* Contact Info */}
      //       <motion.div variants={fadeIn}>
      //         <motion.h3
      //           className="text-2xl font-bold text-gray-900 mb-6"
      //           variants={fadeIn}
      //         >
      //           Get in Touch
      //         </motion.h3>
      //         <motion.div className="space-y-6" variants={staggerContainer}>
      //           {/* <motion.div
      //             className="flex items-start space-x-4"
      //             variants={fadeIn}
      //           >
      //             <motion.div
      //               whileHover={{ scale: 1.2, rotate: 15 }}
      //               className="text-primary"
      //             >
      //               <MapPin className="h-6 w-6" />
      //             </motion.div>
      //             <div>
      //               <h4 className="font-semibold text-lg mb-1">Our Office</h4>
      //               <p className="text-gray-600">
      //                 123 Main Street, Suite 456
      //                 <br />
      //                 Seattle, WA 98101
      //               </p>
      //             </div>
      //           </motion.div> */}
      //           <motion.div
      //             className="flex items-start space-x-4"
      //             variants={fadeIn}
      //           >
      //             <motion.div
      //               whileHover={{ scale: 1.2, rotate: 15 }}
      //               className="text-primary"
      //             >
      //               <Phone className="h-6 w-6" />
      //             </motion.div>
      //             <div>
      //               <h4 className="font-semibold text-lg mb-1">Phone</h4>
      //               <p className="text-gray-600">01509 274440</p>
      //             </div>
      //           </motion.div>
      //           <motion.div
      //             className="flex items-start space-x-4"
      //             variants={fadeIn}
      //           >
      //             <motion.div
      //               whileHover={{ scale: 1.2, rotate: 15 }}
      //               className="text-primary"
      //             >
      //               <Mail className="h-6 w-6" />
      //             </motion.div>
      //             <div>
      //               <h4 className="font-semibold text-lg mb-1">Email</h4>
      //               <p className="text-gray-600">info@studentmoves.co.uk</p>
      //             </div>
      //           </motion.div>
      //           {/* <motion.div
      //             className="flex items-start space-x-4"
      //             variants={fadeIn}
      //           >
      //             <motion.div
      //               whileHover={{ scale: 1.2, rotate: 15 }}
      //               className="text-primary"
      //             >
      //               <Clock className="h-6 w-6" />
      //             </motion.div>
      //             <div>
      //               <h4 className="font-semibold text-lg mb-1">
      //                 Business Hours
      //               </h4>
      //               <p className="text-gray-600">
      //                 Monday - Friday: 9am - 6pm
      //                 <br />
      //                 Saturday: 10am - 4pm
      //                 <br />
      //                 Sunday: Closed
      //               </p>
      //             </div>
      //           </motion.div> */}
      //           <motion.div className="pt-4" variants={fadeIn}>
      //             <h4 className="font-semibold text-lg mb-3">Follow Us</h4>
      //             <div className="flex space-x-4">
      //               <motion.a
      //                 href="#"
      //                 className="text-gray-600 hover:text-primary"
      //                 whileHover={{ scale: 1.2, rotate: 5 }}
      //                 whileTap={{ scale: 0.9 }}
      //               >
      //                 <span className="sr-only">Facebook</span>
      //                 <Facebook className="h-6 w-6" />
      //               </motion.a>
      //               <motion.a
      //                 href="#"
      //                 className="text-gray-600 hover:text-primary"
      //                 whileHover={{ scale: 1.2, rotate: 5 }}
      //                 whileTap={{ scale: 0.9 }}
      //               >
      //                 <span className="sr-only">Twitter</span>
      //                 <Twitter className="h-6 w-6" />
      //               </motion.a>
      //               <motion.a
      //                 href="https://www.instagram.com/student.moves"
      //                 className="text-gray-600 hover:text-primary"
      //                 whileHover={{ scale: 1.2, rotate: 5 }}
      //                 whileTap={{ scale: 0.9 }}
      //               >
      //                 <span className="sr-only">Instagram</span>
      //                 <Instagram className="h-6 w-6" />
      //               </motion.a>
      //             </div>
      //           </motion.div>
      //         </motion.div>
      //       </motion.div>
      //     </motion.div>
      //   </div>
      // </section>

      // {/* Footer */}
      // <motion.footer
      //   className="bg-gray-900 text-white py-12"
      //   initial={{ opacity: 0 }}
      //   animate={{ opacity: 1 }}
      //   transition={{ delay: 0.5 }}
      // >
      //   <div className="container mx-auto px-4">
      //     <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      //       <div>
      //         <motion.img
      //           src="smlogo.png"
      //           alt="Student Moves"
      //           className="h-12 mb-4"
      //           whileHover={{ scale: 1.05 }}
      //         />
      //         <p className="text-gray-400 mb-4">
      //           Making rental simple, transparent, and stress-free for everyone.
      //         </p>
      //         <div className="flex space-x-4">
      //           <motion.a
      //             href="#"
      //             className="text-gray-400 hover:text-white"
      //             whileHover={{ scale: 1.2, rotate: 5 }}
      //             whileTap={{ scale: 0.9 }}
      //           >
      //             <Facebook className="h-5 w-5" />
      //           </motion.a>
      //           <motion.a
      //             href="#"
      //             className="text-gray-400 hover:text-white"
      //             whileHover={{ scale: 1.2, rotate: 5 }}
      //             whileTap={{ scale: 0.9 }}
      //           >
      //             <Twitter className="h-5 w-5" />
      //           </motion.a>
      //           <motion.a
      //             href="https://www.instagram.com/student.moves"
      //             className="text-gray-400 hover:text-white"
      //             whileHover={{ scale: 1.2, rotate: 5 }}
      //             whileTap={{ scale: 0.9 }}
      //           >
      //             <Instagram className="h-5 w-5" />
      //           </motion.a>
      //         </div>
      //       </div>
      //       <div>
      //         <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
      //         <ul className="space-y-2">
      //           {/* {["Home", "Properties", "How It Works", "About", "Contact"].map(
      //             (link, index) => (
      //               <motion.li key={index} whileHover={{ x: 5 }}>
      //                 <a href="#" className="text-gray-400 hover:text-white">
      //                   {link}
      //                 </a>
      //               </motion.li>
      //             )
      //           )} */}
      //           <motion.li whileHover={{ x: 5 }}>
      //             <a href="#" className="text-gray-400 hover:text-white">
      //               Home
      //             </a>
      //           </motion.li>
      //           <motion.li whileHover={{ x: 5 }}>
      //             <a
      //               href="/public-properties"
      //               className="text-gray-400 hover:text-white"
      //             >
      //               Properties
      //             </a>
      //           </motion.li>
      //           <motion.li whileHover={{ x: 5 }}>
      //             <a
      //               href="#how-it-works"
      //               className="text-gray-400 hover:text-white"
      //             >
      //               How It Works
      //             </a>
      //           </motion.li>
      //           <motion.li whileHover={{ x: 5 }}>
      //             <a href="#about" className="text-gray-400 hover:text-white">
      //               About
      //             </a>
      //           </motion.li>
      //           <motion.li whileHover={{ x: 5 }}>
      //             <a href="#contact" className="text-gray-400 hover:text-white">
      //               Contact
      //             </a>
      //           </motion.li>
      //         </ul>
      //       </div>
      //       <div>
      //         <h4 className="font-semibold text-lg mb-4">For Tenants</h4>
      //         <ul className="space-y-2">
      //           {/* {[
      //             "Search Properties",
      //             "Saved Properties",
      //             "Tenant Resources",
      //             "Rental Guide",
      //             "FAQs",
      //           ].map((link, index) => (
      //             <motion.li key={index} whileHover={{ x: 5 }}>
      //               <a href="#" className="text-gray-400 hover:text-white">
      //                 {link}
      //               </a>
      //             </motion.li>
      //           ))} */}
      //           <motion.li>
      //             <div className="flex flex-col space-y-2">
      //               <a
      //                 href="/public-properties"
      //                 className="text-gray-400 hover:text-white"
      //               >
      //                 Search Properties
      //               </a>
      //             </div>
      //           </motion.li>
      //           <motion.li>
      //             <div className="flex flex-col space-y-2">
      //               <a href="/signin" className="text-gray-400 hover:text-white">
      //                 Student Dashboard
      //               </a>
      //             </div>
      //           </motion.li>
      //            <motion.li>
      //             <div className="flex flex-col space-y-2">
      //               <a href="/faq" className="text-gray-400 hover:text-white">
      //                 FAQs
      //               </a>
      //             </div>
      //           </motion.li>
      //         </ul>
      //       </div>
      //       <div>
      //         <h4 className="font-semibold text-lg mb-4">For Landlords</h4>
      //         <ul className="space-y-2">
      //           <li>
      //             <div className="flex flex-col space-y-2">
      //               <a
      //                 href="/auth/signin"
      //                 className="text-gray-400 hover:text-white"
      //               >
      //                 Landlord Dashboard
      //               </a>
      //               <a
      //                 href="/auth/signin"
      //                 className="text-gray-400 hover:text-white"
      //               >
      //                 Property Management
      //               </a>
      //             </div>
      //           </li>
      //         </ul>
      //       </div>
      //     </div>
      //     <motion.div
      //       className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400"
      //       initial={{ opacity: 0 }}
      //       animate={{ opacity: 1 }}
      //       transition={{ delay: 0.8 }}
      //     >
      //       <div className="">
      //         <p>
      //           &copy; {new Date().getFullYear()} Student Moves. All rights
      //           reserved. |{" "}
      //           <a
      //             href="/privacy-policy"
      //             className="hover:text-white transition-colors"
      //           >
      //             Privacy Policy
      //           </a>{" "}
      //           |{" "}
      //           <a href="/terms" className="hover:text-white transition-colors">
      //             Terms of Service
      //           </a>
      //         </p>
      //       </div>
      //     </motion.div>
      //   </div>
      // </motion.footer>
      
