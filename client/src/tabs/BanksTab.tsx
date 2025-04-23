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
  Building,
  MapPin,
  Clock,
  Navigation,
  List,
  Map
} from "lucide-react";
import LocationMap from "@/components/LocationMap";
import { Bank } from "@/types";
import ShareButtons from "@/components/ShareButtons";

interface BanksTabProps {
  zipCode: string;
}

export default function BanksTab({ zipCode }: BanksTabProps) {
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const { data: banks, isLoading } = useQuery<Bank[]>({
    queryKey: [`/api/banks/${zipCode}`],
    enabled: zipCode.length === 5,
  });

  const translations = {
    banksTitle: language === 'es' 
      ? "Bancos e Instituciones Financieras" 
      : "Banks & Financial Institutions",
    mapOfFinancial: language === 'es'
      ? "Mapa de instituciones financieras"
      : "Map of financial institutions",
    openNow: language === 'es' ? "Abierto ahora" : "Open now",
    closed: language === 'es' ? "Cerrado" : "Closed",
    atm: language === 'es' ? "Cajeros automáticos" : "ATM",
    customerService: language === 'es' ? "Atención al cliente" : "Customer service",
    loans: language === 'es' ? "Préstamos" : "Loans",
    investments: language === 'es' ? "Inversiones" : "Investments",
    noBanks: language === 'es'
      ? "No hay bancos en esta área. Intenta con otro código postal."
      : "No banks in this area. Try a different ZIP code.",
    list: language === 'es' ? "Lista" : "List",
    map: language === 'es' ? "Mapa" : "Map",
    centralLocation: language === 'es' ? "Ubicación central" : "Central Location"
  };

  // Vista de mapa
  const renderMapView = () => {
    if (!banks || banks.length === 0) {
      return (
        <div className="text-center py-6">{translations.noBanks}</div>
      );
    }

    return (
      <>
        {/* Mapa interactivo con Leaflet */}
        <div className="w-full h-72 rounded-lg mb-4 overflow-hidden">
          <LocationMap 
            location={{ 
              latitude: Number(banks[0]?.latitude) || 0, 
              longitude: Number(banks[0]?.longitude) || 0,
              name: translations.centralLocation
            }}
            places={banks.map(bank => ({
              latitude: Number(bank.latitude) || 0,
              longitude: Number(bank.longitude) || 0,
              name: bank.name,
              description: `${bank.address}<br/>${bank.hours}<br/>${bank.isOpen ? translations.openNow : translations.closed}`
            }))}
            className="w-full h-72 rounded-lg"
          />
        </div>
        
        {/* Lista de bancos en formato compacto debajo del mapa */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {banks.map((bank) => (
            <div key={bank.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
              {bank.imageUrl && (
                <div className="w-full h-28">
                  <img 
                    src={bank.imageUrl} 
                    alt={bank.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start">
                  {!bank.imageUrl && (
                    <div className="bg-darkNeutral bg-opacity-10 p-2 rounded-lg mr-3">
                      <Building className="text-darkNeutral h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <h5 className="font-medium text-md mb-1">{bank.name}</h5>
                    <p className="text-xs text-gray-600">
                      <MapPin className="inline h-3 w-3 mr-1" /> {bank.address}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs mr-2">{bank.distance} {language === 'es' ? 'km' : 'mi'}</span>
                      <span className={`text-xs ${bank.isOpen ? "text-green-600" : "text-red-600"}`}>
                        {bank.isOpen ? translations.openNow : translations.closed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // Vista de lista
  const renderListView = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <Skeleton className="h-12 w-12 rounded-lg mr-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-12 mr-2" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!banks || banks.length === 0) {
      return (
        <div className="text-center py-6">{translations.noBanks}</div>
      );
    }

    return (
      <div className="space-y-4">
        {banks.map((bank) => (
          <div key={bank.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
            {bank.imageUrl && (
              <div className="w-full h-40">
                <img 
                  src={bank.imageUrl} 
                  alt={bank.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  {!bank.imageUrl && (
                    <div className="bg-darkNeutral bg-opacity-10 p-3 rounded-lg mr-3">
                      <Building className="text-darkNeutral" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-lg mb-1">{bank.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      <MapPin className="inline h-3 w-3 mr-1" /> {bank.address}
                    </p>
                    <div className="flex items-center text-sm mb-2">
                      <div className="flex items-center mr-4">
                        <Clock className="inline h-3 w-3 mr-1 text-gray-600" />
                        <span>{bank.hours}</span>
                      </div>
                      <div className={bank.isOpen ? "text-green-600" : "text-red-600"}>
                        {bank.isOpen ? translations.openNow : translations.closed}
                      </div>
                    </div>
                    <div className="flex flex-wrap mb-2">
                      {bank.services.map((service, index) => {
                        let serviceTranslation = service;
                        if (service === "ATM") serviceTranslation = translations.atm;
                        if (service === "Customer Service") serviceTranslation = translations.customerService;
                        if (service === "Loans") serviceTranslation = translations.loans;
                        if (service === "Investments") serviceTranslation = translations.investments;
                        
                        return (
                          <span 
                            key={index} 
                            className="text-xs bg-accent bg-opacity-10 text-white px-2 py-1 rounded mr-2 mb-1 border border-gray-500 font-medium"
                          >
                            {serviceTranslation}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 mr-2">{bank.distance} {language === 'es' ? 'km' : 'mi'}</span>
                  <ShareButtons 
                    url={window.location.href} 
                    title={`${bank.name} - ${translations.banksTitle}`} 
                    description={`${bank.address} - ${bank.hours} - ${bank.isOpen ? translations.openNow : translations.closed}`}
                    hashtags={["bank", ...bank.services]}
                    small={true}
                    showText={false}
                  />
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto"
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="bg-darkNeutral bg-opacity-10 border-b flex flex-row justify-between items-center">
        <CardTitle>{translations.banksTitle}</CardTitle>
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
        {viewMode === "map" ? renderMapView() : renderListView()}
      </CardContent>
    </Card>
  );
}
