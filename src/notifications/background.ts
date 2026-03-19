import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { scheduleReminders } from './scheduler';

const TASK_NAME = 'musclememo-background-check';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await scheduleReminders();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 60 * 60 * 12, // 12 hours
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Background fetch may not be available on all devices/simulators
  }
}
