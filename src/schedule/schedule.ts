import { PendingSchedule } from './pending_schedule.js'
import { ScheduleRegistry } from './schedule_registry.js'
import { MaybePromise } from './types.js'

import { Verrou } from '@verrou/core'
import { memoryStore } from '@verrou/core/drivers/memory'

export const verrou = new Verrou({
  default: 'memory',
  stores: {
    memory: { driver: memoryStore() },
  },
})

export class Schedule {
  /**
   * Clear all scheduled tasks (or specific one if name is specified).
   *
   * @param name - The name of the task to clear
   *
   * @example
   * Schedule.clear() // Clear all tasks
   * Schedule.clear('my-task') // Clear specific task
   */
  public static clear(name?: string): void {
    if (name) {
      ScheduleRegistry.clear(name)
    } else {
      Object.keys(ScheduleRegistry.all()).forEach((name) =>
        ScheduleRegistry.clear(name),
      )
    }
  }

  /**
   * Schedule a callback to run at specified intervals.
   *
   * @param name - Unique identifier for the task (required for distributed systems)
   * @param cb - The callback function to execute
   *
   * @example
   * // Using cron pattern
   * const cleanupUsers = async () => { ... }
   * Schedule.call('cleanup-users', cleanupUsers).cron('0 0 * * *')
   *
   * // Using convenience methods
   * Schedule.call('hourly-task', () => { ... }).hourly()
   * Schedule.call('daily-task', () => { ... }).daily()
   */
  public static call(name: string, cb: () => MaybePromise<void>) {
    return new PendingSchedule(name, cb)
  }
}
