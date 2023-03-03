const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const numberConverter = require("../modules/numberConverter")

// 피드 검색 : 제목, 내용, 해시태그
// Toekn 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/basic/feed", async (req, res) => {

    // Request Data
    let db = null
    const keyword = req.query.keyword
    const offset = req.query.offset || 0
    const limit = 10

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
        "count": 0
    }

    try {

        if (keyword === null || keyword === undefined || keyword === "") {
            result.success = true
            result.data = []
            throw new Error("올바르지 않은 검색어 값 입니다.")
        } 

        db = new Client(pgInit)
        await db.connect()

        // 개수 체크
        const countSql = `
            SELECT COUNT(*)
            FROM stepplaceschema.feed
            WHERE is_open IN('true') AND is_delete IN('false') AND (
                feed_place->0->>'title' ILIKE $1 OR 
                feed_place->0->>'contents' ILIKE $1 OR 
                feed_place->1->>'title' ILIKE $1 OR 
                feed_place->1->>'contents' ILIKE $1 OR 
                feed_place->2->>'title' ILIKE $1 OR
                feed_place->2->>'contents' ILIKE $1 OR
                hash_tag ILIKE $1
            )
        `
        const countValues = ["%" + keyword + "%"]
        const countRow = await db.query(countSql, countValues)
        result.count = countRow.rows[0].count

        // 피드 검색
        const feedSql = `
            SELECT account_index, together, feed_index, feed_place, thanks_cnt, comment_cnt, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3
            FROM stepplaceschema.feed
            WHERE is_open IN('true') AND is_delete IN('false') AND (
                feed_place->0->>'title' ILIKE $1 OR 
                feed_place->0->>'contents' ILIKE $1 OR 
                feed_place->1->>'title' ILIKE $1 OR 
                feed_place->1->>'contents' ILIKE $1 OR 
                feed_place->2->>'title' ILIKE $1 OR
                feed_place->2->>'contents' ILIKE $1 OR
                hash_tag ILIKE $1
            )
            ORDER BY feed_index DESC
            LIMIT $2 OFFSET $3
        `
        const feedValues = ["%" + keyword + "%", limit, offset * limit]
        const feedRow = await db.query(feedSql, feedValues)

        // thanks, comment 숫자 변경
        feedRow.rows.map((value) => {
            value.thanks_cnt = numberConverter(value.thanks_cnt)
            value.comment_cnt = numberConverter(value.comment_cnt)
        })

        result.success = true
        result.data = feedRow.rows
    } catch(e) {
        result.message = e.message
        console.log("GET /search_client/basic ERR : ", e.message)
    }
            
    if (db) await db.end()
    res.send(result)
})

// 계정 검색 : 닉네임, 소개
// Toekn 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/basic/account", async (req, res) => {

    // Request Data
    let db = null
    const keyword = req.query.keyword
    const offset = req.query.offset || 0
    const limit = 10

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
        "count": 0
    }

    try {

        if (keyword === null || keyword === undefined || keyword === "") {
            result.success = true
            result.data = []
            throw new Error("올바르지 않은 검색어 값 입니다.")
        } 

        db = new Client(pgInit)
        await db.connect()

        // 개수 체크
        const countSql = `
            SELECT COUNT(*)
            FROM stepplaceschema.account
            WHERE is_disabled IN('false') AND is_delete IN('false') AND nickname LIKE $1 OR introduction LIKE $1
        `
        const countValues = ["%" + keyword + "%"]
        const countRow = await db.query(countSql, countValues)
        result.count = countRow.rows[0].count

        // 계정 검색
        const accountSql = `
            SELECT account_index, nickname, address, profile, is_photographer, introduction
            FROM stepplaceschema.account
            WHERE is_disabled IN('false') AND is_delete IN('false') AND nickname LIKE $1 OR introduction LIKE $1
            ORDER BY account_index DESC
            LIMIT $2 OFFSET $3
        `
        const accountValues = ["%" + keyword + "%", limit, offset * limit]
        const accountRow = await db.query(accountSql, accountValues)

        result.success = true
        result.data = accountRow.rows
    } catch(e) {
        result.message = e.message
        console.log("GET /search_client/basic ERR : ", e.message)
    }
            
    if (db) await db.end()
    res.send(result)
})

