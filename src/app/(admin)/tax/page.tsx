"use client";

import Table from "@/components/ui/table";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import TextField from "@/components/ui/TextField";
import { useState, useEffect } from "react";
import {
    getAllTaxes,
    createTax,
    updateTax,
    deleteTax,
    Tax,
} from "@/services/TaxService";
import { Toast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/EmptyState";
import Tooltip from "@/components/ui/Tooltip";
import { MdModeEdit } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";

type TaxWithId = Tax & { id: string };

const Taxpage: React.FC = () => {
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTax, setCurrentTax] = useState<Tax | null>(null);

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteTaxId, setDeleteTaxId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        percentage: "",
    });

    // ✅ FETCH TAXES
    const fetchTaxes = async () => {
        try {
            setLoading(true);
            const response = await getAllTaxes({ page: 1, limit: 100 });
            setTaxes(response?.data?.items || []);
        } catch (error) {
            console.error("Failed to fetch taxes", error);
            Toast({ message: "Failed to fetch taxes", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxes();
    }, []);

    // ✅ OPEN MODAL
    const handleOpenModal = (tax?: Tax) => {
        if (tax) {
            setCurrentTax(tax);
            setFormData({
                name: tax.name,
                percentage: tax.percentage.toString(),
            });
        } else {
            setCurrentTax(null);
            setFormData({ name: "", percentage: "" });
        }
        setIsModalOpen(true);
    };

    // ✅ CLOSE MODAL
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentTax(null);
        setFormData({ name: "", percentage: "" });
    };

    // ✅ INPUT CHANGE
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // ✅ CREATE / UPDATE TAX
    const handleSave = async () => {
        const { name, percentage } = formData;

        if (!name || !percentage) {
            Toast({ message: "All fields are required", type: "error" });
            return;
        }

        const numValue = Number(percentage);

        if (numValue < 0 || numValue > 100) {
            Toast({ message: "Tax must be between 0 and 100", type: "error" });
            return;
        }

        try {
            setLoading(true);

            if (currentTax) {
                await updateTax(currentTax._id, {
                    name,
                    percentage: numValue,
                });
                Toast({ message: "Tax updated successfully", type: "success" });
            } else {
                await createTax({
                    name,
                    percentage: numValue,
                });
                Toast({ message: "Tax created successfully", type: "success" });
            }

            fetchTaxes();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save tax", error);
            Toast({ message: "Failed to save tax", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    // ✅ DELETE CONFIRM
    const confirmDelete = async () => {
        if (!deleteTaxId) return;

        try {
            setLoading(true);
            await deleteTax(deleteTaxId);
            Toast({ message: "Tax deleted successfully", type: "success" });
            fetchTaxes();
        } catch (error) {
            console.error("Failed to delete tax", error);
            Toast({ message: "Failed to delete tax", type: "error" });
        } finally {
            setLoading(false);
            setShowDeleteDialog(false);
            setDeleteTaxId(null);
        }
    };

    // ✅ TABLE SAFE DATA
    const tableData: TaxWithId[] = taxes.map((t) => ({ ...t, id: t._id }));

    return (
        <div className="min-h-screen">
            <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
                {/* HEADER */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary dark:text-gray-300">
                            Manage Tax ({taxes.length})
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Create and manage taxes
                        </p>
                    </div>
                    {taxes.length < 1 && (
                        <Button onClick={() => handleOpenModal()}>
                            Add New Tax
                        </Button>
                    )}
                </div>
                {loading ? (
                    <Skeleton />
                ) : tableData.length === 0 ? (
                    <EmptyState message="No taxes found." />
                ) : (
                    <Table
                        columns={[
                            {
                                title: "Index",
                                key: "index",
                                render: (_: any, index: number) => index + 1,
                            },
                            {
                                title: "Tax Name",
                                key: "name",
                                render: (record: Tax) => record.name,
                            },
                            {
                                title: "Tax Value (%)",
                                key: "percentage",
                                render: (record: Tax) => `${record.percentage}%`,
                            },
                            {
                                title: "Action",
                                key: "action",
                                align: "right",
                                render: (record: Tax) => (
                                    <div className="flex items-center justify-end space-x-2">
                                        <Tooltip
                                            content="Edit Product">
                                            <MdModeEdit
                                                size={16}
                                                className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                                onClick={() => handleOpenModal(record)}
                                                title="Edit product"
                                            />
                                        </Tooltip>
                                        {/* <Tooltip
                                            content="View Product">
                                            <FiTrash2
                                                size={16}
                                                className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
                                                onClick={() => {
                                                    setDeleteTaxId(record._id);
                                                    setShowDeleteDialog(true);
                                                }}
                                                title="Delete product"
                                            />
                                        </Tooltip> */}
                                    </div>
                                ),
                            },
                        ]}
                        data={tableData}
                    />
                )}
            </div>
            <CommonDialog
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentTax ? "Edit Tax" : "Add Tax"}
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {currentTax ? "Update" : "Create"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 p-2">
                    <TextField
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Tax Name"
                    />
                    <TextField
                        name="percentage"
                        type="number"
                        value={formData.percentage}
                        onChange={handleInputChange}
                        placeholder="Percentage"
                    />
                </div>
            </CommonDialog>

            <CommonDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                title="Confirm Delete"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowDeleteDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </div>
                }
            >
                <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete this tax?
                </p>
            </CommonDialog>
        </div>
    );
};

export default Taxpage;
