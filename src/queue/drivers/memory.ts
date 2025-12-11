import {
  QueueDriver,
  QueueDriverConfig,
  QueueName,
} from '../contracts/queue_driver.js'
import { ConfiguredDriver, QueueConfig, WorkerOptions } from '../types.js'

import { LockFactory } from '@verrou/core'
import { memoryStore } from '@verrou/core/drivers/memory'

export class MemoryQueueDriver extends QueueDriver {
  constructor(
    queueConfig: QueueConfig,
    options: Record<QueueName, WorkerOptions>,
    config: QueueDriverConfig = {},
  ) {
    super(queueConfig, options, config)
  }

  public createLockProvider() {
    return new LockFactory(memoryStore().factory())
  }
}

/**
 * In-memory queue driver with no persistence
 * and distributed locking capabilities.
 */
export function memory(
  config?: QueueDriverConfig,
): ConfiguredDriver<MemoryQueueDriver, QueueDriverConfig> {
  return {
    constructor: MemoryQueueDriver,
    config: config,
  }
}
