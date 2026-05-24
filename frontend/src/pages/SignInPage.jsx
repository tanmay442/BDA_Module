import { SignIn } from '@clerk/clerk-react'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/70">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  )
}
