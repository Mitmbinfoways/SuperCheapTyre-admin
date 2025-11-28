"use client";

import React from "react";
import { useRouter } from "next/navigation";
import EditInvoice from "@/app/admin/create-invoice/Edit-invoice";

const EditOrderPage: React.FC<any> = ({ params }) => {
    const router = useRouter();
    const { id } = params;

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <EditInvoice
                initialOrderId={id}
                disableOrderSelect={true}
                onBack={() => router.push(`/admin/orders/${id}`)}
            />
        </div>
    );
};

export default EditOrderPage;
