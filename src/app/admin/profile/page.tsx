"use client";

import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import CommonDialog from "@/components/ui/Dialogbox";
import CommonPhoneInput from "@/components/ui/CommonPhoneInput";
import { GetAdminById, UpdateProfile, Admin } from "@/services/AdminService";
import { getAdminProfile, formatPhoneNumber } from "@/lib/utils";
import { RootState } from "@/Store/Store";
import { updateAdmin } from "@/Store/Slice/authSlice";
import { GetContactInfo, CreateContactInfo, UpdateContactInfo } from "@/services/ContactInfoService";
import { FaTrash, FaPlus } from "react-icons/fa";

const Page = () => {
  const dispatch = useDispatch();
  const { admin } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [profile, setProfile] = useState<Admin | null>(null);

  // Contact Info State
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    phone: "",
    email: "",
    address: "",
    openingHours: [{ day: "", time: "" }],
    openingHoursNote: "",
    mapLocation: "",
  });
  const [contactFormErrors, setContactFormErrors] = useState({
    phone: "",
    email: "",
    address: "",
    mapLocation: "",
  });

  const showToast = (message: string, type: "success" | "error" = "success") =>
    Toast({ message, type });

  const fetchProfile = useCallback(async () => {
    if (!admin?._id) return;
    setIsLoading(true);
    try {
      const response = await GetAdminById(admin._id);
      if (response.statusCode === 200) {
        const data = response.data;
        setProfile(data);
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          avatar: data.avatar || "",
        });
        dispatch(updateAdmin(data));
      } else showToast("Failed to fetch profile", "error");
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch profile", "error");
    } finally {
      setIsLoading(false);
    }
  }, [admin?._id, dispatch]);

  useEffect(() => {
    if (admin?._id) fetchProfile();
  }, [fetchProfile, admin?._id]);

  const fetchContactInfoData = useCallback(async () => {
    setContactLoading(true);
    try {
      const response = await GetContactInfo();
      if (response.statusCode === 200 && response.data) {
        setContactInfo(response.data);
        setContactFormData({
          phone: response.data.phone,
          email: response.data.email,
          address: response.data.address,
          openingHours: response.data.openingHours?.length ? response.data.openingHours : [{ day: "", time: "" }],
          openingHoursNote: response.data.openingHoursNote || "",
          mapLocation: response.data.mapLocation || "",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setContactLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContactInfoData();
  }, [fetchContactInfoData]);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactFormData({ ...contactFormData, [name]: value });
    setContactFormErrors({ ...contactFormErrors, [name]: "" });
  };

  const handleOpeningHoursChange = (index: number, field: string, value: string) => {
    const newOpeningHours = [...contactFormData.openingHours];
    newOpeningHours[index] = { ...newOpeningHours[index], [field]: value };
    setContactFormData({ ...contactFormData, openingHours: newOpeningHours });
  };

  const addOpeningHour = () => {
    if (contactFormData.openingHours.length >= 5) return;
    setContactFormData({
      ...contactFormData,
      openingHours: [...contactFormData.openingHours, { day: "", time: "" }],
    });
  };

  const removeOpeningHour = (index: number) => {
    const newOpeningHours = contactFormData.openingHours.filter((_, i) => i !== index);
    setContactFormData({ ...contactFormData, openingHours: newOpeningHours });
  };



  const handleSaveContactInfo = async () => {
    const errors: any = {};
    if (!contactFormData.phone) errors.phone = "Phone is required";
    if (!contactFormData.email) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactFormData.email)) {
        errors.email = "Please enter a valid email address";
      }
    }
    if (!contactFormData.address) errors.address = "Address is required";
    if (!contactFormData.mapLocation) errors.mapLocation = "Map Location URL is required";

    setContactFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setContactLoading(true);
    try {
      let response;
      if (contactInfo?._id) {
        response = await UpdateContactInfo(contactInfo._id, contactFormData);
      } else {
        response = await CreateContactInfo(contactFormData);
      }

      if (response.statusCode === 200 || response.statusCode === 201) {
        setContactInfo(response.data);
        setIsEditingContactInfo(false);
        showToast("Contact Info saved successfully", "success");
      } else {
        showToast("Failed to save Contact Info", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to save Contact Info", "error");
    } finally {
      setContactLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: "" });

    // Email validation
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setFormErrors({ ...formErrors, [name]: "Please enter a valid email address" });
      }
    }

    // Phone validation - allow + sign and digits only
    if (name === "phone") {
      // Allow + sign only at the beginning and digits only
      const phoneRegex = /^\+?[0-9]*$/;
      if (!phoneRegex.test(value)) {
        // Remove any invalid characters
        let cleanValue = value.replace(/[^0-9+]/g, '');

        // Ensure + is only at the beginning
        if (cleanValue.includes('+')) {
          const plusCount = (cleanValue.match(/\+/g) || []).length;
          if (plusCount > 1 || cleanValue[0] !== '+') {
            // Keep only the first + at the beginning
            cleanValue = cleanValue.replace(/\+/g, '');
            cleanValue = '+' + cleanValue;
          }
        }

        // Limit to 16 characters (15 digits + 1 plus sign)
        if (cleanValue.length > 16) {
          cleanValue = cleanValue.substring(0, 16);
        }

        setFormData({ ...formData, [name]: cleanValue });

        // Show error only if value is not empty and doesn't match pattern
        if (value && !/^\+?[0-9]*$/.test(cleanValue)) {
          setFormErrors({ ...formErrors, [name]: "Phone number must contain only digits, optionally start with +" });
        }
      } else if (value.length > 16) {
        // Handle case where user pastes a long valid number
        const trimmedValue = value.substring(0, 16);
        setFormData({ ...formData, [name]: trimmedValue });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    if (!admin?._id) return;

    const errors: any = {};
    if (!formData.name) errors.name = "Name is required";

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
    }

    // Phone validation
    if (!formData.phone) {
      errors.phone = "Phone is required";
    } else {
      // Allow + sign and digits only, with max length of 16 (15 digits + 1 plus sign)
      const phoneRegex = /^\+?[0-9]{1,15}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = "Phone number must contain only digits, optionally start with +, and be maximum 15 digits";
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length) return;

    setIsLoading(true);
    try {
      const response = await UpdateProfile(
        {
          id: admin._id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        selectedFile || undefined,
      );

      if (response.statusCode === 200) {
        const updated = response.data;
        setProfile(updated);
        dispatch(updateAdmin(updated));
        showToast("Profile updated successfully", "success");

        setIsEditing(false);
        setSelectedFile(null);
        setPreview(null);
      } else showToast("Failed to update profile", "error");
    } catch (error) {
      console.error(error);
      showToast("Failed to update profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordErrors({ ...passwordErrors, [e.target.name]: "" });
  };

  const handlePasswordSubmit = async () => {
    const errors: any = {};
    if (!passwordData.oldPassword)
      errors.oldPassword = "Old password is required";
    if (!passwordData.newPassword)
      errors.newPassword = "New password is required";
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setIsLoading(true);
    try {
      const response = await UpdateProfile({
        id: admin?._id,
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.statusCode === 200) {
        showToast("Password changed successfully", "success");
        setPasswordData({ oldPassword: "", newPassword: "" });
        setIsChangingPassword(false);
      } else {
        setPasswordErrors({
          oldPassword: "Failed to change password",
          newPassword: "",
        });
      }
    } catch (error: any) {
      console.error(error);
      setPasswordErrors({
        oldPassword:
          error.response?.data?.message || "Failed to change password",
        newPassword: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [showImagePreview, setShowImagePreview] = useState(false);

  return (
    <div className="flex flex-col gap-8 px-4 py-8 lg:flex-row lg:items-start lg:justify-center">
      {isLoading ? (
        <div className="flex rounded-2xl h-96 w-full items-center justify-center bg-white dark:bg-gray-800">
          <div className="text-lg text-gray-800 dark:text-gray-100">
            Loading...
          </div>
        </div>
      ) : (
        <>
          <div className="w-full max-w-lg">
            {isEditing ? (
              <div className="rounded-xl p-6 shadow bg-white dark:bg-gray-800">
                <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Update Profile
                </h2>
                <div className="space-y-4">
                  <div>
                    <FormLabel label="Name" required />
                    <TextField
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <FormLabel label="Email" required />
                    <TextField
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={formErrors.email}
                    />
                  </div>

                  <div>
                    <CommonPhoneInput
                      label="Phone"
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={(value) => {
                        setFormData({ ...formData, phone: value });
                        setFormErrors({ ...formErrors, phone: "" });
                      }}
                      onClearError={() => setFormErrors({ ...formErrors, phone: "" })}
                      onTouch={() => { }}
                      error={formErrors.phone}
                      touched={!!formErrors.phone}
                    />
                  </div>

                  <div>
                    <FormLabel label="Avatar" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-700"
                    />
                    {(preview || formData.avatar) && (
                      <div className="mt-3 cursor-pointer" onClick={() => setShowImagePreview(true)}>
                        <Image
                          src={preview || getAdminProfile(formData.avatar)}
                          alt="avatar"
                          width={96}
                          height={96}
                          className="h-24 w-24 rounded-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      color="primary"
                      onClick={handleUpdate}
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      color="gray"
                      onClick={() => setIsEditing(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : isChangingPassword ? (
              <div className="rounded-xl p-6 shadow bg-white dark:bg-gray-800">
                <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Change Password
                </h2>
                <div className="space-y-4">
                  <div>
                    <FormLabel label="Old Password" required />
                    <TextField
                      type="password"
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                    />
                    {passwordErrors.oldPassword && (
                      <p className="text-sm text-red-600">
                        {passwordErrors.oldPassword}
                      </p>
                    )}
                  </div>
                  <div>
                    <FormLabel label="New Password" required />
                    <TextField
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-red-600">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      color="primary"
                      onClick={handlePasswordSubmit}
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? "Changing..." : "Change Password"}
                    </Button>
                    <Button
                      color="gray"
                      onClick={() => setIsChangingPassword(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              profile && (
                <div className="flex flex-col gap-6 rounded-xl p-6 shadow bg-white dark:bg-gray-800">
                  {profile.avatar && (
                    <div className="cursor-pointer" onClick={() => setShowImagePreview(true)}>
                      <Image
                        src={getAdminProfile(profile.avatar)}
                        alt="avatar"
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div className="w-full space-y-3">
                    <h1 className="break-words text-3xl font-bold text-gray-800 dark:text-gray-100">
                      {profile.name}
                    </h1>
                    <div className="mt-4 space-y-1 break-words text-base text-gray-700 dark:text-gray-300">
                      <p>
                        <span className="font-semibold">Email:</span>{" "}
                        {profile.email}
                      </p>
                      <p>
                        <span className="font-semibold">Phone:</span>{" "}
                        {formatPhoneNumber(profile.phone)}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
                      <Button color="primary" onClick={() => setIsEditing(true)}>
                        Update Profile
                      </Button>
                      <Button
                        color="primary"
                        onClick={() => setIsChangingPassword(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Contact Info Section */}
          <div className="w-full max-w-lg">
            {contactLoading ? (
              <div className="flex rounded-2xl h-96 w-full items-center justify-center bg-white dark:bg-gray-800 shadow">
                <div className="text-lg text-gray-800 dark:text-gray-100">
                  Loading Contact Info...
                </div>
              </div>
            ) : isEditingContactInfo ? (
              <div className="rounded-xl p-6 shadow bg-white dark:bg-gray-800">
                <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Edit Contact Info
                </h2>
                <div className="space-y-4">
                  <div>
                    <CommonPhoneInput
                      label="Phone"
                      required
                      name="phone"
                      value={contactFormData.phone}
                      onChange={(value) => {
                        setContactFormData({ ...contactFormData, phone: value });
                        setContactFormErrors({ ...contactFormErrors, phone: "" });
                      }}
                      onClearError={() => setContactFormErrors({ ...contactFormErrors, phone: "" })}
                      onTouch={() => { }}
                      error={contactFormErrors.phone}
                      touched={!!contactFormErrors.phone}
                    />
                  </div>
                  <div>
                    <FormLabel label="Email" required />
                    <TextField
                      type="email"
                      name="email"
                      value={contactFormData.email}
                      onChange={handleContactChange}
                      error={contactFormErrors.email}
                    />
                  </div>
                  <div>
                    <FormLabel label="Address" required />
                    <textarea
                      name="address"
                      value={contactFormData.address}
                      onChange={handleContactChange}
                      className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                    {contactFormErrors.address && (
                      <p className="text-sm text-red-600">{contactFormErrors.address}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <FormLabel label="Opening Hours" />
                      {contactFormData.openingHours.length < 5 && (
                        <Button color="gray" onClick={addOpeningHour} className="mt-2 flex items-center gap-2">
                          <FaPlus size={16} /> Add Day
                        </Button>
                      )}
                    </div>
                    {contactFormData.openingHours.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2 items-center">
                        <TextField
                          placeholder="Day (e.g. Mon-Fri)"
                          value={item.day}
                          onChange={(e) => handleOpeningHoursChange(index, "day", e.target.value)}
                          className="flex-1"
                        />
                        <TextField
                          placeholder="Time (e.g. 9am-5pm)"
                          value={item.time}
                          onChange={(e) => handleOpeningHoursChange(index, "time", e.target.value)}
                          className="flex-1"
                        />
                        <button
                          onClick={() => removeOpeningHour(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* <div>
                    <FormLabel label="Opening Hours Note" />
                    <TextField
                      type="text"
                      name="openingHoursNote"
                      value={contactFormData.openingHoursNote}
                      onChange={handleContactChange}
                    />
                  </div> */}

                  <div>
                    <FormLabel label="Map Location (URL)" />
                    <TextField
                      type="text"
                      name="mapLocation"
                      value={contactFormData.mapLocation}
                      onChange={handleContactChange}
                      error={contactFormErrors.mapLocation}
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button color="primary" onClick={handleSaveContactInfo} className="w-full sm:w-auto">
                      Save Contact Info
                    </Button>
                    <Button color="gray" onClick={() => setIsEditingContactInfo(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-6 shadow bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Site Contact Info
                  </h2>
                  <Button color="primary" onClick={() => setIsEditingContactInfo(true)}>
                    Edit
                  </Button>
                </div>

                {contactInfo ? (
                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p><span className="font-semibold">Phone:</span> {formatPhoneNumber(contactInfo.phone)}</p>
                    <p><span className="font-semibold">Email:</span> {contactInfo.email}</p>
                    <p><span className="font-semibold">Address:</span> {contactInfo.address}</p>

                    <div>
                      <p className="font-semibold mb-1">Opening Hours:</p>
                      <ul className="list-disc pl-5">
                        {contactInfo.openingHours?.map((item: any, idx: number) => (
                          <li key={idx}>{item.day}: {item.time}</li>
                        ))}
                      </ul>
                      {contactInfo.openingHoursNote && (
                        <p className="text-sm text-gray-500 mt-1 italic">{contactInfo.openingHoursNote}</p>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold">Map Location:</p>
                      {contactInfo.mapLocation ? (
                        <p className="truncate">
                          <a href={contactInfo.mapLocation} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {contactInfo.mapLocation}
                          </a>
                        </p>
                      ) : (
                        <p>Not set</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No contact info available. Click Edit to add.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
      <CommonDialog
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        size="lg"
        title="Profile Picture"
      >
        <div className="flex justify-center">
          <Image
            src={preview || (profile?.avatar ? getAdminProfile(profile.avatar) : '')}
            alt="avatar preview"
            width={500}
            height={500}
            className="rounded-lg object-contain max-h-[80vh]"
          />
        </div>
      </CommonDialog>
    </div>
  );
};

export default Page;
