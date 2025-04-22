import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Filter,
  MapPin,
  Star,
  Clock,
  Utensils,
  Bookmark
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import LocationMap from "@/components/LocationMap";

interface RestaurantsTabProps {
  zipCode: string;
}

interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  rating: number;
  priceLevel: 1 | 2 | 3 | 4;
  cuisine: string[];
  hours: string;
  phoneNumber: string;
  latitude?: number;
  longitude?: number;
  features: string[];
}

export default function RestaurantsTab({ zipCode }: RestaurantsTabProps) {
  const { language } = useLanguage();
  const [filters, setFilters] = useState({
    priceRange: [4],
    cuisine: {
      mexican: false,
      italian: false,
      american: false,
      asian: false
    }
  });
  const [showMap, setShowMap] = useState(false);

  const { data: restaurants, isLoading } = useQuery({
    queryKey: [`/api/restaurants/${zipCode}`],
    enabled: zipCode.length === 5,
  });

  const translations = {
    restaurants: language === 'es' ? "Restaurantes Cercanos" : "Nearby Restaurants",
    filter: language === 'es' ? "Filtrar" : "Filter",
    priceRange: language === 'es' ? "Rango de Precio" : "Price Range",
    cuisine: language === 'es' ? "Cocina" : "Cuisine",
    mexican: language === 'es' ? "Mexicana" : "Mexican",
    italian: language === 'es' ? "Italiana" : "Italian",
    american: language === 'es' ? "Americana" : "American",
    asian: language === 'es' ? "Asiática" : "Asian",
    apply: language === 'es' ? "Aplicar" : "Apply",
    showMap: language === 'es' ? "Mostrar Mapa" : "Show Map",
    hideMap: language === 'es' ? "Ocultar Mapa" : "Hide Map",
    noRestaurants: language === 'es' 
      ? "No hay restaurantes en esta área. Intenta con otro código postal."
      : "No restaurants in this area. Try a different ZIP code.",
    price: language === 'es' ? "Precio" : "Price",
    hours: language === 'es' ? "Horario" : "Hours",
    features: language === 'es' ? "Características" : "Features",
    distance: language === 'es' ? "Distancia" : "Distance",
    call: language === 'es' ? "Llamar" : "Call",
    website: language === 'es' ? "Sitio Web" : "Website",
    save: language === 'es' ? "Guardar" : "Save"
  };

  // For the price level display
  const getPriceLevel = (level: number) => {
    return "$".repeat(level);
  };

  // Update price range
  const handlePriceRangeChange = (value: number[]) => {
    setFilters({
      ...filters,
      priceRange: value
    });
  };

  // Update cuisine filters
  const handleCuisineChange = (cuisine: keyof typeof filters.cuisine) => {
    setFilters(prev => ({
      ...prev,
      cuisine: {
        ...prev.cuisine,
        [cuisine]: !prev.cuisine[cuisine]
      }
    }));
  };

  // Filter restaurants
  const filteredRestaurants = restaurants && Array.isArray(restaurants) 
    ? restaurants.filter((restaurant: Restaurant) => {
        // Filter by price range
        if (restaurant.priceLevel > filters.priceRange[0]) {
          return false;
        }
        
        // Filter by cuisine
        if (filters.cuisine.mexican || filters.cuisine.italian || filters.cuisine.american || filters.cuisine.asian) {
          return (
            (filters.cuisine.mexican && restaurant.cuisine.includes('mexican')) ||
            (filters.cuisine.italian && restaurant.cuisine.includes('italian')) ||
            (filters.cuisine.american && restaurant.cuisine.includes('american')) ||
            (filters.cuisine.asian && restaurant.cuisine.includes('asian'))
          );
        }
        
        return true;
      })
    : [];

  // Get map locations for restaurants
  const mapLocations = filteredRestaurants?.map((restaurant: Restaurant) => ({
    latitude: restaurant.latitude || 0,
    longitude: restaurant.longitude || 0,
    name: restaurant.name,
    description: restaurant.description,
    imageUrl: restaurant.imageUrl
  })) || [];

  // Determine if we have location data for the map
  const hasLocationData = mapLocations.length > 0 && mapLocations[0].latitude !== 0;

  return (
    <div className="space-y-6">
      <Card className="dark-card">
        <CardHeader className="dark-card-header flex flex-row justify-between items-center">
          <CardTitle className="text-blue-400">{translations.restaurants}</CardTitle>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="dark-secondary-button text-sm">
                  <Filter className="h-4 w-4 mr-1" /> {translations.filter}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-[#1e1e1e] border border-[#333] text-gray-200">
                <div className="p-2">
                  <div className="mb-2 font-medium text-blue-400">{translations.priceRange}</div>
                  <div className="px-2 py-4">
                    <Slider
                      defaultValue={[4]}
                      max={4}
                      min={1}
                      step={1}
                      value={filters.priceRange}
                      onValueChange={handlePriceRangeChange}
                      className="my-4"
                    />
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>$</span>
                      <span>$$</span>
                      <span>$$$</span>
                      <span>$$$$</span>
                    </div>
                    <div className="text-center mt-2 text-blue-400">
                      {getPriceLevel(filters.priceRange[0])}
                    </div>
                  </div>
                  
                  <div className="mt-4 mb-2 font-medium text-blue-400">{translations.cuisine}</div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="mexican" 
                        checked={filters.cuisine.mexican}
                        onCheckedChange={() => handleCuisineChange('mexican')}
                        className="border-blue-500 data-[state=checked]:bg-blue-500"
                      />
                      <Label htmlFor="mexican" className="text-gray-300">{translations.mexican}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="italian" 
                        checked={filters.cuisine.italian}
                        onCheckedChange={() => handleCuisineChange('italian')}
                        className="border-blue-500 data-[state=checked]:bg-blue-500"
                      />
                      <Label htmlFor="italian" className="text-gray-300">{translations.italian}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="american" 
                        checked={filters.cuisine.american}
                        onCheckedChange={() => handleCuisineChange('american')}
                        className="border-blue-500 data-[state=checked]:bg-blue-500"
                      />
                      <Label htmlFor="american" className="text-gray-300">{translations.american}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="asian" 
                        checked={filters.cuisine.asian}
                        onCheckedChange={() => handleCuisineChange('asian')}
                        className="border-blue-500 data-[state=checked]:bg-blue-500"
                      />
                      <Label htmlFor="asian" className="text-gray-300">{translations.asian}</Label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {hasLocationData && (
              <Button 
                variant="outline" 
                size="sm" 
                className="dark-secondary-button text-sm"
                onClick={() => setShowMap(!showMap)}
              >
                <MapPin className="h-4 w-4 mr-1" /> 
                {showMap ? translations.hideMap : translations.showMap}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex flex-col md:flex-row border border-[#333] bg-[#252525] rounded-lg overflow-hidden">
                  <Skeleton className="w-full md:w-1/4 h-24 md:h-auto bg-[#333]" />
                  <div className="w-full md:w-3/4 p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4 bg-[#333]" />
                    <Skeleton className="h-4 w-1/2 bg-[#333]" />
                    <Skeleton className="h-4 w-5/6 bg-[#333]" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-4 w-16 bg-[#333]" />
                      <Skeleton className="h-4 w-16 bg-[#333]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants && filteredRestaurants.length > 0 ? (
            <>
              {showMap && hasLocationData && (
                <div className="mb-6">
                  <LocationMap 
                    location={{
                      latitude: mapLocations[0].latitude,
                      longitude: mapLocations[0].longitude
                    }}
                    places={mapLocations}
                    zoom={14}
                    className="h-[300px] w-full rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                {filteredRestaurants.map((restaurant: Restaurant) => (
                  <div key={restaurant.id} className="flex flex-col md:flex-row border border-[#333] bg-[#252525] rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="w-full md:w-1/4 h-40 md:h-auto">
                      <img 
                        src={restaurant.imageUrl} 
                        alt={restaurant.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full md:w-3/4 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-lg mb-1 text-gray-200">{restaurant.name}</h4>
                          <p className="text-sm text-gray-400 mb-1">
                            <MapPin className="inline h-3 w-3 mr-1" /> {restaurant.address}
                          </p>
                          <div className="flex items-center mb-2">
                            <Star className="text-yellow-400 h-4 w-4 mr-1" />
                            <span className="text-gray-300 mr-3">{restaurant.rating.toFixed(1)}</span>
                            <span className="text-gray-400 mr-3">•</span>
                            <span className="text-yellow-400">{getPriceLevel(restaurant.priceLevel)}</span>
                            <span className="text-gray-400 mx-3">•</span>
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-400 text-sm">{restaurant.hours}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-400 hover:text-blue-400"
                        >
                          <Bookmark className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      <p className="text-sm mb-3 text-gray-300">{restaurant.description}</p>
                      
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {restaurant.cuisine.map((type, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-[#3d3d3d] text-blue-300 border-blue-500">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {restaurant.features.map((feature, index) => (
                          <span 
                            key={index} 
                            className="text-xs flex items-center bg-[#2d2d2d] text-gray-300 px-2 py-1 rounded"
                          >
                            <Utensils className="h-3 w-3 mr-1 text-gray-400" />
                            {feature}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm bg-blue-900 bg-opacity-20 border-blue-500 text-blue-400 hover:bg-blue-900 hover:bg-opacity-30"
                        >
                          {translations.call}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm bg-blue-900 bg-opacity-20 border-blue-500 text-blue-400 hover:bg-blue-900 hover:bg-opacity-30"
                        >
                          {translations.website}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-300">{translations.noRestaurants}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}