// 이메일 전송 Config

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    "service": 'gmail',
    "host": "smtp.ethereal.email",
    "port": 465,
    "secure": false,
    "auth": {
      "user": process.env.USER_EMAIL,
      "pass": process.env.USER_EMAIL_PASSWORD,
    },
})

module.exports = transporter