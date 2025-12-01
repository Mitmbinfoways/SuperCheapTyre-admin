"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getAppointmentById,
  updateAppointment,
  getAvailableSlots,
  Appointment,
} from "@/services/AppointmentService";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import { GetTechnicians } from "@/services/TechnicianService";
import Skeleton from "@/components/ui/Skeleton";
import { FormLabel } from "@/components/ui/FormLabel";
import CommonPhoneInput from "@/components/ui/CommonPhoneInput";
import { IoArrowBack } from "react-icons/io5";

const EditAppointmentPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [slotId, setSlotId] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [employee, setEmployee] = useState("");
  const [timeSlotId, setTimeSlotId] = useState("");

  const [technicians, setTechnicians] = useState<{ label: string; value: string }[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const statusOptions = [
    { label: "Booked", value: "booked" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Reserved", value: "reserved" },
  ];

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchTechnicians = useCallback(async () => {
    try {
      const res = await GetTechnicians();
      const options = res.data.items
        .filter((t: any) => t.isActive)
        .map((t: any) => ({
          label: `${t.firstName} ${t.lastName}`,
          value: t._id,
        }));
      setTechnicians(options);
    } catch (error) {
      console.error("Failed to load technicians", error);
    }
  }, []);

  const fetchSlots = useCallback(async (selectedDate: Date, tSlotId?: string) => {
    try {
      setLoadingSlots(true);
      const dateStr = formatDateForInput(selectedDate);
      const res = await getAvailableSlots(dateStr, tSlotId);
      setAvailableSlots(res.data.slots || []);
    } catch (error) {
      console.error("Failed to load slots", error);
      Toast({ message: "Failed to load time slots", type: "error" });
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const fetchAppointment = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAppointmentById(id);
      const appt = res.data;

      setFirstname(appt.firstname);
      setLastname(appt.lastname);
      setEmail(appt.email);
      setPhone(appt.phone);
      setStatus(appt.status);
      setNotes(appt.notes || "");
      setEmployee(appt.Employee || "");
      setSlotId(appt.slotId);
      setTimeSlotId(appt.timeSlotId);

      if (appt.date) {
        const d = new Date(appt.date);
        setDate(d);
        // Fetch slots for this date to show the selected one and others
        fetchSlots(d, appt.timeSlotId);
      }
    } catch (error: any) {
      Toast({
        message: error?.response?.data?.message || "Failed to load appointment",
        type: "error",
      });
      router.push("/admin/appointment");
    } finally {
      setLoading(false);
    }
  }, [id, router, fetchSlots]);



  useEffect(() => {
    fetchTechnicians();
    if (id) {
      fetchAppointment();
    }
  }, [fetchTechnicians, fetchAppointment, id]);

  const handleDateChange = (newDate: Date | null) => {
    setDate(newDate);
    setSlotId(""); // Reset slot when date changes
    if (newDate) {
      fetchSlots(newDate, timeSlotId);
    } else {
      setAvailableSlots([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: { [key: string]: string } = {};
    if (!firstname.trim()) newErrors.firstname = "First name is required";
    if (!lastname.trim()) newErrors.lastname = "Last name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!phone.trim()) newErrors.phone = "Phone is required";
    if (!date) newErrors.date = "Date is required";
    if (!slotId) newErrors.slotId = "Time slot is required";
    if (!employee) newErrors.employee = "Technician assignment is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      setSaving(true);
      await updateAppointment(id, {
        firstname,
        lastname,
        email,
        phone,
        date: formatDateForInput(date!),
        slotId,
        status,
        notes,
        Employee: employee || undefined,
        timeSlotId, // Keep the same timeSlotId config
      });
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
      <div className="p-6">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <IoArrowBack size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Appointment
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm">
        {/* Customer Details */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
            Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <FormLabel label="First Name" required />
              <TextField
                value={firstname}
                onChange={(e) => {
                  setFirstname(e.target.value);
                  if (errors.firstname) setErrors({ ...errors, firstname: "" });
                }}
                placeholder="Enter first name"
                error={errors.firstname}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FormLabel label="Last Name" required />
              <TextField
                value={lastname}
                onChange={(e) => {
                  setLastname(e.target.value);
                  if (errors.lastname) setErrors({ ...errors, lastname: "" });
                }}
                placeholder="Enter last name"
                error={errors.lastname}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FormLabel label="Email" required />
              <TextField
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                placeholder="Enter email"
                error={errors.email}
              />
            </div>
            <div className="flex flex-col gap-2">
              <CommonPhoneInput
                label="Phone"
                name="phone"
                value={phone}
                required
                error={errors.phone}
                touched={!!errors.phone}
                onChange={(val: string) => {
                  setPhone(val);
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                onClearError={() => {
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                onTouch={() => { }}
              />
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
            Appointment Schedule
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-2">
              <FormLabel label="Date" />
              <DatePicker
                value={date}
                minDate={new Date()}
                onChange={handleDateChange}
                placeholder="Select Date"
                className="w-full"
              />
              {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
            </div>

            {/* <div className="flex flex-col gap-2">
              <FormLabel label="Status" />
              <Select
                options={statusOptions}
                value={status}
                onChange={setStatus}
                placeholder="Select Status"
              />
            </div> */}
          </div>

          {/* Time Slots */}
          <div className="mb-6">
            <FormLabel label="Available Time Slots" required />
            {loadingSlots ? (
              <div className="w-full">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-10 w-full rounded-md overflow-hidden">
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availableSlots.map((slot) => {
                  const isSelected = slot.slotId === slotId;
                  // If it's the current appointment's slot, it might show as unavailable in the API if we don't exclude it, 
                  // but our backend logic for getAvailableSlots checks for booked appointments.
                  // If we are editing, the current slot is booked by US.
                  // The API getAvailableSlots returns isAvailable=false for booked slots.
                  // However, we should allow selecting the CURRENT slot even if it says unavailable (because it's ours).
                  // But wait, getAvailableSlots doesn't know about "us" (the appointment being edited).
                  // So the current slot will likely be returned as isAvailable: false.
                  // We need to handle this visually.

                  // Actually, if we are editing, we might want to show the current slot as selected.
                  // If the user changes the date, then we pick a new slot.
                  // If the date is the same, the current slot ID matches.

                  const isAvailable = slot.isAvailable || slot.slotId === slotId; // Allow current slot

                  return (
                    <button
                      key={slot.slotId}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSlotId(slot.slotId)}
                      className={`
                        px-2 py-2 text-sm font-medium rounded-lg border transition-all
                        ${isSelected
                          ? "bg-primary text-white border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900"
                          : isAvailable
                            ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-transparent cursor-not-allowed decoration-slice"
                        }
                      `}
                    >
                      {slot.startTime} - {slot.endTime}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm italic">
                {date ? "No slots available for this date." : "Please select a date to view slots."}
              </div>
            )}
            {errors.slotId && <p className="mt-1 text-sm text-red-600">{errors.slotId}</p>}
          </div>
        </div>

        {/* Assignment & Notes */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
            Assignment & Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <FormLabel label="Assign Technician" required />
              <Select
                options={technicians}
                value={employee}
                onChange={(val) => {
                  setEmployee(val);
                  if (errors.employee) setErrors({ ...errors, employee: "" });
                }}
                placeholder="Select Technician"
                error={errors.employee}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <FormLabel label="Notes" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes here..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditAppointmentPage;
