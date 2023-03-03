// 22. 12. 13 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")
const alarm = require("../modules/alarm")

// 작가신청 관리
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/", async(req,res) => {
     
    // Reqeust Data
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
                SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, application_photographer_index, stepplaceschema.account.nickname, email, name, approved  
                FROM stepplaceschema.account 
                JOIN stepplaceschema.application_photographer_management 
                ON stepplaceschema.account.account_index = stepplaceschema.application_photographer_management.account_index 
                ORDER BY application_photographer_index DESC 
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
        console.log("GET /application_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 작가신청 관리 - 보기
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/detail",async(req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const application_management_indexValue = req.query.application_photographer_index

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null
    }  

    try {

        if (application_management_indexValue === null || application_management_indexValue === undefined || application_management_indexValue == "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }
        
        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(approved_date, 'YYYY-MM-DD') AS approved_date, stepplaceschema.account.account_index, nickname, email, name, stepplaceschema.application_photographer_management.introduction AS photo_introduction, 
                    approved, birth_date, profile, approved_date, question, active_sns, stepplaceschema.account.introduction, link
                FROM stepplaceschema.account 
                JOIN stepplaceschema.application_photographer_management 
                ON stepplaceschema.account.account_index = stepplaceschema.application_photographer_management.account_index AND stepplaceschema.application_photographer_management.application_photographer_index=$1
            `
            const values = [application_management_indexValue]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows[0]
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /application_management/detail API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 작가신청 관리 - 보기 - 승인
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.put("/", async (req, res) => {
     
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const application_management_indexValue = req.body.application_photographer_index
    const approvedValue = req.body.approved   // 승인, 반려
    const account_indexValue = req.body.account_index 

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {

        if (approvedValue !== "승인" && approvedValue !== "반려") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }
        else if (application_management_indexValue === null || application_management_indexValue === undefined || application_management_indexValue === "" ||
            approvedValue === null || approvedValue === undefined || approvedValue === "" ||
            account_indexValue === null || account_indexValue === undefined || account_indexValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")
            
            db = new Client(pgInit)
            await db.connect()

            // 작가신청 Table에 결과값 입력
            const sql = `
                UPDATE stepplaceschema.application_photographer_management 
                SET approved=$1 
                WHERE application_photographer_index=$2
            `
            const values = [approvedValue, application_management_indexValue]
            await db.query(sql, values)
            
            // 신청 승인
            if (approvedValue === '승인') {
                const account_sql = `
                    UPDATE stepplaceschema.account 
                    SET is_photographer=$1  
                    WHERE account_index=(SELECT account_index FROM stepplaceschema.application_photographer_management WHERE application_photographer_index=$2)
                `
                const account_valuse = [true, application_management_indexValue]
                await db.query(account_sql, account_valuse)

                alarm(0, account_indexValue, 5, 1)   // 알람 생성자의 idx, 알람 수신자의 idx, 알람 타입, 승인 여부
            } 
            
            // 신청 반려
            else if (approvedValue === '반려') {
                alarm(0, account_indexValue, 5, 0)   // 알람 생성자의 idx, 알람 수신자의 idx, 알람 타입, 승인 여부
            }  
            
            result.success = true
        } else  {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /application_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router