import { Job } from '../../src/queue/contracts/job.js'
import { Schedule } from '../../src/schedule/schedule.js'
import { TestContext, logger } from '../helpers/test_context.js'

import { parse } from '@lukeed/ms'
import { describe, expect, test } from 'vitest'

let jobRuns = 0

const PG_BOSS_POLLING = 2000

class TestJob extends Job {
  public async handle(payload: { arg1: string; arg2: number }): Promise<void> {
    logger.info({ payload }, 'Running test job...')
    await new Promise((resolve) => setTimeout(resolve, 1))
    logger.info('Test job completed.')
    jobRuns++
  }
}

class LongRunningJob extends Job {
  public static duration = 8000 // should be higher than pg-boss polling interval

  public async handle(_payload: unknown): Promise<void> {
    logger.info('Running long running job...')
    await new Promise((resolve) => setTimeout(resolve, LongRunningJob.duration))
    logger.info('Long running job completed.')
    jobRuns++
  }
}

describe(
  'Job schedule (PostgreSQL)',
  {
    timeout: parse('1 minute'),
  },
  () => {
    const ctx = new TestContext()

    ctx.setup([TestJob, LongRunningJob], 'postgres', {
      worker: true,
    })

    test('should be able to schedule a job', async () => {
      jobRuns = 0

      await Schedule.job(TestJob, {
        arg1: 'hello',
        arg2: 1,
      })
        .onConnection('main')
        .onQueue('default')
        .every('second')

      while (jobRuns < 2) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      expect(jobRuns).toBe(2)
    })

    test('should not overlap by default', async () => {
      jobRuns = 0

      await Schedule.job(LongRunningJob, {}).every('second')

      const expectedJobRuns = 3

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          expectedJobRuns * (PG_BOSS_POLLING + LongRunningJob.duration),
        ),
      )

      Schedule.clear()

      await new Promise((resolve) =>
        setTimeout(resolve, PG_BOSS_POLLING + LongRunningJob.duration),
      )

      expect(jobRuns).toBe(expectedJobRuns)

      const stats = await ctx.getPgBossStats('main', 'default', LongRunningJob)

      expect(stats.totalCount).toBe(expectedJobRuns)
    })

    test('should overlap if explicitly allowed', async () => {
      jobRuns = 0

      await Schedule.job(LongRunningJob, {})
        .onQueue('high-throughput') // queue that processes many jobs in parallel
        .every('second')
        .overlapping()

      const expectedJobRuns = Math.ceil(LongRunningJob.duration / 1000)

      await new Promise((resolve) =>
        setTimeout(resolve, LongRunningJob.duration),
      )

      Schedule.clear()

      await new Promise((resolve) =>
        setTimeout(resolve, PG_BOSS_POLLING + LongRunningJob.duration),
      )

      expect(jobRuns).toBe(expectedJobRuns)

      const stats = await ctx.getPgBossStats(
        'main',
        'high-throughput',
        LongRunningJob,
      )

      expect(stats.totalCount).toBe(jobRuns)
    })
  },
)
