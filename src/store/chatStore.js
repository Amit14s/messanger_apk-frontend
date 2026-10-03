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

           socket.on("message_status_update",({messageid,messageStatus})=>{
               set((state)=>({
                messages:state.messages.map((msg)=>msg._id===messageid?{...msg,messageStatus}:msg)
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
                const otherUser = conv?.participants?.find(
                    (p)=>p?._id!==get().currentUser?._id
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
        console.log(error?.response?.data?.message || error?.message)
        set({
            error:error?.response?.data?.message || error?.message,
            loading:false
        });
        console.log(error)
        return null;
      }
    },
    fetchMessages: async (conversationId) => {
    if (!conversationId) return;

    set({
        loading: true,
        error: null
    });

    try {
        const { data } = await axiosInstance.get(
            `/chats/conversations/${conversationId}/messages`
        );

        const messageArray = data.data || data || [];

        set({
            messages: messageArray,
            currentConversation: conversationId,
            loading: false
        });

        //make unread message as read
        const {maskMessagesAsRead}=get();
        maskMessagesAsRead();

        return messageArray;
    } catch (error) {
        set({
            error:error?.response?.data?.message || error?.message,
            loading:false
        });
        return null;
    }
},
sendMessage: async (formData) => {

    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus");

    const socket = getSocket();

    const { conversations } = get();

    let conversationId = null;

    if (conversations?.data?.length > 0) {

        const conversation = conversations.data.find((conv) =>
            conv.participants.some((p) => p._id === senderId) &&
            conv.participants.some((p) => p._id === receiverId)
        );

        if (conversation) {
            conversationId = conversation._id;
            set({ currentConversation: conversationId });
        }
    }

    // temp message before actual response
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
        _id: tempId,
        sender: { _id: senderId },
        receiver: { _id: receiverId },
        conversation: conversationId,
        imageOrVideoUrl:
            media && typeof media !== "string"
                ? URL.createObjectURL(media)
                : null,
        content: content,
        contentType:
            media
                ? media.type.startsWith("image")
                    ? "image"
                    : "video"
                : "text",
        createdAt: new Date().toISOString(),
        messageStatus,
    };

    set((state) => ({
        messages: [...state.messages, optimisticMessage]
    }));

    try {

        const { data } = await axiosInstance.post(
            "/chats/send-message",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );

        const messageData = data.data || data;

        // replace optimistic message with real one
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg._id === tempId ? messageData : msg
            )
        }));

        return messageData;

    } catch (error) {

        console.error("Error sending message", error);

        set((state) => ({
            messages: state.messages.map((msg) =>
                msg._id === tempId
                    ? {
                        ...msg,
                        messageStatus: "failed",
                        error:
                            error?.response?.data?.message ||
                            error?.message
                    }
                    : msg
            )
        }));

        throw error;
    }
},
receiveMessage: (message) => {
    if (!message) return;

    const {
        currentConversation,
        currentUser,
        messages
    } = get();

    const messageExists = messages.some(
        (msg) => msg._id === message._id
    );

    if (messageExists) return;

    if (message.conversation === currentConversation) {
        set((state) => ({
            messages: [...state.messages, message]
        }));
        if(message.receiver?._id===currentUser?._id){
            get().maskMessagesAsRead
        }
    }

    //update conversation preview and unread count
    set((state) => {
        const updateConversations =
            state.conversations?.data?.map((conv) => {

                if (conv._id === message.conversation) {
                    return {
                        ...conv,
                        lastMessage: message,
                        unreadCount:
                            message?.receiver?._id === currentUser?._id
                                ? (conv.unreadCount || 0) + 1
                                : conv.unreadCount || 0
                    };
                }

                return conv;
            });

        return {
            conversations: {
                ...state.conversations,
                data: updateConversations
            }
        };
    });
},
//mark as read
maskMessagesAsRead: async () => {
    const { messages, currentUser } = get();

    if (!messages.length || !currentUser) return;

    const unreadIds = messages
        .filter(
            (msg) =>
                msg.messageStatus !== "read" &&
                msg.receiver?._id === currentUser?._id
        )
        .map((msg) => msg._id);

    if (unreadIds.length === 0) return;

    try {
        const { data } = await axiosInstance.put(
            "/chats/messages/read",
            {
                messageIds: unreadIds
            }
        );

        set((state) => ({
            messages: state.messages.map((msg) =>
                unreadIds.includes(msg._id)
                    ? { ...msg, messageStatus: "read" }
                    : msg
            )
        }));

        const socket = getSocket();

        if (socket) {
            socket.emit("message_read", {
                messageIds: unreadIds,
                senderId: messages[0]?.sender?._id
            });
        }
    } catch (error) {
        console.error(
            "failed to mark message as read",
            error
        );
    }
},
deleteMessage: async (messageId) => {
    try {
        await axiosInstance.delete(
            `/chats/messages/${messageId}`
        );

        set((state) => ({
            messages: state.messages?.filter(
                (msg) => msg?._id !== messageId
            )
        }));

        return true;
    } catch (error) {
        console.log(
            "error deleting message",
            error
        );

        set({
            error:
                error.response?.data?.message ||
                error.message
        });

        return false;
    }
},
addReaction: async (messageId, emoji) => {
    const socket = getSocket();
    const { currentUser } = get();

    if (socket && currentUser) {
        socket.emit("add_reaction", {
            messageId,
            emoji,
            userId: currentUser?._id
        });
    }
},
stopTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();

    if (socket && currentConversation && receiverId) {
        socket.emit("typing_stop", {
            conversationId: currentConversation,
            receiverId
        });
    }
},
isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();

    if (
        !currentConversation ||
        !typingUsers.has(currentConversation) ||
        !userId
    ) {
        return false;
    }

    return typingUsers.get(currentConversation).has(userId);
},
isUserOnline: (userId) => {
    if (!userId) return null;

    const { onlineUsers } = get();

    return onlineUsers.get(userId)?.isOnline || false;
},
isUserOnline: (userId) => {
    if (!userId) return null;

    const { onlineUsers } = get();

    return onlineUsers.get(userId)?.isOnline || false;
},
getUserLastSeen: (userId) => {
    if (!userId) return null;

    const { onlineUsers } = get();

    return onlineUsers.get(userId)?.lastSeen || null;
},
cleanup: () => {
    set({
        conversations: [],
        currentConversation: null,
        messages: [],
        onlineUsers: new Map(),
        typingUsers: new Map()
    });
}, 

}))