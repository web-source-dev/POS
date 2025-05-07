"use client"

import { SuppliersPage } from "@/components/suppliers/suppliers-page"
import { MainLayout } from "@/components/layout/main-layout"
import { withAuthProtection } from "@/lib/protected-route"

function Suppliers() {
  return (
    <MainLayout>
      <SuppliersPage />
    </MainLayout>
  )
}

// Protect the suppliers page with authentication
export default withAuthProtection(Suppliers)
