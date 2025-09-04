// Default user for app without authentication
const DEFAULT_USER = {
  id: "guest-user",
  username: "Guest User",
  email: "guest@flowlingo.com",
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  streak: 0,
  hearts: 5,
  lessonsCompleted: 0,
  mascotSticker: "flow-dolphin",
  mascotName: "Flow",
  createdAt: new Date(),
  updatedAt: new Date()
};

export function useAuth() {
  // Return a default user without any authentication
  return {
    user: DEFAULT_USER,
    isLoading: false,
    isAuthenticated: true, // Always authenticated as guest
    error: null,
    logout: () => {}, // No-op logout function
  };
}