const fs = require('fs');
const path = require('path');

const schema = `// Minimal Schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(STAFF)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  MANAGER
  STAFF
}
`;

const targetPath = path.join(__dirname, 'tmp_full', 'prisma', 'schema.prisma');
fs.writeFileSync(targetPath, schema, 'utf8');
console.log('minimal schema created');
