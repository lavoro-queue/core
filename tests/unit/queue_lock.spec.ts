import { Job } from '../../src/queue/contracts/job.js'
import { defineConfig } from '../../src/queue/define_config.js'
import { Queue } from '../../src/queue/queue.js'

import { LockFactory } from '@verrou/core'
import { memoryStore } from '@verrou/core/drivers/memory'
import { describe, expect, test } from 'vitest'

class TestJob extends Job {
  async handle(_payload: { value: number }) {}
}

describe('Queue Lock Service', () => {
  test('should throw error when getting lock provider for non-existent connection', async () => {
    const queueConfig = defineConfig({
      jobs: [TestJob],
      connection: 'main',
      connections: {
        main: {
          driver: 'memory',
          queues: {
            default: {},
          },
        },
      },
    })

    const queue = new Queue(queueConfig)

    expect(() => queue.getLockProvider('non-existent' as any)).toThrow(
      'No lock provider found for connection: non-existent.',
    )
  })

  test('should automatically create lock service for every connection', async () => {
    const queueConfig = defineConfig({
      jobs: [TestJob],
      connection: 'main',
      connections: {
        main: {
          driver: 'memory',
          queues: {
            default: {},
          },
        },
        alternative: {
          driver: 'memory',
          queues: {
            default: {},
          },
        },
      },
    })

    const queue = new Queue(queueConfig)

    expect(() => queue.getLockProvider('main')).not.toThrow()
    expect(() => queue.getLockProvider('alternative')).not.toThrow()
  })

  test('should use explicitly configured lock service for connection', async () => {
    const customLockProvider = new LockFactory(memoryStore().factory())

    const queueConfig = defineConfig({
      jobs: [TestJob],
      connection: 'main',
      connections: {
        main: {
          driver: 'memory',
          queues: {
            default: {},
          },
          lockProvider: customLockProvider,
        },
      },
    })

    const queue = new Queue(queueConfig)

    expect(() => queue.getLockProvider('main')).not.toThrow()

    const lockService = queue.getLockProvider('main')
    expect(lockService).toBe(customLockProvider)
  })
})
