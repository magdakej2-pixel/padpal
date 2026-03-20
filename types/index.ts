// ============================================
// PadPal — Type Definitions
// ============================================

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  postcode: string;
  budget_min: number;
  budget_max: number;
  looking_for: "room" | "flatmate" | "both";
  photos: string[];
  is_verified_email: boolean;
  is_verified_phone: boolean;
  is_student: boolean;
  occupation: string;
  university?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  schedule: "early_bird" | "regular" | "night_owl" | null;
  social: "often" | "sometimes" | "rarely" | null;
  cleanliness: "spotless" | "tidy" | "relaxed" | null;
  budget_range: "400-600" | "600-900" | "900-1200" | "1200+" | null;
  hobbies: string[];
  pets: "love" | "cats_ok" | "no_pets" | "flexible" | null;
  is_student?: boolean;
}

export interface MatchResult {
  profile: UserProfile;
  preferences: UserPreferences;
  match_percentage: number;
  match_breakdown: {
    schedule: number;
    cleanliness: number;
    social: number;
    budget: number;
    hobbies: number;
    pets: number;
    student: number;
  };
}

export interface Interaction {
  id: string;
  user_id: string;
  target_id: string;
  action: "like" | "pass" | "superlike";
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  field: keyof Pick<UserPreferences, "schedule" | "social" | "cleanliness" | "budget_range" | "hobbies" | "pets">;
  type: "single" | "multi";
  max_select?: number;
  options: QuizOption[];
}

export interface QuizOption {
  value: string;
  label: string;
  sublabel?: string;
  icon: string;
}

export interface RoomListing {
  id: string;
  user_id: string;
  type: "offering" | "seeking"; // offering = has room, seeking = needs room
  title: string;
  description: string;
  location: string;
  postcode: string;
  rent_pcm: number;
  bills_included: boolean;
  deposit: number;
  room_type: "single" | "double" | "ensuite" | "studio";
  available_from: string;
  min_stay_months: number;
  amenities: string[];
  photos: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Populated from user
  user_name?: string;
  user_photo?: string;
  user_age?: number;
  is_verified?: boolean;
  is_student?: boolean;
  occupation?: string;
  university?: string;
}
