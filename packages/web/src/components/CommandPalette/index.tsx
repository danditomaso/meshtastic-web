import { MeshAvatar } from "@components/MeshAvatar.tsx";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@components/UI/Command.tsx";
import {
  useAppStore,
  useDevice,
  useDeviceStore,
  useNodeDB,
} from "@core/stores";
import { useNavigate } from "@tanstack/react-router";
import { useCommandState } from "cmdk";
import {
  ArrowLeftRightIcon,
  BoxSelectIcon,
  BugIcon,
  CloudOff,
  EraserIcon,
  FactoryIcon,
  HardDriveUpload,
  LayersIcon,
  LinkIcon,
  type LucideIcon,
  MapIcon,
  MessageSquareIcon,
  PlusIcon,
  PowerIcon,
  QrCodeIcon,
  RefreshCwIcon,
  SettingsIcon,
  SmartphoneIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface Group {
  id: string;
  label: string;
  icon: LucideIcon;
  commands: Command[];
}
export interface Command {
  label: string;
  icon: LucideIcon;
  action?: () => void;
  subItems?: SubItem[];
  tags?: string[];
}
export interface SubItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setConnectDialogOpen,
    setSelectedDevice,
  } = useAppStore();
  const { getDevices } = useDeviceStore();
  const { setDialogOpen, connection } = useDevice();
  const { getNode, removeAllNodeErrors, removeAllNodes } = useNodeDB();
  const { t } = useTranslation("commandPalette");
  const navigate = useNavigate({ from: "/" });

  const groups: Group[] = [
    {
      id: "gotoGroup",
      label: t("goto.label"),
      icon: LinkIcon,
      commands: [
        {
          label: t("goto.command.messages"),
          icon: MessageSquareIcon,
          action() {
            navigate({ to: "/messages" });
          },
        },
        {
          label: t("goto.command.map"),
          icon: MapIcon,
          action() {
            navigate({ to: "/map" });
          },
        },
        {
          label: t("goto.command.config"),
          icon: SettingsIcon,
          action() {
            navigate({ to: "/config" });
          },
          tags: ["settings"],
        },
        {
          label: t("goto.command.channels"),
          icon: LayersIcon,
          action() {
            navigate({ to: "/channels" });
          },
        },
        {
          label: t("goto.command.nodes"),
          icon: UsersIcon,
          action() {
            navigate({ to: "/nodes" });
          },
        },
      ],
    },
    {
      id: "manageGroup",
      label: t("manage.label"),
      icon: SmartphoneIcon,
      commands: [
        {
          label: t("manage.command.switchNode"),
          icon: ArrowLeftRightIcon,
          subItems: getDevices().map((device) => ({
            label:
              getNode(device.hardware.myNodeNum)?.user?.longName ??
              t("unknown.shortName"),
            icon: (
              <MeshAvatar
                text={
                  getNode(device.hardware.myNodeNum)?.user?.shortName ??
                  t("unknown.shortName")
                }
              />
            ),
            action() {
              setSelectedDevice(device.id);
            },
          })),
        },
        {
          label: t("manage.command.connectNewNode"),
          icon: PlusIcon,
          action() {
            setConnectDialogOpen(true);
          },
        },
      ],
    },
    {
      id: "contextualGroup",
      label: t("contextual.label"),
      icon: BoxSelectIcon,
      commands: [
        {
          label: t("contextual.command.qrCode"),
          icon: QrCodeIcon,
          subItems: [
            {
              label: t("contextual.command.qrGenerator"),
              icon: <QrCodeIcon size={16} />,
              action() {
                setDialogOpen("QR", true);
              },
            },
            {
              label: t("contextual.command.qrImport"),
              icon: <QrCodeIcon size={16} />,
              action() {
                setDialogOpen("import", true);
              },
            },
          ],
        },
        {
          label: t("contextual.command.scheduleShutdown"),
          icon: PowerIcon,
          action() {
            setDialogOpen("shutdown", true);
          },
        },
        {
          label: t("contextual.command.scheduleReboot"),
          icon: RefreshCwIcon,
          action() {
            setDialogOpen("reboot", true);
          },
        },
        {
          label: t("contextual.command.dfuMode"),
          icon: HardDriveUpload,
          action() {
            connection?.enterDfuMode();
          },
        },
        {
          label: t("contextual.command.resetNodeDb"),
          icon: TrashIcon,
          action() {
            connection?.resetNodes();
            removeAllNodeErrors();
            removeAllNodes(true);
          },
        },
        {
          label: t("contextual.command.disconnect"),
          icon: CloudOff,
          action() {
            connection?.disconnect().catch((error) => {
              console.error("Failed to disconnect:", error);
            });
          },
        },
        {
          label: t("contextual.command.factoryResetDevice"),
          icon: FactoryIcon,
          action() {
            connection?.factoryResetDevice();
            removeAllNodeErrors();
            removeAllNodes();
          },
        },
        {
          label: t("contextual.command.factoryResetConfig"),
          icon: FactoryIcon,
          action() {
            connection?.factoryResetConfig();
          },
        },
      ],
    },
    {
      id: "debugGroup",
      label: t("debug.label"),
      icon: BugIcon,
      commands: [
        {
          label: t("debug.command.reconfigure"),
          icon: RefreshCwIcon,
          action() {
            void connection?.configure();
          },
        },
        {
          label: t("debug.command.clearAllStoredMessages"),
          icon: EraserIcon,
          action() {
            setDialogOpen("deleteMessages", true);
          },
        },
      ],
    },
  ];

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    globalThis.addEventListener("keydown", handleKeydown);
    return () => globalThis.removeEventListener("keydown", handleKeydown);
  }, [setCommandPaletteOpen]);

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput placeholder={t("search.commandPalette")} />
      <CommandList>
        <CommandEmpty>{t("emptyState")}</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup
            key={group.label}
            heading={
              <div className="flex items-center justify-between">
                <span>{group.label}</span>
              </div>
            }
          >
            {group.commands.map((command) => (
              <div key={command.label}>
                <CommandItem
                  onSelect={() => {
                    command.action?.();
                    setCommandPaletteOpen(false);
                  }}
                >
                  <command.icon size={16} className="mr-2" />
                  {command.label}
                </CommandItem>
                {command.subItems?.map((subItem) => (
                  <SubItem
                    key={subItem.label}
                    label={subItem.label}
                    icon={subItem.icon}
                    action={subItem.action}
                  />
                ))}
              </div>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

const SubItem = ({
  label,
  icon,
  action,
}: {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}) => {
  const search = useCommandState((state) => state.search);
  if (!search) {
    return null;
  }

  return (
    <CommandItem onSelect={action}>
      {icon}
      {label}
    </CommandItem>
  );
};
