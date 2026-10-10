import { useState } from "react";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { FaPlus } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";
import AddUser from "./AddUser";
import { useChatStore } from "../../store/chatStore";
import UserProfile from "../../components/UserDetail";

function ChatList({ contacts }) {

   const { selectedContact, setSelectedContact } = useLayoutStore();
   const [showUserProfile, setShowUserProfile] = useState(false);
   const { theme } = useThemeStore();
   const { user } = useUserStore();
   const { conversations, onlineUsers, typingUsers } = useChatStore();
   const [searchTerms, setSearchTerms] = useState("");

   // Add User popup
   const [showAddUser, setShowAddUser] = useState(false);

   const filteredContacts = contacts?.filter((contact) =>
      contact?.username
         ?.toLowerCase()
         .includes(searchTerms.toLowerCase())
   );

   return (
      <div
         className={`w-full border-r h-screen ${theme === "dark"
            ? "bg-[rgb(17,27,33)] border-gray-600"
            : "bg-white border-gray-200"
            }`}
      >

         {/* HEADER */}
         <div
            className={`p-4 flex justify-between ${theme === "dark"
               ? "text-white"
               : "text-gray-800"
               }`}
         >
            <h2 className="text-xl font-semibold">
               Chats
            </h2>

            {/* PLUS BUTTON */}
            <button
               onClick={() => setShowAddUser(true)}
               className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
               <FaPlus />
            </button>
         </div>


         {/* SEARCH */}
         <div className="p-2">
            <div className="relative">

               <FaSearch
                  className={`absolute left-3 top-1/3 transform-translate-y-1/2 ${theme === "dark"
                     ? "text-gray-400"
                     : "text-gray-800"
                     }`}
               />

               <input
                  type="text"
                  placeholder="Search or start new chat"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark"
                     ? "bg-gray-800 text-white border-gray-200 placeholder-gray-500"
                     : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
                     }`}
                  value={searchTerms}
                  onChange={(e) =>
                     setSearchTerms(e.target.value)
                  }
               />

            </div>
         </div>


         {/* CONTACT LIST */}
         <div className="overflow-y-auto h-[calc(100vh-120px)]">
            {filteredContacts?.map((contact) => {
               const contactId = String(contact?._id || "");
               const conversationId = String(contact?.conversation?._id || "");

               const isOnline =
                  onlineUsers.get(contactId)?.isOnline === true;

               const isTyping =
                  typingUsers.get(conversationId)?.has(contactId) === true;

               const lastMessageDate =
                  contact?.conversation?.lastMessage?.createdAt;

               const hasValidDate =
                  lastMessageDate &&
                  !Number.isNaN(new Date(lastMessageDate).getTime());

               return (
                  <motion.div
                     key={contact?._id}
                     onClick={() =>
                        setSelectedContact(contact)
                     }
                     className={`p-3 flex items-center cursor-pointer ${theme === "dark"
                        ? selectedContact?._id === contact?._id
                           ? "bg-gray-700"
                           : "hover:bg-gray-800"
                        : selectedContact?._id === contact?._id
                           ? "bg-gray-200"
                           : "hover:bg-gray-100"
                        }`}
                  >

                     <img
                        src={contact?.profilePicture}
                        alt={contact?.username}
                        className="w-12 h-12 rounded-full"
                     />

                     <div className="ml-3 flex-1">

                        <div className="flex justify-between items-center">
                           <h2
                              className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"
                                 }`}
                           >
                              {contact?.username}
                           </h2>

                           {isOnline ? (
                              <span className="text-xs text-green-500 font-medium">
                                 online
                              </span>
                           ) : (
                              hasValidDate && (
                                 <span
                                    className={`text-xs ${theme === "dark"
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                       }`}
                                 >
                                    {formatTimestamp(lastMessageDate)}
                                 </span>
                              )
                           )}
                        </div>


                        <div className="flex justify-between items-baseline">

                           <p
                              className={`text-sm truncate ${isTyping
                                    ? "text-green-500 font-medium"
                                    : theme === "dark"
                                       ? "text-gray-400"
                                       : "text-gray-500"
                                 }`}
                           >
                              {isTyping
                                 ? "typing..."
                                 : contact?.conversation?.lastMessage?.content || ""}
                           </p>

                           {contact?.conversation &&
                              contact?.conversation?.unreadCount > 0 &&
                              contact?.conversation?.lastMessage?.receiver ===
                              user?._id && (

                                 <p
                                    className={`text-sm font-semibold w-6 h-6 flex items-center justify-center bg-yellow-500 ${theme === "dark"
                                       ? "text-gray-800"
                                       : "text-gray-500"
                                       } rounded-full`}
                                 >
                                    {contact?.conversation?.unreadCount}
                                 </p>
                              )}

                        </div>

                     </div>

                  </motion.div>
               );
            })}
         </div>


         {/* ADD USER POPUP */}
         {showAddUser && (
            <AddUser
               theme={theme}
               onClose={() => setShowAddUser(false)}
               onUserSelect={(newUser) => {

                  const existingConversation =
                     conversations?.data?.find((conv) =>
                        conv.participants?.some(
                           (participant) =>
                              participant?._id === newUser?._id
                        )
                     );

                  if (existingConversation) {
                     setSelectedContact({
                        ...newUser,
                        conversation: existingConversation
                     });
                  } else {
                     setSelectedContact(newUser);
                  }

                  setShowAddUser(false);

               }}
            />
         )}

         {showUserProfile && (
            <UserProfile
               onClose={() => setShowUserProfile(false)}
            />
         )}
      </div>

   );
}

export default ChatList;