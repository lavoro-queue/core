import { Job, Payload } from '../queue/contracts/job.js'
import { QueueNameForConnection } from '../queue/contracts/queue_driver.js'
import { PendingDispatch } from '../queue/pending_dispatch.js'
import { DefaultConnection, QueueConnectionName } from '../queue/types.js'
import { PendingSchedule } from './pending_schedule.js'

import type { LockFactory } from '@verrou/core'

export class PendingJobSchedule<
  T extends Job,
  P extends Payload<T>,
  C extends QueueConnectionName = DefaultConnection extends { name: infer N }
    ? N extends QueueConnectionName
      ? N
      : QueueConnectionName
    : QueueConnectionName,
> extends PendingSchedule {
  /**
   * Use composition pattern and store pending
   * job dispatch inside a pending schedule.
   */
  protected dispatch: PendingDispatch<T, P, C>

  constructor(
    protected job: T,
    protected payload: P,
    protected lockProviderResolver: () => LockFactory,
  ) {
    super(
      job.id,
      async () => {
        await this.dispatch.then(undefined, (error) => {
          throw error
        })
      },
      lockProviderResolver,
    )
    this.job = job
    this.payload = payload
    this.dispatch = new PendingDispatch(job, payload)
  }

  public onConnection<NewC extends QueueConnectionName>(
    connection: NewC,
  ): PendingJobSchedule<T, P, NewC> {
    this.dispatch.onConnection(connection)
    // TypeScript can't track type parameter changes through `this`.
    // The instance is the same, but the type parameter C changes to NewC,
    // so we need to assert the type to the new type.
    return this as unknown as PendingJobSchedule<T, P, NewC>
  }

  public onQueue(queue: QueueNameForConnection<C>): this {
    this.dispatch.onQueue(queue)

    return this
  }

  // public withQueueServiceResolver(queueServiceResolver: () => Promise<Queue>) {
  //   this.dispatch.withQueueServiceResolver(queueServiceResolver)
  //   return this
  // }

  protected async execute(): Promise<void> {
    // Before executing, update the lock service resolver to use the one from the queue connection
    const queueServiceResolver = this.job.getQueueServiceResolver
    if (queueServiceResolver) {
      const queue = await queueServiceResolver()

      // Get the connection the job will use
      const connection =
        this.job.options.connection ?? queue.getDefaultConnection()

      // Override the lock service resolver to use the connection's lock service
      const connectionLockService = queue.getLockProvider(connection)

      if (connectionLockService) {
        this.lockProviderResolver = () => connectionLockService
      }

      // Register this scheduled job with the queue service
      if (this.job.id) {
        queue.registerScheduledJob(this.job.id)
      }
    }

    await super.execute()
  }
}
