"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    getAvailableSlots,
    Appointment,
} from "@/services/AppointmentService";
import { GetTechnicians } from "@/services/TechnicianService";
import { getAllTimeSlots } from "@/services/TimeSlotService";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { FormLabel } from "@/components/ui/FormLabel";
import { IoArrowBack } from "react-icons/io5";
import CommonPhoneInput from "@/components/ui/CommonPhoneInput";

interface AppointmentFormProps {
    initialData?: Partial<Appointment>;
    onSubmit: (data: any) => Promise<void>;
    loading?: boolean;
    title: string;
    isEditing?: boolean;
}

const AppointmentForm = ({
    initialData,
    onSubmit,
    loading = false,
    title,
    isEditing = false,
}: AppointmentFormProps) => {
    const router = useRouter();

    // Form states
    const [firstname, setFirstname] = useState(initialData?.firstname || "");
    const [lastname, setLastname] = useState(initialData?.lastname || "");
    const [email, setEmail] = useState(initialData?.email || "");
    const [phone, setPhone] = useState(initialData?.phone || "");
    const [date, setDate] = useState<Date | null>(initialData?.date ? new Date(initialData.date) : null);
    const [slotId, setSlotId] = useState(initialData?.slotId || "");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [employee, setEmployee] = useState(initialData?.Employee || "");
    const [timeSlotId, setTimeSlotId] = useState(initialData?.timeSlotId || "");

    const [technicians, setTechnicians] = useState<{ label: string; value: string }[]>([]);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

    useEffect(() => {
        fetchTechnicians();

        // Only fetch active time slot if creating new, or if we need it for some reason.
        // Actually the edit page didn't fetch this explicitly unless it was missing?
        // The edit page used `appt.timeSlotId`.
        // The create page fetched it to default it.
        if (!isEditing && !timeSlotId) {
            const fetchActiveTimeSlot = async () => {
                try {
                    const res = await getAllTimeSlots({ isActive: true });
                    if (res.data && res.data.length > 0) {
                        setTimeSlotId(res.data[0]._id);
                    }
                } catch (error) {
                    console.error("Failed to fetch active time slot", error);
                }
            };
            fetchActiveTimeSlot();
        }
    }, [fetchTechnicians, isEditing, timeSlotId]);

    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

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

    // Initial fetch of slots if editing and date is present
    useEffect(() => {
        if (isEditing && initialData?.date && initialData?.timeSlotId) {
            // We only want to do this once on mount if data is present, 
            // but `date` state is initialized from props.
            // However, `fetchSlots` depends on `date`.
            // We can just rely on `handleDateChange` logic but we need to trigger it initially.
            // Or better, just call fetchSlots if we have a date and slots are empty.
            if (availableSlots.length === 0) {
                fetchSlots(new Date(initialData.date), initialData.timeSlotId);
            }
        }
    }, [isEditing, initialData, fetchSlots, availableSlots.length]);


    const handleDateChange = (newDate: Date | null) => {
        setDate(newDate);
        setSlotId("");
        if (errors.date) setErrors(prev => ({ ...prev, date: "" }));
        if (errors.slotId) setErrors(prev => ({ ...prev, slotId: "" }));
        if (newDate) {
            fetchSlots(newDate, timeSlotId);
        } else {
            setAvailableSlots([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};
        if (!firstname.trim()) newErrors.firstname = "First name is required";
        if (!lastname.trim()) newErrors.lastname = "Last name is required";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(email)) {
            newErrors.email = "Invalid email address";
        }

        if (!phone.trim()) newErrors.phone = "Phone is required";
        if (!date) newErrors.date = "Date is required";
        if (!slotId) newErrors.slotId = "Time slot is required";
        if (!employee) newErrors.employee = "Technician is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        // Find the selected slot to get the timeSlotId if it changed?
        // In create page: `const selectedSlotObj = availableSlots.find(s => s.slotId === slotId); const tSlotId = selectedSlotObj?.timeSlotId || "";`
        // In edit page: passed `timeSlotId` directly.
        // We should probably update `timeSlotId` based on selection if possible, or just pass what we have.

        let finalTimeSlotId = timeSlotId;
        if (availableSlots.length > 0) {
            const selectedSlotObj = availableSlots.find(s => s.slotId === slotId);
            if (selectedSlotObj) {
                finalTimeSlotId = selectedSlotObj.timeSlotId;
            }
        }

        const payload = {
            firstname,
            lastname,
            email,
            phone,
            date: formatDateForInput(date!),
            slotId,
            timeSlotId: finalTimeSlotId,
            notes,
            Employee: employee || undefined,
            status: initialData?.status || "confirmed",
        };

        await onSubmit(payload);
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <IoArrowBack size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
                            Customer Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <FormLabel label="First Name" required />
                                <TextField
                                    value={firstname}
                                    onChange={(e) => {
                                        setFirstname(e.target.value);
                                        if (errors.firstname) setErrors(prev => ({ ...prev, firstname: "" }));
                                    }}
                                    placeholder="Enter first name"
                                    error={errors.firstname}
                                />
                            </div>
                            <div className="flex flex-col">
                                <FormLabel label="Last Name" required />
                                <TextField
                                    value={lastname}
                                    onChange={(e) => {
                                        setLastname(e.target.value);
                                        if (errors.lastname) setErrors(prev => ({ ...prev, lastname: "" }));
                                    }}
                                    placeholder="Enter last name"
                                    error={errors.lastname}
                                />
                            </div>
                            <div className="flex flex-col">
                                <FormLabel label="Email" required />
                                <TextField
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                                    }}
                                    placeholder="Enter email"
                                    error={errors.email}
                                />
                            </div>
                            <div className="flex flex-col">
                                <CommonPhoneInput
                                    label="Phone"
                                    name="phone"
                                    value={phone}
                                    required
                                    error={errors.phone}
                                    touched={true}
                                    onChange={(val: string) => {
                                        setPhone(val);
                                        if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                                    }}
                                    onClearError={() => {
                                        if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                                    }}
                                    onTouch={() => { }}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
                            Appointment Schedule
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="flex flex-col gap-2">
                                <FormLabel label="Date" required />
                                <DatePicker
                                    value={date}
                                    onChange={handleDateChange}
                                    placeholder="Select Date"
                                    className="w-full"
                                    minDate={new Date()}
                                />
                                {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
                            </div>
                        </div>

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
                                        // Logic from edit page to handle current slot availability
                                        const isSelected = slot.slotId === slotId;
                                        const isAvailable = slot.isAvailable || (isEditing && slot.slotId === initialData?.slotId);

                                        return (
                                            <button
                                                key={slot.slotId}
                                                type="button"
                                                disabled={!isAvailable}
                                                onClick={() => {
                                                    setSlotId(slot.slotId);
                                                    if (errors.slotId) setErrors(prev => ({ ...prev, slotId: "" }));
                                                }}
                                                className={`
                          px-2 py-2 text-sm font-medium rounded-lg border transition-all
                          ${slot.slotId === slotId
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
                                        if (errors.employee) setErrors(prev => ({ ...prev, employee: "" }));
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

                    <div className="flex justify-end pt-4 gap-4">
                        <Button
                            variant="secondary"
                            onClick={() => router.back()}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Appointment"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentForm;
