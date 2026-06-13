import { useState,useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useUserStore from "./store/useUserStore";
import { checkUSerAuth } from "./services/user.services";
import Loader from "./utils/Loader.jsx";

export const ProtectedRoute=()=>{
    const [isChecking,setIschecking]=useState(true)
    const {isAuthenticated,setUser,clearUser}=useUserStore();
    const location=useLocation();

    useEffect(()=>{
       try {
           const verifyauth=async()=>{
             const result=await checkUSerAuth();
             if(result?.isAuthenticated)setUser(result.user);
             else clearUser()
           }
       } catch (error) {
           console.log(error);
           clearUser();
       }
       finally{
         setIschecking(false);
       }
    },[setUser,clearUser])

    if(isChecking)return <Loader/>
    if(!isAuthenticated){
        return <Navigate to="/user-login" state={{from:location}} replace/>
    }

    return <Outlet/>
}

export const PublicRoute=()=>{
    const isAuthenticated=useUserStore(state=>state.isAuthenticated);
    if(isAuthenticated)return <Navigate to='/' replace/>
    return <Outlet/>
}