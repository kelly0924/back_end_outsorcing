// 22. 12. 13 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")

// 문의 관리 - 1:1 문의
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/", async(req,res) => {
     
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "success": false,
        "data": null,
        "message": null
    }  

    try {

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql= `
                SELECT TO_CHAR(date,'YYYY-MM-DD')AS date, title, contactus_index, contactus_email, is_member, is_answer 
                FROM stepplaceschema.contactus
                ORDER BY contactus_index DESC
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
        console.log("GET /contact_us_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 문의 관리 - 1:1 문의 - 보기
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/detail",async(req,res)=>{
     
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const contactus_indexValue = req.query.contactus_index 

    // Response Data
    const result = {
        "success": false,
        "data": null,
        "message": null
    }  

    try {

        if (contactus_indexValue === null || contactus_indexValue === undefined || contactus_indexValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD')AS date, title, contents, attachment, contactus_email, is_member, is_answer, nickname 
                FROM stepplaceschema.contactus 
                WHERE contactus_index=$1
            `
            const values = [contactus_indexValue]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows[0]
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /contact_us_management/detail API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 문의 관리 - 1:1 문의 - 보기 - 답변
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.put("/check", async (req, res) => {
     
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const contactus_indexValue = req.body.contactus_index 

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {

        if (contactus_indexValue === null || contactus_indexValue === undefined || contactus_indexValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                UPDATE stepplaceschema.contactus 
                SET is_answer=$1 
                WHERE contactus_index=$2
            `
            const values = [true, contactus_indexValue]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /contact_us_management/check API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

//문의 관리 - 1:1 문의 - 삭제
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.delete("/",async(req,res)=>{
     
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const contactusIndex = req.body.contactus_index

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {

        if (contactusIndex === null || contactusIndex === undefined || contactusIndex.length == 0) {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            for (let index = 0; index < contactusIndex.length; index++) {
                const sql= `DELETE FROM stepplaceschema.contactus WHERE contactus_index=$1`
                const values = [contactusIndex[index]]
                await db.query(sql, values)
            }

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /contact_us_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router