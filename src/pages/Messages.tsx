import { ChannelChat } from "@components/PageComponents/Messages/ChannelChat.tsx";
import { PageLayout } from "@components/PageLayout.tsx";
import { Sidebar } from "@components/Sidebar.tsx";
import { Avatar } from "@components/UI/Avatar.tsx";
import { SidebarSection } from "@components/UI/Sidebar/SidebarSection.tsx";
import { SidebarButton } from "@components/UI/Sidebar/SidebarButton.tsx";
import { useToast } from "@core/hooks/useToast.ts";
import { useDevice } from "@core/stores/deviceStore.ts";
import { Protobuf, Types } from "@meshtastic/core";
import { getChannelName } from "@pages/Channels.tsx";
import { HashIcon, LockIcon, LockOpenIcon } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { MessageInput } from "@components/PageComponents/Messages/MessageInput.tsx";
import { cn } from "@core/utils/cn.ts";
import {
  MessageState,
  MessageType,
  useMessageStore,
} from "@core/stores/messageStore/index.ts";
import { useSidebar } from "@core/stores/sidebarStore.tsx";
import { Input } from "@components/UI/Input.tsx";
import { randId } from "@core/utils/randId.ts";
import { useTranslation } from "react-i18next";

type NodeInfoWithUnread = Protobuf.Mesh.NodeInfo & { unreadCount: number };

