const { PrismaClient } = require('@prisma/client');

// Ensure BigInt can be serialized to JSON automatically across the entire app
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

let prisma;

if (process.env.NODE_ENV === 'test') {
  // During tests, mock can be injected or a test instance can be used
  prisma = new PrismaClient({
    log: ['error']
  });
} else {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });
}

module.exports = prisma;
