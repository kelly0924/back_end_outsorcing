// 22. 12. 19 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")
const alarm = require("../modules/alarm")
const numberConverter = require("../modules/numberConverter")

// 고마워요 추가
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/thanks", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const feed_indexValue = req.body.feed_index
    const feed_account_indexValue = req.body.feed_account_index   // 피드 작성자의 account_index

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {
        if (feed_account_indexValue === null || feed_account_indexValue === undefined || feed_account_indexValue === "") {
            throw new Error("회원 번호 값이 올바르지 않습니다.")
        } else if(feed_indexValue === null || feed_indexValue === null || feed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()
            const thanks_sql = `
                SELECT account_index 
                FROM stepplaceschema.thanks 
                WHERE thanks_feed_index=$1 AND account_index=$2
            `
            const thanks_valuse = [feed_indexValue, auth.payload.account_index]
            const thanks_account = await db.query(thanks_sql, thanks_valuse)

            if (thanks_account.rows.length === 0){
                const sql = `
                    INSERT INTO stepplaceschema.thanks(thanks_feed_index, account_index) 
                    VALUES($1, $2)
                `
                const values = [feed_indexValue, auth.payload.account_index]
                await db.query(sql,values)

                alarm(auth.payload.account_index, feed_account_indexValue, 3, feed_indexValue)   // 알람 생성자의 idx, 알람 수신자의 idx, 알람 타입, 이동할 곳

                // 고마워요 숫자 증가
                const update_sql = `
                    UPDATE stepplaceschema.feed
                    SET thanks_cnt=(thanks_cnt+1) 
                    WHERE feed_index=$1
                `
                const update_values = [feed_indexValue]
                await db.query(update_sql, update_values)
            } 
            
            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /thanks ERR : ", e.message)
    }
                    
    if (db) await db.end()
    res.send(result)
})

