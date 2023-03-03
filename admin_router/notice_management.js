// 22. 12. 13 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const moment = require("../modules/moment")
const verify = require("../modules/verify")
const upload = require("../modules/upload_attach")
const alarm = require("../modules/alarm")

// 시스템관리 - 공지사항 관리 - 생성 - 저장
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.post("/", upload.single("attachment"), async (req, res) => {

    // Reqeust Data
    let db = null
    const publicToken = req.headers.token 
    const is_top_fixedValue = req.body.is_top_fixed 
    const titleValue = req.body.title 
    const contentsValue = req.body.contents 
    const attachmentValue = req.file ? req.file.path : ""   // 필수 입력 값이 아님
    const dateValue = moment()

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {

        if (titleValue === null || titleValue === undefined || titleValue === "" || 
        contentsValue === null || contentsValue === undefined || contentsValue === "" ||
        is_top_fixedValue === null || is_top_fixedValue === undefined || (is_top_fixedValue !== "true" && is_top_fixedValue !== "false")) {   // form data로 보내주기 때문에 Boolean으로 받을 수 없음
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                INSERT INTO stepplaceschema.notice(is_top_fixed, attachment, title, contents, date, is_delete) 
                VALUES($1, $2, $3, $4, $5, $6)
                RETURNING notice_index
            `
            const values = [is_top_fixedValue, attachmentValue, titleValue, contentsValue, dateValue, false]
            const row = await db.query(sql,values)
            const data = row.rows
            
            alarm(null, null, 6, data[0].notice_index)   // 알람 생성자의 idx, 알람 수신자의 idx, 알람 타입, 이동할 곳
            
            result.success = true
            result.message = "성공"
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /notice_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 시스템관리 - 공지사항 관리
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
                SELECT TO_CHAR(date,'YYYY-MM-DD')AS date, notice_index, title, is_top_fixed 
                FROM stepplaceschema.notice 
                WHERE is_top_fixed IN('true') AND is_delete IN('false') 
                ORDER BY notice_index DESC
            `
            const row = await db.query(sql)

            const sql2 = `
                SELECT TO_CHAR(date,'YYYY-MM-DD')AS date, notice_index, title, is_top_fixed 
                FROM stepplaceschema.notice 
                WHERE is_top_fixed IN('false') AND is_delete IN('false')
                ORDER BY notice_index DESC
                LIMIT $1 OFFSET $2
            `
            const values = [limit, offset * limit]
            const row2 = await db.query(sql2, values)

            result.success = true
            result.data = [...row.rows, ...row2.rows]

        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /notice_management API ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

// 시스템관리 - 공지사항 관리 - 보기
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/detail", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const notice_indexValue = req.query.notice_index

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null
    }

    try {
        if (notice_indexValue === null || notice_indexValue === undefined || notice_indexValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }
        
        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT is_top_fixed, title, contents, attachment 
                FROM stepplaceschema.notice 
                WHERE notice_index = $1
            `
            const values = [notice_indexValue]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows[0]
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /notice_management/detail API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 시스템관리 - 공지사항 관리 - 보기 - 수정
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.put("/", async (req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const notice_indexValue = req.body.notice_index 
    const is_top_fixedValue = req.body.is_top_fixed 
    const titleValue = req.body.title 
    const contentsValue = req.body.contents 

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {
        if (notice_indexValue === null || notice_indexValue === undefined || notice_indexValue === "" ||
        titleValue === null || titleValue === undefined || titleValue === "" ||
        contentsValue === null || contentsValue === null || contentsValue === "" ||
        is_top_fixedValue === null || is_top_fixedValue === undefined || (is_top_fixedValue !== true && is_top_fixedValue !== false)) {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                UPDATE stepplaceschema.notice 
                SET is_top_fixed=$1, title=$2, contents=$3
                WHERE notice_index=$4
            `
            const values = [is_top_fixedValue, titleValue, contentsValue, notice_indexValue]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /application_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 시스템관리 - 공지사항 관리 - 삭제
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.put("/delete", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const noticeIndex = req.body.notice_index

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {
        if (noticeIndex === null || noticeIndex === undefined || noticeIndex.length == 0) {
            throw new Error("입력 값이 올바르지 않습니다.")
        }
        
        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            for (let index = 0; index < noticeIndex.length; index++) {
                const sql = `UPDATE stepplaceschema.notice SET is_delete=true WHERE notice_index=$1`
                const values = [noticeIndex[index]]
                await db.query(sql, values)
            }

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /notice_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router