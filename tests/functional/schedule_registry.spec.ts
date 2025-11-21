import { ScheduleRegistry } from '../../src/schedule/schedule_registry.js'

import { Cron } from 'croner'
import { beforeEach, describe, expect, test } from 'vitest'

describe('ScheduleRegistry', () => {
  beforeEach(() => {
    ScheduleRegistry.clear()
  })

  test('should be able to run a cron job', async () => {
    let callCount = 0
    const expectedCallCount = 3

    ScheduleRegistry.add(
      'test-task',
      new Cron('* * * * * *', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        callCount++
      }),
    )

    while (callCount < expectedCallCount) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    expect(callCount).toBe(expectedCallCount)
  })
})
