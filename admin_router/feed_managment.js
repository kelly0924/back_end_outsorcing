// 22. 12. 14 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")

// 컨텐츠관리 - 전체 게시물 관리
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
        "data": []
    }

    try {

        const auth = verify(publicToken)
        
        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")
            
            db = new Client(pgInit)
            await db.connect()
            
            const sql = ` 
                SELECT TO_CHAR(stepplaceschema.feed.date,'YYYY-MM-DD') AS date, views, feed_place, name, feed_index  
                FROM stepplaceschema.feed 
                JOIN stepplaceschema.account  
                ON stepplaceschema.feed.account_index = stepplaceschema.account.account_index 
                WHERE stepplaceschema.feed.is_delete IN('false')
                ORDER BY feed_index DESC
                LIMIT $1 OFFSET $2
            `
            const values = [limit, offset * limit]
            const row = await db.query(sql, values)

            // 데이터 정제
            for (let index = 0; index < row.rows.length; index++) {

                let temp = {
                    "title": [],
                    "name": null,
                    "date": null,
                    "views": null,
                    "feed_index": null
                }
                temp.feed_index = row.rows[index].feed_index
                temp.name = row.rows[index].name
                temp.views = row.rows[index].views.length
                temp.date = row.rows[index].date 
                
                for (let i = 0; i < row.rows[index].feed_place.length; i++) {
                    temp.title.push(row.rows[index].feed_place[i].title)
                }
                result.data.push(temp)
            }

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /feed_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 컨텐츠관리 - 전체 게시물 관리 - 보기
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/detail", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const feed_indexValue = req.query.feed_index 

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null
    }
        
    try {

        if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(stepplaceschema.feed.date,'YYYY-MM-DD')AS date, ARRAY_LENGTH(views,1) AS views, thanks_cnt, nickname, is_photographer, profile, place, together, feed_place, stepplaceschema.feed.account_index, comment_cnt, hash_tag, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3
                FROM stepplaceschema.account 
                JOIN stepplaceschema.feed 
                ON stepplaceschema.feed.account_index = stepplaceschema.account.account_index AND feed_index=$1
                WHERE stepplaceschema.feed.is_delete IN('false')
            `
            const values = [feed_indexValue]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows[0]
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /feed_management/detail API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 컨텐츠 관리 - 전체 게시물 관리 - 게시물 삭제
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.delete("/", async(req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const feedIndex = req.body.feed_index

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  
    
    try {

        if (feedIndex === null || feedIndex === undefined || feedIndex.length == 0) {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            for (let index = 0; index < feedIndex.length; index++) {
                const sql = `UPDATE stepplaceschema.feed SET is_delete=true WHERE feed_index=$1`
                const values = [feedIndex[index]]
                await db.query(sql,values)
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


