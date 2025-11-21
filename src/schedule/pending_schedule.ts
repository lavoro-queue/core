import {
  IntervalCronOptions,
  ScheduleInterval,
  intervalToCron,
} from './schedule_interval.js'
import { ScheduleRegistry } from './schedule_registry.js'
import { MaybePromise } from './types.js'

import { Cron } from 'croner'

export class PendingSchedule {
  private cronPattern?: string

  constructor(
    private name: string,
    private cb: () => MaybePromise<void>,
  ) {}

  /**
   * Schedule using a cron pattern.
   * You can use https://crontab.guru to generate a cron pattern.
   *
   * @param pattern - Cron pattern string
   *
   * @example
   * Schedule.call('my-task', () => {}).cron('0 0 * * *')       // Daily at midnight
   * Schedule.call('my-task', () => {}).cron('*\/5 * * * *')    // Every 5 minutes
   * Schedule.call('my-task', () => {}).cron('0 *\/2 * * *')    // Every 2 hours
   */
  public cron(pattern: string): this {
    this.cronPattern = pattern
    return this
  }

  /**
   * Schedule to run at a specific interval.
   * For longer intervals (hour, day, week, etc.), you can customize when they run.
   *
   * @param interval - The schedule interval
   * @param options - Options to customize the cron pattern
   *
   * @example
   * Schedule.call('my-task', () => {}).every('minute')
   * Schedule.call('my-task', () => {}).every('hour', { minute: 30 })
   * Schedule.call('my-task', () => {}).every('day', { hour: 14, minute: 30 })
   * Schedule.call('my-task', () => {}).every('week', { dayOfWeek: 1, hour: 9 })
   */
  public every(
    interval: ScheduleInterval,
    options?: IntervalCronOptions,
  ): this {
    this.cronPattern = intervalToCron(interval, options)
    return this
  }

  private async execute(): Promise<void> {
    if (!this.cronPattern) {
      throw new Error(
        'No schedule pattern defined. To schedule a task, set interval explicitly.',
      )
    }

    ScheduleRegistry.add(
      this.name,
      new Cron(this.cronPattern, async () => {
        await this.cb()
      }),
    )
  }

  /**
   * By defining the "then" method, PendingDispatch becomes "thenable",
   * allowing it to trigger automatically when await is called.
   */
  public async then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    // When await is called, actually execte pending chain.
    return this.execute().then(onfulfilled, onrejected)
  }
}
