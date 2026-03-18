import * as Notifications from 'expo-notifications';
import { getAllReminders, getLastMuscleDate, getLastWorkoutDate } from '../db/queries';
import { getMuscleLabel } from '../constants/muscles';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleReminders() {
  // Cancel all previously scheduled reminders
  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const reminders = await getAllReminders();
  const today = new Date();

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;

    let lastDateStr: string | null = null;
    if (reminder.type === 'inactivity') {
      lastDateStr = await getLastWorkoutDate();
    } else if (reminder.muscle) {
      lastDateStr = await getLastMuscleDate(reminder.muscle);
    }

    let daysSince: number;
    if (lastDateStr) {
      const diff = today.getTime() - new Date(lastDateStr).getTime();
      daysSince = Math.floor(diff / (1000 * 60 * 60 * 24));
    } else {
      daysSince = Infinity;
    }

    if (daysSince < reminder.thresholdDays) continue;

    const times: string[] = JSON.parse(reminder.notificationTimes);
    const title =
      reminder.type === 'inactivity'
        ? "Time to hit the gym!"
        : `Don't forget your ${getMuscleLabel(reminder.muscle ?? '')}!`;

    const body =
      reminder.type === 'inactivity'
        ? `You haven't trained in ${daysSince === Infinity ? 'a while' : `${daysSince} day${daysSince > 1 ? 's' : ''}`}. Get moving!`
        : `You haven't trained ${getMuscleLabel(reminder.muscle ?? '')} in ${daysSince === Infinity ? 'a while' : `${daysSince} day${daysSince > 1 ? 's' : ''}`}.`;

    for (const timeStr of times) {
      const [hh, mm] = timeStr.split(':').map(Number);
      const triggerDate = new Date();
      triggerDate.setHours(hh, mm, 0, 0);

      // If that time has already passed today, schedule for tomorrow
      if (triggerDate <= today) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  }
}
