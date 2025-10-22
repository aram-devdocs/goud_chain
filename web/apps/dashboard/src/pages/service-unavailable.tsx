import {
  Button,
  Card,
  CardContent,
  Heading,
  Text,
  Container,
  Stack,
  ButtonGroup,
  Flex,
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
    <Flex
      direction="col"
      align="center"
      justify="center"
      className="min-h-screen bg-black px-4"
    >
      <Container maxWidth="2xl">
        <Stack spacing={8}>
          <Stack spacing={4} align="center">
            <Heading level={1} className="text-6xl">
              503
            </Heading>
            <Heading level={2} as={3} className="text-zinc-300">
              Service Temporarily Unavailable
            </Heading>
            <Text color="zinc-400">
              The service is currently experiencing high load or maintenance.
            </Text>
          </Stack>

          <Card>
            <CardContent>
              <Stack spacing={6}>
                <Stack spacing={4}>
                  <Heading level={3}>
                    What happened?
                  </Heading>
                  <Text color="zinc-400">
                    The Goud Chain service is temporarily unavailable due to high load or ongoing
                    maintenance. Your data is safe and the blockchain continues to operate.
                  </Text>
                </Stack>

                <Stack spacing={4}>
                  <Heading level={3}>
                    What can you do?
                  </Heading>
                  <Stack spacing={3}>
                    <Text color="zinc-400">
                      • Wait a few minutes and try again
                    </Text>
                    <Text color="zinc-400">
                      • Check the service status page for updates
                    </Text>
                    <Text color="zinc-400">
                      • If the issue persists, contact support
                    </Text>
                  </Stack>
                </Stack>
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

          <Stack align="center">
            <Text size="sm" color="zinc-500">
              Technical details: Service returned a 5xx error indicating server-side issues.
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Flex>
  )
}
