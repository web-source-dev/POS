"use client"

import { InventoryPage } from "@/components/inventory/inventory-page"
import { MainLayout } from "@/components/layout/main-layout"
import { withAuthProtection } from "@/lib/protected-route"

// Protected page for authenticated users only
export default withAuthProtection(function Inventory() {
  return (
    <MainLayout>
      <InventoryPage />
    </MainLayout>
  )
})
