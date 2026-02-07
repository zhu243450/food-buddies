import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import type { Dinner } from '@/types/database';
import { logger } from "@/lib/logger";

interface UserProfile {
  food_preferences: string[];
  personality_tags: string[];
  dietary_restrictions: string[];
  location_latitude: number | null;
  location_longitude: number | null;
}

interface RecommendationData {
  matchScores: Record<string, number>;
  isReady: boolean;
}

// Calculate distance between two coordinates in km (Haversine formula)
const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Normalize Chinese location strings for matching
const extractCityFromLocation = (location: string): string => {
  // Try to extract city name from a location string like "北京市朝阳区xxx"
  const cityPatterns = ['市', '区', '县'];
  for (const pattern of cityPatterns) {
    const idx = location.indexOf(pattern);
    if (idx > 0) {
      return location.substring(0, idx + 1);
    }
  }
  return location.substring(0, Math.min(location.length, 4));
};

export const useRecommendation = (
  user: User | null,
  dinners: Dinner[]
): RecommendationData => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [historyCuisines, setHistoryCuisines] = useState<Record<string, number>>({});
  const [historyLocations, setHistoryLocations] = useState<Record<string, number>>({});
  const [isReady, setIsReady] = useState(false);

  // Fetch user profile and participation history
  useEffect(() => {
    if (!user) {
      setIsReady(true);
      return;
    }

    const fetchData = async () => {
      try {
        // Parallel fetch: profile + participation history
        const [profileRes, historyRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('food_preferences, personality_tags, dietary_restrictions, location_latitude, location_longitude')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('dinner_participants')
            .select(`
              dinners!fk_dinner_participants_dinner_id (
                food_preferences, location, personality_tags
              )
            `)
            .eq('user_id', user.id)
        ]);

        if (profileRes.data) {
          setProfile({
            food_preferences: profileRes.data.food_preferences || [],
            personality_tags: profileRes.data.personality_tags || [],
            dietary_restrictions: profileRes.data.dietary_restrictions || [],
            location_latitude: profileRes.data.location_latitude,
            location_longitude: profileRes.data.location_longitude,
          });
        }

        // Build cuisine & location frequency maps from history
        if (historyRes.data) {
          const cuisineFreq: Record<string, number> = {};
          const locationFreq: Record<string, number> = {};

          historyRes.data.forEach((item: any) => {
            const dinner = item.dinners;
            if (!dinner) return;

            // Count cuisine preferences from past dinners
            if (dinner.food_preferences) {
              dinner.food_preferences.forEach((pref: string) => {
                cuisineFreq[pref] = (cuisineFreq[pref] || 0) + 1;
              });
            }

            // Count location patterns
            if (dinner.location) {
              const city = extractCityFromLocation(dinner.location);
              locationFreq[city] = (locationFreq[city] || 0) + 1;
            }
          });

          setHistoryCuisines(cuisineFreq);
          setHistoryLocations(locationFreq);
        }
      } catch (error) {
        logger.error("Error fetching recommendation data:", error);
      } finally {
        setIsReady(true);
      }
    };

    fetchData();
  }, [user]);

  // Calculate match scores for all dinners
  const matchScores = useMemo(() => {
    const scores: Record<string, number> = {};

    if (!user || !profile) {
      return scores;
    }

    dinners.forEach(dinner => {
      let score = 0;
      let maxScore = 0;

      // 1. Food preference overlap (weight: 35)
      maxScore += 35;
      if (profile.food_preferences.length > 0 && dinner.food_preferences && dinner.food_preferences.length > 0) {
        const userPrefs = new Set(profile.food_preferences.map(p => p.toLowerCase()));
        const dinnerPrefs = dinner.food_preferences.map(p => p.toLowerCase());
        const overlap = dinnerPrefs.filter(p => userPrefs.has(p)).length;
        const overlapRatio = overlap / Math.max(dinnerPrefs.length, 1);
        score += Math.round(overlapRatio * 35);
      }

      // 2. Historical cuisine match (weight: 25)
      maxScore += 25;
      if (Object.keys(historyCuisines).length > 0 && dinner.food_preferences && dinner.food_preferences.length > 0) {
        const maxFreq = Math.max(...Object.values(historyCuisines), 1);
        let historyScore = 0;
        dinner.food_preferences.forEach(pref => {
          if (historyCuisines[pref]) {
            historyScore += historyCuisines[pref] / maxFreq;
          }
        });
        const avgHistoryScore = historyScore / dinner.food_preferences.length;
        score += Math.round(avgHistoryScore * 25);
      }

      // 3. Location match (weight: 20)
      maxScore += 20;
      if (dinner.location) {
        const dinnerCity = extractCityFromLocation(dinner.location);
        
        // Check location history match
        if (historyLocations[dinnerCity]) {
          const maxLocFreq = Math.max(...Object.values(historyLocations), 1);
          score += Math.round((historyLocations[dinnerCity] / maxLocFreq) * 12);
        }

        // Check profile location keywords match
        if (profile.location_latitude && profile.location_longitude) {
          // If user has coordinates, we give a bonus for same-city dinners
          // Since dinners don't have lat/lng, we use string matching
          score += 8; // Base proximity bonus for having location data
        }
      }

      // 4. Personality tag overlap (weight: 10)
      maxScore += 10;
      if (profile.personality_tags.length > 0 && dinner.personality_tags && dinner.personality_tags.length > 0) {
        const userTags = new Set(profile.personality_tags.map(t => t.toLowerCase()));
        const dinnerTags = dinner.personality_tags.map(t => t.toLowerCase());
        const overlap = dinnerTags.filter(t => userTags.has(t)).length;
        const overlapRatio = overlap / Math.max(dinnerTags.length, 1);
        score += Math.round(overlapRatio * 10);
      }

      // 5. Dietary restriction compatibility (weight: 10)
      maxScore += 10;
      if (profile.dietary_restrictions.length > 0 && dinner.dietary_restrictions && dinner.dietary_restrictions.length > 0) {
        const userRestrictions = new Set(profile.dietary_restrictions.map(r => r.toLowerCase()));
        const dinnerRestrictions = dinner.dietary_restrictions.map(r => r.toLowerCase());
        const overlap = dinnerRestrictions.filter(r => userRestrictions.has(r)).length;
        if (overlap > 0) {
          score += 10; // Full score if dietary needs are met
        }
      } else if (profile.dietary_restrictions.length === 0) {
        score += 5; // Partial score if no restrictions (compatible with anything)
      }

      // Normalize to 0-100
      const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      scores[dinner.id] = Math.min(normalizedScore, 99); // Cap at 99 to be realistic
    });

    return scores;
  }, [user, profile, dinners, historyCuisines, historyLocations]);

  return { matchScores, isReady };
};
