import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";

export const useChatStore = create((set, get) => ({
    // =========================
    // STATE
    // =========================

    conversation: [],
    conversations: [],
    currentConversation: null,
    currentUser: null,
    messages: [],

    onlineUsers: new Map(),
    typingUsers: new Map(),

    // Status state
    statuses: [],
    statusViewUpdates: {},

    loading: false,
    error: null,

    // =========================
    // SOCKET LISTENERS
    // =========================

    initsocketListners: () => {
        const socket = getSocket();

        if (!socket) return;

        // Remove old listeners before registering them again
        socket.off("receive_message");
        socket.off("user_typing");
        socket.off("user_status");
        socket.off("message_send");
        socket.off("message_error");
        socket.off("message_deleted");
        socket.off("message_deletion");
        socket.off("message_status_update");
        socket.off("reaction_update");

        socket.off("new_status");
        socket.off("status_viewed");
        socket.off("status_deleted");

        // Receive message
        socket.on("receive_message", (message) => {
            get().receiveMessage(message);
        });

        // Message sent
        socket.on("message_send", (message) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    String(msg._id) === String(message._id)
                        ? { ...msg, ...message }
                        : msg
                ),
            }));
        });

        // Message status update
        socket.on(
            "message_status_update",
            ({ messageid, messageStatus }) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        String(msg._id) === String(messageid)
                            ? { ...msg, messageStatus }
                            : msg
                    ),
                }));
            }
        );

        // Message reactions
        socket.on(
            "reaction_update",
            ({ messageId, reactions }) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        String(msg._id) === String(messageId)
                            ? { ...msg, reactions }
                            : msg
                    ),
                }));
            }
        );

        // Delete message
        socket.on(
            "message_deletion",
            ({ deletedMessageId }) => {
                set((state) => ({
                    messages: state.messages.filter(
                        (msg) =>
                            String(msg._id) !==
                            String(deletedMessageId)
                    ),
                }));
            }
        );

        // Message error
        socket.on("message_error", (error) => {
            console.error("Message error:", error);
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
                        typingUsers: newTypingUsers,
                    };
                });
            }
        );

        // =========================
        // USER ONLINE STATUS
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
                        lastSeen,
                    });

                    return {
                        onlineUsers: newOnlineUsers,
                    };
                });
            }
        );

        // =========================
        // NEW STATUS
        // =========================

        socket.on("new_status", (newStatus) => {
            if (!newStatus?._id) return;

            get().addStatus(newStatus);
        });

        // =========================
        // STATUS VIEW COUNT
        // =========================

        socket.on("status_viewed", (data) => {
            if (!data?.statusId) return;

            get().updateStatusView(data);
        });

        // =========================
        // STATUS DELETED
        // =========================

        socket.on("status_deleted", (statusId) => {
            get().removeStatus(statusId);
        });

        // =========================
        // GET EXISTING USER STATUS
        // =========================

        const { conversation, currentUser } = get();

        if (conversation?.data?.length > 0) {
            conversation.data.forEach((conv) => {
                const otherUser =
                    conv?.participants?.find(
                        (p) =>
                            String(p?._id) !==
                            String(currentUser?._id)
                    );

                if (otherUser?._id) {
                    socket.emit(
                        "get_user_status",
                        otherUser._id,
                        (status) => {
                            if (!status) return;

                            set((state) => {
                                const newOnlineUsers =
                                    new Map(state.onlineUsers);

                                newOnlineUsers.set(
                                    status.userId,
                                    {
                                        isOnline: status.isOnline,
                                        lastSeen: status.lastSeen,
                                    }
                                );

                                return {
                                    onlineUsers: newOnlineUsers,
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
        set({ currentUser: user });
    },

    // =========================
    // FETCH CONVERSATIONS
    // =========================

    fetchConversation: async () => {
        set({
            loading: true,
            error: null,
        });

        try {
            const { data } = await axiosInstance.get(
                "/chats/conversations"
            );

            set({
                conversation: data,
                conversations: data,
                loading: false,
            });

            get().initsocketListners();

            return data;
        } catch (error) {
            console.error(
                error?.response?.data?.message ||
                    error?.message
            );

            set({
                error:
                    error?.response?.data?.message ||
                    error?.message,
                loading: false,
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
            error: null,
        });

        try {
            const { data } = await axiosInstance.get(
                `/chats/conversations/${conversationId}/messages`
            );

            const messageArray = data.data || data || [];

            set({
                messages: messageArray,
                currentConversation: conversationId,
                loading: false,
            });

            get().maskMessagesAsRead();

            return messageArray;
        } catch (error) {
            set({
                error:
                    error?.response?.data?.message ||
                    error?.message,
                loading: false,
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
        const messageStatus = formData.get("messageStatus");

        const { conversations } = get();

        let conversationId = null;

        if (conversations?.data?.length > 0) {
            const foundConversation =
                conversations.data.find(
                    (conv) =>
                        conv.participants.some(
                            (p) =>
                                String(p._id) ===
                                String(senderId)
                        ) &&
                        conv.participants.some(
                            (p) =>
                                String(p._id) ===
                                String(receiverId)
                        )
                );

            if (foundConversation) {
                conversationId = foundConversation._id;

                set({
                    currentConversation: conversationId,
                });
            }
        }

        // Optimistic message
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

            content,

            contentType: media
                ? media.type.startsWith("image")
                    ? "image"
                    : "video"
                : "text",

            createdAt: new Date().toISOString(),
            messageStatus,
        };

        set((state) => ({
            messages: [
                ...state.messages,
                optimisticMessage,
            ],
        }));

        try {
            const { data } = await axiosInstance.post(
                "/chats/send-message",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const messageData = data.data || data;

            // Replace temporary message
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId
                        ? messageData
                        : msg
                ),
            }));

            // Update conversation's last message
            set((state) => {
                if (!state.conversations?.data) {
                    return {};
                }

                const updateConversation = (conv) =>
                    String(conv._id) ===
                    String(conversationId)
                        ? {
                              ...conv,
                              lastMessage: messageData,
                          }
                        : conv;

                return {
                    conversations: {
                        ...state.conversations,
                        data: state.conversations.data.map(
                            updateConversation
                        ),
                    },

                    conversation: {
                        ...state.conversation,
                        data:
                            state.conversation?.data?.map(
                                updateConversation
                            ),
                    },
                };
            });

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
                                  error?.message,
                          }
                        : msg
                ),
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
            messages,
        } = get();

        // Prevent duplicate messages
        const messageExists = messages.some(
            (msg) =>
                String(msg._id) === String(message._id)
        );

        if (messageExists) return;

        // Add message if this conversation is open
        if (
            String(message.conversation) ===
            String(currentConversation)
        ) {
            set((state) => ({
                messages: [
                    ...state.messages,
                    message,
                ],
            }));

            if (
                String(message.receiver?._id) ===
                String(currentUser?._id)
            ) {
                get().maskMessagesAsRead();
            }
        }

        // Update conversation list
        set((state) => {
            if (!state.conversations?.data) {
                return {};
            }

            const updateConversations =
                state.conversations.data.map((conv) => {
                    if (
                        String(conv._id) !==
                        String(message.conversation)
                    ) {
                        return conv;
                    }

                    const isMyMessage =
                        String(message.sender?._id) ===
                        String(currentUser?._id);

                    const isReceivedByMe =
                        String(message.receiver?._id) ===
                        String(currentUser?._id);

                    return {
                        ...conv,
                        lastMessage: message,

                        unreadCount: isReceivedByMe && !isMyMessage
                            ? (conv.unreadCount || 0) + 1
                            : conv.unreadCount || 0,
                    };
                });

            return {
                conversations: {
                    ...state.conversations,
                    data: updateConversations,
                },

                conversation: {
                    ...state.conversation,
                    data: state.conversation?.data?.map(
                        (conv) =>
                            updateConversations.find(
                                (item) =>
                                    String(item._id) ===
                                    String(conv._id)
                            ) || conv
                    ),
                },
            };
        });
    },

    // =========================
    // MARK MESSAGES AS READ
    // =========================

    maskMessagesAsRead: async () => {
        const { messages, currentUser } = get();

        if (!messages.length || !currentUser) return;

        const unreadIds = messages
            .filter(
                (msg) =>
                    msg.messageStatus !== "read" &&
                    String(msg.receiver?._id) ===
                        String(currentUser?._id)
            )
            .map((msg) => msg._id);

        if (!unreadIds.length) return;

        try {
            await axiosInstance.put(
                "/chats/messages/read",
                {
                    messageIds: unreadIds,
                }
            );

            set((state) => ({
                messages: state.messages.map((msg) =>
                    unreadIds.includes(msg._id)
                        ? {
                              ...msg,
                              messageStatus: "read",
                          }
                        : msg
                ),
            }));

            const socket = getSocket();

            if (socket) {
                socket.emit("message_read", {
                    messageIds: unreadIds,
                    senderId: messages[0]?.sender?._id,
                });
            }
        } catch (error) {
            console.error(
                "Failed to mark messages as read",
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
                `/chats/message/${messageId}`
            );

            set((state) => ({
                messages: state.messages.filter(
                    (msg) =>
                        String(msg._id) !== String(messageId)
                ),
            }));

            return true;
        } catch (error) {
            console.error(
                "Error deleting message",
                error
            );

            set({
                error:
                    error?.response?.data?.message ||
                    error?.message,
            });

            return false;
        }
    },

    // =========================
    // REACTION
    // =========================

    addReaction: async (messageId, emoji, userId) => {
        const socket = getSocket();

        if (!socket || !userId) {
            console.log("Reaction failed:", {
                socket: !!socket,
                userId,
            });

            return;
        }

        socket.emit("add_reaction", {
            messageId,
            emoji,
            userId,
        });
    },

    // =========================
    // START TYPING
    // =========================

    startTyping: (receiverId) => {
        const { currentConversation } = get();
        const socket = getSocket();

        if (
            socket &&
            currentConversation &&
            receiverId
        ) {
            socket.emit("typing_start", {
                conversationId: currentConversation,
                receiverId,
            });
        }
    },

    // =========================
    // STOP TYPING
    // =========================

    stopTyping: (receiverId) => {
        const { currentConversation } = get();
        const socket = getSocket();

        if (
            socket &&
            currentConversation &&
            receiverId
        ) {
            socket.emit("typing_stop", {
                conversationId: currentConversation,
                receiverId,
            });
        }
    },

    // =========================
    // CHECK TYPING
    // =========================

    isUserTyping: (userId) => {
        const { typingUsers, currentConversation } = get();

        if (
            !currentConversation ||
            !typingUsers.has(currentConversation) ||
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

        return (
            get().onlineUsers.get(userId)?.isOnline ||
            false
        );
    },

    // =========================
    // LAST SEEN
    // =========================

    getUserLastSeen: (userId) => {
        if (!userId) return null;

        return (
            get().onlineUsers.get(userId)?.lastSeen ||
            null
        );
    },

    // =========================
    // SEARCH USER
    // =========================

    searchUser: async (input, phoneSuffix = "") => {
        try {
            const isEmail = input.includes("@");

            const params = isEmail
                ? { email: input.trim() }
                : {
                      phoneNumber: input.trim(),
                      phoneSuffix: phoneSuffix.trim(),
                  };

            const { data } = await axiosInstance.get(
                "/auth/search-user",
                { params }
            );

            return data;
        } catch (error) {
            if (error.response?.status === 404) {
                return {
                    found: false,
                    message: "No user found",
                };
            }

            console.error("Error searching user:", error);

            return {
                found: false,
                message: "Something went wrong",
            };
        }
    },

    // =========================
    // STATUS HELPERS
    // =========================

    setStatuses: (statuses) => {
        set({
            statuses: Array.isArray(statuses)
                ? statuses
                : [],
        });
    },

    addStatus: (newStatus) => {
        if (!newStatus?._id) return;

        set((state) => {
            const exists = state.statuses.some(
                (status) =>
                    String(status._id) ===
                    String(newStatus._id)
            );

            return {
                statuses: exists
                    ? state.statuses.map((status) =>
                          String(status._id) ===
                          String(newStatus._id)
                              ? { ...status, ...newStatus }
                              : status
                      )
                    : [newStatus, ...state.statuses],
            };
        });
    },

    updateStatusView: (data) => {
        if (!data?.statusId) return;

        set((state) => ({
            statusViewUpdates: {
                ...state.statusViewUpdates,
                [String(data.statusId)]: data,
            },

            statuses: state.statuses.map((status) =>
                String(status._id) ===
                String(data.statusId)
                    ? {
                          ...status,
                          viewers:
                              data.viewers ?? status.viewers,
                      }
                    : status
            ),
        }));
    },

    removeStatus: (statusId) => {
        set((state) => ({
            statuses: state.statuses.filter(
                (status) =>
                    String(status._id) !==
                    String(statusId)
            ),
        }));
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
            onlineUsers: new Map(),
            typingUsers: new Map(),
            statuses: [],
            statusViewUpdates: {},
        });
    },
}));