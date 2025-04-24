import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useIsMobile } from "@/hooks/use-mobile";
import {
  WhatsappShareButton,
  TwitterShareButton,
  TelegramShareButton,
  WhatsappIcon,
  TwitterIcon,
  TelegramIcon
} from 'react-share';
import { Button } from './ui/button';
import { 
  Share2,
  X 
} from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  className?: string;
  small?: boolean;
  showText?: boolean;
}

export default function ShareButtons({ 
  url, 
  title, 
  description = "", 
  hashtags = [], 
  className = "",
  small = false,
  showText = true
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
          className={`fixed sm:absolute ${small ? 'bottom-20 sm:bottom-10' : 'bottom-24 sm:bottom-12'} left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 right-auto bg-[#252525] border border-[#444] p-3 rounded-lg shadow-xl z-50 flex flex-row sm:flex-wrap justify-center sm:justify-start gap-4 w-auto min-w-[240px]`}
        >
          <WhatsappShareButton url={url} title={title + (description ? ` - ${description}` : '')}>
            <WhatsappIcon size={iconSize} round className="hover:scale-110 transition-transform" />
          </WhatsappShareButton>
          
          <TwitterShareButton url={url} title={title} hashtags={hashtags}>
            <TwitterIcon size={iconSize} round className="hover:scale-110 transition-transform" />
          </TwitterShareButton>
          
          <TelegramShareButton url={url} title={title + (description ? ` - ${description}` : '')}>
            <TelegramIcon size={iconSize} round className="hover:scale-110 transition-transform" />
          </TelegramShareButton>
        </div>
      )}
    </div>
  );
}