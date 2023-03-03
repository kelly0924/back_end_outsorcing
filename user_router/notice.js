// 22. 12. 16 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")

// 공지사항 목록 불러오기
// Token 2 : Token의 검증만 진행
router.get("/", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const offset = req.query.offset || 0
    const limit = 20
  
    // Response Data
    const result = {
        "success": false,
        "message": null, 
        "top_fixed_data": [],
        "data": [],
    }

    try {

        const auth = verify(publicToken)
    
        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            const fixed_sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, notice_index, is_top_fixed, title  
                FROM stepplaceschema.notice 
                WHERE is_top_fixed IN('true') AND is_delete IN('false') 
                ORDER BY notice_index DESC
            `
            const fixed_row = await db.query(fixed_sql)
            
            const sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, notice_index, is_top_fixed, title 
                FROM stepplaceschema.notice 
                WHERE is_top_fixed IN('false') AND is_delete IN('false') 
                ORDER BY notice_index DESC
                LIMIT $1 OFFSET $2
            `
            const values = [limit, offset * limit]
            const row = await db.query(sql, values)

            if (offset == 0) {
                result.top_fixed_data = fixed_row.rows
            }
            result.data = row.rows
            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /notice ERR : ", e.message)
    }
                        
    if (db) await db.end()
    res.send(result)
})

//공지사항 상세 보기
// Token 2 : Token의 검증만 진행
router.get("/detail", async (req,res) => {

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
            throw new Error("공지사항 번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD')AS date, is_top_fixed, title, contents, attachment 
                FROM stepplaceschema.notice 
                WHERE notice_index=$1
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
        console.log("GET /notice/detail ERR : ", e.message)
    }
                        
    if (db) await db.end()
    res.send(result)
})

module.exports = router