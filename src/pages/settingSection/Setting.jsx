
import React, { useState,useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaPalette,
    FaBell,
    FaVolumeUp,
    FaUser,
    FaShieldAlt,
    FaSignOutAlt,
    FaChevronRight,
} from "react-icons/fa";

import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { logoutUser } from "../../services/user.services";
import SideBar from "../../components/Sidebar";
const Setting = () => {
    const { theme, setTheme } = useThemeStore();
    const user = useUserStore((state) => state.user);
    const clearUser = useUserStore((state) => state.clearUser);

    const navigate = useNavigate();
    const dark = theme === "dark";

    const [notifications, setNotifications] = useState(true);
    const [messageSound, setMessageSound] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    const pageBg = dark ? "bg-[#111b21]" : "bg-gray-50";
    const cardBg = dark
        ? "bg-[#202c33] border-gray-700"
        : "bg-white border-gray-200";
    const secondaryText = dark ? "text-gray-400" : "text-gray-500";

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await logoutUser();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            clearUser();
            navigate("/user-login", { replace: true });
            setLoggingOut(false);
        }
    };

    const SettingRow = ({
        icon: Icon,
        title,
        description,
        children,
    }) => (
        <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`p-3 rounded-lg ${
                        dark ? "bg-gray-700" : "bg-gray-100"
                    }`}
                >
                    <Icon className="text-lg" />
                </div>

                <div className="min-w-0">
                    <p className="font-medium">{title}</p>
                    <p className={`text-sm ${secondaryText}`}>
                        {description}
                    </p>
                </div>
            </div>

            {children}
        </div>
    );

    const Toggle = ({ checked, onChange }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                checked ? "bg-green-500" : dark ? "bg-gray-600" : "bg-gray-300"
            }`}
        >
            <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    checked ? "translate-x-5" : ""
                }`}
            />
        </button>
    );
     const [isMobile, setIsMobile] = useState(
         window.innerWidth < 768
     );
      useEffect(() => {
     
             const handleWindow = () => {
                 setIsMobile(window.innerWidth < 768);
             };
     
             window.addEventListener("resize", handleWindow);
     
             return () => {
                 window.removeEventListener("resize", handleWindow);
             };
     
         }, []);

    return (
       <div  className={`flex w-full h-screen overflow-hidden ${
        theme === "dark"
            ? "bg-[#111b21]"
            : "bg-[rgb(239,242,254)]"
    }`}>
         {!isMobile && <SideBar />}
          <div className={`flex-1 min-w-0 h-full overflow-y-auto  ${pageBg} p-4 sm:p-8`}>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className={`mt-1 mb-6 ${secondaryText}`}>
                    Manage your preferences and account.
                </p>

                {/* ACCOUNT */}
                <section className="mb-6">
                    <h2 className={`text-sm font-medium mb-3 ${secondaryText}`}>
                        ACCOUNT
                    </h2>

                    <div className={`border rounded-xl overflow-hidden ${cardBg}`}>
                        <Link
                            to="/user-profile"
                            className="flex items-center justify-between gap-3 p-4 hover:bg-black/5"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {user?.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className="w-11 h-11 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-11 h-11 rounded-full bg-gray-500 flex items-center justify-center text-white">
                                        <FaUser />
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <p className="font-medium">
                                        {user?.username || "Your account"}
                                    </p>
                                    <p className={`text-sm ${secondaryText}`}>
                                        View and edit your profile
                                    </p>
                                </div>
                            </div>

                            <FaChevronRight className={secondaryText} />
                        </Link>
                    </div>
                </section>

                {/* APPEARANCE */}
                <section className="mb-6">
                    <h2 className={`text-sm font-medium mb-3 ${secondaryText}`}>
                        APPEARANCE
                    </h2>

                    <div className={`border rounded-xl overflow-hidden ${cardBg}`}>
                        <SettingRow
                            icon={FaPalette}
                            title="Theme"
                            description="Choose how the app looks"
                        >
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className={`border rounded-lg px-3 py-2 outline-none ${
                                    dark
                                        ? "bg-[#111b21] border-gray-600"
                                        : "bg-white border-gray-300"
                                }`}
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </SettingRow>
                    </div>
                </section>

                {/* NOTIFICATIONS */}
                <section className="mb-6">
                    <h2 className={`text-sm font-medium mb-3 ${secondaryText}`}>
                        NOTIFICATIONS
                    </h2>

                    <div className={`border rounded-xl divide-y ${
                        dark ? "divide-gray-700" : "divide-gray-200"
                    } ${cardBg}`}>
                        <SettingRow
                            icon={FaBell}
                            title="Notifications"
                            description="Enable message notifications"
                        >
                            <Toggle
                                checked={notifications}
                                onChange={setNotifications}
                            />
                        </SettingRow>

                        <SettingRow
                            icon={FaVolumeUp}
                            title="Message sound"
                            description="Play a sound for new messages"
                        >
                            <Toggle
                                checked={messageSound}
                                onChange={setMessageSound}
                            />
                        </SettingRow>
                    </div>
                </section>

                {/* PRIVACY */}
                <section className="mb-6">
                    <h2 className={`text-sm font-medium mb-3 ${secondaryText}`}>
                        PRIVACY
                    </h2>

                    <div className={`border rounded-xl overflow-hidden ${cardBg}`}>
                        <SettingRow
                            icon={FaShieldAlt}
                            title="Privacy and security"
                            description="Manage your account privacy"
                        >
                            <span className={`text-xs ${secondaryText}`}>
                                Coming soon
                            </span>
                        </SettingRow>
                    </div>
                </section>

                {/* LOGOUT */}
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-300 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                >
                    <FaSignOutAlt />
                    {loggingOut ? "Logging out..." : "Log out"}
                </button>
            </div>
            {/* MOBILE SIDEBAR */}
            {isMobile && <SideBar />}
        </div>
       </div>
    );
};

export default Setting;
