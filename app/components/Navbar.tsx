import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Navbar = () => {
  return (
    <nav className='flex items-center justify-between bg-black text-white px-8 py-4 w-full relative z-50'>        
        <div className='flex items-center gap-6'>
            <div className='mr-4'>
                <Link href="/">
                    <Image src="/NavGO.svg" alt='logo' width={100} height={40} priority />
                </Link>
            </div>
            
            <div className='hidden md:flex items-center gap-2 font-medium text-sm'>
                <Link href="/busboard" className="hover:bg-gray-800 px-3 py-2 rounded-full transition-colors">Bus Board</Link>
                <Link href="/drivers" className="hover:bg-gray-800 px-3 py-2 rounded-full transition-colors">Drivers</Link>
                <Link href="/routes" className="hover:bg-gray-800 px-3 py-2 rounded-full transition-colors">Routes</Link>
            </div>
        </div>

        <div className='hidden md:flex items-center gap-2 font-medium text-sm'>
            <Link href="/getapp" className='bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors ml-2'>
                For Driver
            </Link>
            <Link href="/getapp" className='bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors ml-2'>
                For Manager
            </Link>
        </div>

        <input type="checkbox" id="mobile-menu-toggle" className="peer hidden" />
        
        <label htmlFor="mobile-menu-toggle" className="md:hidden flex items-center cursor-pointer text-white">
            <svg className="w-6 h-6 block peer-checked:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg className="w-6 h-6 hidden peer-checked:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </label>

        <div className='absolute top-full left-0 w-full bg-black border-t border-gray-800 flex-col py-4 px-8 gap-4 hidden peer-checked:flex md:hidden shadow-lg'>
            <div className='flex flex-col gap-2 font-medium text-sm'>
                <Link href="/busboard" className="hover:bg-gray-800 px-4 py-3 rounded-xl transition-colors">Bus Board</Link>
                <Link href="/drivers" className="hover:bg-gray-800 px-4 py-3 rounded-xl transition-colors">Drivers</Link>
                <Link href="/routes" className="hover:bg-gray-800 px-4 py-3 rounded-xl transition-colors">Routes</Link>
            </div>
            
            <div className='flex flex-col gap-3 mt-2 border-t border-gray-800 pt-4'>
                <Link href="/getapp" className='bg-white text-black px-4 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors text-center'>
                    For Driver
                </Link>
                <Link href="/getapp" className='bg-white text-black px-4 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors text-center'>
                    For Manager
                </Link>
            </div>
        </div>
    </nav>
  )
}

export default Navbar