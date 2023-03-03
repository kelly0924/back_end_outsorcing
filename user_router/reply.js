// 22. 12. 19 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const moment = require("../modules/moment")
const verify = require("../modules/verify")
const alarm = require("../modules/alarm")

// 답글 쓰기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/", async (req,res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const feed_account_index = req.body.feed_account_index   // 피드 소유자의 account_index
    const feed_indexValue = req.body.feed_index
    const comment_indexValue = req.body.comment_index
    const constentsValue = req.body.contents 
    const dateValue = moment()
   
    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {

        if (comment_indexValue === null || comment_indexValue === undefined || comment_indexValue === "") {
            throw new Error("댓글 번호 값이 올바르지 않습니다.")
        } else if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        } else if (feed_account_index === null || feed_account_index === undefined || feed_account_index === "") {
            throw new Error("작가 번호 값이 올바르지 않습니다.")
        } else if (constentsValue === null || constentsValue === undefined || constentsValue === "") {
            throw new Error("내용 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            // 답글 작성
            const sql = `
                INSERT INTO stepplaceschema.reply(comment_index, account_index, contents, date)
                VALUES($1, $2, $3, $4)
            `
            const values = [comment_indexValue, auth.payload.account_index, constentsValue, dateValue]
            await db.query(sql, values)
        
            // feed table 댓글 수 증가 
            const update_sql = `
                UPDATE stepplaceschema.feed 
                SET comment_cnt=(comment_cnt +1) 
                WHERE feed_index=$1
            `
            const update_values = [feed_indexValue]
            await db.query(update_sql, update_values)

            alarm(auth.payload.account_index, feed_account_index, 2, feed_indexValue)   // 알람 생성자의 idx, 알람 수신자의 idx, 알람 타입, 이동할 곳
            
            result.success = true
        } else {
            throw new Error(auth.message)
        }

    } catch(e) {
        result.message = e.message
        console.log("POST /reply ERR : ", e.message)
    }
                            
    if (db) await db.end()
    res.send(result)
})

// 답글 삭제
// Token 2 : Token 내의 account_index 값을 기준으로 권한 체크
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.delete("/", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const reply_indexValue = req.body.reply_index 
    const feed_indexValue = req.body.feed_index
   
    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {
        if (reply_indexValue === null || reply_indexValue === undefined || reply_indexValue === "") {
            throw new Error("답글 번호 값이 올바르지 않습니다.")
        }
        
        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            // 답글 삭제
            const sql = `
                DELETE FROM stepplaceschema.reply 
                WHERE reply_index=$1 AND account_index=$2
            `
            const values = [reply_indexValue, auth.payload.account_index]
            await db.query(sql, values)

            // feed table 댓글 수 감소
            const update_sql = `
                UPDATE stepplaceschema.feed 
                SET comment_cnt=(comment_cnt - 1) 
                WHERE feed_index=$1
            `
            const update_values = [feed_indexValue]
            await db.query(update_sql, update_values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /reply ERR : ", e.message)
    }
                            
    if (db) await db.end()
    res.send(result)
})

// 답글 신고
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/report_it", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const reply_indexValue = req.body.reply_index
    const account_indexValue = req.body.account_index   // 신고를 당하는 사람의 account_index 
    const contentsValue = req.body.contents
    const dateValue = moment()

    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {
        if (reply_indexValue === null || reply_indexValue === undefined || reply_indexValue === "") {
            throw new Error("답글 번호 값이 올바르지 않습니다.")
        } else if (account_indexValue === null || account_indexValue === undefined || account_indexValue === "") {
            throw new Error("회원 번호 값이 올바르지 않습니다.")
        } else if (contentsValue === null || contentsValue === undefined || contentsValue === "") {
            throw new Error("내용 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()
            
            const sql = `
                INSERT INTO stepplaceschema.report_it(account_index, date, reply_index, is_feed, contents, report_account_index) 
                VALUES($1, $2, $3, $4, $5, $6)
            `
            const values = [account_indexValue, dateValue, reply_indexValue, false, contentsValue, auth.payload.account_index]
            await db.query(sql, values)
            
            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /reply/report_it ERR : ", e.message)
    }
                            
    if (db) await db.end()
    res.send(result)
})

module.exports = router
