import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";

export const useChatStore = create((set, get) => ({
    conversation: [],
    conversations: [],

    currentConversation: null,
    currentUser: null,

    messages: [],

    loading: false,
    error: null,

    onlineUsers: new Map(),
    typingUsers: new Map(),

    // =========================
    // SOCKET LISTENERS
    // =========================

    initsocketListners: () => {
        const socket = getSocket();

        if (!socket) return;

        socket.off("receive_message");
        socket.off("user_typing");
        socket.off("user_status");
        socket.off("message_send");
        socket.off("message_error");
        socket.off("message_deleted");
        socket.off("message_deletion");
        socket.off("message_status_update");
        socket.off("reaction_update");

        // Receive message
        socket.on("receive_message", (message) => {
            get().receiveMessage(message);
        });

        // Message sent
        socket.on("message_send", (message) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === message._id
                        ? { ...msg, ...message }
                        : msg
                )
            }));
        });

        // Message status
        socket.on(
            "message_status_update",
            ({ messageid, messageStatus }) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === messageid
                            ? { ...msg, messageStatus }
                            : msg
                    )
                }));
            }
        );

        // Reaction
        socket.on(
            "reaction_update",
            ({ messageId, reaction }) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === messageId
                            ? { ...msg, reaction }
                            : msg
                    )
                }));
            }
        );

        // Delete message
        socket.on(
            "message_deletion",
            ({ deletedMessageId }) => {
                set((state) => ({
                    messages: state.messages.filter(
                        (msg) => msg._id !== deletedMessageId
                    )
                }));
            }
        );

        // Message error
        socket.on("message_error", (error) => {
            console.error("message error", error);
        });

        // =========================
        // TYPING
        // =========================

        socket.on(
            "user_typing",
            ({ userId, conversationId, isTyping }) => {
                set((state) => {
                    const newTypingUsers = new Map(
                        state.typingUsers
                    );

                    if (!newTypingUsers.has(conversationId)) {
                        newTypingUsers.set(
                            conversationId,
                            new Set()
                        );
                    }

                    const typingSet =
                        newTypingUsers.get(conversationId);

                    if (isTyping) {
                        typingSet.add(userId);
                    } else {
                        typingSet.delete(userId);

                        if (typingSet.size === 0) {
                            newTypingUsers.delete(
                                conversationId
                            );
                        }
                    }

                    return {
                        typingUsers: newTypingUsers
                    };
                });
            }
        );

        // =========================
        // USER STATUS
        // =========================

        socket.on(
            "user_status",
            ({ userId, isOnline, lastSeen }) => {
                set((state) => {
                    const newOnlineUsers = new Map(
                        state.onlineUsers
                    );

                    newOnlineUsers.set(userId, {
                        isOnline,
                        lastSeen
                    });

                    return {
                        onlineUsers: newOnlineUsers
                    };
                });
            }
        );

        // Get status of existing users
        const { conversation, currentUser } = get();

        if (conversation?.data?.length > 0) {
            conversation.data.forEach((conv) => {
                const otherUser =
                    conv?.participants?.find(
                        (p) =>
                            p?._id !== currentUser?._id
                    );

                if (otherUser?._id) {
                    socket.emit(
                        "get_user_status",
                        otherUser._id,
                        (status) => {
                            if (!status) return;

                            set((state) => {
                                const newOnlineUsers =
                                    new Map(
                                        state.onlineUsers
                                    );

                                newOnlineUsers.set(
                                    status.userId,
                                    {
                                        isOnline:
                                            status.isOnline,
                                        lastSeen:
                                            status.lastSeen
                                    }
                                );

                                return {
                                    onlineUsers:
                                        newOnlineUsers
                                };
                            });
                        }
                    );
                }
            });
        }
    },

    // =========================
    // CURRENT USER
    // =========================

    setCurrentUser: (user) => {
        set({
            currentUser: user
        });
    },

    // =========================
    // FETCH CONVERSATIONS
    // =========================

    fetchConversation: async () => {
        set({
            loading: true,
            error: null
        });

        try {
            const { data } =
                await axiosInstance.get(
                    "/chats/conversations"
                );

            set({
                conversation: data,
                conversations: data,
                loading: false
            });

            get().initsocketListners();

            return data;
        } catch (error) {
            console.log(
                error?.response?.data?.message ||
                    error?.message
            );

            set({
                error:
                    error?.response?.data?.message ||
                    error?.message,
                loading: false
            });

            return null;
        }
    },

    // =========================
    // FETCH MESSAGES
    // =========================

    fetchMessages: async (conversationId) => {
        if (!conversationId) return;

        set({
            loading: true,
            error: null
        });

        try {
            const { data } =
                await axiosInstance.get(
                    `/chats/conversations/${conversationId}/messages`
                );

            const messageArray =
                data.data || data || [];

            set({
                messages: messageArray,
                currentConversation: conversationId,
                loading: false
            });

            get().maskMessagesAsRead();

            return messageArray;
        } catch (error) {
            set({
                error:
                    error?.response?.data?.message ||
                    error?.message,
                loading: false
            });

            return null;
        }
    },

    // =========================
    // SEND MESSAGE
    // =========================

    sendMessage: async (formData) => {
        const senderId = formData.get("senderId");
        const receiverId = formData.get("receiverId");
        const media = formData.get("media");
        const content = formData.get("content");
        const messageStatus =
            formData.get("messageStatus");

        const { conversations } = get();

        let conversationId = null;

        if (conversations?.data?.length > 0) {
            const conversation =
                conversations.data.find(
                    (conv) =>
                        conv.participants.some(
                            (p) => p._id === senderId
                        ) &&
                        conv.participants.some(
                            (p) => p._id === receiverId
                        )
                );

            if (conversation) {
                conversationId =
                    conversation._id;

                set({
                    currentConversation:
                        conversationId
                });
            }
        }

        // Temporary message
        const tempId = `temp-${Date.now()}`;

        const optimisticMessage = {
            _id: tempId,

            sender: {
                _id: senderId
            },

            receiver: {
                _id: receiverId
            },

            conversation: conversationId,

            imageOrVideoUrl:
                media &&
                typeof media !== "string"
                    ? URL.createObjectURL(media)
                    : null,

            content: content,

            contentType: media
                ? media.type.startsWith("image")
                    ? "image"
                    : "video"
                : "text",

            createdAt:
                new Date().toISOString(),

            messageStatus
        };

        // Add message only to current chat
        set((state) => ({
            messages: [
                ...state.messages,
                optimisticMessage
            ]
        }));

        try {
            const { data } =
                await axiosInstance.post(
                    "/chats/send-message",
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );

            const messageData =
                data.data || data;

            // Replace temporary message
            set((state) => ({
                messages: state.messages.map(
                    (msg) =>
                        msg._id === tempId
                            ? messageData
                            : msg
                )
            }));

            // Update only the current conversation
            set((state) => {
                if (!state.conversations?.data) {
                    return {};
                }

                return {
                    conversations: {
                        ...state.conversations,

                        data:
                            state.conversations.data.map(
                                (conv) =>
                                    conv._id ===
                                    conversationId
                                        ? {
                                              ...conv,
                                              lastMessage:
                                                  messageData
                                          }
                                        : conv
                            )
                    },

                    conversation: {
                        ...state.conversation,

                        data:
                            state.conversation?.data?.map(
                                (conv) =>
                                    conv._id ===
                                    conversationId
                                        ? {
                                              ...conv,
                                              lastMessage:
                                                  messageData
                                          }
                                        : conv
                            )
                    }
                };
            });

            return messageData;
        } catch (error) {
            console.error(
                "Error sending message",
                error
            );

            set((state) => ({
                messages: state.messages.map(
                    (msg) =>
                        msg._id === tempId
                            ? {
                                  ...msg,
                                  messageStatus:
                                      "failed",
                                  error:
                                      error
                                          ?.response
                                          ?.data
                                          ?.message ||
                                      error?.message
                              }
                            : msg
                )
            }));

            throw error;
        }
    },

    // =========================
    // RECEIVE MESSAGE
    // =========================

    receiveMessage: (message) => {
        if (!message) return;

        const {
            currentConversation,
            currentUser,
            messages
        } = get();

        // Prevent duplicate message
        const messageExists =
            messages.some(
                (msg) =>
                    msg._id === message._id
            );

        if (messageExists) return;

        // Add message only if this chat is open
        if (
            message.conversation ===
            currentConversation
        ) {
            set((state) => ({
                messages: [
                    ...state.messages,
                    message
                ]
            }));

            if (
                message.receiver?._id ===
                currentUser?._id
            ) {
                get().maskMessagesAsRead();
            }
        }

        // Update only matching conversation
        set((state) => {
            if (!state.conversations?.data) {
                return {};
            }

            const updateConversations =
                state.conversations.data.map(
                    (conv) => {
                        if (
                            conv._id ===
                            message.conversation
                        ) {
                            const isMyMessage =
                                message.sender?._id ===
                                currentUser?._id;

                            return {
                                ...conv,

                                lastMessage:
                                    message,

                                unreadCount:
                                    !isMyMessage &&
                                    message
                                        ?.receiver
                                        ?._id ===
                                        currentUser?._id
                                        ? (conv.unreadCount ||
                                              0) + 1
                                        : conv.unreadCount ||
                                          0
                            };
                        }

                        return conv;
                    }
                );

            return {
                conversations: {
                    ...state.conversations,
                    data: updateConversations
                },

                conversation: {
                    ...state.conversation,

                    data:
                        state.conversation?.data?.map(
                            (conv) =>
                                conv._id ===
                                message.conversation
                                    ? updateConversations.find(
                                          (c) =>
                                              c._id ===
                                              conv._id
                                      )
                                    : conv
                        )
                }
            };
        });
    },

    // =========================
    // MARK AS READ
    // =========================

    maskMessagesAsRead: async () => {
        const {
            messages,
            currentUser
        } = get();

        if (
            !messages.length ||
            !currentUser
        ) {
            return;
        }

        const unreadIds =
            messages
                .filter(
                    (msg) =>
                        msg.messageStatus !==
                            "read" &&
                        msg.receiver?._id ===
                            currentUser?._id
                )
                .map(
                    (msg) => msg._id
                );

        if (unreadIds.length === 0) {
            return;
        }

        try {
            await axiosInstance.put(
                "/chats/messages/read",
                {
                    messageIds: unreadIds
                }
            );

            set((state) => ({
                messages:
                    state.messages.map(
                        (msg) =>
                            unreadIds.includes(
                                msg._id
                            )
                                ? {
                                      ...msg,
                                      messageStatus:
                                          "read"
                                  }
                                : msg
                    )
            }));

            const socket =
                getSocket();

            if (socket) {
                socket.emit(
                    "message_read",
                    {
                        messageIds:
                            unreadIds,

                        senderId:
                            messages[0]
                                ?.sender?._id
                    }
                );
            }
        } catch (error) {
            console.error(
                "failed to mark message as read",
                error
            );
        }
    },

    // =========================
    // DELETE MESSAGE
    // =========================

    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(
                `/chats/messages/${messageId}`
            );

            set((state) => ({
                messages:
                    state.messages?.filter(
                        (msg) =>
                            msg?._id !==
                            messageId
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
                    error.response?.data
                        ?.message ||
                    error.message
            });

            return false;
        }
    },

    // =========================
    // REACTION
    // =========================

    addReaction: async (
        messageId,
        emoji
    ) => {
        const socket =
            getSocket();

        const { currentUser } =
            get();

        if (
            socket &&
            currentUser
        ) {
            socket.emit(
                "add_reaction",
                {
                    messageId,
                    emoji,
                    userId:
                        currentUser?._id
                }
            );
        }
    },

    // =========================
    // START TYPING
    // =========================

    startTyping: (receiverId) => {
        const {
            currentConversation
        } = get();

        const socket =
            getSocket();

        if (
            socket &&
            currentConversation &&
            receiverId
        ) {
            socket.emit(
                "typing_start",
                {
                    conversationId:
                        currentConversation,

                    receiverId
                }
            );
        }
    },

    // =========================
    // STOP TYPING
    // =========================

    stopTyping: (receiverId) => {
        const {
            currentConversation
        } = get();

        const socket =
            getSocket();

        if (
            socket &&
            currentConversation &&
            receiverId
        ) {
            socket.emit(
                "typing_stop",
                {
                    conversationId:
                        currentConversation,

                    receiverId
                }
            );
        }
    },

    // =========================
    // CHECK TYPING
    // =========================

    isUserTyping: (userId) => {
        const {
            typingUsers,
            currentConversation
        } = get();

        if (
            !currentConversation ||
            !typingUsers.has(
                currentConversation
            ) ||
            !userId
        ) {
            return false;
        }

        return typingUsers
            .get(currentConversation)
            .has(userId);
    },

    // =========================
    // ONLINE
    // =========================

    isUserOnline: (userId) => {
        if (!userId) return null;

        const {
            onlineUsers
        } = get();

        return (
            onlineUsers.get(
                userId
            )?.isOnline || false
        );
    },

    // =========================
    // LAST SEEN
    // =========================

    getUserLastSeen: (userId) => {
        if (!userId) return null;

        const {
            onlineUsers
        } = get();

        return (
            onlineUsers.get(
                userId
            )?.lastSeen || null
        );
    },

    // =========================
    // CLEANUP
    // =========================

    cleanup: () => {
        set({
            conversation: [],
            conversations: [],

            currentConversation: null,

            messages: [],

            onlineUsers:
                new Map(),

            typingUsers:
                new Map()
        });
    }
}));