"use client"

import React, { useEffect, useRef, useState } from 'react'
import { PhoneIcon, VideoIcon, musicIcon, PictureIcon, sendIcon, CloseIcon, recordIcon } from '../icons/icon'


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

type InputType = "text" | "spotify" | "audio" | "picture"
const mimeType = "audio/webm";

function Chat({ socket, userName, room }: I_Chat) {
    const [currentMessage, setCurrentMessage] = useState("")
    const [MessageList, setMessageList] = useState<I_messageData[]>([])

    //  圖片檔案
    const [files,setFiles] = useState([])
    const filesRef = useRef<HTMLInputElement>(null)

    const handleClickFile = () => filesRef.current?.click()
    const onChangeFile = (event:React.ChangeEvent<HTMLInputElement>) => {
        const fileObj = event.target.files 
        if(!fileObj) return
        console.log(fileObj)

        event.target.files = null;
    }

    //spotify
    const [isSpotifyInput, setIsSpotifyInput] = useState(false)
    const [musicData, setMusicData] = useState<any>([]);
    const [SearchValue, setSearchValue] = useState("");
    const [accessToken, setAccessToken] = useState("");

    // 對話框
    const dialogueBlockRef = useRef<HTMLDivElement>(null)
    const [inputType, setInputType] = useState<InputType>("text")

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
    // 錄音 
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    // const audioRef2 = useRef<HTMLAudioElement | null>(null);
    // const [isPlaying, setIsPlaying] = useState(false);

    const startRecording = async () => {
        try {
            // 取得使用者媒體設備的音訊權限
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // 創建 MediaRecorder 實例
            const mediaRecorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            // 資料可用時觸發的事件處理函數
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            // 錄製停止時觸發的事件處理函數
            mediaRecorder.onstop = () => {
                // 將音訊資料轉換為 Blob
                const blob = new Blob(chunks, { type: 'audio/wav' });
                setAudioBlob(blob);
            };

            // 開始錄製
            mediaRecorder.start();
            setIsRecording(true);
            mediaRecorderRef.current = mediaRecorder;
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // 停止 MediaRecorder
            mediaRecorderRef.current.stop();
            // 更新錄製狀態
            setIsRecording(false);
        }
    }

    // const playRecording = () => {
    //     if (audioBlob) {
    //         const audioURL = URL.createObjectURL(audioBlob);
    //         audioRef2.current.src = audioURL;
    //         audioRef2.current.play()
    //             .then(() => setIsPlaying(true))
    //             .catch(error => console.error('Error playing recording:', error));
    //     }
    // };

    // const stopPlaying = () => {
    //     if (audioRef2.current) {
    //         audioRef2.current.pause();
    //         audioRef2.current.currentTime = 0;
    //         setIsPlaying(false);
    //     }
    // };


    const sendAudioRecording = async () => {
        if (!audioBlob) return;

        try {
            // 將音訊 Blob 資料轉換成 ArrayBuffer
            const arrayBuffer = await audioBlob.arrayBuffer();

            // 將 ArrayBuffer 轉換成 base64 字串
            const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            const messageData = {
                room: room,
                author: userName,
                message: "",
                time: new Date((Date.now())).getHours() + ":" + new Date(Date.now()).getMinutes(),
                type: "recording",
                otherInfo: {
                    artists: "",
                    songName: "",
                    albumImg: "",
                    preview_url: `data:audio/wav;base64,${base64String}`
                }
            }

            await socket.emit("send_message", messageData)
            setMessageList((list) => [...list, messageData])

        } catch (error) {
            console.error('Error sending audio recording:', error);
        }
    };

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

    const handlePlaySpotify = (previewUrl?: string) => {
        if (!previewUrl) return
        setMusicUrl(previewUrl)
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

    // todo 思考有沒有更好的寫法，不用直接改變物件
    useEffect(() => {
        if (!musicUrl) return
        handlePlaySpotify()
    }, [musicInfo])

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

    console.log("audioBlob", audioBlob)
    return (
        <div className='border border-white/30 flex flex-col gap-1'>
            <header className='p-4 border-b border-white/30 flex items-center justify-between'>
                <span>
                    Live Chat 。 {room}
                </span>
                <div className='flex gap-2'>
                    <button>
                        {PhoneIcon}
                    </button>
                    <button>
                        {VideoIcon}
                    </button>
                </div>
            </header>
            <div className=' h-[300px] overflow-y-scroll p-3 flex flex-col gap-2'>
                {MessageList?.map((MessageContent, i) => {
                    return (
                        <div key={i} className={MessageContent.author === userName ? 'w-max break-words max-w-[236px] self-end ' : 'w-max break-words max-w-[236px] '}
                            ref={dialogueBlockRef}
                        >
                            {MessageContent.type === "text" &&
                                (<p className={MessageContent.author === userName ? 'rounded-[20px] bg-[#383838] w-max px-3 py-2 text-sm' : "rounded-[20px] border border-white/30 w-max px-3 py-2 text-sm"}>
                                    {MessageContent.message}
                                </p>)
                            }
                            {MessageContent.type === "music" && (
                                <div className='w-[236px] flex items-center gap-1 shrink-0 cursor-pointer border border-white/30 p-2 rounded-lg' onClick={() => handlePlaySpotify(MessageContent?.otherInfo?.preview_url)}>
                                    <div className='rounded-full overflow-hidden w-10 h-10 border border-white/30'>
                                        <img className='h-full object-cover' src={MessageContent?.otherInfo?.albumImg} />
                                    </div>
                                    <div className='p-1 grow'>
                                        <p className='font-bold w-32 overflow-hidden whitespace-nowrap text-ellipsis'>{MessageContent?.otherInfo?.songName}</p>
                                        <p className='text-xs w-32 overflow-hidden whitespace-nowrap text-ellipsis'>{MessageContent?.otherInfo?.artists}</p>
                                    </div>
                                </div>

                            )}
                            {
                                MessageContent.type === "recording" && (
                                    <div className='w-[236px] flex items-center gap-1 shrink-0 cursor-pointer border border-white/30 p-2 rounded-lg' onClick={() => handlePlaySpotify(MessageContent?.otherInfo?.preview_url)}>
                                        <div>paly</div>
                                        <div>lllll</div>
                                        <div>00:02</div>
                                    </div>
                                )
                            }
                            {/* <p className='text-xs text-gray-500 mt-1'>{`${MessageContent.author} ${MessageContent.time}`}</p> */}
                        </div>

                    )
                })}
            </div>
            <footer className='flex flex-col gap-2 pt-4'>

                {isSpotifyInput &&
                    <>
                        <div className='flex gap-1 overflow-x-auto w-[300px] border-t border-white/30 px-4 pt-1'>
                            {musicData?.map((music: any, i: number) => (
                                <div key={i} className='flex items-center gap-1 shrink-0 cursor-pointer' onClick={() => handleSelectMusic(music)}>
                                    <div className='rounded-full overflow-hidden w-10 h-10 border border-white/30'>
                                        <img className='h-full object-cover' src={music?.album.images[0].url} />
                                    </div>
                                    <div className='p-3 grow '>
                                        <p className='font-bold w-24 overflow-hidden whitespace-nowrap text-ellipsis'>{music?.name}</p>
                                        <p className='text-xs w-24 overflow-hidden whitespace-nowrap text-ellipsis'>{music?.artists[0].name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className='flex text-sm px-4 gap-3 border-b border-white/30 pb-3'>
                            <button className='border border-white/30 p-2 w-1/2 rounded-2xl' onClick={() => setIsSpotifyInput(false)}>{"go to type"}</button>
                            <button className='border border-white/30 p-2 w-1/2 rounded-2xl' onClick={() => sendMusic(musicInfo)}>發送音樂</button>
                        </div>
                    </>
                }
                {
                    inputType === "audio" && (
                        <>
                            <div className='flex flex-col items-center text-sm px-4 gap-3 border-t border-b border-white/30 p-3'>
                                <button className='self-end' onClick={() => setInputType("text")}>{CloseIcon}</button>
                                <p className='text-white/30'>點擊已進行錄音</p>
                                <button className='rounded-full border-white/30 border p-3'
                                    onClick={isRecording ? stopRecording : startRecording}
                                >
                                    {isRecording ?
                                        <div className=' bg-white w-4 h-4'></div> :
                                        <div className='rounded-full bg-red-600 w-4 h-4'></div>}
                                </button>

                                {/* <button onClick={isPlaying ? stopPlaying : playRecording} disabled={!audioBlob}>
                                    {isPlaying ? 'Stop Playing' : 'Play Recording'}
                                </button> */}
                                {audioBlob && <button onClick={sendAudioRecording}>send audio</button>}
                                {/* <audio ref={audioRef2} controls /> */}
                            </div>
                            {/* <audio ref={recordingRef} /> */}
                        </>
                    )
                }
                <div className='flex items-center justify-center gap-3 border border-white/30 p-2 mx-4 mb-4 rounded-[20px]'>
                    {
                        isSpotifyInput ?
                            <input
                                type="text"
                                className='text-white px-2 bg-transparent text-sm grow outline-none h-5'
                                placeholder='收尋音樂...'
                                onChange={(e) => { setSearchValue(e.target.value) }}
                                value={SearchValue}
                            />
                            :
                            <textarea
                                className='text-white px-2 bg-transparent text-sm grow outline-none resize-none h-5 max-h-52 '
                                placeholder='message...'
                                onKeyDown={handleKeyPress}
                                onChange={(e) => { setCurrentMessage(e.target.value) }}
                                onCompositionStart={handleCompositionStart}
                                onCompositionEnd={handleCompositionEnd} value={currentMessage} />
                    }
                    <div className='min-w-14 flex items-center justify-end'>
                        {currentMessage.length !== 0 && <button className='text-sm' onClick={sendMessage}>{sendIcon}</button>}
                        {isSpotifyInput && <button className='text-sm' onClick={handleSearch}>{sendIcon}</button>}
                        {!isSpotifyInput && currentMessage.length === 0 && <button className=' text-sm px-1' onClick={() => setInputType("audio")}>{recordIcon}</button>}
                        {!isSpotifyInput && currentMessage.length === 0 && <button className=' text-sm px-1' onClick={() => setIsSpotifyInput(true)}>{musicIcon}</button>}
                        {!isSpotifyInput && currentMessage.length === 0 && <button className='text-sm px-1' onClick={handleClickFile}>{PictureIcon}</button>}
                        {!isSpotifyInput && currentMessage.length === 0 && <input accept="audio/*,.mp4,.mov,.png,.jpg,.jpeg" className="hidden" multiple type="file" ref={filesRef} onChange={e=>onChangeFile(e)}></input>}
                    </div>
                </div>
            </footer>
            <audio ref={audioRef} controls className='invisible absolute top-[-99999px]'>
                <source src={musicUrl} type="audio/mpeg" />
            </audio >
        </div>
    )
}

export default Chat
