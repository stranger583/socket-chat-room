"use client"

import React, { useEffect, useRef, useState } from 'react'
import { musicIcon,PictureIcon,sendIcon } from '../icons/icon'


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
    type: string
    otherInfo?: I_OtherInfo
}

type I_OtherInfo = {
    artists: string
    songName: string
    albumImg: string
    preview_url?: string

}

interface ExtendedHTMLInputElement extends HTMLInputElement {
    composing: boolean;
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
    const [musicInfo, setMusicInfo] = useState<I_OtherInfo>()
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    const handleSelectMusic = (music: any) => {
        if (music?.preview_url) setMusicUrl(music.preview_url)
        setMusicInfo({
            artists: music?.artists[0].name,
            songName: music.name,
            albumImg: music?.album.images[0].url,
            preview_url: music?.preview_url
        })
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            const inputElement = e.target as ExtendedHTMLInputElement;
            if (inputElement.composing === true) return;
            sendMessage();
        }
    };

    const handleCompositionStart = (event: React.CompositionEvent<HTMLTextAreaElement>) => {
        const inputElement = event.target as ExtendedHTMLInputElement;
        inputElement.composing = true;
    }
    const handleCompositionEnd = (event: React.CompositionEvent<HTMLTextAreaElement>) => {
        const inputElement = event.target as ExtendedHTMLInputElement;
        inputElement.composing = false;
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
            time: new Date((Date.now())).getHours() + ":" + new Date(Date.now()).getMinutes(),
            type: "text",
        }

        await socket.emit("send_message", messageData)
        setMessageList((list) => [...list, messageData])
        setCurrentMessage('')
    }

    const sendMusic = async (musicInfo: any) => {
        if (!musicInfo) return
        console.log("----------------------------", musicInfo,)
        const messageData = {
            room: room,
            author: userName,
            message: "",
            time: new Date((Date.now())).getHours() + ":" + new Date(Date.now()).getMinutes(),
            type: "music",
            otherInfo: {
                artists: musicInfo?.artists,
                songName: musicInfo?.songName,
                albumImg: musicInfo?.albumImg,
                preview_url: musicInfo?.preview_url
            }
        }
        await socket.emit("send_message", messageData)
        setMessageList((list) => [...list, messageData])
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
            <div className='border h-[300px] overflow-y-scroll p-3 flex flex-col gap-2 items-end'
            >
                {MessageList?.map((MessageContent, i) => {
                    return (
                        <div key={i} className={'w-max break-words max-w-[236px]'}
                            ref={dialogueBlockRef}
                        >
                            {MessageContent.type === "text" ?
                                (<p className={MessageContent.author === userName ? 'rounded-[20px] bg-red-600 w-max p-2 text-sm' : "bg-red-400 rounded p-3 "}>
                                    {MessageContent.message}
                                </p>) : (
                                    <div className='w-[236px] flex items-center gap-1 shrink-0 cursor-pointer border p-2 rounded-lg' onClick={handlePlaySpotify}>
                                        <div className='rounded-full overflow-hidden w-10 h-10 border'>
                                            <img className='h-full object-cover' src={MessageContent?.otherInfo?.albumImg} />
                                        </div>
                                        <div className='p-1 grow'>
                                            <p className='font-bold'>{MessageContent?.otherInfo?.songName}</p>
                                            <p className='text-xs'>{MessageContent?.otherInfo?.artists}</p>
                                        </div>
                                    </div>

                                )
                            }
                            <p className='text-xs text-gray-500 mt-1'>{`${MessageContent.author} ${MessageContent.time}`}</p>
                        </div>

                    )
                })}
            </div>
            <footer className='flex flex-col gap-3'>
                <div className='flex gap-1 overflow-x-auto w-[300px]'>
                    <audio ref={audioRef} controls className='invisible absolute top-[-99999px]'>
                        <source src={musicUrl} type="audio/mpeg" />
                    </audio >
                    {musicData?.map((music: any, i: number) => (
                        <div key={i} className='flex items-center gap-1 shrink-0 cursor-pointer' onClick={() => handleSelectMusic(music)}>
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
                {
                    // musicData.length === 0 && 
                    <div className='flex items-center justify-center gap-3 border p-1 rounded-[20px]'>
                        <input type="text" className='text-white p-2 bg-transparent text-sm grow outline-none' placeholder='收尋音樂...' onChange={(e) => { setSearchValue(e.target.value) }} value={SearchValue} />
                        <button className='p-2 text-sm' onClick={handleSearch}>&#9658;</button>
                    </div>
                }

                <button className='border p-3' onClick={handlePlaySpotify}>試聽</button>
                <button className='border p-3' onClick={() => sendMusic(musicInfo)}>發送音樂</button>
                <div className='flex items-center justify-center gap-3 border px-3 py-2 rounded-[20px]'>
                    <textarea
                        className='text-white px-2  bg-transparent text-sm grow outline-none resize-none h-5 max-h-52 '
                        placeholder='message...'
                        onKeyDown={handleKeyPress}
                        onChange={(e) => { setCurrentMessage(e.target.value) }}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd} value={currentMessage} />
                    <div className='flex items-center gap-2'>
                        {currentMessage.length !==0 && <button className='text-sm' onClick={sendMessage}>{sendIcon}</button>}
                        {currentMessage.length ===0 && <button className=' text-sm'>{musicIcon}</button>}
                        {currentMessage.length ===0 && <button className='text-sm'>{PictureIcon}</button>}
                    </div>

                </div>

            </footer>
        </div>
    )
}

export default Chat
