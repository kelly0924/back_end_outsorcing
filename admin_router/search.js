// 22. 12. 13 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")

// 회원관리 - 일반회원 목록 검색
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/account", async(req, res) => {
     
    // Reqeust Data
    let db = null
    const publicToken = req.headers.token
    const searchValue = req.query.search 
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
    }  

    try {

        if (searchValue === null || searchValue === undefined || searchValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, account_index, name, email, nickname, is_photographer 
                FROM stepplaceschema.account 
                WHERE is_photographer IN('false') AND is_delete IN('false') AND (name LIKE $1 OR nickname LIKE $2)
                ORDER BY account_index DESC
                LIMIT $3 OFFSET $4
            `
            const values = ["%" + searchValue + "%", "%" + searchValue + "%", limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /search/account API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 회원관리 - 작가회원 목록 검색
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/photo", async (req, res) => {
     
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const searchValue = req.query.search 
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "data": null,
        "message": null,
        "success": false
    }  

    try {

        if (searchValue === null || searchValue === undefined || searchValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)
        
        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")
            
            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, account_index, name, email, nickname, is_photographer 
                FROM stepplaceschema.account 
                WHERE  is_photographer IN('true') AND is_delete IN('false') AND (name LIKE $1 or nickname LIKE $2)
                ORDER BY account_index DESC
                LIMIT $3 OFFSET $4
            `
            const values = ["%" + searchValue + "%", "%" + searchValue + "%", limit, offset * limit]
            const row = await db.query(sql, values)
            
            result.success = true
            result.data = row.rows
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /search/photo API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 회원관리 - 작가신청 관리 검색
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/application_management", async(req, res) => {
     
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const searchValue = req.query.search 
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "data": null,
        "message": null,
        "success": false
    }  

    try {

        if (searchValue === null || searchValue === undefined || searchValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, application_photographer_index, stepplaceschema.account.nickname, email, name, approved  
                FROM stepplaceschema.account 
                JOIN stepplaceschema.application_photographer_management 
                ON stepplaceschema.account.account_index = stepplaceschema.application_photographer_management.account_index 
                WHERE name LIKE $1 or nickname LIKE $2 
                ORDER BY application_photographer_index DESC
                LIMIT $3 OFFSET $4
            `
            const values = ["%" + searchValue + "%", "%" + searchValue + "%", limit, offset * limit]
            const row = await db.query(sql, values)
            
            result.success = true
            result.data = row.rows  
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /search/application_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 컨텐츠관리 - 전체 게시물 관리 검색
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/feed", async(req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const searchValue = req.query.search    
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "success": false,
        "data": [],
        "message": null
    }

    try {

        if (searchValue === null || searchValue === undefined || searchValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }
        
        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            // todo : column이 json 타입이 아니어서 검색할 수 없음
            // 우선은 사용자 검색으로만 진행

            const sql = ` 
                SELECT TO_CHAR(stepplaceschema.feed.date,'YYYY-MM-DD') AS date, views, feed_place, name, feed_index  
                FROM stepplaceschema.feed 
                JOIN stepplaceschema.account  
                ON stepplaceschema.feed.account_index = stepplaceschema.account.account_index
                WHERE stepplaceschema.feed.is_delete IN('false') AND (
                    name LIKE $1 OR
                    feed_place->0->>'title' ILIKE $1 OR 
                    feed_place->1->>'title' ILIKE $1 OR 
                    feed_place->2->>'title' ILIKE $1
                )
                ORDER BY feed_index DESC
                LIMIT $2 OFFSET $3
            `
            const values = ["%" + searchValue + "%", limit, offset * limit]
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
        console.log("GET /search/feed API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 컨텐츠관리 - 댓글 관리 검색
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/comment", async(req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const searchValue = req.query.search
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "success": false,
        "data": null,
        "message": null
    }  
        
    try {

        if (searchValue === null || searchValue === undefined || searchValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(stepplaceschema.comment.date,'YYYY-MM-DD')AS date, comment_index, name, is_photographer, contents
                FROM stepplaceschema.account 
                JOIN stepplaceschema.comment 
                ON stepplaceschema.account.account_index = stepplaceschema.comment.account_index  
                WHERE contents LIKE $1 or name LIKE $2 
                ORDER BY comment_index DESC
                LIMIT $3 OFFSET $4
            `
            const values = ["%" + searchValue + "%", "%" + searchValue + "%", limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /search/comment API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 컨텐츠관리 - 신고 관리 검색
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/report_it", async(req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const searchValue = req.query.search  
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "success": false,
        "data": null,
        "message": null
    }

    try { 

        if (searchValue === null || searchValue === undefined || searchValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

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
                WHERE name LIKE $1 OR
                    feed_place->0->>'title' ILIKE $1 OR 
                    feed_place->1->>'title' ILIKE $1 OR 
                    feed_place->2->>'title' ILIKE $1
                ORDER BY report_it_index DESC
                LIMIT $2 OFFSET $3
            `
            const values = ["%" + searchValue + "%", limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /search/report_it API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 문의 관리 - 1:1 문의 검색
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/contactus_management", async(req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const searchValue = req.query.search 
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "success": true,
        "message":null,
        "data": null
    }  

    try {

        if (searchValue === null || searchValue === undefined || searchValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT TO_CHAR(date,'YYYY-MM-DD')AS date, title, contactus_index, contactus_email, is_member, is_answer 
                FROM stepplaceschema.contactus
                WHERE title LIKE $1 OR contents LIKE $2 OR nickname LIKE $3
                ORDER BY contactus_index DESC
                LIMIT $4 OFFSET $5
            `
            const values = ["%" + searchValue + "%", "%" + searchValue + "%", "%" + searchValue + "%", limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /search/contactus_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 시스템 관리 - 공지사항 관리 검색
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.get("/notice", async(req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const searchValue = req.query.search
    const offset = req.query.offset || 0
    const limit = 50

    // Response Data
    const result = {
        "data": null,
        "message": null,
        "success": false
    }

    try {

        if (searchValue === null || searchValue === undefined || searchValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)
    
        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")
            
            db = new Client(pgInit)
            await db.connect()
            
            const sql = `
                (SELECT TO_CHAR(date,'YYYY-MM-DD')AS date, notice_index, title, is_top_fixed 
                FROM stepplaceschema.notice 
                WHERE is_top_fixed IN('true') AND is_delete IN('false') AND title LIKE $1 
                ORDER BY notice_index DESC)
                UNION ALL 
                (SELECT TO_CHAR(date,'YYYY-MM-DD')AS date, notice_index, title, is_top_fixed 
                FROM stepplaceschema.notice 
                WHERE is_top_fixed IN('false') AND is_delete IN('false') AND title LIKE $2 
                ORDER BY notice_index DESC)
                LIMIT $3 OFFSET $4
            `
            const values = ["%" + searchValue + "%", "%" + searchValue + "%", limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /search/report_it API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router