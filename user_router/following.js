// 22. 12. 19 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")
const alarm = require("../modules/alarm")

// 팔로잉 추가
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/",async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const following_accountValue = req.body.following_account_index 

    // Response Data    
    const result = {
        "success": false,
        "message": null
    }

    try {
        if (following_accountValue === null || following_accountValue === undefined || following_accountValue === "") {
            throw new Error("팔로잉 회원 번호가 올바르지 않습니다.")
        } 

        const auth = verify(publicToken)

        if (auth.success) { 
            db = new Client(pgInit)
            await db.connect()

            const select_sql = ` 
                SELECT * 
                FROM stepplaceschema.following 
                WHERE following_account_index=$1 and follow_account_index=$2
            `
            const select_value = [following_accountValue, auth.payload.account_index]
            const following = await db.query(select_sql, select_value)

            if (following.rows.length > 0) {
                throw new Error("현재 팔로잉 상태입니다.")
            }

            const count_sql = ` 
                SELECT following_cnt
                FROM stepplaceschema.account 
                WHERE account_index=$1 
            `
            const count_value = [auth.payload.account_index]
            const following_count = await db.query(count_sql, count_value)

            if (following_count.rows[0].following_cnt > 79) {
                throw new Error("팔로잉은 80명까지만 가능합니다.")
            }

            // 팔로잉 추가
            const sql = `
                INSERT INTO stepplaceschema.following(following_account_index, follow_account_index) 
                VALUES($1, $2)
            `
            const values = [following_accountValue, auth.payload.account_index]
            await db.query(sql, values)

            // 팔로워 숫자 증가 
            const follow_sql = `
                UPDATE stepplaceschema.account 
                SET follow_cnt=(follow_cnt + 1) 
                WHERE account_index=$1
            `
            const follow_values = [following_accountValue]
            await db.query(follow_sql, follow_values)

            // 팔로잉 숫자 증가
            const following_sql = `
                UPDATE stepplaceschema.account 
                SET following_cnt=(following_cnt + 1) 
                WHERE account_index=$1
            `
            const following_values = [auth.payload.account_index]
            await db.query(following_sql, following_values)

            result.success = true

            alarm(auth.payload.account_index, following_accountValue, 4, auth.payload.account_index)   // 알람 생성자의 idx, 알람 수신자의 idx, 알람 타입, 이동할 곳

        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /following ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

// 팔로잉 취소
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.delete("/", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const following_indexValue = req.body.following_index
    
    // Response Data
    const result = {
        "success": false,
        "message":null
    }

    try {
        if (following_indexValue === null || following_indexValue === undefined || following_indexValue === "") {
            throw new Error("팔로잉 회원 번호가 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            const select_sql = `
                SELECT *
                FROM stepplaceschema.following
                WHERE following_account_index=$1 and follow_account_index=$2
            `
            const select_value = [following_indexValue, auth.payload.account_index]
            const following = await db.query(select_sql, select_value)

            if (following.rows.length !== 0) { 
                const sql = `
                    DELETE FROM stepplaceschema.following 
                    WHERE follow_account_index=$1 and following_account_index=$2
                `
                const values = [auth.payload.account_index, following_indexValue]
                await db.query(sql, values)

                // 팔로워 숫자 감소
                const follow_sql = `
                    UPDATE stepplaceschema.account 
                    SET follow_cnt=(follow_cnt - 1) 
                    WHERE account_index=$1
                `
                const follow_values = [following_indexValue]
                await db.query(follow_sql, follow_values)

                // 팔로잉 숫자 감소
                const following_sql = `
                    UPDATE stepplaceschema.account 
                    SET following_cnt=(following_cnt - 1) 
                    WHERE account_index=$1
                `
                const following_values = [auth.payload.account_index]
                await db.query(following_sql,following_values)

                result.success = true
            } else {
                throw new Error("팔로잉을 취소 할수 없습니다.")
            }
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /following ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

// 팔로잉 목록 불러오기 
// Toekn 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/", async (req, res) => {

    // Request Data
    let db = null
    const account_indexValue = req.query.account_index   // 보려는 회원의 account_index
    const offset = req.query.offset || 0
    const limit = 20
    
    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null
    }

    try {
        if (account_indexValue  === null || account_indexValue  === undefined || account_indexValue === "") {
            throw new Error("회원 번호가 올바르지 않습니다.")
        } else {

            db = new Client(pgInit)
            await db.connect()
            const sql = `
                SELECT account_index, nickname, address, profile, is_photographer, introduction
                FROM stepplaceschema.account
                WHERE account_index IN(
                    SELECT following_account_index
                    FROM stepplaceschema.following
                    WHERE follow_account_index=$1
                )
                LIMIT $2 OFFSET $3
            `
            const values = [account_indexValue, limit, offset * limit]
            const row = await db.query(sql,values)

            result.success = true
            result.data = row.rows
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /following ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

// 팔로우 목록 불러오기 
// Toekn 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/follow", async (req,res) => {

    // Request Data
    let db = null
    const account_indexValue = req.query.account_index   // 보려는 회원의 account_index
    const offset = req.query.offset || 0
    const limit = 20
    
    // Response Data
    const result = {
        "data": null,
        "message": null,
        "success": false
    }

    try {
        if (account_indexValue  === null || account_indexValue  === undefined || account_indexValue === "") {
            throw new Error("회원 번호가 올바르지 않습니다.")
        } else {

            db = new Client(pgInit)
            await db.connect()
            const sql = `
                SELECT account_index, nickname, address, profile,is_photographer, introduction 
                FROM stepplaceschema.account 
                WHERE account_index IN(
                    SELECT follow_account_index 
                    FROM stepplaceschema.following 
                    WHERE following_account_index=$1
                )
                LIMIT $2 OFFSET $3
            `
            const values = [account_indexValue, limit, offset * limit]
            const row = await db.query(sql, values)

            result.success = true
            result.data = row.rows
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /following/follow ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

module.exports = router