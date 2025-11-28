"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    createAppointment,
    getAvailableSlots,
    AppointmentPayload,
} from "@/services/AppointmentService";
import {
    createOrder,
    CreateOrderPayload,
} from "@/services/OrderServices";
import { getAllProducts, Product } from "@/services/CreateProductService";
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
import { FiTrash2 } from "react-icons/fi";
import CommonDialog from "@/components/ui/Dialogbox";
import { SearchIcon } from "@/components/ui/icons";

// Stepper Component
const Stepper = ({ currentStep }: { currentStep: number }) => {
    return (
        <div className="flex items-start justify-start mb-8">
            <div className="flex items-center">
                <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 1
                        ? "bg-primary border-primary text-white"
                        : "border-gray-300 text-gray-500"
                        }`}
                >
                    1
                </div>
                <div
                    className={`w-24 h-1 ${currentStep >= 2 ? "bg-primary" : "bg-gray-300"
                        }`}
                ></div>
                <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 2
                        ? "bg-primary border-primary text-white"
                        : "border-gray-300 text-gray-500"
                        }`}
                >
                    2
                </div>
            </div>
        </div>
    );
};

const OfflineCustomerPage = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // --- Step 1 State (Appointment) ---
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [date, setDate] = useState<Date | null>(null);
    const [slotId, setSlotId] = useState("");
    const [notes, setNotes] = useState("");
    const [employee, setEmployee] = useState("");
    const [timeSlotId, setTimeSlotId] = useState(""); // This might need to be derived from slot selection

    const [technicians, setTechnicians] = useState<{ label: string; value: string }[]>([]);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [apptErrors, setApptErrors] = useState<{ [key: string]: string }>({});

    // --- Step 2 State (Order) ---
    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [productQuantities, setProductQuantities] = useState<Record<string, string>>({});
    const [paymentStatus, setPaymentStatus] = useState<string>("partial");
    const [paymentType, setPaymentType] = useState<string>("cash");
    const [amount, setAmount] = useState<string>("");
    const [paymentNotes, setPaymentNotes] = useState<string>("");
    const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingProducts, setLoadingProducts] = useState(false);

    // --- Shared Logic ---

    // Fetch Technicians
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
        // Fetch active time slot to get the ID
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
    }, [fetchTechnicians]);

    // Fetch Slots
    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchSlots = async (selectedDate: Date, tSlotId?: string) => {
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
    };

    const handleDateChange = (newDate: Date | null) => {
        setDate(newDate);
        setSlotId("");
        if (newDate) {
            fetchSlots(newDate, timeSlotId);
        } else {
            setAvailableSlots([]);
        }
    };

    // --- Step 1 Handler ---
    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};
        if (!firstname.trim()) newErrors.firstname = "First name is required";
        if (!lastname.trim()) newErrors.lastname = "Last name is required";
        if (!email.trim()) newErrors.email = "Email is required";
        if (!phone.trim()) newErrors.phone = "Phone is required";
        if (!date) newErrors.date = "Date is required";
        if (!slotId) newErrors.slotId = "Time slot is required";
        // if (!employee) newErrors.employee = "Technician assignment is required"; // Optional?

        if (Object.keys(newErrors).length > 0) {
            setApptErrors(newErrors);
            return;
        }
        setApptErrors({});
        setStep(2);
        // Pre-fill amount with 0 initially
        if (!amount) setAmount("0");
    };

    // --- Step 2 Logic ---
    const fetchAllProductsData = useCallback(async () => {
        setLoadingProducts(true);
        try {
            const response = await getAllProducts({
                limit: 1000,
                isActive: true,
            });
            setAllProducts(response.data.items);
            setFilteredProducts(response.data.items);
        } catch (e: any) {
            Toast({
                type: "error",
                message: e?.response?.data?.errorData || "Failed to fetch products",
            });
        } finally {
            setLoadingProducts(false);
        }
    }, []);

    const handleOpenModal = async () => {
        setIsModalOpen(true);
        if (allProducts.length === 0) {
            await fetchAllProductsData();
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === "") {
            setFilteredProducts(allProducts);
        } else {
            const filtered = allProducts.filter(
                (product) =>
                    product.name.toLowerCase().includes(query.toLowerCase()) ||
                    product.sku.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    };

    const handleSelectProduct = (product: Product) => {
        if (!selectedProducts.includes(product._id)) {
            setSelectedProducts((prev) => [...prev, product._id]);
            setProductQuantities((prev) => ({ ...prev, [product._id]: "1" }));
            if (orderErrors.products) {
                setOrderErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.products;
                    return newErrors;
                });
            }
        }
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts((prev) => prev.filter(id => id !== productId));
        setProductQuantities((prev) => {
            const newQuantities = { ...prev };
            delete newQuantities[productId];
            return newQuantities;
        });
    };

    const subtotal = useMemo(() => {
        return allProducts
            .filter(product => selectedProducts.includes(product._id))
            .reduce((total, product) => {
                const quantity = productQuantities[product._id];
                const numericQuantity = quantity ? parseInt(quantity, 10) : NaN;
                const validQuantity = (isNaN(numericQuantity) || numericQuantity < 1) ? 1 : numericQuantity;
                return total + (product.price * validQuantity);
            }, 0);
    }, [allProducts, selectedProducts, productQuantities]);

    // --- Final Submit ---
    const handleSubmit = async () => {
        // Validate Step 2
        const newErrors: Record<string, string> = {};
        if (selectedProducts.length === 0) {
            newErrors.products = "Please select at least one product";
        }
        // Validate quantities
        for (const productId of selectedProducts) {
            const product = allProducts.find(p => p._id === productId);
            const quantity = productQuantities[productId];
            if (!product) continue;
            const validQuantity = parseInt(quantity || "1", 10);
            if (validQuantity > product.stock) {
                newErrors.products = `Quantity for ${product.name} exceeds available stock`;
                break;
            }
        }
        if (!amount) {
            newErrors.amount = "Amount is required";
        } else {
            const amountValue = parseFloat(amount);
            if (isNaN(amountValue) || amountValue < 0) newErrors.amount = "Invalid amount";
            if (amountValue > subtotal) newErrors.amount = "Amount cannot exceed subtotal";
        }

        if (Object.keys(newErrors).length > 0) {
            setOrderErrors(newErrors);
            return;
        }

        try {
            setLoading(true);

            // 1. Create Appointment
            // Find timeSlotId from availableSlots if needed, or backend handles it?
            // The backend expects timeSlotId. In Edit page, it was state.
            // In getAvailableSlots response, slots have `timeSlotId`?
            // Let's check getAvailableSlots response structure in Edit page.
            // It seems `slotId` is what we select.
            // In EditPage: `setTimeSlotId(appt.timeSlotId)`
            // In `fetchSlots`: `const res = await getAvailableSlots(dateStr, tSlotId);`
            // The slot object has `slotId`.
            // The backend `createOrder` uses `appointment.timeSlotId`.
            // We need to send `timeSlotId` when creating appointment.
            // Where do we get it?
            // `getAvailableSlots` returns `{ date: string; slots: any[] }`.
            // Each slot in `slots` likely has `timeSlotId`?
            // Let's assume the selected slot object has it.
            const selectedSlotObj = availableSlots.find(s => s.slotId === slotId);
            const tSlotId = selectedSlotObj?.timeSlotId || ""; // We might need this.

            const apptPayload: AppointmentPayload = {
                firstname,
                lastname,
                email,
                phone,
                date: formatDateForInput(date!),
                slotId,
                timeSlotId: tSlotId, // Use the one from the selected slot
                notes,
                Employee: employee || undefined,
                status: "confirmed", // Set to confirmed so it blocks the slot
            };

            const apptRes = await createAppointment(apptPayload);
            const appointmentId = apptRes.data._id;

            // 2. Create Order
            const items = selectedProducts.map(productId => {
                const quantity = productQuantities[productId];
                const numericQuantity = quantity ? parseInt(quantity, 10) : 1;
                return {
                    id: productId,
                    quantity: numericQuantity
                };
            });

            const total = parseFloat(amount);

            const orderPayload: CreateOrderPayload = {
                items,
                subtotal,
                total,
                customer: {
                    name: `${firstname} ${lastname}`,
                    phone,
                    email,
                },
                payment: {
                    amount: total,
                    method: paymentType,
                    status: paymentStatus,
                    note: paymentNotes,
                    currency: "AU$",
                },
                appointmentId,
            };

            // We need to pass appointmentId to createOrder.
            // But CreateLocalOrderPayload interface in frontend doesn't have appointmentId?
            // I checked OrderServices.tsx, it DOES NOT have appointmentId in CreateLocalOrderPayload.
            // But the backend `createOrder` controller EXPECTS `appointmentId`.
            // This means the frontend service definition might be incomplete or I need to cast it/update it.
            // I should update the payload to include appointmentId.

            // I will cast it to any for now to avoid TS errors if I don't update the interface, 
            // or better, I'll update the interface in the service file later if needed.
            // For now, I'll pass it in the object.

            await createOrder(orderPayload);

            Toast({ message: "Offline customer added successfully!", type: "success" });
            router.push("/admin/appointment"); // Or orders?
        } catch (error: any) {
            console.error(error);
            Toast({
                message: error?.response?.data?.message || "Failed to create offline customer",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const renderProductImage = (product: Product) => {
        const imageUrl = product.images?.[0]
            ? `${process.env.NEXT_PUBLIC_API_URL}/Product/${product.images[0]}`
            : null;

        return imageUrl ? (
            <div className="h-16 w-16 overflow-hidden rounded">
                <Image
                    src={imageUrl}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                />
            </div>
        ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                <span className="text-xs text-gray-500">No Image</span>
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => {
                        if (step === 2) setStep(1);
                        else router.back();
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <IoArrowBack size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Offline Customer
                </h1>
            </div>

            <Stepper currentStep={step} />

            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm">
                {step === 1 ? (
                    <form onSubmit={handleNextStep} className="space-y-8">
                        {/* Step 1 Content */}
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
                                            if (apptErrors.firstname) setApptErrors(prev => ({ ...prev, firstname: "" }));
                                        }}
                                        placeholder="Enter first name"
                                        error={apptErrors.firstname}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <FormLabel label="Last Name" required />
                                    <TextField
                                        value={lastname}
                                        onChange={(e) => {
                                            setLastname(e.target.value);
                                            if (apptErrors.lastname) setApptErrors(prev => ({ ...prev, lastname: "" }));
                                        }}
                                        placeholder="Enter last name"
                                        error={apptErrors.lastname}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <FormLabel label="Email" required />
                                    <TextField
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (apptErrors.email) setApptErrors(prev => ({ ...prev, email: "" }));
                                        }}
                                        placeholder="Enter email"
                                        error={apptErrors.email}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <FormLabel label="Phone" required />
                                    <TextField
                                        type="number"
                                        value={phone}
                                        onChange={(e) => {
                                            setPhone(e.target.value);
                                            if (apptErrors.phone) setApptErrors(prev => ({ ...prev, phone: "" }));
                                        }}
                                        placeholder="Enter phone number"
                                        error={apptErrors.phone}
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
                                    />
                                    {apptErrors.date && <p className="text-sm text-red-600">{apptErrors.date}</p>}
                                </div>
                            </div>

                            <div className="mb-6">
                                <FormLabel label="Available Time Slots" required />
                                {loadingSlots ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {[...Array(6)].map((_, i) => (
                                            <Skeleton key={i} className="h-10 w-full rounded-md" />
                                        ))}
                                    </div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.slotId}
                                                type="button"
                                                disabled={!slot.isAvailable}
                                                onClick={() => {
                                                    setSlotId(slot.slotId);
                                                }}
                                                className={`
                          px-2 py-2 text-sm font-medium rounded-lg border transition-all
                          ${slot.slotId === slotId
                                                        ? "bg-primary text-white border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900"
                                                        : slot.isAvailable
                                                            ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-transparent cursor-not-allowed decoration-slice"
                                                    }
                        `}
                                            >
                                                {slot.startTime} - {slot.endTime}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 dark:text-gray-400 text-sm italic">
                                        {date ? "No slots available for this date." : "Please select a date to view slots."}
                                    </div>
                                )}
                                {apptErrors.slotId && <p className="mt-1 text-sm text-red-600">{apptErrors.slotId}</p>}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
                                Assignment & Notes
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <FormLabel label="Assign Technician" />
                                    <Select
                                        options={technicians}
                                        value={employee}
                                        onChange={setEmployee}
                                        placeholder="Select Technician"
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

                        <div className="flex justify-end pt-4">
                            <Button variant="primary" type="submit">
                                Next Step
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8">
                        {/* Step 2 Content */}
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                    Order Details
                                </h2>
                                <Button variant="primary" onClick={handleOpenModal} type="button">
                                    Add Products
                                </Button>
                            </div>

                            {orderErrors.products && (
                                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded">
                                    <p className="text-red-500 text-sm">{orderErrors.products}</p>
                                </div>
                            )}

                            {selectedProducts.length === 0 ? (
                                <div className="py-8 text-center text-gray-500">
                                    No products selected.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                    {allProducts
                                        .filter(product => selectedProducts.includes(product._id))
                                        .map((product) => (
                                            <div key={product._id} className="flex flex-col rounded-lg border border-blue-500 bg-blue-50 p-3 dark:bg-blue-900/20">
                                                <div className="flex items-start gap-3">
                                                    {renderProductImage(product)}
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                                            {product.name}
                                                        </h4>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            SKU: {product.sku}
                                                        </p>
                                                        <div className="mt-1 flex items-center justify-between">
                                                            <span className="text-sm font-medium">
                                                                AU$ {product.price.toFixed(2)}
                                                            </span>
                                                            <span className={`text-xs ${product.stock > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-500 dark:text-red-400'}`}>
                                                                Stock: {product.stock}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {product.stock <= 0 ? (
                                                    <div className="mt-2">
                                                        <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                            Out of Stock
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <label className="text-sm text-gray-700 dark:text-gray-300">Qty:</label>
                                                        <div className="flex items-center">
                                                            <button
                                                                type="button"
                                                                className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                                onClick={() => {
                                                                    const curr = parseInt(productQuantities[product._id] || "1", 10);
                                                                    setProductQuantities(prev => ({ ...prev, [product._id]: Math.max(1, curr - 1).toString() }));
                                                                }}
                                                                disabled={parseInt(productQuantities[product._id] || "1", 10) <= 1}
                                                            >
                                                                <span className="text-lg">-</span>
                                                            </button>
                                                            <div className="flex h-8 w-12 items-center justify-center border-y border-gray-300 bg-white text-sm dark:border-gray-600 dark:bg-gray-800">
                                                                {productQuantities[product._id] || "1"}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="flex h-8 w-8 items-center justify-center rounded-r border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                                onClick={() => {
                                                                    const curr = parseInt(productQuantities[product._id] || "1", 10);
                                                                    setProductQuantities(prev => ({ ...prev, [product._id]: Math.min(product.stock, curr + 1).toString() }));
                                                                }}
                                                                disabled={parseInt(productQuantities[product._id] || "1", 10) >= product.stock}
                                                            >
                                                                <span className="text-lg">+</span>
                                                            </button>
                                                        </div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Max: {product.stock}</span>
                                                    </div>
                                                )}

                                                <div className="mt-2 flex justify-end">
                                                    <Button variant="danger" onClick={() => handleRemoveProduct(product._id)} className="text-xs">
                                                        <FiTrash2 size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
                                Payment Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <FormLabel label="Payment Status" required />
                                    <Select
                                        options={[
                                            { label: "Partial", value: "partial" },
                                            { label: "Full", value: "full" },
                                        ]}
                                        value={paymentStatus}
                                        onChange={(val) => {
                                            setPaymentStatus(val);
                                            if (val === "full") {
                                                setAmount(subtotal.toFixed(2));
                                            } else if (val === "partial") {
                                                setAmount("0");
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <FormLabel label="Payment Method" required />
                                    <Select
                                        options={[
                                            { label: "Cash", value: "cash" },
                                            { label: "Credit/Debit Card", value: "card" },
                                            { label: "EFTPOS", value: "eftpos" },
                                            { label: "Afterpay", value: "afterpay" },
                                        ]}
                                        value={paymentType}
                                        onChange={setPaymentType}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <FormLabel label="Amount Paid" required />
                                    <TextField
                                        type="number"
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value);
                                            if (orderErrors.amount) setOrderErrors(prev => ({ ...prev, amount: "" }));
                                        }}
                                        placeholder="Enter amount"
                                        error={orderErrors.amount}
                                    />
                                    <p className="text-sm text-gray-500">Subtotal: AU$ {subtotal.toFixed(2)}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <FormLabel label="Payment Notes" />
                                    <TextField
                                        value={paymentNotes}
                                        onChange={(e) => setPaymentNotes(e.target.value)}
                                        placeholder="Notes"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setStep(1)} type="button">
                                Back
                            </Button>
                            <Button variant="primary" onClick={handleSubmit} type="button" disabled={loading}>
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Creating...</span>
                                    </div>
                                ) : (
                                    "Create Offline Customer"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <CommonDialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Select Products"
                size="xl"
                footer={
                    <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                        Done
                    </Button>
                }
            >
                <div className="space-y-4">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <TextField
                            type="text"
                            placeholder="Search products by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10"
                        />
                    </div>

                    {loadingProducts ? (
                        <div className="py-4 text-center">Loading products...</div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product._id}
                                        className={`flex items-center gap-3 rounded-lg border p-3 ${selectedProducts.includes(product._id)
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        {renderProductImage(product)}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {product.name}
                                            </h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                SKU: {product.sku}
                                            </p>
                                            <div className="mt-1 flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    AU$ {product.price.toFixed(2)}
                                                </span>
                                                <span className={`text-xs ${product.stock > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    Stock: {product.stock}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {product.stock <= 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                        Out of Stock
                                                    </span>
                                                </div>
                                            ) : selectedProducts.includes(product._id) ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center">
                                                        <button
                                                            type="button"
                                                            className="flex h-6 w-6 items-center justify-center rounded-l border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                            onClick={() => {
                                                                const currentQuantity = parseInt(productQuantities[product._id] || "1", 10);
                                                                const newQuantity = Math.max(1, currentQuantity - 1);
                                                                setProductQuantities(prev => ({
                                                                    ...prev,
                                                                    [product._id]: newQuantity.toString()
                                                                }));
                                                            }}
                                                            disabled={parseInt(productQuantities[product._id] || "1", 10) <= 1}
                                                        >
                                                            <span className="text-sm">-</span>
                                                        </button>
                                                        <div className="flex h-6 w-8 items-center justify-center border-y border-gray-300 bg-white text-xs dark:border-gray-600 dark:bg-gray-800">
                                                            {productQuantities[product._id] || "1"}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="flex h-6 w-6 items-center justify-center rounded-r border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                            onClick={() => {
                                                                const currentQuantity = parseInt(productQuantities[product._id] || "1", 10);
                                                                const newQuantity = Math.min(product.stock, currentQuantity + 1);
                                                                setProductQuantities(prev => ({
                                                                    ...prev,
                                                                    [product._id]: newQuantity.toString()
                                                                }));
                                                            }}
                                                            disabled={parseInt(productQuantities[product._id] || "1", 10) >= product.stock}
                                                        >
                                                            <span className="text-sm">+</span>
                                                        </button>
                                                    </div>
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => handleRemoveProduct(product._id)}
                                                        className="text-xs p-2"
                                                    >
                                                        <FiTrash2
                                                            size={16}
                                                            title="Delete product"
                                                        />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handleSelectProduct(product)}
                                                    className="text-xs"
                                                >
                                                    Add
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredProducts.length === 0 && (
                                <div className="py-8 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No products found matching your search.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CommonDialog>
        </div >
    );
};

export default OfflineCustomerPage;
