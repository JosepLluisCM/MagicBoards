export interface User {
  id: string; // Firebase Auth User ID
  email: string; // User's email address
  displayName: string; // User's display name
  profilePictureUrl: string; // URL to user's profile picture
  createdAt: Date; // Account creation timestamp
  updatedAt: Date; // Last update timestamp
}
