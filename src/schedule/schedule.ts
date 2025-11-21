import { PendingSchedule } from './pending_schedule.js'
import { ScheduleRegistry } from './schedule_registry.js'
import { MaybePromise } from './types.js'

import { Verrou } from '@verrou/core'
import { memoryStore } from '@verrou/core/drivers/memory'

/**
 * Default Verrou instance for distributed locking.
 * Uses memory store by default.
 */
export const verrou = new Verrou({
  default: 'memory',
  stores: {
    memory: { driver: memoryStore() },
  },
})

export class Schedule {
  /**
   * Custom Verrou instance for distributed locking.
   * If not set, the default memory-based instance will be used.
   */
  private static verrouInstance: Verrou<any> = verrou

  /**
   * Set a custom Verrou instance for distributed locking.
   *
   * This allows to use different lock stores with the scheduler.
   *
   * @param instance - Custom Verrou instance
   *
   * @example
   * import { Verrou } from '@verrou/core'
   * import { redisStore } from '@verrou/core/drivers/redis'
   *
   * const customVerrou = new Verrou({
   *   default: 'redis',
   *   stores: { redis: { driver: redisStore({ connection: redisClient }) } }
   * })
   *
   * Schedule.useVerrou(customVerrou)
   */
  public static setVerrou(instance: Verrou<any>): void {
    this.verrouInstance = instance
  }

  /**
   * Get the current Verrou instance.
   */
  public static getVerrou(): Verrou<any> {
    return this.verrouInstance
  }

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
    return new PendingSchedule(name, cb, this.verrouInstance)
  }
}
