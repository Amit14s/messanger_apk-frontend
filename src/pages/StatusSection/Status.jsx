
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    FaPlus,
    FaTimes,
    FaTrash,
    FaImage,
    FaVideo,
    FaEye,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";

import axiosInstance from "../../services/url.service";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import { useChatStore } from "../../store/chatStore";

const getResponseData = (response) => {
    const body = response?.data;
    return body?.data ?? body;
};

const getOwnerId = (status) =>
    String(status?.user?._id ?? status?.user ?? "");

const Status = () => {
    const user = useUserStore((state) => state.user);
    const { theme } = useThemeStore();

    const statuses = useChatStore((state) => state.statuses);
    const setStatuses = useChatStore((state) => state.setStatuses);
    const addStatus = useChatStore((state) => state.addStatus);
    const removeStatus = useChatStore((state) => state.removeStatus);
    const updateStatusView = useChatStore(
        (state) => state.updateStatusView
    );
    const initSocketListeners = useChatStore(
        (state) => state.initsocketListners
    );

    const userId = String(user?._id ?? user?.userId ?? "");
    const dark = theme === "dark";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showComposer, setShowComposer] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [content, setContent] = useState("");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [activeOwnerId, setActiveOwnerId] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const fileRef = useRef(null);

    const panel = dark
        ? "border-gray-700 bg-gray-900 text-gray-100"
        : "border-gray-200 bg-white text-gray-900";

    const muted = dark ? "text-gray-400" : "text-gray-500";

    useEffect(() => {
        let cancelled = false;

        initSocketListeners();

        const fetchStatuses = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axiosInstance.get(
                    "/status/conversations"
                );

                const data = getResponseData(response);

                if (!cancelled) {
                    setStatuses(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err?.response?.data?.message ||
                            "Failed to load statuses."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchStatuses();

        return () => {
            cancelled = true;
        };
    }, [initSocketListeners, setStatuses]);

    useEffect(() => {
        if (!preview) return;

        return () => URL.revokeObjectURL(preview);
    }, [preview]);

    const groups = useMemo(() => {
        const map = new Map();

        statuses.forEach((status) => {
            const ownerId = getOwnerId(status);
            if (!ownerId || !status?._id) return;

            if (!map.has(ownerId)) {
                map.set(ownerId, {
                    ownerId,
                    user: status.user,
                    statuses: [],
                });
            }

            map.get(ownerId).statuses.push(status);
        });

        return [...map.values()]
            .map((group) => ({
                ...group,
                statuses: group.statuses.sort(
                    (a, b) =>
                        new Date(a.createdAt || 0) -
                        new Date(b.createdAt || 0)
                ),
            }))
            .sort((a, b) => {
                const latest = (group) =>
                    Math.max(
                        ...group.statuses.map((s) =>
                            new Date(s.createdAt || 0).getTime()
                        )
                    );

                return latest(b) - latest(a);
            });
    }, [statuses]);

    const myStatuses = statuses.filter(
        (status) => getOwnerId(status) === userId
    );

    const activeStatuses = useMemo(
        () =>
            statuses
                .filter(
                    (status) =>
                        getOwnerId(status) === String(activeOwnerId || "")
                )
                .sort(
                    (a, b) =>
                        new Date(a.createdAt || 0) -
                        new Date(b.createdAt || 0)
                ),
        [statuses, activeOwnerId]
    );

    const activeStatus = activeStatuses[activeIndex] || null;

    useEffect(() => {
        if (activeOwnerId && activeStatuses.length === 0) {
            setActiveOwnerId(null);
            setActiveIndex(0);
        } else if (activeIndex >= activeStatuses.length) {
            setActiveIndex(Math.max(0, activeStatuses.length - 1));
        }
    }, [activeOwnerId, activeStatuses.length, activeIndex]);

    const nameOf = (group) =>
        group.ownerId === userId
            ? "My status"
            : group.user?.username || group.user?.name || "User";

    const avatarOf = (person) => person?.profilePicture || "";

    const timeOf = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const countOf = (status) => status?.viewers?.length || 0;

    const openStatuses = async (ownerId) => {
        const list = statuses
            .filter((status) => getOwnerId(status) === String(ownerId))
            .sort(
                (a, b) =>
                    new Date(a.createdAt || 0) -
                    new Date(b.createdAt || 0)
            );

        if (!list.length) return;

        setActiveOwnerId(String(ownerId));
        setActiveIndex(0);
        await markAsViewed(list[0]);
    };

    const markAsViewed = async (status) => {
        if (!status?._id || !userId) return;

        const alreadyViewed = (status.viewers || []).some(
            (viewer) =>
                String(viewer?._id ?? viewer) === userId
        );

        if (alreadyViewed) return;

        const viewers = [...(status.viewers || []), userId];

        updateStatusView({
            statusId: String(status._id),
            viewerId: userId,
            totalViewers: viewers.length,
            viewers,
        });

        try {
            await axiosInstance.put(`/status/${status._id}/view`);
        } catch (err) {
            console.error("Failed to mark status viewed:", err);
        }
    };

    const navigateStatus = async (direction) => {
        const next = activeIndex + direction;

        if (next < 0 || next >= activeStatuses.length) {
            setActiveOwnerId(null);
            setActiveIndex(0);
            return;
        }

        setActiveIndex(next);
        await markAsViewed(activeStatuses[next]);
    };

    const resetComposer = () => {
        setContent("");
        setFile(null);
        setPreview("");
        setShowComposer(false);

        if (fileRef.current) fileRef.current.value = "";
    };

    const handleFileChange = (event) => {
        const selected = event.target.files?.[0];
        if (!selected) return;

        if (
            !selected.type.startsWith("image/") &&
            !selected.type.startsWith("video/")
        ) {
            setError("Please select an image or video.");
            event.target.value = "";
            return;
        }

        setError("");
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
    };

    const createStatus = async (event) => {
        event.preventDefault();

        if (!file && !content.trim()) {
            setError("Write something or select a photo/video.");
            return;
        }

        try {
            setUploading(true);
            setError("");

            const formData = new FormData();

            if (file) {
                formData.append("media", file);
            } else {
                formData.append("content", content.trim());
            }

            const response = await axiosInstance.post(
                "/status",
                formData
            );

            const created = getResponseData(response);

            if (created?._id) {
                addStatus(created);
            } else {
                const refresh = await axiosInstance.get(
                    "/status/conversations"
                );
                const data = getResponseData(refresh);
                setStatuses(Array.isArray(data) ? data : []);
            }

            resetComposer();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    "Failed to create status."
            );
        } finally {
            setUploading(false);
        }
    };

    const deleteStatus = async (status) => {
        if (!status?._id) return;
        if (!window.confirm("Delete this status?")) return;

        try {
            await axiosInstance.delete(`/status/${status._id}`);
            removeStatus(status._id);

            if (
                String(activeOwnerId) === userId &&
                activeStatuses.length <= 1
            ) {
                setActiveOwnerId(null);
                setActiveIndex(0);
            }
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    "Failed to delete status."
            );
        }
    };

    const renderMedia = (status, large = false) => {
        if (status?.contentType === "image") {
            return (
                <img
                    src={status.content}
                    alt="Status"
                    className={
                        large
                            ? "max-h-full max-w-full object-contain"
                            : "h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    }
                />
            );
        }

        if (status?.contentType === "video") {
            return large ? (
                <video
                    src={status.content}
                    controls
                    autoPlay
                    className="max-h-full max-w-full object-contain"
                />
            ) : (
                <div className="relative h-full w-full">
                    <video
                        src={status.content}
                        muted
                        preload="metadata"
                        className="h-full w-full object-cover"
                    />
                    <FaVideo className="absolute right-3 top-3 text-white drop-shadow" />
                </div>
            );
        }

        return (
            <div
                className={`flex h-full w-full items-center justify-center overflow-hidden whitespace-pre-wrap break-words bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 text-center font-medium text-white ${
                    large ? "text-2xl sm:text-3xl" : "text-sm"
                }`}
            >
                {status?.content}
            </div>
        );
    };

    return (
        <main
            className={`min-h-screen p-4 sm:p-6 ${
                dark ? "bg-gray-950" : "bg-gray-50"
            }`}
        >
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-7 flex items-center justify-between gap-3">
                    <div>
                        <h1
                            className={`text-2xl font-bold sm:text-3xl ${
                                dark ? "text-white" : "text-gray-900"
                            }`}
                        >
                            Status
                        </h1>
                        <p className={`mt-1 text-sm ${muted}`}>
                            Share a moment with your friends.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowComposer(true)}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                    >
                        <FaPlus />
                        <span className="hidden sm:inline">Add status</span>
                    </button>
                </div>

                {error && (
                    <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span>{error}</span>
                        <button
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}

                {/* My status */}
                <section className={`mb-8 rounded-xl border p-4 sm:p-5 ${panel}`}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold">My status</h2>
                        <span className={`text-xs ${muted}`}>
                            {myStatuses.length} updates
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() =>
                                myStatuses.length
                                    ? openStatuses(userId)
                                    : setShowComposer(true)
                            }
                            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-green-500 p-1"
                        >
                            {avatarOf(user) ? (
                                <img
                                    src={avatarOf(user)}
                                    alt="Your profile"
                                    className="h-full w-full rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center rounded-full bg-green-100 text-xl font-semibold text-green-700">
                                    {(user?.username || "Y")
                                        .charAt(0)
                                        .toUpperCase()}
                                </span>
                            )}

                            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-600 text-xs text-white">
                                <FaPlus />
                            </span>
                        </button>

                        <div className="min-w-0 flex-1">
                            <p className="font-medium">
                                {myStatuses.length
                                    ? "View your updates"
                                    : "Share your first update"}
                            </p>
                            <p className={`mt-1 text-sm ${muted}`}>
                                {myStatuses.length
                                    ? "Your status disappears after 24 hours."
                                    : "Photos, videos, or a simple text update."}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowComposer(true)}
                            className={`rounded-lg border px-3 py-2 text-sm transition ${
                                dark
                                    ? "border-gray-700 hover:bg-gray-800"
                                    : "border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                            Create
                        </button>
                    </div>

                    {myStatuses.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {myStatuses.map((status) => (
                                <div key={status._id} className="min-w-0">
                                    <button
                                        onClick={() => openStatuses(userId)}
                                        className="group relative h-36 w-full overflow-hidden rounded-lg bg-gray-200 sm:h-40"
                                    >
                                        {renderMedia(status)}
                                        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
                                            <FaEye />
                                            {countOf(status)} views
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => deleteStatus(status)}
                                        className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                                    >
                                        <FaTrash />
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Friends' stories */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2
                                className={`text-lg font-semibold ${
                                    dark ? "text-white" : "text-gray-900"
                                }`}
                            >
                                Recent updates
                            </h2>
                            <p className={`mt-1 text-sm ${muted}`}>
                                See what's new with your friends.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className={`h-48 animate-pulse rounded-xl ${
                                        dark ? "bg-gray-800" : "bg-gray-200"
                                    }`}
                                />
                            ))}
                        </div>
                    ) : groups.filter((group) => group.ownerId !== userId).length === 0 ? (
                        <div
                            className={`rounded-xl border border-dashed p-10 text-center ${panel}`}
                        >
                            <div className="mb-3 text-3xl">◯</div>
                            <p className="font-medium">No new updates yet</p>
                            <p className={`mt-1 text-sm ${muted}`}>
                                When your friends share statuses, they'll appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {groups
                                .filter((group) => group.ownerId !== userId)
                                .map((group) => (
                                    <button
                                        key={group.ownerId}
                                        onClick={() => openStatuses(group.ownerId)}
                                        className={`group overflow-hidden rounded-xl border text-left transition hover:-translate-y-1 hover:shadow-md ${panel}`}
                                    >
                                        <div className="relative h-36 overflow-hidden bg-gray-200 sm:h-44">
                                            {renderMedia(
                                                group.statuses[
                                                    group.statuses.length - 1
                                                ]
                                            )}

                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
                                                <p className="truncate text-sm font-semibold text-white">
                                                    {group.user?.username ||
                                                        group.user?.name ||
                                                        "User"}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-200">
                                                    {group.statuses.length}{" "}
                                                    {group.statuses.length === 1
                                                        ? "update"
                                                        : "updates"}
                                                </p>
                                            </div>

                                            <div className="absolute left-3 top-3 h-10 w-10 overflow-hidden rounded-full border-2 border-green-400 bg-white">
                                                {avatarOf(group.user) ? (
                                                    <img
                                                        src={avatarOf(group.user)}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="flex h-full w-full items-center justify-center font-semibold text-green-700">
                                                        {(group.user?.username ||
                                                            "U")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="px-3 py-3">
                                            <p className={`text-xs ${muted}`}>
                                                Latest update ·{" "}
                                                {timeOf(
                                                    group.statuses[
                                                        group.statuses.length - 1
                                                    ]?.createdAt
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Create status */}
            {showComposer && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            resetComposer();
                        }
                    }}
                >
                    <div
                        className={`w-full max-w-lg rounded-xl border p-5 shadow-xl sm:p-6 ${panel}`}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Create status
                            </h2>
                            <button
                                onClick={resetComposer}
                                className={`rounded-lg p-2 ${muted} hover:bg-gray-500/10`}
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={createStatus}>
                            <textarea
                                value={content}
                                onChange={(event) =>
                                    setContent(event.target.value)
                                }
                                rows={4}
                                placeholder="What's on your mind?"
                                className={`w-full resize-none rounded-lg border p-3 outline-none focus:border-green-500 ${
                                    dark
                                        ? "border-gray-700 bg-gray-800 text-white placeholder-gray-500"
                                        : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                                }`}
                            />

                            {preview && (
                                <div className="relative mt-3 overflow-hidden rounded-lg">
                                    {file?.type.startsWith("video/") ? (
                                        <video
                                            src={preview}
                                            controls
                                            className="max-h-64 w-full bg-black object-contain"
                                        />
                                    ) : (
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="max-h-64 w-full object-contain"
                                        />
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFile(null);
                                            setPreview("");
                                            if (fileRef.current) {
                                                fileRef.current.value = "";
                                            }
                                        }}
                                        className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white"
                                        aria-label="Remove media"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            )}

                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                        dark
                                            ? "border-gray-700 hover:bg-gray-800"
                                            : "border-gray-200 hover:bg-gray-100"
                                    }`}
                                >
                                    <FaImage className="text-green-600" />
                                    <FaVideo className="text-blue-500" />
                                    Add media
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        uploading ||
                                        (!file && !content.trim())
                                    }
                                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <FaPlus />
                                    {uploading ? "Sharing..." : "Share status"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Fullscreen status viewer */}
            {activeStatus && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-3"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setActiveOwnerId(null);
                        }
                    }}
                >
                    <div className="relative flex h-[85vh] max-h-[850px] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-gray-950 text-white sm:h-[90vh]">
                        <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent p-4">
                            {avatarOf(activeStatus.user) ? (
                                <img
                                    src={avatarOf(activeStatus.user)}
                                    alt=""
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 font-semibold">
                                    {(activeStatus.user?.username || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                    {getOwnerId(activeStatus) === userId
                                        ? "My status"
                                        : activeStatus.user?.username || "User"}
                                </p>
                                <p className="mt-1 text-xs text-gray-300">
                                    {timeOf(activeStatus.createdAt)}
                                </p>
                            </div>

                            {getOwnerId(activeStatus) === userId && (
                                <span className="flex items-center gap-1 text-sm text-gray-200">
                                    <FaEye />
                                    {countOf(activeStatus)}
                                </span>
                            )}

                            {getOwnerId(activeStatus) === userId && (
                                <button
                                    onClick={() => deleteStatus(activeStatus)}
                                    className="rounded-full p-2 hover:bg-white/10"
                                    aria-label="Delete status"
                                >
                                    <FaTrash />
                                </button>
                            )}

                            <button
                                onClick={() => setActiveOwnerId(null)}
                                className="rounded-full p-2 hover:bg-white/10"
                                aria-label="Close viewer"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
                            {renderMedia(activeStatus, true)}
                        </div>

                        {activeStatuses.length > 1 && (
                            <>
                                <button
                                    onClick={() => navigateStatus(-1)}
                                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
                                    aria-label="Previous status"
                                >
                                    <FaChevronLeft />
                                </button>

                                <button
                                    onClick={() => navigateStatus(1)}
                                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
                                    aria-label="Next status"
                                >
                                    <FaChevronRight />
                                </button>
                            </>
                        )}

                        <div className="flex items-center justify-between bg-black/50 px-4 py-3 text-xs text-gray-300">
                            <span>
                                {activeIndex + 1} of {activeStatuses.length}
                            </span>
                            {getOwnerId(activeStatus) === userId && (
                                <span className="flex items-center gap-2">
                                    <FaEye />
                                    {countOf(activeStatus)} views
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Status;
