"use client"

import React, { useEffect, useState } from 'react'

interface I_Chat {
    socket: any,
    userName: string,
    room: string
}

type I_messageData = {
    room: string,
    author: string,
    message: string,
    time: any
}

function Chat({ socket, userName, room }: I_Chat) {
    const [currentMessage, setCurrentMessage] = useState("")
    const [MessageList, setMessageList] = useState<I_messageData[]>([])

    const sendMessage = async () => {
        if (currentMessage === "") return
        const messageData = {
            room: room,
            author: userName,
            message: currentMessage,
            time: new Date((Date.now())).getHours() + ":" + new Date(Date.now()).getMinutes()
        }

        await socket.emit("send_message", messageData)
        setMessageList((list) => [...list, messageData])
    }

    useEffect(() => {
        socket.on("receive_message", (data: I_messageData) => {
            console.log(data)
            setMessageList((list) => [...list, data])
        })
        return () => {
            // 在組件卸載時取消訂閱
            socket.off("receive_message");
        };
    }, [socket])

    console.log(MessageList)

    return (
        <div className='border p-4 flex flex-col gap-3'>
            <header className=''>Live Chat</header>
            <main className='border h-[300px] overflow-y-scroll p-3 flex flex-col gap-3'>
                {MessageList?.map((MessageContent, i) => {

                    return (
                        <div key={i} className={'p-3'}>
                            <p className={MessageContent.author === userName ? 'text-right bg-red-600 rounded p-3' : "bg-red-400 rounded p-3"}>{MessageContent.message}</p>
                            <p className='text-xs text-gray-500'>{`${MessageContent.author} ${MessageContent.time}`}</p>
                        </div>

                    )
                })}
            </main>
            <footer className='flex items-center justify-center gap-3'>
                <input className='text-black' type="text" placeholder='message...' onChange={(e) => { setCurrentMessage(e.target.value) }} value={currentMessage} />
                <button className='border p-3' onClick={sendMessage}>&#9658;</button>
            </footer>
        </div>
    )
}

export default Chat
