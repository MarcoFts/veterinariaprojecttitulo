import { useEffect } from 'react'
import { logout } from '../auth'
import { useNavigate } from 'react-router-dom'

export default function Logout() {
  const navigate = useNavigate()
  useEffect(() => {
    logout()
    navigate('/login', { replace: true })
  }, [navigate])
  return null
}
