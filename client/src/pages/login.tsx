import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const { signIn, loading, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [, setLocation] = useLocation()

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation('/')
    }
  }, [user, setLocation])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email, password)
      // Show welcome message
      setShowWelcome(true)
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setLocation('/')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/src/assets/images/chipsbg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Welcome Message Popup */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center shadow-xl">
            <div className="mb-4">
              <img 
                src="/src/assets/images/kettle-studio-logo.png" 
                alt="Kettle Studio Logo" 
                className="h-16 w-auto mx-auto mb-4"
                style={{ maxWidth: '160px' }}
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Documentation Zone
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              of Kettle Studio
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl p-6 border border-white/20">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sign in</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting || loading} className="w-full">
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
