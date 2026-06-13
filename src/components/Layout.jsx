import React, { useEffect, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useThemeStore from "../store/themeStore";

import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "../pages/chatSection/ChatWindow";
import useLayoutStore from "../store/layoutStore";
import SideBar from "./Sidebar";
const Layout = ({
  children,
  isThemeDialougeOpen,
  toggleThemeDialoge,
  isStatusPreviewOpen,
  statusPreviewContent,
}) => {
  const { selectedContact, setSelectedContact } = useLayoutStore;
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, setTheme } = useThemeStore;
  useEffect(() => {
    const handleWindow = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleWindow);
    return () => window.removeEventListener("resize", handleWindow);
  }, []);
  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-[#11b21] text-white" : "bg-gray-100 text-black"} flex relative gap-1`}
    >
      {!isMobile && <SideBar/>}
      <div
        className={`flex-1 flex overflow-hidden ${isMobile ? "flex-col" : ""}`}
      >
        <AnimatePresence initial={false}>
          {(!selectedContact || !isMobile) && (
            <motion.div
              key="chatlist"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100% " }}
              transition={{ type: "tween" }}
              className={`w-full md:w-2/5 h-full ${isMobile ? "pb-16" : ""}`}
            >
              {children}
            </motion.div>
          )}

          {(selectedContact || !isMobile) && (
            <motion.div
              key="chat-window"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100% " }}
              transition={{ type: "tween" }}
              className={`w-full h-full `}
            >
              <ChatWindow
                selected
                Contact={selectedContact}
                setSelectedContact={setSelectedContact}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {isMobile && <SideBar />}
      {isThemeDialougeOpen && (
        <div
          className={`fixed inset-0 flex item-center justify-center bg-black bg-opacity-50 z-50`}
        >
          <div
            className={`${theme == "dark" ? "bg-[#202c33] text-white" : "bg-white text-black"} p-6 rounded-lg max-w-sm w-full`}
          >
            <h2 className={`text-2xl font-semibold mb-4`}>Choose a Theme</h2>
            <div className="space-y-4">
              <label className={`flx items-center space-x-3 cursor-pointer`}>
                <input
                  type="radio"
                  value="light"
                  checked={theme == "light"}
                  onChange={() => setTheme("light")}
                  className={`from-radio text-blue-600`}
                />
                <span>Light</span>
              </label>
              <label className={`flx items-center space-x-3 cursor-pointer`}>
                <input
                  type="radio"
                  value="dark"
                  checked={theme == "dark"}
                  onChange={() => setTheme("dark")}
                  className={`from-radio text-blue-600`}
                />
                <span>Dark</span>
              </label>
            </div>
            <button
              onClick={toggleThemeDialoge}
              className={`mt-6 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-200`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isStatusPreviewOpen && (
        <div className="fixed inet-0 flex items-center bg-black bg-opacity-50 z-50">
          {statusPreviewContent}
        </div>
      )}
    </div>
  );
};
export default Layout;
