// 22. 12. 19 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")
const path = require("path")
const ejs = require("ejs")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")
const moment = require("../modules/moment")
const transporter = require("../modules/transporter")
const numberConverter = require("../modules/numberConverter")

// 내 계정 불러오기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.get("/", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
        "is_following": false
    }

    try {

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                SELECT name, birth_date, email, address, is_disabled, feed_cnt, follow_cnt, following_cnt 
                FROM stepplaceschema.account 
                WHERE account_index = $1
            `
            const values = [auth.payload.account_index]
            const row = await db.query(sql,values)
                
            result.data = row.rows[0]

            // feed, following, follow 숫자 변경
            result.data.feed_cnt = numberConverter(result.data.feed_cnt)
            result.data.follow_cnt = numberConverter(result.data.follow_cnt)
            result.data.following_cnt = numberConverter(result.data.following_cnt)

        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /my_account ERR : ", e.message)
    }
                
    if (db) await db.end()
    res.send(result)
})

// 비밀번호 변경
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.put("/change_password", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const old_passwordValue = req.body.old_password 
    const new_passwordValue = req.body.new_password

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {
        if (old_passwordValue  === null || old_passwordValue  === undefined || old_passwordValue === "" || old_passwordValue.length < 8) {
            throw new Error("기존 비밀번호 값이 올바르지 않습니다.")
        } else if(new_passwordValue === null || new_passwordValue === undefined || new_passwordValue === "" || new_passwordValue.length < 8) {
            throw new Error("신규 비밀번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)
        
        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()
            const select_sql = `
                SELECT password 
                FROM stepplaceschema.account 
                WHERE account_index=$1
            `
            const select_values = [auth.payload.account_index]
            const row = await db.query(select_sql,select_values)

            if (row.rows[0].password === old_passwordValue) {
                const update_sql = `
                    UPDATE stepplaceschema.account
                    SET password=$2 
                    WHERE account_index=$1
                `
                const update_values = [auth.payload.account_index, new_passwordValue]
                await db.query(update_sql, update_values)

                result.success = true
            } else {
                throw new Error("기존 비밀번호가 틀립니다.")
            }
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /my_account/change_password ERR : ", e.message)
    }
                
    if (db) await db.end()
    res.send(result)
})

// 비밀번호 찾기
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.post("/search_password", async (req, res) => {

    // Request Data
    let db = null
    let emailTemplete = null
    const email = req.body.email 

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    // Rules
    const emailRule = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

    try {

        if (!emailRule.test(email) || email  === null || email  === undefined || email === ""){
            throw new Error("이메일 입력 값이 올바르지 않습니다.")
        } 

        db = new Client(pgInit)
        await db.connect()

        const sql = "SELECT email, nickname, password FROM stepplaceschema.account WHERE email=$1"
        const values = [email]
        const row = await db.query(sql, values)

        ejs.renderFile(path.join(__dirname, "../modules/password_search_mail_templage.ejs"), {
            "nickname" : row.rows[0].nickname,
            "email" : row.rows[0].email,
            "password" : row.rows[0].password
        }, (err, data) => {
            if (err) {
                console.log(err)
                throw new Error("메일 생성에 실패했습니다.")
            }
            emailTemplete = data
        })

        transporter.sendMail({
            from: '"Stepplace" <process.env.USER_EMAIL>',
            to: email,
            subject: '[Stepplace] 비밀번호 안내',
            html: emailTemplete
        })

        result.success = true
    } catch(e) {
        result.message = e.message
        console.log("PUT /my_account/search_password ERR : ", e.message)
    }
                
    if (db) await db.end()
    res.send(result)
})

// 계정 비활성화
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.put("/is_disabled", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const is_disabledValue = req.body.is_disabled

    // Response Data
    const result = {
        "success": false, 
        "message": null 
    }

    try {
        if (is_disabledValue === null || is_disabledValue === undefined || typeof(is_disabledValue) !== "boolean") {
            throw new Error("비활성화 설정 값이 올바르지 않습니다.")
        } 

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()
            const sql = `
                UPDATE stepplaceschema.account
                SET is_disabled=$2 
                WHERE account_index=$1
            `
            const values = [auth.payload.account_index, is_disabledValue]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /my_account/is_disabled ERR : ", e.message)
    }
                
    if (db) await db.end()
    res.send(result)
})

// 프로필 고유 주소 변경
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.put("/address", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const addressValue = req.body.address 

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {
        if (addressValue === null || addressValue === undefined || addressValue === "") {
            throw new Error("고유 주소 값이 올바르지 않습니다.")
        } 

        const auth = verify(publicToken)
            
        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            // 30일 시간 제한 체크
            const time_sql = `
                SELECT EXTRACT (
                    DAY from now()-(SELECT address_edit_date FROM stepplaceschema.account WHERE account_index=$1)
                ) AS difference
            `
            const time_values = [auth.payload.account_index]
            const timeData = await db.query(time_sql, time_values)

            if (timeData.rows[0].difference != null && timeData.rows[0].difference <= 90) {
                throw new Error("고유 주소 변경은 3개월에 한 번만 가능합니다.")
            }

            // 중복 체크
            const duplicate_sql = `
                SELECT address 
                FROM stepplaceschema.account 
                WHERE address=$1
            `
            const duplicate_values = [addressValue]
            const duplicateData = await db.query(duplicate_sql, duplicate_values)
        
            if (duplicateData.rows.length > 0) {
                throw new Error("이미 존재하는 고유 주소 입니다.")
            }

            // 고유주소 수정
            const sql = `
                UPDATE stepplaceschema.account
                SET address=$2, address_edit_date=$3 
                WHERE account_index=$1
            `
            const values = [auth.payload.account_index, addressValue, moment()]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /my_account/address ERR : ", e.message)
    }
                
    if (db) await db.end()
    res.send(result)
})

// 회원 탈퇴
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.delete("/cancel", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 

    // Response Data
    const result = {
        "success": false,
        "message": null 
    }

    try {

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                UPDATE stepplaceschema.account 
                SET email='delete', is_delete=true
                WHERE account_index=$1
            `
            const values = [auth.payload.account_index]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("DELETE /my_account/cancel ERR : ", e.message)
    }
                
    if (db) await db.end()
    res.send(result)
})

module.exports = router