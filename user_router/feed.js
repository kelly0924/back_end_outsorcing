// 22. 12. 18 QA 완료 - 최민석

const router = require("express").Router()
const { Client } = require("pg")

const pgInit = require("../modules/psql")
const moment = require("../modules/moment")
const verify = require("../modules/verify")
const alarm = require("../modules/alarm")
const upload = require("../modules/upload_feed")
const numberConverter = require("../modules/numberConverter")

// 구독한 작가 전체 피드 목록 불러오기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.get("/", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const feedArray = []  
    const offset = req.query.offset || 0
    const limit = 10

    // Response Data
    const result = {
        "data": null,
        "message": null,
        "success": false
    }

    try {

        const auth = verify(publicToken)
            
        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            const follow_sql = `
                SELECT following_account_index 
                FROM stepplaceschema.following 
                WHERE follow_account_index IN($1)
            `
            const follow_values = [auth.payload.account_index]
            const following_index = await db.query(follow_sql, follow_values)

            for (let index= 0; index < following_index.rows.length; index++) {
                const sql = `
                    SELECT feed_index
                    FROM stepplaceschema.feed
                    JOIN stepplaceschema.account 
                    ON stepplaceschema.account.account_index = stepplaceschema.feed.account_index
                    WHERE stepplaceschema.feed.account_index IN($1) AND is_open IN('true') AND stepplaceschema.feed.is_delete IN('false') AND stepplaceschema.account.is_delete IN('false') AND is_disabled IN('false')
                `
                const values = [following_index.rows[index].following_account_index]
                const row = await db.query(sql,values)
                
                for (let i = 0; i < row.rows.length; i++) {
                    feedArray.push(row.rows[i].feed_index)
                }
            }

            const select_sql = `
                SELECT account_index, together, feed_index, feed_place, thanks_cnt, comment_cnt, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3
                FROM stepplaceschema.feed
                WHERE feed_index=ANY($1::int[])
                ORDER BY feed_index DESC 
                LIMIT $2 OFFSET $3
            `
            const select_values = [feedArray, limit, offset * limit]
            const feedData = await db.query(select_sql, select_values)

            result.success = true
            result.data = feedData.rows

            // thanks, comment 숫자 변경
            result.data.map((value) => {
                value.thanks_cnt = numberConverter(value.thanks_cnt)
                value.comment_cnt = numberConverter(value.comment_cnt)
            })
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /feed ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 내 피드 목록 불러오기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.get("/photo", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const offset = req.query.offset || 0
    const limit = 10

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
        "is_disabled": false
    }

    try {

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()
            
            const select_sql = `
                SELECT stepplaceschema.feed.account_index, together, feed_index, feed_place, thanks_cnt, comment_cnt, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3, is_open
                FROM stepplaceschema.feed 
                JOIN stepplaceschema.account 
                ON stepplaceschema.account.account_index = stepplaceschema.feed.account_index 
                WHERE stepplaceschema.feed.account_index=$1 AND stepplaceschema.feed.is_delete IN('false')
                ORDER BY feed_index DESC
                LIMIT $2 OFFSET $3
            `
            
            const select_values = [auth.payload.account_index, limit, offset * limit]
            const feedData = await db.query(select_sql, select_values)
                
            result.success = true
            if (feedData.rows.length > 0) result.is_disabled = feedData.rows[0].is_disabled
            result.data = feedData.rows

            // thanks, comment 숫자 변경
            result.data.map((value) => {
                value.thanks_cnt = numberConverter(value.thanks_cnt)
                value.comment_cnt = numberConverter(value.comment_cnt)
            })
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /feed/photo ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 피드 상세 보기 (비로그인)
// Token 1 : 비회원도 접근할 수 있는 API로 Token을 검증하지 않음
router.get("/detail/nologin", async (req, res) => {

    // Request Data
    let db = null
    const feed_indexValue = req.query.feed_index 
    const account_indexValue = req.query.account_index   // 이 피드 소유자의 회원 번호
    
    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
        "is_open": true
    }

    try {
        if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("올바르지 않은 피드번호 입력입니다.")
        } else if (account_indexValue === null || account_indexValue === undefined || account_indexValue === "") {
            throw new Error("올바르지 않은 회원번호 입력입니다.")
        } 
            
        db = new Client(pgInit)
        await db.connect()

        const sql = `
            SELECT TO_CHAR(stepplaceschema.feed.date,'YYYY-MM-DD')AS date, ARRAY_LENGTH(views, 1) AS views, thanks_cnt, nickname, address, is_photographer, profile, is_open, place, together, feed_place, stepplaceschema.feed.account_index, comment_cnt, hash_tag, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3
            FROM stepplaceschema.account
            JOIN stepplaceschema.feed
            ON stepplaceschema.feed.account_index = stepplaceschema.account.account_index
            WHERE feed_index=$1 AND stepplaceschema.feed.is_delete=false
        `
        const values = [feed_indexValue]
        const row = await db.query(sql, values)

        // 삭제 되었거나, 존재하지 않는 피드 번호 예외처리
        if (row.rows.length < 1) {   
            throw new Error("해당 피드를 찾을 수 없습니다.")
        } 

        result.success = true
        result.data = row.rows[0]
        
        // thanks, comment 숫자 변경
        result.data.thanks_cnt = numberConverter(result.data.thanks_cnt)
        result.data.comment_cnt = numberConverter(result.data.comment_cnt)

        // 비공개 피드 예외처리
        if (!row.rows[0].is_open) {
            result.is_open = false
            result.data = null
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /feed/detail ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 피드 상세 보기 (로그인)
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.get("/detail", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token 
    const feed_indexValue = req.query.feed_index 
    const account_indexValue = req.query.account_index   // 이 피드 소유자의 회원 번호
   
    // Response Data
    const result = {
        "success": false,
        "message": null,
        "data": null,
        "is_open": true,
        "is_following": false,
        "is_thanks": false,
        "is_scrap": false
    }

    try {
        if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("올바르지 않은 피드번호 입력입니다.")
        } else if (account_indexValue === null || account_indexValue === undefined || account_indexValue === "") {
            throw new Error("올바르지 않은 회원번호 입력입니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            // feed 정보 불러오기
            const sql = `
                SELECT TO_CHAR(stepplaceschema.feed.date,'YYYY-MM-DD')AS date, ARRAY_LENGTH(views,1) AS views, thanks_cnt, nickname, address, is_photographer, profile, is_open, place, together, feed_place, stepplaceschema.feed.account_index, comment_cnt, hash_tag, TO_CHAR(visit_date, 'YYYY-MM-DD') AS visit_date, image1, image2, image3
                FROM stepplaceschema.account
                JOIN stepplaceschema.feed
                ON stepplaceschema.feed.account_index = stepplaceschema.account.account_index
                WHERE feed_index=$1 AND stepplaceschema.feed.is_delete=false
            `
            const values = [feed_indexValue]
            const row = await db.query(sql, values)

            // 삭제 되었거나, 존재하지 않는 피드 번호 예외처리
            if (row.rows.length < 1) {   
                throw new Error("해당 피드를 찾을 수 없습니다.")   
            }

            // 비공개 피드 예외처리
            else if (!row.rows[0].is_open && parseInt(account_indexValue) !== auth.payload.account_index) {   
                result.success = true
                result.is_open = false
                throw new Error("비공개 피드 입니다.")   
            }

            // 조회수 업데이트
            const view_selec_sql=`SELECT views FROM stepplaceschema.feed where feed_index=$1`   // views에다 자세히 보기를 한 사람의 account_index 넣어 주기
            const view_selecValues = [feed_indexValue]
            const viewArray= await db.query(view_selec_sql,view_selecValues)
                
            let is_visit = false
            if (viewArray.rows[0].views === null ) {   // 첫 방문자 
                const view_update_sql = `UPDATE stepplaceschema.feed SET views=array_append(views,$1) WHERE feed_index=$2`
                const viewsValues=[auth.payload.account_index, feed_indexValue]
                await db.query(view_update_sql,viewsValues)
                is_visit = true
            } else {
                
                for (let index = 0; index < viewArray.rows[0].views.length; index++) {
                    if (viewArray.rows[0].views[index] === auth.payload.account_index) {
                        is_visit = true   //이사람은 방문 한적 있다.
                        break 
                    }
                }

                if (is_visit === false) {   // 방문 한적 없다는 뜻 -> 방문한 적 없는 경우만 account_index 추가 해주기
                    const view_update_sql=`UPDATE stepplaceschema.feed SET views=array_append(views,$1) WHERE feed_index=$2`
                    const viewsValues=[auth.payload.account_index, feed_indexValue]
                    await db.query(view_update_sql,viewsValues)
                }
            }
            
            // 고마워요 여부 가져오기
            const thanks_sql=`SELECT account_index FROM stepplaceschema.thanks WHERE thanks_feed_index =$1`
            const thanks_valuse=[feed_indexValue]
            const thanks_account=await db.query(thanks_sql,thanks_valuse)//고마워요를 누를 사람들의 account_index
            
            for(let i =0 ; i< thanks_account.rows.length; i++){
                if(thanks_account.rows[i].account_index  === auth.payload.account_index){//이미 좋아요를 누렀는데 또 누른 상태인지 체크
                    result.is_thanks = true
                    break     
                }
            }

            const up_thanks_sql=`UPDATE stepplaceschema.feed SET thanks_cnt=$1 WHERE feed_index=$2`
            const up_thanks_values=[thanks_account.rows.length,feed_indexValue]
            await db.query(up_thanks_sql, up_thanks_values)

            // 스크랩 여부 가져오기
            const scrap_sql=`SELECT account_index FROM stepplaceschema.scrap WHERE scrap_feed_index = $1`
            const scrap_valuse=[feed_indexValue]
            const scrap_account=await db.query(scrap_sql,scrap_valuse)
            
            for(let i =0 ; i< scrap_account.rows.length; i++){
                if(scrap_account.rows[i].account_index  === auth.payload.account_index) {//이미 좋아요를 누렀는데 또 누른 상태인지 체크
                    result.is_scrap=true
                    break     
                }
            }

            // 팔로잉 여부 가져오기
            const following_sql = `
                SELECT following_index 
                FROM stepplaceschema.following 
                WHERE following_account_index=$1 AND follow_account_index=$2
            `
            const following_values = [parseInt(account_indexValue), auth.payload.account_index]
            const followingData = await db.query(following_sql, following_values)

            if (followingData.rows.length !== 0){
                result.is_following = true 
            }

            result.success = true
            result.data = row.rows[0]

            // thanks, comment 숫자 변경
            result.data.thanks_cnt = numberConverter(result.data.thanks_cnt)
            result.data.comment_cnt = numberConverter(result.data.comment_cnt)
            
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("GET /feed/detail ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 피드 쓰기
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/", upload.fields([{name: "image1[]", maxCount: 8}, {name: "image2[]", maxCount: 8}, {name: "image3[]", maxCount: 8}]), async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const visitData = req.body.visit_date
    const togetherValue = req.body.together
    const placeValue = req.body.place
    const is_openValue = req.body.is_open
    const feed_placeValue = req.body.feed_place
    const image1 = []   // 첫 번째 장소에 대한 이미지 리스트
    const image2 = []   // 두 번째 장소에 대한 이미지 리스트
    const image3 = []   // 세 번째 장소에 대한 이미지 리스트
    const hash_tagValue = req.body.hash_tag   // 필수 입력 값이 아님

    // Signle로 받아온 file은 path로 바로 접근이 가능
    // 하지만 Array로 받아온 file[]은 path로 바로 접근이 어렵기 때문에, 후처리를 통해 데이터 정제
    // 하지만 2차원 Array[]로 받아온 내용은 반복문으로도 접근하기 어렵기 때문에, 각각의 후처리를 통해 데이터 정제
    if (req.files["image1[]"]) {
        for (let index = 0 ; index < req.files["image1[]"].length; index++) {
            image1.push({ 
                "file_path": req.files["image1[]"][index].path,
            })
        }
    }
    if (req.files["image2[]"]) {
        for (let index = 0 ; index < req.files["image2[]"].length; index++) {
            image2.push({ 
                "file_path": req.files["image2[]"][index].path,
            })
        }
    }
    if (req.files["image3[]"]) {
        for (let index = 0 ; index < req.files["image3[]"].length; index++) {
            image3.push({ 
                "file_path": req.files["image3[]"][index].path,
            })
        }
    }

    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {

        // 장소 정보 입력에 대한 예외 처리
        const imageList = [image1, image2, image3]   // forEach에 활용하기 좋게 리스트로 만듬
        let addCount = 0   // 광고 수 제한하기 위한 변수
        let placeCount = 0   // 광고 수를 계산하기 위한 변수
        JSON.parse(feed_placeValue).forEach((value, index) => {
            if (index === 0 || index === 1) {
                if (value.title === "") throw new Error(`${index+1}번 게시글의 제목 값이 올바르지 않습니다.`)
                else if (value.is_ad === null) throw new Error(`${index+1}번 게시글의 광고 여부 값이 올바르지 않습니다.`)
                else if (value.contents === "") throw new Error(`${index+1}번 게시글의 내용 값이 올바르지 않습니다.`)
                else if (value.spot.name === "") throw new Error(`${index+1}번 게시글의 장소 값이 올바르지 않습니다.`)
                else if (imageList[index].length < 1 || imageList[index].length > 8) throw new Error(`${index+1}번 게시글의 첨부파일 값이 올바르지 않습니다.`)

                if (index === 1) {   // 두 번째 장소부터 해당되는 예외 처리
                    if (value.transportation === "") throw new Error(`${index+1}번 게시글의 이동수단 값이 올바르지 않습니다.`)
                    else if (value.travel_time === "") throw new Error(`${index+1}번 게시글의 이동시간 값이 올바르지 않습니다.`)
                }

                placeCount += 1
            }
            else if (index == 2) {
                if (value.title === "" && value.is_ad === null && value.contents === "" && value.transportation === "" && value.travel_time === "") {   // 이 경우 3번째 장소가 없는 것이라고 가정
                } else {
                    if (value.title === "") throw new Error(`${index+1}번 게시글의 제목 값이 올바르지 않습니다.`)
                    else if (value.is_ad === null) throw new Error(`${index+1}번 게시글의 광고 여부 값이 올바르지 않습니다.`)
                    else if (value.contents === "") throw new Error(`${index+1}번 게시글의 내용 값이 올바르지 않습니다.`)
                    else if (value.spot.name === "") throw new Error(`${index+1}번 게시글의 장소 값이 올바르지 않습니다.`)
                    else if (value.transportation === "") throw new Error(`${index+1}번 게시글의 이동수단 값이 올바르지 않습니다.`)
                    else if (value.travel_time === "") throw new Error(`${index+1}번 게시글의 이동시간 값이 올바르지 않습니다.`)
                    else if (imageList[index].length < 1 || imageList[index].length > 8) throw new Error(`${index+1}번 게시글의 첨부파일 값이 올바르지 않습니다.`)
                    placeCount += 1
                }
            }

            if (value.is_ad) addCount += 1
        })
        
        // 일반 예외 처리
        if (visitData === null || visitData === undefined || visitData === "") {
            throw new Error("방문날짜 값이 올바르지 않습니다.")
        } else if(togetherValue === null || togetherValue === undefined || togetherValue === "" || togetherValue.length > 100) {
            throw new Error("누구와 함께 값이 올바르지 않습니다.")
        } else if(placeValue === null || placeValue === undefined || placeValue === "" || placeValue.length > 100) {
            throw new Error("지역 값이 올바르지 않습니다.")
        } else if(is_openValue === null || is_openValue === undefined || (is_openValue !== "true" && is_openValue !== "false")) {
            throw new Error("피드 공개 여부 값이 올바르지 않습니다.")
        } else if(feed_placeValue === null || feed_placeValue === undefined || feed_placeValue === "") {
            throw new Error("장소 세부 내용 값이 올바르지 않습니다.")
        } else if(addCount === placeCount) {
            throw new Error("광고의 수는 게시물의 수보다 작아야 합니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            // 피드 데이터 삽입
            const sql = `
                INSERT INTO stepplaceschema.feed(account_index, date, place, together, views, is_open, thanks_cnt, comment_cnt, hash_tag, feed_place, image1, image2, image3, visit_date) 
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING feed_index
            `
            const values = [auth.payload.account_index, moment(), placeValue, togetherValue, [], is_openValue, 0, 0, hash_tagValue, feed_placeValue, image1, image2, image3, visitData]
            const row = await db.query(sql, values)
            const data = row.rows

            // 피드 개수 증가
            const feed_sql = `
                UPDATE stepplaceschema.account
                SET feed_cnt=(feed_cnt + 1)
                WHERE account_index=$1
            `   
            const feed_values = [auth.payload.account_index]
            await db.query(feed_sql, feed_values)
            
            alarm(auth.payload.account_index, null, 0, data[0].feed_index)   // 알람 생성자의 idx, 알람 수신자의 idx, 알람 타입, 이동할 곳

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /feed ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 피드 수정
// Token 2 : Token 내의 account_index 값을 기준으로 권한 체크
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.put("/", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const visitData = req.body.visit_date
    const togetherValue = req.body.together 
    const placeValue = req.body.place
    const hash_tagValue = req.body.hash_tag 
    const is_openValue = req.body.is_open
    const feed_placeValue = JSON.stringify(req.body.feed_place)
    const feed_indexValue = req.body.feed_index

    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {

        // 장소 정보 입력에 대한 예외 처리
        let addCount = 0   // 광고 수 제한하기 위한 변수
        let placeCount = 0   // 광고 수를 계산하기 위한 변수
        JSON.parse(feed_placeValue).forEach((value, index) => {
            if (index === 0 || index === 1) {
                if (value.title === "") throw new Error(`${index+1}번 게시글의 제목 값이 올바르지 않습니다.`)
                else if (value.is_ad === null) throw new Error(`${index+1}번 게시글의 광고 여부 값이 올바르지 않습니다.`)
                else if (value.contents === "") throw new Error(`${index+1}번 게시글의 내용 값이 올바르지 않습니다.`)
                else if (value.spot.name === "") throw new Error(`${index+1}번 게시글의 장소 값이 올바르지 않습니다.`)

                if (index === 1) {   // 두 번째 장소부터 해당되는 예외 처리
                    if (value.transportation === "") throw new Error(`${index+1}번 게시글의 이동수단 값이 올바르지 않습니다.`)
                    else if (value.travel_time === "") throw new Error(`${index+1}번 게시글의 이동시간 값이 올바르지 않습니다.`)
                }

                placeCount += 1
            }
            else if (index == 2) {
                if (value.title === "" && value.is_ad === null && value.contents === "" && value.transportation === "" && value.travel_time === "") {   // 이 경우 3번째 장소가 없는 것이라고 가정
                } else {
                    if (value.title === "") throw new Error(`${index+1}번 게시글의 제목 값이 올바르지 않습니다.`)
                    else if (value.is_ad === null) throw new Error(`${index+1}번 게시글의 광고 여부 값이 올바르지 않습니다.`)
                    else if (value.contents === "") throw new Error(`${index+1}번 게시글의 내용 값이 올바르지 않습니다.`)
                    else if (value.spot.name === "") throw new Error(`${index+1}번 게시글의 장소 값이 올바르지 않습니다.`)
                    else if (value.transportation === "") throw new Error(`${index+1}번 게시글의 이동수단 값이 올바르지 않습니다.`)
                    else if (value.travel_time === "") throw new Error(`${index+1}번 게시글의 이동시간 값이 올바르지 않습니다.`)
                    placeCount += 1
                }
            }

            if (value.is_ad) addCount += 1
        })
        
        // 일반 예외 처리
        if (addCount === placeCount) {
            throw new Error ("설정한 광고의 개수는 입력한 장소 개수 미만이어야 합니다.")
        } else if (visitData === null || visitData === undefined || visitData === "") {
            throw new Error("방문날짜 값이 올바르지 않습니다.")
        } else if(togetherValue === null || togetherValue === undefined || togetherValue === "" || togetherValue.length > 100) {
            throw new Error("누구와 함께 값이 올바르지 않습니다.")
        } else if(placeValue === null || placeValue === undefined || placeValue === "" || placeValue.length > 100) {
            throw new Error("장소 값이 올바르지 않습니다.")
        }  else if(hash_tagValue === null) {
            throw new Error("해쉬태그 값이 올바르지 않습니다.")
        } else if(is_openValue === null || is_openValue === undefined || (is_openValue !== true && is_openValue !== false)) {
            throw new Error("피드 공개 여부 값이 올바르지 않습니다.")
        } else if(feed_placeValue === null || feed_placeValue === undefined || feed_placeValue === "") {
            throw new Error("장소 세부 내용 값이 올바르지 않습니다.")
        } else if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()
            const sql = `
                UPDATE stepplaceschema.feed 
                SET account_index=$1, place=$2, together=$3, is_open=$4, hash_tag=$5, feed_place=$6
                WHERE feed_index=$7 AND account_index=$1
            `
            const values = [auth.payload.account_index, placeValue, togetherValue, is_openValue, hash_tagValue, feed_placeValue, feed_indexValue]
            await db.query(sql, values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("PUT /feed ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 피드 삭제
// Token 2 : Token 내의 account_index 값을 기준으로 권한 체크
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.delete("/", async (req, res) => {

    // Request Data
    let db = null
    const publicToken = req.headers.token
    const feed_indexValue = req.body.feed_index

    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {
        
        if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {
            db = new Client(pgInit)
            await db.connect()

            // 피드 삭제 처리
            const sql = `
                UPDATE stepplaceschema.feed 
                SET is_delete=$1 
                WHERE feed_index=$2 AND account_index=$3
            `   
            const values = [true, feed_indexValue, auth.payload.account_index]
            await db.query(sql, values)

            // 피드 개수 감소
            const feed_sql = `
                UPDATE stepplaceschema.account 
                SET feed_cnt=(feed_cnt - 1) 
                WHERE account_index=$1
            `   
            const feed_values = [auth.payload.account_index]
            await db.query(feed_sql, feed_values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }

    } catch(e) {
        result.message = e.message
        console.log("DELETE /feed ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

// 피드 신고
// Token 3 : Token 내의 account_index 값을 사용하여 db 접근
router.post("/report_it", async (req, res) => {

    // Reuqest Data
    let db = null
    const publicToken = req.headers.token
    const feed_indexValue = req.body.feed_index 
    const account_indexValue = req.body.account_index   // 신고를 당하는 사람의 account_index
    const dateValue = moment()

    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {
        if (feed_indexValue === null || feed_indexValue === undefined || feed_indexValue === "") {
            throw new Error("피드 번호 값이 올바르지 않습니다.")
        } else if (account_indexValue === null || account_indexValue === undefined || account_indexValue === "") {
            throw new Error("사용자 번호 값이 올바르지 않습니다.")
        }

        const auth = verify(publicToken)

        if (auth.success) {

            db = new Client(pgInit)
            await db.connect()

            const sql = `
                INSERT INTO stepplaceschema.report_it(feed_index, account_index, report_account_index, date, is_feed) 
                VALUES($1, $2, $3, $4, $5)
            `
            const values = [feed_indexValue, account_indexValue, auth.payload.account_index, dateValue, true]
            await db.query(sql,values)

            result.success = true
        } else {
            throw new Error(auth.message)
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /feed/report_it ERR : ", e.message)
    }

    if (db) await db.end()
    res.send(result)
})

module.exports = router