import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";

export const useChatStore = create((set,get)=>({
    conversation:[],
    currentConversation:null,
    messages:[],
    loading: false,
    error:null,
    onlineUsers: new Map(),
    typingUsers: new Map(),

    initsocketListners:()=>{
            const socket=getSocket();
            if(!socket)return ;
            socket.off("receive_message");
            socket.off("user_typing");
            socket.off("user_status");
            socket.off("message_send");
            socket.off("message_error");
           socket.off("message_deleted");

           socket.on("receive_message",(message)=>{

           });

           socket.on("message_send",(message)=>{
               set((state)=>({
                messages:state.messages.map((msg)=>msg._id===message._id?{...msg}:msg)
               }))
           })

           socket.on("message_status_update",({messageId,messageStatus})=>{
               set((state)=>({
                messages:state.messages.map((msg)=>msg._id===messageId?{...msg,messageStatus}:msg)
               }))
           })

           socket.on("reaction_update",({messageId,reaction})=>{
               set((state)=>({
                messages:state.messages.map((msg)=>msg._id===messageId?{...msg,reaction}:msg)
               }))
           })
           socket.on("message_deletion",({deletedMessageId})=>{
            set((state) =>({
                messages:state.messages.filter((msg)=>msg._id !== deletedMessageId)
            }))
           })
            socket.on("message_error",(error)=>{
              console.error("message error",error);
           })

            socket.on("user_typing",({userId,conversationId,isTyping})=>{
               set((state)=>{
                    const newTypingUsers =new Map(state.typingUsers);
                    if(!newTypingUsers.has(conversationId)){
                        newTypingUsers.set(conversationId,new Set())
                    }
                    const typingSet = newTypingUsers.get(conversationId)
                    if(isTyping){
                        typingSet.add(userId)
                    }
                    else{
                        typingSet.delete(userId);
                    }

                    return {typingUser:newTypingUsers}
               })
           });
           socket.on("user_status",({userId,isOnline,lastSeen})=>{
              set((state)=>{
                const newOnlineUsers = new Map(state.onlineUsers);
                newOnlineUsers.set(userId,{isOnline,lastSeen});
                return {onlineUsers:newOnlineUsers}
              })
           })
           const {conversation} = get();
           if(conversation?.data?.length>0){
            conversation.data?.forEach((conv) => {
                const otherUser = conv.participants.find(
                    (p)=>p._id!==get().currentUser._id
                )
                if(otherUser._id){
                    socket.emit("get_user_status",otherUser._id,(status)=>{
                        set((state)=>{
                            const newOnlineUsers=new Map(state.onlineUsers)
                            newOnlineUsers.set(status.userId,{
                                isOnline:status.isOnline,
                                lastSeen:status.lastSeen
                            })
                            return {onlineUsers:newOnlineUsers} 
                        })
                    })
                }
            });
           }
    },
    setCurrentUser :(user)=> set({currentUser:user}),

    fetchConversation: async ()=>{
       set({loading:true,error:null});
      try {
        const {data}=await axiosInstance.get("/chats/conversations");
        set({conversation:data,loading:false}),

        get().initsocketListners();
        return data;
      } catch (error) {
        set({
            error:error?.response?.data?.message || error?.message,
            loading:false
        });
        return null;
      }
    }
    
}))