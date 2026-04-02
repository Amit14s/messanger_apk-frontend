import { useState } from 'react'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import Login from './pages/user-login/login'

function App() {
  return (
    <Router>
      <Routes>
        <Route  path='/user-login'  element={<Login/>}/>
      </Routes>
    </Router>
  )
}

export default App
