import { ServerRequest,
         Response as ServerResponse ,
         listenAndServe,serve,
         HTTPOptions } from "../vendor/core/http/http.ts";


import * as Eta from '../vendor/core/eta_Engine.ts';

import { Router } from "./RouterHandle.ts"

import {serveFile} from '../vendor/core/http/http_file_server.ts'

import {msgStatus,errCatch} from './errrespHandle.ts';

export type ISameSite = "Strict" | "Lax" | "None";

export interface ICookie {
    // Name Cookie
    name: string;
    // Value Cookie
    value: string;
    // The maximum lifetime of the cookie as an HTTP-date timestamp
    expires?: Date;
    // Number of seconds until the cookie expires
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?:ISameSite;
  }
interface IRedirect{
    status:number,
    location:string
}

interface IRes{
    status?: number;
    headers?:HeadersInit;
    content?:any;
    body?: Uint8Array | Deno.Reader | string | any;
}

export type TMiddleware = (next:()=>void)=>any;

export class Request {
     static body:any
     static path:string
     static query:object
     static redirect:IRedirect
     static headers:Headers
     static method:string
     static RequestServ:any
     static params:object
     static cookieList:ICookie
     static HTTPoption:HTTPOptions
     static HeaderList:any

     static addResponseHeader(init?:HeadersInit){
        Request.HeaderList = init
     }

     static getHeader(name:string){
         return Request.RequestServ.headers.get(name);
     }

     static setCookie(cokie:ICookie):void{
        Request.cookieList = cokie
     }
     static getCookie():object{
        let CookieHeader = Request.RequestServ.headers.get("Cookie");
        let toJ = '{"'+CookieHeader.replace(/;/g, '","')
        .replace(/=/g, '":"') + '"}'
         return JSON.parse(toJ)
     }

     static deleteCookie(name:string):void{
        Request.setCookie({
            name: name,
            value: "",
            expires: new Date(0),
        })
     }

     static getQuery():object{

        let search = Request.RequestServ.url.split('?')[1];

        let getQuery = '{"' + decodeURI(search)
        .replace(/"/g, '\\"').replace(/&/g, '","')
        .replace(/=/g, '":"') + '"}'

        if (getQuery === '{"undefined"}' || getQuery === '{""}') {
           return {}
        } else {
          return JSON.parse(getQuery)
        }
     }

     static async formField():Promise<object> {
        const x = await Deno.readAll(Request.body)
        const decoder =new TextDecoder()
        const vol =decoder.decode(x)
        if (Request.RequestServ.headers.get("Content-Type").split(";")[0] === "application/x-www-form-urlencoded") {
            const g = JSON.parse('{"' + vol.replace(/&/g, "\",\"").replace(/=/g,"\":\"") + '"}')
            return g
        }else{
            return {}
        }
     }

     static toResponse(Respon:IRes={status:200,content:'text/plain'}){
        const header=new Headers({...Respon.headers,...Request.HeaderList})

        let x = Request.cookieList
        if (x == undefined) {
        }else{
            let q:Array<string> = []
            q.push(`${x.name}=${x.value}`)
            q.push(`${x.expires ? ";Expires=" + x.expires : ""}`)
            q.push(`${x.domain ? ";domain=" + x.domain : "" }`)
            q.push(`${x.path ? ";path=" + x.path : ""}`)
            q.push(`${x.maxAge ? ";Max-Age=" + x.maxAge : ""}`)
            q.push(`${x.secure ? ";secure" : ""}`)
            q.push(`${x.httpOnly ? " ;HttpOnly": ""}`)
            q.push(`${x.sameSite ? ";SameSite="+x.sameSite : "" }`)
            header.append("Set-Cookie",`${q.join(' ')}`)
        }

        header.append("Content-Type",Respon.content == undefined ? "text/plain charset=utf-8" : Respon.content)

        Request.RequestServ.respond({
            status:Respon.status,
            body:Respon.body,
            headers:header
        }).catch(() => {})
    }



     static async toView(file:string,data:any):Promise<any>{
        try{
           const decoder = new TextDecoder("utf-8");
           const datax = await Deno.readFile(file);
           await Request.toResponse({
               status:200,
               content:' text/html; charset=UTF-8',
               body:await EtaEngine(decoder.decode(datax),data)
           })
        }catch(error){


            return Request.toResponse({

                status:500,
                content:'text/html; charset=utf-8',
                body:errCatch("File Not Found",Request)
            })
        }
     }

     static toRedirect(status:number, toLocation:string){
         Request.toResponse({
             status:status,
             headers:{
                 "Location":toLocation
             }
         })
     }

     static toResponseJson(Json:Array<any> | any ,status:number = 200 ,headers:HeadersInit = {}){
        Request.toResponse({
            content:'application/json',
            body:JSON.stringify(Json),
            headers:headers
        })
     }
}

async function EtaEngine(FileString:string,data:object = {}){
    return await Eta.render(FileString,data)
}

function stepper (...steps:TMiddleware[]):any{
    const [ step, ...next] = steps
    return (step) ? step(()=>stepper(...next)):undefined
}

function handle(req:ServerRequest){
    Request.RequestServ = req
    Request.body = req.body
    Request.path = req.url.split('?')[0]
    Request.headers = req.headers
    Request.method = req.method
}

async function RouterHandle(req:any,middleware:TMiddleware[]){
    function NotFoundReq(){
        return req.respond({
            status:404,
            content:'text/html; charset=utf-8',
            body:msgStatus(404,'NotFound')
      })
    }

    for (const r of Router.TableRoute) {
        if (r.path === Request.path && r.method === Request.method) {
            try {
                function Corelayer(next:any){
                    r.handle()
                    next()
                }

                return stepper(...r.middleware,...middleware,Corelayer)

            } catch (error) {

                return Request.toResponse({
                    status:500,
                    content:'text/html; charset=utf-8',
                    body:errCatch(error.stack,Request)
                })
            }
        }
     }
     const urlPath = await Request.path.split('/')
     if (urlPath[1] === 'public') {
       try {

            const FileContent= await serveFile(req,`${Deno.cwd()}/${await Request.path}`)
            return await req.respond(FileContent)

       } catch (error) {
           if (error && error instanceof Deno.errors.NotFound) {
            NotFoundReq()
           }else{

            return Request.toResponse({
                status:500,
                content:'text/html; charset=utf-8',
                body:errCatch(error.stack,Request)
            })
           }
       }
     } else {
        NotFoundReq()
     }
}



export async function AppServe(f:()=>Promise<any>,opt:HTTPOptions,middleware:TMiddleware[] = []):Promise<any>{
    const s = serve(opt);
    console.log(`\u001b[34;1m ⚙️  App Runing at : http://${opt.hostname ? opt.hostname : "0.0.0.0"}:${opt.port}`);
    for await (const req of s) {
        try {
             await handle(req)
             await f()
             await RouterHandle(req,middleware)
            Router.TableRoute = []
        } catch (error) {
            req.respond({
                status:500,
                body:`${error}`
            })
        }
  }
}