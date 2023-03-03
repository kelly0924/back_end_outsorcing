// 22. 12. 13 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")

// 컨텐츠 관리 - 댓글 관리
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/", async(req, res) => {
    
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
   
    try{
        
        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql= `
                SELECT TO_CHAR(stepplaceschema.comment.date,'YYYY-MM-DD')AS date, comment_index, name, is_photographer, contents
                FROM stepplaceschema.account 
                JOIN stepplaceschema.comment 
                ON stepplaceschema.account.account_index = stepplaceschema.comment.account_index 
                ORDER BY stepplaceschema.comment.comment_index DESC
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
        console.log("GET /comment_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 컨텐츠 관리 - 댓글 관리 - 댓글 삭제
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.delete("/", async(req,res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const commentIndex = req.body.comment_index

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {

        if (commentIndex === null || commentIndex === undefined || commentIndex.length == 0) {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            for (let index = 0; index < commentIndex.length; index++) {
                const sql = `
                    DELETE FROM stepplaceschema.comment WHERE comment_index=$1
                `
                const values = [commentIndex[index]]
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