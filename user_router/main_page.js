const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const numberConverter = require("../modules/numberConverter")

// 전체 피드 목록 불러오기
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/", async (req, res) => {

    // Request Data
    // 로그인 전에 불러오는 데이터이므로 token을 받지 않음
    let db = null
    const offset = req.query.offset || 0
    const limit = 10

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
    }

    try {
        
        db = new Client(pgInit)
        await db.connect()
        const sql = `
            SELECT stepplaceschema.feed.account_index, together, feed_index, feed_place, thanks_cnt, comment_cnt, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3
            FROM stepplaceschema.feed 
            JOIN stepplaceschema.account
            ON stepplaceschema.account.account_index = stepplaceschema.feed.account_index
            WHERE is_open IN('true') AND stepplaceschema.feed.is_delete IN('false') AND stepplaceschema.account.is_delete IN('false') AND is_disabled IN('false')
            ORDER BY feed_index DESC
            LIMIT $1 OFFSET $2
        `
        const values = [limit, offset * limit]
        const row = await db.query(sql, values)

        result.success = true
        result.data = row.rows

        // thanks, comment 숫자 변경
        result.data.map((value) => {
            value.thanks_cnt = numberConverter(value.thanks_cnt)
            value.comment_cnt = numberConverter(value.comment_cnt)
        })
    } catch(e) {
        result.message = e.message
        console.log("GET /main_page ERR : ", e.message)
    }
            
    if (db) await db.end()
    res.send(result)
})

module.exports = router