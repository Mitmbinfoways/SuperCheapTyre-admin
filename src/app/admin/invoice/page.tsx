"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    GetAllAppointments,
    Appointment,
} from "@/services/AppointmentService";
import {
    createOrder,
    CreateOrderPayload,
} from "@/services/OrderServices";
import { getAllProducts, Product } from "@/services/CreateProductService";
import { getAllServices, Service } from "@/services/ServiceService";
import Button from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import Select from "@/components/ui/Select";
import { IoArrowBack } from "react-icons/io5";
import { FiTrash2 } from "react-icons/fi";
import CommonDialog from "@/components/ui/Dialogbox";
import TextField from "@/components/ui/TextField";
import { FormLabel } from "@/components/ui/FormLabel";
import { SearchIcon } from "@/components/ui/icons";

// --- Helper Components ---

interface QuantityControlProps {
    quantity: number;
    max?: number;
    onIncrease: (e: React.MouseEvent) => void;
    onDecrease: (e: React.MouseEvent) => void;
    size?: "sm" | "md";
}

const QuantityControl = ({
    quantity,
    max,
    onIncrease,
    onDecrease,
    size = "md",
}: QuantityControlProps) => {
    const btnClass = `flex items-center justify-center border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${size === "sm" ? "h-6 w-6" : "h-8 w-8"
        }`;
    const displayClass = `flex items-center justify-center border-y border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 ${size === "sm" ? "h-6 w-8 text-xs" : "h-8 w-12 text-sm"
        }`;
    const iconSize = size === "sm" ? "text-sm" : "text-lg";

    return (
        <div className="flex items-center">
            <button
                type="button"
                className={`${btnClass} rounded-l`}
                onClick={onDecrease}
                disabled={quantity <= 1}
            >
                <span className={iconSize}>-</span>
            </button>
            <div className={displayClass}>{quantity}</div>
            <button
                type="button"
                className={`${btnClass} rounded-r`}
                onClick={onIncrease}
                disabled={max !== undefined && quantity >= max}
            >
                <span className={iconSize}>+</span>
            </button>
        </div>
    );
};

const OfflineCustomerPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Appointment Selection State
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [appointmentOptions, setAppointmentOptions] = useState<{ label: string; value: string }[]>([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    // --- Step 2 State (Order) ---
    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [productQuantities, setProductQuantities] = useState<Record<string, string>>({});
    const [paymentStatus, setPaymentStatus] = useState<string>("partial");
    const [paymentType, setPaymentType] = useState<string>("cash");
    const [amount, setAmount] = useState<string>("0");
    const [paymentNotes, setPaymentNotes] = useState<string>("");
    const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingProducts, setLoadingProducts] = useState(false);

    // --- Services State ---
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [serviceQuantities, setServiceQuantities] = useState<Record<string, string>>({});
    const [loadingServices, setLoadingServices] = useState(false);
    const [activeTab, setActiveTab] = useState<"products" | "services">("products");

    // Fetch Appointments
    const fetchAppointments = useCallback(async () => {
        try {
            // Fetching all appointments for now, might need pagination or search in real app
            const res = await GetAllAppointments({ itemsPerPage: 100 });
            setAppointments(res.data.items);
            const options = res.data.items.map((appt: Appointment) => ({
                label: `${appt.firstname} ${appt.lastname} - ${appt.phone} - ${new Date(appt.date).toLocaleDateString()} (${appt.slotDetails?.startTime} - ${appt.slotDetails?.endTime})`,
                value: appt._id,
            }));
            setAppointmentOptions(options);
        } catch (error) {
            console.error("Failed to load appointments", error);
            Toast({ message: "Failed to load appointments", type: "error" });
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleAppointmentChange = (value: string) => {
        setSelectedAppointmentId(value);
        const appt = appointments.find(a => a._id === value) || null;
        setSelectedAppointment(appt);
        if (appt) {
            // Reset order errors when a valid appointment is selected
            setOrderErrors({});
        }
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

    const fetchAllServicesData = useCallback(async () => {
        setLoadingServices(true);
        try {
            const response = await getAllServices({ isActive: true });
            setAllServices(response.data);
            setFilteredServices(response.data);
        } catch (e: any) {
            Toast({
                type: "error",
                message: e?.response?.data?.message || "Failed to fetch services",
            });
        } finally {
            setLoadingServices(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "services" && allServices.length === 0) {
            fetchAllServicesData();
        }
    }, [activeTab, allServices.length, fetchAllServicesData]);

    const handleOpenModal = async () => {
        setIsModalOpen(true);
        if (allProducts.length === 0) {
            await fetchAllProductsData();
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        const lowerQuery = query.toLowerCase().trim();

        if (activeTab === "products") {
            if (!lowerQuery) {
                setFilteredProducts(allProducts);
            } else {
                const filtered = allProducts.filter(
                    (product) =>
                        product.name.toLowerCase().includes(lowerQuery) ||
                        product.sku.toLowerCase().includes(lowerQuery)
                );
                setFilteredProducts(filtered);
            }
        } else {
            if (!lowerQuery) {
                setFilteredServices(allServices);
            } else {
                const filtered = allServices.filter(
                    (service) =>
                        service.name.toLowerCase().includes(lowerQuery)
                );
                setFilteredServices(filtered);
            }
        }
    };

    const handleTabChange = (tab: "products" | "services") => {
        setActiveTab(tab);
        setSearchQuery(""); // Clear search when switching tabs
        if (tab === "products") {
            setFilteredProducts(allProducts);
        } else {
            setFilteredServices(allServices);
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

    const handleSelectService = (service: Service) => {
        if (!selectedServices.includes(service._id)) {
            setSelectedServices((prev) => [...prev, service._id]);
            setServiceQuantities((prev) => ({ ...prev, [service._id]: "1" }));
        }
    };

    const handleRemoveService = (serviceId: string) => {
        setSelectedServices((prev) => prev.filter(id => id !== serviceId));
        setServiceQuantities((prev) => {
            const newQuantities = { ...prev };
            delete newQuantities[serviceId];
            return newQuantities;
        });
    };

    const updateProductQuantity = (productId: string, delta: number, stock: number) => {
        setProductQuantities(prev => {
            const current = parseInt(prev[productId] || "1", 10);
            const next = Math.min(Math.max(1, current + delta), stock);
            return { ...prev, [productId]: next.toString() };
        });
    };

    const updateServiceQuantity = (serviceId: string, delta: number) => {
        setServiceQuantities(prev => {
            const current = parseInt(prev[serviceId] || "1", 10);
            const next = Math.max(1, current + delta);
            return { ...prev, [serviceId]: next.toString() };
        });
    };

    const subtotal = useMemo(() => {
        const productsTotal = allProducts
            .filter(product => selectedProducts.includes(product._id))
            .reduce((total, product) => {
                const quantity = productQuantities[product._id];
                const numericQuantity = quantity ? parseInt(quantity, 10) : NaN;
                const validQuantity = (isNaN(numericQuantity) || numericQuantity < 1) ? 1 : numericQuantity;
                return total + (product.price * validQuantity);
            }, 0);

        const servicesTotal = allServices
            .filter(service => selectedServices.includes(service._id))
            .reduce((total, service) => {
                const quantity = serviceQuantities[service._id];
                const numericQuantity = quantity ? parseInt(quantity, 10) : NaN;
                const validQuantity = (isNaN(numericQuantity) || numericQuantity < 1) ? 1 : numericQuantity;
                return total + (service.price * validQuantity);
            }, 0);

        return productsTotal + servicesTotal;
    }, [allProducts, selectedProducts, productQuantities, allServices, selectedServices, serviceQuantities]);

    // Auto-update amount when subtotal changes if payment status is full
    useEffect(() => {
        if (paymentStatus === "full") {
            setAmount(subtotal.toFixed(2));
        }
    }, [subtotal, paymentStatus]);

    // --- Final Submit ---
    const handleSubmit = async () => {
        // Validate
        const newErrors: Record<string, string> = {};
        if (!selectedAppointmentId || !selectedAppointment) {
            newErrors.appointment = "Please select an appointment";
        }

        if (selectedProducts.length === 0 && selectedServices.length === 0) {
            newErrors.products = "Please select at least one product or service";
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

            // Create Order
            const items = selectedProducts.map(productId => {
                const quantity = productQuantities[productId];
                const numericQuantity = quantity ? parseInt(quantity, 10) : 1;
                return {
                    id: productId,
                    quantity: numericQuantity
                };
            });

            const serviceItems = selectedServices.map(serviceId => {
                const quantity = serviceQuantities[serviceId];
                const numericQuantity = quantity ? parseInt(quantity, 10) : 1;
                return {
                    id: serviceId,
                    quantity: numericQuantity
                };
            });

            const total = parseFloat(amount);

            const orderPayload: CreateOrderPayload = {
                items,
                serviceItems,
                subtotal,
                total,
                customer: {
                    name: `${selectedAppointment!.firstname} ${selectedAppointment!.lastname}`,
                    phone: selectedAppointment!.phone,
                    email: selectedAppointment!.email,
                },
                payment: {
                    amount: total,
                    method: paymentType,
                    status: paymentStatus,
                    note: paymentNotes,
                    currency: "AU$",
                },
                appointmentId: selectedAppointmentId,
            };

            await createOrder(orderPayload);

            Toast({ message: "Offline order added successfully!", type: "success" });
            router.push("/admin/orders");
        } catch (error: any) {
            console.error(error);
            Toast({
                message: error?.response?.data?.message || "Failed to create offline order",
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

    const renderServiceImage = (service: Service) => {
        const imageUrl = service.images?.[0]
            ? `${process.env.NEXT_PUBLIC_API_URL}${service.images[0]}`
            : null;

        return imageUrl ? (
            <div className="h-16 w-16 overflow-hidden rounded">
                <Image
                    src={imageUrl}
                    alt={service.name}
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
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <IoArrowBack size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Invoice
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm">
                <div className="space-y-8">
                    {/* Appointment Selection */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
                            Select Appointment <span className="text-red-500">*</span>
                        </h2>
                        <div className="max-w-lg">
                            <Select
                                searchable={true}
                                options={appointmentOptions}
                                value={selectedAppointmentId}
                                onChange={handleAppointmentChange}
                                placeholder="Search & Select Appointment"
                            />
                            {orderErrors.appointment && (
                                <p className="mt-1 text-sm text-red-600">{orderErrors.appointment}</p>
                            )}
                        </div>
                        {selectedAppointment && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">Customer Details</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedAppointment.firstname} {selectedAppointment.lastname}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAppointment.email}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAppointment.phone}</p>
                            </div>
                        )}
                    </div>

                    {/* Order Details */}
                    <div>
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                Order Details <span className="text-red-500">*</span>
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

                        {selectedProducts.length === 0 && selectedServices.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">
                                No products or services selected.
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
                                                    <QuantityControl
                                                        quantity={parseInt(productQuantities[product._id] || "1", 10)}
                                                        max={product.stock}
                                                        onIncrease={() => updateProductQuantity(product._id, 1, product.stock)}
                                                        onDecrease={() => updateProductQuantity(product._id, -1, product.stock)}
                                                    />
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
                                {allServices
                                    .filter(service => selectedServices.includes(service._id))
                                    .map((service) => (
                                        <div key={service._id} className="flex flex-col rounded-lg border border-green-500 bg-green-50 p-3 dark:bg-green-900/20">
                                            <div className="flex items-start gap-3">
                                                {renderServiceImage(service)}
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                                        {service.name}
                                                    </h4>
                                                    <div className="mt-1 flex items-center justify-between">
                                                        <span className="text-sm font-medium">
                                                            AU$ {service.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-2">
                                                <label className="text-sm text-gray-700 dark:text-gray-300">Qty:</label>
                                                <QuantityControl
                                                    quantity={parseInt(serviceQuantities[service._id] || "1", 10)}
                                                    onIncrease={() => updateServiceQuantity(service._id, 1)}
                                                    onDecrease={() => updateServiceQuantity(service._id, -1)}
                                                />
                                            </div>

                                            <div className="mt-2 flex justify-end">
                                                <Button variant="danger" onClick={() => handleRemoveService(service._id)} className="text-xs">
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
                        <Button variant="primary" onClick={handleSubmit} type="button">
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Creating...</span>
                                </div>
                            ) : (
                                "Create Offline Order"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
            <CommonDialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Select Items"
                size="xl"
                footer={
                    <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                        Done
                    </Button>
                }
            >
                <div className="space-y-4">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "products"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                            onClick={() => handleTabChange("products")}
                        >
                            Products
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "services"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                            onClick={() => handleTabChange("services")}
                        >
                            Services
                        </button>
                    </div>

                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <TextField
                            type="text"
                            placeholder={activeTab === "products" ? "Search products..." : "Search services..."}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10"
                        />
                    </div>

                    {activeTab === "products" ? (
                        loadingProducts ? (
                            <div className="py-4 text-center">Loading products...</div>
                        ) : (
                            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selectedProducts.includes(product._id)
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            onClick={() => {
                                                if (selectedProducts.includes(product._id)) {
                                                    handleRemoveProduct(product._id);
                                                } else {
                                                    handleSelectProduct(product);
                                                }
                                            }}
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
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <QuantityControl
                                                                quantity={parseInt(productQuantities[product._id] || "1", 10)}
                                                                max={product.stock}
                                                                onIncrease={(e) => {
                                                                    e.stopPropagation();
                                                                    updateProductQuantity(product._id, 1, product.stock);
                                                                }}
                                                                onDecrease={(e) => {
                                                                    e.stopPropagation();
                                                                    updateProductQuantity(product._id, -1, product.stock);
                                                                }}
                                                                size="sm"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveProduct(product._id);
                                                            }}
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectProduct(product);
                                                        }}
                                                        className="text-xs"
                                                    >
                                                        Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ) : (
                        loadingServices ? (
                            <div className="py-4 text-center">Loading services...</div>
                        ) : (
                            <div className="max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {filteredServices.map((service) => (
                                        <div
                                            key={service._id}
                                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selectedServices.includes(service._id)
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            onClick={() => {
                                                if (selectedServices.includes(service._id)) {
                                                    handleRemoveService(service._id);
                                                } else {
                                                    handleSelectService(service);
                                                }
                                            }}
                                        >
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                                                {service.images?.[0] ? (
                                                    <Image
                                                        src={`${process.env.NEXT_PUBLIC_API_URL}${service.images[0]}`}
                                                        alt={service.name}
                                                        width={64}
                                                        height={64}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                                        No Img
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {service.name}
                                                </h4>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        AU$ {service.price.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {selectedServices.includes(service._id) ? (
                                                    <div className="flex items-center gap-2">
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <QuantityControl
                                                                quantity={parseInt(serviceQuantities[service._id] || "1", 10)}
                                                                onIncrease={(e) => {
                                                                    e.stopPropagation();
                                                                    updateServiceQuantity(service._id, 1);
                                                                }}
                                                                onDecrease={(e) => {
                                                                    e.stopPropagation();
                                                                    updateServiceQuantity(service._id, -1);
                                                                }}
                                                                size="sm"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveService(service._id);
                                                            }}
                                                            className="text-xs p-2"
                                                        >
                                                            <FiTrash2
                                                                size={16}
                                                                title="Delete service"
                                                            />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectService(service);
                                                        }}
                                                        className="text-xs"
                                                    >
                                                        Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </CommonDialog>
        </div >
    );
};

export default OfflineCustomerPage;
