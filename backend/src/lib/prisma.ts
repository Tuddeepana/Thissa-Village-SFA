import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const isDev = process.env.NODE_ENV !== 'production';

const prisma =
  global.prisma ||
  new PrismaClient({
    // Log slow queries in development to identify bottlenecks
    log: isDev
      ? [
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
          // Uncomment the next line to see ALL queries during debugging:
          // { emit: 'stdout', level: 'query' },
        ]
      : [{ emit: 'stdout', level: 'error' }],
    // Datasource URL can be overridden to add pool params at runtime.
    // Connection pool size & timeout are controlled via the DATABASE_URL
    // query string: ?connection_limit=15&pool_timeout=30
    // If not set in the URL, Prisma defaults to num_cpus * 2 + 1 connections.
  });

if (isDev) {
  global.prisma = prisma;
}

export default prisma;
