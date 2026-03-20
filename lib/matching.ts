// ============================================
// PadPal — AI Matching Algorithm
// Weighted cosine similarity on lifestyle vectors
// ============================================

import { UserPreferences } from "@/types";

// Weights for each preference dimension
const WEIGHTS = {
  schedule: 0.13,
  cleanliness: 0.22,
  social: 0.18,
  budget: 0.18,
  hobbies: 0.09,
  pets: 0.10,
  student: 0.10,
};

// Encode categorical values to numeric vectors
const ENCODINGS: Record<string, Record<string, number[]>> = {
  schedule: {
    early_bird: [1, 0, 0],
    regular: [0, 1, 0],
    night_owl: [0, 0, 1],
  },
  social: {
    often: [1, 0, 0],
    sometimes: [0, 1, 0],
    rarely: [0, 0, 1],
  },
  cleanliness: {
    spotless: [1, 0, 0],
    tidy: [0, 1, 0],
    relaxed: [0, 0, 1],
  },
  budget_range: {
    "400-600": [1, 0, 0, 0],
    "600-900": [0, 1, 0, 0],
    "900-1200": [0, 0, 1, 0],
    "1200+": [0, 0, 0, 1],
  },
  pets: {
    love: [1, 0, 0, 0],
    cats_ok: [0, 1, 0, 0],
    no_pets: [0, 0, 1, 0],
    flexible: [0.3, 0.3, 0, 0.4],
  },
};

// All possible hobbies
const ALL_HOBBIES = [
  "fitness", "gaming", "cooking", "music", "reading", "travel",
  "art", "tech", "outdoors", "movies", "yoga", "photography",
];

function encodeHobbies(hobbies: string[]): number[] {
  return ALL_HOBBIES.map((h) => (hobbies.includes(h) ? 1 : 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export interface MatchBreakdown {
  schedule: number;
  cleanliness: number;
  social: number;
  budget: number;
  hobbies: number;
  pets: number;
  student: number;
}

export function calculateMatch(
  userPrefs: UserPreferences,
  targetPrefs: UserPreferences
): { percentage: number; breakdown: MatchBreakdown } {
  const breakdown: MatchBreakdown = {
    schedule: 0,
    cleanliness: 0,
    social: 0,
    budget: 0,
    hobbies: 0,
    pets: 0,
    student: 0,
  };

  // Schedule similarity
  const userSchedule = ENCODINGS.schedule[userPrefs.schedule || "regular"];
  const targetSchedule = ENCODINGS.schedule[targetPrefs.schedule || "regular"];
  breakdown.schedule = cosineSimilarity(userSchedule, targetSchedule) * 100;

  // Cleanliness similarity
  const userClean = ENCODINGS.cleanliness[userPrefs.cleanliness || "tidy"];
  const targetClean = ENCODINGS.cleanliness[targetPrefs.cleanliness || "tidy"];
  breakdown.cleanliness = cosineSimilarity(userClean, targetClean) * 100;

  // Social similarity
  const userSocial = ENCODINGS.social[userPrefs.social || "sometimes"];
  const targetSocial = ENCODINGS.social[targetPrefs.social || "sometimes"];
  breakdown.social = cosineSimilarity(userSocial, targetSocial) * 100;

  // Budget similarity
  const userBudget = ENCODINGS.budget_range[userPrefs.budget_range || "600-900"];
  const targetBudget = ENCODINGS.budget_range[targetPrefs.budget_range || "600-900"];
  breakdown.budget = cosineSimilarity(userBudget, targetBudget) * 100;

  // Hobbies similarity (Jaccard-like via cosine)
  const userHobbies = encodeHobbies(userPrefs.hobbies || []);
  const targetHobbies = encodeHobbies(targetPrefs.hobbies || []);
  breakdown.hobbies = cosineSimilarity(userHobbies, targetHobbies) * 100;

  // Pets similarity
  const userPets = ENCODINGS.pets[userPrefs.pets || "flexible"];
  const targetPets = ENCODINGS.pets[targetPrefs.pets || "flexible"];
  breakdown.pets = cosineSimilarity(userPets, targetPets) * 100;

  // Student similarity (both students or both non-students = 100%, mixed = 40%)
  const userStudent = userPrefs.is_student ?? false;
  const targetStudent = targetPrefs.is_student ?? false;
  breakdown.student = userStudent === targetStudent ? 100 : 40;

  // Weighted total
  const percentage = Math.round(
    breakdown.schedule * WEIGHTS.schedule +
    breakdown.cleanliness * WEIGHTS.cleanliness +
    breakdown.social * WEIGHTS.social +
    breakdown.budget * WEIGHTS.budget +
    breakdown.hobbies * WEIGHTS.hobbies +
    breakdown.pets * WEIGHTS.pets +
    breakdown.student * WEIGHTS.student
  );

  // Round breakdown values
  Object.keys(breakdown).forEach((key) => {
    breakdown[key as keyof MatchBreakdown] = Math.round(
      breakdown[key as keyof MatchBreakdown]
    );
  });

  return { percentage: Math.min(percentage, 99), breakdown };
}
