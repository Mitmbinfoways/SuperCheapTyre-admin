"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import CommonDialog from "@/components/ui/Dialogbox";
import Button from "@/components/ui/Button";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import Accordion from "@/components/ui/Accordion";
import Table from "@/components/ui/table";
import {
  getAllTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  TimeSlot,
} from "@/services/TimeSlotService";
import { MdModeEdit } from "react-icons/md";
import EmptyState from "@/components/EmptyState";
import ToggleSwitch from "@/components/ui/Toggle";

interface CreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const CreateTimeSlotDialog: React.FC<CreateDialogProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startTime || !endTime || !duration) {
      setError("Start time, end time, and duration are required");
      return;
    }

    try {
      setLoading(true);
      await createTimeSlot({
        startTime,
        endTime,
        duration,
        isActive,
        breakTime:
          breakStart && breakEnd ? { start: breakStart, end: breakEnd } : null,
      });
      Toast({ type: "success", message: "Time slot created successfully!" });
      onClose();
      onCreated?.();
    } catch (err: any) {
      setError(err?.message || "Failed to create time slot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonDialog isOpen={isOpen} onClose={onClose} title="Create Time Slot">
      {error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormLabel label="Start Time" required />
            <TextField
              type="time"
              value={startTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setStartTime(e.target.value)
              }
            />
          </div>
          <div>
            <FormLabel label="End Time" required />
            <TextField
              type="time"
              value={endTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEndTime(e.target.value)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormLabel label="Break Start" />
            <TextField
              type="time"
              value={breakStart}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setBreakStart(e.target.value)
              }
            />
          </div>
          <div>
            <FormLabel label="Break End" />
            <TextField
              type="time"
              value={breakEnd}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setBreakEnd(e.target.value)
              }
            />
          </div>
        </div>

        <div>
          <FormLabel label="Duration (minutes)" required />
          <TextField
            type="number"
            min={15}
            max={480}
            value={duration.toString()}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setDuration(Number(e.target.value))
            }
            placeholder="e.g. 30"
          />
        </div>

        <div className="flex items-center space-x-3">
          <FormLabel label="Active" />
          <ToggleSwitch
            checked={isActive}
            onChange={() => setIsActive(!isActive)}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Saving..." : "Create Time Slot"}
          </Button>
        </div>
      </form>
    </CommonDialog>
  );
};

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimeSlot | null;
  onUpdated?: () => void;
}

const EditTimeSlotDialog: React.FC<EditDialogProps> = ({
  isOpen,
  onClose,
  slot,
  onUpdated,
}) => {
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    breakStart: "",
    breakEnd: "",
    duration: 30,
  });
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slot) {
      setFormData({
        startTime: slot.startTime || "",
        endTime: slot.endTime || "",
        duration: slot.duration ?? 30,
        breakStart: slot.breakTime?.start || "",
        breakEnd: slot.breakTime?.end || "",
      });
      setIsActive(!!slot.isActive);
    } else {
      setFormData({
        startTime: "",
        endTime: "",
        breakStart: "",
        breakEnd: "",
        duration: 30,
      });
      setIsActive(true);
    }
  }, [slot, isOpen]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return;
    setError(null);

    const { startTime, endTime, duration, breakStart, breakEnd } = formData;

    if (!startTime || !endTime || !duration) {
      setError("Start time, end time, and duration are required");
      return;
    }

    try {
      setLoading(true);
      await updateTimeSlot(slot._id, {
        startTime,
        endTime,
        duration,
        isActive,
        breakTime:
          breakStart && breakEnd ? { start: breakStart, end: breakEnd } : null,
      });
      Toast({ type: "success", message: "Time slot updated successfully!" });
      onClose();
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || "Failed to update time slot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonDialog isOpen={isOpen} onClose={onClose} title="Edit Time Slot">
      {error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormLabel label="Start Time" required />
            <TextField
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
            />
          </div>
          <div>
            <FormLabel label="End Time" required />
            <TextField
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormLabel label="Break Start" />
            <TextField
              type="time"
              name="breakStart"
              value={formData.breakStart}
              onChange={handleChange}
            />
          </div>
          <div>
            <FormLabel label="Break End" />
            <TextField
              type="time"
              name="breakEnd"
              value={formData.breakEnd}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <FormLabel label="Duration (minutes)" required />
          <TextField
            type="number"
            name="duration"
            min={15}
            max={480}
            value={formData.duration.toString()}
            onChange={handleChange}
            placeholder="e.g. 30"
          />
        </div>

        {/* Enable this if you want toggle active state */}
        {/* <div className="flex items-center space-x-3">
          <FormLabel label="Active" />
          <ToggleSwitch
            checked={isActive}
            onChange={() => setIsActive(!isActive)}
          />
        </div> */}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Saving..." : "Update Time Slot"}
          </Button>
        </div>
      </form>
    </CommonDialog>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  title = "Confirm",
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  loading = false,
}) => {
  return (
    <CommonDialog isOpen={isOpen} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() => onConfirm()}
          disabled={loading}
        >
          {loading ? "Deleting..." : confirmText}
        </Button>
      </div>
    </CommonDialog>
  );
};