// 고마워요 목록 불러오기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.get("/thanks", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const offset = req.query.offset || 0
    const limit = 10

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
                SELECT stepplaceschema.feed.account_index, together, feed_index, feed_place, thanks_cnt, comment_cnt, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3 
                FROM stepplaceschema.feed
                JOIN stepplaceschema.account 
                ON stepplaceschema.account.account_index = stepplaceschema.feed.account_index 
                WHERE feed_index IN(
                    SELECT thanks_feed_index 
                    FROM stepplaceschema.thanks
                    WHERE account_index=$1
                ) AND is_open IN('true') AND stepplaceschema.feed.is_delete IN('false')
                ORDER BY feed_index DESC
                LIMIT $2 OFFSET $3
            `
            const values = [auth.payload.account_index, limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows

            // thanks, comment 숫자 변경
            result.data.map((value) => {
                value.thanks_cnt = numberConverter(value.thanks_cnt)
                value.comment_cnt = numberConverter(value.comment_cnt)
            })

        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /thanks ERR : ", e.message)
    }
                    
    if (db) await db.end()
    res.send(result)
})

// 고마워요 취소
// Token 2 : Token 내의 account_index 값을 기준으로 권한 체크
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.delete("/thanks", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const thanksFeed_indexValue = req.body.thanks_feed_index 

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {
        if (thanksFeed_indexValue === null || thanksFeed_indexValue === undefined || thanksFeed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit) 
            await db.connect()

            const sql = `
                DELETE FROM stepplaceschema.thanks 
                WHERE thanks_feed_index=$1 AND account_index=$2
            `
            const values = [thanksFeed_indexValue, auth.payload.account_index]
            await db.query(sql,values)

            // 고마워요 숫자 감소
            const update_sql = `
                UPDATE stepplaceschema.feed
                SET thanks_cnt=(thanks_cnt-1) 
                WHERE feed_index=$1
            `
            const update_values = [thanksFeed_indexValue]
            await db.query(update_sql, update_values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /thanks ERR : ", e.message)
    }
                    
    if (db) await db.end()
    res.send(result)
})

// 스크랩 추가
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/scrap", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const feed_indexValue = req.body.feed_index

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {
        if (feed_indexValue === null || feed_indexValue === null || feed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            
            db = new Client(pgInit)
            await db.connect()
            const scrap_sql = `
                SELECT account_index 
                FROM stepplaceschema.scrap 
                WHERE scrap_feed_index=$1 AND account_index=$2
            `
            const scrap_valuse = [feed_indexValue, auth.payload.account_index]
            const scrap_account = await db.query(scrap_sql, scrap_valuse)

            if (scrap_account.rows.length === 0) {

                const sql = `
                    INSERT INTO stepplaceschema.scrap(scrap_feed_index, account_index) 
                    VALUES($1, $2)
                `
                const values = [feed_indexValue, auth.payload.account_index]
                await db.query(sql,values)
            }
            
            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /scrap ERR : ", e.message)
    }
                    
    if (db) await db.end()
    res.send(result)
})

// 스크랩 목록 불러오기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.get("/scrap", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const offset = req.query.offset || 0
    const limit = 10

    // Response Data
    const result={
        "success": false,
        "message":null,
        "data": null
    }

    try {
            
        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT stepplaceschema.feed.account_index, together, feed_index, feed_place, thanks_cnt, comment_cnt, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3 
                FROM stepplaceschema.feed
                JOIN stepplaceschema.account 
                ON stepplaceschema.account.account_index = stepplaceschema.feed.account_index 
                WHERE feed_index IN(
                    SELECT scrap_feed_index 
                    FROM stepplaceschema.scrap 
                    WHERE account_index=$1
                ) AND is_open IN('true') AND stepplaceschema.feed.is_delete IN('false')
                ORDER BY feed_index DESC
                LIMIT $2 OFFSET $3
            `
            const values = [auth.payload.account_index, limit, offset * limit]
            const row = await db.query(sql, values)
            
            result.success = true
            result.data = row.rows

            // thanks, comment 숫자 변경
            result.data.map((value) => {
                value.thanks_cnt = numberConverter(value.thanks_cnt)
                value.comment_cnt = numberConverter(value.comment_cnt)
            })
            
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /scrap ERR : ", e.message)
    }
                    
    if (db) await db.end()
    res.send(result)
})

// 스크랩 취소 
// Token 2 : Token 내의 account_index 값을 기준으로 권한 체크
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.delete("/scrap", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const scrapFeed_indexValue = req.body.scrap_feed_index   // 스크랩 번호

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {
        if (scrapFeed_indexValue === null || scrapFeed_indexValue === undefined || scrapFeed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            const sql = `
                DELETE FROM stepplaceschema.scrap 
                WHERE scrap_feed_index=$1 AND account_index=$2
            `
            const values = [scrapFeed_indexValue, auth.payload.account_index]
            await db.query(sql,values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /scrap ERR : ", e.message)
    }
                    
    if (db) await db.end()
    res.send(result)
})

// 댓글 목록 불러오기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.get("/comment_list", async (req,res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const offset = req.query.offset || 0
    const limit = 20

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null
    }

    try {

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT comment_index, contents, TO_CHAR(stepplaceschema.comment.date, 'YYYY-MM-DD') AS date, stepplaceschema.comment.feed_index, stepplaceschema.feed.account_index, feed_place, image1, profile
                FROM stepplaceschema.comment
                JOIN stepplaceschema.feed
                ON stepplaceschema.comment.feed_index = stepplaceschema.feed.feed_index
                JOIN stepplaceschema.account
                ON stepplaceschema.comment.account_index = stepplaceschema.account.account_index
                WHERE stepplaceschema.comment.account_index=$1 AND stepplaceschema.feed.is_open IN('true') AND stepplaceschema.feed.is_delete IN('false')
                ORDER BY comment_index DESC
                LIMIT $2 OFFSET $3
            `
            const values=[auth.payload.account_index, limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /comment_list ERR : ", e.message)
    }
                    
    if (db) await db.end()
    res.send(result)
})

module.exports = router