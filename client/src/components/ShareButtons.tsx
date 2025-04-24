import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useIsMobile } from "@/hooks/use-mobile";
import {
  WhatsappShareButton,
  TwitterShareButton,
  TelegramShareButton,
  FacebookShareButton,
  FacebookIcon,
  WhatsappIcon,
  TwitterIcon,
  TelegramIcon
} from 'react-share';
import { Button } from './ui/button';
import { 
  Share2,
  X,
  MapPin,
  Radio
} from 'lucide-react';
import { LiveLocation } from '@/hooks/useLiveLocation';
import { Badge } from './ui/badge';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  className?: string;
  small?: boolean;
  showText?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  liveLocations?: LiveLocation[];
}

export default function ShareButtons({ 
  url, 
  title, 
  description = "", 
  hashtags = [], 
  className = "",
  small = false,
  showText = true,
  location,
  liveLocations = []
}: ShareButtonsProps) {
  const { language } = useLanguage();
  const [showButtons, setShowButtons] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Tamaños responsivos para iconos
  const mobileIconSize = small ? 32 : 40;
  const desktopIconSize = small ? 36 : 44;
  const iconSize = isMobile ? mobileIconSize : desktopIconSize;
  
  // Cerrar el menú cuando se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowButtons(false);
      }
    }
    
    if (showButtons) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showButtons]);
  
  const toggleButtons = () => {
    setShowButtons(!showButtons);
  };
  
  // Preparar la información de ubicación para compartir
  const getLocationInfo = () => {
    let locationText = "";
    let locationUrl = "";
    
    if (location) {
      const locationName = location.name ? ` (${location.name})` : '';
      locationText = `\n📍 ${language === 'es' ? 'Ubicación' : 'Location'}${locationName}: `;
      locationUrl = `\nhttps://maps.google.com/?q=${location.latitude},${location.longitude}`;
    }
    
    // Añadir información sobre usuarios en tiempo real si está disponible
    if (liveLocations.length > 0) {
      locationText += `\n🔴 ${liveLocations.length} ${language === 'es' 
        ? 'persona(s) compartiendo ubicación en tiempo real'
        : 'person(s) sharing real-time location'}`;
    }
    
    return { locationText, locationUrl };
  };
  
  const { locationText, locationUrl } = getLocationInfo();
  
  // Construir el mensaje completo para compartir
  const fullMessage = `${title}${description ? ` - ${description}` : ''}${locationText}${locationUrl}`;
  const fullUrl = location ? `${url}?lat=${location.latitude}&lng=${location.longitude}` : url;
  
  return (
    <div className={`relative ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        className={`flex items-center justify-center ${showButtons 
          ? 'bg-blue-900 bg-opacity-50 border-blue-500 text-blue-300' 
          : 'bg-accent bg-opacity-10 border-[#444] text-white hover:bg-blue-900 hover:bg-opacity-20 hover:border-blue-500 hover:text-blue-400 animate-pulse-soft'} 
          shadow-sm hover:shadow-md transition-all duration-300 ${small ? 'p-1.5' : 'p-2'}`}
        onClick={toggleButtons}
      >
        {showButtons 
          ? <X size={18} className="text-blue-300" /> 
          : <Share2 size={18} className="text-blue-400" />
        }
        {showText && !small && (
          <span className="ml-2 font-medium">
            {language === "es" ? "Compartir" : "Share"}
          </span>
        )}
      </Button>
      
      {showButtons && (
        <div 
          ref={menuRef}
          className={`fixed sm:absolute ${small ? 'bottom-20 sm:bottom-10' : 'bottom-24 sm:bottom-12'} left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 right-auto bg-[#252525] border border-[#444] p-3 rounded-lg shadow-xl z-50 flex flex-col sm:flex-wrap gap-4 w-auto min-w-[240px]`}
        >
          {/* Mostrar información de ubicación si está disponible */}
          {location && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-900 bg-opacity-20 rounded-md border border-blue-800">
              <MapPin size={16} className="text-blue-400" />
              <span className="text-blue-300 text-sm">{language === 'es' ? 'Ubicación incluida' : 'Location included'}</span>
            </div>
          )}
          
          {/* Mostrar badge de ubicaciones en tiempo real si hay */}
          {liveLocations.length > 0 && (
            <div className="flex items-center justify-between px-2 py-1 bg-green-900 bg-opacity-20 rounded-md border border-green-800">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-green-400 animate-pulse" />
                <span className="text-green-300 text-sm">
                  {language === 'es' ? 'Ubicaciones en tiempo real' : 'Live locations'}
                </span>
              </div>
              <Badge className="bg-green-700 text-white text-xs">{liveLocations.length}</Badge>
            </div>
          )}
          
          {/* Botones para compartir */}
          <div className="flex flex-row justify-center gap-4">
            <WhatsappShareButton url={fullUrl} title={fullMessage}>
              <WhatsappIcon size={iconSize} round className="hover:scale-110 transition-transform" />
            </WhatsappShareButton>
            
            <TwitterShareButton url={fullUrl} title={title} hashtags={[...hashtags, 'location', 'map']}>
              <TwitterIcon size={iconSize} round className="hover:scale-110 transition-transform" />
            </TwitterShareButton>
            
            <TelegramShareButton url={fullUrl} title={fullMessage}>
              <TelegramIcon size={iconSize} round className="hover:scale-110 transition-transform" />
            </TelegramShareButton>
            
            <FacebookShareButton 
              url={fullUrl}
              hashtag={hashtags.length > 0 ? `#${hashtags[0]}` : '#location'}
            >
              <FacebookIcon size={iconSize} round className="hover:scale-110 transition-transform" />
            </FacebookShareButton>
          </div>
        </div>
      )}
    </div>
  );
}