// 심층 검색
// Toekn 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/advanced", async (req, res) => {

    // Request Data
    let db = null
    const keyword = req.query.keyword
    const together = req.query.together
    const duration = req.query.duration
    const sort = req.query.sort
    const location = req.query.location
    const offset = req.query.offset || 0
    const limit = 10

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
        "count": 0
    }

    try {
        if (keyword === null || keyword === undefined || keyword === "") {
            result.success = true
            result.data = []
            throw new Error("올바르지 않은 검색어 값 입니다.")
        } 
        else if (together === null || together === undefined || together === "") {
            throw new Error("올바르지 않은 누구와 함께 값 입니다.")
        } 
        else if (duration === null || duration === undefined || duration === "" || (duration !== "전체" && duration !== "오늘" && duration !== "일주일" && duration !== "한달" && duration !== "1년")) {
            throw new Error("올바르지 않은 기간 값 입니다.")
        } 
        else if (sort === null || sort === undefined || sort === "" || (sort !== "업로드 날짜" && sort !== "조회수" && sort !== "고마워요")) {
            throw new Error("올바르지 않은 정렬 조건 입니다.")
        } 
        else if (location === null || location === undefined || location === "") {
            throw new Error("올바르지 않은 지역 값 입니다.")
        } 

        db = new Client(pgInit)
        await db.connect()

        // 개수 체크
        let countSql = `
            SELECT COUNT(*)
            FROM stepplaceschema.feed
            WHERE is_open IN('true') AND is_delete IN('false') AND (
                feed_place->0->>'title' ILIKE $1 OR 
                feed_place->0->>'contents' ILIKE $1 OR 
                feed_place->1->>'title' ILIKE $1 OR 
                feed_place->1->>'contents' ILIKE $1 OR 
                feed_place->2->>'title' ILIKE $1 OR
                feed_place->2->>'contents' ILIKE $1 OR
                hash_tag LIKE $1
            )
        `

        if (together !== "전체") {
            countSql += ` AND together='${together}'`
        }

        if (location !== "전체") {
            countSql += ` AND place='${location}'`
        }

        switch (duration) {
            case "오늘":
                countSql += " AND date >= current_date"
                break
            case "일주일": 
                countSql += " AND date >= current_date-7"
                break
            case "한달":
                countSql += " AND date >= current_date-30"
                break
            case "1년":
                countSql += " AND date >= current_date-365"
                break
        }

        const countValues = ["%" + keyword + "%"]
        const countRow = await db.query(countSql, countValues)
        result.count = countRow.rows[0].count

        // 피드 검색
        let feedSql = `
            SELECT account_index, together, feed_index, feed_place, thanks_cnt, comment_cnt, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3
            FROM stepplaceschema.feed
            WHERE is_open IN('true') AND is_delete IN('false') AND (
                feed_place->0->>'title' ILIKE $1 OR 
                feed_place->0->>'contents' ILIKE $1 OR 
                feed_place->1->>'title' ILIKE $1 OR 
                feed_place->1->>'contents' ILIKE $1 OR 
                feed_place->2->>'title' ILIKE $1 OR
                feed_place->2->>'contents' ILIKE $1 OR
                hash_tag LIKE $1
            )
        `

        if (together !== "전체") {
            feedSql += ` AND together='${together}'`
        }

        if (location !== "전체") {
            feedSql += ` AND place='${location}'`
        }

        switch (duration) {
            case "오늘":
                feedSql += " AND date >= current_date"
                break
            case "일주일": 
                feedSql += " AND date >= current_date-7"
                break
            case "한달":
                feedSql += " AND date >= current_date-30"
                break
            case "1년":
                feedSql += " AND date >= current_date-365"
                break
        }

        switch (sort) {
            case "업로드 날짜":
                feedSql += " ORDER BY feed_index DESC"
                break
            case "조회수": 
                feedSql += " ORDER BY ARRAY_LENGTH(views, 1) DESC, feed_index DESC"
                break
            case "고마워요":
                feedSql += " ORDER BY thanks_cnt DESC, feed_index DESC"
                break
        }

        feedSql += ` LIMIT $2 OFFSET $3`

        const feedValues = ["%" + keyword + "%", limit, offset * limit]
        const feedRow = await db.query(feedSql, feedValues)

        // thanks, comment 숫자 변경
        feedRow.rows.map((value) => {
            value.thanks_cnt = numberConverter(value.thanks_cnt)
            value.comment_cnt = numberConverter(value.comment_cnt)
        })

        result.success = true
        result.data = feedRow.rows
    } catch(e) {
        result.message = e.message
        console.log("GET /search_client/advanced ERR : ", e.message)
    }
            
    if (db) await db.end()
    res.send(result)
})

module.exports = router