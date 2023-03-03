const router=require("express").Router()
const elastic=require("@elastic/elasticsearch")
const cors=require("cors")
require("dotenv").config()
const pgInit=require("./psql")
const {Client}=require("pg")

const account_es=process.env.ACCOUNT_ES_PROT

async function feed_es_insert(data){//date 넣기

        let  idValue=0
        let feed_indexValue=0
        let visit_dateValue=""
        let upload_dateValue=""
        let  togetherValue=""
        let thanks_cntValue=0
        let  viewsValue=0
        let  locationValue=""
        let imageValue=""
        let titleValue=""

        for(let i = 0; i<data.length; i++){
            idValue=data[i].feed_index
            feed_indexValue=data[i].feed_index
            visit_dateValue=data[i].visit_date
            upload_dateValue=data[i].date 
            togetherValue=data[i].together
            thanks_cntValue=data[i].thanks 
            viewsValue=data[i].views 
            locationValue=data[i].place 
            imageValue=data[i].image 
            titleValue=data[i].title

            const esConnect=new elastic.Client({
                node:account_es //account node
            }) 
        
            try{
        
                //await esConnect.ping({requestTimeout:1000})
                await esConnect.index({
                    index:"feed",//index 는 elsaticserach의 단일 데이터 단이인 도큐먼트를 모아 놓은 집한 이다. 
                    id: idValue,//feed를 구분하는 key를 사용
                    body:{//document 넣기 
                        feed_index: feed_indexValue,
                        together: togetherValue,
                        visit_date: visit_dateValue,
                        upload_date: upload_dateValue,
                        thanks_cnt: thanks_cntValue,
                        views: viewsValue,
                        location: locationValue,
                        image: imageValue,
                        title: titleValue 
                    }
                })
                return true
        
            }catch(err){
                console.log(err)
            }
        }


    
}

module.exports=feed_es_insert