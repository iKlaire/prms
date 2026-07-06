interface PanelRowProps {
  children: React.ReactNode;
}

export default function PanelRow({ children }: PanelRowProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
      {children}
    </div>
  );
}
