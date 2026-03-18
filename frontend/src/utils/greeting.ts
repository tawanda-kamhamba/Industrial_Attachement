/**
 * Returns a time-of-day greeting: "Good Morning", "Good Afternoon", or "Good Evening".
 * Morning: 12:00 AM–11:59 AM, Afternoon: 12:00 PM–5:59 PM, Evening: 6:00 PM–11:59 PM.
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}
