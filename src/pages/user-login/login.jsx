
import React, { useState } from "react";
import useLoginStore from "../../store/useLoginStore";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  FaPlus,
  FaRocketchat,
  FaSpinner,
  FaUser,
  FaEnvelope,
} from "react-icons/fa6";
import {
  sendOtp,
  updateUserProfile,
  verifyOtp,
} from "../../services/user.services";
import { toast } from "react-toastify";
import Step2 from "./step2";

const loginValidationSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .email("Please enter a valid email")
    .required("Email is required"),
});

const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .required("OTP is required"),
});

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("Username is required"),
  agreed: yup.bool().oneOf([true], "You must agree to the terms"),
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
  const {
    step,
    setStep,
    setUserPhoneData,
    userPhoneData,
    resetLoginState,
  } = useLoginStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme } = useThemeStore();

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  });

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue,
  } = useForm({
    resolver: yupResolver(otpValidationSchema),
  });

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch,
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });

  const onLoginSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const userEmail = data.email.trim();
      const response = await sendOtp(null, null, userEmail);

      if (response.status === "success") {
        toast.success("OTP sent to your email");
        setUserPhoneData({ email: userEmail });
        setStep(2);
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userPhoneData?.email) {
        throw new Error("Email data is missing");
      }

      const otpString = otp.join("");

      const response = await verifyOtp(
        null,
        null,
        otpString,
        userPhoneData.email
      );

      if (response.status === "success") {
        toast.success("OTP verified successfully");

        const user = response.data?.user;

        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome back to Messenger");
          resetLoginState();
          navigate("/");
        } else {
          setStep(3);
        }
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("agreed", data.agreed);

      if (profilePictureFile) {
        formData.append("media", profilePictureFile);
      } else {
        formData.append("profilePicture", selectedAvatar);
      }

      await updateUserProfile(formData);

      toast.success("Profile created successfully");
      resetLoginState();
      navigate("/");
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];

    newOtp[index] = digit;
    setOtp(newOtp);
    setValue("otp", newOtp.join(""), {
      shouldValidate: true,
    });

    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    setValue("otp", "");
  };

  const ProgressBar = () => (
    <div
      className={`w-full ${
        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
      } rounded-full h-2.5 mb-6`}
    >
      <div
        className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${(step / 3) * 100}%` }}
      />
    </div>
  );

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900"
          : "bg-gradient-to-br from-green-400 to-blue-500"
      } flex items-center justify-center p-4`}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
        } p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
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
          className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center"
        >
          <FaRocketchat className="w-16 h-16 text-white" />
        </motion.div>

        <h1
          className={`text-3xl font-bold text-center my-6 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Messenger Login
        </h1>

        <ProgressBar />

        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}

        {step === 1 && (
          <form
            onSubmit={handleLoginSubmit(onLoginSubmit)}
            className="space-y-4"
          >
            <div className="relative">
              <FaEnvelope
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              />

              <input
                {...loginRegister("email", {
                  onChange: (e) => setEmail(e.target.value),
                })}
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                className={`w-full pl-10 pr-3 py-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            {loginErrors.email && (
              <p className="text-red-500 text-sm">
                {loginErrors.email.message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading && <FaSpinner className="animate-spin" />}
              {loading ? "Sending OTP..." : "Send Email OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <Step2
            handleOtpSubmit={handleOtpSubmit}
            onOtpSubmit={onOtpSubmit}
            theme={theme}
            userPhoneData={userPhoneData}
            otp={otp}
            handleOtpChange={handleOtpChange}
            otpErrors={otpErrors}
            loading={loading}
            handleBack={handleBack}
          />
        )}

        {step === 3 && (
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-24 h-24 mb-2">
                <img
                  src={profilePicture || selectedAvatar}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />

                <label
                  htmlFor="profile-picture"
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600"
                >
                  <FaPlus className="w-4 h-4" />
                </label>

                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </div>

              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-500"
                } mb-2`}
              >
                Choose an avatar
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {avatars.map((avatar, index) => (
                  <img
                    key={index}
                    src={avatar}
                    alt={`Avatar ${index + 1}`}
                    className={`w-12 h-12 rounded-full cursor-pointer transition hover:scale-110 ${
                      selectedAvatar === avatar ? "ring-2 ring-blue-400" : ""
                    }`}
                    onClick={() => setSelectedAvatar(avatar)}
                  />
                ))}
              </div>
            </div>

            <div className="relative">
              <FaUser
                className={`absolute left-3 top-1/3 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              />

              <input
                {...profileRegister("username")}
                type="text"
                placeholder="Username"
                className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />

              {profileErrors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {profileErrors.username.message}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                {...profileRegister("agreed")}
                id="terms"
                type="checkbox"
                className="mt-1 rounded text-blue-500 focus:ring-blue-500"
              />

              <label
                htmlFor="terms"
                className={`text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                I agree to the{" "}
                <a href="#" className="text-red-500 hover:underline">
                  Terms and Conditions
                </a>
              </label>
            </div>

            {profileErrors.agreed && (
              <p className="text-red-500 text-sm">
                {profileErrors.agreed.message}
              </p>
            )}

            <button
              type="submit"
              disabled={!watch("agreed") || loading}
              className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading && <FaSpinner className="animate-spin" />}
              {loading ? "Loading..." : "Create Profile"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
