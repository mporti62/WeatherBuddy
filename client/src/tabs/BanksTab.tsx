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
      : "No banks in this area. Try a different ZIP code."
  };

  return (
    <Card>
      <CardHeader className="bg-darkNeutral bg-opacity-10 border-b">
        <CardTitle>{translations.banksTitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="w-full h-64 bg-gray-300 rounded-lg mb-4 flex items-center justify-center">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-gray-500 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="text-gray-500">{translations.mapOfFinancial}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, index) => (
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
            ))
          ) : banks && banks.length > 0 ? (
            banks.map((bank) => (
              <div key={bank.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="bg-darkNeutral bg-opacity-10 p-3 rounded-lg mr-3">
                      <Building className="text-darkNeutral" />
                    </div>
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
                      <div className="flex mb-2">
                        {bank.services.map((service, index) => {
                          let serviceTranslation = service;
                          if (service === "ATM") serviceTranslation = translations.atm;
                          if (service === "Customer Service") serviceTranslation = translations.customerService;
                          if (service === "Loans") serviceTranslation = translations.loans;
                          if (service === "Investments") serviceTranslation = translations.investments;
                          
                          return (
                            <span 
                              key={index} 
                              className="text-xs bg-darkNeutral bg-opacity-10 text-darkNeutral px-2 py-1 rounded mr-2"
                            >
                              {serviceTranslation}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">{bank.distance} {language === 'es' ? 'km' : 'mi'}</span>
                    <Button 
                      variant="link" 
                      className="text-primary p-0 h-auto"
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">{translations.noBanks}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
