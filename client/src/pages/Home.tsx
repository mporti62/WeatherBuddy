import { useState, useEffect } from "react";
import Header from "@/components/Header";
import InitialState from "@/components/InitialState";
import LocationInfo from "@/components/LocationInfo";
import Footer from "@/components/Footer";
import WeatherTab from "@/tabs/WeatherTab";
import EventsTab from "@/tabs/EventsTab";
import RecreationTab from "@/tabs/RecreationTab";

import EntertainmentTab from "@/tabs/EntertainmentTab";
import RestaurantsTab from "@/tabs/RestaurantsTab";
import JourneyTab from "@/tabs/JourneyTab";
import MeetingPointsTab from "@/tabs/MeetingPointsTab";
import { useQuery } from "@tanstack/react-query";
import { getLocationByZip } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Location } from "@/types";

export default function Home() {
  const [zipCode, setZipCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState("weather");
  const [showContent, setShowContent] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const { data: location, refetch, isError } = useQuery<Location>({
    queryKey: [`/api/location/${zipCode}`],
    enabled: zipCode.length === 5,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' 
          ? "No pudimos encontrar la ubicación. Verifica el código postal."
          : "We couldn't find the location. Please check the ZIP code.",
        variant: "destructive",
      });
    }
  }, [isError, toast, language]);

  useEffect(() => {
    if (location) {
      setShowContent(true);
    }
  }, [location]);

  const handleSearch = (zip: string) => {
    setZipCode(zip);
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(`/api/location/coordinates?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
            if (!response.ok) throw new Error("Could not get location");
            
            const data = await response.json();
            if (data.zipCode) {
              setZipCode(data.zipCode);
            } else {
              throw new Error("No ZIP code found");
            }
          } catch (error) {
            toast({
              title: language === 'es' ? "Error" : "Error",
              description: language === 'es' 
                ? "No pudimos detectar tu ubicación. Por favor, ingresa tu código postal manualmente."
                : "We couldn't detect your location. Please enter your ZIP code manually.",
              variant: "destructive",
            });
          }
        },
        () => {
          toast({
            title: language === 'es' ? "Error" : "Error",
            description: language === 'es' 
              ? "No fue posible acceder a tu ubicación. Por favor, ingresa tu código postal manualmente."
              : "We couldn't access your location. Please enter your ZIP code manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' 
          ? "Tu navegador no soporta geolocalización. Por favor, ingresa tu código postal manualmente."
          : "Your browser doesn't support geolocation. Please enter your ZIP code manually.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Header 
        onSearch={handleSearch} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        hasValidZipCode={showContent && zipCode.length === 5} 
      />
      
      {!showContent ? (
        <InitialState onUseLocation={handleUseLocation} />
      ) : (
        <main className="container mx-auto px-4 py-6 flex-grow">
          {location && 'city' in location && 'state' in location && (
            <LocationInfo 
              locationName={location.city + ", " + location.state} 
              zipCode={zipCode} 
              onRefresh={handleRefresh} 
            />
          )}
          
          <div className="dark-tab-panel mt-6">
            {activeTab === "weather" && <WeatherTab zipCode={zipCode} />}
            {activeTab === "events" && <EventsTab zipCode={zipCode} />}
            {activeTab === "recreation" && <RecreationTab zipCode={zipCode} />}
            {activeTab === "restaurants" && <RestaurantsTab zipCode={zipCode} />}

            {activeTab === "entertainment" && <EntertainmentTab zipCode={zipCode} />}
            {activeTab === "journey" && <JourneyTab zipCode={zipCode} />}
            {activeTab === "meeting-points" && <MeetingPointsTab zipCode={zipCode} />}
          </div>
        </main>
      )}
      
      <Footer />
    </div>
  );
}
