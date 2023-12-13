"use client"
import { useState } from 'react'
import io from "socket.io-client"
import Chat from './components/chat'

const socket = io("http://localhost:80/")

export default function Home() {

  const [userName, setUserName] = useState("")
  const [room, setRoom] = useState("")
  const [showChat, setShowChat] = useState(false)


  const HandleJoinRoom = () => {
    if (userName === "" || room === "") return
    socket.emit("Join_Room", room)
    setShowChat(true)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {!showChat && <div className='flex flex-col gap-5 p-4 justify-center items-center' >
        <h3 className='font-semibold text-3xl'>Join A Chat</h3>
        <input className='text-black p-2 rounded' type="text" placeholder='name' onChange={(e) => { setUserName(e.target.value) }} value={userName} />
        <input className='text-black p-2 rounded' type="text" placeholder='Room ID' onChange={(e) => { setRoom(e.target.value) }} value={room} />
        <button className='p-2 w-full bg-red-600 rounded ' onClick={HandleJoinRoom}>Join a room</button>
      </div>}
      {showChat && <Chat room={room} userName={userName} socket={socket} />}
    </main>
  )
}
