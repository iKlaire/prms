interface EmptyStateProps {
  children: React.ReactNode;
}

export default function EmptyState({ children }: EmptyStateProps) {
  return <p className="text-sm text-gray-600 text-center py-8">{children}</p>;
}
