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

  const { data: events, isLoading } = useQuery({
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
    <Card>
      <CardHeader className="bg-secondary bg-opacity-10 border-b flex flex-row justify-between items-center">
        <CardTitle>{translations.eventsNearby}</CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-sm">
              <Filter className="h-4 w-4 mr-1" /> {translations.filter}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="p-2">
              <div className="mb-2 font-medium">{translations.categories}</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="music" 
                    checked={categories.music}
                    onCheckedChange={() => handleCategoryChange('music')}
                  />
                  <Label htmlFor="music">{translations.music}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="art" 
                    checked={categories.art}
                    onCheckedChange={() => handleCategoryChange('art')}
                  />
                  <Label htmlFor="art">{translations.art}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sports" 
                    checked={categories.sports}
                    onCheckedChange={() => handleCategoryChange('sports')}
                  />
                  <Label htmlFor="sports">{translations.sports}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="food" 
                    checked={categories.food}
                    onCheckedChange={() => handleCategoryChange('food')}
                  />
                  <Label htmlFor="food">{translations.food}</Label>
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
              <div key={index} className="flex flex-col md:flex-row border rounded-lg overflow-hidden">
                <Skeleton className="w-full md:w-1/4 h-24 md:h-auto" />
                <div className="w-full md:w-3/4 p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedEvents && displayedEvents.length > 0 ? (
          <div className="space-y-4">
            {displayedEvents.map((event) => (
              <div key={event.id} className="flex flex-col md:flex-row border rounded-lg overflow-hidden hover:shadow-md transition">
                <div className="w-full md:w-1/4 bg-secondary bg-opacity-10 flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">{event.day}</div>
                    <div className="text-sm">{event.month}</div>
                    <div className="mt-2 text-sm font-medium">{event.time}</div>
                  </div>
                </div>
                <div className="w-full md:w-3/4 p-4">
                  <h4 className="font-medium text-lg mb-1">{event.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <MapPin className="inline h-3 w-3 mr-1" /> {event.location}
                  </p>
                  <p className="text-sm mb-3">{event.description}</p>
                  <div className="flex flex-wrap">
                    {event.categories.map((category, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-secondary bg-opacity-20 text-secondary px-2 py-1 rounded mr-2 mb-1"
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
                  className="border border-secondary text-secondary hover:bg-secondary hover:text-white transition"
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
          <div className="text-center py-6">{translations.noEvents}</div>
        )}
      </CardContent>
    </Card>
  );
}
