import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  List,
  Map,
  MapPin,
  Star,
  Clock
} from "lucide-react";
import LocationMap from "@/components/LocationMap";
import ShareButtons from "@/components/ShareButtons";
import { RecreationPlace } from "@/types";

interface RecreationTabProps {
  zipCode: string;
}

export default function RecreationTab({ zipCode }: RecreationTabProps) {
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<string>("all");
  const [showMore, setShowMore] = useState(false);

  const { data: places, isLoading } = useQuery<RecreationPlace[]>({
    queryKey: [`/api/recreation/${zipCode}`],
    enabled: zipCode.length === 5,
  });

  const translations = {
    recreationPlaces: language === 'es' ? "Lugares de Recreación" : "Recreation Places",
    list: language === 'es' ? "Lista" : "List",
    map: language === 'es' ? "Mapa" : "Map",
    all: language === 'es' ? "Todos" : "All",
    parks: language === 'es' ? "Parques" : "Parks",
    museums: language === 'es' ? "Museos" : "Museums",
    sports: language === 'es' ? "Deportes" : "Sports",
    outdoorActivities: language === 'es' ? "Actividades al aire libre" : "Outdoor Activities",
    open: language === 'es' ? "Abierto: " : "Open: ",
    viewMoreDetails: language === 'es' ? "Ver más detalles" : "View more details",
    viewMore: language === 'es' ? "Ver más lugares" : "View more places",
    viewLess: language === 'es' ? "Ver menos" : "View less",
    noPlaces: language === 'es' 
      ? "No hay lugares de recreación en esta área. Intenta con otro código postal."
      : "No recreation places in this area. Try a different ZIP code."
  };

  const filteredPlaces = places?.filter(place => {
    if (filter === "all") return true;
    return place.tags.includes(filter);
  });

  const displayedPlaces = showMore 
    ? filteredPlaces
    : filteredPlaces?.slice(0, 2);

  return (
    <Card>
      <CardHeader className="bg-accent bg-opacity-10 border-b flex flex-row justify-between items-center">
        <CardTitle>{translations.recreationPlaces}</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("list")}
            className="text-sm"
          >
            <List className="h-4 w-4 mr-1" /> {translations.list}
          </Button>
          <Button 
            variant={viewMode === "map" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("map")}
            className="text-sm"
          >
            <Map className="h-4 w-4 mr-1" /> {translations.map}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-accent bg-opacity-20 text-white font-medium" : "hover:bg-accent hover:bg-opacity-20 hover:text-white"}
          >
            {translations.all}
          </Button>
          <Button
            variant={filter === "park" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("park")}
            className={filter === "park" ? "bg-accent bg-opacity-20 text-white font-medium" : "hover:bg-accent hover:bg-opacity-20 hover:text-white"}
          >
            {translations.parks}
          </Button>
          <Button
            variant={filter === "museum" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("museum")}
            className={filter === "museum" ? "bg-accent bg-opacity-20 text-white font-medium" : "hover:bg-accent hover:bg-opacity-20 hover:text-white"}
          >
            {translations.museums}
          </Button>
          <Button
            variant={filter === "sports" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("sports")}
            className={filter === "sports" ? "bg-accent bg-opacity-20 text-white font-medium" : "hover:bg-accent hover:bg-opacity-20 hover:text-white"}
          >
            {translations.sports}
          </Button>
          <Button
            variant={filter === "outdoor" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("outdoor")}
            className={filter === "outdoor" ? "bg-accent bg-opacity-20 text-white font-medium" : "hover:bg-accent hover:bg-opacity-20 hover:text-white"}
          >
            {translations.outdoorActivities}
          </Button>
        </div>

        {viewMode === "list" ? (
          isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <Skeleton className="w-full md:w-1/3 h-48 md:h-auto" />
                    <div className="w-full md:w-2/3 p-4 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-10" />
                      </div>
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedPlaces && displayedPlaces.length > 0 ? (
            <div className="space-y-4">
              {displayedPlaces.map((place) => (
                <div key={place.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 h-48 md:h-auto">
                      <img 
                        src={place.imageUrl} 
                        className="w-full h-full object-cover" 
                        alt={place.name} 
                      />
                    </div>
                    <div className="w-full md:w-2/3 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-lg mb-1">{place.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            <MapPin className="inline h-3 w-3 mr-1" /> {place.address}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="text-warning font-medium mr-1">{place.rating}</div>
                          <Star className="text-warning h-4 w-4" />
                        </div>
                      </div>
                      <p className="text-sm mb-3">{place.description}</p>
                      <div className="flex flex-wrap mb-3">
                        {place.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="text-xs bg-accent bg-opacity-10 text-white px-2 py-1 rounded mr-2 mb-1 border border-gray-500 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <Clock className="inline h-3 w-3 mr-1" /> {translations.open}{place.hours}
                        </div>
                        <div className="flex items-center gap-2">
                          <ShareButtons 
                            url={window.location.href} 
                            title={`${place.name} - ${translations.recreationPlaces}`} 
                            description={place.description}
                            hashtags={["recreation", ...place.tags]}
                            small={true}
                            showText={false}
                          />
                          <Button 
                            variant="link" 
                            className="text-accent p-0 h-auto"
                          >
                            {translations.viewMoreDetails}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPlaces && filteredPlaces.length > 2 && (
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline"
                    className="border border-accent text-accent hover:bg-accent hover:text-white transition"
                    onClick={() => setShowMore(!showMore)}
                  >
                    {showMore ? translations.viewLess : translations.viewMore}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">{translations.noPlaces}</div>
          )
        ) : filteredPlaces && filteredPlaces.length > 0 ? (
          <>
            {/* Dynamic Leaflet map */}
            <div className="w-full h-72 rounded-lg mb-4 overflow-hidden">
              <LocationMap 
                location={{ 
                  latitude: Number(filteredPlaces[0]?.latitude) || 0, 
                  longitude: Number(filteredPlaces[0]?.longitude) || 0,
                  name: language === 'es' ? 'Ubicación central' : 'Central Location'
                }}
                places={filteredPlaces.map(place => ({
                  latitude: Number(place.latitude) || 0,
                  longitude: Number(place.longitude) || 0,
                  name: place.name,
                  description: place.description,
                  imageUrl: place.imageUrl
                }))}
                className="w-full h-72 rounded-lg"
              />
            </div>
            
            {/* List of map places under the map */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlaces.map((place) => (
                <div key={place.id} className="border rounded-lg overflow-hidden p-3 hover:shadow-md transition">
                  <div className="flex items-start">
                    <div className="w-16 h-16 mr-3 flex-shrink-0">
                      <img 
                        src={place.imageUrl} 
                        className="w-full h-full object-cover rounded-lg" 
                        alt={place.name} 
                      />
                    </div>
                    <div>
                      <h5 className="font-medium text-md mb-1">{place.name}</h5>
                      <p className="text-xs text-gray-600">
                        <MapPin className="inline h-3 w-3 mr-1" /> {place.address}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center">
                          <div className="text-warning font-medium text-xs mr-1">{place.rating}</div>
                          <Star className="text-warning h-3 w-3" />
                          <span className="text-xs ml-2">
                            <Clock className="inline h-3 w-3 mr-1" /> {place.hours}
                          </span>
                        </div>
                        <ShareButtons 
                          url={window.location.href} 
                          title={`${place.name} - ${translations.recreationPlaces}`} 
                          description={place.description}
                          hashtags={["recreation", ...place.tags]}
                          small={true}
                          showText={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full h-64 bg-gray-300 rounded-lg mb-4 flex items-center justify-center">
            <div className="text-center">
              <Map className="mx-auto h-12 w-12 text-gray-500 mb-2" />
              <p className="text-gray-500">
                {language === 'es' 
                  ? "Mapa de lugares de recreación" 
                  : "Map of recreation places"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
