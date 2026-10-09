import React, { useState } from "react";
import {
    FaCheck,
    FaCheckDouble,
    FaTrash,
    FaSmile,
    FaTimes
} from "react-icons/fa";

import { useChatStore } from "../../store/chatStore";

function MessageBubble({
  message,
    theme,
    currentUser,
}) {
     const { addReaction, deleteMessage } = useChatStore();
    const [showReactions, setShowReactions] = useState(false);
    const [showReactionDetails, setShowReactionDetails] = useState(false);

    const senderId =
        typeof message?.sender === "object"
            ? message?.sender?._id
            : message?.sender;

    const currentUserId = currentUser?._id;

    const isSender =
        senderId?.toString() === currentUserId?.toString();

    const emojis = [
        "❤️",
        "😂",
        "👍",
        "😮",
        "😢",
        "🔥",
    ];

    const handleReaction = (emoji) => {
    if (!message?._id || !currentUser?._id) {
        console.log("Reaction failed: missing messageId or userId");
        return;
    }

    console.log("Adding reaction:", {
        messageId: message._id,
        emoji,
        userId: currentUser._id
    });

    addReaction(
        message._id,
        emoji,
        currentUser._id
    );

    setShowReactions(false);
};

    // GROUP SAME EMOJIS
    const reactionGroups = {};

    message?.reactions?.forEach((reaction) => {

        if (!reactionGroups[reaction.emoji]) {
            reactionGroups[reaction.emoji] = [];
        }

        reactionGroups[reaction.emoji].push(reaction);
    });

  const handleDelete = () => {
    const confirmed = window.confirm(
        "Are you sure you want to delete this message?"
    );

    if (!confirmed) return;

    if (!message?._id) {
        console.log("Delete failed: message ID missing");
        return;
    }

    console.log("Deleting message:", message._id);

    deleteMessage(message._id);
};

    const getStatus = () => {

        if (!isSender) return null;

        if (message?.messageStatus === "read") {
            return (
                <FaCheckDouble className="text-blue-400 text-[10px]" />
            );
        }

        if (message?.messageStatus === "delivered") {
            return (
                <FaCheckDouble className="text-gray-400 text-[10px]" />
            );
        }

        if (message?.messageStatus === "failed") {
            return (
                <span className="text-red-400 text-[9px]">
                    Failed
                </span>
            );
        }

        return (
            <FaCheck className="text-gray-400 text-[10px]" />
        );
    };

    return (
        <div
            className={`flex w-full mb-5 ${
                isSender
                    ? "justify-end"
                    : "justify-start"
            }`}
        >

            <div
                className="relative flex flex-col max-w-[82%] sm:max-w-[70%] md:max-w-[65%]"
            >

                {/* REACTION PICKER */}

                {showReactions && (
                    <div
                        className={`absolute bottom-full mb-2 z-50 flex gap-1 p-2 rounded-full shadow-xl border ${
                            isSender
                                ? "right-0"
                                : "left-0"
                        } ${
                            theme === "dark"
                                ? "bg-[#252c3b] border-[#343c4d]"
                                : "bg-white border-gray-200"
                        }`}
                    >

                        {emojis.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                    handleReaction(emoji)
                                }
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-lg hover:bg-gray-500/20 active:scale-90 transition"
                            >
                                {emoji}
                            </button>
                        ))}

                    </div>
                )}

                {/* MESSAGE */}

                <div
                    className={`relative px-3 py-2 rounded-2xl shadow-sm ${
                        isSender
                            ? theme === "dark"
                                ? "bg-[#263b5e] text-white rounded-br-md"
                                : "bg-[#dbeafe] text-gray-800 rounded-br-md"
                            : theme === "dark"
                                ? "bg-[#252c3b] text-white rounded-bl-md"
                                : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                    }`}
                >

                    {/* IMAGE */}

                    {message?.contentType === "image" &&
                        message?.imageOrVideoUrl && (
                            <img
                                src={message.imageOrVideoUrl}
                                alt="message"
                                className="max-w-full max-h-72 sm:max-h-96 rounded-xl object-cover"
                            />
                        )}

                    {/* VIDEO */}

                    {message?.contentType === "video" &&
                        message?.imageOrVideoUrl && (
                            <video
                                src={message.imageOrVideoUrl}
                                controls
                                className="max-w-full max-h-72 sm:max-h-96 rounded-xl"
                            />
                        )}

                    {/* TEXT */}

                    {message?.content && (
                        <p className="text-sm sm:text-[15px] whitespace-pre-wrap break-words leading-5">
                            {message.content}
                        </p>
                    )}

                    {/* TIME + STATUS */}

                    <div className="flex justify-end items-center gap-1 mt-1">

                        <span
                            className={`text-[10px] ${
                                theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                            }`}
                        >
                            {message?.createdAt
                                ? new Date(
                                      message.createdAt
                                  ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })
                                : ""}
                        </span>

                        {getStatus()}

                    </div>


                    {/* REACTION BADGES */}

                    {Object.keys(reactionGroups).length > 0 && (

                        <div
                            className={`absolute -bottom-3 ${
                                isSender
                                    ? "right-2"
                                    : "left-2"
                            } flex gap-1 z-20`}
                        >

                            {Object.entries(
                                reactionGroups
                            ).map(([emoji, reactions]) => (

                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() =>
                                        setShowReactionDetails(
                                            true
                                        )
                                    }
                                    className={`min-w-[30px] h-7 px-1.5 flex items-center justify-center gap-1 rounded-full border shadow-md text-xs ${
                                        theme === "dark"
                                            ? "bg-[#202633] border-[#343c4d]"
                                            : "bg-white border-gray-200"
                                    }`}
                                >

                                    <span className="text-sm">
                                        {emoji}
                                    </span>

                                    {reactions.length > 1 && (
                                        <span>
                                            {reactions.length}
                                        </span>
                                    )}

                                </button>

                            ))}

                        </div>
                    )}

                </div>


                {/* REACTION DETAILS POPUP */}

                {showReactionDetails && (

                    <div
                        className={`absolute z-50 bottom-10 ${
                            isSender
                                ? "right-0"
                                : "left-0"
                        } w-64 rounded-xl shadow-2xl border p-3 ${
                            theme === "dark"
                                ? "bg-[#202633] border-[#343c4d] text-white"
                                : "bg-white border-gray-200 text-gray-800"
                        }`}
                    >

                        <div className="flex justify-between items-center mb-3">

                            <span className="font-semibold text-sm">
                                Reactions
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowReactionDetails(
                                        false
                                    )
                                }
                                className="text-gray-400 hover:text-red-400"
                            >
                                <FaTimes />
                            </button>

                        </div>


                        <div className="max-h-48 overflow-y-auto">

                            {message?.reactions?.map(
                                (reaction, index) => (

                                    <div
                                        key={
                                            reaction?.user?._id ||
                                            index
                                        }
                                        className="flex items-center gap-3 py-2"
                                    >

                                        {/* USER IMAGE */}

                                        {reaction?.user
                                            ?.profilePicture ? (
                                            <img
                                                src={
                                                    reaction.user
                                                        .profilePicture
                                                }
                                                alt=""
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-xs">
                                                ?
                                            </div>
                                        )}

                                        {/* USERNAME */}

                                        <span className="text-sm flex-1 truncate">
                                            {reaction?.user
                                                ?.username ||
                                                "Unknown user"}
                                        </span>

                                        {/* EMOJI */}

                                        <span className="text-lg">
                                            {reaction?.emoji}
                                        </span>

                                    </div>
                                )
                            )}

                        </div>

                    </div>
                )}


                {/* ACTION BUTTONS */}

                <div
                    className={`flex items-center gap-1 mt-1 ${
                        isSender
                            ? "justify-end"
                            : "justify-start"
                    }`}
                >

                    {/* REACTION BUTTON */}

                    <button
                        type="button"
                        onClick={() =>
                            setShowReactions(
                                !showReactions
                            )
                        }
                        className={`w-7 h-7 flex items-center justify-center rounded-full ${
                            theme === "dark"
                                ? "text-gray-400 hover:bg-[#252c3b]"
                                : "text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                        <FaSmile className="text-xs" />
                    </button>


                    {/* DELETE */}

                    {isSender && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className={`w-7 h-7 flex items-center justify-center rounded-full ${
                                theme === "dark"
                                    ? "text-gray-500 hover:text-red-400 hover:bg-[#252c3b]"
                                    : "text-gray-400 hover:text-red-500 hover:bg-gray-100"
                            }`}
                        >
                            <FaTrash className="text-[10px]" />
                        </button>
                    )}

                </div>

            </div>

        </div>
    );
}

export default MessageBubble;