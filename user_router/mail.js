// 22. 12. 19 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")
const path = require("path")
const ejs = require("ejs")

const pgInit = require("../modules/psql")
const transporter = require("../modules/transporter")

// 메일 전송
// Toekn 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.post("/", async(req,res) => {

    // Request Data
    let db = null
    let emailTemplete = null
    const emailValue = req.body.email 

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "code": null
    }

    // Rules
    const emailRule = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

    try {
        if (!emailRule.test(emailValue)){
            throw new Error("이메일 양식이 올바르지 않습니다.")
        } else if (emailValue === null || emailValue === undefined || emailValue === "" || emailValue === "@") {
            throw new Error("이메일 값이 올바르지 않습니다.")
        }

        db = new Client(pgInit)
        await db.connect()

        const sql = "SELECT email FROM stepplaceschema.account WHERE email=$1"
        const values = [emailValue]
        const row = await db.query(sql,values)

        const random_code = Math.floor(Math.random() * 1000000)
        ejs.renderFile(path.join(__dirname, "../modules/auth_mail_template.ejs"), {
            "code" : random_code
        }, (err, data) => {
            if (err) {
                console.log(err)
                throw new Error("메일 생성에 실패했습니다.")
            }
            emailTemplete = data
        })

        if (row.rows.length > 0) {
            throw new Error("중복된 이메일 입니다.")
        } else {
            transporter.sendMail({
                from: '"Stepplace" <process.env.USER_EMAIL>',
                to: emailValue,
                subject: '[Stepplace] 인증코드 안내',
                html: emailTemplete
            })

            result.success = true
            result.code = random_code
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /mail API ERR : ", e.message)
    }
        
    if (db) await db.end()
    res.send(result)
})

module.exports = router 