import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardContent 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Eye 
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface WeatherTabProps {
  zipCode: string;
}

export default function WeatherTab({ zipCode }: WeatherTabProps) {
  const { language } = useLanguage();

  const { data: currentWeather, isLoading: isLoadingCurrent } = useQuery({
    queryKey: [`/api/weather/current/${zipCode}`],
    enabled: zipCode.length === 5,
  });

  const { data: forecast, isLoading: isLoadingForecast } = useQuery({
    queryKey: [`/api/weather/forecast/${zipCode}`],
    enabled: zipCode.length === 5,
  });

  const translations = {
    currentWeather: language === 'es' ? "Clima Actual" : "Current Weather",
    feelsLike: language === 'es' ? "Sensación" : "Feels Like",
    wind: language === 'es' ? "Viento" : "Wind",
    humidity: language === 'es' ? "Humedad" : "Humidity",
    visibility: language === 'es' ? "Visibilidad" : "Visibility",
    forecast: language === 'es' ? "Pronóstico para 5 días" : "5-Day Forecast",
  };

  // Weather icon component based on condition
  const WeatherIcon = ({ condition }: { condition: string }) => {
    // This would be expanded with real icons for different conditions
    return (
      <img 
        src={`https://cdn-icons-png.flaticon.com/512/6974/6974833.png`}
        alt={condition}
        className="w-24 h-24" 
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Weather Card */}
      <Card>
        <CardHeader className="bg-primary bg-opacity-10 border-b">
          <CardTitle>{translations.currentWeather}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingCurrent ? (
            <div className="flex flex-col space-y-4">
              <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-6 w-2/4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ) : currentWeather ? (
            <>
              <div className="flex flex-col md:flex-row items-center">
                <div className="text-center md:text-left mb-4 md:mb-0">
                  <div className="text-5xl font-bold text-darkNeutral mb-2">
                    {currentWeather.temp}°{language === 'es' ? 'C' : 'F'}
                  </div>
                  <div className="text-lg">{currentWeather.description}</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(new Date(currentWeather.date), language)}
                  </div>
                </div>
                <div className="flex-grow flex justify-center md:justify-end">
                  <WeatherIcon condition={currentWeather.condition} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-3 bg-lightNeutral rounded-lg">
                  <Thermometer className="mx-auto text-primary mb-2" />
                  <div className="text-sm text-gray-600">{translations.feelsLike}</div>
                  <div className="font-medium">
                    {currentWeather.feelsLike}°{language === 'es' ? 'C' : 'F'}
                  </div>
                </div>
                <div className="text-center p-3 bg-lightNeutral rounded-lg">
                  <Wind className="mx-auto text-primary mb-2" />
                  <div className="text-sm text-gray-600">{translations.wind}</div>
                  <div className="font-medium">
                    {currentWeather.windSpeed} {language === 'es' ? 'km/h' : 'mph'}
                  </div>
                </div>
                <div className="text-center p-3 bg-lightNeutral rounded-lg">
                  <Droplets className="mx-auto text-primary mb-2" />
                  <div className="text-sm text-gray-600">{translations.humidity}</div>
                  <div className="font-medium">{currentWeather.humidity}%</div>
                </div>
                <div className="text-center p-3 bg-lightNeutral rounded-lg">
                  <Eye className="mx-auto text-primary mb-2" />
                  <div className="text-sm text-gray-600">{translations.visibility}</div>
                  <div className="font-medium">
                    {currentWeather.visibility} {language === 'es' ? 'km' : 'mi'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              {language === 'es' 
                ? "No se pudo cargar la información del clima. Inténtalo de nuevo más tarde."
                : "Could not load weather information. Please try again later."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Weather Card */}
      <Card>
        <CardHeader className="bg-primary bg-opacity-10 border-b">
          <CardTitle>{translations.forecast}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingForecast ? (
            <div className="flex space-x-4 overflow-x-auto">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="flex-shrink-0 w-32 h-32" />
              ))}
            </div>
          ) : forecast ? (
            <div className="overflow-x-auto">
              <div className="flex space-x-4">
                {forecast.days.map((day, index) => (
                  <div key={index} className="flex-shrink-0 w-32 text-center p-3 bg-lightNeutral rounded-lg">
                    <div className="font-medium mb-2">{day.name}</div>
                    <WeatherIcon condition={day.condition} />
                    <div className="text-sm">
                      <span className="font-medium">{day.highTemp}°</span> / <span className="text-gray-600">{day.lowTemp}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              {language === 'es' 
                ? "No se pudo cargar el pronóstico. Inténtalo de nuevo más tarde."
                : "Could not load forecast. Please try again later."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
