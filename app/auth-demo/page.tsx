import { auth0 } from "@/lib/auth0";
import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
import Profile from "@/components/Profile";

export default async function AuthDemoPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="flex flex-col items-center gap-6">
            <img
              src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png"
              alt="Auth0 Logo"
              className="w-40 mb-2"
            />
            <h1 className="text-3xl font-bold text-white text-center">
              Next.js + Auth0
            </h1>

            <div className="w-full bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              {user ? (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-green-400 text-lg font-semibold">
                    ✅ Successfully logged in!
                  </p>
                  <Profile />
                  <LogoutButton />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-slate-300 text-center">
                    Welcome! Please log in to access your protected content.
                  </p>
                  <LoginButton />
                </div>
              )}
            </div>

            <a
              href="/dashboard"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
