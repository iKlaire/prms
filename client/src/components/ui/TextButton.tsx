interface TextButtonProps {
  children: React.ReactNode;
  tone?: "danger" | "success" | "neutral";
  onClick: () => void;
}

export default function TextButton({
  children,
  tone = "neutral",
  onClick,
}: TextButtonProps) {
  const toneClass = {
    danger: "text-red-500 hover:text-red-400",
    success: "text-emerald-500 hover:text-emerald-400",
    neutral: "text-gray-500 hover:text-white",
  }[tone];

  return (
    <button onClick={onClick} className={`text-xs ${toneClass} transition-colors`}>
      {children}
    </button>
  );
}
