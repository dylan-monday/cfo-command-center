'use client';

import { useRouter } from 'next/navigation';
import { ConversationList } from '@/components/chat';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleNewChat = () => {
    router.push('/chat');
  };

  return (
    <div className="h-full flex -m-6">
      {/* Conversation sidebar - hidden on mobile */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <ConversationList onNewChat={handleNewChat} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg">
        {children}
      </div>
    </div>
  );
}
