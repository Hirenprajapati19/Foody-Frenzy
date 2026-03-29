import React from 'react'
import Navbar from './components/Navbar'
import List from './components/List'
import { Route, Routes } from 'react-router-dom'
import Order from './components/Order'
import AddItems from './components/AddItems'

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<AddItems />} />
        <Route path='/list' element={<List />} />
        <Route path='/orders' element={<Order />} />
      </Routes>

    </>
  )
}

export default App
