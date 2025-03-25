
## 목차
1. [실행 방법](#실행-방법)  
   1-1. [환경 변수](#환경-변수)  
   1-2. [프로젝트 실행하기](#프로젝트-실행하기)  
2. [Swagger 주소](#swagger-주소)
3. [기능 구현 목록](#기능-구현-목록)

<br>

## 실행 방법
### 환경 변수
- 아래 항목들이 `.env` 파일에 반드시 존재해야 합니다:
  - `DATABASE_URL`: AWS RDS(MySQL)를 통한 데이터베이스 연결 주소

  - `JWT_ACCESS_SECRET`: JWT 액세스 토큰 시크릿 키

  - `PORT`: 서버가 실행될 로컬호스트 포트 번호

<br>

---


### 프로젝트 실행하기
### 1️⃣ 프로젝트 클론
```bash
$ git clone https://github.com/Kim-Hyunhee/lunch.git
```

### 2️⃣ 의존성 설치
```bash
$ npm install
```

### 3️⃣ 환경 변수 설정 (.env 파일 생성)
```bash
$ touch .env
$ nano .env  # 또는 vim .env
```
⚠️ [.env](#환경-변수) 파일이 없으면 서버가 정상적으로 실행되지 않습니다.<br>

**Prisma와 데이터베이스 동기화**
```bash
$ npx prisma db push
```
✅ 이 명령어는 Prisma와 MySQL을 동기화하며, 기존 마이그레이션 파일 없이도 작동합니다.<br>

### 4️⃣ 서버 실행 (개발 모드)
```bash
$ npm run start:dev
```

### 5️⃣ 서버 실행 (프로덕션 모드)
```bash
$ npm run build
$ npm run start:prod
```

---

## swagger 주소
https://lunch-74b8.onrender.com/api

---

## 기능 구현 목록
### **1️⃣ 회원가입 & 인증 (Auth - C)**
- **회원가입** - 유저네임과 비밀번호, 이름, 휴대폰번호, 회사 명을 통해 회원 가입
- **로그인** - 로그인 성공 시 JWT 액세스 토큰 발급
<br>

### **2️⃣ 회원 별 상품 판매 정책 설정 (ProductPrice - C)**
- **상품 금액 C** - 회원 별 상품 판매 금액 정책 생성 및 업데이트 처리
<br>


### **3️⃣ 상품 목록 및 가격 조회 (Product - R)**
- **상품 목록 및 가격 조회 R** - 상품 목록 및 가격 조회  
<br>


### **4️⃣ 주문 관리 (Order - CR)**
- **주문 CR** - 주문 등록, 조회   
<br>

