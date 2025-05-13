"use client"

import { AddInventoryForm } from "@/components/inventory/add-inventory-form"
import { MainLayout } from "@/components/layout/main-layout"
import { withAuthProtection } from "@/lib/protected-route"

// Protected page for authenticated users only
export default withAuthProtection(function AddInventory() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 overflow-auto">
        <AddInventoryForm />
      </div>
    </MainLayout>
  )
}) 