"use client"

import React, { useEffect, useRef, useState } from 'react'

interface I_Chat {
    socket: any,
    userName: string,
    room: string
}

type I_messageData = {
    room: string,
    author: string,
    message: string,
    time: any,
    // type: 'text' | "song"
    // otherInfo?: I_OtherInfo
}

type I_OtherInfo = {
    artists: string | null
    songName: string | null
    albumImg: string | null
    preview_url: string | null

}


function Chat({ socket, userName, room }: I_Chat) {
    const [currentMessage, setCurrentMessage] = useState("")
    const [MessageList, setMessageList] = useState<I_messageData[]>([])

    //spotify
    const [musicData, setMusicData] = useState<any>([]);
    const [SearchValue, setSearchValue] = useState("");
    const [accessToken, setAccessToken] = useState("");

    // 對話框
    const dialogueBlockRef = useRef<HTMLDivElement>(null)

    // 音樂
    const audioRef = useRef<HTMLAudioElement>(null)
    const [musicUrl, setMusicUrl] = useState("")
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);


    const handleSelectMusic = (url: string | undefined) => {
        if (!url) return
        setMusicUrl(url)
    }

    const handlePlaySpotify = () => {
        audioRef.current?.load()
        if (isAudioPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsAudioPlaying(prev => !prev);
    }

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
        setCurrentMessage('')
    }


    useEffect(() => {
        const authParameters = {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded", // 在這裡修正標頭名稱
            },
            body:
                "grant_type=client_credentials&client_id=" +
                process.env.NEXT_PUBLIC_CLIENT_ID +
                "&client_secret=" +
                process.env.NEXT_PUBLIC_CLIENT_SECRET,
        };

        fetch("https://accounts.spotify.com/api/token", authParameters)
            .then((res) => res.json())
            .then((data) => setAccessToken(data.access_token));
    }, []);

    const handleSearch = () => {
        const artistParameters = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + accessToken,
            },
        };

        const replacedText = SearchValue.replace(/\s/g, "_");
        fetch(
            `https://api.spotify.com/v1/search?q=${replacedText}&type=track`,
            artistParameters
        )
            .then((res) => res.json())
            .then((data) => setMusicData(data?.tracks?.items))
            .then(() => setSearchValue(""))
            .catch();
    }

    useEffect(() => {
        if (dialogueBlockRef.current === null) return
        (dialogueBlockRef.current).scrollIntoView({
            behavior: "smooth",
            block: "end",
        })
    }, [MessageList.length])

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



    return (
        <div className='border p-4 flex flex-col gap-3'>
            <header className=''>Live Chat</header>
            <div className='border h-[300px] overflow-y-scroll p-3 flex flex-col gap-3'
            >
                {MessageList?.map((MessageContent, i) => {
                    return (
                        <div key={i} className={'p-3'}
                            ref={dialogueBlockRef}
                        >
                            <p className={MessageContent.author === userName ? 'text-right bg-red-600 rounded p-3' : "bg-red-400 rounded p-3"}>
                                {MessageContent.message}
                            </p>
                            <p className='text-xs text-gray-500'>{`${MessageContent.author} ${MessageContent.time}`}</p>
                        </div>

                    )
                })}
            </div>
            <footer className='flex flex-col gap-3'>
                {musicData.length === 0 && <div className='flex items-center justify-center gap-3'>
                    <input type="text" className='text-black p-2' placeholder='收尋音樂...' onChange={(e) => { setSearchValue(e.target.value) }} value={SearchValue} />
                    <button className='border p-3' onClick={handleSearch}>&#9658;</button>
                </div>}
                <div className='flex gap-1 overflow-x-auto w-[300px]'>
                    <audio ref={audioRef} controls className='invisible absolute top-[-99999px]'>
                        <source src={musicUrl} type="audio/mpeg" />
                    </audio >
                    {musicData?.map((music: any, i: number) => (
                        <div key={i} className='flex items-center gap-1 shrink-0 cursor-pointer' onClick={() => handleSelectMusic(music?.preview_url)}>
                            <div className='rounded-full overflow-hidden w-10 h-10 border'>
                                <img className='h-full object-cover' src={music?.album.images[0].url} />
                            </div>
                            <div className='p-3 grow'>
                                <p className='font-bold'>{music?.name}</p>
                                <p className='text-xs'>{music?.artists[0].name}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button className='border p-3' onClick={handlePlaySpotify}>試聽</button>
                <div className='flex items-center justify-center gap-3'>
                    <input className='text-black p-2' type="text" placeholder='message...' onChange={(e) => { setCurrentMessage(e.target.value) }} value={currentMessage} />
                    <button className='border p-3' onClick={sendMessage}>&#9658;</button>
                </div>

            </footer>
        </div>
    )
}

export default Chat
