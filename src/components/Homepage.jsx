import { useEffect, useState } from "react"
import ChatList from "../pages/chatSection/ChatList"
import useLayoutStore from "../store/layoutStore"
import Layout from "./Layout"
import {motion} from "framer-motion"
import { getAllUser } from "../services/user.services"

function HomePage(){
   const setSelectedContact=useLayoutStore((state)=>state.setSelectedContact)
   const [allUser,setAllUser]=useState([]);
   const getAllUser=async()=>{
      try {
         const result=await getAllUser();
         if(result?.status==="success"){
            setAllUser(result.data)
         }
      } catch (error) {
         console.log(error)
      }
   }
   useEffect(()=>{ 
      getAllUser()
   },[])
   console.log(allUser)
     return(
        <Layout>
         <motion.div 
           initial={{opacity:0}}
           animate={{opacity:1}}
           transition={{duration:0.5}}
           className="h-full"
         >
            <ChatList
            contacts={allUser}
            setSelectedContact={setSelectedContact}
            />
         </motion.div>
        </Layout>
     )
}
export default HomePage