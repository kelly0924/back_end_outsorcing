// Log 삽입 모듈

const MongoClient = require('mongodb').MongoClient

const url = process.env.MONGO_URL

const logFun = (api_name, req_host, req_data, res_data, api_call_time) => {

    MongoClient.connect(url, (err, db) => {

        if (err) {
            console.log("mongodb Error : ", err.message)
        }
        const dbo = db.db("stepplace")
        const myobj = {
            "apiName" : api_name,
            "reqHost" : req_host,
            "reqData" : req_data,   //요청한 데이터 기록
            "resDate" : res_data,   // 응답한 데이터 기록
            "apiCallTime" : api_call_time
        }

        dbo.collection("record").insertOne(myobj, (err, res) => {
            if (err){
                console.log(err.message)
            }
            db.close()
        })
    })
}

module.exports = logFun