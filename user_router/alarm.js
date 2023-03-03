const router = require("express").Router()
const {Client} = require("pg")

const pgInit = require("../modules/psql")
const verify = require("../modules/verify")
const dateConverter = require("../modules/dateConverter")

// 알람 목록 불러오기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.get("/", async (req,res) => { 

    // Request Data
    let db = null
    const publicToken = req.headers.token

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "today": [],
        "week": [],
        "month": [],
        "rest": []
    }

    try {

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            // 오늘 날짜 알람 불러오기
            const todaySql = `
                SELECT stepplaceschema.alarm.account_index, address, alarm_type, alarm_move_index, stepplaceschema.alarm.date
                FROM stepplaceschema.alarm 
                JOIN stepplaceschema.account
                ON stepplaceschema.alarm.account_index = stepplaceschema.account.account_index
                WHERE receive_account_index=$1 AND stepplaceschema.alarm.date >= current_date
                ORDER BY alarm_index DESC
            `
            const todayValues = [auth.payload.account_index]
            const todayRow = await db.query(todaySql, todayValues)
            const todayData = todayRow.rows

            // 오늘 날짜 알람에 데이터 추가
            for (let index = 0; index < todayData.length; index++) {

                todayData[index].date = dateConverter(todayData[index].date)   // 날짜 형식 변경

                if (todayData[index].alarm_type === 0 || todayData[index].alarm_type === 1 || todayData[index].alarm_type === 2 || todayData[index].alarm_type === 3 || todayData[index].alarm_type === 4) {
                    const sql = `
                        SELECT nickname, profile
                        FROM stepplaceschema.account
                        WHERE account_index=$1
                    `
                    const values = [todayData[index].account_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    todayData[index] = {...todayData[index], ...data[0]}

                    if (todayData[index].alarm_type === 1) {
                        const sql1 = `
                            SELECT image1
                            FROM stepplaceschema.feed
                            WHERE feed_index=$1
                        `
                        const values1 = [todayData[index].alarm_move_index]
                        const row1 = await db.query(sql1, values1)
                        const data1 = row1.rows
                        todayData[index] = {...todayData[index], ...data1[0]}
                    }
                }
                else if (todayData[index].alarm_type === 5) {
                    const sql = `
                        SELECT nickname
                        FROM stepplaceschema.account
                        WHERE account_index=$1
                    `
                    const values = [auth.payload.account_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    todayData[index] = {...todayData[index], ...data[0]}
                }
                else if (todayData[index].alarm_type === 6) {
                    const sql = `
                        SELECT title
                        FROM stepplaceschema.notice
                        WHERE notice_index=$1
                    `
                    const values = [todayData[index].alarm_move_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    todayData[index] = {...todayData[index], ...data[0]}
                }
            }

            // 이번 주 알람 불러오기
            const weekSql = `
                SELECT stepplaceschema.alarm.account_index, address, alarm_type, alarm_move_index, stepplaceschema.alarm.date
                FROM stepplaceschema.alarm 
                JOIN stepplaceschema.account
                ON stepplaceschema.alarm.account_index = stepplaceschema.account.account_index
                WHERE receive_account_index=$1 AND stepplaceschema.alarm.date >= current_date-7 AND stepplaceschema.alarm.date < current_date
                ORDER BY alarm_index DESC
            `
            const weekValues = [auth.payload.account_index]
            const weekRow = await db.query(weekSql, weekValues)
            const weekData = weekRow.rows

            // 이번 주 알람에 데이터 추가
            for (let index = 0; index < weekData.length; index++) {

                weekData[index].date = dateConverter(weekData[index].date)   // 날짜 형식 변경

                if (weekData[index].alarm_type === 0 || weekData[index].alarm_type === 1 || weekData[index].alarm_type === 2 || weekData[index].alarm_type === 3 || weekData[index].alarm_type === 4) {
                    const sql = `
                        SELECT nickname, profile
                        FROM stepplaceschema.account
                        WHERE account_index=$1
                    `
                    const values = [weekData[index].account_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    weekData[index] = {...weekData[index], ...data[0]}

                    if (weekData[index].alarm_type === 1) {
                        const sql1 = `
                            SELECT image1
                            FROM stepplaceschema.feed
                            WHERE feed_index=$1
                        `
                        const values1 = [weekData[index].alarm_move_index]
                        const row1 = await db.query(sql1, values1)
                        const data1 = row1.rows
                        weekData[index] = {...weekData[index], ...data1[0]}
                    }
                }
                else if (weekData[index].alarm_type === 5) {
                    const sql = `
                        SELECT nickname
                        FROM stepplaceschema.account
                        WHERE account_index=$1
                    `
                    const values = [auth.payload.account_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    weekData[index] = {...weekData[index], ...data[0]}
                }
                else if (weekData[index].alarm_type === 6) {
                    const sql = `
                        SELECT title
                        FROM stepplaceschema.notice
                        WHERE notice_index=$1
                    `
                    const values = [weekData[index].alarm_move_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    weekData[index] = {...weekData[index], ...data[0]}
                }
            }

            // 이번 달 알람 불러오기
            const monthSql = `
                SELECT stepplaceschema.alarm.account_index, address, alarm_type, alarm_move_index, stepplaceschema.alarm.date
                FROM stepplaceschema.alarm 
                JOIN stepplaceschema.account
                ON stepplaceschema.alarm.account_index = stepplaceschema.account.account_index
                WHERE receive_account_index=$1 AND stepplaceschema.alarm.date >= current_date-30 AND stepplaceschema.alarm.date < current_date-7
                ORDER BY alarm_index DESC
            `
            const monthValues = [auth.payload.account_index]
            const monthRow = await db.query(monthSql, monthValues)
            const monthData = monthRow.rows
            
            // 이번 달 알람에 데이터 추가
            for (let index = 0; index < monthData.length; index++) {

                monthData[index].date = dateConverter(monthData[index].date)   // 날짜 형식 변경

                if (monthData[index].alarm_type === 0 || monthData[index].alarm_type === 1 || monthData[index].alarm_type === 2 || monthData[index].alarm_type === 3 || monthData[index].alarm_type === 4) {
                    const sql = `
                        SELECT nickname, profile
                        FROM stepplaceschema.account
                        WHERE account_index=$1
                    `
                    const values = [monthData[index].account_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    monthData[index] = {...monthData[index], ...data[0]}

                    if (monthData[index].alarm_type === 1) {
                        const sql1 = `
                            SELECT image1
                            FROM stepplaceschema.feed
                            WHERE feed_index=$1
                        `
                        const values1 = [monthData[index].alarm_move_index]
                        const row1 = await db.query(sql1, values1)
                        const data1 = row1.rows
                        monthData[index] = {...monthData[index], ...data1[0]}
                    }
                }
                else if (monthData[index].alarm_type === 5) {
                    const sql = `
                        SELECT nickname
                        FROM stepplaceschema.account
                        WHERE account_index=$1
                    `
                    const values = [auth.payload.account_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    monthData[index] = {...monthData[index], ...data[0]}
                }
                else if (monthData[index].alarm_type === 6) {
                    const sql = `
                        SELECT title
                        FROM stepplaceschema.notice
                        WHERE notice_index=$1
                    `
                    const values = [monthData[index].alarm_move_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    monthData[index] = {...monthData[index], ...data[0]}
                }
            }

            // 나머지 알람 불러오기
            const restSql = `
                SELECT stepplaceschema.alarm.account_index, address, alarm_type, alarm_move_index, stepplaceschema.alarm.date
                FROM stepplaceschema.alarm 
                JOIN stepplaceschema.account
                ON stepplaceschema.alarm.account_index = stepplaceschema.account.account_index
                WHERE receive_account_index=$1 AND stepplaceschema.alarm.date < current_date-30
                ORDER BY alarm_index DESC
            `
            const restValues = [auth.payload.account_index]
            const restRow = await db.query(restSql, restValues)
            const restData = restRow.rows

            // 나머지 알람에 데이터 추가
            for (let index = 0; index < restData.length; index++) {

                restData[index].date = dateConverter(restData[index].date)   // 날짜 형식 변경

                if (restData[index].alarm_type === 0 || restData[index].alarm_type === 1 || restData[index].alarm_type === 2 || restData[index].alarm_type === 3 || restData[index].alarm_type === 4) {
                    const sql = `
                        SELECT nickname, profile
                        FROM stepplaceschema.account
                        WHERE account_index=$1
                    `
                    const values = [restData[index].account_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    restData[index] = {...restData[index], ...data[0]}

                    if (restData[index].alarm_type === 1) {
                        const sql1 = `
                            SELECT image1
                            FROM stepplaceschema.feed
                            WHERE feed_index=$1
                        `
                        const values1 = [restData[index].alarm_move_index]
                        const row1 = await db.query(sql1, values1)
                        const data1 = row1.rows
                        restData[index] = {...restData[index], ...data1[0]}
                    }
                }
                else if (restData[index].alarm_type === 5) {
                    const sql = `
                        SELECT nickname
                        FROM stepplaceschema.account
                        WHERE account_index=$1
                    `
                    const values = [auth.payload.account_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    restData[index] = {...restData[index], ...data[0]}
                }
                else if (restData[index].alarm_type === 6) {
                    const sql = `
                        SELECT title
                        FROM stepplaceschema.notice
                        WHERE notice_index=$1
                    `
                    const values = [restData[index].alarm_move_index]
                    const row = await db.query(sql, values)
                    const data = row.rows
                    restData[index] = {...restData[index], ...data[0]}
                }
            }

            result.success = true
            result.today = todayData
            result.week = weekData
            result.month = monthData
            result.rest = restData
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /alarm ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router