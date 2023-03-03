const router=require("express").Router()
const cors=require("cors")
require("dotenv").config()
const pgInit=require("../modules/psql")
const {Client}=require("pg")
const moment=require("../modules/moment")
const logFun=require("../modules/logging")
const jwt=require("jsonwebtoken")
const verify=require("../modules/verify")


const comment_list=(feed_indexValue,account_indexValue)=>{

    const apiName="comment" + req.url
    const reqHost=req.headers.reqHost
    const reqData=[feed_indexValue,account_indexValue]
    const apiCallTime=moment()
    const resData=""
    
   
    const result={
        "data": null,
        "message":null
    }

    try{
        const db=new Client(pgInit)
        db.connect((err)=>{
            if(err) {
                console.log(err)
            }
        })
        const sql=`SELECT stepplaceschema.account.profile,stepplaceschema.account.name,stepplaceschema.account.is_photographer,stepplaceschema.comment.feed_index,stepplaceschema.comment.comment_index,stepplaceschema.comment.contents,stepplaceschema.comment.date,stepplaceschema.comment.is_comment_secret 
                    FROM stepplaceschema.account JOIN stepplaceschema.comment ON stepplaceschema.comment.feed_index=$1 and stepplaceschema.account.account_index =$2`
        const values=[feed_indexValue,account_indexValue]
        db.query(sql,values,(err,row)=>{
            if(!err){
                result.data=row.rows
                result.message="성공"
            }else{
                console.log(err)
            }
            //로깅 함수
            logFun(apiName,reqHost,reqData, result.data,apiCallTime)
            db.end()
        })
    
        
    }catch(e){
        result.message=("에러는 다음과 같습니다.",e)
        res.send(result)
    }



}

module.exports=comment_list