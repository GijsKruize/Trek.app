import type { TrekUser } from "@/lib/pocketbase/types";

/** Business plan §6.1/§10 "Responsible advertising": alcohol ads only go
 * to users confirmed 18+. No `birth_date` set means "not yet confirmed",
 * not "underage" — such a user simply never sees alcohol placements
 * until they fill in their profile, which is the safe default. */
export function isConfirmedAdult(user: Pick<TrekUser, "birth_date"> | null): boolean {
  if (!user?.birth_date) return false;
  const birthDate = new Date(user.birth_date);
  if (Number.isNaN(birthDate.getTime())) return false;

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age >= 18;
}
