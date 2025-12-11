import { Job } from '../../src/queue/contracts/job.js'
import { memory } from '../../src/queue/drivers/memory.js'
import { defineConfig } from '../../src/queue/define_config.js'
import { Queue } from '../../src/queue/queue.js'

import { describe, expect, test } from 'vitest'

class TestJob extends Job {
  async handle(_payload: { value: number }) {}
}

describe('Queue', () => {
  test('should get default connection when no connection is specified', async () => {
    const config = defineConfig({
      jobs: [TestJob],
      connection: 'main',
      connections: {
        main: {
          driver: memory(),
          queues: {
            default: {},
          },
        },
        alternative: {
          driver: memory(),
          queues: {
            default: {},
          },
        },
      },
    })
    const queue = new Queue(config)

    expect(queue.getDefaultConnection()).toBe('main')

    // Force clear the internal list of drivers
    ;(queue as any).drivers.clear()

    expect(() => queue.getDefaultConnection()).toThrow(
      'No queue drivers available',
    )
  })

  test('throws error when enqueueing to non-existent connection', async () => {
    const config = defineConfig({
      jobs: [TestJob],
      connection: 'main',
      connections: {
        main: {
          driver: memory(),
          queues: { default: { concurrency: 1 } },
        },
      },
    })
    const queue = new Queue(config)

    const job = new TestJob()
    job.options.connection = 'non-existent' as any

    await expect(queue.enqueue(job, { value: 1 })).rejects.toThrow(
      'No driver found for connection: non-existent',
    )
  })
})
