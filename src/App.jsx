import { useEffect, useState } from 'react'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import Login from './pages/user-login/login'
import {ToastContainer,toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import { ProtectedRoute, PublicRoute } from './protected.jsx';
import HomePage from './components/Homepage';
import UserDetail from './components/UserDetail.jsx';
import Setting from './pages/settingSection/Setting.jsx';
import Status from './pages/StatusSection/Status.jsx';
import useUserStore from './store/useUserStore.js';
import { disconnectSocket, initializeSocket } from './services/chat.service.js';
import { useChatStore } from './store/chatStore.js';

function App() {
  const user=useUserStore();
  const {setCurrentUser,initsocketListners,cleanup}=useChatStore();
  useEffect(()=>{
    if(user?._id){
      const socket=initializeSocket();

      if(socket){
        setCurrentUser(user);
        initsocketListners();
      }
    }   
    return()=>{
      cleanup()
      disconnectSocket();
    }
  },[user,setCurrentUser,initsocketListners,cleanup])
  return (
    <>
    <ToastContainer  position='top-right' autoClose={4000}/>
    <Router>
      <Routes>
        <Route element={<PublicRoute/>}>
          <Route  path='/user-login'  element={<Login/>}/>
        </Route>

        <Route element={<ProtectedRoute/>}>
          <Route  path='/'  element={<HomePage/>}/>
          <Route  path='/user-Profile'  element={<UserDetail/>}/>
          <Route  path='/setting'  element={<Setting/>}/>
          <Route  path='/status'  element={<Status/>}/>
        </Route>
        
      </Routes>
    </Router>
    </>
  )
}

export default App
