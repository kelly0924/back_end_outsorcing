// 22. 12. 14 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const moment = require("../modules/moment")
const verify = require("../modules/verify")
const upload = require("../modules/upload_profile")

// 회원관리 - 일반회원 목록
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/", async (req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null
    }  
   
    try {

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, account_index, name, email, nickname, is_photographer 
                FROM stepplaceschema.account 
                WHERE is_photographer IN('false') AND is_delete IN('false') 
                ORDER BY account_index DESC
                LIMIT $1 OFFSET $2
                `
            const values = [limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /member_list API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 회원관리 - 작가회원 목록
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/photo", async (req, res) => {
    
    // Request Data
    let db = null
    const publicToken=req.headers.token
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null
    }  
   
    try {

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, account_index, name, email, nickname, is_photographer 
                FROM stepplaceschema.account 
                WHERE is_photographer IN('true') AND is_delete IN('false') 
                ORDER BY account_index DESC
                LIMIT $1 OFFSET $2
            `
            const values = [limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /member_list/photo API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 회원관리 - 일반회원 목록 - 회원생성
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.post("/", upload.single('profile'), async(req, res) => {

    // Reqeust Data
    let db = null
    const publicToken = req.headers.token
    const nameValue = req.body.name 
    const birthDate = req.body.birth_date
    const emailValue = req.body.email
    const nicknameValue = req.body.nickname 
    const passwordValue = req.body.password
    const introduction = req.body.introduction   // 필수 입력값 아님
    const linkAddress = req.body.link_address   // 필수 입력값 아님
    const profileValue = req.file ? req.file.path : null   // 필수 입력값 아님
    const isPhotographer = req.body.is_photographer
    const joinDate = moment()

    // Response Data
    const result = {
        "success": false,
        "message": null
    } 

    try {

        if (nameValue === null || nameValue  === undefined || nameValue === "" || nameValue.length < 2 || nameValue.length > 5) {
            throw new Error("이름 값이 올바르지 않습니다.")
        } else if(birthDate === null || birthDate === undefined || birthDate === "" || birthDate.length != 10) {
            throw new Error("생년월일 값이 올바르지 않습니다.")
        } else if(emailValue === null || emailValue === undefined || emailValue === "") {
            throw new Error("이메일 값이 올바르지 않습니다")
        } else if(nicknameValue === null || nicknameValue === undefined || nicknameValue === "" || nicknameValue.length < 2 || nicknameValue.length > 13) {
            throw new Error("닉네임 값이 올바르지 않습니다.")
        } else if(passwordValue === null || passwordValue === undefined || passwordValue === "" || passwordValue.length < 8) {
            throw new Error("비밀번호 값이 올바르지 않습니다.")
        } else if (isPhotographer === null || isPhotographer === undefined || isPhotographer === "" || (isPhotographer !== "true" && isPhotographer !== "false")) {   // form data로 보내주기 때문에 Boolean으로 받을 수 없음
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                INSERT INTO stepplaceschema.account (nickname, address, name, birth_date, email, password, is_photographer, date, following_cnt, follow_cnt, feed_cnt, is_disabled, nickname_edit_date, profile, introduction, link)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `
            const values = [nicknameValue, nicknameValue, nameValue, birthDate, emailValue, passwordValue, isPhotographer, joinDate, 0, 0, 0, false, joinDate, profileValue, introduction, linkAddress]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /member_list API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 회원관리 - 일반회원 목록 - 보기
// 회원관리 - 작가회원 목록 - 보기 
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/detail", async(req, res)=>{
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const account_indexValue = req.query.account_index

    // Response Data
    const result = {
        "success": false,
        "data": null,
        "message": null
    }  

    try {

        if (account_indexValue === undefined || account_indexValue === null || account_indexValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }
            
        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT account_index, link, email, password, name, birth_date, nickname, is_photographer, introduction, date, profile 
                FROM stepplaceschema.account 
                WHERE account_index=$1
            `
            const values = [account_indexValue]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows[0]
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /member_list/detail API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 회원관리 - 일반회원 목록 - 회원삭제
// 회원관리 - 작가회원 목록 - 회원삭제
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.delete("/", async(req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const accountIndex = req.body.account_index

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {

        if (accountIndex === undefined || accountIndex === null || accountIndex.length == 0) {
            throw new Error("입력 값이 올바르지 않습니다.")
        }
        
        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            for (let index = 0; index < accountIndex.length; index++) {
                const sql = `
                    UPDATE stepplaceschema.account 
                    SET nickname='delete', email='delete', link='delete', address='delete', is_delete=true
                    WHERE account_index=$1
                `
                const values = [accountIndex[index]]
                await db.query(sql, values)
            }

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /comment_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router