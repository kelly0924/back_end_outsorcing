const router=require("express").Router()
const pgInit=require("../modules/psql")
const {Client}=require("pg")
const elastic=require("@elastic/elasticsearch")
const cors=require("cors")
require("dotenv").config()

const account_es=process.env.ACCOUNT_ES_PROT

async function account_es_insert(data){//date 넣기
    const idValue=data.account_index 
    const profileValue=data.profile
    const nicknameValue=data.nickname
    const is_photographerValue=data.is_photographer
    const introductionValue= nicknameValue//기본 값을 닉네이름 
    const is_following=false //팔로잉은 처음 팔로우 상태 

    console.log(data,"es accouint 데이터?")
    console.log(profileValue,nicknameValue,is_photographerValue,introductionValue)

    const result={
        "success":false
    }
    const esConnect=new elastic.Client({
        node:account_es //account node
    }) 
    
   
    try{

        
        // index 생성하기 
        // await esConnect.indices.create({
        //     index: 'account',
        //     body: {
        //         settings: {
        //             number_of_replicas: 1
        //         }
        //     }
        
        // })

        // await esConnect.indices.close({
        //     index: 'account'
        // })
    
        // //es 셋팅
        // await esConnect.indices.putSettings({
        //     index: 'account',
        //     body: {
        //         settings: {
        //             analysis: {
        //                 analyzer: {
        //                     my_analyzer: { 
        //                         type:"custom",
        //                         tokenizer:"standard",
        //                     }
                        
        //                 }
        //             }
        //         }
        //     }

        // })

        // await esConnect.indices.putMapping({
        //     index: 'account',
        //     body: {
        //         mappings:{
        //             properties:{
        //                 nickname: {
        //                     type:'text',
        //                     analyzer:"my_analyzer"
        //                 },
        //                 introduction: {
        //                     type:'text',
        //                     analyzer:"my_analyzer"
        //                 },
        //                 profile: {
        //                     type: "keyword",
        //                     analyzer:"my_analyzer"
        //                 },
        //                 is_photographer: {
        //                     type: 'boolean',
        //                     analyzer:"my_analyzer"
        //                 },
        //                 following: {
        //                     type: 'boolean',
        //                     analyzer:"my_analyzer"
        //                 }

        //             }
        //         }
        //     }
        

        // })
        
        // await esConnect.ping({requestTimeout:1000})
        await esConnect.index({
            index:"account",//index 는 elsaticserach의 단일 데이터 단이인 도큐먼트를 모아 놓은 집한 이다. 
            id: idValue,
            body:{//document 넣기 
                nickname: nicknameValue,
                profile: profileValue,
                is_photographer : is_photographerValue,
                introduction : introductionValue,
                following: is_following  
                
            }
        })
        return true

    }catch(err){
        console.log(err.message,"index es 오류")
    }
    
}

module.exports=account_es_insert