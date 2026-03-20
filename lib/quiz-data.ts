import { QuizQuestion } from "@/types";

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What's your daily rhythm?",
    field: "schedule",
    type: "single",
    options: [
      {
        value: "early_bird",
        label: "Early Bird",
        sublabel: "Up by 6-7am, asleep by 10pm",
        icon: "🌅",
      },
      {
        value: "regular",
        label: "Regular Hours",
        sublabel: "9-5 schedule, flexible evenings",
        icon: "☀️",
      },
      {
        value: "night_owl",
        label: "Night Owl",
        sublabel: "Come alive after dark",
        icon: "🌙",
      },
    ],
  },
  {
    id: 2,
    question: "How social are you at home?",
    field: "social",
    type: "single",
    options: [
      {
        value: "often",
        label: "Very Social",
        sublabel: "Love having friends over",
        icon: "🎉",
      },
      {
        value: "sometimes",
        label: "Balanced",
        sublabel: "Social but need my quiet time",
        icon: "⚖️",
      },
      {
        value: "rarely",
        label: "Quiet & Private",
        sublabel: "Home is my peaceful retreat",
        icon: "📚",
      },
    ],
  },
  {
    id: 3,
    question: "What's your cleanliness vibe?",
    field: "cleanliness",
    type: "single",
    options: [
      {
        value: "spotless",
        label: "Spotless",
        sublabel: "Everything has its place",
        icon: "✨",
      },
      {
        value: "tidy",
        label: "Tidy Enough",
        sublabel: "Clean weekly, occasional mess ok",
        icon: "🧹",
      },
      {
        value: "relaxed",
        label: "Relaxed",
        sublabel: "Life's too short for cleaning",
        icon: "🛋️",
      },
    ],
  },
  {
    id: 4,
    question: "What's your monthly budget?",
    field: "budget_range",
    type: "single",
    options: [
      {
        value: "400-600",
        label: "£400 – £600",
        sublabel: "Budget-friendly",
        icon: "💷",
      },
      {
        value: "600-900",
        label: "£600 – £900",
        sublabel: "Mid-range comfort",
        icon: "💰",
      },
      {
        value: "900-1200",
        label: "£900 – £1,200",
        sublabel: "Premium living",
        icon: "💎",
      },
      {
        value: "1200+",
        label: "£1,200+",
        sublabel: "Luxury & central",
        icon: "🏙️",
      },
    ],
  },
  {
    id: 5,
    question: "Pick your top hobbies",
    field: "hobbies",
    type: "multi",
    max_select: 4,
    options: [
      { value: "fitness", label: "Fitness", icon: "💪" },
      { value: "gaming", label: "Gaming", icon: "🎮" },
      { value: "cooking", label: "Cooking", icon: "🍳" },
      { value: "music", label: "Music", icon: "🎵" },
      { value: "reading", label: "Reading", icon: "📖" },
      { value: "travel", label: "Travel", icon: "✈️" },
      { value: "art", label: "Art & Design", icon: "🎨" },
      { value: "tech", label: "Tech", icon: "💻" },
      { value: "outdoors", label: "Outdoors", icon: "🌿" },
      { value: "movies", label: "Movies & TV", icon: "🎬" },
      { value: "yoga", label: "Yoga", icon: "🧘" },
      { value: "photography", label: "Photography", icon: "📸" },
    ],
  },
  {
    id: 6,
    question: "How do you feel about pets?",
    field: "pets",
    type: "single",
    options: [
      {
        value: "love",
        label: "Love All Pets",
        sublabel: "The more the merrier!",
        icon: "🐾",
      },
      {
        value: "cats_ok",
        label: "Cats Only",
        sublabel: "Quiet, independent companions",
        icon: "🐱",
      },
      {
        value: "no_pets",
        label: "No Pets Please",
        sublabel: "Allergies or preference",
        icon: "🚫",
      },
      {
        value: "flexible",
        label: "Flexible",
        sublabel: "Depends on the pet",
        icon: "🤷",
      },
    ],
  },
];
