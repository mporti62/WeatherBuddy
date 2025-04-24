import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
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
  
  const iconSize = small ? 32 : 40;
  
  const toggleButtons = () => {
    setShowButtons(!showButtons);
  };
  
  return (
    <div className={`relative ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        className={`flex items-center justify-center bg-accent bg-opacity-10 border-[#444] text-white ${small ? 'p-1' : 'p-2'}`}
        onClick={toggleButtons}
      >
        {showButtons ? <X size={18} /> : <Share2 size={18} />}
        {showText && !small && <span className="ml-2">{language === "es" ? "Compartir" : "Share"}</span>}
      </Button>
      
      {showButtons && (
        <div className={`absolute ${small ? 'bottom-10' : 'bottom-12'} right-0 sm:left-0 sm:right-auto bg-[#222] border border-[#444] p-2 rounded-lg shadow-lg z-50 flex gap-2 flex-wrap justify-center max-w-[180px]`}>
          <WhatsappShareButton url={url} title={title + (description ? ` - ${description}` : '')}>
            <WhatsappIcon size={iconSize} round />
          </WhatsappShareButton>
          
          <TwitterShareButton url={url} title={title} hashtags={hashtags}>
            <TwitterIcon size={iconSize} round />
          </TwitterShareButton>
          
          <TelegramShareButton url={url} title={title + (description ? ` - ${description}` : '')}>
            <TelegramIcon size={iconSize} round />
          </TelegramShareButton>
        </div>
      )}
    </div>
  );
}