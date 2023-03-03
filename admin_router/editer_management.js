// 22. 12. 14 QA 완료 - 최민석

const router = require("express").Router()
const {Client} = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")

// 시스템관리 - 에디터 관리 - 누구와 함께
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.put("/together", async (req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const togetherValue = req.body.together 

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {

        if (togetherValue === null || togetherValue === undefined || togetherValue.indexOf("") !== -1) {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `UPDATE stepplaceschema.editor_together SET together=$1 where together_index=1`
            const valuse = [togetherValue]
            await db.query(sql, valuse)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /editer_management/together API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 시스템관리 - 에디터 관리 - 지역
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.put("/location", async (req, res) => {
    
    // Reqeust Data
    let db = null
    const publicToken = req.headers.token
    const locationValue = req.body.location 

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {

        if (locationValue === null || locationValue === undefined || locationValue.indexOf("") !== -1) {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `UPDATE stepplaceschema.editor_location SET location =$1 WHERE location_index=1`
            const valuse = [locationValue]
            await db.query(sql, valuse)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /editer_management/location API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 시스템관리 - 에디터 관리 - 이동 수단
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.put("/transportation", async (req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const transportationValue = req.body.transportation  

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  

    try {

        if (transportationValue === null || transportationValue === undefined || transportationValue.indexOf("") !== -1) {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)
        
        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `UPDATE stepplaceschema.editor_transportation SET transportation=$1 WHERE transportation_index=1`
            const valuse = [transportationValue]
            await db.query(sql, valuse)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /editer_management/transportation API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 시스템관리 - 에디터 관리 - 누구와 함께
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/together", async (req, res) => {

    // Request Data
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
            SELECT together
            FROM stepplaceschema.editor_together
        `
        const row = await db.query(sql)

        result.success = true
        result.data = row.rows[0]
    } catch(e) {
        result.message = e.message
        console.log("GET /editer_management/together API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 시스템관리 - 에디터 관리 - 지역
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/location", async (req, res) => {

    // Request Data
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
            SELECT location
            FROM stepplaceschema.editor_location
        `
        const row = await db.query(sql)

        result.success = true
        result.data = row.rows[0]
    } catch(e) {
        result.message = e.message
        console.log("GET /editer_management/location API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 시스템관리 - 에디터 관리 - 이동 수단
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/transportation", async (req, res) => {

    // Request Data
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
            SELECT transportation
            FROM stepplaceschema.editor_transportation
        `
        const row = await db.query(sql)

        result.success = true
        result.data = row.rows[0]
    } catch(e) {
        result.message = e.message
        console.log("GET /editer_management/transportation API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router