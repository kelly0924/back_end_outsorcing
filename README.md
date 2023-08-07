
# 사진 공유 프로그램_ 외주

## 프로젝트 설명

2022년 11월 부터 2023년 2월까지 진행 된 인스타그램과 유사한 사진 공유 플랫폼 프로그램입니다. 프로그램은 작가와 구독자가 존재하며, 구독한 작가의 피드를 볼 수 있는 서비스 입니다. 일반 구독자는 작사 신청을 통해서 작가가 될 수 있습니다.

## 스킬 및 사용 언어

1.	postgreSQL → npm pg 패키지
2.	ubuntu 20.04 → AWS에서 t2.medium 구매 후 작업환경으로 사용 
3.	express -> express를 사용한 웹서버 구축
4.	node.js → npm 을 이용한 패키지 관리
5.	JWT → jsonwebtoken 사용자 인증을 위한 인증 방법
6.	node-multer →  node.js 에서 사용하는 이미지 업로드 모듈
7.	서버를 background 실행 → pm2 node.js에서 백그라운드로 서버 돌리는 모듈
8.	Mongo dB -> 빠른 오류 수정 및 기록을 위한 로고 기록 위한 데이터베이스

## 협업 틀

1. 피그마
2. 노션
3. Git

## 프로젝트 담당 기능 및 사용 기술

1.	AWS EC2 와 Express로 웹서버 구축
2.	database 설계 및PostreSQL를 사용한 Database 구축
3.	API 작성 및 JWT 인증
4.	NodeMulter로 이미지 upload
5.	Nodemailer 사용하여 사용자 email 인증 
6.	API 개발.

## 기능 수행 내용

1.	AWS EC2 와 Express로 웹서버 구축을 통해 Amazon Web Services (AWS) 아마존 제공하는 클라우드 서비스를 사용할 수 있었습니다.  프로젝트의 효율을 높이고 인스턴스의 내용이 수정되더라도 아이피를 고정시키기 위한 탄력적 아이피에 대한 설정도 진행 하였습니다. 

2.	 ERD를 사용한database 설계를 진행 하였고 PostgreSQL 사용하여 실제로 databases  구축 하였습니다. 

**[사용자 ERD]**
	![사진공유 프로그램_사용자_ERD](https://github.com/kelly0924/back_end_outsorcing/assets/55969676/d2056779-cdbd-4fa9-b0c1-d175414098b3)


**[관리자 ERD]**
	![관리자](https://github.com/kelly0924/back_end_outsorcing/assets/55969676/50cd2c56-839f-4127-b836-4b0cebdede1b)




3.	프로젝트의 모든 기능에 대한 API 작성 및 JWT token을 사용하였습니다. 서버에선 access_token을 발급하여 프론트 엔드가 DB에 접근 요청을 보내면 access token verify 과정을 거치고 난 후 접근 할 수 있도록 하였습니다.

 **[이미지]**
    <img width="649" alt="스크린샷 2023-08-07 오후 5 26 51" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/185145e2-1c9c-4b7b-8722-2bcd8560420d">


4. 회원가입시 사용자 인증을 위해 NODEMAILER를 사용하였습니다. 사용자는 회원가입을 하기위해 이메일 인증을 진행 하여야 합니다.
   

 **[이미지]**
     <img width="446" alt="스크린샷 2023-08-07 오후 5 30 14" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/b413d8a9-63d5-429b-bf60-989ed6d0f353">


5.	 프로젝트에 가장 중요한 부분인 이미지 업로드와 이미지 데이터 관리 입니다.  NodeMulter모듈을 사용하여 이미지 upload 진행 하였습니다. 데이터 관리를 위해 이미지 자체는 AWS S3에 저장 후 S3에 저장된 URL를 Databases에 저장 하여 데이터베이스의 크기와 성능 문제를 해결하고 이미지를 효율적으로 관리할 수있도록 하였습니다.

 **[이미지]**
     <img width="613" alt="스크린샷 2023-08-07 오후 5 31 43" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/77b3f89e-24a2-42d4-9965-166ddfe79997">
     <img width="497" alt="스크린샷 2023-08-07 오후 5 33 50" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/85055dda-e109-4387-bc79-112630c3ef37">

6. 사진의 대한 댓글과 대댓글 및 그외 다른 기능 구현 이미지 입니다.
   
 **[이미지]**
   <img width="1057" alt="스크린샷 2023-08-07 오후 5 37 57" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/c4ba2d75-c06f-4cfc-ba7a-f97d70002d9a">




