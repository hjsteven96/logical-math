# Vercel 배포 가이드

## 데이터베이스 설정 옵션

Vercel에 배포할 때 PostgreSQL 데이터베이스를 설정하는 방법은 여러 가지가 있습니다.

### 옵션 1: Vercel Postgres (추천)

Vercel에서 제공하는 관리형 PostgreSQL 서비스입니다.

#### 설정 방법:

1. **Vercel 대시보드에서 Postgres 추가**
   - Vercel 프로젝트 페이지 → Storage 탭
   - "Create Database" → "Postgres" 선택
   - 데이터베이스 생성

2. **환경 변수 자동 설정**
   - Vercel Postgres를 생성하면 `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` 환경 변수가 자동으로 설정됩니다.
   - Prisma는 `POSTGRES_PRISMA_URL`을 사용합니다.

3. **Prisma 스키마 업데이트 (필요한 경우)**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("POSTGRES_PRISMA_URL") // 또는 DATABASE_URL
   }
   ```

4. **마이그레이션 실행**
   - Vercel 대시보드 → Settings → Environment Variables에서 `DATABASE_URL`을 `POSTGRES_PRISMA_URL`로 설정하거나
   - 로컬에서 마이그레이션 실행:
     ```bash
     DATABASE_URL="your-vercel-postgres-url" npx prisma migrate deploy
     ```

### 옵션 2: Neon (서버리스 PostgreSQL)

Neon은 서버리스 PostgreSQL 서비스로, 무료 티어를 제공합니다.

#### 설정 방법:

1. **Neon 계정 생성 및 데이터베이스 생성**
   - https://neon.tech 접속
   - 계정 생성 후 새 프로젝트 생성
   - Connection String 복사

2. **Vercel 환경 변수 설정**
   - Vercel 프로젝트 → Settings → Environment Variables
   - `DATABASE_URL` 추가:
     ```
     DATABASE_URL=postgresql://user:password@host/database?sslmode=require
     ```

3. **마이그레이션 실행**
   ```bash
   # 로컬에서 실행
   DATABASE_URL="your-neon-url" npx prisma migrate deploy
   ```

### 옵션 3: Supabase

Supabase는 PostgreSQL 기반의 백엔드 서비스입니다.

#### 설정 방법:

1. **Supabase 프로젝트 생성**
   - https://supabase.com 접속
   - 새 프로젝트 생성
   - Settings → Database → Connection String 복사

2. **Vercel 환경 변수 설정**
   - `DATABASE_URL` 환경 변수에 Supabase 연결 문자열 추가
   - Connection Pooling URL 사용 권장 (Transaction 모드)

3. **마이그레이션 실행**
   ```bash
   DATABASE_URL="your-supabase-url" npx prisma migrate deploy
   ```

## Vercel 배포 설정

### 1. 빌드 설정

`package.json`에 이미 설정되어 있습니다:
- `postinstall`: Prisma 클라이언트 자동 생성
- `build`: Prisma 생성 후 Next.js 빌드

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

**필수:**
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `NEXTAUTH_SECRET`: NextAuth 세션 암호화 키 (랜덤 문자열 생성)
- `NEXTAUTH_URL`: 배포된 사이트 URL (예: `https://your-app.vercel.app`)

**선택사항:**
- `NODE_ENV`: `production`

### 3. 마이그레이션 실행

배포 후 데이터베이스 마이그레이션을 실행해야 합니다:

**방법 1: Vercel CLI 사용**
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

**방법 2: Vercel Build Command에 추가**
`vercel.json` 파일 생성:
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

**방법 3: 수동 실행**
로컬에서 환경 변수를 설정하고 마이그레이션 실행:
```bash
export DATABASE_URL="your-database-url"
npx prisma migrate deploy
```

### 4. 시드 데이터 (선택사항)

초기 데이터가 필요한 경우:
```bash
DATABASE_URL="your-database-url" npm run db:seed
```

## 연결 풀링 (Connection Pooling)

서버리스 환경에서는 연결 풀링이 중요합니다.

### Prisma Accelerate 사용 (권장)

1. Prisma Accelerate 설정:
   ```bash
   npx prisma accelerate
   ```

2. 환경 변수에 `PRISMA_ACCELERATE_URL` 추가

3. Prisma 클라이언트에서 Accelerate 사용

### 또는 PgBouncer 사용

일부 데이터베이스 제공업체(Neon, Supabase)는 자체 연결 풀링을 제공합니다.
- Transaction 모드 URL 사용
- 또는 Session 모드 URL 사용

## 문제 해결

### 빌드 실패: Prisma Client not found
- `postinstall` 스크립트가 실행되는지 확인
- Vercel 빌드 로그 확인

### 데이터베이스 연결 실패
- `DATABASE_URL` 환경 변수가 올바른지 확인
- SSL 모드 확인 (`?sslmode=require`)
- 방화벽/IP 허용 목록 확인

### 마이그레이션 실패
- 로컬에서 먼저 테스트:
  ```bash
  DATABASE_URL="your-url" npx prisma migrate deploy
  ```
- Vercel 빌드 로그에서 에러 확인

## 참고 자료

- [Vercel Postgres 문서](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Neon 문서](https://neon.tech/docs)
- [Supabase 문서](https://supabase.com/docs)

