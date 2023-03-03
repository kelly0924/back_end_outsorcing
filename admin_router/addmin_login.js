// 22. 12. 13 QA 완료 - 최민석

const router = require("express").Router()
const jwt = require("jsonwebtoken")

const jwtSecretKey = process.env.JWT_SECRET_KEY
const admin_email = process.env.ADMMIN_EMAIL
const admin_password = process.env.ADMMIN_PASSWORD

// 로그인
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.post("/", (req, res) => {

    // Request Data
    const emailValue = req.body.email
    const passwordValue = req.body.password
    
    // Response Data
    const result = {
        "success": false,
        "message": null,
        "token": null
    }

    try {

        if (emailValue === null || emailValue === undefined || emailValue === "" || 
        passwordValue === null || passwordValue === undefined || passwordValue === "") {
            throw new Error("입력 값이 올바르지 않습니다.")
        } else if (emailValue !== admin_email || passwordValue !== admin_password) {
            throw new Error("회원정보가 올바르지 않습니다.")
        }
            
        const jwtToken = jwt.sign(
            {
                "email": emailValue,
                "role": "admin"
            },
            jwtSecretKey,
            {
                "issuer": "kelly",
                "expiresIn": "24h"
            }
        )

        result.success = true
        result.token = jwtToken
    } catch (e) {
        result.message = e.message
        console.log("POST /admin_login API ERR : ", e.message)
    }

    res.send(result)
})

module.exports = router