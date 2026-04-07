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
import { FaArrowLeft, FaChevronDown, FaRocketchat, FaSpinner, FaUsb, FaUser } from "react-icons/fa6";
import { Spinner } from "flowbite-react";
import { sendOtp, updateUserProfile, verifyOtp } from "../../services/user.services";
import { toast } from "react-toastify";

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
       const FormData=new FormData();
       FormData.append("username",data.username)
       FormData.append("agreed",data.agreed)
       if(profilePictureFile){
        FormData.append('media',profilePictureFile)
       }
       else {
        FormData.append('profilePicture',selectedAvatar)
       }
       await updateUserProfile(FormData)
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

        {step === 1 && (
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
        )}
        {step==2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className={`space-y-4`}>
             <p className={`text-center ${theme==='dark'?"text-gray-300":"text-gray-600"} mb-4`}>
                  Please enter the 6-digit Otp send to your {userPhoneData?.PhoneSuffix || "Email"} {" "}
                  {userPhoneData.phoneNumber && userPhoneData?.phoneNumber}
             </p>
             <div className="flex justify-between">
              {otp.map((digit,index)=>(
                <input
                key={index}
                id={`otp-${index}`}
                type='text'
                maxLength={1}
                value={digit}
                onChange={(e)=>handleOtpChange(index,e.target.value)}
                className={`w-12 h-12 text-center border ${theme==='dark'?"bg-gray-700 border-gray-900 text-white" : "bg-white border-gray-600"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${otpErrors.otp?"border-red-500":""}`}
                />
              ))}
           {otpErrors.otp && (
            <p className="text-red-500 text-sm">{otpErrors.otp.message}</p>
           )}
     
             </div>
                   <button
           type="submit"
            className={`w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition flex items-center justify-center gap-2`}>
          { loading  && <FaSpinner className="animate-spin text-center"/>}
                      {loading ?"Loading...":"Send Otp"}
           </button>
           <button
           type="button"
           onClick={handleBack}
           className={`w-full mt-2 flex justify-center items-center ${theme==='dark'?"bg-gray-700 text-gray-300":"bg-gray-200 text-gray-700"} py-2 rounded-md hover:bg-gray-300 transition flex items-end `}
           >
             <FaArrowLeft className="mr-2 my-auto"/>
             Wrong number ? Go Back
           </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
export default Login;
