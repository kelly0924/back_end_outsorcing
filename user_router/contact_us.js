// 22. 12. 16 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const moment = require("../modules/moment")
const upload = require("../modules/upload_attach")

// 1:1 문의 쓰기
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.post("/", upload.array("attachment[]"), async (req,res) => {

    // Request Data
    let db = null
    const account_indexValue = req.body.account_index   // 필수 입력 값이 아님
    const isMember = req.body.is_member
    const emailValue = req.body.email
    const nicknameValue = req.body.nickname   // 필수 입력 값이 아님
    const titleValue = req.body.title
    const contentsValue = req.body.contents 
    const attachmentRawValue = req.files ? req.files : []   // 필수 입력 값이 아님
    const attachmentValue = []
    const contact_usDate = moment()

    // Signle로 받아온 file은 path로 바로 접근이 가능
    // 하지만 Array로 받아온 file[]은 path로 바로 접근이 어렵기 때문에, 후처리를 통해 데이터 정제
    for (let index = 0 ; index < attachmentRawValue.length; index++) {
        attachmentValue.push({ 
            "file_path": attachmentRawValue[index].path,
        })
    }

    // Response Data
    const result = {
        "success": false,
        "message": null
    } 
    
    // Rules
    const emailRule = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i


    try {
        if (!emailRule.test(emailValue)){
            throw new Error("이메일 양식이 올바르지 않습니다.")
        } else if (account_indexValue  === null) {
            throw new Error("회원번호 값이 올바르지 않습니다.")
        } else if(isMember === null || isMember === undefined || (isMember !== "true" && isMember !== "false")) {
            throw new Error("멤버 여부 값이 올바르지 않습니다.")
        } else if(emailValue === null || emailValue === undefined || emailValue === "") {
            throw new Error("이메일 값이 올바르지 않습니다.")
        } else if(nicknameValue === null || (nicknameValue !== undefined && nicknameValue.length > 13)) {
            throw new Error("닉네임 값이 올바르지 않습니다.")
        } else if(titleValue === null || titleValue === undefined || titleValue === "") {
            throw new Error("제목 값이 올바르지 않습니다.")
        } else if(contentsValue === null || contentsValue === undefined || contentsValue === "") {
            throw new Error("내용 값이 올바르지 않습니다.")
        } else if(attachmentValue === null || attachmentValue.length > 6) {
            throw new Error("첨부파일 값이 올바르지 않습니다.")
        } else {

            db = new Client(pgInit)
            await db.connect()
            const sql = `
                INSERT INTO stepplaceschema.contactus(contactus_email, account_index, nickname, is_member, title, contents, attachment, date, is_answer)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `
            const values = [emailValue, account_indexValue, nicknameValue, isMember, titleValue, contentsValue, attachmentValue, contact_usDate, false]
            await db.query(sql,values)

            result.success = true
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /contact_us API ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router