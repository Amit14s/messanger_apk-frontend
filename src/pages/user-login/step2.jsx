import { FaArrowLeft, FaChevronDown, FaPlug, FaPlus, FaRocketchat, FaSpinner, FaUsb, FaUser } from "react-icons/fa6";
function Step2({handleOtpSubmit,onOtpSubmit,theme,userPhoneData,otp,handleOtpChange,otpErrors,loading,handleBack}){
    return (
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
                          {loading ?"Loading...":"Verify Otp"}
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
            )
}
export default Step2