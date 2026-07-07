import { UserProfile } from "./types";

export function createEmptyProfile(): UserProfile {
  return {};
}

export function updateProfile(
  profile: UserProfile,
  key: keyof UserProfile,
  value: unknown
): UserProfile {

  return {

    ...profile,

    [key]: value,

  };

}
export function hasValue(profile: UserProfile, key: keyof UserProfile): boolean {
  const value = profile[key];

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null;
}