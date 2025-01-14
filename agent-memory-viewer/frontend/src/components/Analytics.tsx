import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const MEASUREMENT_ID = 'G-N5E7RC09G1'

// Extend the Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

function Analytics() {
  const location = useLocation()

  useEffect(() => {
    // Initialize GA script
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    script.async = true
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    window.gtag = function() {
      window.dataLayer.push(arguments)
    };
    window.gtag('js', new Date())
    window.gtag('config', MEASUREMENT_ID)

    // Clean up
    return () => {
      document.head.removeChild(script)
    };
  }, []);

  useEffect(() => {
    window.gtag('config', MEASUREMENT_ID, {
      page_path: location.pathname + location.search
    });
  }, [location])

  return null
}

export default Analytics