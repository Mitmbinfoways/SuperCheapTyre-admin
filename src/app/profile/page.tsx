"use client";

import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import CommonDialog from "@/components/ui/Dialogbox";
import { GetAdminById, UpdateProfile, Admin } from "@/services/AdminService";
import { getAdminProfile } from "@/lib/utils";
import { RootState } from "@/Store/Store";
import { updateAdmin } from "@/Store/Slice/authSlice";

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
    <div className="flex px-4 py-8">
      {isLoading ? (
        <div className="flex rounded-2xl h-96 w-full items-center justify-center bg-white dark:bg-gray-800">
          <div className="text-lg text-gray-800 dark:text-gray-100">
            Loading...
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg">
          {isEditing ? (
            <div className="rounded-xl p-6 shadow">
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
                  <FormLabel label="Phone" required />
                  <TextField
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={formErrors.phone}
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : isChangingPassword ? (
            <div className="rounded-xl p-6 shadow">
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => setIsChangingPassword(false)}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            profile && (
              <div className="flex flex-col gap-6 rounded-xl p-6">
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
                      {profile.phone}
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
      )}
      <CommonDialog
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        size="md"
        title="Profile Picture"
      >
        <div className="flex justify-center">
          <Image
            src={preview || (profile?.avatar ? getAdminProfile(profile.avatar) : '')}
            alt="avatar preview"
            width={300}
            height={300}
            className="rounded-lg object-contain max-h-[70vh]"
          />
        </div>
      </CommonDialog>
    </div>
  );
};

export default Page;
