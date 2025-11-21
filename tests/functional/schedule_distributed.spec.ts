import { getDistributedLockKey } from '../../src/schedule/pending_schedule.js'
import { Schedule } from '../../src/schedule/schedule.js'

import { Verrou } from '@verrou/core'
import { memoryStore } from '@verrou/core/drivers/memory'
import { beforeEach, describe, expect, test } from 'vitest'

const prepareLock = async (name: string) => {
  const verrou = Schedule.getVerrou()
  const lock = verrou.createLock(getDistributedLockKey(name), '10s')
  return lock
}

describe('Schedule - Distributed Locking', () => {
  beforeEach(() => {
    Schedule.clear()
  })

  test('should be able to use custom Verrou instance', async () => {
    const customVerrou = new Verrou({
      default: 'custom',
      stores: {
        custom: { driver: memoryStore() },
      },
    })

    Schedule.setVerrou(customVerrou)
    expect(Schedule.getVerrou()).toBe(customVerrou)
  })

  test('should skip execution if lock is already held', async () => {
    const taskName = 'lock-test'
    let executionCount = 0

    const lock = await prepareLock(taskName)
    const acquired = await lock.acquire()

    expect(acquired).toBe(true)

    await Schedule.call(taskName, async () => {
      executionCount++
    }).cron('* * * * * *')

    await new Promise((resolve) => setTimeout(resolve, 1000))

    expect(executionCount).toBe(0)

    await lock.release()

    Schedule.clear(taskName)

    await Schedule.call(taskName, async () => {
      executionCount++
    }).cron('* * * * * *')

    await new Promise((resolve) => setTimeout(resolve, 1000))

    expect(executionCount).toBeGreaterThanOrEqual(1)
  })

  //   test('should release lock after execution', async () => {
  //     let executionCount = 0

  //     await Schedule.call('release-test', async () => {
  //       executionCount++
  //     }).cron('* * * * * *')

  //     await new Promise((resolve) => setTimeout(resolve, 2500))
  //     expect(executionCount).toBeGreaterThanOrEqual(2)
  //   })

  //   test('should release lock even on error', async () => {
  //     let executionCount = 0

  //     await Schedule.call('error-test', async () => {
  //       executionCount++
  //       if (executionCount === 1) {
  //         throw new Error('Test error')
  //       }
  //     }).cron('* * * * * *')

  //     await new Promise((resolve) => setTimeout(resolve, 2500))
  //     expect(executionCount).toBeGreaterThanOrEqual(2)
  //   })
})
