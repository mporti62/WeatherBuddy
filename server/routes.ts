import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import NodeCache from "node-cache";
import path from "path";
import express from "express";

// Cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600 });

// API keys from environment variables
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || "";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up static file serving from the public directory
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
  // LOCATION ENDPOINTS
  app.get("/api/location/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `location_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // If we don't have Google Places API key, use mockup data for testing
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "") {
        console.log("Using mockup data: No Google Places API key available");
        
        // Generate location data based on zipCode using a consistent algorithm
        // This ensures the same zipCode always returns the same coordinates
        const zipSeed = parseInt(zipCode) || 12345;
        const latitude = 25.94 + (zipSeed % 100) * 0.01;
        const longitude = -80.25 + (zipSeed % 100) * 0.01;
        
        const mockLocation = {
          zipCode,
          city: "Test City",
          state: "FL",
          latitude,
          longitude
        };
        
        // Save to cache
        cache.set(cacheKey, mockLocation);
        
        return res.json(mockLocation);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (response.data.status !== "OK") {
        return res.status(404).json({ message: "Location not found" });
      }
      
      const result = response.data.results[0];
      
      // Extract city and state
      let city = "";
      let state = "";
      
      result.address_components.forEach((component: any) => {
        if (component.types.includes("locality")) {
          city = component.long_name;
        } else if (component.types.includes("administrative_area_level_1")) {
          state = component.short_name;
        }
      });
      
      const location = {
        zipCode,
        city,
        state,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng
      };
      
      // Save to cache
      cache.set(cacheKey, location);
      
      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });
  
  app.get("/api/location/suggestions", async (req, res) => {
    try {
      const { zip } = req.query;
      
      if (!zip || typeof zip !== "string" || zip.length < 3) {
        return res.json([]);
      }
      
      // Mock data for zip code suggestions
      // In a real application, use a proper ZIP code API
      const suggestions = [
        `${zip}01 - Springfield, IL`,
        `${zip}02 - Riverside, CA`,
        `${zip}10 - Mountain View, OR`
      ];
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching zip suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });
  
  app.get("/api/location/coordinates", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      // Use reverse geocoding to get zip code from coordinates
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (response.data.status !== "OK") {
        return res.status(404).json({ message: "Location not found" });
      }
      
      // Find postal code in address components
      let zipCode = "";
      for (const result of response.data.results) {
        for (const component of result.address_components) {
          if (component.types.includes("postal_code")) {
            zipCode = component.short_name;
            break;
          }
        }
        if (zipCode) break;
      }
      
      if (!zipCode) {
        return res.status(404).json({ message: "ZIP code not found" });
      }
      
      res.json({ zipCode });
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      res.status(500).json({ message: "Failed to get location from coordinates" });
    }
  });
  
  // WEATHER ENDPOINTS
  app.get("/api/weather/current/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `weather_current_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first to get lat/lng
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have OpenWeather API key, use mockup data for testing
      if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "") {
        console.log("Using mockup data: No OpenWeather API key available for current weather");
        
        // Generate weather data using a consistent algorithm based on zip code
        // This ensures the same zipCode always returns similar but slightly varying weather
        const zipSeed = parseInt(zipCode) || 12345;
        const temp = 20 + (zipSeed % 10); // Temperature between 20-29
        const windFactor = (zipSeed % 5) + 1; // Wind between 1-5
        
        const weatherConditions = ['clear', 'clouds', 'rain', 'mist'];
        const conditionIndex = zipSeed % weatherConditions.length;
        const condition = weatherConditions[conditionIndex];
        
        const descriptions: Record<string, string> = {
          'clear': 'clear sky',
          'clouds': 'few clouds',
          'rain': 'light rain',
          'mist': 'mist'
        };
        
        const weatherData = {
          temp: temp,
          feelsLike: temp - 2,
          description: descriptions[condition] || 'clear sky',
          condition: condition,
          windSpeed: windFactor,
          humidity: 60 + (zipSeed % 30), // Humidity between 60-89
          visibility: ((10 - windFactor) / 2).toFixed(1), // Visibility between 2.5-5.0
          date: new Date().toISOString()
        };
        
        // Save to cache
        cache.set(cacheKey, weatherData);
        
        return res.json(weatherData);
      }
      
      // If we have an API key, fetch real data
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        
        const weatherData = {
          temp: Math.round(response.data.main.temp),
          feelsLike: Math.round(response.data.main.feels_like),
          description: response.data.weather[0].description,
          condition: response.data.weather[0].main.toLowerCase(),
          windSpeed: Math.round(response.data.wind.speed),
          humidity: response.data.main.humidity,
          visibility: (response.data.visibility / 1000).toFixed(1),
          date: new Date().toISOString()
        };
        
        // Save to cache
        cache.set(cacheKey, weatherData);
        
        return res.json(weatherData);
      } catch (error) {
        console.error("Error fetching weather data from API:", error);
        
        // Generate fallback weather data
        const weatherData = {
          temp: 25,
          feelsLike: 23,
          description: "clear sky",
          condition: "clear",
          windSpeed: 3,
          humidity: 65,
          visibility: "4.5",
          date: new Date().toISOString()
        };
        
        return res.json(weatherData);
      }
      
    } catch (error) {
      console.error("Error fetching current weather:", error);
      res.status(500).json({ message: "Failed to fetch current weather" });
    }
  });
  
  app.get("/api/weather/forecast/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `weather_forecast_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first to get lat/lng
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have OpenWeather API key, use mockup data for testing
      if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "") {
        console.log("Using mockup data: No OpenWeather API key available for forecast");
        
        // Generate forecast data based on zipCode for consistency
        const zipSeed = parseInt(zipCode) || 12345;
        const today = new Date();
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const conditions = ['clear', 'clouds', 'rain', 'mist'];
        
        const days: Array<{
          name: string;
          highTemp: number;
          lowTemp: number;
          condition: string;
        }> = [];
        
        // Generate 5 days of forecast
        for (let i = 0; i < 5; i++) {
          const dayIndex = (today.getDay() + i) % 7;
          const dayName = weekdays[dayIndex];
          const conditionIndex = (zipSeed + i) % conditions.length;
          const baseTemp = 18 + (zipSeed % 10);
          
          days.push({
            name: dayName,
            highTemp: baseTemp + i + 5,
            lowTemp: baseTemp + i - 2,
            condition: conditions[conditionIndex]
          });
        }
        
        const forecastData = { days };
        
        // Save to cache
        cache.set(cacheKey, forecastData);
        
        return res.json(forecastData);
      }
      
      // If we have an API key, fetch real data
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        
        // Process forecast data to group by day
        const days: Array<{
          name: string;
          highTemp: number;
          lowTemp: number;
          condition: string;
        }> = [];
        
        const dayMap = new Map<string, {
          temps: number[];
          conditions: string[];
        }>();
        
        response.data.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000);
          const day = date.toLocaleDateString('en-US', { weekday: 'long' });
          
          if (!dayMap.has(day)) {
            dayMap.set(day, {
              temps: [],
              conditions: []
            });
          }
          
          const dayData = dayMap.get(day);
          if (dayData) {
            dayData.temps.push(item.main.temp);
            dayData.conditions.push(item.weather[0].main.toLowerCase());
          }
        });
        
        // Calculate high/low and most common condition for each day
        dayMap.forEach((value, key) => {
          const mostCommonCondition = value.conditions
            .sort((a: string, b: string) => 
              value.conditions.filter((v: string) => v === a).length
              - value.conditions.filter((v: string) => v === b).length
            )
            .pop() || 'clear';
            
          days.push({
            name: key,
            highTemp: Math.round(Math.max(...value.temps)),
            lowTemp: Math.round(Math.min(...value.temps)),
            condition: mostCommonCondition
          });
        });
        
        // Take only the next 5 days
        const forecastData = {
          days: days.slice(0, 5)
        };
        
        // Save to cache
        cache.set(cacheKey, forecastData);
        
        return res.json(forecastData);
      } catch (error) {
        console.error("Error fetching forecast data from API:", error);
        
        // Generate fallback forecast data
        const today = new Date();
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const mockDays = [];
        
        for (let i = 0; i < 5; i++) {
          const dayIndex = (today.getDay() + i) % 7;
          mockDays.push({
            name: weekdays[dayIndex],
            highTemp: 25 + i,
            lowTemp: 15 + i,
            condition: i % 2 === 0 ? 'clear' : 'clouds'
          });
        }
        
        const forecastData = { days: mockDays };
        return res.json(forecastData);
      }
    } catch (error) {
      console.error("Error fetching weather forecast:", error);
      res.status(500).json({ message: "Failed to fetch weather forecast" });
    }
  });
  
  // EVENTS ENDPOINTS
  app.get("/api/events/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `events_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { city, state } = locationRes.data;
      
      // If we don't have Ticketmaster API key, use mockup data for testing
      if (!TICKETMASTER_API_KEY || TICKETMASTER_API_KEY === "") {
        console.log("Using mockup data: No Ticketmaster API key available for events");
        
        // Create mockup events that are somewhat based on zip code
        const zipSeed = parseInt(zipCode) || 12345;
        const date = new Date();
        const currentDay = date.getDate();
        const currentMonth = date.toLocaleString('en-US', { month: 'short' });
        
        const mockEvents = [
          {
            id: "evt1",
            name: "Community Music Festival",
            description: "Join us for a day of live music from local artists, food vendors, and family activities in the park.",
            location: "City Park Amphitheater",
            day: currentDay + 3,
            month: currentMonth,
            time: "6:00 PM",
            categories: ["Music", "Festival"],
            imageUrl: "https://via.placeholder.com/400x300?text=Music+Festival"
          },
          {
            id: "evt2",
            name: "International Film Showcase",
            description: "A curated selection of award-winning international films with director Q&A sessions.",
            location: "Downtown Cinema Center",
            day: currentDay + 5,
            month: currentMonth,
            time: "7:30 PM",
            categories: ["Film", "Arts & Theatre"],
            imageUrl: "https://via.placeholder.com/400x300?text=Film+Festival"
          },
          {
            id: "evt3",
            name: (zipSeed % 2 === 0) ? "Professional Basketball Game" : "Championship Soccer Match",
            description: "Watch the exciting match between local teams competing for the season title.",
            location: (zipSeed % 2 === 0) ? "Sports Arena" : "City Stadium",
            day: currentDay + 7,
            month: currentMonth,
            time: "8:00 PM",
            categories: ["Sports"],
            imageUrl: (zipSeed % 2 === 0) ? "https://via.placeholder.com/400x300?text=Basketball" : "https://via.placeholder.com/400x300?text=Soccer"
          },
          {
            id: "evt4",
            name: "Weekend Food & Wine Festival",
            description: "Sample cuisine from top local restaurants and enjoy wine tastings from regional vineyards.",
            location: "Riverfront Plaza",
            day: currentDay + 10,
            month: currentMonth,
            time: "12:00 PM",
            categories: ["Food", "Festival"],
            imageUrl: "https://via.placeholder.com/400x300?text=Food+Festival"
          },
          {
            id: "evt5",
            name: "Classic Car Show & Exhibition",
            description: "See rare and vintage automobiles from collectors across the region with special guest appearances.",
            location: "Convention Center",
            day: currentDay + 14,
            month: currentMonth,
            time: "10:00 AM",
            categories: ["Exhibition", "Hobby"],
            imageUrl: "https://via.placeholder.com/400x300?text=Car+Exhibition"
          }
        ];
        
        // Save to cache
        cache.set(cacheKey, mockEvents);
        
        return res.json(mockEvents);
      }
      
      // If we have an API key, fetch real data
      try {
        const response = await axios.get(
          `https://app.ticketmaster.com/discovery/v2/events.json?city=${city}&stateCode=${state}&apikey=${TICKETMASTER_API_KEY}`
        );
        
        if (!response.data._embedded || !response.data._embedded.events) {
          return res.json([]);
        }
        
        const events = response.data._embedded.events.map((event: any) => {
          const date = new Date(event.dates.start.dateTime || event.dates.start.localDate);
          
          return {
            id: event.id,
            name: event.name,
            description: event.info || event.pleaseNote || "No description available",
            location: event._embedded.venues[0].name,
            day: date.getDate(),
            month: date.toLocaleString('en-US', { month: 'short' }),
            time: event.dates.start.localTime 
              ? new Date(`2000-01-01T${event.dates.start.localTime}`).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })
              : "TBD",
            categories: event.classifications
              ? [
                  event.classifications[0].segment.name,
                  event.classifications[0].genre?.name
                ].filter(Boolean)
              : ["Event"],
            imageUrl: event.images && event.images.length > 0
              ? event.images.find((img: any) => img.width > 500)?.url || event.images[0].url
              : `https://via.placeholder.com/400x300?text=${encodeURIComponent(event.name)}`
          };
        });
        
        // Save to cache
        cache.set(cacheKey, events);
        
        return res.json(events);
      } catch (error) {
        console.error("Error fetching events from API:", error);
        
        // Generate fallback events data
        const date = new Date();
        const currentDay = date.getDate();
        const currentMonth = date.toLocaleString('en-US', { month: 'short' });
        
        const mockEvents = [
          {
            id: "evt1",
            name: "Local Music Concert",
            description: "Join us for a night of music from local bands and artists.",
            location: "City Park",
            day: currentDay + 2,
            month: currentMonth,
            time: "7:00 PM",
            categories: ["Music"],
            imageUrl: "https://via.placeholder.com/400x300?text=Music+Concert"
          },
          {
            id: "evt2",
            name: "Community Festival",
            description: "Annual community gathering with activities for all ages.",
            location: "Downtown Plaza",
            day: currentDay + 5,
            month: currentMonth,
            time: "11:00 AM",
            categories: ["Festival"],
            imageUrl: "https://via.placeholder.com/400x300?text=Community+Festival"
          }
        ];
        
        return res.json(mockEvents);
      }
      

    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  // RECREATION PLACES ENDPOINTS
  app.get("/api/recreation/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `recreation_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have Google Places API key, use mockup data for testing
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "") {
        console.log("Using mockup data: No Google Places API key available for recreation places");
        
        // Create mockup recreation places
        const mockPlaces = [
          {
            id: "rec1",
            name: "Central Park",
            description: "A beautiful park with walking trails and picnic areas.",
            address: "100 Park Ave, Test City, FL",
            imageUrl: "https://via.placeholder.com/400x300?text=Park",
            rating: 4.5,
            tags: ["park", "outdoor"],
            hours: "8:00 - 20:00",
            latitude: latitude + 0.01,
            longitude: longitude + 0.01
          },
          {
            id: "rec2",
            name: "City Museum",
            description: "A popular destination with activities for visitors of all ages.",
            address: "200 Museum Blvd, Test City, FL",
            imageUrl: "https://via.placeholder.com/400x300?text=Museum",
            rating: 4.2,
            tags: ["museum", "indoor"],
            hours: "9:00 - 17:00",
            latitude: latitude - 0.01,
            longitude: longitude - 0.01
          },
          {
            id: "rec3",
            name: "Sports Stadium",
            description: "Home of the local sports teams with regular events.",
            address: "300 Stadium Way, Test City, FL",
            imageUrl: "https://via.placeholder.com/400x300?text=Stadium",
            rating: 4.0,
            tags: ["sports"],
            hours: "Varies by event",
            latitude: latitude + 0.02,
            longitude: longitude - 0.02
          },
          {
            id: "rec4",
            name: "Adventure Park",
            description: "Outdoor activities and adventure courses for all ages.",
            address: "400 Adventure Rd, Test City, FL",
            imageUrl: "https://via.placeholder.com/400x300?text=Adventure",
            rating: 4.7,
            tags: ["park", "outdoor"],
            hours: "9:00 - 18:00",
            latitude: latitude - 0.02,
            longitude: longitude + 0.02
          }
        ];
        
        // Save to cache
        cache.set(cacheKey, mockPlaces);
        
        return res.json(mockPlaces);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=park|museum|stadium|zoo&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json([]);
      }
      
      // Process places data
      const places = await Promise.all(response.data.results.slice(0, 5).map(async (place: any) => {
        // Determine tag based on types
        const tags = [];
        if (place.types.includes("park")) tags.push("park");
        if (place.types.includes("museum")) tags.push("museum");
        if (place.types.includes("stadium")) tags.push("sports");
        if (place.types.some((type: string) => ["campground", "tourist_attraction", "zoo"].includes(type))) {
          tags.push("outdoor");
        }
        if (tags.length === 0) tags.push("recreation");
        
        // For a real app, we would fetch details to get hours, but we'll mock it for now
        const hours = "8:00 - 20:00";
        
        return {
          id: place.place_id,
          name: place.name,
          description: "A popular destination with activities for visitors of all ages.",
          address: place.vicinity,
          imageUrl: place.photos && place.photos[0] 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : "https://via.placeholder.com/400x300?text=No+Image",
          rating: place.rating || 4.0,
          tags,
          hours,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        };
      }));
      
      // Save to cache
      cache.set(cacheKey, places);
      
      res.json(places);
    } catch (error) {
      console.error("Error fetching recreation places:", error);
      res.status(500).json({ message: "Failed to fetch recreation places" });
    }
  });
  
  // BANKS ENDPOINTS
  app.get("/api/banks/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `banks_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have Google Places API key, use mockup data for testing
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "") {
        console.log("Using mockup data: No Google Places API key available for banks");
        
        // Create mockup banks
        const mockBanks = [
          {
            id: "bank1",
            name: "First National Bank",
            address: "100 Main St, Test City, FL",
            hours: "9:00 - 17:00",
            isOpen: new Date().getHours() >= 9 && new Date().getHours() < 17,
            services: ["ATM", "Customer Service", "Loans"],
            distance: "0.5",
            latitude: latitude + 0.005,
            longitude: longitude + 0.005,
            imageUrl: "https://via.placeholder.com/400x300?text=National+Bank"
          },
          {
            id: "bank2",
            name: "Community Credit Union",
            address: "200 Market St, Test City, FL",
            hours: "9:00 - 17:00",
            isOpen: new Date().getHours() >= 9 && new Date().getHours() < 17,
            services: ["ATM", "Investments"],
            distance: "1.2",
            latitude: latitude - 0.007,
            longitude: longitude - 0.003,
            imageUrl: "https://via.placeholder.com/400x300?text=Credit+Union"
          },
          {
            id: "bank3",
            name: "City Bank & Trust",
            address: "300 Finance Blvd, Test City, FL",
            hours: "8:30 - 16:30",
            isOpen: new Date().getHours() >= 8.5 && new Date().getHours() < 16.5,
            services: ["Customer Service", "Loans", "Investments"],
            distance: "1.8",
            latitude: latitude - 0.01,
            longitude: longitude + 0.008,
            imageUrl: "https://via.placeholder.com/400x300?text=City+Bank"
          },
          {
            id: "bank4",
            name: "International Banking Group",
            address: "400 Global Ave, Test City, FL",
            hours: "9:00 - 18:00",
            isOpen: new Date().getHours() >= 9 && new Date().getHours() < 18,
            services: ["ATM", "Foreign Currency"],
            distance: "2.3",
            latitude: latitude + 0.012,
            longitude: longitude - 0.009,
            imageUrl: "https://via.placeholder.com/400x300?text=International+Bank"
          }
        ];
        
        // Save to cache
        cache.set(cacheKey, mockBanks);
        
        return res.json(mockBanks);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=bank&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json([]);
      }
      
      // Process bank data
      const banks = response.data.results.slice(0, 5).map((bank: any, index: number) => {
        // Determine if the bank is open (in a real app, would use actual hours)
        const isOpen = new Date().getHours() >= 9 && new Date().getHours() < 17;
        
        // Determine services
        const services = [];
        if (index % 3 === 0 || index % 2 === 0) services.push("ATM");
        if (index % 2 === 0) services.push("Customer Service");
        if (index % 3 === 1) services.push("Loans");
        if (index % 3 === 2) services.push("Investments");
        
        return {
          id: bank.place_id,
          name: bank.name,
          address: bank.vicinity,
          hours: "9:00 - 17:00",
          isOpen,
          services,
          distance: ((index + 1) * 0.6).toFixed(1),
          latitude: bank.geometry.location.lat,
          longitude: bank.geometry.location.lng,
          imageUrl: bank.photos && bank.photos[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${bank.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : `https://via.placeholder.com/400x300?text=${encodeURIComponent(bank.name)}`
        };
      });
      
      // Save to cache
      cache.set(cacheKey, banks);
      
      res.json(banks);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ message: "Failed to fetch banks" });
    }
  });
  
  // ENTERTAINMENT ENDPOINTS
  app.get("/api/entertainment/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `entertainment_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have Google Places API key, use mockup data for testing
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "") {
        console.log("Using mockup data: No Google Places API key available for entertainment");
        
        // Create mockup featured entertainment
        const mockFeatured = {
          id: "ent1",
          name: "Fiesta Theater & Entertainment",
          location: "123 Cinema Drive, Test City, FL",
          description: "Experience one of the best entertainment options in your area with dining, movies, and games all in one place!",
          imageUrl: "https://via.placeholder.com/400x300?text=Entertainment",
          categories: ["Movie Theater", "Restaurant"]
        };
        
        // Create mockup entertainment options
        const mockOptions = [
          {
            id: "ent2",
            name: "Gourmet Experience Restaurant",
            location: "456 Food Blvd, Test City, FL",
            imageUrl: "https://via.placeholder.com/400x300?text=Restaurant",
            rating: 4.8,
            reviewCount: 120,
            category: "Restaurant"
          },
          {
            id: "ent3",
            name: "City Art Gallery",
            location: "789 Culture St, Test City, FL",
            imageUrl: "https://via.placeholder.com/400x300?text=Art+Gallery",
            rating: 4.5,
            reviewCount: 85,
            category: "Art"
          },
          {
            id: "ent4",
            name: "Downtown Bowling Center",
            location: "234 Fun Ave, Test City, FL",
            imageUrl: "https://via.placeholder.com/400x300?text=Bowling",
            rating: 4.3,
            reviewCount: 95,
            category: "Bowling"
          },
          {
            id: "ent5",
            name: "Rhythm Night Club",
            location: "567 Music Lane, Test City, FL",
            imageUrl: "https://via.placeholder.com/400x300?text=Night+Club",
            rating: 4.6,
            reviewCount: 150,
            category: "Night Life"
          }
        ];
        
        const mockEntertainmentData = {
          featured: mockFeatured,
          options: mockOptions
        };
        
        // Save to cache
        cache.set(cacheKey, mockEntertainmentData);
        
        return res.json(mockEntertainmentData);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=restaurant|movie_theater|bowling_alley|night_club|art_gallery&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json(null);
      }
      
      // Process entertainment data
      const places = response.data.results;
      
      // Select a featured place (first result)
      const featured = {
        id: places[0].place_id,
        name: places[0].name,
        location: places[0].vicinity,
        description: "Experience one of the best entertainment options in your area!",
        imageUrl: places[0].photos && places[0].photos[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${places[0].photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          : "https://via.placeholder.com/400x300?text=No+Image",
        categories: places[0].types
          .filter((type: string) => !["establishment", "point_of_interest"].includes(type))
          .map((type: string) => type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "))
          .slice(0, 2)
      };
      
      // Process other entertainment options
      const options = places.slice(1, 5).map((place: any) => {
        let category = "Entertainment";
        
        if (place.types.includes("restaurant")) category = "Restaurant";
        else if (place.types.includes("movie_theater")) category = "Cinema";
        else if (place.types.includes("night_club")) category = "Night Life";
        else if (place.types.includes("art_gallery")) category = "Art";
        else if (place.types.includes("bowling_alley")) category = "Bowling";
        
        return {
          id: place.place_id,
          name: place.name,
          location: place.vicinity,
          imageUrl: place.photos && place.photos[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : "https://via.placeholder.com/400x300?text=No+Image",
          rating: place.rating || 4.0,
          reviewCount: place.user_ratings_total || 50,
          category
        };
      });
      
      const entertainmentData = {
        featured,
        options
      };
      
      // Save to cache
      cache.set(cacheKey, entertainmentData);
      
      res.json(entertainmentData);
    } catch (error) {
      console.error("Error fetching entertainment:", error);
      res.status(500).json({ message: "Failed to fetch entertainment options" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
