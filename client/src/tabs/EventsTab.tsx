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
  Filter,
  MapPin,
  CheckSquare
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface EventsTabProps {
  zipCode: string;
}

export default function EventsTab({ zipCode }: EventsTabProps) {
  const { language } = useLanguage();
  const [categories, setCategories] = useState({
    music: false,
    art: false,
    sports: false,
    food: false
  });
  const [showMore, setShowMore] = useState(false);

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: [`/api/events/${zipCode}`],
    enabled: zipCode.length === 5,
  });

  const translations = {
    eventsNearby: language === 'es' ? "Eventos Sociales Cercanos" : "Nearby Social Events",
    filter: language === 'es' ? "Filtrar" : "Filter",
    categories: language === 'es' ? "Categorías" : "Categories",
    music: language === 'es' ? "Música" : "Music",
    art: language === 'es' ? "Arte" : "Art",
    sports: language === 'es' ? "Deportes" : "Sports",
    food: language === 'es' ? "Comida" : "Food",
    apply: language === 'es' ? "Aplicar" : "Apply",
    viewMore: language === 'es' ? "Ver más eventos" : "View more events",
    noEvents: language === 'es' 
      ? "No hay eventos en esta área. Intenta con otro código postal."
      : "No events in this area. Try a different ZIP code."
  };

  const handleCategoryChange = (category: keyof typeof categories) => {
    setCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredEvents = events?.filter(event => {
    // If no categories are selected, show all events
    if (!categories.music && !categories.art && !categories.sports && !categories.food) {
      return true;
    }
    
    // Otherwise filter by selected categories
    return (
      (categories.music && event.categories.includes('music')) ||
      (categories.art && event.categories.includes('art')) ||
      (categories.sports && event.categories.includes('sports')) ||
      (categories.food && event.categories.includes('food'))
    );
  });

  const displayedEvents = showMore 
    ? filteredEvents
    : filteredEvents?.slice(0, 3);

  return (
    <Card className="dark-card">
      <CardHeader className="dark-card-header flex flex-row justify-between items-center">
        <CardTitle className="text-blue-400">{translations.eventsNearby}</CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="dark-secondary-button text-sm">
              <Filter className="h-4 w-4 mr-1" /> {translations.filter}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="bg-[#1e1e1e] border border-[#333] text-gray-200">
            <div className="p-2">
              <div className="mb-2 font-medium text-blue-400">{translations.categories}</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="music" 
                    checked={categories.music}
                    onCheckedChange={() => handleCategoryChange('music')}
                    className="border-blue-500 data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="music" className="text-gray-300">{translations.music}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="art" 
                    checked={categories.art}
                    onCheckedChange={() => handleCategoryChange('art')}
                    className="border-blue-500 data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="art" className="text-gray-300">{translations.art}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sports" 
                    checked={categories.sports}
                    onCheckedChange={() => handleCategoryChange('sports')}
                    className="border-blue-500 data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="sports" className="text-gray-300">{translations.sports}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="food" 
                    checked={categories.food}
                    onCheckedChange={() => handleCategoryChange('food')}
                    className="border-blue-500 data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="food" className="text-gray-300">{translations.food}</Label>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
        ) : displayedEvents && displayedEvents.length > 0 ? (
          <div className="space-y-4">
            {displayedEvents.map((event) => (
              <div key={event.id} className="flex flex-col md:flex-row border border-[#333] bg-[#252525] rounded-lg overflow-hidden hover:shadow-lg transition">
                {event.imageUrl ? (
                  <div className="w-full md:w-1/4 h-40 md:h-auto">
                    <img 
                      src={event.imageUrl} 
                      alt={event.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full md:w-1/4 bg-[#1e1e1e] flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-400">{event.day}</div>
                      <div className="text-sm text-gray-300">{event.month}</div>
                      <div className="mt-2 text-sm font-medium text-gray-300">{event.time}</div>
                    </div>
                  </div>
                )}
                <div className="w-full md:w-3/4 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg mb-1 text-gray-200">{event.name}</h4>
                      <p className="text-sm text-gray-400 mb-2">
                        <MapPin className="inline h-3 w-3 mr-1" /> {event.location}
                      </p>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="text-xl font-bold text-blue-400">{event.day}</div>
                      <div className="text-sm text-gray-300">{event.month}</div>
                      <div className="mt-1 text-sm font-medium text-gray-300">{event.time}</div>
                    </div>
                  </div>
                  <p className="text-sm mb-3 text-gray-300">{event.description}</p>
                  <div className="flex flex-wrap">
                    {event.categories.map((category, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-[#3d3d3d] text-blue-300 px-2 py-1 rounded mr-2 mb-1"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredEvents && filteredEvents.length > 3 && (
              <div className="mt-6 text-center">
                <Button 
                  variant="outline"
                  className="dark-secondary-button"
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? 
                    (language === 'es' ? "Mostrar menos" : "Show less") : 
                    translations.viewMore
                  }
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-300">{translations.noEvents}</div>
        )}
      </CardContent>
    </Card>
  );
}
