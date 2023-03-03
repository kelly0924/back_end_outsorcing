// 22. 12. 14 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")

// 시스템관리 - 푸터 관리
// Token 2 : Token 내의 role 값을 기준으로 권한 체크
router.put("/", async (req, res) => {
    
    // Request Data
    let db = null
    const publicToken = req.headers.token
    const copyrightValue = req.body.copyright 
    const terms_of_serviceValue = req.body.terms_of_service 
    const privacy_policyValue = req.body.privacy_policy
    const contactusValue = req.body.contactus

    // Response Data
    const result = {
        "success": false,
        "message": null
    }  
   
    try {

        if (copyrightValue === null || copyrightValue === undefined || copyrightValue === "" ||
        terms_of_serviceValue === null || terms_of_serviceValue === undefined || terms_of_serviceValue === "" ||
        privacy_policyValue === null || privacy_policyValue === undefined || privacy_policyValue === "" ||
        contactusValue === null || contactusValue === undefined || contactusValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            if (auth.payload.role !== "admin") throw new Error("관리자 권한이 없습니다.")

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                UPDATE stepplaceschema.footer 
                SET copyright=$1, terms_of_service=$2, privacy_policy=$3, contactus=$4 
                WHERE footer_index=1
            `
            const valuse = [copyrightValue, terms_of_serviceValue, privacy_policyValue, contactusValue]
            await db.query(sql,valuse)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /footer_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})
 
// 시스템관리 - 푸터 관리
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/", async (req, res) => {

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
            SELECT * FROM stepplaceschema.footer
        `
        const row = await db.query(sql)

        result.success = true
        result.data = row.rows[0]
    } catch(e) {
        result.message = e.message
        console.log("GET /footer_management API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router