import './App.css'
function App() {
  return (
    //This is the whole page
    <div className=''>
      {/* //Navbar */}
      <div className="bg-white flex flex-row m-[40px] justify-between">
        {/* here's the logo */}
        <img src = "/logo.svg" className="h-[40px] ml-[20px] hover:drop-shadow-[2px_2px_10px_rgba(0,0,0,0.8)] hover:cursor-pointer duration-[500ms]"/>
        <div className='flex flex-row gap-30'>
          <button className=' font-["Josefin_Slab"] font-bold border-[2px] rounded-3xl p-[15px] bg-[#FAAF3A] hover:bg-[#FFFFFF] hover:text-[#FAAF3A] hover:cursor-pointer duration-[500ms] border-[#FAAF3A] text-[#FFFFFF] text-[20px]'>Features</button>
          <button className=' font-["Josefin_Slab"] font-bold border-[2px] rounded-3xl px-[25px] py-[15px] bg-[#FAAF3A] hover:bg-[#FFFFFF] hover:text-[#FAAF3A] hover:cursor-pointer duration-[500ms] border-[#FAAF3A] text-[20px] text-[#FFFFFF]'>Try it out!</button>
          <button className=' font-["Josefin_Slab"] font-bold border-[2px] rounded-3xl px-[25px] py-[15px] bg-[#FAAF3A] hover:bg-[#FFFFFF] hover:text-[#FAAF3A] hover:cursor-pointer duration-[500ms] border-[#FAAF3A] text-[20px] text-[#FFFFFF]'>Login</button>
        </div>
      </div>
      {/* Login arrow */}
      <div className='w-full'>
        <img src="/login.svg" className='h-[100px] absolute right-10'></img>
      </div>
        

      {/* Description and welcome */}

      {/* input output and display routes */}
      <div className='flex flex-row'>
        <input type='text' id='start'></input>
        <label for= 'start'>Start Destination</label>
        <input type='text' id='destination'></input>
        <label for= 'destination'>Final destination</label>
      </div>

      {/* Footer */}
      <div className=' w-full text-[#FFFFFF] bg-[#FAAF3A] py-[15px] font-["Josefin_Slab"]  absolute left-0 bottom-0 flex justify-end '>
        <p className='mr-[10px]'>© Ekansh Sahu 2025</p>
      </div>
    </div>
  )
}

export default App
