import {
  Button,
  Card,
  CardContent,
  Heading,
  Text,
  Container,
  Stack,
  ButtonGroup,
} from '@goudchain/ui'
import { ButtonVariant, ButtonSize } from '@goudchain/types'
import { EXTERNAL_URLS, ROUTES } from '@goudchain/utils'

export default function ServiceUnavailablePage() {
  const handleRetry = () => {
    window.location.href = ROUTES.HOME
  }

  const handleCheckStatus = () => {
    const statusWindow = window.open(EXTERNAL_URLS.STATUS_PAGE, '_blank')
    if (statusWindow) {
      statusWindow.opener = null
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Container maxWidth="2xl">
        <Stack spacing={8}>
          <div className="text-center">
            <Heading level={1} className="text-6xl mb-4">
              503
            </Heading>
            <Heading level={2} className="text-2xl text-zinc-300 mb-2">
              Service Temporarily Unavailable
            </Heading>
            <Text color="muted">
              The service is currently experiencing high load or maintenance.
            </Text>
          </div>

          <Card>
            <CardContent className="p-8">
              <Stack spacing={6}>
                <div>
                  <Heading level={3} className="text-lg mb-4">
                    What happened?
                  </Heading>
                  <Text color="muted">
                    The Goud Chain service is temporarily unavailable due to high load or ongoing
                    maintenance. Your data is safe and the blockchain continues to operate.
                  </Text>
                </div>

                <div>
                  <Heading level={3} className="text-lg mb-4">
                    What can you do?
                  </Heading>
                  <Stack spacing={3} as="ul">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <Text color="muted">Wait a few minutes and try again</Text>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <Text color="muted">Check the service status page for updates</Text>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <Text color="muted">If the issue persists, contact support</Text>
                    </li>
                  </Stack>
                </div>
              </Stack>
            </CardContent>
          </Card>

          <ButtonGroup align="center">
            <Button onClick={handleRetry} variant={ButtonVariant.Primary} size={ButtonSize.Large}>
              Try Again
            </Button>
            <Button
              onClick={handleCheckStatus}
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Large}
            >
              Check Status
            </Button>
          </ButtonGroup>

          <div className="text-center">
            <Text size="sm" color="muted">
              Technical details: Service returned a 5xx error indicating server-side issues.
            </Text>
          </div>
        </Stack>
      </Container>
    </div>
  )
}
