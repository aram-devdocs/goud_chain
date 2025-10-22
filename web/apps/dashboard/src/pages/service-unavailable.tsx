export default function ServiceUnavailablePage() {
  const handleRetry = () => {
    window.location.href = '/'
  }

  const handleCheckStatus = () => {
    window.open('https://status.goudchain.com', '_blank')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">503</h1>
          <p className="text-2xl text-zinc-300 mb-2">Service Temporarily Unavailable</p>
          <p className="text-zinc-400">
            The service is currently experiencing high load or maintenance.
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">What happened?</h2>
          <p className="text-zinc-400 mb-6">
            The Goud Chain service is temporarily unavailable due to high load or ongoing
            maintenance. Your data is safe and the blockchain continues to operate.
          </p>

          <h2 className="text-lg font-semibold text-white mb-4">What can you do?</h2>
          <ul className="space-y-3 text-zinc-400">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Wait a few minutes and try again</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Check the service status page for updates</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>If the issue persists, contact support</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={handleCheckStatus}
            className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 border border-zinc-700 transition-colors font-medium"
          >
            Check Status
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500">
            Technical details: Service returned a 5xx error indicating server-side issues.
          </p>
        </div>
      </div>
    </div>
  )
}
