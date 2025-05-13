"use client"

import { SupplierDetailsPage } from "@/components/suppliers/supplier-details-page"
import { MainLayout } from "@/components/layout/main-layout"
import { withAuthProtection } from "@/lib/protected-route"
import { useParams } from "next/navigation"

// Protected page for authenticated users only
export default withAuthProtection(function ViewSupplier() {
  const params = useParams()
  const supplierId = params.id as string
  
  return (
    <MainLayout>
      <div className="flex-1 overflow-hidden">
        <SupplierDetailsPage supplierId={supplierId} />
      </div>
    </MainLayout>
  )
}) 