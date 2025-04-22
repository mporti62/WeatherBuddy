import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../lib/queryClient";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, MapPin, Clock, Star, Calendar } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

// Definir interface para JourneyLocation
interface JourneyLocation {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  type: "recreation" | "entertainment" | "event" | "bank" | "restaurant";
  story: string;
  duration: number; // duración estimada en minutos
}

// Definir interface para viaje completo
interface Journey {
  id: string;
  name: string;
  description: string;
  locations: JourneyLocation[];
  totalDuration: number;
}

// Componente para actualizar la vista del mapa
function MapViewUpdater({ locations }: { locations: JourneyLocation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = locations.map(location => [location.latitude, location.longitude]);
      map.fitBounds(bounds as any);
    }
  }, [locations, map]);
  
  return null;
}

// Componente principal para la pestaña de viajes
interface JourneyTabProps {
  zipCode: string;
}

export default function JourneyTab({ zipCode }: JourneyTabProps) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentJourney, setCurrentJourney] = useState<Journey | null>(null);
  const [activeLocationIndex, setActiveLocationIndex] = useState(-1);
  const [animationStep, setAnimationStep] = useState(0);
  const { language } = useLanguage();
  
  // Obtener datos de viajes
  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        setLoading(true);
        // En una implementación real, esto sería una llamada API a /api/journeys/${zipCode}
        // Por ahora, usamos datos de ejemplo
        const mockJourneys = getMockJourneys();
        setJourneys(mockJourneys);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar los viajes:", error);
        setLoading(false);
      }
    };
    
    fetchJourneys();
  }, [zipCode]);
  
  // Función para obtener datos de ejemplo
  const getMockJourneys = (): Journey[] => {
    return [
      {
        id: "journey1",
        name: language === "es" ? "Un día perfecto en la ciudad" : "A Perfect Day in the City",
        description: language === "es" 
          ? "Descubre los mejores lugares para visitar en un día" 
          : "Discover the best places to visit in one day",
        locations: [
          {
            id: "loc1",
            name: language === "es" ? "Parque Central" : "Central Park",
            description: language === "es" 
              ? "Un hermoso parque con senderos para caminar" 
              : "A beautiful park with walking trails",
            imageUrl: "/images/categories/recreation.svg",
            latitude: 26.1224,
            longitude: -80.3432,
            type: "recreation",
            story: language === "es" 
              ? "Comienza tu día con un refrescante paseo matutino. El parque central es perfecto para conectar con la naturaleza." 
              : "Start your day with a refreshing morning walk. The central park is perfect for connecting with nature.",
            duration: 60
          },
          {
            id: "loc2",
            name: language === "es" ? "Museo de Arte" : "Art Museum",
            description: language === "es" 
              ? "Explora exposiciones fascinantes de arte moderno" 
              : "Explore fascinating exhibitions of modern art",
            imageUrl: "/images/categories/entertainment.svg",
            latitude: 26.1324,
            longitude: -80.3332,
            type: "entertainment",
            story: language === "es" 
              ? "Después del parque, enriquece tu mente con cultura. El museo tiene una colección impresionante que inspirará tu creatividad." 
              : "After the park, enrich your mind with culture. The museum has an impressive collection that will inspire your creativity.",
            duration: 90
          },
          {
            id: "loc3",
            name: language === "es" ? "Festival de Comida" : "Food Festival",
            description: language === "es" 
              ? "Prueba deliciosas comidas de diferentes culturas" 
              : "Try delicious foods from different cultures",
            imageUrl: "/images/categories/events.svg",
            latitude: 26.1424,
            longitude: -80.3232,
            type: "event",
            story: language === "es" 
              ? "¡Es hora de comer! Disfruta de una variedad de sabores en este popular festival gastronómico." 
              : "It's time to eat! Enjoy a variety of flavors at this popular food festival.",
            duration: 120
          },
          {
            id: "loc4",
            name: language === "es" ? "Centro Comercial" : "Shopping Mall",
            description: language === "es" 
              ? "Tiendas de moda y accesorios para todos los gustos" 
              : "Fashion stores and accessories for all tastes",
            imageUrl: "/images/categories/banks.svg",
            latitude: 26.1524,
            longitude: -80.3132,
            type: "bank",
            story: language === "es" 
              ? "Para terminar el día, haz algunas compras en las mejores tiendas de la ciudad. Encuentra recuerdos únicos para llevar a casa." 
              : "To end the day, do some shopping at the best stores in the city. Find unique souvenirs to take home.",
            duration: 90
          }
        ],
        totalDuration: 360 // 6 horas en total
      },
      {
        id: "journey2",
        name: language === "es" ? "Aventura al aire libre" : "Outdoor Adventure",
        description: language === "es" 
          ? "Explora la naturaleza y actividades exteriores" 
          : "Explore nature and outdoor activities",
        locations: [
          {
            id: "loc5",
            name: language === "es" ? "Sendero Natural" : "Nature Trail",
            description: language === "es" 
              ? "Ruta escénica con vistas panorámicas" 
              : "Scenic route with panoramic views",
            imageUrl: "/images/categories/recreation.svg",
            latitude: 26.1624,
            longitude: -80.3532,
            type: "recreation",
            story: language === "es" 
              ? "Inicia tu aventura en este espectacular sendero. La fresca brisa matutina te dará energía para todo el día." 
              : "Start your adventure on this spectacular trail. The fresh morning breeze will give you energy for the whole day.",
            duration: 120
          },
          {
            id: "loc6",
            name: language === "es" ? "Lago para Kayak" : "Kayaking Lake",
            description: language === "es" 
              ? "Actividades acuáticas para toda la familia" 
              : "Water activities for the whole family",
            imageUrl: "/images/categories/recreation.svg",
            latitude: 26.1724,
            longitude: -80.3632,
            type: "recreation",
            story: language === "es" 
              ? "Después de caminar, es hora de refrescarse. Remar por el lago te dará una perspectiva única de la belleza natural." 
              : "After walking, it's time to cool off. Paddling on the lake will give you a unique perspective of the natural beauty.",
            duration: 90
          },
          {
            id: "loc7",
            name: language === "es" ? "Mirador de Aves" : "Bird Watching Point",
            description: language === "es" 
              ? "Observa especies exóticas en su hábitat natural" 
              : "Observe exotic species in their natural habitat",
            imageUrl: "/images/categories/entertainment.svg",
            latitude: 26.1824,
            longitude: -80.3732,
            type: "entertainment",
            story: language === "es" 
              ? "Tómate un momento para apreciar la vida silvestre. Este mirador es famoso por sus increíbles vistas de aves." 
              : "Take a moment to appreciate wildlife. This viewpoint is famous for its incredible bird sightings.",
            duration: 60
          }
        ],
        totalDuration: 270 // 4.5 horas en total
      }
    ];
  };
  
  // Función para iniciar un viaje
  const startJourney = (journey: Journey) => {
    setCurrentJourney(journey);
    setActiveLocationIndex(-1);
    setAnimationStep(0);
  };
  
  // Función para continuar al siguiente paso de la animación
  const nextAnimationStep = () => {
    if (!currentJourney) return;
    
    if (animationStep === 0) {
      // Inicio del viaje
      setAnimationStep(1);
      setActiveLocationIndex(0);
    } else if (activeLocationIndex < currentJourney.locations.length - 1) {
      // Avanzar al siguiente lugar
      setActiveLocationIndex(prev => prev + 1);
    } else if (animationStep === 1) {
      // Finalizar el viaje
      setAnimationStep(2);
    } else {
      // Reiniciar
      setCurrentJourney(null);
      setActiveLocationIndex(-1);
      setAnimationStep(0);
    }
  };
  
  // Crear ruta para el mapa
  const createRoute = () => {
    if (!currentJourney) return [];
    
    const visitedLocations = currentJourney.locations.slice(0, activeLocationIndex + 1);
    return visitedLocations.map(loc => [loc.latitude, loc.longitude]);
  };
  
  // Determinar el texto del botón según el paso de animación
  const getButtonText = () => {
    if (animationStep === 0) return language === "es" ? "Comenzar viaje" : "Start Journey";
    if (animationStep === 1) {
      if (activeLocationIndex < (currentJourney?.locations.length || 0) - 1) {
        return language === "es" ? "Siguiente destino" : "Next Destination";
      }
      return language === "es" ? "Finalizar viaje" : "Finish Journey";
    }
    return language === "es" ? "Volver a la lista" : "Back to List";
  };
  
  // Obtener el icono para el tipo de lugar
  const getMarkerIcon = (type: string) => {
    // En una implementación real, usaríamos diferentes iconos según el tipo
    // Por ahora, simplemente cambiamos el color
    return new Icon({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };
  
  // Si no hay viaje seleccionado, mostrar la lista de viajes
  if (!currentJourney) {
    return (
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold text-center mb-6 gradient-text">
          {language === "es" ? "Descubre viajes increíbles" : "Discover Amazing Journeys"}
        </h2>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {journeys.map(journey => (
              <Card key={journey.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardTitle>{journey.name}</CardTitle>
                  <CardDescription className="text-gray-100">
                    {journey.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                      <span>{journey.locations.length} {language === "es" ? "lugares para visitar" : "places to visit"}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-blue-500" />
                      <span>{Math.round(journey.totalDuration / 60)} {language === "es" ? "horas aproximadamente" : "hours approximately"}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" 
                    onClick={() => startJourney(journey)}
                  >
                    {language === "es" ? "Explorar este viaje" : "Explore this Journey"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Mostrar el viaje seleccionado con animaciones
  const currentLocation = currentJourney.locations[activeLocationIndex];
  
  return (
    <div className="p-4 space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">{currentJourney.name}</h2>
        <Button 
          variant="outline" 
          onClick={() => {
            setCurrentJourney(null);
            setActiveLocationIndex(-1);
            setAnimationStep(0);
          }}
        >
          {language === "es" ? "Volver a la lista" : "Back to List"}
        </Button>
      </div>
      
      {/* Etapa de introducción */}
      {animationStep === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-6 my-4"
        >
          <h3 className="text-xl font-bold mb-4">
            {language === "es" ? "¡Prepárate para la aventura!" : "Get Ready for Adventure!"}
          </h3>
          <p className="mb-4">{currentJourney.description}</p>
          <div className="flex items-center mb-4">
            <MapPin className="mr-2 h-5 w-5 text-blue-500" />
            <span>
              {currentJourney.locations.length} {language === "es" ? "destinos" : "destinations"}
            </span>
          </div>
          <div className="flex items-center mb-4">
            <Clock className="mr-2 h-5 w-5 text-blue-500" />
            <span>
              {Math.round(currentJourney.totalDuration / 60)} {language === "es" ? "horas de aventura" : "hours of adventure"}
            </span>
          </div>
        </motion.div>
      )}
      
      {/* Mapa */}
      <div className="h-96 rounded-lg overflow-hidden shadow-md">
        <MapContainer
          center={[26.1224, -80.3432]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {currentJourney.locations.map((location, index) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={getMarkerIcon(location.type)}
              opacity={index <= activeLocationIndex ? 1 : 0.5}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{location.name}</h3>
                  <p>{location.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {animationStep === 1 && (
            <Polyline
              positions={createRoute() as any}
              pathOptions={{ color: 'blue', weight: 4 }}
            />
          )}
          
          <MapViewUpdater 
            locations={
              animationStep === 0 
                ? currentJourney.locations 
                : currentJourney.locations.slice(0, activeLocationIndex + 1)
            } 
          />
        </MapContainer>
      </div>
      
      {/* Contenido de la ubicación actual */}
      {animationStep === 1 && currentLocation && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLocation.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center mb-2">
              <Badge className="bg-blue-500 mr-2">
                {language === "es" ? "Destino " : "Destination "} {activeLocationIndex + 1}
              </Badge>
              <Badge variant="outline">
                {language === "es" 
                  ? `${currentLocation.duration} minutos` 
                  : `${currentLocation.duration} minutes`}
              </Badge>
            </div>
            
            <h3 className="text-xl font-bold mb-2">{currentLocation.name}</h3>
            
            <div className="flex flex-col md:flex-row md:space-x-4">
              <div className="mb-4 md:mb-0 md:w-1/3">
                <img 
                  src={currentLocation.imageUrl} 
                  alt={currentLocation.name}
                  className="w-full h-40 object-cover rounded-md" 
                />
              </div>
              
              <div className="md:w-2/3">
                <p className="text-gray-700 italic mb-3">{currentLocation.description}</p>
                <div className="bg-gray-50 p-4 rounded-md border-l-4 border-blue-500">
                  <p className="text-gray-800">{currentLocation.story}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Mensaje de final del viaje */}
      {animationStep === 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-lg p-6 text-center"
        >
          <h3 className="text-xl font-bold mb-4">
            {language === "es" ? "¡Viaje completado!" : "Journey Completed!"}
          </h3>
          <p className="mb-4">
            {language === "es" 
              ? `Has visitado ${currentJourney.locations.length} lugares increíbles y descubierto lo mejor de la zona.` 
              : `You've visited ${currentJourney.locations.length} amazing places and discovered the best of the area.`}
          </p>
          <Star className="h-16 w-16 text-yellow-300 mx-auto my-4" />
        </motion.div>
      )}
      
      {/* Botón de acción */}
      <div className="flex justify-center mt-6">
        <Button 
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8"
          size="lg"
          onClick={nextAnimationStep}
        >
          {getButtonText()} {animationStep < 2 && <ChevronRight className="ml-2 h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}