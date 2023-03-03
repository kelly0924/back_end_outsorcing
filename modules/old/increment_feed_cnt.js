
const router=require("express").Router()
const cors=require("cors")
require("dotenv").config()
const pgInit=require("../modules/psql")
const {Client}=require("pg")

const increment_feed_cnt=(account_indexValue)=>{

    const db=new Client(pgInit)
    db.connect((err)=>{
        if(err) {
            console.log(err)
        }
    })
    const sql=`UPDATE stepplaceschema.account SET feed_count = (select count(feed_index) from stepplaceschema.feed  where account_index =$1) where account_index=$2`
    const values=[account_indexValue,account_indexValue]
    db.query(sql,values,(err,data)=>{
        if(!err){
        }else{
            console.log(err)
        }
        
        db.end()
    })

}

module.exports=increment_feed_cnt