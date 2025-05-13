import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Expense Details | POS System',
  description: 'View and manage expense details',
};

export default function ExpenseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 