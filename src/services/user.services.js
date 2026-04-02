import axiosInstance from "./url.service";


export const sendOtp=async(phoneNumber,phoneSuffix,email)=>{
    try {
        const respponse=await axiosInstance.post('/send-otp',{phoneNumber,phoneSuffix,email});
        return respponse.data;
    } catch (error) {
        throw error.respponse?error.respponse.data:error.message;
    }
}

export const verifyOtp=async(phoneNumber,phoneSuffix,Option,email)=>{
    try {
        const response=await axiosInstance.post('/verify-otp',{phoneNumber,phoneSuffix,otp,email});
        return response.data;
    } catch (error) {
        throw error.respponse?error.respponse.data:error.message;
    }
}
export const updateUserProfile=async(updateData)=>{
     try {
        const response=await axiosInstance.post('/update-profile',updateData);
        return response.data;
     } catch (error) {
         throw error.respponse?error.respponse.data:error.message;
     }
}

export const checkUSerAuth=async()=>{
    try {
       const response=await axiosInstance.get('/check-auth');
       if(response.data.status==='success'){
        return {isAuthenticated:true,user:response?.data?.data};
       }
       else if(response.data.status==='error'){
        return  {isAuthenticated:false};
       }
    } catch (error) {
         throw error.respponse?error.respponse.data:error.message;
    }
}
export const logoutUser=async ()=>{
    try {
        const response=await axiosInstance.get('/logout');
        return response.data;
    } catch (error) {
         throw error.respponse?error.respponse.data:error.message;
    }
}

export const getAllUser=async ()=>{
    try {
        const response=await axiosInstance.get('/users');
        return response.data;
    } catch (error) {
         throw error.respponse?error.respponse.data:error.message;
    }
}