// Location types
export interface Location {
  zipCode: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

// Weather types
export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  description: string;
  condition: string;
  windSpeed: number;
  humidity: number;
  visibility: number;
  date: string;
}

export interface ForecastDay {
  name: string;
  highTemp: number;
  lowTemp: number;
  condition: string;
}

export interface WeatherForecast {
  days: ForecastDay[];
}

// Events types
export interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  day: string;
  month: string;
  time: string;
  categories: string[];
}

// Recreation types
export interface RecreationPlace {
  id: number;
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  rating: number;
  tags: string[];
  hours: string;
  latitude?: number;
  longitude?: number;
}

// Banks types
export interface Bank {
  id: number;
  name: string;
  address: string;
  hours: string;
  isOpen: boolean;
  services: string[];
  distance: number;
  latitude?: number;
  longitude?: number;
}

// Entertainment types
export interface EntertainmentOption {
  id: number;
  name: string;
  location: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  category: string;
}

export interface FeaturedEntertainment {
  id: number;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  categories: string[];
}

export interface Entertainment {
  featured: FeaturedEntertainment;
  options: EntertainmentOption[];
}
