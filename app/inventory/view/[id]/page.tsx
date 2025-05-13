"use client"

import { InventoryDetailsPage } from "@/components/inventory/inventory-details-page"
import { MainLayout } from "@/components/layout/main-layout"
import { withAuthProtection } from "@/lib/protected-route"
import { useParams } from "next/navigation"

// Protected page for authenticated users only
export default withAuthProtection(function ViewInventory() {
  const params = useParams()
  const itemId = params.id as string
  
  return (
    <MainLayout>
      <div className="flex-1 overflow-hidden">
        <InventoryDetailsPage itemId={itemId} />
      </div>
    </MainLayout>
  )
}) 