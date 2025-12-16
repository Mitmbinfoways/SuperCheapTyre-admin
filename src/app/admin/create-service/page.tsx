"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { FiPackage } from "react-icons/fi";
import TextField from "@/components/ui/TextField";
import ImageUploader from "@/components/ui/ImageUpload";
import { Toast } from "@/components/ui/Toast";
import TextEditor from "@/components/ui/TextEditor";
import {
    createService,
    getServiceById,
    updateService,
} from "@/services/ServiceService";
import { useRouter, useSearchParams } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/Toggle";
import { v4 as uuidv4 } from "uuid";
import { useScrollToError } from "@/hooks/useScrollToError";

const CreateServicePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [formData, setFormData] = useState<any>({
        name: "",
        price: "",
        images: [],
        description: "",
        isActive: true,
        cart_Recommended: false,
    });
    const [errors, setErrors] = useState<any>({});
    useScrollToError(errors);
    const [apiError, setApiError] = useState<string>("");

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.name?.trim()) {
            newErrors.name = "Service name is required";
        }

        if (!formData.price) {
            newErrors.price = "Price is required";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const loadService = async () => {
            if (!editId) return;
            setIsEdit(true);
            try {
                const res = await getServiceById(editId);
                const service = res?.data || res;
                if (!service) throw new Error("Service not found");

                setFormData((prev: any) => ({
                    ...prev,
                    name: service.name || "",
                    price: service.price ?? "",
                    description: service.description || "",
                    isActive: service.isActive ?? true,
                    cart_Recommended: service.cart_Recommended ?? false,
                    images: (service.images || []).map((img: string) => {
                        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
                        // Handle if img is already a full URL or relative path
                        const url = img.startsWith("http") ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
                        return {
                            id: uuidv4(),
                            url: url,
                        };
                    }),
                }));
            } catch (error: any) {
                console.log(error);
                Toast({
                    message: "Failed to load service details",
                    type: "error",
                });
            }
        };
        loadService();
    }, [editId]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setErrors((prev: any) => ({ ...prev, [name]: undefined }));
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    // Handle description change specifically for TextEditor
    const handleDescriptionChange = (value: string) => {
        setFormData((prev: any) => ({ ...prev, description: value }));
        setErrors((prev: any) => ({ ...prev, description: undefined }));
    };

    // Sync image file selection from ImageUploader
    const handleFilesSelected = (files: File[]) => {
        if (!files || files.length === 0) return;
        setImageFiles((prev) => [...prev, ...files]);
    };

    // Remove image from previews and recompute file list based on images array
    const handleRemoveImage = (index: number) => {
        setFormData((prev: any) => {
            const newImages = prev.images.filter((_: any, i: number) => i !== index);
            const newFiles = newImages
                .filter((it: any) => it?.file)
                .map((it: any) => it.file as File);
            setImageFiles(newFiles);
            return { ...prev, images: newImages };
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!validateForm()) return;

        try {
            setIsSubmitting(true);

            // Derive keep list from current preview items that are existing (no file prop)
            const keepList: string[] = (formData.images || [])
                .filter((it: any) => !it?.file && typeof it?.url === "string")
                .map((it: any) => {
                    try {
                        const url: string = it.url;
                        // We need to extract the relative path stored in DB
                        // Assuming DB stores like "/Services/image.jpg"
                        // And URL is "http://localhost:5000/Services/image.jpg"
                        const parts = url.split("/Services/");
                        return parts.length > 1 ? `/Services/${parts[1]}` : url;
                    } catch {
                        return it.url;
                    }
                });

            const payload = {
                name: formData.name,
                description: formData.description || "",
                images: imageFiles,
                price: Number(formData.price || 0),
                isActive: formData.isActive,
                cart_Recommended: formData.cart_Recommended,
                keepImages: isEdit ? keepList : undefined,
            } as any;

            const res =
                isEdit && editId
                    ? await updateService(editId, payload)
                    : await createService(payload);

            if (
                (isEdit && res?.statusCode === 200) ||
                (!isEdit && res?.statusCode === 201)
            ) {
                Toast({
                    message:
                        res.message || (isEdit ? "Service updated" : "Service created"),
                    type: "success",
                });
                router.push("/admin/services");
            } else {
                Toast({
                    message: res?.message || "Failed to save service",
                    type: "error",
                });
            }
        } catch (error: any) {
            setApiError(
                error?.response?.data?.errorData ||
                "Something went wrong Please try again",
            );
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div>
                <div className="mb-8">
                    <div className="mb-2 gap-3">
                        <h1 className="text-3xl font-bold text-primary dark:text-gray-300">
                            {isEdit ? "Edit Service" : "Create New Service"}
                        </h1>
                    </div>
                    <p className="text-gray-400">
                        {isEdit ? "Update service details" : "Add a new service to your offerings"}
                    </p>
                </div>

                {apiError && (
                    <div className="mb-4 rounded border border-red-400 bg-red-50 p-4 text-red-700">
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex flex-col gap-6 rounded-xl border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:flex-row">
                        <div className="flex-1">
                            <ImageUploader
                                images={formData.images}
                                onChange={(images) =>
                                    setFormData((prev: any) => ({ ...prev, images }))
                                }
                                maxFiles={5}
                                ImageTitle="Service Image"
                                onFilesSelected={handleFilesSelected}
                                onRemove={handleRemoveImage}
                                ImageRatio="Recommended: Use 4:5 aspect ratio"
                            />
                        </div>

                        {/* Right Side - Basic Information Form */}
                        <div className="flex-1">
                            <div className="p-6">
                                <div className="mb-6 flex items-center gap-2">
                                    <FiPackage className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                                        Service Information
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <FormLabel label="Service Name" required />
                                        <TextField
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter service name"
                                            error={errors.name}
                                        />
                                    </div>

                                    <div>
                                        <FormLabel label="Price" required />
                                        <div className="relative">
                                            <TextField
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleChange}
                                                placeholder="0"
                                                error={errors.price}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <FormLabel label="Description" />
                                        <div className="mt-1">
                                            <TextEditor
                                                value={formData.description}
                                                onChange={handleDescriptionChange}
                                                className="max-h-80 overflow-y-auto"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <FormLabel label="Active Status" />
                                        <ToggleSwitch
                                            checked={formData.isActive}
                                            onChange={() => {
                                                setFormData((prev: any) => ({
                                                    ...prev,
                                                    isActive: !prev.isActive,
                                                }));
                                            }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="cart_Recommended"
                                            checked={formData.cart_Recommended}
                                            onChange={(e) => {
                                                setFormData((prev: any) => ({
                                                    ...prev,
                                                    cart_Recommended: e.target.checked,
                                                }));
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="cart_Recommended" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Recommended in Cart
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => router.push("/admin/services")}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" disabled={isSubmitting}>
                            {isEdit
                                ? isSubmitting
                                    ? "Updating..."
                                    : "Update Service"
                                : isSubmitting
                                    ? "Creating..."
                                    : "Create New Service"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateServicePage;
