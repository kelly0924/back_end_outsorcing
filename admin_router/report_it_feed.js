// 22. 12. 13 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")

// 컨텐츠관리 - 신고 관리
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
    }

    try { 

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(stepplaceschema.report_it.date, 'YYYY-MM-DD') AS date, stepplaceschema.report_it.feed_index, report_it_index, name, is_feed, feed_place 
                FROM stepplaceschema.report_it 
                JOIN stepplaceschema.account 
                ON stepplaceschema.account.account_index = stepplaceschema.report_it.account_index 
                JOIN stepplaceschema.feed 
                ON stepplaceschema.feed.feed_index = stepplaceschema.report_it.feed_index AND stepplaceschema.feed.is_delete IN('false') 
                ORDER BY report_it_index DESC
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
        console.log("POST /report_it_feed API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 컨텐츠관리 - 신고 관리 - 게시글 상세 보기
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/detail", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const report_it_indexValue = req.query.report_it_index

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
    }

    try {

        if (report_it_indexValue === null || report_it_indexValue === undefined || report_it_indexValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(stepplaceschema.feed.date,'YYYY-MM-DD')AS date, nickname, is_photographer, profile, place, together, feed_place, stepplaceschema.feed.account_index, TO_CHAR(visit_date,'YYYY-MM-DD') AS visit_date, hash_tag, image1, image2, image3
                FROM stepplaceschema.account 
                JOIN stepplaceschema.report_it 
                ON stepplaceschema.report_it.account_index = stepplaceschema.account.account_index 
                JOIN stepplaceschema.feed 
                ON stepplaceschema.feed.feed_index = stepplaceschema.report_it.feed_index AND report_it_index=$1
            `
            const values = [report_it_indexValue]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows[0]
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /report_it_feed/detail API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 컨텐츠관리 - 신고 관리 - 댓글 상세 보기
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/comment", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const report_it_indexValue = req.query.report_it_index

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
        "report_account": null
    }

    try {

        if (report_it_indexValue === null || report_it_indexValue === undefined || report_it_indexValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        } 

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const report_sql = `
                SELECT TO_CHAR(stepplaceschema.report_it.date,'YYYY-MM-DD') AS date, name, email, nickname, report_it_index 
                FROM stepplaceschema.account 
                JOIN stepplaceschema.report_it
                ON stepplaceschema.report_it.report_account_index = stepplaceschema.account.account_index AND report_it_index=$1  
            `
            const report_value = [report_it_indexValue]
            const report = await db.query(report_sql, report_value)
            result.report_account = report.rows[0]

            const sql = `
                SELECT TO_CHAR(stepplaceschema.comment.date,'YYYY-MM-DD') AS date, name, stepplaceschema.report_it.contents, report_it_index
                FROM stepplaceschema.report_it 
                JOIN stepplaceschema.account
                ON stepplaceschema.report_it.account_index = stepplaceschema.account.account_index
                JOIN stepplaceschema.comment 
                ON stepplaceschema.comment.comment_index = stepplaceschema.report_it.comment_index AND report_it_index=$1
            `
            const values = [report_it_indexValue]
            const row = await db.query(sql, values)
            result.data = row.rows[0]

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /report_it_feed/comment API ERR : ", e.message)
    }
 
    if (db) await db.end()
    res.send(result)
})

// 컨텐츠관리 - 신고 관리 - 삭제
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.delete("/", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const reportItIndex = req.body.report_it_index

    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {
        if (reportItIndex === null || reportItIndex === undefined || reportItIndex.length == 0) {
            throw new Error("입력 값이 올바르지 않습니다.")
        } 

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")


            db = new Client(pgInit)
            await db.connect()
            
            for (let index = 0; index < reportItIndex.length; index++) {
                const sql = `DELETE FROM stepplaceschema.report_it WHERE report_it_index=$1`
                const values = [reportItIndex[index]]
                await db.query(sql, values)
            }

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /report_it_feed API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router


