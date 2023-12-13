const express = require("express")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")

const app = express();
app.use(cors())
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["POST", "GET"]
    },
})

io.on("connection", (socket)=>{
    console.log("socket.id:",socket.id)

    socket.on("Join_Room",(RoomID)=>{
        socket.join(RoomID)
        console.log(`User with ID ${socket.id} joined room ${RoomID} `)
    })

    socket.on("send_message",(data)=>{
        console.log(`curMessage :${data.message}`)
        socket.to(data.room).emit("receive_message",data)
    })

    socket.on("disconnect", ()=>{
        console.log("disconnect:", socket.id)
    })
})

// io.emit()

server.listen(80, () => {
    console.log("80  go go go go!")
})
