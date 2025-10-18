import { useEffect, useState } from "react";

interface IpApiLocation {
  city?: string;
  country?: string;
  timezone?: string;
}

export function useUserLocation() {
  const [location, setLocation] = useState<string>("Fetching location...");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Try to get cached location from localStorage first
    const cachedLoc = localStorage.getItem("userLocation");
    const cachedTz = localStorage.getItem("userTimezone");
    if (cachedLoc && cachedTz) {
      setLocation(cachedLoc);
      setTimezone(cachedTz);
      setLoading(false);
      return;
    }

    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((loc: IpApiLocation) => {
        if (loc && loc.city && loc.country && loc.timezone) {
          const locStr = `${loc.city}, ${loc.country}`;
          setLocation(locStr);
          setTimezone(loc.timezone);
          setLoading(false);
          // Save to localStorage for future use
          localStorage.setItem("userLocation", locStr);
          localStorage.setItem("userTimezone", loc.timezone);
        } else {
          // fallback to company address from login data
          let companyAddress = "";
          try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
              const userObj = JSON.parse(userStr);
              companyAddress = userObj.companyAddress || userObj.address || "Location unavailable";
            }
          } catch { companyAddress = "Location unavailable"; }
          setLocation(companyAddress || "Location unavailable");
          setTimezone("Asia/Kolkata");
          setError("Could not fetch location from IP. Showing company address.");
          setLoading(false);
          localStorage.setItem("userLocation", companyAddress || "Location unavailable");
          localStorage.setItem("userTimezone", "Asia/Kolkata");
        }
      })
      .catch(() => {
        let companyAddress = "";
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const userObj = JSON.parse(userStr);
            companyAddress = userObj.companyAddress || userObj.address || "Location unavailable";
          }
        } catch { companyAddress = "Location unavailable"; }
        setLocation(companyAddress || "Location unavailable");
        setTimezone("Asia/Kolkata");
        setError("Could not fetch location from IP. Showing company address.");
        setLoading(false);
        localStorage.setItem("userLocation", companyAddress || "Location unavailable");
        localStorage.setItem("userTimezone", "Asia/Kolkata");
      });
  }, []);

  return { location, timezone, loading, error };
}
