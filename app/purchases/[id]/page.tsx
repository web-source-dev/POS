import { PurchaseDetailsPage } from "@/components/purchases/purchase-details-page"
import { MainLayout } from "@/components/layout/main-layout"

export default function PurchaseDetails({ params }: { params: { id: string } }) {
  return (
    <MainLayout>
      <PurchaseDetailsPage id={params.id} />
    </MainLayout>
  )
} 