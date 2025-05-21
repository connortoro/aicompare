'use client'
import { useState } from "react"
import { FaBars } from "react-icons/fa"

export default function Sidebar() {

  const [isShowing, setIsShowing] = useState(false)

  if(!isShowing) {
    return(
      <div className="absolute p-4 hover:cursor-pointer" onClick={() => setIsShowing(true)}>
        <FaBars className="text-2xl text-neutral-400"/>
      </div>

    )
  } else{
    return(
    <div className="absolute bg-neutral-950/10 backdrop-blur-md h-full min-w-[19rem] border-neutral-800 z-50">
      <div className="absolute top-0 right-0 p-4 hover:cursor-pointer" onClick={() => setIsShowing(false)}>
        <FaBars className="text-2xl text-neutral-400"/>
      </div>
      <div className="flex flex-col items-center justify-start mt-[4rem]">
        <button className="bg-[#191919]/90 outline-2 outline-neutral-800 w-[14rem] h-[4rem] rounded-xl hover:cursor-pointer">New Chat</button>
      </div>

    </div>
  )
  }

}
