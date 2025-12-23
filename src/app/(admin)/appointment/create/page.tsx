"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    createAppointment,
    updateAppointment,
    getAppointmentById,
    AppointmentPayload,
} from "@/services/AppointmentService";
import { Toast } from "@/components/ui/Toast";
import AppointmentForm from "@/components/appointment/AppointmentForm";

const CreateAppointmentContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<any>(null);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (id) {
            const fetchAppointment = async () => {
                try {
                    setFetching(true);
                    const res = await getAppointmentById(id);
                    setInitialData(res.data);
                } catch (error: any) {
                    Toast({
                        message: error?.response?.data?.message || "Failed to load appointment",
                        type: "error",
                    });
                    router.push("/appointment");
                } finally {
                    setFetching(false);
                }
            };
            fetchAppointment();
        }
    }, [id, router]);

    const handleSubmit = async (data: any) => {
        try {
            setLoading(true);
            if (id) {
                // Update existing
                await updateAppointment(id, data);
                Toast({ message: "Appointment updated successfully", type: "success" });
            } else {
                // Create new
                const apptPayload: AppointmentPayload = {
                    ...data,
                    status: "confirmed",
                };
                await createAppointment(apptPayload);
                Toast({ message: "Appointment created successfully!", type: "success" });
            }
            router.push("/appointment");
        } catch (error: any) {
            console.error(error);
            Toast({
                message: error?.response?.data?.message || `Failed to ${id ? "update" : "create"} appointment`,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-[60vh] bg-white dark:bg-gray-900 rounded-2xl items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <AppointmentForm
            title={id ? "Edit Appointment" : "Create Appointment"}
            initialData={initialData}
            onSubmit={handleSubmit}
            loading={loading}
            isEditing={!!id}
        />
    );
};

const CreateAppointmentPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateAppointmentContent />
        </Suspense>
    );
};

export default CreateAppointmentPage;
