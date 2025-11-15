# 데이터베이스 설정 가이드

## Docker를 사용하는 경우 (추천)

1. Docker Desktop 설치 확인
2. admin 폴더에서 다음 명령 실행:
   ```bash
   docker-compose up -d
   ```

3. 데이터베이스 마이그레이션 및 시드:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. Docker 컨테이너 중지:
   ```bash
   docker-compose down
   ```

## PostgreSQL 직접 설치하는 경우

1. PostgreSQL 다운로드 및 설치:
   https://www.postgresql.org/download/windows/

2. psql 연결:
   ```bash
   psql -U postgres
   ```

3. 데이터베이스 생성:
   ```sql
   CREATE DATABASE logical_math;
   \q
   ```

4. `.env` 파일에서 DATABASE_URL 설정:
   ```
   DATABASE_URL="postgresql://postgres:<your-password>@localhost:5432/logical_math?schema=public"
   ```

5. 데이터베이스 마이그레이션 및 시드:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

## 포트 확인

PostgreSQL 서버 포트 확인:
```sql
SHOW port;
```

설정 파일 위치 확인:
```sql
SHOW config_file;
```

데이터베이스 목록 확인:
```sql
\l
```

## 연결 문제 해결

1. PostgreSQL 서비스가 실행 중인지 확인
2. 방화벽 설정 확인
3. `.env` 파일의 DATABASE_URL이 올바른지 확인
4. 포트 5432가 다른 프로세스에서 사용 중이지 않은지 확인

