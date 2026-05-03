interface AgentBubbleProps {
  message: string;
  isThinking: boolean;
}

export default function AgentBubble({ message, isThinking }: AgentBubbleProps) {
  if (!message && !isThinking) return null;

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-3">
      <div className="text-xs font-medium text-indigo-600 mb-1">AI Agent</div>
      {isThinking ? (
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]" />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
        </div>
      ) : (
        <p className="text-sm text-gray-800">{message}</p>
      )}
    </div>
  );
}
