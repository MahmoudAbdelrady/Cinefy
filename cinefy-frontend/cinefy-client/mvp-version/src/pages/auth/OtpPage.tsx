import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'
import { AuthStepper } from './AuthStepper'
import { OtpInput } from './OtpInput'

const LENGTH = 6
const RESEND_SECONDS = 30

export function OtpPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState<string[]>(Array(LENGTH).fill(''))
  const [seconds, setSeconds] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (seconds <= 0) return
    const id = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [seconds])

  const complete = code.every((d) => d !== '')

  const verify = (e?: React.SyntheticEvent) => {
    e?.preventDefault()
    if (!complete) return
    navigate('/change-password')
  }

  const resend = () => {
    setCode(Array(LENGTH).fill(''))
    setSeconds(RESEND_SECONDS)
  }

  return (
    <AuthLayout
      stepper={<AuthStepper current={0} />}
      heading="Enter the code"
      subheading={`We sent a ${LENGTH}-digit code to your email address. Enter it below to continue.`}
      footer={
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Use a different email
        </Link>
      }
    >
      <form onSubmit={verify} className="space-y-6">
        <OtpInput value={code} onChange={setCode} onComplete={() => verify()} />

        <Button
          type="submit"
          size="lg"
          disabled={!complete}
          className="group w-full gap-2 bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        >
          Verify & continue
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn't receive it?{' '}
          {seconds > 0 ? (
            <span className="font-mono text-foreground">
              Resend in {String(seconds).padStart(2, '0')}s
            </span>
          ) : (
            <button
              type="button"
              onClick={resend}
              className="font-medium text-amber transition-colors hover:text-amber/80"
            >
              Resend code
            </button>
          )}
        </p>
      </form>
    </AuthLayout>
  )
}
