const router=require("express").Router()
const elastic=require("@elastic/elasticsearch")
const cors=require("cors")
require("dotenv").config()

const account_es=process.env.ACCOUNT_ES_PROT

async function modify_es_introduction(account_indexValue,introductionValue){
    const idValue=account_indexValue

    const esConnect=new elastic.Client({
        node:account_es //account node
    }) 

    try{
        //await esConnect.ping({requestTimeout:1000})
        await esConnect.update({
            index:"account",//index 는 elsaticserach의 단일 데이터 단이인 도큐먼트를 모아 놓은 집한 이다. 
            id:idValue,
            body:{//document 넣기 
                doc:{
                    introduction : introductionValue
                }
            }
        })

    }catch(err){
        console.log(err)
    }
    
}

module.exports=modify_es_introduction
