import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// prisma generate는 실제 DB 연결이 필요 없으므로 더미 URL 사용
const databaseUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/dummy?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
