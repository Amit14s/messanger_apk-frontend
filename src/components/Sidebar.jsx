import { useLocation } from "react-router-dom";
import useLayoutStore from "../store/layoutStore";
import { useEffect, useState } from "react";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import { FaArrowLeft, FaChevronDown, FaPlug, FaPlus, FaRocketchat, FaSpinner, FaUsb, FaUser } from "react-icons/fa6";
import { IoSettings } from "react-icons/io5";
import { MdOutlineRadioButtonChecked } from "react-icons/md";
import { motion } from "framer-motion";
import { sidebarTheme } from "flowbite-react";
import { Link } from "react-router-dom";

const SideBar = () => {
   const { selectedContact, setSelectedContact } = useLayoutStore;
   const location = useLocation();
   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
   const { theme, setTheme } = useThemeStore();
   const { user } = useUserStore();
   const { activeTab, setActiveTab } = useLayoutStore();
   useEffect(() => {
      const handleWindow = () => {
         setIsMobile(window.innerWidth < 768);
      };
      window.addEventListener("resize", handleWindow);
      return () => window.removeEventListener("resize", handleWindow);
   }, []);

   useEffect(() => {
      if (location.pathname == "/") setActiveTab("chats");
      else if (location.pathname == "status") setActiveTab("status");
      else if (location.pathname == "/user-profile") setActiveTab("profile");
      else if (location.pathname == "/setting") setActiveTab("setting");
   }, [location, setActiveTab]);
   if (isMobile && selectedContact) {
      return null;
   }
   const SideBarContent = () => (
      <>
         <Link
            to='/'
            className={`${isMobile ? "" : "mb-8"} ${activeTab === "chats" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
         >
            <FaRocketchat
               className={`w-6 h-6  ${activeTab === "chats" ? (theme === "dark" ? "text-gray-800" : "") : theme === "dark" ? "text-gray-300" : "text-gray-800"}`}
            />
         </Link>

           <Link
            to='/status'
            className={`${isMobile ? "" : "mb-8"} ${activeTab === "status" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
         >
            <MdOutlineRadioButtonChecked

               className={`w-6 h-6  ${activeTab === "status" ? (theme === "dark" ? "text-gray-800" : "") : theme === "dark" ? "text-gray-300" : "text-gray-800"}`}
            />
         </Link>

            <Link
            to='/user-profile'
            className={`${isMobile ? "" : "mb-8"} ${activeTab === "profile" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
         >
            {user?.profilePicture?(
               <img src={user?.profilePicture} alt="user"
               className="h-6 w-6 rounded-full" />
            ):(
               <FaUser
               className={`w-6 h-6  ${activeTab === "profile" ? (theme === "dark" ? "text-gray-800" : "") : theme === "dark" ? "text-gray-300" : "text-gray-800"}`}
            />
            )}
            
         </Link>
            <Link
            to='/setting'
            className={`${isMobile ? "" : "mb-8"} ${activeTab === "setting" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
         >
            <IoSettings

               className={`w-6 h-6  ${activeTab === "setting" ? (theme === "dark" ? "text-gray-800" : "") : theme === "dark" ? "text-gray-300" : "text-gray-800"}`}
            />
         </Link>
         {!isMobile && <div className="flex-grow"/>}
      </>
   )
   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ duration: 0.3 }}
         className={`${isMobile ? "fixed bottom-0 left-0 right-0 h-16" :
            "w-16 h-screen border-r-2"
            } 
      ${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-[rgb(239,242,254)] border-gray-300"}
      bg-opacity-90 flex items-center py-4 shadow-lg
      ${isMobile ? "flex-row justify-around" : "flex-col justify-between"}
      `}
      >
         {SideBarContent()}
      </motion.div>
   )
};
export default SideBar;
