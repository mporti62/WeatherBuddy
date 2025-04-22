import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { Entertainment } from "@/types";
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Star,
} from "lucide-react";

interface EntertainmentTabProps {
  zipCode: string;
}

export default function EntertainmentTab({ zipCode }: EntertainmentTabProps) {
  const { language } = useLanguage();

  const { data: entertainment, isLoading } = useQuery<Entertainment>({
    queryKey: [`/api/entertainment/${zipCode}`],
    enabled: zipCode.length === 5,
  });

  const translations = {
    entertainmentTitle: language === 'es' 
      ? "Sugerencias de Entretenimiento" 
      : "Entertainment Suggestions",
    recommendedForToday: language === 'es'
      ? "Recomendado para hoy"
      : "Recommended for today",
    book: language === 'es' ? "Reservar" : "Book",
    viewMenu: language === 'es' ? "Ver menú" : "View menu",
    viewDetails: language === 'es' ? "Ver detalles" : "View details",
    reviews: language === 'es' ? "reseñas" : "reviews",
    noEntertainment: language === 'es'
      ? "No hay entretenimiento en esta área. Intenta con otro código postal."
      : "No entertainment in this area. Try a different ZIP code."
  };

  return (
    <Card>
      <CardHeader className="bg-secondary bg-opacity-10 border-b">
        <CardTitle>{translations.entertainmentTitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="mb-6">
              <Skeleton className="h-6 w-48 mb-3" />
              <div className="bg-secondary bg-opacity-5 rounded-lg p-4 border border-secondary border-opacity-20">
                <div className="flex flex-col md:flex-row items-center">
                  <Skeleton className="w-full md:w-1/4 h-32 mb-4 md:mb-0" />
                  <div className="w-full md:w-3/4 md:pl-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <Skeleton className="w-full h-40" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : entertainment ? (
          <div>
            {entertainment.featured && (
              <div className="mb-6">
                <h4 className="font-medium text-lg mb-3">{translations.recommendedForToday}</h4>
                <div className="bg-secondary bg-opacity-5 rounded-lg p-4 border border-secondary border-opacity-20">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-1/4 mb-4 md:mb-0">
                      <img 
                        src={entertainment.featured.imageUrl} 
                        className="w-full h-32 object-cover rounded-lg" 
                        alt={entertainment.featured.name} 
                      />
                    </div>
                    <div className="w-full md:w-3/4 md:pl-4">
                      <h5 className="font-medium text-lg mb-1">{entertainment.featured.name}</h5>
                      <p className="text-sm text-gray-600 mb-2">
                        <MapPin className="inline h-3 w-3 mr-1" /> {entertainment.featured.location}
                      </p>
                      <p className="text-sm mb-3">{entertainment.featured.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex">
                          {entertainment.featured.categories.map((category, index) => (
                            <span 
                              key={index} 
                              className="text-xs bg-secondary bg-opacity-20 text-secondary px-2 py-1 rounded mr-2"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                        <Button 
                          className="bg-secondary text-white px-3 py-1 rounded-lg text-sm hover:bg-opacity-90"
                        >
                          {translations.book}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entertainment.options && entertainment.options.map((option) => (
                <div key={option.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                  <img 
                    src={option.imageUrl} 
                    className="w-full h-40 object-cover" 
                    alt={option.name} 
                  />
                  <div className="p-4">
                    <h5 className="font-medium text-lg mb-1">{option.name}</h5>
                    <p className="text-sm text-gray-600 mb-2">
                      <MapPin className="inline h-3 w-3 mr-1" /> {option.location}
                    </p>
                    <div className="flex items-center mb-3">
                      <div className="flex text-warning">
                        {[...Array(Math.floor(option.rating))].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                        {option.rating % 1 !== 0 && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-warning" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                        {[...Array(5 - Math.ceil(option.rating))].map((_, i) => (
                          <Star key={i} className="h-4 w-4" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">{option.rating} ({option.reviewCount} {translations.reviews})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-secondary bg-opacity-20 text-secondary px-2 py-1 rounded">{option.category}</span>
                      <Button
                        variant="link"
                        className="text-secondary p-0 h-auto"
                      >
                        {option.category === "Restaurant" || option.category === "Restaurante" 
                          ? translations.viewMenu 
                          : translations.viewDetails
                        }
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">{translations.noEntertainment}</div>
        )}
      </CardContent>
    </Card>
  );
}
