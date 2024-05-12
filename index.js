const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const socketIO = require("socket.io")
const redisClient = require("redis").createClient()
redisClient.connect()
redisClient.on("connect",()=>console.log("Connected to redis"))
redisClient.on("error",(error)=>console.log("Error in Connecting to redis",error.message))
const io = socketIO(server,{
    cors:{
        origin:"*"
    }
})


async function sendMessages(socket){
    
    const data = await redisClient.lRange("messages",0,-1)
    data.map(item => {
        const [from, message] = item.split(":")
        socket.emit("message",{
            from,
            message
        })
    })
}

io.on("connection",(socket)=>{
    sendMessages(socket)
    socket.on("message", data =>{
        const{username:from, message} = data
        redisClient.rPush("messages",`${from}:${message}`)
        io.emit("message",{from,message})

    })
})

app.set("view engine","ejs")
app.get("/",(req,res,next)=>{
    try{
        return res.render("login.ejs")
    }catch(error){
        next(error)
    }
})
app.get("/chat",(req,res,next)=>{
    try{    
        const {username} = req.query
       
        return res.render("chat.ejs",{
            username
        })
    }catch(error){
        next(error)
    }
})
app.use((req,res,next)=>{
    return res.status(404).json({
        statusCode: res.statusCode,
        error:{
            type: "NotFound",
            message: `NotFound ${req.url}`
        }
    })
})
app.use((error,req,res,next)=>{
   
    return res.json({
        statusCode: error.status || 500,
        error:{
            message: error.message || "Interal Server Error"
        }
    })
})

server.listen("8080",()=>{
    console.log("server is running on: http://localhost:8080");
})

