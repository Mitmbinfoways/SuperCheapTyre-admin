"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getAppointmentById,
  updateAppointment,
} from "@/services/AppointmentService";
import { Toast } from "@/components/ui/Toast";
import AppointmentForm from "@/components/appointment/AppointmentForm";

const EditAppointmentPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  const fetchAppointment = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAppointmentById(id);
      setInitialData(res.data);
    } catch (error: any) {
      Toast({
        message: error?.response?.data?.message || "Failed to load appointment",
        type: "error",
      });
      router.push("/admin/appointment");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      fetchAppointment();
    }
  }, [fetchAppointment, id]);

  const handleSubmit = async (data: any) => {
    try {
      setSaving(true);
      await updateAppointment(id, data);
      Toast({ message: "Appointment updated successfully", type: "success" });
      router.push("/admin/appointment");
    } catch (error: any) {
      Toast({
        message: error?.response?.data?.message || "Failed to update appointment",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] bg-white dark:bg-gray-900 rounded-2xl items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AppointmentForm
      title="Edit Appointment"
      initialData={initialData}
      onSubmit={handleSubmit}
      loading={saving}
      isEditing={true}
    />
  );
};

export default EditAppointmentPage;
