"use client"

import { EditInventoryForm } from "@/components/inventory/edit-inventory-form"
import { MainLayout } from "@/components/layout/main-layout"
import { withAuthProtection } from "@/lib/protected-route"

// Protected page for authenticated users only
export default withAuthProtection(function EditInventory({ params }: { params: { id: string } }) {
  const { id } = params;
  
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 overflow-auto">
        <EditInventoryForm itemId={id} />
      </div>
    </MainLayout>
  )
}) 