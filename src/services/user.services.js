import axiosInstance from "./url.service";


export const sendOtp=async(phoneNumber,phoneSuffix,email)=>{
    try {
        const response=await axiosInstance.post('/auth/send-otp',{phoneNumber,phoneSuffix,email});
        return response.data;
    } catch (error) {
        throw error.response?error.response.data:error.message;
    }
}

export const verifyOtp=async(phoneNumber,phoneSuffix,otpString,email)=>{
    try {
        const otp=otpString
        const response=await axiosInstance.post('/auth/verify-otp',{phoneNumber,phoneSuffix,otp,email});
        return response.data;
    } catch (error) {
        console.log(error)
        throw error.response?error.response.data:error.message;
    }
}
export const updateUserProfile = async (updateData) => {
    try {
        const response = await axiosInstance.put(
            "/auth/update-profile",
            updateData
        );

        return response.data;

    } catch (error) {
        throw error.response
            ? error.response.data
            : error.message;
    }
};

export const checkUSerAuth=async()=>{
    try {
       const response=await axiosInstance.get('/auth/check-auth');
       if(response.data.status==='success'){
        return {isAuthenticated:true,user:response?.data?.data};
       }
       else if(response.data.status==='error'){
        return  {isAuthenticated:false};
       }
    } catch (error) {
         throw error.response?error.response.data:error.message;
    }
}
export const logoutUser = async () => {
    try {
        const response = await axiosInstance.get(
            "/auth/logout"
        );

        return response.data;

    } catch (error) {
        throw error.response
            ? error.response.data
            : error.message;
    }
};

export const getAllUser=async ()=>{
    try {
        const response=await axiosInstance.get('/auth/users');
        return response.data;
    } catch (error) {
         throw error.respponse?error.respponse.data:error.message;
    }
}