import React, { useState } from "react";

import {
    FaArrowLeft,
    FaEdit,
    FaSignOutAlt,
    FaCamera,
    FaMoon,
    FaBell,
    FaLock
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import useUserStore from "../store/useUserStore";
import useThemeStore from "../store/themeStore";

import {
    updateUserProfile,
    logoutUser
} from "../services/user.services.js";


function UserProfile() {

    const navigate = useNavigate();

    const { theme, setTheme } = useThemeStore();
    const {user,isAuthenticated,setUser,clearUser}=useUserStore();
    const [edit, setEdit] = useState(false);

    const [username, setUsername] = useState(
        user?.username || ""
    );

    const [about, setAbout] = useState(
        user?.about || ""
    );

    const [profileFile, setProfileFile] = useState(null);

    const [preview, setPreview] = useState(
        user?.profilePicture || ""
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    // =========================
    // CHANGE PROFILE PICTURE
    // =========================

    const handleImageChange = (e) => {

        const file = e.target.files?.[0];

        if (!file) return;

        setProfileFile(file);
        setPreview(URL.createObjectURL(file));
    };


    // =========================
    // UPDATE PROFILE
    // =========================

    const handleUpdate = async () => {

        try {

            setLoading(true);
            setError("");

            const formData = new FormData();

            formData.append("username", username);
            formData.append("about", about);

            if (profileFile) {
                formData.append("media", profileFile);
            }

            const response =
                await updateUserProfile(formData);

            console.log("Profile updated:", response);

            const updatedUser =
                response?.data?.user ||
                response?.data;

            if (updatedUser) {
                setUser(updatedUser);
            }

            setEdit(false);
            setProfileFile(null);

        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );

            setError(
                error?.message ||
                error?.response?.data?.message ||
                "Failed to update profile"
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================
    // LOGOUT
    // =========================
const handleLogout = async () => {
    try {
        setLoading(true);
        setError("");

        await logoutUser();

        clearUser();

        window.location.href = "/user-login";

    } catch (error) {
        console.error("Logout error:", error);

        setError(
            error?.message || "Failed to logout"
        );
    } finally {
        setLoading(false);
    }
};


    return (

        <div
            className={`min-h-screen w-full ${
                theme === "dark"
                    ? "bg-[#111b21] text-white"
                    : "bg-gray-100 text-gray-800"
            }`}
        >

            {/* ================= HEADER ================= */}

            <div
                className={`w-full flex items-center px-5 py-4 border-b ${
                    theme === "dark"
                        ? "bg-[#202c33] border-gray-700"
                        : "bg-white border-gray-200"
                }`}
            >

                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className={`p-2 mr-3 rounded-full ${
                        theme === "dark"
                            ? "hover:bg-[#2a3942] text-white"
                            : "hover:bg-gray-200 text-gray-800"
                    }`}
                >
                    <FaArrowLeft />
                </button>

                <h2 className="text-xl font-semibold">
                    Profile
                </h2>

            </div>


            {/* ================= MAIN CONTENT ================= */}

            <div className="max-w-md mx-auto px-6 py-8">


                {/* ================= PROFILE IMAGE ================= */}

                <div className="flex justify-center">

                    <div className="relative">

                        {preview ? (

                            <img
                                src={preview}
                                alt={user?.username}
                                className="w-32 h-32 rounded-full object-cover"
                            />

                        ) : (

                            <div
                                className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl font-semibold ${
                                    theme === "dark"
                                        ? "bg-[#29466f] text-white"
                                        : "bg-[#cfe0f5] text-gray-800"
                                }`}
                            >
                                {user?.username
                                    ?.charAt(0)
                                    ?.toUpperCase()}
                            </div>

                        )}


                        {edit && (

                            <label
                                className={`absolute bottom-1 right-1 w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg ${
                                    theme === "dark"
                                        ? "bg-green-600 hover:bg-green-500"
                                        : "bg-green-500 hover:bg-green-600"
                                }`}
                            >

                                <FaCamera />

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />

                            </label>

                        )}

                    </div>

                </div>


                {/* ================= NAME ================= */}

                {!edit ? (

                    <div className="text-center mt-4">

                        <h1 className="text-2xl font-bold">
                            {user?.username || "User"}
                        </h1>

                        <p
                            className={`text-sm mt-1 ${
                                theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                            }`}
                        >
                            {user?.isOnline
                                ? "Online"
                                : "Offline"}
                        </p>

                    </div>

                ) : (

                    <div className="mt-5">

                        <label
                            className={`text-sm ${
                                theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                            }`}
                        >
                            Name
                        </label>

                        <input
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            className={`w-full mt-1 px-4 py-3 rounded-xl border outline-none ${
                                theme === "dark"
                                    ? "bg-[#111b21] border-gray-600 text-white placeholder-gray-500"
                                    : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
                            }`}
                        />

                    </div>

                )}


                {/* ================= ABOUT ================= */}

                <div className="mt-6">

                    <p
                        className={`text-xs mb-1 ${
                            theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                        }`}
                    >
                        ABOUT
                    </p>


                    {!edit ? (

                        <p
                            className={`text-sm ${
                                theme === "dark"
                                    ? "text-gray-200"
                                    : "text-gray-700"
                            }`}
                        >
                            {user?.about ||
                                "Hey there! I am using Messenger."}
                        </p>

                    ) : (

                        <textarea
                            value={about}
                            onChange={(e) =>
                                setAbout(e.target.value)
                            }
                            rows="3"
                            placeholder="Write something about yourself..."
                            className={`w-full px-4 py-3 rounded-xl border outline-none resize-none ${
                                theme === "dark"
                                    ? "bg-[#111b21] border-gray-600 text-white placeholder-gray-500"
                                    : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
                            }`}
                        />

                    )}

                </div>


                {/* ================= CONTACT ================= */}

                <div className="mt-6">

                    <p
                        className={`text-xs mb-3 ${
                            theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                        }`}
                    >
                        CONTACT INFORMATION
                    </p>


                    {/* EMAIL */}

                    {user?.email && (

                        <div
                            className={`p-3 rounded-xl mb-2 ${
                                theme === "dark"
                                    ? "bg-[#202c33]"
                                    : "bg-white"
                            }`}
                        >

                            <p
                                className={`text-xs ${
                                    theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                }`}
                            >
                                Email
                            </p>

                            <p
                                className={`text-sm mt-1 ${
                                    theme === "dark"
                                        ? "text-white"
                                        : "text-gray-800"
                                }`}
                            >
                                {user.email}
                            </p>

                        </div>

                    )}


                    {/* PHONE */}

                    {user?.phoneNumber && (

                        <div
                            className={`p-3 rounded-xl ${
                                theme === "dark"
                                    ? "bg-[#202c33]"
                                    : "bg-white"
                            }`}
                        >

                            <p
                                className={`text-xs ${
                                    theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                }`}
                            >
                                Phone
                            </p>

                            <p
                                className={`text-sm mt-1 ${
                                    theme === "dark"
                                        ? "text-white"
                                        : "text-gray-800"
                                }`}
                            >
                                {user?.phoneSuffix}
                                {user?.phoneNumber}
                            </p>

                        </div>

                    )}

                </div>


                {/* ================= ERROR ================= */}

                {error && (

                    <p className="text-sm text-red-500 mt-4">
                        {error}
                    </p>

                )}


                {/* ================= EDIT / SAVE ================= */}

                {!edit ? (

                    <button
                        type="button"
                        onClick={() => setEdit(true)}
                        className={`w-full mt-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 ${
                            theme === "dark"
                                ? "bg-green-600 hover:bg-green-500"
                                : "bg-green-500 hover:bg-green-600"
                        }`}
                    >

                        <FaEdit />

                        Update Profile

                    </button>

                ) : (

                    <div className="mt-6 flex gap-2">

                        <button
                            type="button"
                            onClick={() => {

                                setEdit(false);

                                setUsername(
                                    user?.username || ""
                                );

                                setAbout(
                                    user?.about || ""
                                );

                                setPreview(
                                    user?.profilePicture || ""
                                );

                                setProfileFile(null);

                            }}
                            className={`flex-1 py-3 rounded-xl ${
                                theme === "dark"
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                            }`}
                        >
                            Cancel
                        </button>


                        <button
                            type="button"
                            onClick={handleUpdate}
                            disabled={loading}
                            className={`flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-50 ${
                                theme === "dark"
                                    ? "bg-green-600 hover:bg-green-500"
                                    : "bg-green-500 hover:bg-green-600"
                            }`}
                        >

                            {loading
                                ? "Saving..."
                                : "Save Changes"}

                        </button>

                    </div>

                )}


                {/* ================= SETTINGS ================= */}

                {!edit && (

                    <div className="mt-6 space-y-2">


                        {/* APPEARANCE */}

                        <button
                            type="button"
                            onClick={() =>
                                setTheme(
                                    theme === "dark"
                                        ? "light"
                                        : "dark"
                                )
                            }
                            className={`w-full p-4 rounded-xl flex items-center gap-3 ${
                                theme === "dark"
                                    ? "hover:bg-[#2a3942]"
                                    : "hover:bg-gray-200"
                            }`}
                        >

                            <FaMoon />

                            <div className="flex-1 text-left">

                                <p className="font-medium">
                                    Appearance
                                </p>

                                <p
                                    className={`text-xs ${
                                        theme === "dark"
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {theme === "dark"
                                        ? "Dark mode"
                                        : "Light mode"}
                                </p>

                            </div>

                        </button>


                        {/* NOTIFICATIONS */}

                        <button
                            type="button"
                            className={`w-full p-4 rounded-xl flex items-center gap-3 ${
                                theme === "dark"
                                    ? "hover:bg-[#2a3942]"
                                    : "hover:bg-gray-200"
                            }`}
                        >

                            <FaBell />

                            <div className="flex-1 text-left">

                                <p className="font-medium">
                                    Notifications
                                </p>

                                <p
                                    className={`text-xs ${
                                        theme === "dark"
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                >
                                    Manage notifications
                                </p>

                            </div>

                            <span
                                className={
                                    theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                }
                            >
                                ›
                            </span>

                        </button>


                        {/* PRIVACY */}

                        <button
                            type="button"
                            className={`w-full p-4 rounded-xl flex items-center gap-3 ${
                                theme === "dark"
                                    ? "hover:bg-[#2a3942]"
                                    : "hover:bg-gray-200"
                            }`}
                        >

                            <FaLock />

                            <div className="flex-1 text-left">

                                <p className="font-medium">
                                    Privacy
                                </p>

                                <p
                                    className={`text-xs ${
                                        theme === "dark"
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                >
                                    Privacy settings
                                </p>

                            </div>

                            <span
                                className={
                                    theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                }
                            >
                                ›
                            </span>

                        </button>

                    </div>

                )}


                {/* ================= LOGOUT ================= */}

                {!edit && (

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loading}
                        className={`w-full mt-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 ${
                            theme === "dark"
                                ? "text-red-400 hover:bg-red-900/20"
                                : "text-red-500 hover:bg-red-50"
                        }`}
                    >

                        <FaSignOutAlt />

                        {loading
                            ? "Logging out..."
                            : "Logout"}

                    </button>

                )}

            </div>

        </div>
    );
}

export default UserProfile;