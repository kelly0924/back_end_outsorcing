<img width="852" alt="스크린샷 2024-09-29 오후 2 33 27" src="https://github.com/user-attachments/assets/f02eb152-6483-4ea1-9eb4-94d8b7a42395">

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
7.	백그라운드 서버 실행 → pm2 node.js에서 백그라운드로 서버 돌리는 모듈
8.	Mongo dB -> 로그 전용 데이터베이스

## 협업 틀

1. 피그마
2. 노션
3. Git

## 기능 수행 내용

**1.	AWS EC2와 Express로 웹 서버를 구축해 AWS 클라우드 서비스를 활용했습니다. IP 주소 고정을 위해 탄력적 IP도 설정했습니다.**

**2.	 ERD를 사용해 데이터베이스를 설계하고, PostgreSQL을 사용했습니다.**

[사용자 ERD]

![사진공유 프로그램_사용자_ERD](https://github.com/kelly0924/back_end_outsorcing/assets/55969676/d2056779-cdbd-4fa9-b0c1-d175414098b3)


[관리자 ERD]

   ![관리자](https://github.com/kelly0924/back_end_outsorcing/assets/55969676/50cd2c56-839f-4127-b836-4b0cebdede1b)





**3.프로젝트의 모든 기능에 대한 API를 작성하고, JWT 토큰을 사용했습니다. 서버에서는 access_token을 발급하고, 프론트엔드가 DB에 접근 요청을 보내면 access_token 검증 과정을 거친 후 접근할 수 있도록 설정했습니다.**

 [이미지]
 
   <img width="649" alt="스크린샷 2023-08-07 오후 5 26 51" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/185145e2-1c9c-4b7b-8722-2bcd8560420d">




**4. 회원가입 시 사용자 인증을 위해 NODEMAILER를 사용해 이메일 인증을 진행했습니다.**

 [이미지]
 
   <img width="446" alt="스크린샷 2023-08-07 오후 5 30 14" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/b413d8a9-63d5-429b-bf60-989ed6d0f353">




**5.	 NodeMulter 모듈을 사용해 이미지 업로드를 진행했습니다. 용량 관리를 위해 이미지는 AWS S3에 저장하고, S3에 저장된 URL을 데이터베이스에 저장하여 데이터베이스의 크기와 성능 문제를 해결하고 이미지를 효율적으로 관리할 수 있도록 했습니다.**

 [사용자 업로드 이미지 전체보기]
 
 <img width="613" alt="스크린샷 2023-08-07 오후 5 31 43" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/77b3f89e-24a2-42d4-9965-166ddfe79997">

 

[사용자 이미지 자세히 보기]

 <img width="497" alt="스크린샷 2023-08-07 오후 5 33 50" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/85055dda-e109-4387-bc79-112630c3ef37">

 

**6. 사진의 대한 댓글과 대댓글 기능을 구현했습니다.**
   
 [이미지]
 
 
   <img width="1057" alt="스크린샷 2023-08-07 오후 5 37 57" src="https://github.com/kelly0924/back_end_outsorcing/assets/55969676/c4ba2d75-c06f-4cfc-ba7a-f97d70002d9a">




