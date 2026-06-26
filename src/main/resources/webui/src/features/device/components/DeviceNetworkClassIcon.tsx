import { Icon, IconProps, createIcon } from "@chakra-ui/react"
import {
  LuCircleHelp,
  LuEthernetPort,
  LuNetwork,
  LuPhone,
  LuRadioTower,
  LuRouter,
  LuServer,
  LuSquareChevronRight,
  LuSquareTerminal,
  LuTerminal,
  LuWifi,
} from "react-icons/lu"
import { TbLoadBalancer } from "react-icons/tb"
import { DeviceNetworkClass } from "@/types"

const BrickWallFire = createIcon({
  displayName: "BrickWallFire",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <path d="M16 3v2.107" />
      <path d="M17 9c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 22 17a5 5 0 0 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C13 11.5 16 9 17 9" />
      <path d="M21 8.274V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.938" />
      <path d="M3 15h5.253" />
      <path d="M3 9h8.228" />
      <path d="M8 15v6" />
      <path d="M8 3v6" />
    </>
  ),
})

const Router = createIcon({
  displayName: "Router",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <circle cx="12" cy="12" r="10"/>
      <path d="M10.5 10.5L7.5 7.5M7.5 10.5V7.5H10.5"/>
      <path d="M13.5 13.5L16.5 16.5M13.5 16.5H16.5V13.5"/>
      <path d="M16.5 7.5L13.5 10.5M13.5 7.5V10.5H16.5"/>
      <path d="M7.5 16.5L10.5 13.5M10.5 16.5V13.5H7.5"/>
    </>
  )
})

const Switch = createIcon({
  displayName: "Switch",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <path d="M6 9H17"/>
      <path d="M14 6L17 9L14 12"/>
      <path d="M18 15H7"/>
      <path d="M10 12L7 15L10 18"/>
    </>
  )
})

const SwitchRouter = createIcon({
  displayName: "SwitchRouter",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <path d="M10.5 10.5L7.5 7.5M7.5 10.5V7.5H10.5"/>
      <path d="M13.5 13.5L16.5 16.5M13.5 16.5H16.5V13.5"/>
      <path d="M16.5 7.5L13.5 10.5M13.5 7.5V10.5H16.5"/>
      <path d="M7.5 16.5L10.5 13.5M10.5 16.5V13.5H7.5"/>
    </>
  )
})

const LoadBalancer = createIcon({
  displayName: "LoadBalancer",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <circle cx="8" cy="12" r="2.5"/>
      <path d="M2 12H5"/>
      <path d="M3 10L5 12L3 14"/>
      <path d="M10.5 12L20 5"/>
      <path d="M17 5H20V8"/>
      <path d="M10.5 12H21"/>
      <path d="M19 10L21 12L19 14"/>
      <path d="M10.5 12L20 19"/>
      <path d="M17 19H20V16"/>
    </>
  )
})

const WirelessController = createIcon({
  displayName: "WirelessController",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <path d="M9.5 13.866a4 4 0 0 1 5 .01"/>
      <path d="M12 17h.01"/>
      <path d="M7 10.754a8 8 0 0 1 10 0"/>
    </>
  )
})

const CLASS_ICON: Record<DeviceNetworkClass, React.ReactElement> = {
  [DeviceNetworkClass.Firewall]:           <BrickWallFire />,
  [DeviceNetworkClass.LoadBalancer]:       <LoadBalancer />,
  [DeviceNetworkClass.Router]:             <Router />,
  [DeviceNetworkClass.Server]:             <LuServer />,
  [DeviceNetworkClass.Switch]:             <Switch />,
  [DeviceNetworkClass.SwitchRouter]:       <SwitchRouter />,
  [DeviceNetworkClass.AccessPoint]:        <LuWifi />,
  [DeviceNetworkClass.WirelessController]: <WirelessController />,
  [DeviceNetworkClass.ConsoleServer]:      <LuSquareTerminal />,
  [DeviceNetworkClass.VoiceGateway]:       <LuPhone />,
  [DeviceNetworkClass.Unknown]:            <LuCircleHelp />,
}

type DeviceNetworkClassIconProps = IconProps & { networkClass: DeviceNetworkClass }

export default function DeviceNetworkClassIcon({ networkClass, ...iconProps }: DeviceNetworkClassIconProps) {
  return <Icon {...iconProps}>{CLASS_ICON[networkClass] ?? <LuCircleHelp />}</Icon>
}
