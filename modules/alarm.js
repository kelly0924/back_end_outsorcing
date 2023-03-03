// 알람 삽입 모듈

const { Client } = require("pg")

const pgInit = require("../modules/psql")
const moment = require("./moment")

// ===== 알람 명세서 =====
// alarm_type: 0 >> 작가의 신규 피드 (alarm_move_index: feed_index)
// alarm_type: 1 >> 누군가의 댓글 (alarm_move_index: feed_index)
// alarm_type: 2 >> 누군가의 답글 (alarm_move_index: feed_index)
// alarm_type: 3 >> 누군가의 고마워요 (alarm_move_index: feed_index)
// alarm_type: 4 >> 누군가의 팔로잉 (alarm_move_index: account_index)
// alarm_type: 5 >> 작가 신청 승인/반려 (alarm_move_index: 1 or 0)
// alarm_type: 6 >> 신규 공지사항 (alarm_move_index: notice_index)

const alarm = async (account_indexValue, recive_accountValue, alarm_typeValue, alarm_move_index) => {   // 알람 생성자의 idx, 알람 수신자의 idx, 알람 타입, 이동할 곳

    let db = null
    const date = moment()

    try {

        db = new Client(pgInit)
        await db.connect()

        // 작가의 신규 피드 알람 ( 팔로우 N명에게 보내야 하므로 별도로 분리 )
        if (alarm_typeValue === 0) {   

            const sql = `
                SELECT follow_account_index
                FROM stepplaceschema.following
                WHERE following_account_index=$1
            `
            const values = [account_indexValue]
            const row = await db.query(sql, values)
            const data = row.rows
            
            for (index = 0; index < data.length; index++) {

                const sql = `
                    INSERT INTO stepplaceschema.alarm(account_index, receive_account_index, alarm_type, alarm_move_index, date) 
                    VALUES($1, $2, $3, $4, $5)
                `
                const values = [account_indexValue, row.rows[index].follow_account_index, alarm_typeValue, alarm_move_index, date]
                await db.query(sql, values)
            }
        } 

        // 신규 공지사항 알람 ( 모든 회원에게 보내야 하므로 별도로 분리 )
        else if (alarm_typeValue === 6) {  

            const sql = `
                SELECT account_index
                FROM stepplaceschema.account
                WHERE is_disabled=false AND is_delete=false
            `
            const row = await db.query(sql)
            const data = row.rows

            for (index = 0; index < data.length; index++) {
                
                const sql = `
                    INSERT INTO stepplaceschema.alarm(account_index, receive_account_index, alarm_type, alarm_move_index, date) 
                    VALUES($1, $2, $3, $4, $5)
                `
                const values = [row.rows[index].account_index, row.rows[index].account_index, alarm_typeValue, alarm_move_index, date]
                await db.query(sql, values)
            }
        } 
        
        // 이외 모든 알람 ( A가 B에게 보내는 형태 )
        else {   

            if (parseInt(account_indexValue) !== parseInt(recive_accountValue)) {
                const sql = `
                    INSERT INTO stepplaceschema.alarm(account_index, receive_account_index, alarm_type, alarm_move_index, date) 
                    VALUES($1, $2, $3, $4, $5)
                `
                const values = [account_indexValue, recive_accountValue, alarm_typeValue, alarm_move_index, date]
                await db.query(sql, values)
            }
        }

    } catch(e) {
        console.log("Alarm Module ERR :", e.message)
    }

    if (db) await db.end()
}

module.exports = alarm