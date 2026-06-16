import { AppLayout } from "@/components/layout/AppLayout";
import { ExpensesTracker } from "@/app/expenses/ExpensesTracker";

export default function ExpensesPage() {
  return (
    <AppLayout>
      <ExpensesTracker />
    </AppLayout>
  );
}
