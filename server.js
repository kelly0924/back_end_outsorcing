const express = require("express")
const cors = require("cors")
require("dotenv").config()

const app = express()
const port = process.env.PORT_NUM | 8000
app.use(cors({
    origin: "*"
}))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// ===== Client Page API =====

const accountApi=require("./user_router/account")
app.use("/account",accountApi)

const followingApi=require("./user_router/following")
app.use("/following",followingApi)

const feedApi =require("./user_router/feed")
app.use("/feed", feedApi)

const commnetApi = require("./user_router/comment")
app.use("/comment",commnetApi)

const replyApi = require("./user_router/reply")
app.use("/reply",replyApi)

const contact_usApi = require("./user_router/contact_us")
app.use("/contact_us",contact_usApi)

const noticeApi=require("./user_router/notice")
app.use("/notice",noticeApi)

const my_accountApi = require("./user_router/my_account")
app.use("/my_account",my_accountApi)

const my_activeApi=require("./user_router/my_active")
app.use("/my_active",my_activeApi)

const alarmApi=require("./user_router/alarm")
app.use("/alarm",alarmApi)

const mainpageApi = require("./user_router/main_page")
app.use("/main_page", mainpageApi)

const emailApi = require("./user_router/mail")
app.use("/email", emailApi)

const addressApi = require("./user_router/address")
app.use("/address", addressApi)

const searchApi = require("./user_router/search")
app.use("/search_client", searchApi)

// ===== Admin Page API =====

const termsofserviceApi=require("./admin_router/terms_of_service")
app.use("/terms_of_service", termsofserviceApi)

const memberlistApi=require("./admin_router/member_list")
app.use("/member_list",memberlistApi)

const application_managementApi=require("./admin_router/application_managment")
app.use("/application_management",application_managementApi)

const comment_managementApi=require("./admin_router/comment_management")
app.use("/comment_management",comment_managementApi)

const contact_us_managementApi=require("./admin_router/contact_us_management")
app.use("/contactus_management",contact_us_managementApi)

const editor_managementApi=require("./admin_router/editer_management")
app.use("/editor_management",editor_managementApi)

const footer_managementApi=require("./admin_router/footer_management")
app.use("/footer_management",footer_managementApi)

const notice_managementApi=require("./admin_router/notice_management")
app.use("/notice_management",notice_managementApi)

const admin_loginApi=require("./admin_router/addmin_login")
app.use("/admin_login",admin_loginApi)

const report_itApi=require("./admin_router/report_it_feed")
app.use("/report_it",report_itApi)

const feed_managementApi=require("./admin_router/feed_managment")
app.use("/feed_management",feed_managementApi)

const search_adminApi=require("./admin_router/search")
app.use("/search",search_adminApi)

// ===== Web Server =====

app.listen(port, () => {
    console.log(`HTTP Server is Start at : ${port}`)
})