import {create} from 'zustand';
import {persist} from 'zustand/middleware';

const useUserStore=create(
    persist(
        (set)=>({
            user:null,
           isAuthenticated:false,
            setUser:(userdata)=>set({user:userdata,isAuthenticated:true}),
            clearUser:()=>set({user:null,isAuthenticated:false}),
        }),
        {
            name:'User-storage',
            getStorage:()=>localStorage
        }
    )
);
export default useUserStore;