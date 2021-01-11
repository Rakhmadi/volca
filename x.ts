import {AppServe,Request,Router,Multipart,str_random,num_random} from "./mod.ts"


function Routerhandle(){
    Router.get('/x',async ()=>{
        
        return Request.toResponse({
            content:'text/plain',
            body:'Hello World'
        })
     })

     Router.get('/u',()=>{
        Request.toRedirect(303,'/x')
     })

     Router.get('/post/:id',()=>{
         Request.toResponse({
             content:'application/json',
             body:JSON.parse(Request.params)
         })
     })

     Router.get(`/Article/:slug/Category/:category`,()=>{
        Request.toResponseJson([{"Params":Request.params}],200,{})
     })
     
     Router.post('/post',async()=>{
         let form = await Multipart.ReadAll()
       
         if (form.files.ssss != undefined) {
            await Deno.writeFile(`${num_random(10,12)}.jpg`, form.files.ssss.content); 
         }

         return Request.toResponse({
             status:200,
             content:'text/plain',
             body:form
         })

         
     })
    
     Router.get('/g',()=>{
       Request.toResponseJson([{
           "Query":Request.query,
           "token":str_random(3000)
        }],200,{})
     })

     Router.get('/random',()=>{
         Request.toResponseJson([{
             "str_random":str_random(30),
             "num_random":num_random(12,20),
             "token":str_random(3000)
         }],200)
     })

     Router.get('/tmp',async ()=>{
         var g  = [{
            "userId": 1,
            "id": 1,
            "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
          },
          {
            "userId": 1,
            "id": 2,
            "title": "qui est esse",
            "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla"
          }]
        let m:any
        for (const iterator of g) {
            m+=`<li>${iterator.title}</li>`+`<li>${iterator.body}</li>`+`<br>`
        }
        await Request.toView('tmp.eta.html',{x:m,y:`${str_random(4)}`,d:[{
            "userId": 1,
            "id": 1,
            "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
          },
          {
            "userId": 1,
            "id": 2,
            "title": "qui est esse",
            "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla"
          }]})
    })
    Router.get('/1tmp',async ()=>{
        var g  = [{
           "userId": 1,
           "id": 1,
           "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
           "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
         },
         {
           "userId": 1,
           "id": 2,
           "title": "qui est esse",
           "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla"
         }]
       let m:any
       for (const iterator of g) {
           m+=`<li>${iterator.title}</li>`+`<li>${iterator.body}</li>`+`<br>`
       }
       await Request.toView('1tmp.eta.html',{x:m,y:`${str_random(4)}`,d:[{
           "userId": 1,
           "id": 1,
           "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
           "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
         },
         {
           "userId": 1,
           "id": 2,
           "title": "qui est esse",
           "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla"
         }]})
   })
    }
    


    
AppServe(()=>{
    Routerhandle()
},{port: 8000})

