import { Alert, Button, ButtonGroup, List, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { MouseEvent, useMemo } from "react"
import { useTranslation } from "react-i18next"

import api from "@/api"
import { NETSHOT_APP_LIBRARIES, QUERIES } from "@/constants"
import { useAlertDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"

import Icon from "../Icon"

function AboutContent() {
  const { t } = useTranslation()

  const { data: serverInfo } = useQuery({
    queryKey: [QUERIES.SERVER_INFO],
    queryFn: api.auth.serverInfo,
  })

  const serverVersion = useMemo(() => serverInfo?.serverVersion, [serverInfo])

  return (
    <Stack gap="6">
      <Alert.Root status="info" bg="blue.50">
        <Alert.Indicator />
        <Alert.Title>
          {t("connectedToNetshotVersion", {
            version: serverVersion,
          })}
        </Alert.Title>
      </Alert.Root>
      <Stack>
        <Text asChild>
          <b>{t("thankYouForUsingNetshotNetshotIsFreeOpenSourceSoftware")}</b>
        </Text>
        <Text>
          {t("copyright2014NetshotSasuAllRightsReserved", {
            year: new Date().getFullYear(),
          })}
        </Text>
      </Stack>
      <Stack>
        <ButtonGroup justifyContent="center" variant="outline" attached>
          <Button asChild>
            <a target="_blank" href="https://www.netshot.net" rel="noreferrer">
              <Icon name="home" />
              {t("homePage")}
            </a>
          </Button>
          <Button asChild>
            <a target="_blank" href="mailto:contact@netshot.net" rel="noreferrer">
              <Icon name="atSign" />
              {t("contact")}
            </a>
          </Button>
          <Button asChild>
            <a target="_blank" href="https://github.com/netfishers-onl/Netshot" rel="noreferrer">
              <Icon name="gitHub" />
              {t("sourceCode")}
            </a>
          </Button>
        </ButtonGroup>
      </Stack>
      <Stack>
        <Text fontWeight="medium">
          {t(
            "feelFreeToContactUsWeOfferServicesIncludingSupportAndSpecifi"
          )}
        </Text>
      </Stack>
      <Stack>
        <Text>
          {t(
            'Netshot is distributed "as is", without warranty. Netshot SASU can\'t be held responsible for any damage caused to your devices or your network by the usage of Netshot. Netshot has no relationship with the network device vendors.'
          )}
        </Text>
      </Stack>
      <Stack>
        <Text>{t("netshotMakesUseOfTheFollowingLibraries")}</Text>
        <List.Root as="ul" display="block">
          {NETSHOT_APP_LIBRARIES.map((lib) => (
            <List.Item key={lib} display="inline-list-item" marginRight="2">
              {lib}
            </List.Item>
          ))}
        </List.Root>
      </Stack>
    </Stack>
  )
}

type AboutModalProps = PropsWithRenderItem<object>

export function AboutNetshotModal(props: AboutModalProps) {
  const { renderItem } = props
  const { t } = useTranslation()
  const dialog = useAlertDialog()

  function open(evt: MouseEvent<HTMLButtonElement>) {
    evt?.stopPropagation()

    dialog.open({
      title: t("aboutNetshot"),
      description: <AboutContent />,
      size: "xl",
    })
  }

  return renderItem(open)
}
