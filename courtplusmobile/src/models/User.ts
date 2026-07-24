export type Sport = {
  id: string;
  name: string;
  level: string;
  userId: string;
  timePreference: string;
};

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export type User = {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  username: string;
  verifiedAt: string;
  email?: string;
  avatarUrl?: string;
  firebaseUid?: string;
  createdAt: string;
  updatedAt: string;
  id: string;
  bio?: string;
  coverUrl?: string;
  matchesPlayedCount?: number;
  minutesPlayedCount?: number;
  sports: Sport[];
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isFollowed?: boolean;
  bookingsCount: number;
};
