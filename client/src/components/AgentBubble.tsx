interface AgentBubbleProps {
  message: string;
  isThinking: boolean;
}

export default function AgentBubble({ message, isThinking }: AgentBubbleProps) {
  if (!message && !isThinking) return null;

  return (
    <div className="mb-3 rounded-2xl border border-black/10 bg-soft-blue p-4">
      <div className="mb-1 text-xs font-medium text-black/70">AI Agent</div>
      {isThinking ? (
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-black/40" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-black/40 [animation-delay:0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-black/40 [animation-delay:0.2s]" />
        </div>
      ) : (
        <p className="text-sm text-black/80">{message}</p>
      )}
    </div>
  );
}