export const MessagesPage = () => {
  const {
    channels,
    getNodes,
    getNode,
    hasNodeError,
    unreadCounts,
    resetUnread,
    connection,
  } = useDevice();
  const {
    getMyNodeNum,
    getMessages,
    setActiveChat,
    chatType,
    activeChat,
    setChatType,
    setMessageState,
  } = useMessageStore();
  const { toast } = useToast();
  const { isCollapsed } = useSidebar();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { t } = useTranslation(["messages", "channels", "ui"]);
  const deferredSearch = useDeferredValue(searchTerm);

  const filteredNodes = (): NodeInfoWithUnread[] => {
    const lowerCaseSearchTerm = deferredSearch.toLowerCase();

    return getNodes((node) => {
      const longName = node.user?.longName?.toLowerCase() ?? "";
      const shortName = node.user?.shortName?.toLowerCase() ?? "";
      return longName.includes(lowerCaseSearchTerm) ||
        shortName.includes(lowerCaseSearchTerm);
    })
      .map((node) => ({
        ...node,
        unreadCount: unreadCounts.get(node.num) ?? 0,
      }))
      .sort((a, b) => {
        const diff = b.unreadCount - a.unreadCount;
        if (diff !== 0) return diff;
        return Number(b.isFavorite) - Number(a.isFavorite);
      });
  };

  const allChannels = Array.from(channels.values());
  const filteredChannels = allChannels.filter(
    (ch) => ch.role !== Protobuf.Channel.Channel_Role.DISABLED,
  );
  const currentChannel = channels.get(activeChat);
  const otherNode = getNode(activeChat);

  const isDirect = chatType === MessageType.Direct;
  const isBroadcast = chatType === MessageType.Broadcast;

  const sendText = useCallback(async (message: string) => {
    const isDirect = chatType === MessageType.Direct;
    const toValue = isDirect ? activeChat : MessageType.Broadcast;

    const channelValue = isDirect
      ? Types.ChannelNumber.Primary
      : activeChat ?? 0;

    let messageId: number | undefined;

    try {
      messageId = await connection?.sendText(
        message,
        toValue,
        true,
        channelValue,
      );
      if (messageId !== undefined) {
        if (chatType === MessageType.Broadcast) {
          setMessageState({
            type: chatType,
            channelId: channelValue,
            messageId,
            newState: MessageState.Ack,
          });
        } else {
          setMessageState({
            type: chatType,
            nodeA: getMyNodeNum(),
            nodeB: activeChat,
            messageId,
            newState: MessageState.Ack,
          });
        }
      } else {
        console.warn("sendText completed but messageId is undefined");
      }
      // deno-lint-ignore no-explicit-any
    } catch (e: any) {
      console.error("Failed to send message:", e);
      // Note: messageId might be undefined here if the error occurred before it was assigned
      const failedId = messageId ?? randId();
      if (chatType === MessageType.Broadcast) {
        setMessageState({
          type: chatType,
          channelId: channelValue,
          messageId: failedId,
          newState: MessageState.Failed,
        });
      } else { // MessageType.Direct
        const failedId = messageId ?? randId();
        setMessageState({
          type: chatType,
          nodeA: getMyNodeNum(),
          nodeB: activeChat,
          messageId: failedId,
          newState: MessageState.Failed,
        });
      }
    }
  }, [activeChat, chatType, connection, getMyNodeNum, setMessageState]);

  const renderChatContent = () => {
    switch (chatType) {
      case MessageType.Broadcast:
        return (
          <ChannelChat
            messages={getMessages({
              type: MessageType.Broadcast,
              channelId: activeChat ?? 0,
            }).reverse()}
          />
        );
      case MessageType.Direct:
        return (
          <ChannelChat
            messages={getMessages({
              type: MessageType.Direct,
              nodeA: getMyNodeNum(),
              nodeB: activeChat,
            }).reverse()}
          />
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-slate-500 p-4">
            {t("messagesPage.selectChatPrompt")}
          </div>
        );
    }
  };

  const leftSidebar = useMemo(() => (
    <Sidebar>
      <SidebarSection
        label={t("navigation.channels")}
        className="py-2 px-0"
      >
        {filteredChannels?.map((channel) => (
          <SidebarButton
            key={channel.index}
            count={unreadCounts.get(channel.index)}
            label={channel.settings?.name ||
              (channel.index === 0
                ? t("page.broadcastLabel", { ns: "channels" })
                : t("page.channelLabel", {
                  index: channel.index,
                  ns: "channels",
                }))}
            active={activeChat === channel.index &&
              chatType === MessageType.Broadcast}
            onClick={() => {
              setChatType(MessageType.Broadcast);
              setActiveChat(channel.index);
              resetUnread(channel.index);
            }}
          >
            <HashIcon
              size={16}
              className={cn(isCollapsed ? "mr-0 mt-2" : "mr-2")}
            />
          </SidebarButton>
        ))}
      </SidebarSection>
    </Sidebar>
  ), [
    filteredChannels,
    unreadCounts,
    activeChat,
    chatType,
    isCollapsed,
    setActiveChat,
    setChatType,
    resetUnread,
  ]);

  const rightSidebar = useMemo(
    () => (
      <SidebarSection
        label=""
        className="px-0 flex flex-col h-full overflow-y-auto"
      >
        <label className="p-2 block">
          <Input
            type="text"
            placeholder={t("search.nodes")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            showClearButton={!!searchTerm}
          />
        </label>
        <div
          className={cn(
            "flex flex-col h-full flex-1 overflow-y-auto gap-2.5 pt-1 ",
          )}
        >
          {filteredNodes()?.map((node) => (
            <SidebarButton
              key={node.num}
              preventCollapse
              label={node.user?.longName ??
                t("unknown.shortName")}
              count={node.unreadCount > 0 ? node.unreadCount : undefined}
              active={activeChat === node.num &&
                chatType === MessageType.Direct}
              onClick={() => {
                setChatType(MessageType.Direct);
                setActiveChat(node.num);
                resetUnread(node.num);
              }}
            >
              <Avatar
                text={node.user?.shortName ??
                  t("unknown.shortName")}
                className={cn(hasNodeError(node.num) && "text-red-500")}
                showError={hasNodeError(node.num)}
                showFavorite={node.isFavorite}
                size="sm"
              />
            </SidebarButton>
          ))}
        </div>
      </SidebarSection>
    ),
    [
      filteredNodes,
      searchTerm,
      activeChat,
      chatType,
      setActiveChat,
      setChatType,
      resetUnread,
      hasNodeError,
    ],
  );

  return (
    <PageLayout
      label={`Messages: ${
        isBroadcast && currentChannel
          ? getChannelName(currentChannel)
          : isDirect && otherNode
          ? (otherNode.user?.longName ?? t("unknown.longName"))
          : t("emptyState.title")
      }`}
      rightBar={rightSidebar}
      leftBar={leftSidebar}
      actions={isDirect && otherNode
        ? [
          {
            key: "encryption",
            icon: otherNode.user?.publicKey?.length ? LockIcon : LockOpenIcon,
            iconClasses: otherNode.user?.publicKey?.length
              ? "text-green-600"
              : "text-yellow-300",
            onClick() {
              toast({
                title: otherNode.user?.publicKey?.length
                  ? t("toast.messages.pkiEncryption.title")
                  : t("toast.messages.pskEncryption.title"),
              });
            },
          },
        ]
        : []}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {renderChatContent()}

        <div className="flex-none dark:bg-slate-900 p-2">
          {(isBroadcast || isDirect)
            ? (
              <MessageInput
                to={isDirect ? activeChat : MessageType.Broadcast}
                onSend={sendText}
                maxBytes={200}
              />
            )
            : (
              <div className="p-4 text-center text-slate-400 italic">
                {t("messagesPage.sendMessagePrompt")}
              </div>
            )}
        </div>
      </div>
    </PageLayout>
  );
};

export default MessagesPage;
