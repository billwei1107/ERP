const fs = require('fs');
const path = require('path');

const schema = `// Incremental Schema 1
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = "postgresql://postgres:postgres@postgres:5432/erp_db"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(STAFF)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  attendances Attendance[]
}

enum Role {
  ADMIN
  MANAGER
  STAFF
}

model Attendance {
  id        Int            @id @default(autoincrement())
  userId    Int
  type      AttendanceType
  time      DateTime       @default(now())
  date      DateTime       @db.Date
  
  user      User           @relation(fields: [userId], references: [id])
}

enum AttendanceType {
  CLOCK_IN
  CLOCK_OUT
}
`;

const targetPath = path.join(__dirname, 'prisma', 'schema.prisma');
fs.writeFileSync(targetPath, schema, 'utf8');
console.log('incremental schema 1 created');
