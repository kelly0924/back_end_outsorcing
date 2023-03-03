const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const numberConverter = require("../modules/numberConverter")

// 고유 주소로 계정 프로필 정보 & 피드 정보 불러오기
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/:address", async (req, res) => {
    
    // Request Data
    let db = null
    const account_indexValue = req.query.account_index   // 내 회원 번호
    const addressValue = req.params.address   // 불러오려는 회원의 고유 주소
    const offset = req.query.offset || 0
    const limit = 10

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "is_disabled": false,
        "is_photographer": true,
        "profile_info": null,
        "feed_info": null
    }  

    try {

        db = new Client(pgInit)
        await db.connect()

        // address를 가지고 작가의 account_idx를 가져오기
        const accountIdx_sql = `
            SELECT account_index
            FROM stepplaceschema.account
            WHERE address=$1
        `
        const accountIdx_values = [addressValue]
        const accountIdxData = await db.query(accountIdx_sql, accountIdx_values)
        if (accountIdxData.rows.length < 1) {   
            throw new Error("해당 계정을 찾을 수 없습니다.")   // 삭제 되었거나, 존재하지 않는 고유 주소
        }
        const following_indexValue = accountIdxData.rows[0].account_index

        // 작가의 프로필 정보를 가져오기
        const profile_sql = `
            SELECT account_index, name, profile, nickname, address, is_photographer, is_disabled, introduction, link, follow_cnt, following_cnt, feed_cnt
            FROM stepplaceschema.account
            WHERE stepplaceschema.account.account_index=$1
        `
        const profile_values = [following_indexValue]
        const profileData = await db.query(profile_sql, profile_values)

        // 작가의 피드 정보를 가져오기
        const feed_sql = `
            SELECT stepplaceschema.feed.account_index, together, feed_index, feed_place, thanks_cnt, comment_cnt, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3 
            FROM stepplaceschema.feed 
            JOIN stepplaceschema.account 
            ON stepplaceschema.account.account_index = stepplaceschema.feed.account_index 
            WHERE stepplaceschema.feed.account_index=$1 AND is_open IN('true') AND stepplaceschema.feed.is_delete IN('false')
            ORDER BY feed_index DESC
            LIMIT $2 OFFSET $3
        `
        const feed_values = [following_indexValue, limit, offset * limit]
        const feedData = await db.query(feed_sql, feed_values)

        // 로그인을 한 상태일 때, 팔로잉 여부 가져오기
        let is_following = false
        if (account_indexValue !== undefined) {

            const following_sql = `
                SELECT following_index 
                FROM stepplaceschema.following 
                WHERE following_account_index=$1 AND follow_account_index=$2
            `
            const following_values = [following_indexValue, parseInt(account_indexValue)]
            const followingData = await db.query(following_sql, following_values)

            if (followingData.rows.length !== 0){
                is_following = true 
            }
        }

        result.success = true
        profileData.rows[0]["is_following"] = is_following
        result.profile_info = profileData.rows[0]
        result.feed_info = feedData.rows

        // feed, following, follow, thanks, comment 숫자 변경
        result.profile_info.feed_cnt = numberConverter(result.profile_info.feed_cnt)
        result.profile_info.follow_cnt = numberConverter(result.profile_info.follow_cnt)
        result.profile_info.following_cnt = numberConverter(result.profile_info.following_cnt)
        result.feed_info.thanks_cnt = numberConverter(result.feed_info.thanks_cnt)
        result.feed_info.comment_cnt = numberConverter(result.feed_info.comment_cnt)

        // 비공개 작가 예외처리
        if (profileData.rows[0].is_disabled) {
            result.is_disabled = true
            result.feed_info = null
        }

        // 작가 계정 예외처리
        if (!profileData.rows[0].is_photographer) {
            result.is_photographer = false
            result.feed_info = null
        }

    } catch(e) {
        result.message = e.message
        console.log("GET /address ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router