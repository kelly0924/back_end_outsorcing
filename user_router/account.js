// 22. 12. 19 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")
const jwt = require("jsonwebtoken")
const fs = require("fs")

const pgInit = require("../modules/psql")
const moment = require("../modules/moment")
const verify = require("../modules/verify")
const upload = require("../modules/upload_profile")
const numberConverter = require("../modules/numberConverter")

const jwtSecretKey = process.env.JWT_SECRET_KEY

// 로그인
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.post("/login", async (req, res) => {

    // Request Data
    let db = null
    const emailValue = req.body.email
    const passwordValue = req.body.password
    
    // Response Data
    const result = {
        "success": false,
        "message": null,
        "token": null,
        "data": null
    }

    try {
        if (emailValue === null || emailValue === undefined || emailValue === "") {
            throw new Error("이메일 값이 올바르지 않습니다.")
        } else if(passwordValue === null || passwordValue === undefined || passwordValue === "") {
            throw new Error("비밀번호 값이 올바르지 않습니다.")
        } else {

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT account_index, is_delete 
                FROM stepplaceschema.account 
                WHERE email=$1 and password=$2
            `
            const values = [emailValue, passwordValue]
        
            const row = await db.query(sql,values)
            const temp = row.rows

            if (temp.length == 0) {
                throw new Error("계정 정보가 올바르지 않습니다.")
            } else {
                if (row.rows[0].is_delete) {
                    throw new Error("탈퇴한 회원입니다.")
                }else{
                    const jwtToken=jwt.sign(
                        {
                            "account_index": row.rows[0].account_index,
                            "email": emailValue,
                            "role": "client"
                        },
                        jwtSecretKey,
                        {
                            "issuer": "kelly",
                            "expiresIn": "24h"
                        }
                    )
                    result.success = true
                    result.token = jwtToken
                    result.data = row.rows[0]
                }
            }
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /account/login API ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

// 회원가입
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.post("/", async (req, res) => {
    
    // Request Data
    let db = null
    const nameValue = req.body.name 
    const birthDate = req.body.birth_date
    const emailValue = req.body.email
    const passwordValue = req.body.password
    const nicknameValue = req.body.nickname
    const joinDate = moment()

    // Response Data
    const result = {
        "success": false,
        "message": null
    } 

    // Rules
    const passwordRule = /^[\da-zA-Z!@#$%^&*(){}\[\]\.,;:`~]{8,}$/

    try {
        if (!passwordRule.test(passwordValue)){
            throw new Error("비밀번호 양식이 올바르지 않습니다.")
        } else if (nameValue === null || nameValue  === undefined || nameValue === "" || nameValue.length < 2 || nameValue.length > 6) {
            throw new Error("이름 값이 올바르지 않습니다.")
        } else if(birthDate === null || birthDate === undefined || birthDate === "" || birthDate.length != 10) {
            throw new Error("생년월일 값이 올바르지 않습니다.")
        } else if(emailValue === null || emailValue === undefined || emailValue === "") {
            throw new Error("이메일 값이 올바르지 않습니다.")
        } else if(nicknameValue === null || nicknameValue === undefined || nicknameValue === "" || nicknameValue.length < 2 || nicknameValue.length > 13) {
            throw new Error("닉네임 값이 올바르지 않습니다.")
        } else if(passwordValue === null || passwordValue === undefined || passwordValue === "" || passwordValue.length < 8) {
            throw new Error("비밀번호 값이 올바르지 않습니다.")
        } else {
            
            db = new Client(pgInit)
            await db.connect()

            const duplicateSql = "SELECT email FROM stepplaceschema.account WHERE email=$1"
            const duplicateValues = [emailValue]
            const row = await db.query(duplicateSql, duplicateValues)

            if (row.rows.length > 0) {
                throw new Error("중복된 이메일 입니다.")
            } else {

                const sql = `
                    INSERT INTO stepplaceschema.account(nickname, address, name, birth_date, email, password, is_photographer, is_disabled, date) 
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                `
                const values = [nicknameValue, nicknameValue, nameValue, birthDate, emailValue, passwordValue, false, false, joinDate]
                await db.query(sql,values)
            }
            
            result.success = true
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /account API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 닉네임 중복 체크
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.post("/duplicate", async (req,res) => {

    // Request Data
    let db = null
    const nicknameValue = req.body.nickname

    const result = {
        "success": false,
        "message": null
    }

    try {
        if (nicknameValue === null || nicknameValue === undefined || nicknameValue === "" || nicknameValue.length < 2 || nicknameValue.length > 13) {
            throw new Error("닉네임 값이 올바르지 않습니다.")
        } else {

            db = new Client(pgInit)
            await db.connect()
            const sql = "SELECT nickname FROM stepplaceschema.account WHERE nickname=$1"
            const values = [nicknameValue]
            const row = await db.query(sql,values)
          
            if (row.rows.length === 0) {
                result.success = true
            } else {
                throw new Error("이미 존재하는 닉네임 입니다.")
            }
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /account/duplicate ERR : ", e.message)
    }
        
    if (db) await db.end()
    res.send(result)
})

// 내 프로필 정보 불러오기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.get("/", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token

    // Response Data
    const result = {
        "success": false,
        "data": null,
        "message": null
    }

    try {

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT account_index, name, profile, nickname, address, is_photographer, is_disabled, introduction, link, follow_cnt, following_cnt, feed_cnt
                FROM stepplaceschema.account 
                WHERE stepplaceschema.account.account_index=$1
            `
            const values = [auth.payload.account_index]
            const row = await db.query(sql, values)
            
            result.success = true
            result.data = row.rows[0]

            // following, follow 숫자 변경
            result.data.feed_cnt = numberConverter(result.data.feed_cnt)
            result.data.follow_cnt = numberConverter(result.data.follow_cnt)
            result.data.following_cnt = numberConverter(result.data.following_cnt)
            
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /account ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 프로필 이미지 수정
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.put("/profile", upload.single("profile"), async (req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const profileValue = req.file ? req.file.path : ""

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {

        const auth = verify(publicToken)

        console.log(auth)

        if (verify(auth.success)) {
            db = new Client(pgInit)
            await db.connect()

            const image_sql = `
                SELECT profile
                FROM stepplaceschema.account
                WHERE account_index=$1
            `
            const image_values = [auth.payload.account_index]
            const image_result = await db.query(image_sql, image_values)

            if (image_result.rows[0].profile)
                fs.unlinkSync(image_result.rows[0].profile)

            const sql = `
                UPDATE stepplaceschema.account 
                SET profile=$1 
                WHERE account_index=$2
            `
            const values = [profileValue, auth.payload.account_index]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /account/profile ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 닉네임 수정 
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.put("/nickname", async (req, res) => {
    
    // Request
    let db = null
    const publicToken = req.headers.token
    const nicknameValue = req.body.nickname 

    // Response
    const result = {
        "success": false,
        "message": null
    }  

    try {
        
        if (nicknameValue === undefined || nicknameValue === null || nicknameValue === "" || nicknameValue.length < 2 || nicknameValue.length > 13 ) {
            throw new Error("닉네임 값이 올바르지 않습니다")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            // 30일 시간 제한 체크
            const time_sql = `
                SELECT EXTRACT (
                    DAY from now()-(SELECT nickname_edit_date FROM stepplaceschema.account WHERE account_index=$1)
                ) AS difference
            `
            const time_values = [auth.payload.account_index]
            const timeData = await db.query(time_sql, time_values)

            if(timeData.rows[0].difference != null && timeData.rows[0].difference <= 30) {
                throw new Error("닉네임 변경은 1개월에 한 번만 가능합니다.")
            }

            // 중복 체크
            const duplicate_sql = `
                SELECT nickname 
                FROM stepplaceschema.account 
                WHERE nickname=$1
            `
            const duplicate_values = [nicknameValue]
            const duplicateData = await db.query(duplicate_sql, duplicate_values)

            if (duplicateData.rows.length > 0) {
                throw new Error("이미 존재하는 닉네임 입니다.")
            }

            // 닉네임 수정
            const sql = `
                UPDATE stepplaceschema.account 
                SET nickname=$2, nickname_edit_date=$3 
                WHERE account_index=$1
            `
            const values = [auth.payload.account_index, nicknameValue, moment()]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /account/nickname ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 자기 소개 수정
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.put("/introduction", async (req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const introductionValue = req.body.introduction

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {
        if (introductionValue === null || introductionValue === undefined || introductionValue.length > 100) {
            throw new Error("자기소개 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (verify(publicToken)) {
            db = new Client(pgInit)
            await db.connect()
            const sql = `
                UPDATE stepplaceschema.account 
                SET introduction = $2 
                WHERE account_index=$1
            `
            const values=[auth.payload.account_index, introductionValue]
            await db.query(sql,values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /account/introduction ERR : ", e.message)
    }
        
    if (db) await db.end()
    res.send(result)
})

// 링크 수정
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.put("/link_address", async (req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const link_addressValue = req.body.link_address 

    // Response Data    
    const result = {
        "success": false,
        "message": null
    }  

    try {

        if (link_addressValue === null || link_addressValue === undefined) {
            throw new Error("링크 값이 올바르지 않습니다.")
        } 

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            const sql = `
                UPDATE stepplaceschema.account 
                SET link = $2 
                WHERE account_index=$1
            `
            const values = [auth.payload.account_index, link_addressValue]
            await db.query(sql,values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /account/link_address ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 작가 신청
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/application_photographer", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const introductionValue = req.body.introduction
    const questionVaule = req.body.question 
    const active_snsValue = req.body.active_sns 
    const applicationDate = moment()

    // Response Data
    const result = {
        "success": false,
        "message": null
    } 

    try {
        if (introductionValue === null || introductionValue === undefined || introductionValue === "") {
            throw new Error("필수 입력 값을 채워주세요.")
        } else if (questionVaule === null || questionVaule === undefined || questionVaule === "") {
            throw new Error("필수 입력 값을 채워주세요.")
        } else if (active_snsValue === null) {
            throw new Error("입력 값이 올바르지 않습니다.")
        } 

        const auth = verify(publicToken)

        if (auth.payload.account_index) {

            db = new Client(pgInit)
            await db.connect()

            const select_sql = `
                SELECT * 
                FROM stepplaceschema.application_photographer_management 
                WHERE account_index=$1 ORDER BY application_photographer_index DESC
            `
            const select_values = [auth.payload.account_index]
            const application = await db.query(select_sql, select_values)

            if (application.rows.length === 0 || application.rows[0].approved === "반려") {
                const sql = `
                    INSERT INTO stepplaceschema.application_photographer_management(account_index, introduction, question, active_sns, application_date, approved) 
                    VALUES($1, $2, $3, $4, $5, $6)
                `
                const values = [auth.payload.account_index, introductionValue, questionVaule, active_snsValue, applicationDate, '대기']
                await db.query(sql, values)

                result.success = true
            } else {
                throw new Error("승인 대기 중입니다.")
            }
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /account/application_photographer ERR : ", e.message)
    }
        
    if (db) await db.end()
    res.send(result)
})

module.exports = router