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
import Step1 from "./step1";
import Step2 from "./step2";

const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
  .matches(/^\d+$/, "phone number must be digits")
      .transform((value, originalValue) => {
        return originalValue.trim() == "" ? null : value;
      }),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("please enter valid email")
      .transform((value, originalValue) => {
        return originalValue.trim() == "" ? null : value;
      }),
  })
  .test(
    "at-least-one",
    "Either email or Phone number is required",
    function (value) {
      return !!(value.phoneNumber || value.email);
    },
  );
const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "otp must be exactly 6  digits")
    .required("otp is required"),
});
const profileValidationSchema = yup.object().shape({
  username: yup.string().required("username is required"),
  agreed: yup.bool().oneOf([true], "you must agree to the terms"),
});

const avatars = [
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe",
];

const Login = () => {
  const { step, setStep, setUserPhoneData, userPhoneData, resetLoginState } =
    useLoginStore();
  const [phoneNumber, setPPhoneNumber] = useState("");
  const [selectedCountry, seSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setselectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();
  const [showDrop, setShowDrop] = useState(false);
  const [searchItem, setSearchItem] = useState("");
  const [loading,setLoading]=useState(false);

  const filterCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchItem.toLowerCase()) ||
      country.dialCode.includes(searchItem),
  );
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  });

    const {
    register: otpRegister,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue,
  } = useForm({
    resolver: yupResolver(otpValidationSchema),
  });

  const {
    register: profileRegister,
    handleSubmit: handleprofileSubmit,
    formState: { errors: profileErrors },
    watch,
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });
 const onLoginSubmit = async()=>{
  console.log("kk")
  try {
    setLoading(true);
    if(email){
      const response=await sendOtp(null,null,email);
      if(response.status==='success'){
        toast.info('Otp is send to your email');
        setUserPhoneData({email});
        setStep(2);
      }
    }
    else {
      const response=await sendOtp(phoneNumber,selectedCountry.dialCode);
      if(response.status==='success'){
        toast.info("Otp is send to phone number");
        setUserPhoneData({phoneNumber,PhoneSuffix:selectedCountry.dialCode});
        setStep(2);
      }
    }

  } catch (error) {
        console.log(error);
        setError(error.message|| "failed to send Otp")
  }
  finally{
    setLoading(false);
  }
 }

 const onOtpSubmit=async()=>{
  try {
    setLoading(true);
    if(!userPhoneData){
      throw new Error("phone or email data is missing")
    }
    const otpString=otp.join("")
    let response;
    if(userPhoneData?.email){
      response=await verifyOtp(null,null,otpString,userPhoneData.email)
    }
    else {
      response=await verifyOtp(userPhoneData.phoneNumber,userPhoneData.PhoneSuffix,otpString)
    }
    if(response.status==='success'){
      toast.success("Otp verified Successfully");
      const user=response.data?.user;
      if(user?.username && user?.profilePicture){
        setUser(user);
        toast.success("Welcome Back To Messanger")
        navigate('/')
        resetLoginState();
      }
      else {
        setStep(3);
      }

    }

  } catch (error) {
     console.log(error);
        setError(error.message|| "failed to Verify Otp")
  }
  finally{
    setLoading(false);
  }
 }
 
 const handleChange=(e)=>{
  const file=e.target.files[0];
  if(file){
    setProfilePictureFile(file);
    setProfilePicture(URL.createObjectURL(file))
  }
 }

 const onProfileSubmit=async(data)=>{
  try {
       setLoading(true)
       const formData=new FormData();
       formData.append("username",data.username)
       formData.append("agreed",data.agreed)
       if(profilePictureFile){
        formData.append('media',profilePictureFile)
       }
       else {
        formData.append('profilePicture',selectedAvatar)
       }
       await updateUserProfile(formData)
       toast.success("welcome Back to Whatsapp");
       navigate('/');
       resetLoginState();
  } catch (error) {
         console.log(error);
        setError(error.message|| "failed to Verify Otp")
  }
    finally{
    setLoading(false);
  }
 }

 const handleOtpChange=(index,value)=>{
  const newOtp=[...otp];
  newOtp[index]=value;
    setOtp(newOtp);
  const otpString =  newOtp.join("");
  setValue("otp", otpString);
  if(value && index <5){
    document.getElementById(`otp-${index+1}`).focus();
  }
 }

 const handleBack=()=>{
  setStep(1);
  setUserPhoneData(null);
  setOtp(["","","","","",""])
  setError("")
  setOtpValue("");
 }

  const ProgressBar = () => (
    <div
      className={`w-full ${theme == "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2,5 mb-6`}
    >
      <div
        className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / 3) * 100}%` }}
      ></div>
    </div>
  );

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gradient-to-br from-green-400 to to-blue-500"} flex items-center justify-center p-4 overflow-hidden`}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"} p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="w-24 h-24 bg-blue-600 rounded-full mx-auto my-auto flex item-center justify-center"
        >
          {/* messanger LOGO */}
          <FaRocketchat className="w-16 h-24 text-white" />
        </motion.div>
        <h1
          className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
        >
          Messanger Login
        </h1>

        <ProgressBar />

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {step === 1 && <Step1
        // these are props i am sending for step 1
             handleLoginSubmit={handleLoginSubmit}
             setShowDrop={setShowDrop}
             showDrop={showDrop}
             seSelectedCountry={seSelectedCountry}
              selectedCountry={selectedCountry}
             setSearchItem={setSearchItem}
            setEmail={setEmail}
            email={email}
            setPPhoneNumber={setPPhoneNumber}
            phoneNumber={phoneNumber}
            loginRegister={loginRegister}
            onLoginSubmit={onLoginSubmit}
            theme={theme}
            loginErrors={loginErrors}
            loading={loading}
            searchItem={searchItem}
            filterCountries={filterCountries}
        />}
        {step==2 && <Step2
        handleOtpSubmit={handleOtpSubmit}
        onOtpSubmit={onOtpSubmit}
        theme={theme}
        userPhoneData={userPhoneData}
        otp={otp}
        handleOtpChange={handleOtpChange}
        otpErrors={otpErrors}
        loading={loading}
        handleBack={handleBack}
        />}
        {step==3 && (
          <form onSubmit={handleprofileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-24 h-24 mb-2">
              <img
              src={profilePicture || selectedAvatar}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
              />
              <label 
              htmlFor="profile-picture"
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition duration-200"
              >
                <FaPlus className="w-4 h-4"/>
              </label>
              <input 
              type="file"
              id="profile-picture"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
              />
              </div>
              <p className={`text-sm ${theme==='dark'?"text-gray-300":"text-gray-500"} mb-2`}>Choose an avatar</p>
              <div className="flex flex-wrap justify-center gap-2">
                 {avatars.map((avatar,index)=>(
                  <img
                  key={index}
                  src={avatar}
                  alt={`Avatar ${index+1}`}
                  className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-120 ${selectedAvatar===avatar?"ring-2 ring-blue-400":""}`}
                  onClick={()=>setselectedAvatar(avatar)}
                  />
                 ))}
              </div>
            </div>
            <div className="relative">
              <FaUser
              className={`absolute left-3 top-1/3  ${theme==='dark'?"text-gray-400":"text-gray-600"}`}
              />
            <input
            {...profileRegister("username")}
            type="text"
            placeholder="username"
            className={`w-full pl-10 pr-3 py-2 border ${theme==='dark'?"bg-gray-700 border-gray-600 text-white":"bg-white"} rounded-md`}
            />
            {profileErrors.username && (
              <p className="text-red-500 text-sm mt-1"> {profileErrors.username.message}</p>
            )}
            </div>
            <div className="flex items-center space-x-2">
              <input
              {...profileRegister("agreed")}
              type="checkbox"
              className={`rounded ${theme==='dark'?"text-blue-500 bg-gray-700" :" text-blue-500"} focus:ring-blue-500`}
              />
              <label
              htmlFor="terms" 
              className={`text-sm ${theme==='dark'?"text-gray-300":"text-gray-700"}`}
              >
                 I agree to the {" "}
                 <a href="#" className="text-red-500 hover:underline">Terms and Conditions</a>
              </label>
           {profileErrors.agreed && (
              <p className="text-red-500 text-sm mt-1"> {profileErrors.agreed.message}</p>
            )}
         
            </div>
               <button 
            type="submit"
            disabled={!watch('agreed') || loading }
            className={`w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg ${loading?"opacity-50 cursor-not-allowed":""}`}
            >
             { loading  && <FaSpinner className="animate-spin text-center"/>}
                      {loading ?"Loading...":"Create Profile"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
export default Login;
