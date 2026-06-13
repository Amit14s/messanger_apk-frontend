import React, { useState } from "react";
import useLoginStore from "../../store/useLoginStore";
import countries from "../../utils/countries";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { FaArrowLeft, FaChevronDown, FaPlug, FaPlus, FaRocketchat, FaSpinner, FaUsb, FaUser } from "react-icons/fa6";
import { Spinner } from "flowbite-react";
import { sendOtp, updateUserProfile, verifyOtp } from "../../services/user.services";
import { toast } from "react-toastify";

 function Step1({handleLoginSubmit,searchItem,setShowDrop,seSelectedCountry,setSearchItem,setEmail,setPPhoneNumber,loginRegister,onLoginSubmit,theme,selectedCountry,showDrop,phoneNumber,email,loginErrors,loading,filterCountries}){
  
    return(
              <form className="space-y-4" onSubmit={handleLoginSubmit(onLoginSubmit)}>
                <p
                  className={`text-center &{theme==='dark'?"text-gray-300":"text-gray-600"} mb-4`}
                >
                  Enter your phone number to receive an OTP
                </p>
                <div className="relative">
                  <div className="flex">
                    <div className="relative w-1/3">
                      <button
                        type="button"
                        onClick={() => setShowDrop(!showDrop)}
                        className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center ${theme === "dark" ? "text-white bg-gray-700 border-gray-600 " : "text-gray-900 bg-gray-100 border-gray-500"} border rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200`}
                      >
                        <span>
                          {selectedCountry.flag} {selectedCountry.dialCode}
                        </span>
                        <FaChevronDown className="ml-2" />
                      </button>
                      {showDrop && (
                        <div
                          className={`absolute z-10 w-full mt-1 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border rounded-md shadow-lg max-h-60 overflow-auto`}
                        >
                          <div
                            className={`sticky top-0  ${theme === "dark" ? "bg-gray-700" : "bg-white"} p-2`}
                          >
                            <input
                              type="text"
                              placeholder="Search Countries.."
                              value={searchItem}
                              onChange={(e) => setSearchItem(e.target.value)}
                              className={`w-full px-2 py-1 border ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                          </div>
                          {filterCountries.map((country) => (
                            <button
                              key={country.alpha2}
                              type="button"
                              className={`w-full text-left px-3 py-2 ${theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-300"} focus:outline-none focus:bg-gray-200`}
                              onClick={() => {
                                seSelectedCountry(country);
                                setShowDrop(false);
                              }}
                            >
                              {country.flag} ({country.dialCode}) {country.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      {...loginRegister("phoneNumber")}
                      value={phoneNumber}
                      placeholder="Phone Number"
                      onChange={(e) => setPPhoneNumber(e.target.value)}
                      className={`w-2/3 px-4 py-2 border  ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${loginErrors.phoneNumber ? "border-red-500 " : ""}`}
                    />
                  </div>
                  {loginErrors.phoneNumber && (
                    <p className={`text-red-500 test-sm`}>{loginErrors.phoneNumber.message}</p>
                  )}
                </div>
    
                {/* Divider with Or */}
                <div className="flex items-center my-4">
                  <div className="flex-grow h-px bg-gray-300"/>
                  <span className="mx-3 text-gray-500 text-sm font-medium">OR</span>
                     <div className="flex-grow h-px bg-gray-300"/>
                </div>
                {/* email input */}
                <div className={`flex items-center border rounded-md px-3 py-2 ${
                  theme==='dark'?"bg-gray-700 border-gray-600": "bg-white border-gray-300" }focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 `}>
                    <FaUser className={`mr-2 text-gray-400 ${theme==='dark'?"text-gray-400":"text-gray-500"}`}/>
                    <input
                    type='email'
                    {...loginRegister("email")}
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    placeholder="Email (Optional)"
                    className={`w-full bg-transparent focus:outline-none ${
                      theme==='dark'?"text-white":"bg-black" 
                    }  ${loginErrors.email?"border-red-500":""}`}
                    />
    
                </div>
                <button 
                type="submit"
                className={`w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition flex items-center justify-center gap-2`}>
                  { loading  && <FaSpinner className="animate-spin text-center"/>}
                  {loading ?"Loading...":"Send Otp"}
                </button>
              </form>
            )
 }
 export default Step1