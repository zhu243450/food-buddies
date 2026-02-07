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

export interface MatchReason {
  type: 'food' | 'history' | 'location' | 'personality' | 'dietary';
  label: string;
  emoji: string;
}

interface RecommendationData {
  matchScores: Record<string, number>;
  matchReasons: Record<string, MatchReason[]>;
  isReady: boolean;
}

// Normalize Chinese location strings for matching
const extractCityFromLocation = (location: string): string => {
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

        if (historyRes.data) {
          const cuisineFreq: Record<string, number> = {};
          const locationFreq: Record<string, number> = {};

          historyRes.data.forEach((item: any) => {
            const dinner = item.dinners;
            if (!dinner) return;
            if (dinner.food_preferences) {
              dinner.food_preferences.forEach((pref: string) => {
                cuisineFreq[pref] = (cuisineFreq[pref] || 0) + 1;
              });
            }
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

  // Calculate match scores AND reasons for all dinners
  const { matchScores, matchReasons } = useMemo(() => {
    const scores: Record<string, number> = {};
    const reasons: Record<string, MatchReason[]> = {};

    if (!user || !profile) {
      return { matchScores: scores, matchReasons: reasons };
    }

    dinners.forEach(dinner => {
      let score = 0;
      let maxScore = 0;
      const dinnerReasons: MatchReason[] = [];

      // 1. Food preference overlap (weight: 35)
      maxScore += 35;
      if (profile.food_preferences.length > 0 && dinner.food_preferences && dinner.food_preferences.length > 0) {
        const userPrefs = new Set(profile.food_preferences.map(p => p.toLowerCase()));
        const dinnerPrefs = dinner.food_preferences.map(p => p.toLowerCase());
        const matchedFoods = dinner.food_preferences.filter(p => userPrefs.has(p.toLowerCase()));
        const overlapRatio = matchedFoods.length / Math.max(dinnerPrefs.length, 1);
        const foodScore = Math.round(overlapRatio * 35);
        score += foodScore;
        if (matchedFoods.length > 0) {
          dinnerReasons.push({
            type: 'food',
            label: matchedFoods.slice(0, 2).join('、'),
            emoji: '🍽️'
          });
        }
      }

      // 2. Historical cuisine match (weight: 25)
      maxScore += 25;
      if (Object.keys(historyCuisines).length > 0 && dinner.food_preferences && dinner.food_preferences.length > 0) {
        const maxFreq = Math.max(...Object.values(historyCuisines), 1);
        let historyScore = 0;
        const matchedHistory: string[] = [];
        dinner.food_preferences.forEach(pref => {
          if (historyCuisines[pref]) {
            historyScore += historyCuisines[pref] / maxFreq;
            matchedHistory.push(pref);
          }
        });
        const avgHistoryScore = historyScore / dinner.food_preferences.length;
        score += Math.round(avgHistoryScore * 25);
        if (matchedHistory.length > 0 && !dinnerReasons.some(r => r.type === 'food')) {
          dinnerReasons.push({
            type: 'history',
            label: matchedHistory[0],
            emoji: '📊'
          });
        }
      }

      // 3. Location match (weight: 20)
      maxScore += 20;
      if (dinner.location) {
        const dinnerCity = extractCityFromLocation(dinner.location);
        
        if (historyLocations[dinnerCity]) {
          const maxLocFreq = Math.max(...Object.values(historyLocations), 1);
          score += Math.round((historyLocations[dinnerCity] / maxLocFreq) * 12);
          dinnerReasons.push({
            type: 'location',
            label: dinnerCity,
            emoji: '📍'
          });
        }

        if (profile.location_latitude && profile.location_longitude) {
          score += 8;
        }
      }

      // 4. Personality tag overlap (weight: 10)
      maxScore += 10;
      if (profile.personality_tags.length > 0 && dinner.personality_tags && dinner.personality_tags.length > 0) {
        const userTags = new Set(profile.personality_tags.map(t => t.toLowerCase()));
        const matchedTags = dinner.personality_tags.filter(t => userTags.has(t.toLowerCase()));
        const overlapRatio = matchedTags.length / Math.max(dinner.personality_tags.length, 1);
        score += Math.round(overlapRatio * 10);
        if (matchedTags.length > 0) {
          dinnerReasons.push({
            type: 'personality',
            label: matchedTags[0],
            emoji: '🎭'
          });
        }
      }

      // 5. Dietary restriction compatibility (weight: 10)
      maxScore += 10;
      if (profile.dietary_restrictions.length > 0 && dinner.dietary_restrictions && dinner.dietary_restrictions.length > 0) {
        const userRestrictions = new Set(profile.dietary_restrictions.map(r => r.toLowerCase()));
        const dinnerRestrictions = dinner.dietary_restrictions.map(r => r.toLowerCase());
        const overlap = dinnerRestrictions.filter(r => userRestrictions.has(r)).length;
        if (overlap > 0) {
          score += 10;
          dinnerReasons.push({
            type: 'dietary',
            label: dinner.dietary_restrictions[0],
            emoji: '✅'
          });
        }
      } else if (profile.dietary_restrictions.length === 0) {
        score += 5;
      }

      const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      scores[dinner.id] = Math.min(normalizedScore, 99);
      reasons[dinner.id] = dinnerReasons.slice(0, 3); // Max 3 reasons
    });

    return { matchScores: scores, matchReasons: reasons };
  }, [user, profile, dinners, historyCuisines, historyLocations]);

  return { matchScores, matchReasons, isReady };
};
