import { ExpenseDetailPage } from '@/components/accounting/expense-detail';
import { MainLayout } from '@/components/layout/main-layout';

export default function ExpensePage() {
  return (
    <MainLayout>
      <ExpenseDetailPage />
    </MainLayout>
  );
} 