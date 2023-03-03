// 22. 12. 19 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const moment = require("../modules/moment")
const verify = require("../modules/verify")
const alarm = require("../modules/alarm")

// 댓글 쓰기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const feed_indexValue = req.body.feed_index 
    const feed_account_indexValue = req.body.feed_account_index   // 피드 소유자의 account_index
    const constentsValue = req.body.contents 
    const isSecretValue = req.body.is_secret 
    const dateValue = moment()

    // Response Data
    const result = {
        "success": false,
        "message": null
    }
        
    try {
        if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        } else if (constentsValue === null || constentsValue === undefined || constentsValue === "") {
            throw new Error("내용 값이 올바르지 않습니다.")
        } else if (isSecretValue === null || isSecretValue === undefined || isSecretValue === "" || typeof isSecretValue !== "boolean") {
            throw new Error("비밀댓글 여부 값이 올바르지 않습니다.")
        } else {

        const auth = verify(publicToken)

            if (auth.success) {
                db = new Client(pgInit)
                await db.connect()

                // 댓글 작성
                const sql = `
                    INSERT INTO stepplaceschema.comment(feed_index, account_index, contents, date, is_secret) 
                    VALUES($1, $2, $3, $4, $5)
                `
                const values = [feed_indexValue, auth.payload.account_index, constentsValue, dateValue, isSecretValue]
                await db.query(sql, values)

                // feed table 댓글 수 증가 
                const update_sql = `
                    UPDATE stepplaceschema.feed 
                    SET comment_cnt=(comment_cnt +1) 
                    WHERE feed_index=$1
                `
                const update_values = [feed_indexValue]
                await db.query(update_sql, update_values)
                
                alarm(auth.payload.account_index, feed_account_indexValue, 1, feed_indexValue)   // 알람 생성자의 idx, 알람 수신자의 idx, 알람 타입, 이동할 곳

                result.success = true
            } else {
                throw new Error(auth.message)
            }
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /comment ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

// 댓글 불러오기
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/", async (req,res) => {

    // Request Data
    let db = null
    const account_indexValue = req.query.account_index
    const feed_indexValue = req.query.feed_index 

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "comment_data": [],
        "reply_data": []
    }

    try {
        if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        }

        db = new Client(pgInit)
        await db.connect()

        // 댓글 불러오기
        const comment_sql = `
            SELECT TO_CHAR(stepplaceschema.comment.date,'YYYY-MM-DD')AS date, comment_index, stepplaceschema.comment.contents, is_secret, stepplaceschema.comment.account_index, 
                profile, nickname, is_photographer,
                stepplaceschema.feed.account_index AS feed_account_index
            FROM stepplaceschema.comment  
            JOIN stepplaceschema.account 
            ON stepplaceschema.comment.account_index = stepplaceschema.account.account_index 
            JOIN stepplaceschema.feed
            ON stepplaceschema.comment.feed_index = stepplaceschema.feed.feed_index
            WHERE stepplaceschema.comment.feed_index=$1 
            ORDER BY comment_index DESC
        `
        const comment_values = [feed_indexValue]
        const comment_row = await db.query(comment_sql, comment_values)
        result.comment_data = comment_row.rows

        // 댓글 정제 ( is_secret, is_show )
        result.comment_data = comment_row.rows.map((value) => {
            if (value.is_secret) {
                if (String(value.account_index) === account_indexValue || String(value.feed_account_index) === account_indexValue) {
                    value.is_show = true
                } else {
                    value = {
                        "is_secret": true,
                        "is_show": false
                    }
                }
            }

            return value
        })

        // 답글 불러오기
        const reply_sql = `
            SELECT TO_CHAR(stepplaceschema.reply.date,'YYYY-MM-DD')AS date, reply_index, stepplaceschema.reply.comment_index, stepplaceschema.reply.account_index, profile, nickname, is_photographer, stepplaceschema.reply.contents 
            FROM stepplaceschema.reply 
            JOIN stepplaceschema.account 
            ON stepplaceschema.reply.account_index = stepplaceschema.account.account_index 
            WHERE comment_index IN (select comment_index from stepplaceschema.comment where feed_index=$1) 
            ORDER BY reply_index DESC
        `
        const reply_values = [feed_indexValue]
        const reply_row = await db.query(reply_sql, reply_values)

        result.success = true
        result.reply_data = reply_row.rows
    } catch(e) {
        result.message = e.message
        console.log("GET /comment ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

// 댓글 삭제
// Token 2 : Token 내의 account_index 값을 기준으로 권한 체크
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.delete("/", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const comment_indexValue = req.body.comment_index 
    const feed_indexValue = req.body.feed_index
   
    const result={
        "success": false,
        "message": null
    }

    try {
        if (comment_indexValue === null || comment_indexValue === undefined || comment_indexValue === "") {
            throw new Error("댓글 번호 값이 올바르지 않습니다.")
        } else if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            // 대댓글 수 체크
            const count_sql = `
                SELECT COUNT(*) AS comment_count
                FROM stepplaceschema.reply 
                WHERE comment_index=$1
            `
            const count_values = [comment_indexValue]
            const count_result = await db.query(count_sql, count_values)

            // 댓글 삭제
            const sql = `
                DELETE FROM stepplaceschema.comment
                WHERE comment_index=$1 AND account_index=$2
            `
            const values = [comment_indexValue, auth.payload.account_index]
            await db.query(sql, values)

            // feed table 댓글 수 감소
            const update_sql = `
                UPDATE stepplaceschema.feed 
                SET comment_cnt=(comment_cnt - $2) 
                WHERE feed_index=$1
            `
            const update_values = [feed_indexValue, parseInt(count_result.rows[0].comment_count) + 1]
            await db.query(update_sql, update_values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /comment ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

// 댓글 신고
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/report_it", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const feed_indexValue = req.body.feed_index
    const comment_indexValue = req.body.comment_index
    const report_acccount_indexValue = req.body.report_account_index   // 신고를 하는 사람의 account_index 
    const contentsValue = req.body.contents
    const dateValue = moment()

    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {
        if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("댓글 번호 값이 올바르지 않습니다.")
        } else if (comment_indexValue === null || comment_indexValue === undefined || comment_indexValue === "") {
            throw new Error("댓글 번호 값이 올바르지 않습니다.")
        } else if (report_acccount_indexValue === null || report_acccount_indexValue === undefined || report_acccount_indexValue === "") {
            throw new Error("신고 회원 번호 값이 올바르지 않습니다.")
        } else if (contentsValue === null || contentsValue === undefined || contentsValue === "") {
            throw new Error("내용 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()
            const sql = `
                INSERT INTO stepplaceschema.report_it(account_index, date, feed_index, comment_index, is_feed, contents, report_account_index) 
                VALUES($1, $2, $3, $4, $5, $6, $7)
            `
            const values = [auth.payload.account_index, dateValue, feed_indexValue, comment_indexValue, false, contentsValue, report_acccount_indexValue]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /comment/report_it ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router
