// 22. 12. 13 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const moment = require("../modules/moment")
const verify = require("../modules/verify")

// 이용약관 입력
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.post("/", async(req,res) => {

    // Reqeust Data
    let db = null
    const publicToken = req.headers.token 
    const termsData = req.body.terms_data
    const dataValue = moment()

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {

        if (termsData.length == 0) {
            throw new Error("입력 값이 올바르지 않습니다.")
        } 

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            // 이용약관 Table 초기화
            const delete_sql = "DELETE FROM stepplaceschema.termsofservice"
            await db.query(delete_sql)

            // 이용약관 Table에 신규 데이터 삽입
            for (let index = 0; index < termsData.length; index++) {
                const titleValue = termsData[index].title 
                const contentsValue = termsData[index].contents 

                const insert_sql = `
                    INSERT INTO stepplaceschema.termsofservice(title, contents, date)
                    VALUES($1, $2, $3)
                `
                const insert_values = [titleValue, contentsValue, dataValue]
                await db.query(insert_sql, insert_values)
            }

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /terms_of_service API ERR : ", e.message)
    }
    
    if (db) await db.end()
    res.send(result)
})

// 이용약관 읽기
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/", async (req, res) => {

    // Reqeust Data
    let db = null

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null
    }

    try {

        db = new Client(pgInit)
        await db.connect()

        const sql = `
            SELECT title, contents FROM stepplaceschema.termsofservice
            ORDER BY idx
        `
        const row = await db.query(sql)

        result.success = true
        result.data = row.rows
    } catch(e) {
        result.message = e.message
        console.log("GET /terms_of_service API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router