const AddTimeSlotPage: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [editSlot, setEditSlot] = useState<TimeSlot | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteSlot, setDeleteSlot] = useState<TimeSlot | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const res = await getAllTimeSlots();
      setTimeSlots(res.data || []);
    } catch (err: any) {
      Toast({
        type: "error",
        message: err?.message || "Failed to fetch time slots",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary dark:text-gray-300">
              Time Slot Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage appointment time slots
            </p>
          </div>
          {timeSlots.length === 0 && (
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Time Slot
            </Button>
          )}
        </div>

        <div>
          {loading ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Loading time slots...
            </div>
          ) : timeSlots.length === 0 ? (
            <EmptyState message="No time slots created yet. Click 'Create New Time Slot' to get started." />
          ) : (
            <Accordion
              items={timeSlots.map((slot) => ({
                id: slot._id,
                title: (
                  <div className="inline-flex w-full items-center justify-between">
                    <span>
                      {slot.startTime} - {slot.endTime} ({slot.duration} min)
                    </span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditSlot(slot);
                        setShowEditDialog(true);
                      }}
                      className="cursor-pointer rounded p-1 px-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Edit time slot"
                    >
                      <MdModeEdit size={18} />
                    </div>
                  </div>
                ),
                content: (
                  <div className="space-y-2">
                    {slot.breakTime && (
                      <div className="text-sm text-primary dark:text-gray-400">
                        Break: {slot.breakTime.start} - {slot.breakTime.end}
                      </div>
                    )}
                    <Table
                      columns={[
                        {
                          title: "Index",
                          key: "index",
                          render: (_, index) =>
                            slot.generatedSlots?.[index]?.isBreak
                              ? "Break"
                              : `Slot ${index + 1}`,
                        },
                        {
                          title: "Start",
                          key: "startTime",
                          render: (_, index) =>
                            slot.generatedSlots?.[index]?.startTime || "-",
                        },
                        {
                          title: "End",
                          key: "endTime",
                          render: (_, index) =>
                            slot.generatedSlots?.[index]?.endTime || "-",
                        },
                      ]}
                      data={slot.generatedSlots ?? []}
                      className="dark:divide-gray-700"
                    />
                  </div>
                ),
              }))}
            />
          )}
        </div>
      </div>

      <CreateTimeSlotDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={fetchTimeSlots}
      />

      <EditTimeSlotDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditSlot(null);
        }}
        slot={editSlot}
        onUpdated={fetchTimeSlots}
      />

      <ConfirmDialog
        isOpen={!!deleteSlot}
        onClose={() => setDeleteSlot(null)}
        title="Delete Time Slot"
        message={`Are you sure you want to delete the time slot ${deleteSlot?.startTime} - ${deleteSlot?.endTime}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={async () => {
          if (!deleteSlot) return;
          try {
            setDeleting(true);
            await deleteTimeSlot(deleteSlot._id);
            Toast({
              type: "success",
              message: "Time slot deleted successfully!",
            });
            setDeleteSlot(null);
            fetchTimeSlots();
          } catch (err: any) {
            Toast({
              type: "error",
              message: err?.message || "Failed to delete time slot",
            });
          } finally {
            setDeleting(false);
          }
        }}
        loading={deleting}
      />
    </div>
  );
};

export default AddTimeSlotPage;
