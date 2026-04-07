import { useState } from 'react'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import Login from './pages/user-login/login'
import {ToastContainer,toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
    <ToastContainer  position='top-right' autoClose={4000}/>
    <Router>
      <Routes>
        <Route  path='/user-login'  element={<Login/>}/>
      </Routes>
    </Router>
    </>
  )
}

export default App
