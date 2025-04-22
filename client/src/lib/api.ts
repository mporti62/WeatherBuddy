import { apiRequest } from "./queryClient";

// Location API
export async function getLocationByZip(zipCode: string) {
  const response = await fetch(`/api/location/${zipCode}`);
  if (!response.ok) throw new Error("Failed to fetch location");
  return response.json();
}

// Weather API
export async function getCurrentWeather(zipCode: string) {
  const response = await fetch(`/api/weather/current/${zipCode}`);
  if (!response.ok) throw new Error("Failed to fetch current weather");
  return response.json();
}

export async function getWeatherForecast(zipCode: string) {
  const response = await fetch(`/api/weather/forecast/${zipCode}`);
  if (!response.ok) throw new Error("Failed to fetch weather forecast");
  return response.json();
}

// Events API
export async function getEvents(zipCode: string) {
  const response = await fetch(`/api/events/${zipCode}`);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
}

// Recreation API
export async function getRecreationPlaces(zipCode: string) {
  const response = await fetch(`/api/recreation/${zipCode}`);
  if (!response.ok) throw new Error("Failed to fetch recreation places");
  return response.json();
}

// Banks API
export async function getBanks(zipCode: string) {
  const response = await fetch(`/api/banks/${zipCode}`);
  if (!response.ok) throw new Error("Failed to fetch banks");
  return response.json();
}

// Entertainment API
export async function getEntertainment(zipCode: string) {
  const response = await fetch(`/api/entertainment/${zipCode}`);
  if (!response.ok) throw new Error("Failed to fetch entertainment options");
  return response.json();
}

// Restaurants API
export async function getRestaurants(zipCode: string) {
  const response = await fetch(`/api/restaurants/${zipCode}`);
  if (!response.ok) throw new Error("Failed to fetch restaurants");
  return response.json();
}
