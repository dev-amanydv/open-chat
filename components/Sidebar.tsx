import { CiSearch } from "react-icons/ci";
import { IoCreateOutline } from "react-icons/io5";
import { RiCheckDoubleFill } from "react-icons/ri";

export default function Sidebar() {
    const conversations = [
        {
            participants: ["Dheeraj Tanwar", "Aman Yadav"],
            conversationId: "123-123-123",
            unreadCount: 0,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Nishant Saini", "Aman Yadav"],
            conversationId: "123-123-124",
            unreadCount: 4,
            lastMessage: "Kab aa rha hai??",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Imtiyaz Bhaiya", "Aman Yadav"],
            conversationId: "123-123-125",
            unreadCount: 1,
            lastMessage: "Chess??",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Rifaqat Bhaiya", "Aman Yadav"],
            conversationId: "123-123-126",
            unreadCount: 8,
            lastMessage: "Paise daal de",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Md Anas Boss", "Aman Yadav"],
            conversationId: "123-123-127",
            unreadCount: 0,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Shiva", "Aman Yadav"],
            conversationId: "123-123-128",
            unreadCount: 0,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Bro", "Aman Yadav"],
            conversationId: "123-123-129",
            unreadCount: 1,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Dheeraj Tanwar", "Aman Yadav"],
            conversationId: "123-123-110",
            unreadCount: 3,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Dheeraj Tanwar", "Aman Yadav"],
            conversationId: "123-123-111",
            unreadCount: 0,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Dheeraj Tanwar", "Aman Yadav"],
            conversationId: "123-123-112",
            unreadCount: 0,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Dheeraj Tanwar", "Aman Yadav"],
            conversationId: "123-123-113",
            unreadCount: 0,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Dheeraj Tanwar", "Aman Yadav"],
            conversationId: "123-123-115",
            unreadCount: 0,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Dheeraj Tanwar", "Aman Yadav"],
            conversationId: "123-123-116",
            unreadCount: 5,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Dheeraj Tanwar", "Aman Yadav"],
            conversationId: "123-123-117",
            unreadCount: 0,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },{
            participants: ["Dheeraj Tanwar", "Aman Yadav"],
            conversationId: "123-123-118",
            unreadCount: 2,
            lastMessage: "Hey, we up!",
            updatedAt: "24 Feb 2026, 09:36PM",
            avatar: "A"
        },
    ]
  return (
    <div className="max-w-xs px-0 h-screen flex flex-col w-full border-r border-[#ECECEE]">
      <div className="flex px-2 flex-none py-4 justify-between items-center">
        <h1 className="text-xl font-bold">Chats</h1>
        <IoCreateOutline className="size-5" />
      </div>
      <div className="flex px-2 flex-none items-center relative">
        <input className="border w-full rounded-md pl-7 text-sm py-1 focus:outline-0 border-neutral-300" type="text" placeholder="Search" name="" id="" />
        <CiSearch className="absolute left-4" />
      </div>
      <div className="flex-1 flex-col mt-5 overflow-y-auto">
        {conversations.map((convo, key) => (
            <div key={key} className="py-3 px-2 flex gap-2 hover:bg-neutral-100 rounded-md">
                <div className="size-11 flex-none border-neutral-300 border flex justify-center items-center rounded-full"> <div className="size-9 rounded-full border border-neutral-400 bg-neutral-200"/></div>
                <div className="w-full pr-3 flex flex-col flex-1">
                    <div className="flex justify-between">
                        <h1 className="font-semibold text-[14px]">{convo.participants[0]}</h1>
                        <p className="text-sm">{convo.updatedAt.split(', ')[1]}</p>
                    </div>
                    <div className="w-full flex justify-between">
                        <div className="flex items-center gap-1">
                            <RiCheckDoubleFill className={`${convo.unreadCount === 0 ? "text-neutral-400" : "text-blue-400"}`} />
                            <p className={`${convo.unreadCount === 0 ? "text-neutral-500" : "text-neutral-800 font-semibold"} text-[13px]`}>{convo.lastMessage}</p>
                        </div>
                        {convo.unreadCount !== 0 && (
                            <div className="size-4 bg-green-900 rounded-full flex justify-center items-center text-xs text-white">{convo.unreadCount}</div>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
