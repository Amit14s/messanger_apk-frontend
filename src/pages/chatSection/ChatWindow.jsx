import React, { useEffect, useRef, useState } from "react";

import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import useLayoutStore from "../../store/layoutStore";

import { isToday, isYesterday, format } from "date-fns";

import appImage from "../../../public/chimg.png";

import {
    FaLock,
    FaArrowLeft,
    FaPaperclip,
    FaSmile,
    FaPaperPlane,
    FaTimes,
    FaImage
} from "react-icons/fa";

import { FaEllipsisV, FaVideo } from "react-icons/fa";

import MessageBubble from "./messageBubble";


const isValid = (date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate);
};


const ChatWindow = ({ isMobile }) => {

    // =========================
    // MESSAGE
    // =========================

    const [message, setMessage] = useState("");

    // Store drafts separately for every contact
    const messageDraftsRef = useRef({});

    // Used so restoring a draft does not trigger typing
    const restoringDraftRef = useRef(false);


    const [showEmojiPicker, setShowEmojiPicker] =
        useState(false);

    const [showFileMenu, setShowFileMenu] =
        useState(false);

    const [filePreview, setFilePreview] =
        useState(null);


    const {
        selectedContact,
        setSelectedContact
    } = useLayoutStore();


    const [selectedFile, setSelectedFile] =
        useState(null);


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


    const online =
        isUserOnline(selectedContact?._id);

    const lastSeen =
        getUserLastSeen(selectedContact?._id);

    const isTyping =
        isUserTyping(selectedContact?._id);


    // =========================
    // CHANGE CHAT
    // =========================

    useEffect(() => {

        if (!selectedContact?._id) {
            setMessage("");
            return;
        }

        // Stop typing in previous chat
        if (typingTimeoutRef.current) {
            clearTimeout(
                typingTimeoutRef.current
            );
        }

        // Stop typing event for previous/current
        // conversation before switching
        if (selectedContact?._id) {
            stopTyping(
                selectedContact._id
            );
        }

        // Restore draft belonging to this contact
        const savedMessage =
            messageDraftsRef.current[
                selectedContact._id
            ] || "";

        restoringDraftRef.current = true;

        setMessage(savedMessage);

        // Clear file/emoji state when changing chat
        setSelectedFile(null);
        setFilePreview(null);
        setShowEmojiPicker(false);
        setShowFileMenu(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

    }, [selectedContact]);


    // =========================
    // SAVE MESSAGE DRAFT
    // =========================

    const handleMessageChange = (e) => {

        const value = e.target.value;

        setMessage(value);

        if (selectedContact?._id) {

            messageDraftsRef.current[
                selectedContact._id
            ] = value;

        }

    };


    // =========================
    // FETCH SELECTED CHAT
    // =========================

    useEffect(() => {

        if (
            selectedContact?._id &&
            conversations?.data?.length > 0
        ) {

            const conversation =
                conversations?.data?.find(
                    (conv) =>
                        conv.participants.some(
                            (participant) =>
                                participant._id ===
                                selectedContact?._id
                        )
                );


            if (conversation?._id) {

                fetchMessages(
                    conversation._id
                );

            }

        }

    }, [
        selectedContact,
        conversations
    ]);


    // =========================
    // FETCH CONVERSATIONS
    // =========================

    useEffect(() => {

        fetchConversation();

    }, []);


    // =========================
    // SCROLL TO BOTTOM
    // =========================

    const scrollToBottom = () => {

        messageEndRef.current?.scrollIntoView({
            behavior: "auto"
        });

    };


    useEffect(() => {

        scrollToBottom();

    }, [messages]);


    // =========================
    // TYPING
    // =========================

    useEffect(() => {

        // If this message was restored from
        // another chat, don't send typing event
        if (restoringDraftRef.current) {

            restoringDraftRef.current = false;

            return;

        }

        if (
            message &&
            selectedContact
        ) {

            startTyping(
                selectedContact._id
            );


            if (typingTimeoutRef.current) {

                clearTimeout(
                    typingTimeoutRef.current
                );

            }


            typingTimeoutRef.current =
                setTimeout(() => {

                    stopTyping(
                        selectedContact._id
                    );

                }, 2000);

        } else {

            if (selectedContact) {

                stopTyping(
                    selectedContact._id
                );

            }

        }


        return () => {

            if (typingTimeoutRef.current) {

                clearTimeout(
                    typingTimeoutRef.current
                );

            }

        };

    }, [
        message,
        selectedContact,
        startTyping,
        stopTyping
    ]);


    // =========================
    // FILE CHANGE
    // =========================

    const handleFileChange = (e) => {

        const file = e.target.files[0];

        if (file) {

            setSelectedFile(file);

            setShowFileMenu(false);


            if (
                file.type.startsWith("image/")
            ) {

                setFilePreview(
                    URL.createObjectURL(file)
                );

            } else {

                setFilePreview(null);

            }

        }

    };


    // =========================
    // SEND MESSAGE
    // =========================

    const handleSendMessage = async () => {

        if (!selectedContact) return;


        if (
            !message.trim() &&
            !selectedFile
        ) {
            return;
        }


        try {

            const formData =
                new FormData();


            formData.append(
                "senderId",
                user?._id
            );


            formData.append(
                "receiverId",
                selectedContact?._id
            );


            const status =
                online
                    ? "delivered"
                    : "send";


            formData.append(
                "messageStatus",
                status
            );


            if (message.trim()) {

                formData.append(
                    "content",
                    message.trim()
                );

            }


            if (selectedFile) {

                formData.append(
                    "media",
                    selectedFile,
                    selectedFile.name
                );

            }


            await sendMessage(formData);


            // Clear only this chat's draft
            if (selectedContact?._id) {

                messageDraftsRef.current[
                    selectedContact._id
                ] = "";

            }


            setMessage("");

            setFilePreview(null);

            setSelectedFile(null);

            setShowFileMenu(false);

            setShowEmojiPicker(false);


            if (fileInputRef.current) {

                fileInputRef.current.value = "";

            }

        } catch (error) {

            console.error(
                "Failed to send message",
                error
            );

        }

    };


    // =========================
    // KEYBOARD
    // =========================

    const handleKeyDown = (e) => {

        if (
            e.key === "Enter" &&
            !e.shiftKey
        ) {

            e.preventDefault();

            handleSendMessage();

        }

    };


    // =========================
    // EMOJI
    // =========================

    const addEmoji = (emoji) => {

        const newMessage =
            message + emoji;

        setMessage(newMessage);

        // Save emoji in current chat draft
        if (selectedContact?._id) {

            messageDraftsRef.current[
                selectedContact._id
            ] = newMessage;

        }

        setShowEmojiPicker(false);

    };


    // =========================
    // REMOVE FILE
    // =========================

    const removeSelectedFile = () => {

        setSelectedFile(null);

        setFilePreview(null);


        if (fileInputRef.current) {

            fileInputRef.current.value = "";

        }

    };


    // =========================
    // DATE SEPARATOR
    // =========================

    const renderDateSeparator = (date) => {

        if (!isValid(date)) {
            return null;
        }


        let dateString;


        if (isToday(date)) {

            dateString = "Today";

        } else if (isYesterday(date)) {

            dateString = "Yesterday";

        } else {

            dateString =
                format(
                    date,
                    "EEEE, MMMM d"
                );

        }


        return (

            <div className="flex justify-center my-5">

                <span
                    className={`
                        px-4
                        py-1.5
                        rounded-full
                        text-xs
                        font-medium
                        shadow-sm

                        ${
                            theme === "dark"
                                ? "bg-[#222938] text-gray-300"
                                : "bg-white text-gray-500 border border-gray-100"
                        }
                    `}
                >
                    {dateString}
                </span>

            </div>

        );

    };


    // =========================
    // GROUP MESSAGES
    // =========================

    const groupedMessages =
        Array.isArray(messages)

            ? messages.reduce(
                (acc, message) => {

                    if (!message.createdAt) {
                        return acc;
                    }


                    const date =
                        new Date(
                            message.createdAt
                        );


                    if (isValid(date)) {

                        const dateString =
                            format(
                                date,
                                "yyyy-MM-dd"
                            );


                        if (!acc[dateString]) {
                            acc[dateString] = [];
                        }


                        acc[dateString].push(
                            message
                        );

                    }


                    return acc;

                },
                {}
            )

            : {};


    // =========================
    // REACTION
    // =========================

    const hndleReaction = (
        messageId,
        emoji
    ) => {

        addReaction(
            messageId,
            emoji
        );

    };


    // =========================
    // NO CONTACT
    // =========================

    if (!selectedContact) {

        return (

            <div
                className={`
                    flex-1
                    h-screen
                    flex
                    items-center
                    justify-center
                    px-6

                    ${
                        theme === "dark"
                            ? "bg-[#151922] text-white"
                            : "bg-[#f5f7fa] text-gray-800"
                    }
                `}
            >

                <div
                    className="
                        w-full
                        max-w-lg
                        text-center
                    "
                >

                    <div
                        className={`
                            mx-auto
                            w-24
                            h-24
                            rounded-full
                            flex
                            items-center
                            justify-center
                            mb-6

                            ${
                                theme === "dark"
                                    ? "bg-[#222938]"
                                    : "bg-white shadow-sm"
                            }
                        `}
                    >

                        <img
                            src={appImage}
                            alt="chat-app"
                            className="
                                w-16
                                h-16
                                object-contain
                            "
                        />

                    </div>


                    <h2
                        className={`
                            text-2xl
                            sm:text-3xl
                            font-semibold
                            mb-3

                            ${
                                theme === "dark"
                                    ? "text-white"
                                    : "text-gray-800"
                            }
                        `}
                    >
                        Select a conversation
                    </h2>


                    <p
                        className={`
                            text-sm
                            sm:text-base
                            leading-6

                            ${
                                theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                            }
                        `}
                    >
                        Choose a contact from the list to
                        start chatting.
                    </p>


                    <div
                        className={`
                            mt-8
                            flex
                            items-center
                            justify-center
                            gap-2
                            text-xs

                            ${
                                theme === "dark"
                                    ? "text-gray-500"
                                    : "text-gray-400"
                            }
                        `}
                    >

                        <FaLock
                            className="text-[11px]"
                        />

                        <span>
                            Your personal messages are
                            end-to-end encrypted
                        </span>

                    </div>

                </div>

            </div>

        );

    }


    // =========================
    // MAIN CHAT
    // =========================

    return (

        <div
            className={`
                flex-1
                h-screen
                w-full
                flex
                flex-col
                overflow-hidden

                ${
                    theme === "dark"
                        ? "bg-[#151922] text-white"
                        : "bg-[#f5f7fa] text-gray-800"
                }
            `}
        >

            {/* ================= HEADER ================= */}

            <div
                className={`
                    h-[72px]
                    shrink-0
                    px-3
                    sm:px-5
                    flex
                    items-center
                    justify-between
                    border-b

                    ${
                        theme === "dark"
                            ? "bg-[#1c2230] border-[#2b3242]"
                            : "bg-white border-gray-200"
                    }
                `}
            >

                <div
                    className="
                        flex
                        items-center
                        min-w-50
                    "
                >

                    <button
                        onClick={() =>
                            setSelectedContact(null)
                        }
                        className={`
                            ${
                                isMobile
                                    ? "flex"
                                    : "hidden"
                            }

                            mr-2
                            w-9
                            h-9
                            items-center
                            justify-center
                            rounded-full
                            transition

                            ${
                                theme === "dark"
                                    ? "hover:bg-[#2a3140]"
                                    : "hover:bg-gray-100"
                            }
                        `}
                    >

                        <FaArrowLeft
                            className="text-sm"
                        />

                    </button>


                    <div
                        className="
                            relative
                            shrink-0
                        "
                    >

                        <img
                            src={
                                selectedContact?.profilePicture
                            }
                            alt={
                                selectedContact?.username ||
                                "User"
                            }
                            className="
                                w-11
                                h-11
                                rounded-full
                                object-cover
                                border-2
                                border-transparent
                            "
                        />


                        {online && (

                            <span
                                className="
                                    absolute
                                    bottom-0
                                    right-0
                                    w-3
                                    h-3
                                    rounded-full
                                    bg-green-500
                                    border-2
                                    border-white
                                "
                            />

                        )}

                    </div>


                    <div
                        className="
                            ml-3
                            min-w-0
                        "
                    >

                        <h2
                            className={`
                                font-semibold
                                text-sm
                                sm:text-base
                                truncate

                                ${
                                    theme === "dark"
                                        ? "text-white"
                                        : "text-gray-900"
                                }
                            `}
                        >
                            {selectedContact?.username}
                        </h2>


                        {isTyping ? (

                            <p
                                className="
                                    text-xs
                                    text-green-500
                                    font-medium
                                "
                            >
                                Typing...
                            </p>

                        ) : (

                            <p
                                className={`
                                    text-xs
                                    mt-0.5

                                    ${
                                        online
                                            ? "text-green-500"
                                            : theme === "dark"
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                    }
                                `}
                            >

                                {online
                                    ? "Online"
                                    : lastSeen
                                        ? `Last seen ${format(
                                              new Date(
                                                  lastSeen
                                              ),
                                              "HH:mm"
                                          )}`
                                        : "Offline"}

                            </p>

                        )}

                    </div>

                </div>


                <div
                    className="
                        flex
                        items-center
                        gap-1
                    "
                >

                    <button
                        className={`
                            w-10
                            h-10
                            rounded-full
                            flex
                            items-center
                            justify-center
                            transition

                            ${
                                theme === "dark"
                                    ? "hover:bg-[#2a3140]"
                                    : "hover:bg-gray-100"
                            }
                        `}
                    >

                        <FaVideo
                            className="text-base"
                        />

                    </button>


                    <button
                        className={`
                            w-10
                            h-10
                            rounded-full
                            flex
                            items-center
                            justify-center
                            transition

                            ${
                                theme === "dark"
                                    ? "hover:bg-[#2a3140]"
                                    : "hover:bg-gray-100"
                            }
                        `}
                    >

                        <FaEllipsisV
                            className="text-base"
                        />

                    </button>

                </div>

            </div>


            {/* ================= MESSAGE AREA ================= */}

            <div
                className={`
                    flex-1
                    overflow-y-auto
                    px-3
                    sm:px-6
                    py-5
                    scroll-smooth

                    ${
                        theme === "dark"
                            ? "bg-[#151922]"
                            : "bg-[#f5f7fa]"
                    }
                `}
            >

                <div
                    className="
                        max-w-5xl
                        mx-auto
                    "
                >

                    {loading ? (

                        <div
                            className="
                                h-full
                                flex
                                items-center
                                justify-center
                            "
                        >

                            <div
                                className={`
                                    w-8
                                    h-8
                                    rounded-full
                                    border-2
                                    border-t-transparent
                                    animate-spin

                                    ${
                                        theme === "dark"
                                            ? "border-gray-400"
                                            : "border-gray-500"
                                    }
                                `}
                            />

                        </div>

                    ) : Object.keys(
                        groupedMessages
                    ).length === 0 ? (

                        <div
                            className="
                                h-full
                                min-h-[400px]
                                flex
                                items-center
                                justify-center
                            "
                        >

                            <div
                                className="text-center"
                            >

                                <div
                                    className={`
                                        w-16
                                        h-16
                                        mx-auto
                                        rounded-full
                                        flex
                                        items-center
                                        justify-center
                                        mb-4

                                        ${
                                            theme === "dark"
                                                ? "bg-[#222938]"
                                                : "bg-white shadow-sm"
                                        }
                                    `}
                                >

                                    <FaLock
                                        className={`
                                            text-xl

                                            ${
                                                theme === "dark"
                                                    ? "text-gray-500"
                                                    : "text-gray-400"
                                            }
                                        `}
                                    />

                                </div>


                                <p
                                    className={`
                                        text-sm

                                        ${
                                            theme === "dark"
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                        }
                                    `}
                                >
                                    No messages yet
                                </p>


                                <p
                                    className={`
                                        text-xs
                                        mt-1

                                        ${
                                            theme === "dark"
                                                ? "text-gray-500"
                                                : "text-gray-400"
                                        }
                                    `}
                                >
                                    Send a message to
                                    start the conversation
                                </p>

                            </div>

                        </div>

                    ) : (

                        Object.entries(
                            groupedMessages
                        ).map(
                            ([date, msgs]) => (

                                <React.Fragment
                                    key={date}
                                >

                                    {renderDateSeparator(
                                        new Date(date)
                                    )}


                                    <div
                                        className="
                                            space-y-1.5
                                        "
                                    >

                                        {msgs
                                            .filter(
                                                (msg) =>
                                                    msg.conversation ===
                                                    selectedContact
                                                        ?.conversation
                                                        ?._id
                                            )
                                            .map(
                                                (msg) => (

                                                    <MessageBubble
                                                        key={
                                                            msg._id ||
                                                            msg.tempId
                                                        }

                                                        message={msg}

                                                        theme={
                                                            theme
                                                        }

                                                        currentUser={
                                                            user
                                                        }

                                                        onReact={
                                                            hndleReaction
                                                        }

                                                        deleteMessage={
                                                            deleteMessage
                                                        }
                                                    />

                                                )
                                            )}

                                    </div>

                                </React.Fragment>

                            )
                        )

                    )}


                    <div
                        ref={messageEndRef}
                    />

                </div>

            </div>


            {/* ================= FILE PREVIEW ================= */}

            {selectedFile && (

                <div
                    className={`
                        px-3
                        sm:px-5
                        py-2
                        border-t

                        ${
                            theme === "dark"
                                ? "bg-[#1c2230] border-[#2b3242]"
                                : "bg-white border-gray-200"
                        }
                    `}
                >

                    <div
                        className="
                            max-w-5xl
                            mx-auto
                        "
                    >

                        <div
                            className={`
                                relative
                                inline-flex
                                items-center
                                gap-3
                                p-2
                                pr-10
                                rounded-xl

                                ${
                                    theme === "dark"
                                        ? "bg-[#252c3b]"
                                        : "bg-gray-100"
                                }
                            `}
                        >

                            {filePreview ? (

                                <img
                                    src={filePreview}
                                    alt="Preview"
                                    className="
                                        w-14
                                        h-14
                                        rounded-lg
                                        object-cover
                                    "
                                />

                            ) : (

                                <div
                                    className={`
                                        w-14
                                        h-14
                                        rounded-lg
                                        flex
                                        items-center
                                        justify-center

                                        ${
                                            theme === "dark"
                                                ? "bg-[#151922]"
                                                : "bg-white"
                                        }
                                    `}
                                >

                                    <FaImage
                                        className="
                                            text-xl
                                            text-gray-400
                                        "
                                    />

                                </div>

                            )}


                            <div
                                className="
                                    max-w-[180px]
                                    sm:max-w-xs
                                "
                            >

                                <p
                                    className={`
                                        text-sm
                                        font-medium
                                        truncate

                                        ${
                                            theme === "dark"
                                                ? "text-white"
                                                : "text-gray-800"
                                        }
                                    `}
                                >
                                    {selectedFile.name}
                                </p>


                                <p
                                    className={`
                                        text-xs
                                        mt-1

                                        ${
                                            theme === "dark"
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                        }
                                    `}
                                >

                                    {(
                                        selectedFile.size /
                                        1024
                                    ).toFixed(1)}{" "}
                                    KB

                                </p>

                            </div>


                            <button
                                onClick={
                                    removeSelectedFile
                                }
                                className="
                                    absolute
                                    top-1
                                    right-1
                                    w-7
                                    h-7
                                    rounded-full
                                    flex
                                    items-center
                                    justify-center
                                    hover:bg-black/10
                                "
                            >

                                <FaTimes
                                    className="text-xs"
                                />

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* ================= COMPOSER ================= */}

            <div
                className={`
                    shrink-0
                    px-3
                    sm:px-5
                    py-3
                    border-t

                    ${
                        theme === "dark"
                            ? "bg-[#1c2230] border-[#2b3242]"
                            : "bg-white border-gray-200"
                    }
                `}
            >

                <div
                    className="
                        max-w-5xl
                        mx-auto
                    "
                >

                    {/* Emoji picker */}

                    {showEmojiPicker && (

                        <div
                            ref={emojiPickerRef}
                            className={`
                                mb-2
                                p-3
                                rounded-2xl
                                shadow-xl
                                border
                                w-fit

                                ${
                                    theme === "dark"
                                        ? "bg-[#1c2230] border-[#343c4d]"
                                        : "bg-white border-gray-200"
                                }
                            `}
                        >

                            <div
                                className="
                                    grid
                                    grid-cols-6
                                    gap-2
                                "
                            >

                                {[
                                    "😀",
                                    "😂",
                                    "😍",
                                    "🥰",
                                    "😎",
                                    "😭",
                                    "😅",
                                    "🤣",
                                    "❤️",
                                    "👍",
                                    "👏",
                                    "🔥"
                                ].map(
                                    (emoji) => (

                                        <button
                                            key={emoji}
                                            onClick={() =>
                                                addEmoji(
                                                    emoji
                                                )
                                            }
                                            className="
                                                w-8
                                                h-8
                                                text-xl
                                                rounded-lg
                                                hover:bg-gray-500/10
                                                transition
                                            "
                                        >
                                            {emoji}
                                        </button>

                                    )
                                )}

                            </div>

                        </div>

                    )}


                    {/* File input */}

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={
                            handleFileChange
                        }
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />


                    {/* Composer */}

                    <div
                        className={`
                            flex
                            items-end
                            gap-2
                            p-2
                            rounded-2xl

                            ${
                                theme === "dark"
                                    ? "bg-[#252c3b]"
                                    : "bg-[#f5f7fa] border border-gray-200"
                            }
                        `}
                    >

                        {/* Attachment */}

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            className={`
                                shrink-0
                                w-10
                                h-10
                                rounded-full
                                flex
                                items-center
                                justify-center
                                transition

                                ${
                                    theme === "dark"
                                        ? "text-gray-300 hover:bg-[#343c4d]"
                                        : "text-gray-500 hover:bg-gray-200"
                                }
                            `}
                            title="Attach file"
                        >

                            <FaPaperclip />

                        </button>


                        {/* Emoji */}

                        <button
                            type="button"
                            onClick={() =>
                                setShowEmojiPicker(
                                    !showEmojiPicker
                                )
                            }
                            className={`
                                shrink-0
                                w-10
                                h-10
                                rounded-full
                                flex
                                items-center
                                justify-center
                                transition

                                ${
                                    showEmojiPicker
                                        ? "text-green-500"
                                        : theme === "dark"
                                            ? "text-gray-300 hover:bg-[#343c4d]"
                                            : "text-gray-500 hover:bg-gray-200"
                                }
                            `}
                            title="Emoji"
                        >

                            <FaSmile />

                        </button>


                        {/* Input */}

                        <textarea
                            value={message}
                            onChange={
                                handleMessageChange
                            }
                            onKeyDown={
                                handleKeyDown
                            }
                            rows={1}
                            placeholder="Type a message..."
                            className={`
                                flex-1
                                resize-none
                                bg-transparent
                                outline-none
                                border-none
                                px-2
                                py-2
                                text-sm
                                sm:text-[15px]
                                max-h-28

                                ${
                                    theme === "dark"
                                        ? "text-white placeholder:text-gray-500"
                                        : "text-gray-800 placeholder:text-gray-400"
                                }
                            `}
                        />


                        {/* Send */}

                        <button
                            type="button"
                            onClick={
                                handleSendMessage
                            }
                            disabled={
                                !message.trim() &&
                                !selectedFile
                            }
                            className={`
                                shrink-0
                                w-10
                                h-10
                                rounded-full
                                flex
                                items-center
                                justify-center
                                transition

                                ${
                                    message.trim() ||
                                    selectedFile
                                        ? "bg-green-500 text-white hover:bg-green-600 active:scale-95"
                                        : theme === "dark"
                                            ? "bg-[#343c4d] text-gray-500"
                                            : "bg-gray-200 text-gray-400"
                                }
                            `}
                            title="Send message"
                        >

                            <FaPaperPlane
                                className="
                                    text-sm
                                    ml-0.5
                                "
                            />

                        </button>

                    </div>


                    <p
                        className={`
                            text-[10px]
                            text-center
                            mt-2

                            ${
                                theme === "dark"
                                    ? "text-gray-600"
                                    : "text-gray-400"
                            }
                        `}
                    >
                        Press Enter to send • Shift + Enter
                        for a new line
                    </p>

                </div>

            </div>

        </div>

    );

};


export default ChatWindow;