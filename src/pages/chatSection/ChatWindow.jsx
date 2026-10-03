import { useEffect, useRef, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import { isToday, isYesterday, format } from 'date-fns'
import appImage from "../../../public/chimg.png";
import { FaLock, FaArrowLeft } from "react-icons/fa6";
import { FaEllipsisV, FaVideo } from 'react-icons/fa';
import useLayoutStore from "../../store/layoutStore";
const isValid = (date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate);
};

const ChatWindow = ({ isMobile }) => {
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const { selectedContact, setSelectedContact } = useLayoutStore()


    const [selectedFile, setSelectedFile] = useState(null);

    const typingTimeoutRef = useRef(null);
    const messageEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);

    const { theme } = useThemeStore();
    const user = useUserStore();

    const {
        messages,
        loading,
        sendMessage,
        receiveMessage,
        fetchMessages,
        fetchConversation,
        conversations,
        isUserTyping,
        startTyping,
        stopTyping,
        getUserLastSeen,
        isUserOnline,
        deleteMessage,
        addReaction,
        cleanup
    } = useChatStore();
    const online = isUserOnline(selectedContact?._id);
    const lastSeen = getUserLastSeen(selectedContact?._id);
    const isTyping = isUserTyping(selectedContact?._id);
    useEffect(() => {
        if (selectedContact?._id && conversations?.data?.length > 0) {
            const conversation = conversations?.data?.find((conv) =>
                conv.participants.some(
                    (participant) =>
                        participant._id === selectedContact?._id
                )
            );

            if (conversation?._id) {
                fetchMessages(conversation._id);
            }
        }
    }, [selectedContact, conversations]);

    useEffect(() => {
        fetchConversation();
    }, []);
    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({
            behavior: "auto"
        });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (message && selectedContact) {
            startTyping(selectedContact?._id);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(selectedContact?._id);
            }, 2000);
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [message, selectedContact, startTyping, stopTyping]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            setSelectedFile(file);
            setShowFileMenu(false);

            if (file.type.startsWith("image/")) {
                setFilePreview(
                    URL.createObjectURL(file)
                );
            }
        }
    };
    const handleSendMessage = async () => {
        if (!selectedContact) return;

        setFilePreview(null);

        try {
            const formData = new FormData();

            formData.append("senderId", user?._id);
            formData.append("receiverId", selectedContact?._id);

            const status = online ? "delivered" : "send";

            formData.append("messageStatus", status);

            if (message.trim()) {
                formData.append("content", message.trim());
            }

            // if there is file include that too
            if (selectedFile) {
                formData.append(
                    "media",
                    selectedFile,
                    selectedFile.name
                );
            }

            if (!message.trim() && !selectedFile) return;

            await sendMessage(formData);

            // clear state
            setMessage("");
            setFilePreview(null);
            setSelectedFile(null);
            setShowFileMenu(false);

        } catch (error) {
            console.error(
                "Failed to send message",
                error
            );
        }
    };
    const renderDateSeparator = (date) => {
        if (!isValid(date)) {
            return null;
        }

        let dateString;

        if (isToday(date)) {
            dateString = "Today";
        }
        else if (isYesterday(date)) {
            dateString = "Yesterday";
        }
        else {
            dateString = format(date, "EEEE, MMMM d");
        }

        return (
            <div className="flex justify-center my-4">
                <span className={`px-4 py-2 rounded-full text-sm ${theme === "dark"
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                    {dateString}
                </span>
            </div>
        );
    };
    const groupedMessages = Array.isArray(messages)
        ? messages.reduce((acc, message) => {

            if (!message.createdAt) return acc;

            const date = new Date(message.createdAt);

            if (isValid(date)) {
                const dateString = format(date, "yyyy-MM-dd");

                if (!acc[dateString]) {
                    acc[dateString] = [];
                }

                acc[dateString].push(message);
            }
            else {
                console.error("Invalid date for message", message);
            }

            return acc;

        }, {})
        : {};

    const hndleReaction = (messageId, emoji) => {
        addReaction(messageId, emoji)
    };
    if (!selectedContact) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
                <div className="max-w-md">
                    <img
                        src={appImage}
                        alt="chat-app"
                        className="w-full h-auto"
                    />

                    <h2
                        className={`text-3xl font-semibold mb-4 ${theme === "dark"
                                ? "text-white"
                                : "text-black"
                            }`}
                    >
                        Select a conversation to start chatting
                    </h2>

                    <p
                        className={`${theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            } mb-6`}
                    >
                        Choose a contact from the list on the left to begin
                        messaging
                    </p>

                    <p
                        className={`${theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            } text-sm mt-8 flex items-center justify-center gap-2`}
                    >
                        <FaLock className="h-4 w-4" />
                        Your personal messages are end-to-end encrypted
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div
            className={`flex-1 h-screen w-full flex flex-col ${theme === "dark"
                    ? "bg-[#30343b] text-white"
                    : "bg-[rgb(239,242,245)] text-gray-600"
                }`}
        >
            {/* Chat Header */}
            <div
                className={`p-4 ${theme === "dark"
                        ? "bg-[#30343b] text-white"
                        : "bg-[rgb(239,242,245)] text-gray-600"
                    } flex items-center`}
            >
                <button
                    className="mr-2 focus:outline-none"
                    onClick={() => setSelectedContact(null)}
                >
                    <FaArrowLeft className="h-6 w-6" />
                </button>

                <img
                    src={selectedContact?.profilePicture}
                    alt={selectedContact?.username}
                    className="w-10 h-10 rounded-full"
                />

                <div className="ml-3 flex-grow">
                    <h2 className="font-semibold text-start">
                        {selectedContact?.username}
                    </h2>

                    {isTyping ? (
                        <div>Typing...</div>
                    ) : (
                        <p
                            className={`text-sm ${theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                        >
                            {online
                                ? "Online"
                                : lastSeen
                                    ? `Last seen ${format(
                                        new Date(lastSeen),
                                        "HH:mm"
                                    )}`
                                    : "Offline"}
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    <button className="focus:outline-none">
                        <FaVideo className="h-5 w-5" />
                    </button>

                    <button className="focus:outline-none">
                        <FaEllipsisV className="h-5 w-5" />
                    </button>
                </div>

                <div
                    className={`flex-1 p-4 overflow-y-auto ${theme === "dark"
                            ? "bg-[#191a1a]"
                            : "bg-[rgb(241,236,229)]"
                        }`}
                >
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <React.Fragment key={date}>
                            {renderDateSeparator(new Date(date))}

                            {msgs
                                .filter(
                                    (msg) =>
                                        msg.conversation ===
                                        selectedContact?.conversation?._id
                                )
                                .map((msg) => (
                                    <MessageBubble
                                        key={msg._id || msg.tempId}
                                        message={msg}
                                        theme={theme}
                                        currentUser={user}
                                        onReact={handleReaction}
                                        deleteMessage={deleteMessage}
                                    />
                                ))}
                        </React.Fragment>
                    ))}
                    <div ref={messageEndRef} />
                </div>


            </div>

        </div>
    );
};
export default ChatWindow