// JWT Token 검증 모듈

const jwt = require("jsonwebtoken")
const jwtSecretKey = process.env.JWT_SECRET_KEY

const verify = (token) => {

    let result = {
        "success": false,
        "payload": null,
        "message": null
    }

    try {
        jwt.verify(token, jwtSecretKey)

        const base64Payload = token.split('.')[1]
        const payload = Buffer.from(base64Payload, "base64") 
        result.payload = JSON.parse(payload.toString())

        result.success = true
    } 
    catch(e) {
        if (e.message === "jwt expired") {
            result.message = "token_expire"
            console.log("Verify Module ERR : token_expire")
        } else {
            result.message = "token_not_verified"
            console.log("Verify Module ERR : token_not_verified")
        }
    }

    return result
}

module.exports = verify
