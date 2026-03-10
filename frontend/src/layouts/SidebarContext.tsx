import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextValue {
  isOpen: boolean
  isMobile: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: true,
  isMobile: false,
  toggle: () => {},
  close: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= 768)

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setIsOpen(true)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <SidebarContext.Provider value={{
      isOpen,
      isMobile,
      toggle: () => setIsOpen(v => !v),
      close: () => setIsOpen(false),
    }}>
      {children}
    </SidebarContext.Provider>
  )
}
