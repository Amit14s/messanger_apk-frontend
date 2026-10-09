import React, { useState } from "react";
import { FaTimes, FaSearch } from "react-icons/fa";
import { useChatStore } from "../../store/chatStore";

function AddUser({ onClose, onUserSelect, theme }) {

    const [input, setInput] = useState("");
    const [phoneSuffix, setPhoneSuffix] = useState("+91");

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { searchUser } = useChatStore();

    const handleSearch = async () => {

        if (!input.trim()) {
            setError("Enter email or phone number");
            return;
        }

        setLoading(true);
        setError("");
        setUser(null);

        try {

            const result = await searchUser(
                input.trim(),
                phoneSuffix
            );

            if (result?.found) {
                setUser(result.user);
            } else {
                setError("No user found");
            }

        } catch (error) {

            setError("No user found");

        } finally {

            setLoading(false);

        }
    };


    const handleUserSelect = () => {

        if (user) {
            onUserSelect(user);
            onClose();
        }

    };


    const isEmail = input.includes("@");


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

            <div
                className={`w-full max-w-md rounded-2xl p-5 shadow-xl ${
                    theme === "dark"
                        ? "bg-[#202735] text-white"
                        : "bg-white text-gray-800"
                }`}
            >

                {/* HEADER */}

                <div className="flex items-center justify-between mb-5">

                    <h2 className="text-xl font-semibold">
                        Add New Chat
                    </h2>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <FaTimes />
                    </button>

                </div>


                {/* INPUT */}

                <div className="flex gap-2">

                    {/* COUNTRY CODE */}

                    {!isEmail && (
                        <select
                            value={phoneSuffix}
                            onChange={(e) =>
                                setPhoneSuffix(e.target.value)
                            }
                            className={`w-24 px-2 rounded-xl border outline-none ${
                                theme === "dark"
                                    ? "bg-[#151922] border-gray-600 text-white"
                                    : "bg-gray-50 border-gray-200 text-gray-800"
                            }`}
                        >

                            <option value="+91">
                                +91
                            </option>

                            <option value="+1">
                                +1
                            </option>

                            <option value="+44">
                                +44
                            </option>

                            <option value="+61">
                                +61
                            </option>

                            <option value="+971">
                                +971
                            </option>

                            <option value="+93">
                                +93
                            </option>

                        </select>
                    )}


                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {

                            setInput(e.target.value);
                            setError("");
                            setUser(null);

                        }}
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {
                                handleSearch();
                            }

                        }}
                        placeholder="Email or phone number"
                        className={`flex-1 px-4 py-3 rounded-xl outline-none border ${
                            theme === "dark"
                                ? "bg-[#151922] border-gray-600 text-white"
                                : "bg-gray-50 border-gray-200 text-gray-800"
                        }`}
                    />


                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        <FaSearch />
                    </button>

                </div>


                {/* LOADING */}

                {loading && (
                    <p className="text-sm text-gray-500 mt-4">
                        Searching...
                    </p>
                )}


                {/* ERROR */}

                {error && !loading && (
                    <p className="text-sm text-red-500 mt-4">
                        {error}
                    </p>
                )}


                {/* USER FOUND */}

                {user && !loading && (

                    <div
                        className={`mt-5 p-3 rounded-xl flex items-center gap-3 ${
                            theme === "dark"
                                ? "bg-[#151922]"
                                : "bg-gray-50"
                        }`}
                    >

                        {user.profilePicture ? (

                            <img
                                src={user.profilePicture}
                                alt={user.username}
                                className="w-12 h-12 rounded-full object-cover"
                            />

                        ) : (

                            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
                                {user.username
                                    ?.charAt(0)
                                    ?.toUpperCase()}
                            </div>

                        )}


                        <div className="flex-1 min-w-0">

                            <p className="font-semibold truncate">
                                {user.username}
                            </p>

                            <p className="text-sm text-gray-500 truncate">

                                {user.email
                                    ? user.email
                                    : `${user.phoneSuffix}${user.phoneNumber}`}

                            </p>

                        </div>


                        <button
                            onClick={handleUserSelect}
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                        >
                            Chat
                        </button>

                    </div>

                )}

            </div>

        </div>
    );
}

export default AddUser;