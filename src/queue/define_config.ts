import type { QueueConfig, QueueConnectionsList } from './types.js'

import { RuntimeException } from '@poppinss/utils'

type QueueConfigWithConnections<Connections, Connection> = QueueConfig & {
  connection: Connection
  connections: Connections
}

/**
 * Define config for queue service
 */
export function defineConfig<
  const Connections extends QueueConnectionsList,
  const Connection extends keyof Connections = keyof Connections,
>(
  config: QueueConfigWithConnections<Connections, Connection>,
): QueueConfigWithConnections<Connections, Connection> {
  // Validate required fields
  if (!config.connection) {
    throw new RuntimeException(
      'Missing "connection" property in queue config file',
    )
  }

  if (!config.connections) {
    throw new RuntimeException(
      'Missing "connections" property in queue config file',
    )
  }

  // Validate default connection exists
  if (!config.connections[config.connection as string]) {
    throw new RuntimeException(
      `Missing "connections.${String(config.connection)}". It is referenced by the "connection" property`,
    )
  }

  // Validate each connection has queues
  Object.keys(config.connections).forEach((connectionName) => {
    const connection =
      config.connections[connectionName as keyof typeof config.connections]
    if (!connection.queues || Object.keys(connection.queues).length === 0) {
      throw new RuntimeException(
        `Connection "${connectionName}" must have at least one queue defined`,
      )
    }
  })

  return config
}
