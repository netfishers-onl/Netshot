import Icon from "@/components/Icon"
import { Folder, isGroup } from "@/utils"
import { Box, BoxProps, Flex, Stack, Text } from "@chakra-ui/react"
import { motion, useAnimationControls } from "framer-motion"
import { MouseEvent, useEffect, useState } from "react"
import GroupOrFolderItem from "./GroupOrFolderItem"
import { useTreeGroup } from "./TreeGroupProvider"

export type FolderItemProps = {
  folder: Folder
} & BoxProps

export default function FolderItem(props: FolderItemProps) {
  const { folder, ...other } = props

  const ctx = useTreeGroup()
  const controls = useAnimationControls()
  const [isOpen, setIsOpen] = useState<boolean>(
    ctx.expandedKeys?.length > 0 ? ctx.expandedKeys.includes(folder.name) : false
  )

  async function toggleCollapse(evt?: MouseEvent) {
    evt?.stopPropagation()
    setIsOpen((prev) => !prev)
  }

  async function runAnimation() {
    await controls.start(isOpen ? "show" : "hidden")
  }

  useEffect(() => {
    runAnimation()
  }, [isOpen])

  return (
    <Box {...other}>
      <Stack direction="column" gap="0" onClick={toggleCollapse}>
        <Flex
          borderRadius="xl"
          transition="all .2s ease"
          pl="2"
          ml="-2"
          cursor="pointer"
          h="40px"
          _hover={{
            bg: "grey.50",
          }}
        >
          <Stack direction="row" gap="3" alignItems="center">
            <Icon
              name="chevronDown"
              color="grey.500"
              css={{
                transform: isOpen ? "" : "rotate(-90deg)",
              }}
            />
            <Stack direction="row" gap="3" alignItems="center">
              <Icon name="folder" color="green.600" />
              <Text>{folder?.name}</Text>
            </Stack>
          </Stack>
        </Flex>
        <motion.div
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, height: 0, pointerEvents: "none" },
            show: {
              opacity: 1,
              height: "auto",
              pointerEvents: "all",
            },
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <Stack direction="column" gap="0">
            {folder?.children?.map((child) => (
              <GroupOrFolderItem
                pl="6"
                item={child}
                key={isGroup(child) ? child?.id : child?.name}
              />
            ))}
          </Stack>
        </motion.div>
      </Stack>
    </Box>
  )
}
